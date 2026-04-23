// Patient Data Generator - Creates realistic patient profiles

const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
    'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
    'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa'
];

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
];

const conditions = [
    // Critical Conditions
    { name: 'Pneumonia', severity: 'Moderate', dept: 'GEN', vitals: { hr: [85, 105], bp: '115/75', spo2: [92, 96], temp: [37.5, 38.5], rr: [18, 24] } },
    { name: 'Sepsis', severity: 'Critical', dept: 'ICU', vitals: { hr: [110, 130], bp: '85/55', spo2: [88, 92], temp: [38.5, 39.5], rr: [22, 28] } },
    { name: 'COPD Exacerbation', severity: 'Moderate', dept: 'GEN', vitals: { hr: [88, 98], bp: '135/85', spo2: [90, 94], temp: [36.8, 37.5], rr: [20, 26] } },
    { name: 'Heart Failure', severity: 'Moderate', dept: 'CARD', vitals: { hr: [75, 95], bp: '105/65', spo2: [93, 96], temp: [36.5, 37.2], rr: [18, 22] } },
    { name: 'Stroke (Ischemic)', severity: 'Critical', dept: 'ICU', vitals: { hr: [85, 100], bp: '160/95', spo2: [94, 97], temp: [37.0, 37.8], rr: [16, 20] } },
    { name: 'Myocardial Infarction', severity: 'Critical', dept: 'ICU', vitals: { hr: [95, 115], bp: '90/60', spo2: [91, 95], temp: [37.0, 37.5], rr: [18, 22] } },
    { name: 'Diabetic Ketoacidosis', severity: 'Critical', dept: 'ICU', vitals: { hr: [100, 120], bp: '100/65', spo2: [95, 98], temp: [37.2, 38.0], rr: [20, 26] } },
    { name: 'Acute Kidney Injury', severity: 'Moderate', dept: 'GEN', vitals: { hr: [80, 95], bp: '145/90', spo2: [95, 98], temp: [37.0, 37.8], rr: [16, 20] } },
    { name: 'Post-Op Cardiac Surgery', severity: 'Moderate', dept: 'CARD', vitals: { hr: [75, 90], bp: '125/80', spo2: [96, 99], temp: [37.5, 38.2], rr: [16, 20] } },
    { name: 'Gastroenteritis', severity: 'Stable', dept: 'GEN', vitals: { hr: [75, 88], bp: '115/75', spo2: [97, 99], temp: [37.0, 37.8], rr: [14, 18] } },
    { name: 'Asthma Exacerbation', severity: 'Moderate', dept: 'PED', vitals: { hr: [85, 100], bp: '105/68', spo2: [94, 97], temp: [36.8, 37.5], rr: [20, 26] } },
    { name: 'Appendicitis (Post-Op)', severity: 'Stable', dept: 'GEN', vitals: { hr: [70, 85], bp: '120/78', spo2: [97, 99], temp: [37.2, 38.0], rr: [14, 18] } },
    { name: 'Fracture (Femur)', severity: 'Stable', dept: 'GEN', vitals: { hr: [72, 88], bp: '125/82', spo2: [97, 99], temp: [36.8, 37.5], rr: [14, 18] } },
    { name: 'UTI with Sepsis', severity: 'Critical', dept: 'ICU', vitals: { hr: [105, 125], bp: '88/58', spo2: [90, 94], temp: [38.5, 39.5], rr: [20, 26] } },
    { name: 'Cellulitis', severity: 'Stable', dept: 'GEN', vitals: { hr: [75, 88], bp: '122/80', spo2: [97, 99], temp: [37.5, 38.5], rr: [14, 18] } },
    { name: 'Chest Pain (Unstable Angina)', severity: 'Moderate', dept: 'CARD', vitals: { hr: [85, 100], bp: '140/88', spo2: [95, 98], temp: [36.8, 37.5], rr: [16, 20] } },

    // Additional Respiratory Conditions
    { name: 'Pulmonary Embolism', severity: 'Critical', dept: 'ICU', vitals: { hr: [105, 125], bp: '95/60', spo2: [88, 92], temp: [37.0, 37.8], rr: [24, 30] } },
    { name: 'Acute Respiratory Distress', severity: 'Critical', dept: 'ICU', vitals: { hr: [110, 130], bp: '90/55', spo2: [85, 90], temp: [37.5, 38.5], rr: [26, 32] } },
    { name: 'Bronchitis', severity: 'Stable', dept: 'GEN', vitals: { hr: [75, 90], bp: '120/78', spo2: [95, 98], temp: [37.2, 38.0], rr: [16, 20] } },

    // Neurological Conditions
    { name: 'Seizure Disorder', severity: 'Moderate', dept: 'GEN', vitals: { hr: [80, 100], bp: '130/85', spo2: [94, 97], temp: [37.0, 37.8], rr: [16, 20] } },
    { name: 'Meningitis', severity: 'Critical', dept: 'ICU', vitals: { hr: [100, 120], bp: '100/65', spo2: [93, 96], temp: [38.5, 39.8], rr: [20, 26] } },
    { name: 'Traumatic Brain Injury', severity: 'Critical', dept: 'ICU', vitals: { hr: [90, 110], bp: '150/90', spo2: [94, 97], temp: [37.0, 38.0], rr: [18, 24] } },

    // Gastrointestinal Conditions
    { name: 'Pancreatitis (Acute)', severity: 'Moderate', dept: 'GEN', vitals: { hr: [85, 105], bp: '110/70', spo2: [95, 98], temp: [37.5, 38.5], rr: [18, 22] } },
    { name: 'GI Bleeding', severity: 'Critical', dept: 'ICU', vitals: { hr: [105, 125], bp: '85/55', spo2: [91, 95], temp: [36.5, 37.5], rr: [20, 26] } },
    { name: 'Bowel Obstruction', severity: 'Moderate', dept: 'GEN', vitals: { hr: [85, 100], bp: '125/80', spo2: [95, 98], temp: [37.2, 38.0], rr: [18, 22] } },

    // Surgical/Post-Op Conditions
    { name: 'Post-Op Abdominal Surgery', severity: 'Stable', dept: 'GEN', vitals: { hr: [70, 85], bp: '118/75', spo2: [96, 99], temp: [37.0, 38.0], rr: [14, 18] } },
    { name: 'Post-Op Hip Replacement', severity: 'Stable', dept: 'GEN', vitals: { hr: [68, 82], bp: '125/80', spo2: [97, 99], temp: [36.8, 37.5], rr: [14, 18] } },

    // Pediatric Conditions
    { name: 'Croup', severity: 'Moderate', dept: 'PED', vitals: { hr: [90, 110], bp: '95/60', spo2: [93, 96], temp: [37.5, 38.5], rr: [22, 28] } },
    { name: 'Dehydration (Pediatric)', severity: 'Moderate', dept: 'PED', vitals: { hr: [95, 115], bp: '90/55', spo2: [96, 99], temp: [37.0, 38.0], rr: [20, 26] } },

    // Other Common Conditions
    { name: 'Hypertensive Crisis', severity: 'Critical', dept: 'ICU', vitals: { hr: [90, 110], bp: '180/110', spo2: [95, 98], temp: [37.0, 37.5], rr: [18, 22] } }
];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const allergies = [
    [], ['Penicillin'], ['Sulfa drugs'], ['Aspirin'], ['Latex'],
    ['Penicillin', 'Sulfa drugs'], ['Iodine'], []
];

