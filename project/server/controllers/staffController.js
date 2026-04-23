import Staff from '../models/Staff.js';
import Patient from '../models/Patient.js';
import Department from '../models/Department.js';

// Get all staff with availability
export const getAllStaff = async (req, res) => {
    try {
        const { departmentId, role, status } = req.query;

        let query = {};
        if (departmentId) query.departmentId = departmentId;
        if (role) query.role = role;
        if (status) query.status = status;

        const staff = await Staff.find(query)
            .populate('departmentId', 'name code')
            .populate('assignedPatients', 'name status')
            .sort({ role: 1, name: 1 });

        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get staff by ID with assignments
export const getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id)
            .populate('departmentId')
            .populate('assignedPatients');

        if (!staff) return res.status(404).json({ message: 'Staff not found' });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Assign staff to patient
export const assignStaffToPatient = async (req, res) => {
    const { staffId, patientId, role } = req.body;

    try {
        const staff = await Staff.findById(staffId);
        const patient = await Patient.findById(patientId);

        if (!staff || !patient) {
            return res.status(404).json({ message: 'Staff or patient not found' });
        }

        // Check capacity
        if (staff.assignedPatients.length >= staff.maxCapacity) {
            return res.status(400).json({ message: 'Staff at maximum capacity' });
        }

        // Add to staff assignments
        if (!staff.assignedPatients.includes(patientId)) {
            staff.assignedPatients.push(patientId);
            staff.status = staff.assignedPatients.length >= staff.maxCapacity ? 'Busy' : 'Available';
            await staff.save();
        }

        // Add to patient care team
        const existingMember = patient.careTeam.find(m => m.staffId.toString() === staffId);
        if (!existingMember) {
            patient.careTeam.push({
                staffId: staff._id,
                role: role || staff.role,
                assignedDate: new Date()
            });
            await patient.save();
        }

        // Real-time update
        const io = req.app.get('io');
        io.emit('staff:assignment', { staffId, patientId, role });

        res.json({ message: 'Assignment successful', staff, patient });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update staff status
export const updateStaffStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) return res.status(404).json({ message: 'Staff not found' });

        staff.status = status;
        await staff.save();

        // Real-time update
        const io = req.app.get('io');
        io.emit('staff:status', { staffId: staff._id, status });

        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get staff capacity by department
export const getStaffCapacity = async (req, res) => {
    try {
        const departments = await Department.find();
        const capacityData = [];

        for (const dept of departments) {
            const staff = await Staff.find({ departmentId: dept._id });
            const available = staff.filter(s => s.status === 'Available').length;
            const busy = staff.filter(s => s.status === 'Busy').length;
            const offDuty = staff.filter(s => s.status === 'Off-Duty').length;

            const totalPatients = staff.reduce((sum, s) => sum + s.assignedPatients.length, 0);
            const avgRatio = staff.length > 0 ? (totalPatients / staff.length).toFixed(1) : 0;

            capacityData.push({
                department: dept.name,
                departmentId: dept._id,
                total: staff.length,
                available,
                busy,
                offDuty,
                patientToStaffRatio: avgRatio,
                status: avgRatio > 8 ? 'Critical' : avgRatio > 6 ? 'High' : 'Normal'
            });
        }

        res.json(capacityData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remove staff assignment
export const removeStaffAssignment = async (req, res) => {
    const { staffId, patientId } = req.body;

    try {
        const staff = await Staff.findById(staffId);
        const patient = await Patient.findById(patientId);

        if (!staff || !patient) {
            return res.status(404).json({ message: 'Staff or patient not found' });
        }

        // Remove from staff assignments
        staff.assignedPatients = staff.assignedPatients.filter(p => p.toString() !== patientId);
        staff.status = staff.assignedPatients.length >= staff.maxCapacity ? 'Busy' : 'Available';
        await staff.save();

        // Remove from patient care team
        patient.careTeam = patient.careTeam.filter(m => m.staffId.toString() !== staffId);
        await patient.save();

        res.json({ message: 'Assignment removed', staff, patient });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
