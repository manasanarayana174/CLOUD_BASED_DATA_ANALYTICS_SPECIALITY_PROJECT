import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './models/Patient.js';
import Alert from './models/Alert.js';
import Department from './models/Department.js';
import Bed from './models/Bed.js';
import Staff from './models/Staff.js';
import Equipment from './models/Equipment.js';
import LabResult from './models/LabResult.js';
import Medication from './models/Medication.js';
import { generatePatient, generateLabResults, generateMedications } from './utils/patientGenerator.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_dashboard';

// ==================== DEPARTMENTS ====================
const departments = [
    { name: 'Intensive Care Unit', code: 'ICU', floor: 3, wing: 'North', totalBeds: 20, availableBeds: 16, staffOnDuty: 12, currentLoad: 'Normal', specialties: ['Critical Care', 'Cardiac Care'] },
    { name: 'Emergency Department', code: 'ER', floor: 1, wing: 'Main', totalBeds: 25, availableBeds: 25, staffOnDuty: 15, currentLoad: 'Normal', specialties: ['Emergency Medicine', 'Trauma'] },
    { name: 'Cardiology', code: 'CARD', floor: 4, wing: 'East', totalBeds: 18, availableBeds: 17, staffOnDuty: 10, currentLoad: 'Normal', specialties: ['Cardiac Care', 'Interventional Cardiology'] },
    { name: 'General Ward', code: 'GEN', floor: 2, wing: 'South', totalBeds: 30, availableBeds: 26, staffOnDuty: 14, currentLoad: 'Normal', specialties: ['General Medicine'] },
    { name: 'Pediatrics', code: 'PED', floor: 2, wing: 'West', totalBeds: 15, availableBeds: 14, staffOnDuty: 8, currentLoad: 'Low', specialties: ['Pediatric Care'] }
];

// ==================== STAFF ====================
const staffMembers = [
    // ICU Staff
    { name: 'Dr. Sarah Johnson', email: 'sarah.j@hospital.com', role: 'Doctor', specialization: 'Critical Care', departmentId: null, status: 'Available', maxCapacity: 6, certifications: ['ACLS', 'BLS'], yearsOfExperience: 12 },
    { name: 'Dr. Michael Chen', email: 'michael.c@hospital.com', role: 'Doctor', specialization: 'Cardiology', departmentId: null, status: 'Busy', maxCapacity: 6, certifications: ['ACLS', 'BLS'], yearsOfExperience: 15 },
    { name: 'Nurse Emily Davis', email: 'emily.d@hospital.com', role: 'Nurse', specialization: 'ICU', departmentId: null, status: 'Available', maxCapacity: 4, certifications: ['BLS', 'ACLS'], yearsOfExperience: 8 },
    { name: 'Nurse James Wilson', email: 'james.w@hospital.com', role: 'Nurse', specialization: 'ICU', departmentId: null, status: 'Busy', maxCapacity: 4, certifications: ['BLS', 'ACLS'], yearsOfExperience: 6 },

    // ER Staff
    { name: 'Dr. Amanda Rodriguez', email: 'amanda.r@hospital.com', role: 'Doctor', specialization: 'Emergency Medicine', departmentId: null, status: 'Available', maxCapacity: 8, certifications: ['ATLS', 'ACLS', 'BLS'], yearsOfExperience: 10 },
    { name: 'Nurse Robert Taylor', email: 'robert.t@hospital.com', role: 'Nurse', specialization: 'Emergency', departmentId: null, status: 'Available', maxCapacity: 5, certifications: ['BLS', 'ACLS', 'PALS'], yearsOfExperience: 7 },
    { name: 'Nurse Lisa Martinez', email: 'lisa.m@hospital.com', role: 'Nurse', specialization: 'Emergency', departmentId: null, status: 'Busy', maxCapacity: 5, certifications: ['BLS', 'ACLS'], yearsOfExperience: 5 },

    // Cardiology Staff
    { name: 'Dr. David Kim', email: 'david.k@hospital.com', role: 'Specialist', specialization: 'Interventional Cardiology', departmentId: null, status: 'Available', maxCapacity: 6, certifications: ['ACLS', 'BLS'], yearsOfExperience: 18 },
    { name: 'Nurse Jennifer Lee', email: 'jennifer.l@hospital.com', role: 'Nurse', specialization: 'Cardiac', departmentId: null, status: 'Available', maxCapacity: 4, certifications: ['BLS', 'ACLS'], yearsOfExperience: 9 },

    // General Ward Staff
    { name: 'Dr. Patricia Brown', email: 'patricia.b@hospital.com', role: 'Doctor', specialization: 'Internal Medicine', departmentId: null, status: 'Available', maxCapacity: 10, certifications: ['BLS', 'ACLS'], yearsOfExperience: 14 },
    { name: 'Nurse Kevin Anderson', email: 'kevin.a@hospital.com', role: 'Nurse', specialization: 'General', departmentId: null, status: 'Available', maxCapacity: 6, certifications: ['BLS'], yearsOfExperience: 4 },
    { name: 'Nurse Maria Garcia', email: 'maria.g@hospital.com', role: 'Nurse', specialization: 'General', departmentId: null, status: 'Busy', maxCapacity: 6, certifications: ['BLS'], yearsOfExperience: 6 },

    // Pediatrics Staff
    { name: 'Dr. Rachel Thompson', email: 'rachel.t@hospital.com', role: 'Doctor', specialization: 'Pediatrics', departmentId: null, status: 'Available', maxCapacity: 8, certifications: ['PALS', 'BLS'], yearsOfExperience: 11 },
    { name: 'Nurse Daniel White', email: 'daniel.w@hospital.com', role: 'Nurse', specialization: 'Pediatric', departmentId: null, status: 'Available', maxCapacity: 5, certifications: ['BLS', 'PALS'], yearsOfExperience: 5 }
];

