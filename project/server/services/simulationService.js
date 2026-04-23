import Patient from '../models/Patient.js';
import Alert from '../models/Alert.js';
import Bed from '../models/Bed.js';
import Department from '../models/Department.js';

/**
 * Real-Time Hospital Simulation Service
 * Simulates live hospital operations with dynamic patient vitals updates
 */

class SimulationService {
    constructor(io) {
        this.io = io;
        this.isRunning = false;
        this.intervals = [];
    }

    /**
     * Start the simulation
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Simulation already running');
            return;
        }

        console.log('🚀 Starting Hospital Simulation...');
        this.isRunning = true;

        // Update vitals every 30 seconds
        const vitalsInterval = setInterval(() => this.updatePatientVitals(), 30000);
        this.intervals.push(vitalsInterval);

        // Generate random events every 2 minutes
        const eventsInterval = setInterval(() => this.generateRandomEvents(), 120000);
        this.intervals.push(eventsInterval);

        // Simulate admissions/discharges every 5 minutes
        const admissionInterval = setInterval(() => this.simulateAdmissionDischarge(), 300000);
        this.intervals.push(admissionInterval);

        console.log('✅ Simulation started successfully');
    }

    /**
     * Stop the simulation
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Simulation not running');
            return;
        }

        console.log('🛑 Stopping Hospital Simulation...');
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        this.isRunning = false;
        console.log('✅ Simulation stopped');
    }

    /**
     * Update patient vitals with realistic variations
     */
    async updatePatientVitals() {
        try {
            const patients = await Patient.find({ status: { $ne: 'Discharged' } });

            for (const patient of patients) {
                const vitals = patient.vitals;

                // Simulate realistic vital changes
                const changes = this.calculateVitalChanges(patient);

                // Apply changes
                vitals.heartRate = Math.max(40, Math.min(180, vitals.heartRate + changes.hr));
                vitals.spO2 = Math.max(75, Math.min(100, vitals.spO2 + changes.spo2));
                vitals.temperature = Math.max(35.0, Math.min(41.0, vitals.temperature + changes.temp));
                vitals.respiratoryRate = Math.max(8, Math.min(40, vitals.respiratoryRate + changes.rr));

                // Update blood pressure
                if (changes.bp) {
                    vitals.bloodPressure = changes.bp;
                }

                patient.vitals = vitals;
                await patient.save();

                // Check for critical vitals and create alerts
                await this.checkCriticalVitals(patient);
            }

            // Emit update to all connected clients
            this.io.emit('vitals_updated', {
                timestamp: new Date(),
                message: 'Patient vitals updated'
            });

            console.log(`📊 Updated vitals for ${patients.length} patients`);
        } catch (error) {
            console.error('❌ Error updating vitals:', error);
        }
    }

    /**
     * Calculate realistic vital sign changes based on patient condition
     */
    calculateVitalChanges(patient) {
        const severity = patient.status;
        let changes = {
            hr: 0,
            spo2: 0,
            temp: 0,
            rr: 0,
            bp: null
        };

        // Base variation ranges by severity
        const ranges = {
            'Critical': { hr: [-5, 5], spo2: [-2, 1], temp: [-0.3, 0.3], rr: [-3, 3] },
            'Moderate': { hr: [-3, 3], spo2: [-1, 1], temp: [-0.2, 0.2], rr: [-2, 2] },
            'Stable': { hr: [-2, 2], spo2: [0, 1], temp: [-0.1, 0.1], rr: [-1, 1] }
        };

        const range = ranges[severity] || ranges['Stable'];

        // Random changes within range
        changes.hr = Math.floor(Math.random() * (range.hr[1] - range.hr[0] + 1)) + range.hr[0];
        changes.spo2 = Math.floor(Math.random() * (range.spo2[1] - range.spo2[0] + 1)) + range.spo2[0];
        changes.temp = parseFloat((Math.random() * (range.temp[1] - range.temp[0]) + range.temp[0]).toFixed(1));
        changes.rr = Math.floor(Math.random() * (range.rr[1] - range.rr[0] + 1)) + range.rr[0];

        // Occasionally update blood pressure
        if (Math.random() < 0.3) {
            const currentBP = patient.vitals.bloodPressure.split('/');
            const systolic = parseInt(currentBP[0]);
            const diastolic = parseInt(currentBP[1]);

            const sysChange = Math.floor(Math.random() * 11) - 5; // -5 to +5
            const diaChange = Math.floor(Math.random() * 7) - 3; // -3 to +3

            changes.bp = `${Math.max(70, Math.min(200, systolic + sysChange))}/${Math.max(40, Math.min(120, diastolic + diaChange))}`;
        }

        return changes;
    }

