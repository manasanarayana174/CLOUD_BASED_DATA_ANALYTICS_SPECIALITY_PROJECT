import mongoose from 'mongoose';

const EquipmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ['Ventilator', 'Monitor', 'Infusion Pump', 'Defibrillator', 'X-Ray', 'ECG', 'Ultrasound', 'Other'],
        required: true
    },
    serialNumber: { type: String, required: true, unique: true },
    manufacturer: { type: String },
    model: { type: String },
    location: {
        departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
        room: { type: String }
    },
    status: {
        type: String,
        enum: ['Available', 'In Use', 'Maintenance', 'Faulty', 'Reserved'],
        default: 'Available'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // Current patient using it
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    maintenanceInterval: { type: Number, default: 90 }, // days
    usageHours: { type: Number, default: 0 },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    notes: { type: String }
}, { timestamps: true });

export default mongoose.model('Equipment', EquipmentSchema);
