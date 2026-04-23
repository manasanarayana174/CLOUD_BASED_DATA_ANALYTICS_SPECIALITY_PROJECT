import mongoose from 'mongoose';

const LabResultSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    testName: { type: String, required: true }, // CBC, CRP, Troponin, Lactate, etc.
    category: {
        type: String,
        enum: ['Hematology', 'Chemistry', 'Microbiology', 'Immunology', 'Pathology', 'Radiology'],
        required: true
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be number or string
    unit: { type: String }, // mg/dL, mmol/L, cells/μL
    referenceRange: {
        min: { type: Number },
        max: { type: Number },
        text: { type: String } // For non-numeric ranges like "Negative"
    },
    isAbnormal: { type: Boolean, default: false },
    severity: {
        type: String,
        enum: ['Normal', 'Borderline', 'Abnormal', 'Critical'],
        default: 'Normal'
    },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    performedBy: { type: String }, // Lab technician name
    timestamp: { type: Date, default: Date.now },
    notes: { type: String },
    flagged: { type: Boolean, default: false } // For critical results requiring immediate attention
}, { timestamps: true });

// Index for efficient querying
LabResultSchema.index({ patientId: 1, timestamp: -1 });
LabResultSchema.index({ isAbnormal: 1, severity: 1 });

export default mongoose.model('LabResult', LabResultSchema);
