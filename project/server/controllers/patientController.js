import Patient from '../models/Patient.js';
import Alert from '../models/Alert.js';
import LabResult from '../models/LabResult.js';
import Medication from '../models/Medication.js';
import { analyzeVitals, correlateMultipleSignals, calculateEarlyWarningScore, detectSepsisRisk, predictDeterioration } from '../ai/engine.js';

export const getPatients = async (req, res) => {
    try {
        const patients = await Patient.find()
            .populate('bedId', 'bedNumber floor wing')
            .populate('departmentId', 'name code')
            .populate('careTeam.staffId', 'name role')
            .sort({ admissionDate: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('bedId')
            .populate('departmentId')
            .populate('careTeam.staffId', 'name role specialization')
            .populate('activeMedications');

        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// NEW: Get high-risk patients
export const getHighRiskPatients = async (req, res) => {
    const { threshold = 60 } = req.query;

    try {
        const patients = await Patient.find({
            'aiAnalysis.riskScore': { $gte: parseInt(threshold) }
        })
            .populate('bedId', 'bedNumber')
            .populate('departmentId', 'name')
            .sort({ 'aiAnalysis.riskScore': -1 })
            .limit(20);

        res.json(patients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// NEW: Get patient timeline (vitals, labs, meds, notes)
export const getPatientTimeline = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const labs = await LabResult.find({ patientId: req.params.id }).sort({ timestamp: -1 }).limit(20);
        const medications = await Medication.find({ patientId: req.params.id, status: 'Active' });

        const timeline = [
            ...patient.history.map(h => ({ ...h.toObject(), source: 'history' })),
            ...labs.map(l => ({ type: 'lab', data: l, timestamp: l.timestamp, source: 'lab' })),
            ...patient.transfers.map(t => ({ type: 'transfer', data: t, timestamp: t.timestamp, source: 'transfer' }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            patient: {
                name: patient.name,
                diagnosis: patient.diagnosis,
                status: patient.status
            },
            timeline: timeline.slice(0, 50), // Last 50 events
            activeMedications: medications
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createPatient = async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        await newPatient.save();
        res.status(201).json(newPatient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const updateVitals = async (req, res) => {
    const { id } = req.params;
    const newVitals = req.body;

    try {
        const patient = await Patient.findById(id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // Update Vitals
        patient.vitals = { ...patient.vitals, ...newVitals };

        // Get recent labs for correlation
        const labs = await LabResult.find({ patientId: id }).sort({ timestamp: -1 }).limit(10);
        const medications = await Medication.find({ patientId: id, status: 'Active' });

        // Run Enhanced AI Analysis with Multi-Signal Correlation
        const basicAnalysis = analyzeVitals(patient.vitals);
        const correlation = correlateMultipleSignals(patient, labs, medications);
        const ews = calculateEarlyWarningScore(patient.vitals);
        const sepsisRisk = detectSepsisRisk(patient.vitals, labs);

        // Get vitals trend for deterioration prediction
        const vitalsTrend = patient.history
            .filter(h => h.type === 'vitals')
            .map(h => h.data)
            .slice(-5);

        const deterioration = predictDeterioration(vitalsTrend, labs);

        // Update AI Analysis
        patient.aiAnalysis.riskScore = correlation.overallRisk;
        patient.aiAnalysis.lastUpdated = new Date();
        patient.aiAnalysis.riskFactors.earlyWarningScore = ews;
        patient.aiAnalysis.riskFactors.sepsisScore = sepsisRisk.score;
        patient.aiAnalysis.riskFactors.deteriorationIndex = deterioration.score;
        patient.status = basicAnalysis.status;

        // Add predictions
        if (sepsisRisk.score > 50) {
            patient.aiAnalysis.predictions.push({
                type: 'Sepsis',
                probability: sepsisRisk.score,
                confidence: 75,
                timestamp: new Date()
            });
        }

        if (deterioration.score > 50) {
            patient.aiAnalysis.predictions.push({
                type: 'Deterioration',
                probability: deterioration.score,
                confidence: deterioration.confidence,
                timestamp: new Date()
            });
        }

        // Push context to history
        patient.history.push({
            type: 'vitals',
            data: newVitals
        });

        await patient.save();

        // Generate Alerts if Critical
        if (correlation.correlations.length > 0) {
            const io = req.app.get('io');

            for (const corr of correlation.correlations) {
                const severity = corr.severity === 'Critical' ? 'Critical' : 'High';
                const alert = new Alert({
                    patientId: patient._id,
                    severity,
                    message: `${patient.name}: ${corr.type} - ${corr.signals.join(', ')}`,
                    type: 'AI_Prediction',
                    category: 'Patient',
                    predictive: true,
                    confidence: 80
                });
                await alert.save();

                // Real-time Push
                io.emit('alert:new', {
                    ...alert.toObject(),
                    patientName: patient.name
                });
            }
        }

        res.json(patient);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// NEW: Get patient vitals history for charting
export const getVitalsHistory = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // Extract vitals from history
        const vitalsHistory = patient.history
            .filter(h => h.type === 'vitals')
            .map(h => {
                const data = { ...h.data };
                // Parse BP for charts
                if (data.bloodPressure && typeof data.bloodPressure === 'string') {
                    const [sys, dia] = data.bloodPressure.split('/');
                    data.systolic = parseInt(sys);
                    data.diastolic = parseInt(dia);
                }
                return {
                    timestamp: h.timestamp,
                    ...data
                };
            })
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Add current vitals as latest data point
        vitalsHistory.push({
            timestamp: new Date(),
            ...patient.vitals
        });

        res.json({
            patientId: patient._id,
            patientName: patient.name,
            vitalsHistory
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



export const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const patient = await Patient.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        res.json(patient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


export const addPatientNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, author } = req.body;

        if (!content) return res.status(400).json({ message: 'Note content is required' });

        const newNote = {
            content,
            author: author || 'Dr. AI',
            timestamp: new Date()
        };

        const historyItem = {
            type: 'note',
            timestamp: new Date(),
            data: newNote
        };

        // Use findByIdAndUpdate for atomic update and to avoid full document validation issues on legacy data
        const patient = await Patient.findByIdAndUpdate(
            id,
            {
                $push: {
                    notes: newNote,
                    history: historyItem
                }
            },
            { new: true } // Return updated doc
        );

        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        res.status(201).json(patient.notes);
    } catch (err) {
        console.error("Error adding note:", err);
        res.status(500).json({ message: err.message, detailed: err.toString() });
    }
};

// NEW: Add Medication
export const addMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const { drugName, dosage, frequency, route, prescribedBy } = req.body;

        if (!drugName || !dosage) return res.status(400).json({ message: 'Drug name and dosage are required' });

        const patient = await Patient.findById(id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // For now, if prescribedBy isn't provided (or valid ObjectId), we might need a workaround or lookup
        // Assuming prescribedBy is passed as a valid ObjectId string from frontend, or we find a default staff.
        // For MVP, if it fails validation, we might need to be flexible.
        // However, MedicationSchema requires it.
        // Let's try to find a default doctor if none provided.
        let staffId = prescribedBy;
        if (!staffId) {
            const Staff = (await import('../models/Staff.js')).default;
            const defaultDoc = await Staff.findOne({ role: 'Doctor' });
            if (defaultDoc) staffId = defaultDoc._id;
        }

        const newMedication = new Medication({
            patientId: id,
            drugName,
            dosage,
            frequency,
            route,
            prescribedBy: staffId,
            startDate: new Date(),
            status: 'Active'
        });

        await newMedication.save();

        // Atomic update to patient
        await Patient.findByIdAndUpdate(id, {
            $push: {
                activeMedications: newMedication._id,
                history: {
                    type: 'medication',
                    timestamp: new Date(),
                    data: {
                        action: 'Prescribed',
                        drugName,
                        dosage
                    }
                }
            }
        });

        res.status(201).json(newMedication);
    } catch (err) {
        console.error("Error adding medication:", err);
        res.status(500).json({ message: err.message });
    }
};

export const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // Free bed
        if (patient.bedId) {
            const Bed = (await import('../models/Bed.js')).default;
            await Bed.findByIdAndUpdate(patient.bedId, {
                status: 'Available',
                patientId: null
            });
        }

        // Delete related data (Optional but good for cleanup)
        await Medication.deleteMany({ patientId: id });
        await Alert.deleteMany({ patientId: id });

        // Delete patient
        await Patient.findByIdAndDelete(id);

        res.json({ message: 'Patient deleted successfully' });
    } catch (err) {
        console.error("Error deleting patient:", err);
        res.status(500).json({ message: err.message });
    }
};

export const dischargePatient = async (req, res) => {
    try {
        const { id } = req.params;

        // First find to check bed assignment (needed for Bed update logic)
        const currentPatient = await Patient.findById(id);
        if (!currentPatient) return res.status(404).json({ message: 'Patient not found' });

        // Free up the bed if assigned
        if (currentPatient.bedId) {
            const Bed = (await import('../models/Bed.js')).default;
            await Bed.findByIdAndUpdate(currentPatient.bedId, {
                status: 'Available',
                patientId: null
            });
        }

        const historyItem = {
            type: 'transfer',
            timestamp: new Date(),
            data: { event: 'Discharged', from: currentPatient.departmentId }
        };

        // Atomic update for patient
        const patient = await Patient.findByIdAndUpdate(
            id,
            {
                $set: {
                    status: 'Discharged',
                    bedId: null,
                    room: 'Discharged',
                    dischargeDate: new Date()
                },
                $push: {
                    history: historyItem
                }
            },
            { new: true }
        );

        res.json(patient);
    } catch (err) {
        console.error("Error discharging patient:", err);
        res.status(500).json({ message: err.message });
    }
};

export const deleteMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const medication = await Medication.findById(id);
        if (!medication) return res.status(404).json({ message: 'Medication not found' });

        await Medication.findByIdAndDelete(id);

        // Remove reference from patient
        await Patient.findByIdAndUpdate(medication.patientId, {
            $pull: { activeMedications: id }
        });

        res.json({ message: 'Medication deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePatientNote = async (req, res) => {
    try {
        const { id, noteId } = req.params;
        const patient = await Patient.findByIdAndUpdate(
            id,
            { $pull: { notes: { _id: noteId } } },
            { new: true }
        );
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        res.json(patient.notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
