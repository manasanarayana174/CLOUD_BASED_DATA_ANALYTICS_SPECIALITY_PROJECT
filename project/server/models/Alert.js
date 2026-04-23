import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // Optional for operational alerts
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        required: true
    },
    message: { type: String, required: true },
    type: { type: String, default: 'Vitals' }, // Vitals, AI_Prediction, System, Operational, Equipment

    // NEW: Alert Category
    category: {
        type: String,
        enum: ['Patient', 'Operational', 'Equipment', 'Capacity', 'Staff'],
        default: 'Patient'
    },

    // NEW: Correlation and Context
    correlatedAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
    context: {
        departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
        equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }
    },

    // NEW: Escalation and Assignment
    escalationLevel: { type: Number, default: 1 }, // 1-5, higher = more urgent
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },

    // NEW: Resolution Tracking
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    acknowledgedAt: { type: Date },
    resolved: { type: Boolean, default: false },
    resolution: {
        action: { type: String },
        outcome: { type: String },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
        resolvedAt: { type: Date }
    },

    // NEW: Predictive Alerts
    predictive: { type: Boolean, default: false }, // AI-generated warning
    confidence: { type: Number }, // 0-100 for AI predictions

    timestamp: { type: Date, default: Date.now },
    expiresAt: { type: Date } // Auto-expire old alerts
});

export default mongoose.model('Alert', AlertSchema);
