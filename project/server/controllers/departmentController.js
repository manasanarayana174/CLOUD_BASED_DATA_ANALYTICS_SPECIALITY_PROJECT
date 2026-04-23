import Department from '../models/Department.js';
import Bed from '../models/Bed.js';
import Staff from '../models/Staff.js';
import Patient from '../models/Patient.js';
import { detectOperationalBottleneck } from '../ai/engine.js';

// Get all departments
export const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find()
            .populate('headOfDepartment', 'name role')
            .sort({ name: 1 });
        res.json(departments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get department analytics
export const getDepartmentAnalytics = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: 'Department not found' });

        // Get beds
        const beds = await Bed.find({ departmentId: department._id });
        const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
        const availableBeds = beds.filter(b => b.status === 'Available').length;
        const cleaningBeds = beds.filter(b => b.status === 'Cleaning').length;

        // Get staff
        const staff = await Staff.find({ departmentId: department._id });
        const availableStaff = staff.filter(s => s.status === 'Available').length;

        // Get patients
        const patients = await Patient.find({ departmentId: department._id });
        const criticalPatients = patients.filter(p => p.status === 'Critical').length;

        // Calculate metrics
        const occupancyRate = beds.length > 0 ? (occupiedBeds / beds.length) * 100 : 0;
        const patientToStaffRatio = staff.length > 0 ? (patients.length / staff.length).toFixed(1) : 0;

        const analytics = {
            department: department.name,
            beds: {
                total: beds.length,
                occupied: occupiedBeds,
                available: availableBeds,
                cleaning: cleaningBeds,
                occupancyRate: Math.round(occupancyRate)
            },
            staff: {
                total: staff.length,
                available: availableStaff,
                busy: staff.length - availableStaff,
                patientToStaffRatio
            },
            patients: {
                total: patients.length,
                critical: criticalPatients,
                stable: patients.filter(p => p.status === 'Stable').length,
                moderate: patients.filter(p => p.status === 'Moderate').length
            },
            currentLoad: occupancyRate > 90 ? 'Critical' :
                occupancyRate > 75 ? 'High' :
                    occupancyRate > 50 ? 'Normal' : 'Low'
        };

        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get department capacity status
export const getDepartmentCapacity = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: 'Department not found' });

        const beds = await Bed.find({ departmentId: department._id });
        const staff = await Staff.find({ departmentId: department._id });
        const patients = await Patient.find({ departmentId: department._id });

        const capacity = {
            department: department.name,
            bedCapacity: {
                total: beds.length,
                available: beds.filter(b => b.status === 'Available').length,
                occupancyRate: beds.length > 0 ? Math.round((beds.filter(b => b.status === 'Occupied').length / beds.length) * 100) : 0
            },
            staffCapacity: {
                total: staff.length,
                available: staff.filter(s => s.status === 'Available').length,
                utilizationRate: staff.length > 0 ? Math.round((staff.filter(s => s.status === 'Busy').length / staff.length) * 100) : 0
            },
            patientLoad: {
                total: patients.length,
                critical: patients.filter(p => p.status === 'Critical').length
            },
            status: department.currentLoad
        };

        res.json(capacity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Detect bottlenecks across all departments
export const getBottlenecks = async (req, res) => {
    try {
        const departments = await Department.find();
        const allBottlenecks = [];

        for (const dept of departments) {
            const beds = await Bed.find({ departmentId: dept._id });
            const staff = await Staff.find({ departmentId: dept._id });
            const patients = await Patient.find({ departmentId: dept._id });

            const bedData = {
                total: beds.length,
                occupied: beds.filter(b => b.status === 'Occupied').length
            };

            const staffData = {
                available: staff.filter(s => s.status === 'Available').length
            };

            const bottlenecks = detectOperationalBottleneck(bedData, staffData, patients, dept.name);

            if (bottlenecks.length > 0) {
                allBottlenecks.push({
                    department: dept.name,
                    departmentId: dept._id,
                    bottlenecks
                });
            }
        }

        res.json(allBottlenecks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update department
export const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!department) return res.status(404).json({ message: 'Department not found' });
        res.json(department);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
