import Patient from '../models/Patient.js';
import Department from '../models/Department.js';
import Bed from '../models/Bed.js';
import Staff from '../models/Staff.js';
import Alert from '../models/Alert.js';
import { forecastCapacity } from '../ai/engine.js';

// Get hospital-wide overview
export const getHospitalOverview = async (req, res) => {
    try {
        const patients = await Patient.find();
        const departments = await Department.find();
        const beds = await Bed.find();
        const staff = await Staff.find();
        const alerts = await Alert.find({ acknowledged: false });

        const overview = {
            patients: {
                total: patients.length,
                critical: patients.filter(p => p.status === 'Critical').length,
                moderate: patients.filter(p => p.status === 'Moderate').length,
                stable: patients.filter(p => p.status === 'Stable').length,
                avgRiskScore: patients.reduce((sum, p) => sum + (p.aiAnalysis?.riskScore || 0), 0) / patients.length || 0
            },
            beds: {
                total: beds.length,
                occupied: beds.filter(b => b.status === 'Occupied').length,
                available: beds.filter(b => b.status === 'Available').length,
                cleaning: beds.filter(b => b.status === 'Cleaning').length,
                occupancyRate: beds.length > 0 ? (beds.filter(b => b.status === 'Occupied').length / beds.length) * 100 : 0
            },
            staff: {
                total: staff.length,
                available: staff.filter(s => s.status === 'Available').length,
                busy: staff.filter(s => s.status === 'Busy').length,
                offDuty: staff.filter(s => s.status === 'Off-Duty').length,
                avgPatientLoad: staff.length > 0 ? patients.length / staff.length : 0
            },
            alerts: {
                total: alerts.length,
                critical: alerts.filter(a => a.severity === 'Critical').length,
                high: alerts.filter(a => a.severity === 'High').length,
                medium: alerts.filter(a => a.severity === 'Medium').length
            },
            departments: departments.length,
            systemLoad: beds.length > 0 && (beds.filter(b => b.status === 'Occupied').length / beds.length) > 0.9 ? 'Critical' :
                (beds.filter(b => b.status === 'Occupied').length / beds.length) > 0.75 ? 'High' : 'Normal'
        };

        res.json(overview);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get patient flow trends
export const getPatientFlow = async (req, res) => {
    const { days = 7 } = req.query;

    try {
        const cutoff = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

        const patients = await Patient.find({
            admissionDate: { $gte: cutoff }
        }).sort({ admissionDate: 1 });

        // Group by day
        const flowData = {};
        patients.forEach(p => {
            const day = p.admissionDate.toISOString().split('T')[0];
            if (!flowData[day]) {
                flowData[day] = { admissions: 0, date: day };
            }
            flowData[day].admissions++;
        });

        const flow = Object.values(flowData).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            period: `${days} days`,
            totalAdmissions: patients.length,
            avgPerDay: patients.length / parseInt(days),
            dailyFlow: flow
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get risk distribution
export const getRiskDistribution = async (req, res) => {
    try {
        const patients = await Patient.find();

        const distribution = {
            low: patients.filter(p => (p.aiAnalysis?.riskScore || 0) < 30).length,
            moderate: patients.filter(p => (p.aiAnalysis?.riskScore || 0) >= 30 && (p.aiAnalysis?.riskScore || 0) < 60).length,
            high: patients.filter(p => (p.aiAnalysis?.riskScore || 0) >= 60 && (p.aiAnalysis?.riskScore || 0) < 80).length,
            critical: patients.filter(p => (p.aiAnalysis?.riskScore || 0) >= 80).length
        };

        const histogram = [];
        for (let i = 0; i < 100; i += 10) {
            const count = patients.filter(p => {
                const score = p.aiAnalysis?.riskScore || 0;
                return score >= i && score < i + 10;
            }).length;
            histogram.push({ range: `${i}-${i + 9}`, count });
        }

        res.json({
            total: patients.length,
            distribution,
            histogram
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get capacity forecast
export const getCapacityForecast = async (req, res) => {
    try {
        const beds = await Bed.find();
        const patients = await Patient.find();

        // Calculate admission/discharge rates (simplified - last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentAdmissions = patients.filter(p => p.admissionDate >= oneDayAgo).length;

        // Estimate discharge rate (simplified)
        const avgLengthOfStay = 5; // days
        const dischargeRate = patients.length / avgLengthOfStay / 24; // per hour
        const admissionRate = recentAdmissions / 24; // per hour

        const currentOccupancy = beds.filter(b => b.status === 'Occupied').length;
        const totalBeds = beds.length;

        const forecast = forecastCapacity(admissionRate, dischargeRate, currentOccupancy, totalBeds);

        res.json(forecast);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get department performance metrics
export const getDepartmentPerformance = async (req, res) => {
    try {
        const departments = await Department.find();
        const performance = [];

        for (const dept of departments) {
            const patients = await Patient.find({ departmentId: dept._id });
            const beds = await Bed.find({ departmentId: dept._id });
            const staff = await Staff.find({ departmentId: dept._id });

            // Calculate avg length of stay
            const completedStays = beds.flatMap(b => b.occupancyHistory.filter(h => h.dischargeTime));
            const avgLOS = completedStays.length > 0
                ? completedStays.reduce((sum, h) => sum + (h.lengthOfStay || 0), 0) / completedStays.length
                : 0;

            performance.push({
                department: dept.name,
                departmentId: dept._id,
                currentPatients: patients.length,
                occupancyRate: beds.length > 0 ? (beds.filter(b => b.status === 'Occupied').length / beds.length) * 100 : 0,
                avgLengthOfStay: Math.round(avgLOS),
                staffCount: staff.length,
                patientToStaffRatio: staff.length > 0 ? (patients.length / staff.length).toFixed(1) : 0
            });
        }

        res.json(performance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
