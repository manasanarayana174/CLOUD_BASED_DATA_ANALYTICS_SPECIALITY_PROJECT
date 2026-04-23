import Patient from '../models/Patient.js';
import LabResult from '../models/LabResult.js';
import Medication from '../models/Medication.js';

/**
 * Enhanced AI Engine for Hospital Intelligence Platform
 * Provides detailed risk analysis, predictions, and clinical decision support
 */

/**
 * Calculate detailed risk score with breakdown
 */
export const calculateDetailedRiskScore = async (patientId) => {
    try {
        const patient = await Patient.findById(patientId);
        if (!patient) throw new Error('Patient not found');

        const labs = await LabResult.find({ patientId }).sort({ timestamp: -1 }).limit(10);
        const medications = await Medication.find({ patientId, status: 'Active' });

        const riskFactors = {
            vitals: calculateVitalsRisk(patient.vitals),
            labs: calculateLabsRisk(labs),
            diagnosis: calculateDiagnosisRisk(patient.diagnosis),
            age: calculateAgeRisk(patient.age),
            comorbidities: calculateComorbidityRisk(patient)
        };

        const overallRisk = (
            riskFactors.vitals.score * 0.35 +
            riskFactors.labs.score * 0.25 +
            riskFactors.diagnosis.score * 0.20 +
            riskFactors.age.score * 0.10 +
            riskFactors.comorbidities.score * 0.10
        );

        return {
            overallRisk: Math.round(overallRisk),
            breakdown: riskFactors,
            confidence: 85
        };
    } catch (error) {
        console.error('Error calculating detailed risk:', error);
        return null;
    }
};

/**
 * Calculate vitals-based risk
 */
const calculateVitalsRisk = (vitals) => {
    let score = 0;
    const factors = [];

    // Heart Rate
    if (vitals.heartRate > 120 || vitals.heartRate < 50) {
        score += 25;
        factors.push(`Abnormal heart rate: ${vitals.heartRate} bpm`);
    } else if (vitals.heartRate > 100 || vitals.heartRate < 60) {
        score += 10;
        factors.push(`Borderline heart rate: ${vitals.heartRate} bpm`);
    }

    // SpO2
    if (vitals.spO2 < 90) {
        score += 30;
        factors.push(`Critical hypoxia: ${vitals.spO2}%`);
    } else if (vitals.spO2 < 94) {
        score += 15;
        factors.push(`Low oxygen: ${vitals.spO2}%`);
    }

    // Temperature
    if (vitals.temperature > 39.0 || vitals.temperature < 36.0) {
        score += 20;
        factors.push(`Abnormal temperature: ${vitals.temperature}°C`);
    } else if (vitals.temperature > 38.0 || vitals.temperature < 36.5) {
        score += 10;
        factors.push(`Borderline temperature: ${vitals.temperature}°C`);
    }

    // Respiratory Rate
    if (vitals.respiratoryRate > 24 || vitals.respiratoryRate < 12) {
        score += 15;
        factors.push(`Abnormal respiratory rate: ${vitals.respiratoryRate}/min`);
    }

    // Blood Pressure
    const bp = vitals.bloodPressure.split('/');
    const systolic = parseInt(bp[0]);
    const diastolic = parseInt(bp[1]);

    if (systolic > 180 || systolic < 90 || diastolic > 110 || diastolic < 60) {
        score += 20;
        factors.push(`Critical blood pressure: ${vitals.bloodPressure}`);
    } else if (systolic > 160 || systolic < 100 || diastolic > 100 || diastolic < 65) {
        score += 10;
        factors.push(`Abnormal blood pressure: ${vitals.bloodPressure}`);
    }

    return {
        score: Math.min(100, score),
        factors,
        category: 'Vital Signs'
    };
};

/**
 * Calculate labs-based risk
 */