// ==================== EQUIPMENT ====================
const equipment = [
    { name: 'Ventilator-01', type: 'Ventilator', serialNumber: 'VENT-2024-001', status: 'In Use', location: {}, lastMaintenance: new Date('2024-01-15'), nextMaintenance: new Date('2024-04-15') },
    { name: 'Ventilator-02', type: 'Ventilator', serialNumber: 'VENT-2024-002', status: 'Available', location: {}, lastMaintenance: new Date('2024-02-01'), nextMaintenance: new Date('2024-05-01') },
    { name: 'Cardiac Monitor-01', type: 'Monitor', serialNumber: 'MON-2024-001', status: 'In Use', location: {}, lastMaintenance: new Date('2024-01-20'), nextMaintenance: new Date('2024-04-20') },
    { name: 'Cardiac Monitor-02', type: 'Monitor', serialNumber: 'MON-2024-002', status: 'Available', location: {}, lastMaintenance: new Date('2024-02-05'), nextMaintenance: new Date('2024-05-05') },
    { name: 'Infusion Pump-01', type: 'Infusion Pump', serialNumber: 'PUMP-2024-001', status: 'In Use', location: {}, lastMaintenance: new Date('2024-01-10'), nextMaintenance: new Date('2024-04-10') },
    { name: 'Infusion Pump-02', type: 'Infusion Pump', serialNumber: 'PUMP-2024-002', status: 'Available', location: {}, lastMaintenance: new Date('2024-02-10'), nextMaintenance: new Date('2024-05-10') },
    { name: 'Defibrillator-01', type: 'Defibrillator', serialNumber: 'DEFIB-2024-001', status: 'Available', location: {}, lastMaintenance: new Date('2024-01-25'), nextMaintenance: new Date('2024-04-25') },
    { name: 'ECG Machine-01', type: 'ECG', serialNumber: 'ECG-2024-001', status: 'Available', location: {}, lastMaintenance: new Date('2024-02-01'), nextMaintenance: new Date('2024-05-01') }
];

