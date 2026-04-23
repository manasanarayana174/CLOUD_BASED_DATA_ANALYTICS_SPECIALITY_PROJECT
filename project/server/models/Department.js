import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }, // ICU, Emergency, Cardiology, General Ward, Pediatrics
    code: { type: String, required: true, unique: true }, // ICU, ER, CARD, GEN, PED
    floor: { type: Number, required: true },
    wing: { type: String, default: 'Main' },
    totalBeds: { type: Number, required: true },
    availableBeds: { type: Number, required: true },
    occupancyRate: { type: Number, default: 0 }, // Percentage
    staffOnDuty: { type: Number, default: 0 },
    avgWaitTime: { type: Number, default: 0 }, // in minutes
    currentLoad: {
        type: String,
        enum: ['Low', 'Normal', 'High', 'Critical'],
        default: 'Normal'
    },
    equipment: [{
        name: { type: String },
        total: { type: Number },
        available: { type: Number }
    }],
    specialties: [{ type: String }], // ['Cardiac Care', 'Trauma', 'Pediatric']
    headOfDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    contactExtension: { type: String }
}, { timestamps: true });

// Virtual for occupied beds
DepartmentSchema.virtual('occupiedBeds').get(function () {
    return this.totalBeds - this.availableBeds;
});

export default mongoose.model('Department', DepartmentSchema);
