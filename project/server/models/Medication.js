import mongoose from 'mongoose';

const MedicationSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    drugName: { type: String, required: true },
    genericName: { type: String },
    dosage: { type: String, required: true }, // "500mg", "10ml"
    route: {
        type: String,
        enum: ['Oral', 'IV', 'IM', 'Subcutaneous', 'Topical', 'Inhalation', 'Rectal'],
        required: true
    },
    frequency: { type: String, required: true }, // "Every 6 hours", "BID", "TID", "PRN"
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    indication: { type: String }, // Reason for medication
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Discontinued', 'On Hold'],
        default: 'Active'
    },
    administrationLog: [{
        timestamp: { type: Date },
        administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
        dose: { type: String },
        notes: { type: String },
        missed: { type: Boolean, default: false }
    }],
    sideEffects: [{ type: String }],
    allergies: [{ type: String }],
    notes: { type: String }
}, { timestamps: true });

// Index for efficient querying
MedicationSchema.index({ patientId: 1, status: 1 });

export default mongoose.model('Medication', MedicationSchema);
