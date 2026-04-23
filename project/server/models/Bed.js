import mongoose from 'mongoose';

const BedSchema = new mongoose.Schema({
    bedNumber: { type: String, required: true, unique: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    floor: { type: Number, required: true },
    wing: { type: String, default: 'Main' }, // Main, East, West, North, South
    bedType: {
        type: String,
        enum: ['ICU', 'General', 'Isolation', 'Emergency', 'Pediatric'],
        required: true
    },
    status: {
        type: String,
        enum: ['Occupied', 'Available', 'Cleaning', 'Maintenance'],
        default: 'Available'
    },
    currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    occupancyHistory: [{
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
        admitTime: { type: Date },
        dischargeTime: { type: Date },
        lengthOfStay: { type: Number } // in hours
    }],
    equipment: [{ type: String }], // ['Monitor', 'Ventilator', 'IV Pump']
    lastCleaned: { type: Date },
    lastMaintenance: { type: Date }
}, { timestamps: true });

export default mongoose.model('Bed', BedSchema);
