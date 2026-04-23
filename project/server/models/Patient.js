import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    diagnosis: { type: String, required: true },
    room: { type: String, required: true },
    admissionDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Stable', 'Moderate', 'Critical'],
        default: 'Stable'
    },
    vitals: {
        heartRate: { type: Number, default: 0 },
        bloodPressure: { type: String, default: '120/80' },
        spO2: { type: Number, default: 98 },
        temperature: { type: Number, default: 36.5 },
        respiratoryRate: { type: Number, default: 16 }
    },
    // NEW: Bed and Department Assignment
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },

    // NEW: Care Team
    careTeam: [{
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
        role: { type: String }, // 'Attending', 'Nurse', 'Specialist'
        assignedDate: { type: Date, default: Date.now }
    }],

    // NEW: Lab Results Reference (stored in LabResult collection)
    recentLabs: [{
        testName: { type: String },
        value: { type: mongoose.Schema.Types.Mixed },
        isAbnormal: { type: Boolean },
        timestamp: { type: Date }
    }],

    // NEW: Medications Reference (stored in Medication collection)
    activeMedications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medication' }],

    // NEW: Clinical Notes
    notes: [{
        content: { type: String, required: true },
        author: { type: String, default: 'Dr. AI' }, // Ideally linked to Staff
        timestamp: { type: Date, default: Date.now }
    }],

    history: [{
        timestamp: { type: Date, default: Date.now },
        type: { type: String }, // Explicit definition to avoid keyword collision
        data: mongoose.Schema.Types.Mixed
    }],

    // NEW: Enhanced AI Analysis with Multi-Signal Risk
    aiAnalysis: {
        riskScore: { type: Number, default: 0 },
        lastUpdated: { type: Date },
        summary: { type: String },
        riskFactors: {
            sepsisScore: { type: Number, default: 0 },
            deteriorationIndex: { type: Number, default: 0 },
            fallRisk: { type: Number, default: 0 },
            earlyWarningScore: { type: Number, default: 0 }
        },
        predictions: [{
            type: { type: String }, // 'Sepsis', 'Deterioration', 'Readmission'
            probability: { type: Number },
            confidence: { type: Number },
            timestamp: { type: Date }
        }]
    },

    // NEW: Transfer History
    transfers: [{
        fromBed: { type: String },
        toBed: { type: String },
        fromDepartment: { type: String },
        toDepartment: { type: String },
        reason: { type: String },
        timestamp: { type: Date }
    }],

    // Patient Demographics
    bloodType: { type: String },
    allergies: [{ type: String }],
    emergencyContact: {
        name: { type: String },
        relationship: { type: String },
        phone: { type: String }
    },
    insuranceInfo: {
        provider: { type: String },
        policyNumber: { type: String }
    }
});

export default mongoose.model('Patient', PatientSchema);
