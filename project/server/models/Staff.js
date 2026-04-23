import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
        type: String,
        enum: ['Doctor', 'Nurse', 'Specialist', 'Technician', 'Paramedic'],
        required: true
    },
    specialization: { type: String }, // Cardiology, Neurology, etc.
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    status: {
        type: String,
        enum: ['Available', 'Busy', 'Off-Duty', 'Break', 'Emergency'],
        default: 'Available'
    },
    currentShift: {
        start: { type: Date },
        end: { type: Date },
        breakTime: { type: Date }
    },
    assignedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
    maxCapacity: { type: Number, default: 8 }, // Max patients per staff
    certifications: [{ type: String }], // ['BLS', 'ACLS', 'PALS']
    contactNumber: { type: String },
    yearsOfExperience: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Staff', StaffSchema);
