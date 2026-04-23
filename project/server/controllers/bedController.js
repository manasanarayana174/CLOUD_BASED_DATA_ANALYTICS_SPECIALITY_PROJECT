import Bed from '../models/Bed.js';
import Patient from '../models/Patient.js';
import Department from '../models/Department.js';

// Get all beds with occupancy status
export const getAllBeds = async (req, res) => {
    try {
        const beds = await Bed.find()
            .populate('currentPatientId', 'name status diagnosis')
            .populate('departmentId', 'name code')
            .sort({ floor: 1, wing: 1, bedNumber: 1 });
        res.json(beds);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get bed by ID
export const getBedById = async (req, res) => {
    try {
        const bed = await Bed.findById(req.params.id)
            .populate('currentPatientId')
            .populate('departmentId')
            .populate('occupancyHistory.patientId', 'name');

        if (!bed) return res.status(404).json({ message: 'Bed not found' });
        res.json(bed);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Transfer patient between beds
export const transferPatient = async (req, res) => {
    const { patientId, fromBedId, toBedId, reason } = req.body;

    try {
        const patient = await Patient.findById(patientId);
        const fromBed = fromBedId ? await Bed.findById(fromBedId) : null;
        const toBed = await Bed.findById(toBedId);

        if (!patient || !toBed) {
            return res.status(404).json({ message: 'Patient or bed not found' });
        }

        // Update old bed if exists
        if (fromBed) {
            fromBed.status = 'Cleaning';
            fromBed.currentPatientId = null;
            fromBed.occupancyHistory.push({
                patientId: patient._id,
                admitTime: patient.bedAssignedAt || patient.admissionDate,
                dischargeTime: new Date(),
                lengthOfStay: Math.floor((new Date() - (patient.bedAssignedAt || patient.admissionDate)) / (1000 * 60 * 60))
            });
            await fromBed.save();
        }

        // Update new bed
        toBed.status = 'Occupied';
        toBed.currentPatientId = patient._id;
        await toBed.save();

        // Update patient
        patient.bedId = toBed._id;
        patient.room = toBed.bedNumber;
        patient.departmentId = toBed.departmentId;
        patient.bedAssignedAt = new Date();

        // Add to transfer history
        patient.transfers.push({
            fromBed: fromBed?.bedNumber || 'N/A',
            toBed: toBed.bedNumber,
            fromDepartment: fromBed?.departmentId?.toString() || 'N/A',
            toDepartment: toBed.departmentId.toString(),
            reason: reason || 'Transfer',
            timestamp: new Date()
        });

        await patient.save();

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('bed:transfer', { patientId, fromBedId, toBedId });

        res.json({ message: 'Transfer successful', patient, toBed });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update bed status
export const updateBedStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const bed = await Bed.findById(req.params.id);
        if (!bed) return res.status(404).json({ message: 'Bed not found' });

        bed.status = status;
        if (status === 'Cleaning') {
            bed.lastCleaned = new Date();
        }

        await bed.save();

        // Real-time update
        const io = req.app.get('io');
        io.emit('bed:status', { bedId: bed._id, status });

        res.json(bed);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get occupancy heatmap data
export const getOccupancyHeatmap = async (req, res) => {
    try {
        const departments = await Department.find();
        const heatmapData = [];

        for (const dept of departments) {
            const beds = await Bed.find({ departmentId: dept._id });
            const occupied = beds.filter(b => b.status === 'Occupied').length;
            const total = beds.length;
            const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

            heatmapData.push({
                department: dept.name,
                departmentId: dept._id,
                occupied,
                total,
                available: total - occupied,
                occupancyRate: Math.round(occupancyRate),
                status: occupancyRate > 90 ? 'Critical' : occupancyRate > 75 ? 'High' : 'Normal'
            });
        }

        res.json(heatmapData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