// ==================== SEEDING FUNCTION ====================
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB for Seeding');

        // Clear existing data
        await Patient.deleteMany({});
        await Alert.deleteMany({});
        await Department.deleteMany({});
        await Bed.deleteMany({});
        await Staff.deleteMany({});
        await Equipment.deleteMany({});
        await LabResult.deleteMany({});
        await Medication.deleteMany({});

        console.log('🗑️  Cleared existing data');

        // Create Departments
        const createdDepartments = await Department.insertMany(departments);
        console.log(`✅ Created ${createdDepartments.length} departments`);

        // Create Beds
        const beds = [];
        createdDepartments.forEach((dept, deptIndex) => {
            for (let i = 1; i <= dept.totalBeds; i++) {
                beds.push({
                    bedNumber: `${dept.code}-${String(i).padStart(3, '0')}`,
                    departmentId: dept._id,
                    floor: dept.floor,
                    wing: dept.wing,
                    bedType: dept.code === 'ICU' ? 'ICU' : dept.code === 'ER' ? 'Emergency' : dept.code === 'PED' ? 'Pediatric' : 'General',
                    status: 'Available', // Will be updated to Occupied when patients are assigned
                    equipment: dept.code === 'ICU' ? ['Monitor', 'IV Pump'] : []
                });
            }
        });
        const createdBeds = await Bed.insertMany(beds);
        console.log(`✅ Created ${createdBeds.length} beds`);

        // Assign departments to staff
        staffMembers[0].departmentId = createdDepartments[0]._id; // ICU
        staffMembers[1].departmentId = createdDepartments[0]._id;
        staffMembers[2].departmentId = createdDepartments[0]._id;
        staffMembers[3].departmentId = createdDepartments[0]._id;
        staffMembers[4].departmentId = createdDepartments[1]._id; // ER
        staffMembers[5].departmentId = createdDepartments[1]._id;
        staffMembers[6].departmentId = createdDepartments[1]._id;
        staffMembers[7].departmentId = createdDepartments[2]._id; // Cardiology
        staffMembers[8].departmentId = createdDepartments[2]._id;
        staffMembers[9].departmentId = createdDepartments[3]._id; // General
        staffMembers[10].departmentId = createdDepartments[3]._id;
        staffMembers[11].departmentId = createdDepartments[3]._id;
        staffMembers[12].departmentId = createdDepartments[4]._id; // Pediatrics
        staffMembers[13].departmentId = createdDepartments[4]._id;

        const createdStaff = await Staff.insertMany(staffMembers);
        console.log(`✅ Created ${createdStaff.length} staff members`);

        // Generate 45 realistic patients using the generator
        const patientCount = 45;
        const generatedPatients = [];

        for (let i = 0; i < patientCount; i++) {
            const patient = generatePatient(i + 1, createdDepartments, createdBeds);
            generatedPatients.push(patient);
        }

        const createdPatients = await Patient.insertMany(generatedPatients);
        console.log(`✅ Created ${createdPatients.length} patients`);

        // Update bed occupancy
        for (const patient of createdPatients) {
            if (patient.bedId) {
                await Bed.findByIdAndUpdate(patient.bedId, {
                    status: 'Occupied',
                    currentPatientId: patient._id
                });
            }
        }

        // Create Lab Results for all patients using generator
        const allLabResults = [];
        createdPatients.forEach(patient => {
            const labs = generateLabResults(patient._id, patient.diagnosis);
            allLabResults.push(...labs);
        });

        await LabResult.insertMany(allLabResults);
        console.log(`✅ Created ${allLabResults.length} lab results`);

        // Create Medications for all patients using generator
        const allMedications = [];
        createdPatients.forEach(patient => {
            const meds = generateMedications(patient._id, patient.diagnosis, createdStaff);
            allMedications.push(...meds);
        });

        await Medication.insertMany(allMedications);
        console.log(`✅ Created ${allMedications.length} medications`);

        // Create Equipment and assign to ICU patients
        const icuPatients = createdPatients.filter(p => p.departmentId.toString() === createdDepartments[0]._id.toString());
        if (icuPatients.length > 0) {
            equipment[0].location.departmentId = createdDepartments[0]._id;
            equipment[0].assignedTo = icuPatients[0]._id;
        }
        if (icuPatients.length > 1) {
            equipment[2].location.departmentId = createdDepartments[0]._id;
            equipment[2].assignedTo = icuPatients[1]._id;
        }
        if (icuPatients.length > 0) {
            equipment[4].location.departmentId = createdDepartments[0]._id;
            equipment[4].assignedTo = icuPatients[0]._id;
        }

        const createdEquipment = await Equipment.insertMany(equipment);
        console.log(`✅ Created ${createdEquipment.length} equipment items`);

        // Create Alerts for critical patients
        const alerts = [];
        const criticalPatients = createdPatients.filter(p => p.status === 'Critical');

        criticalPatients.slice(0, 5).forEach(patient => {
            if (patient.diagnosis.includes('Sepsis')) {
                alerts.push({
                    patientId: patient._id,
                    severity: 'Critical',
                    message: `${patient.name}: Sepsis Risk - High Lactate, Hypotension, Fever`,
                    type: 'AI_Prediction',
                    category: 'Patient',
                    predictive: true,
                    confidence: 85
                });
            }

            if (patient.diagnosis.includes('MI') || patient.diagnosis.includes('Myocardial')) {
                alerts.push({
                    patientId: patient._id,
                    severity: 'Critical',
                    message: `${patient.name}: Cardiac Event Risk - Elevated Troponin, HR: ${patient.vitals.heartRate}`,
                    type: 'AI_Prediction',
                    category: 'Patient',
                    predictive: true,
                    confidence: 90
                });
            }

            if (patient.vitals.spO2 < 90) {
                alerts.push({
                    patientId: patient._id,
                    severity: 'Critical',
                    message: `${patient.name}: Critical Hypoxia (SpO2 ${patient.vitals.spO2}%)`,
                    type: 'Vitals',
                    category: 'Patient'
                });
            }
        });

        await Alert.insertMany(alerts);
        console.log(`✅ Created ${alerts.length} alerts`);

        console.log('\n🎉 Database Seeded Successfully!');
        console.log('📊 Summary:');
        console.log(`   - ${createdDepartments.length} Departments`);
        console.log(`   - ${createdBeds.length} Beds`);
        console.log(`   - ${createdStaff.length} Staff Members`);
        console.log(`   - ${createdPatients.length} Patients`);
        console.log(`   - ${allLabResults.length} Lab Results`);
        console.log(`   - ${allMedications.length} Medications`);
        console.log(`   - ${createdEquipment.length} Equipment Items`);
        console.log(`   - ${alerts.length} Alerts`);

        process.exit();
    })
    .catch(err => {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    });