const calculateLabsRisk = (labs) => {
    let score = 0;
    const factors = [];

    labs.forEach(lab => {
        if (lab.isAbnormal) {
            if (lab.severity === 'Critical') {
                score += 20;
                factors.push(`Critical ${lab.testName}: ${lab.value} ${lab.unit}`);
            } else if (lab.severity === 'Abnormal') {
                score += 10;
                factors.push(`Abnormal ${lab.testName}: ${lab.value} ${lab.unit}`);
            }
        }
    });

    return {
        score: Math.min(100, score),
        factors,
        category: 'Laboratory Results'
    };
};

/**
 * Calculate diagnosis-based risk
 */
const calculateDiagnosisRisk = (diagnosis) => {
    const highRiskConditions = [
        'Sepsis', 'Myocardial Infarction', 'Stroke', 'Pulmonary Embolism',
        'ARDS', 'Meningitis', 'GI Bleeding', 'Traumatic Brain Injury',
        'Hypertensive Crisis', 'Diabetic Ketoacidosis'
    ];

    const moderateRiskConditions = [
        'Pneumonia', 'Heart Failure', 'COPD', 'Pancreatitis',
        'Kidney Injury', 'Seizure', 'Bowel Obstruction'
    ];

    let score = 0;
    const factors = [];

    if (highRiskConditions.some(cond => diagnosis.includes(cond))) {
        score = 80;
        factors.push(`High-risk diagnosis: ${diagnosis}`);
    } else if (moderateRiskConditions.some(cond => diagnosis.includes(cond))) {
        score = 50;
        factors.push(`Moderate-risk diagnosis: ${diagnosis}`);
    } else {
        score = 20;
        factors.push(`Stable diagnosis: ${diagnosis}`);
    }

    return {
        score,
        factors,
        category: 'Diagnosis'
    };
};

/**
 * Calculate age-based risk
 */
const calculateAgeRisk = (age) => {
    let score = 0;
    const factors = [];

    if (age >= 75) {
        score = 30;
        factors.push(`Advanced age: ${age} years`);
    } else if (age >= 65) {
        score = 20;
        factors.push(`Elderly patient: ${age} years`);
    } else if (age < 5) {
        score = 25;
        factors.push(`Pediatric patient: ${age} years`);
    } else {
        score = 5;
    }

    return {
        score,
        factors,
        category: 'Age'
    };
};

/**
 * Calculate comorbidity risk
 */
const calculateComorbidityRisk = (patient) => {
    let score = 0;
    const factors = [];

    // Check for multiple conditions in diagnosis
    const conditions = patient.diagnosis.split(',').length;
    if (conditions > 2) {
        score += 20;
        factors.push(`Multiple comorbidities detected`);
    }

    return {
        score,
        factors,
        category: 'Comorbidities'
    };
};

/**
 * Generate human-readable risk explanation
 */
export const generateRiskExplanation = (riskAnalysis) => {
    if (!riskAnalysis) return 'Unable to generate risk explanation';

    const { overallRisk, breakdown } = riskAnalysis;
    let explanation = '';

    if (overallRisk >= 70) {
        explanation = '🔴 **High Risk**: This patient requires immediate attention. ';
    } else if (overallRisk >= 40) {
        explanation = '🟡 **Moderate Risk**: Close monitoring recommended. ';
    } else {
        explanation = '🟢 **Low Risk**: Patient is stable. ';
    }

    // Add contributing factors
    const allFactors = [];
    Object.values(breakdown).forEach(category => {
        if (category.factors && category.factors.length > 0) {
            allFactors.push(...category.factors);
        }
    });

    if (allFactors.length > 0) {
        explanation += '\n\n**Contributing Factors:**\n';
        allFactors.slice(0, 5).forEach(factor => {
            explanation += `- ${factor}\n`;
        });
    }

    return explanation;
};

/**
 * Predict next 24-hour events
 */