export const generatePatient = (index, departments, beds) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    const age = condition.severity === 'Critical' ?
        Math.floor(Math.random() * 40) + 45 : // 45-85 for critical
        Math.floor(Math.random() * 60) + 20;  // 20-80 for others

    const gender = Math.random() > 0.5 ? 'Male' : 'Female';

    // Generate vitals within condition range
    const hr = Array.isArray(condition.vitals.hr) ?
        Math.floor(Math.random() * (condition.vitals.hr[1] - condition.vitals.hr[0])) + condition.vitals.hr[0] :
        condition.vitals.hr;

    const spo2 = Array.isArray(condition.vitals.spo2) ?
        Math.floor(Math.random() * (condition.vitals.spo2[1] - condition.vitals.spo2[0])) + condition.vitals.spo2[0] :
        condition.vitals.spo2;

    const temp = Array.isArray(condition.vitals.temp) ?
        (Math.random() * (condition.vitals.temp[1] - condition.vitals.temp[0]) + condition.vitals.temp[0]).toFixed(1) :
        condition.vitals.temp;

    const rr = Array.isArray(condition.vitals.rr) ?
        Math.floor(Math.random() * (condition.vitals.rr[1] - condition.vitals.rr[0])) + condition.vitals.rr[0] :
        condition.vitals.rr;

    // Find department
    const dept = departments.find(d => d.code === condition.dept);

    // Find available bed in department
    const availableBeds = beds.filter(b =>
        b.departmentId.toString() === dept._id.toString() &&
        b.status === 'Available'
    );

    const assignedBed = availableBeds.length > 0 ?
        availableBeds[Math.floor(Math.random() * availableBeds.length)] :
        null;

    return {
        name: `${firstName} ${lastName}`,
        age,
        gender,
        diagnosis: condition.name,
        room: assignedBed ? assignedBed.bedNumber : `${condition.dept}-${String(index).padStart(3, '0')}`,
        status: condition.severity,
        vitals: {
            heartRate: hr,
            bloodPressure: condition.vitals.bp,
            spO2: spo2,
            temperature: parseFloat(temp),
            respiratoryRate: rr
        },
        bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
        allergies: allergies[Math.floor(Math.random() * allergies.length)],
        departmentId: dept._id,
        bedId: assignedBed ? assignedBed._id : null,
        admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random within last 7 days
    };
};

