import Patient from '../models/Patient.js';
import Staff from '../models/Staff.js';
import Alert from '../models/Alert.js';
import Bed from '../models/Bed.js';

export const getSystemStats = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const criticalPatients = await Patient.countDocuments({ status: 'Critical' });
        const activeStaff = await Staff.countDocuments({ status: 'Active' });
        const totalBeds = await Bed.countDocuments();
        const occupiedBeds = await Bed.countDocuments({ status: 'Occupied' });

        // Calculate recent alert volume (last 24h)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const recentAlerts = await Alert.countDocuments({ timestamp: { $gte: yesterday } });

        res.json({
            patients: { total: totalPatients, critical: criticalPatients },
            staff: { active: activeStaff },
            capacity: { total: totalBeds, occupied: occupiedBeds, percentage: Math.round((occupiedBeds / totalBeds) * 100) || 0 },
            alerts: { recent: recentAlerts }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const staff = await Staff.find().sort({ name: 1 });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