    /**
     * Check for critical vitals and create alerts
     */
    async checkCriticalVitals(patient) {
        const vitals = patient.vitals;
        const alerts = [];

        // Critical SpO2
        if (vitals.spO2 < 90) {
            alerts.push({
                patientId: patient._id,
                severity: vitals.spO2 < 85 ? 'Critical' : 'High',
                message: `${patient.name}: Low SpO2 (${vitals.spO2}%)`,
                type: 'Vitals',
                category: 'Patient'
            });
        }

        // Critical Heart Rate
        if (vitals.heartRate > 120 || vitals.heartRate < 50) {
            alerts.push({
                patientId: patient._id,
                severity: 'High',
                message: `${patient.name}: Abnormal Heart Rate (${vitals.heartRate} bpm)`,
                type: 'Vitals',
                category: 'Patient'
            });
        }

        // Critical Temperature
        if (vitals.temperature > 39.0 || vitals.temperature < 36.0) {
            alerts.push({
                patientId: patient._id,
                severity: vitals.temperature > 40.0 ? 'Critical' : 'High',
                message: `${patient.name}: Abnormal Temperature (${vitals.temperature}°C)`,
                type: 'Vitals',
                category: 'Patient'
            });
        }

        // Save alerts
        if (alerts.length > 0) {
            await Alert.insertMany(alerts);
            this.io.emit('new_alerts', alerts);
        }
    }

    /**
     * Generate random medical events
     */
    async generateRandomEvents() {
        try {
            const patients = await Patient.find({ status: { $ne: 'Discharged' } });

            // 20% chance of a random event
            if (Math.random() < 0.2 && patients.length > 0) {
                const randomPatient = patients[Math.floor(Math.random() * patients.length)];

                const events = [
                    { type: 'improvement', message: 'Condition improving', severityChange: -1 },
                    { type: 'deterioration', message: 'Condition worsening', severityChange: 1 },
                    { type: 'stable', message: 'Condition stabilized', severityChange: 0 }
                ];

                const event = events[Math.floor(Math.random() * events.length)];

                // Update patient status if needed
                if (event.severityChange !== 0) {
                    const severityLevels = ['Stable', 'Moderate', 'Critical'];
                    const currentIndex = severityLevels.indexOf(randomPatient.status);
                    const newIndex = Math.max(0, Math.min(2, currentIndex + event.severityChange));
                    randomPatient.status = severityLevels[newIndex];
                    await randomPatient.save();
                }

                // Create alert
                const alert = await Alert.create({
                    patientId: randomPatient._id,
                    severity: 'Info',
                    message: `${randomPatient.name}: ${event.message}`,
                    type: 'Clinical_Update',
                    category: 'Patient'
                });

                this.io.emit('patient_event', {
                    patient: randomPatient,
                    event: event,
                    alert: alert
                });

                console.log(`🔔 Random event: ${randomPatient.name} - ${event.message}`);
            }
        } catch (error) {
            console.error('❌ Error generating random events:', error);
        }
    }

    /**
     * Simulate patient admissions and discharges
     */
    async simulateAdmissionDischarge() {
        try {
            const patients = await Patient.find();
            const departments = await Department.find();

            // 30% chance of discharge for stable patients
            const stablePatients = patients.filter(p => p.status === 'Stable');
            if (stablePatients.length > 0 && Math.random() < 0.3) {
                const dischargePatient = stablePatients[Math.floor(Math.random() * stablePatients.length)];

                // Free up the bed
                if (dischargePatient.bedId) {
                    await Bed.findByIdAndUpdate(dischargePatient.bedId, {
                        status: 'Available',
                        currentPatientId: null
                    });
                }

                dischargePatient.status = 'Discharged';
                await dischargePatient.save();

                this.io.emit('patient_discharged', {
                    patient: dischargePatient,
                    timestamp: new Date()
                });

                console.log(`👋 Patient discharged: ${dischargePatient.name}`);
            }

            // Note: New admissions would require the patient generator
            // For now, we'll just handle discharges

        } catch (error) {
            console.error('❌ Error in admission/discharge simulation:', error);
        }
    }
}

export default SimulationService;
