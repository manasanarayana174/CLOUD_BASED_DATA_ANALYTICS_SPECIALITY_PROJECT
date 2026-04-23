import Equipment from '../models/Equipment.js';
import Department from '../models/Department.js';

// Get all equipment
export const getAllEquipment = async (req, res) => {
    try {
        const { type, status, departmentId } = req.query;

        let query = {};
        if (type) query.type = type;
        if (status) query.status = status;
        if (departmentId) query['location.departmentId'] = departmentId;

        const equipment = await Equipment.find(query)
            .populate('location.departmentId', 'name')
            .populate('assignedTo', 'name')
            .sort({ type: 1, name: 1 });

        res.json(equipment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get available equipment by type
export const getAvailableEquipment = async (req, res) => {
    const { type } = req.query;

    try {
        let query = { status: 'Available' };
        if (type) query.type = type;

        const equipment = await Equipment.find(query)
            .populate('location.departmentId', 'name');

        res.json(equipment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Assign equipment to patient
export const assignEquipment = async (req, res) => {
    const { patientId, bedId, departmentId } = req.body;

    try {
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        if (equipment.status !== 'Available') {
            return res.status(400).json({ message: 'Equipment not available' });
        }

        equipment.status = 'In Use';
        equipment.assignedTo = patientId;
        equipment.location.bedId = bedId;
        equipment.location.departmentId = departmentId;
        equipment.usageHours += 1; // Increment usage

        await equipment.save();

        // Real-time update
        const io = req.app.get('io');
        io.emit('equipment:assigned', { equipmentId: equipment._id, patientId });

        res.json(equipment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Release equipment
export const releaseEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        equipment.status = 'Available';
        equipment.assignedTo = null;

        await equipment.save();

        // Real-time update
        const io = req.app.get('io');
        io.emit('equipment:released', { equipmentId: equipment._id });

        res.json(equipment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get maintenance schedule
export const getMaintenanceSchedule = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const equipment = await Equipment.find({
            nextMaintenance: { $lte: thirtyDaysFromNow }
        }).populate('location.departmentId', 'name')
            .sort({ nextMaintenance: 1 });

        const schedule = equipment.map(e => ({
            equipment: e.name,
            type: e.type,
            serialNumber: e.serialNumber,
            location: e.location.departmentId?.name || 'Unknown',
            nextMaintenance: e.nextMaintenance,
            daysUntilMaintenance: Math.ceil((e.nextMaintenance - now) / (1000 * 60 * 60 * 24)),
            status: e.status,
            priority: Math.ceil((e.nextMaintenance - now) / (1000 * 60 * 60 * 24)) <= 7 ? 'High' : 'Normal'
        }));

        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update equipment status
export const updateEquipmentStatus = async (req, res) => {
    const { status, notes } = req.body;

    try {
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        equipment.status = status;
        if (notes) equipment.notes = notes;

        if (status === 'Maintenance') {
            equipment.lastMaintenance = new Date();
            equipment.nextMaintenance = new Date(Date.now() + equipment.maintenanceInterval * 24 * 60 * 60 * 1000);
        }

        await equipment.save();

        res.json(equipment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
