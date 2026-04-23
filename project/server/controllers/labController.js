import LabResult from '../models/LabResult.js';
import Patient from '../models/Patient.js';
import { analyzeLabTrends } from '../ai/engine.js';

// Get lab results for a patient
export const getPatientLabs = async (req, res) => {
    try {
        const labs = await LabResult.find({ patientId: req.params.patientId })
            .populate('orderedBy', 'name role')
            .sort({ timestamp: -1 });

        res.json(labs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add new lab result
export const addLabResult = async (req, res) => {
    try {
        const labResult = new LabResult(req.body);

        // Determine if abnormal
        if (labResult.referenceRange && typeof labResult.value === 'number') {
            const { min, max } = labResult.referenceRange;
            if (min !== undefined && max !== undefined) {
                labResult.isAbnormal = labResult.value < min || labResult.value > max;

                // Determine severity
                if (labResult.isAbnormal) {
                    const deviation = Math.max(
                        Math.abs(labResult.value - min) / min,
                        Math.abs(labResult.value - max) / max
                    );

                    if (deviation > 0.5) labResult.severity = 'Critical';
                    else if (deviation > 0.25) labResult.severity = 'Abnormal';
                    else labResult.severity = 'Borderline';
                }
            }
        }

        await labResult.save();

        // Update patient's recent labs
        const patient = await Patient.findById(labResult.patientId);
        if (patient) {
            patient.recentLabs.push({
                testName: labResult.testName,
                value: labResult.value,
                isAbnormal: labResult.isAbnormal,
                timestamp: labResult.timestamp
            });

            // Keep only last 10 labs
            if (patient.recentLabs.length > 10) {
                patient.recentLabs = patient.recentLabs.slice(-10);
            }

            await patient.save();
        }

        // Create alert if critical
        if (labResult.severity === 'Critical' || labResult.flagged) {
            const Alert = (await import('../models/Alert.js')).default;
            const alert = new Alert({
                patientId: labResult.patientId,
                severity: 'High',
                message: `Critical lab result: ${labResult.testName} = ${labResult.value} ${labResult.unit || ''}`,
                type: 'Lab',
                category: 'Patient'
            });
            await alert.save();

            // Real-time alert
            const io = req.app.get('io');
            io.emit('alert:new', alert);
        }

        res.status(201).json(labResult);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all abnormal lab results
export const getAbnormalLabs = async (req, res) => {
    try {
        const labs = await LabResult.find({ isAbnormal: true })
            .populate('patientId', 'name room status')
            .populate('orderedBy', 'name')
            .sort({ severity: -1, timestamp: -1 });

        res.json(labs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get lab trend analysis for a patient
export const getLabTrends = async (req, res) => {
    const { timeWindow } = req.query; // hours

    try {
        const cutoff = new Date(Date.now() - (parseInt(timeWindow) || 48) * 60 * 60 * 1000);

        const labs = await LabResult.find({
            patientId: req.params.patientId,
            timestamp: { $gte: cutoff }
        }).sort({ timestamp: 1 });

        const analysis = analyzeLabTrends(labs, parseInt(timeWindow) || 48);

        res.json({
            patientId: req.params.patientId,
            timeWindow: parseInt(timeWindow) || 48,
            totalTests: labs.length,
            ...analysis
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get critical labs requiring attention
export const getCriticalLabs = async (req, res) => {
    try {
        const labs = await LabResult.find({
            $or: [
                { severity: 'Critical' },
                { flagged: true }
            ]
        })
            .populate('patientId', 'name room status')
            .populate('orderedBy', 'name')
            .sort({ timestamp: -1 })
            .limit(50);

        res.json(labs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