export const predictNextEvents = async (patientId) => {
    try {
        const patient = await Patient.findById(patientId);
        if (!patient) throw new Error('Patient not found');

        const predictions = [];

        // Analyze vitals trend
        const vitalsHistory = patient.history
            .filter(h => h.type === 'vitals')
            .slice(-5);

        if (vitalsHistory.length >= 3) {
            // Check for deteriorating trends
            const spo2Trend = vitalsHistory.map(h => h.data.spO2);
            const hrTrend = vitalsHistory.map(h => h.data.heartRate);

            if (isDecreasing(spo2Trend)) {
                predictions.push({
                    event: 'Respiratory Deterioration',
                    probability: 65,
                    timeframe: '6-12 hours',
                    recommendation: 'Increase oxygen monitoring frequency'
                });
            }

            if (isIncreasing(hrTrend) && hrTrend[hrTrend.length - 1] > 100) {
                predictions.push({
                    event: 'Cardiac Stress',
                    probability: 55,
                    timeframe: '12-24 hours',
                    recommendation: 'Consider cardiac workup'
                });
            }
        }

        // Diagnosis-based predictions
        if (patient.diagnosis.includes('Sepsis')) {
            predictions.push({
                event: 'Septic Shock',
                probability: 40,
                timeframe: '24 hours',
                recommendation: 'Maintain aggressive fluid resuscitation'
            });
        }

        if (patient.diagnosis.includes('Pneumonia')) {
            predictions.push({
                event: 'Respiratory Failure',
                probability: 30,
                timeframe: '24-48 hours',
                recommendation: 'Monitor respiratory status closely'
            });
        }

        return predictions;
    } catch (error) {
        console.error('Error predicting events:', error);
        return [];
    }
};

/**
 * Generate clinical recommendations
 */
export const generateRecommendations = async (patientId) => {
    try {
        const patient = await Patient.findById(patientId);
        if (!patient) throw new Error('Patient not found');

        const labs = await LabResult.find({ patientId }).sort({ timestamp: -1 }).limit(5);
        const recommendations = [];

        // Vitals-based recommendations
        if (patient.vitals.spO2 < 92) {
            recommendations.push({
                priority: 'High',
                category: 'Respiratory',
                recommendation: 'Increase oxygen supplementation',
                rationale: `SpO2 is ${patient.vitals.spO2}%, below target of 92%`
            });
        }

        if (patient.vitals.heartRate > 120) {
            recommendations.push({
                priority: 'High',
                category: 'Cardiac',
                recommendation: 'Evaluate for tachycardia causes',
                rationale: `Heart rate elevated at ${patient.vitals.heartRate} bpm`
            });
        }

        // Labs-based recommendations
        const criticalLabs = labs.filter(l => l.severity === 'Critical');
        if (criticalLabs.length > 0) {
            recommendations.push({
                priority: 'High',
                category: 'Laboratory',
                recommendation: 'Repeat critical lab values',
                rationale: `${criticalLabs.length} critical lab result(s) detected`
            });
        }

        // Diagnosis-based recommendations
        if (patient.diagnosis.includes('Sepsis')) {
            recommendations.push({
                priority: 'High',
                category: 'Infection',
                recommendation: 'Ensure broad-spectrum antibiotics initiated',
                rationale: 'Sepsis protocol requires early antibiotic administration'
            });
        }

        return recommendations;
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return [];
    }
};

/**
 * Run what-if scenario simulation
 */
export const runWhatIfScenario = (currentVitals, changes) => {
    const simulatedVitals = { ...currentVitals, ...changes };
    const riskAnalysis = calculateVitalsRisk(simulatedVitals);

    return {
        simulatedVitals,
        predictedRisk: riskAnalysis.score,
        riskChange: riskAnalysis.score - calculateVitalsRisk(currentVitals).score,
        factors: riskAnalysis.factors
    };
};

// Helper functions
const isDecreasing = (arr) => {
    if (arr.length < 2) return false;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] >= arr[i - 1]) return false;
    }
    return true;
};

const isIncreasing = (arr) => {
    if (arr.length < 2) return false;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] <= arr[i - 1]) return false;
    }
    return true;
};

export default {
    calculateDetailedRiskScore,
    generateRiskExplanation,
    predictNextEvents,
    generateRecommendations,
    runWhatIfScenario
};