export const generateLabResults = (patientId, condition) => {
    const labs = [];
    const now = new Date();

    // Common labs for all patients
    labs.push({
        patientId,
        testName: 'WBC',
        category: 'Hematology',
        value: condition.includes('Sepsis') ? Math.random() * 10 + 15 : Math.random() * 7 + 4,
        unit: 'K/μL',
        referenceRange: { min: 4, max: 11 },
        timestamp: new Date(now - Math.random() * 24 * 60 * 60 * 1000)
    });

    labs.push({
        patientId,
        testName: 'Hemoglobin',
        category: 'Hematology',
        value: Math.random() * 4 + 11,
        unit: 'g/dL',
        referenceRange: { min: 12, max: 16 },
        timestamp: new Date(now - Math.random() * 24 * 60 * 60 * 1000)
    });

    // Condition-specific labs
    if (condition.includes('Sepsis') || condition.includes('Pneumonia')) {
        labs.push({
            patientId,
            testName: 'CRP',
            category: 'Chemistry',
            value: Math.random() * 150 + 50,
            unit: 'mg/L',
            referenceRange: { min: 0, max: 10 },
            timestamp: new Date(now - Math.random() * 12 * 60 * 60 * 1000)
        });

        labs.push({
            patientId,
            testName: 'Lactate',
            category: 'Chemistry',
            value: Math.random() * 3 + 1,
            unit: 'mmol/L',
            referenceRange: { min: 0.5, max: 2.2 },
            timestamp: new Date(now - Math.random() * 6 * 60 * 60 * 1000)
        });
    }

    if (condition.includes('MI') || condition.includes('Cardiac')) {
        labs.push({
            patientId,
            testName: 'Troponin I',
            category: 'Chemistry',
            value: condition.includes('MI') ? Math.random() * 15 + 5 : Math.random() * 0.04,
            unit: 'ng/mL',
            referenceRange: { min: 0, max: 0.04 },
            timestamp: new Date(now - Math.random() * 6 * 60 * 60 * 1000)
        });
    }

    if (condition.includes('Kidney')) {
        labs.push({
            patientId,
            testName: 'Creatinine',
            category: 'Chemistry',
            value: Math.random() * 3 + 1.5,
            unit: 'mg/dL',
            referenceRange: { min: 0.6, max: 1.2 },
            timestamp: new Date(now - Math.random() * 12 * 60 * 60 * 1000)
        });
    }

    // Mark abnormal
    labs.forEach(lab => {
        if (lab.referenceRange) {
            const { min, max } = lab.referenceRange;
            lab.isAbnormal = lab.value < min || lab.value > max;

            if (lab.isAbnormal) {
                const deviation = Math.max(
                    Math.abs(lab.value - min) / min,
                    Math.abs(lab.value - max) / max
                );

                if (deviation > 0.5) lab.severity = 'Critical';
                else if (deviation > 0.25) lab.severity = 'Abnormal';
                else lab.severity = 'Borderline';
            } else {
                lab.severity = 'Normal';
            }
        }
    });

    return labs;
};

export const generateMedications = (patientId, condition, staff) => {
    const meds = [];
    const doctor = staff.find(s => s.role === 'Doctor');

    if (condition.includes('Sepsis') || condition.includes('Pneumonia')) {
        meds.push({
            patientId,
            drugName: 'Vancomycin',
            dosage: '1g',
            route: 'IV',
            frequency: 'Every 12 hours',
            startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            prescribedBy: doctor?._id,
            status: 'Active',
            indication: condition
        });
    }

    if (condition.includes('MI') || condition.includes('Heart')) {
        meds.push({
            patientId,
            drugName: 'Aspirin',
            dosage: '325mg',
            route: 'Oral',
            frequency: 'Once daily',
            startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            prescribedBy: doctor?._id,
            status: 'Active',
            indication: condition
        });
    }

    // Pain management for most patients
    if (!condition.includes('Gastro')) {
        meds.push({
            patientId,
            drugName: 'Acetaminophen',
            dosage: '650mg',
            route: 'Oral',
            frequency: 'Every 6 hours PRN',
            startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            prescribedBy: doctor?._id,
            status: 'Active',
            indication: 'Pain management'
        });
    }

    return meds;
};
