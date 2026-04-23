import express from 'express';
import { getPatients, createPatient, updateVitals, getPatientById, getHighRiskPatients, getPatientTimeline, getVitalsHistory, updatePatient, addPatientNote, dischargePatient, addMedication, deletePatient, deleteMedication, deletePatientNote } from '../controllers/patientController.js';
import { chatWithAI } from '../controllers/aiController.js';
import { registerUser, loginUser } from '../controllers/authController.js';
import { getAllBeds, getBedById, transferPatient, updateBedStatus, getOccupancyHeatmap } from '../controllers/bedController.js';
import { getAllStaff, getStaffById, assignStaffToPatient, updateStaffStatus, getStaffCapacity, removeStaffAssignment } from '../controllers/staffController.js';
import { getAllDepartments, getDepartmentAnalytics, getDepartmentCapacity, getBottlenecks, updateDepartment } from '../controllers/departmentController.js';
import { getAllEquipment, getAvailableEquipment, assignEquipment, releaseEquipment, getMaintenanceSchedule, updateEquipmentStatus } from '../controllers/equipmentController.js';
import { getPatientLabs, addLabResult, getAbnormalLabs, getLabTrends, getCriticalLabs } from '../controllers/labController.js';
import { getHospitalOverview, getPatientFlow, getRiskDistribution, getCapacityForecast, getDepartmentPerformance } from '../controllers/analyticsController.js';
import { getSystemStats, getAllUsers } from '../controllers/adminController.js';
import Alert from '../models/Alert.js';

const router = express.Router();

// ==================== Admin Routes ====================
router.get('/admin/stats', getSystemStats);
router.get('/users', getAllUsers);

// ==================== Auth Routes ====================
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

// ==================== Patient Routes ====================
// ==================== Patient Routes ====================
router.get('/patients', getPatients);
router.get('/patients/high-risk', getHighRiskPatients);
router.post('/patients', createPatient);

// Specific routes with :id parameters first
router.get('/patients/:id/timeline', getPatientTimeline);
router.get('/patients/:id/vitals-history', getVitalsHistory);
router.put('/patients/:id/vitals', updateVitals);
router.post('/patients/:id/notes', addPatientNote);
router.post('/patients/:id/medications', addMedication);
router.post('/patients/:id/discharge', dischargePatient);
router.delete('/patients/:id/notes/:noteId', deletePatientNote);
router.delete('/patients/:id', deletePatient);

// Corrected route for medication deletion (was generic id route potential conflict if not careful, but meds have unique IDs)
router.delete('/medications/:id', deleteMedication);

// Generic :id routes last
router.get('/patients/:id', getPatientById);
router.put('/patients/:id', updatePatient);

// ==================== Bed Routes ====================
router.get('/beds', getAllBeds);
router.get('/beds/occupancy/heatmap', getOccupancyHeatmap);
router.get('/beds/:id', getBedById);
router.post('/beds/transfer', transferPatient);
router.patch('/beds/:id/status', updateBedStatus);

// ==================== Staff Routes ====================
router.get('/staff', getAllStaff);
router.get('/staff/capacity', getStaffCapacity);
router.get('/staff/:id', getStaffById);
router.post('/staff/assign', assignStaffToPatient);
router.post('/staff/remove-assignment', removeStaffAssignment);
router.patch('/staff/:id/status', updateStaffStatus);

// ==================== Department Routes ====================
router.get('/departments', getAllDepartments);
router.get('/departments/bottlenecks', getBottlenecks);
router.get('/departments/:id/analytics', getDepartmentAnalytics);
router.get('/departments/:id/capacity', getDepartmentCapacity);
router.patch('/departments/:id', updateDepartment);

// ==================== Equipment Routes ====================
router.get('/equipment', getAllEquipment);
router.get('/equipment/available', getAvailableEquipment);
router.get('/equipment/maintenance', getMaintenanceSchedule);
router.patch('/equipment/:id/assign', assignEquipment);
router.patch('/equipment/:id/release', releaseEquipment);
router.patch('/equipment/:id/status', updateEquipmentStatus);

// ==================== Lab Routes ====================
router.get('/labs/patient/:patientId', getPatientLabs);
router.get('/labs/abnormal', getAbnormalLabs);
router.get('/labs/critical', getCriticalLabs);
router.get('/labs/trending/:patientId', getLabTrends);
router.post('/labs', addLabResult);

// ==================== Analytics Routes ====================
router.get('/analytics/hospital-overview', getHospitalOverview);
router.get('/analytics/patient-flow', getPatientFlow);
router.get('/analytics/risk-distribution', getRiskDistribution);
router.get('/analytics/capacity-forecast', getCapacityForecast);
router.get('/analytics/department-performance', getDepartmentPerformance);

// ==================== Alert Routes ====================
router.get('/alerts', async (req, res) => {
    try {
        const { severity, category, acknowledged } = req.query;

        let query = {};
        if (severity) query.severity = severity;
        if (category) query.category = category;
        if (acknowledged !== undefined) query.acknowledged = acknowledged === 'true';

        const alerts = await Alert.find(query)
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('patientId', 'name room status')
            .populate('assignedTo', 'name role');

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/alerts/:id/acknowledge', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        alert.acknowledged = true;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = req.body.staffId;

        await alert.save();
        res.json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== AI Routes ====================
router.post('/ai/chat', chatWithAI);

// Enhanced AI endpoints
router.get('/ai/risk-analysis/:patientId', async (req, res) => {
    try {
        const { calculateDetailedRiskScore, generateRiskExplanation } = await import('../services/aiEngine.js');
        const riskAnalysis = await calculateDetailedRiskScore(req.params.patientId);

        if (!riskAnalysis) {
            return res.status(404).json({ message: 'Unable to calculate risk' });
        }

        const explanation = generateRiskExplanation(riskAnalysis);

        res.json({
            ...riskAnalysis,
            explanation
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/ai/predictions/:patientId', async (req, res) => {
    try {
        const { predictNextEvents } = await import('../services/aiEngine.js');
        const predictions = await predictNextEvents(req.params.patientId);
        res.json(predictions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/ai/recommendations/:patientId', async (req, res) => {
    try {
        const { generateRecommendations } = await import('../services/aiEngine.js');
        const recommendations = await generateRecommendations(req.params.patientId);
        res.json(recommendations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/ai/what-if', async (req, res) => {
    try {
        const { runWhatIfScenario } = await import('../services/aiEngine.js');
        const { currentVitals, changes } = req.body;
        const result = runWhatIfScenario(currentVitals, changes);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
