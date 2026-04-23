// Advanced AI Risk Engine - Multi-Signal Correlation
// Heuristic-based intelligence for offline, time-critical clinical environments

/**
 * Calculate Early Warning Score (NEWS2-inspired)
 * Combines vitals into a single risk score
 */
export const calculateEarlyWarningScore = (vitals) => {
    let score = 0;

    // Respiratory Rate Scoring
    if (vitals.respiratoryRate <= 8 || vitals.respiratoryRate >= 25) score += 3;
    else if (vitals.respiratoryRate >= 21) score += 2;
    else if (vitals.respiratoryRate >= 9 && vitals.respiratoryRate <= 11) score += 1;

    // SpO2 Scoring
    if (vitals.spO2 <= 91) score += 3;
    else if (vitals.spO2 <= 93) score += 2;
    else if (vitals.spO2 <= 95) score += 1;

    // Temperature Scoring
    if (vitals.temperature <= 35) score += 3;
    else if (vitals.temperature >= 39.1) score += 2;
    else if (vitals.temperature >= 38.1) score += 1;

    // Heart Rate Scoring
    if (vitals.heartRate <= 40 || vitals.heartRate >= 131) score += 3;
    else if (vitals.heartRate >= 111) score += 2;
    else if (vitals.heartRate >= 91 || vitals.heartRate <= 50) score += 1;

    return score; // 0-15 scale
};

/**
 * Detect Sepsis Risk using qSOFA criteria + vitals
 */
export const detectSepsisRisk = (vitals, labs, history) => {
    let score = 0;
    let indicators = [];

    // qSOFA Criteria
    if (vitals.respiratoryRate >= 22) {
        score += 30;
        indicators.push('Tachypnea (RR ≥22)');
    }

    // Altered mentation (simplified - would need Glasgow Coma Scale in real system)
    // Using temperature as proxy for infection
    if (vitals.temperature >= 38.3 || vitals.temperature <= 36) {
        score += 25;
        indicators.push(vitals.temperature >= 38.3 ? 'Fever (infection suspected)' : 'Hypothermia');
    }

    // Systolic BP < 100 (parse from bloodPressure string)
    const systolic = parseInt(vitals.bloodPressure?.split('/')[0] || '120');
    if (systolic < 100) {
        score += 30;
        indicators.push('Hypotension (SBP <100)');
    }

    // Lab indicators (if available)
    if (labs) {
        const lactate = labs.find(l => l.testName.toLowerCase().includes('lactate'));
        if (lactate && lactate.value > 2) {
            score += 40;
            indicators.push(`Elevated Lactate (${lactate.value} mmol/L)`);
        }

        const wbc = labs.find(l => l.testName.toLowerCase().includes('wbc') || l.testName.toLowerCase().includes('white blood'));
        if (wbc && (wbc.value > 12 || wbc.value < 4)) {
            score += 20;
            indicators.push(`Abnormal WBC (${wbc.value})`);
        }
    }

    return {
        score: Math.min(score, 100),
        indicators,
        risk: score > 60 ? 'High' : score > 30 ? 'Moderate' : 'Low'
    };
};

/**
 * Predict Patient Deterioration based on trends
 */
export const predictDeterioration = (vitalsTrend, labTrend, timeWindow = 24) => {
    let score = 0;
    let warnings = [];

    if (!vitalsTrend || vitalsTrend.length < 2) {
        return { score: 0, warnings: [], trend: 'Insufficient data' };
    }

    // Analyze vitals trend (last 3 readings)
    const recent = vitalsTrend.slice(-3);

    // Worsening SpO2 trend
    const spo2Declining = recent.every((v, i) => i === 0 || v.spO2 < recent[i - 1].spO2);
    if (spo2Declining && recent[recent.length - 1].spO2 < 94) {
        score += 35;
        warnings.push('Declining oxygen saturation trend');
    }

    // Increasing heart rate trend
    const hrIncreasing = recent.every((v, i) => i === 0 || v.heartRate > recent[i - 1].heartRate);
    if (hrIncreasing && recent[recent.length - 1].heartRate > 100) {
        score += 25;
        warnings.push('Progressive tachycardia');
    }

    // Rising temperature
    const tempRising = recent.every((v, i) => i === 0 || v.temperature > recent[i - 1].temperature);
    if (tempRising && recent[recent.length - 1].temperature > 38) {
        score += 20;
        warnings.push('Rising fever pattern');
    }

    // Lab trend analysis
    if (labTrend && labTrend.length >= 2) {
        // Check for worsening inflammatory markers
        const crpTrend = labTrend.filter(l => l.testName.toLowerCase().includes('crp'));
        if (crpTrend.length >= 2) {
            const increasing = crpTrend[crpTrend.length - 1].value > crpTrend[crpTrend.length - 2].value;
            if (increasing && crpTrend[crpTrend.length - 1].value > 100) {
                score += 30;
                warnings.push('Rising inflammatory markers (CRP)');
            }
        }
    }

    return {
        score: Math.min(score, 100),
        warnings,
        trend: score > 50 ? 'Deteriorating' : score > 25 ? 'Concerning' : 'Stable',
        confidence: vitalsTrend.length >= 5 ? 85 : 60
    };
};

/**
 * Assess Fall Risk (Morse Fall Scale inspired)
 */
export const assessFallRisk = (age, medications, mobility, history) => {
    let score = 0;

    // Age factor
    if (age >= 75) score += 25;
    else if (age >= 65) score += 15;

    // Medication risk (sedatives, antihypertensives)
    const riskMeds = medications?.filter(m =>
        m.drugName.toLowerCase().includes('diazepam') ||
        m.drugName.toLowerCase().includes('morphine') ||
        m.drugName.toLowerCase().includes('metoprolol')
    ) || [];
    score += riskMeds.length * 10;

    // Previous falls
    if (history?.falls > 0) score += 25;

    return {
        score: Math.min(score, 100),
        risk: score > 50 ? 'High' : score > 25 ? 'Moderate' : 'Low',
        recommendations: score > 50 ? ['Bed alarm', 'Frequent rounding', 'Non-slip socks'] : []
    };
};

/**
 * Analyze Lab Trends for abnormalities
 */
export const analyzeLabTrends = (results, timeWindow = 48) => {
    const abnormal = results.filter(r => r.isAbnormal);
    const critical = results.filter(r => r.severity === 'Critical');

    const trends = {};

    // Group by test name
    results.forEach(result => {
        if (!trends[result.testName]) {
            trends[result.testName] = [];
        }
        trends[result.testName].push(result);
    });

    const analysis = [];

    Object.keys(trends).forEach(testName => {
        const testResults = trends[testName].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (testResults.length >= 2) {
            const latest = testResults[testResults.length - 1];
            const previous = testResults[testResults.length - 2];

            const direction = latest.value > previous.value ? 'increasing' : 'decreasing';
            const change = Math.abs(((latest.value - previous.value) / previous.value) * 100);

            if (change > 20 && latest.isAbnormal) {
                analysis.push({
                    test: testName,
                    trend: direction,
                    change: change.toFixed(1) + '%',
                    concern: latest.severity
                });
            }
        }
    });

    return {
        abnormalCount: abnormal.length,
        criticalCount: critical.length,
        trends: analysis
    };
};

/**
 * Correlate Multiple Signals for comprehensive risk assessment
 */
export const correlateMultipleSignals = (patient, labs, medications, department) => {
    const vitals = patient.vitals;
    const correlations = [];
    let overallRisk = 0;

    // Sepsis correlation: Fever + Tachycardia + Hypotension + High WBC
    const sepsisRisk = detectSepsisRisk(vitals, labs);
    if (sepsisRisk.score > 50) {
        correlations.push({
            type: 'Sepsis Risk',
            severity: 'Critical',
            signals: sepsisRisk.indicators,
            score: sepsisRisk.score
        });
        overallRisk += sepsisRisk.score * 0.4;
    }

    // Respiratory distress: Low SpO2 + High RR + Tachycardia
    if (vitals.spO2 < 92 && vitals.respiratoryRate > 20 && vitals.heartRate > 100) {
        correlations.push({
            type: 'Respiratory Distress',
            severity: 'High',
            signals: [`SpO2: ${vitals.spO2}%`, `RR: ${vitals.respiratoryRate}`, `HR: ${vitals.heartRate}`],
            score: 70
        });
        overallRisk += 70 * 0.3;
    }

    // Cardiac concern: Abnormal troponin + Chest pain + Tachycardia
    const troponin = labs?.find(l => l.testName.toLowerCase().includes('troponin'));
    if (troponin && troponin.isAbnormal && vitals.heartRate > 100) {
        correlations.push({
            type: 'Cardiac Event Risk',
            severity: 'Critical',
            signals: [`Elevated Troponin`, `HR: ${vitals.heartRate}`],
            score: 80
        });
        overallRisk += 80 * 0.3;
    }

    // Early Warning Score
    const ews = calculateEarlyWarningScore(vitals);
    if (ews >= 5) {
        overallRisk += ews * 5; // Scale to 0-100
    }

    return {
        overallRisk: Math.min(Math.round(overallRisk), 100),
        correlations,
        earlyWarningScore: ews,
        recommendation: overallRisk > 70 ? 'Immediate physician review required' :
            overallRisk > 40 ? 'Increase monitoring frequency' :
                'Continue standard monitoring'
    };
};

/**
 * Detect Operational Bottlenecks
 */
export const detectOperationalBottleneck = (beds, staff, patients, department) => {
    const bottlenecks = [];

    // Bed capacity strain
    const occupancyRate = (beds.occupied / beds.total) * 100;
    if (occupancyRate > 90) {
        bottlenecks.push({
            type: 'Bed Capacity',
            severity: 'Critical',
            message: `${department} at ${occupancyRate.toFixed(0)}% occupancy`,
            impact: 'High'
        });
    }

    // Staff shortage
    const patientToStaffRatio = patients.length / staff.available;
    if (patientToStaffRatio > 8) {
        bottlenecks.push({
            type: 'Staff Shortage',
            severity: 'High',
            message: `Patient-to-staff ratio: ${patientToStaffRatio.toFixed(1)}:1`,
            impact: 'High'
        });
    }

    // Critical patients concentration
    const criticalCount = patients.filter(p => p.status === 'Critical').length;
    if (criticalCount > 3 && staff.available < 5) {
        bottlenecks.push({
            type: 'Resource Strain',
            severity: 'Critical',
            message: `${criticalCount} critical patients with limited staff`,
            impact: 'Critical'
        });
    }

    return bottlenecks;
};

/**
 * Forecast Capacity for next 24 hours
 */
export const forecastCapacity = (admissionRate, dischargeRate, currentOccupancy, totalBeds) => {
    // Simple linear projection
    const netChange = (admissionRate - dischargeRate) * 24; // 24 hours
    const projectedOccupancy = currentOccupancy + netChange;
    const projectedOccupancyRate = (projectedOccupancy / totalBeds) * 100;

    return {
        currentOccupancy,
        projectedOccupancy: Math.max(0, Math.min(projectedOccupancy, totalBeds)),
        projectedRate: Math.min(projectedOccupancyRate, 100),
        warning: projectedOccupancyRate > 95 ? 'Critical capacity expected' :
            projectedOccupancyRate > 85 ? 'High occupancy expected' :
                'Normal capacity expected',
        confidence: 70
    };
};

/**
 * Generate Explainable AI Insights
 */
export const generateExplanation = (riskScore, factors, correlations) => {
    const explanations = [];

    if (riskScore > 70) {
        explanations.push('🔴 **CRITICAL RISK DETECTED**');
    } else if (riskScore > 40) {
        explanations.push('🟡 **ELEVATED RISK**');
    } else {
        explanations.push('🟢 **LOW RISK**');
    }

    if (factors.sepsisScore > 50) {
        explanations.push('⚠️ **Sepsis Risk**: Multiple infection indicators present');
    }

    if (factors.deteriorationIndex > 50) {
        explanations.push('📉 **Deteriorating Trend**: Vitals worsening over time');
    }

    if (factors.earlyWarningScore >= 7) {
        explanations.push('🚨 **High Early Warning Score**: Immediate assessment needed');
    }

    if (correlations && correlations.length > 0) {
        explanations.push(`🔗 **${correlations.length} Correlated Risk Factor(s)** detected`);
    }

    return explanations.join('\n');
};

/**
 * Enhanced Vitals Analysis (original function, now enhanced)
 */
export const analyzeVitals = (vitals) => {
    let score = 0;
    let risks = [];

    // Heart Rate Analysis
    if (vitals.heartRate > 120) {
        score += 30;
        risks.push("Severe Tachycardia detected (>120 BPM)");
    } else if (vitals.heartRate > 100) {
        score += 15;
        risks.push("Tachycardia detected (>100 BPM)");
    } else if (vitals.heartRate < 45) {
        score += 30;
        risks.push("Severe Bradycardia detected (<45 BPM)");
    }

    // SpO2 Analysis
    if (vitals.spO2 < 85) {
        score += 40;
        risks.push("Critical Hypoxia (SpO2 < 85%)");
    } else if (vitals.spO2 < 92) {
        score += 20;
        risks.push("Hypoxia warning (SpO2 < 92%)");
    }

    // Temperature Analysis
    if (vitals.temperature > 39.5) {
        score += 20;
        risks.push("High Fever (>39.5°C)");
    } else if (vitals.temperature < 35) {
        score += 20;
        risks.push("Hypothermia risk (<35°C)");
    }

    // Blood Pressure Analysis
    const systolic = parseInt(vitals.bloodPressure?.split('/')[0] || '120');
    const diastolic = parseInt(vitals.bloodPressure?.split('/')[1] || '80');

    if (systolic < 90 || diastolic < 60) {
        score += 25;
        risks.push("Hypotension detected");
    } else if (systolic > 180 || diastolic > 110) {
        score += 25;
        risks.push("Hypertensive crisis");
    }

    return {
        riskScore: Math.min(score, 100),
        risks,
        status: score > 60 ? 'Critical' : score > 30 ? 'Moderate' : 'Stable'
    };
};

/**
 * AI Chat Response Generator (Enhanced)
 */
export const generateAIResponse = async (query, patientContext) => {
    const q = query.toLowerCase();

    if (!patientContext) {
        return "I need a specific patient context to answer clinically relevant questions. Please select a patient.";
    }

    const { name, vitals, diagnosis, aiAnalysis, recentLabs } = patientContext;

    if (q.includes('status') || q.includes('condition') || q.includes('how is')) {
        return `Patient ${name} is currently in **${patientContext.status}** condition. Current risk score is ${aiAnalysis?.riskScore || 0}/100. Primary diagnosis: ${diagnosis}.`;
    }

    if (q.includes('risk') || q.includes('warning') || q.includes('alert')) {
        const risks = analyzeVitals(vitals).risks;
        if (risks.length === 0) return `No immediate physiological risks detected for ${name} based on current vitals. Monitoring continues.`;
        return `**Risk Factors Detected:**\n- ${risks.join('\n- ')}\n\nRecommendation: Immediate nursing assessment required.`;
    }

    if (q.includes('vitals') || q.includes('bp') || q.includes('heart')) {
        return `**Current Vitals for ${name}:**\n- Heart Rate: ${vitals.heartRate} BPM\n- BP: ${vitals.bloodPressure}\n- SpO2: ${vitals.spO2}%\n- Temp: ${vitals.temperature}°C\n- RR: ${vitals.respiratoryRate} breaths/min`;
    }

    if (q.includes('labs') || q.includes('test') || q.includes('result')) {
        if (!recentLabs || recentLabs.length === 0) {
            return `No recent lab results available for ${name}.`;
        }
        const labSummary = recentLabs.map(l =>
            `- ${l.testName}: ${l.value} ${l.isAbnormal ? '⚠️ ABNORMAL' : '✓'}`
        ).join('\n');
        return `**Recent Lab Results for ${name}:**\n${labSummary}`;
    }

    if (q.includes('recommend') || q.includes('suggestion') || q.includes('plan')) {
        if (patientContext.status === 'Critical') return "⚠️ **CRITICAL RECOMMENDATION**: Immediate physician review required. Prepare resuscitation cart if instability persists. Increase monitoring frequency to q15min.";
        if (patientContext.status === 'Moderate') return "⚠️ **Recommendation**: Increase monitoring frequency. Verify medication administration. Check fluid balance.";
        return "✅ **Recommendation**: Patient is stable. Continue standard ward protocol monitoring.";
    }

    if (q.includes('medication') || q.includes('medicine') || q.includes('meds') || q.includes('drug')) {
        const meds = patientContext.activeMedications || [];
        if (meds.length === 0) return `User ${name} is currently not on any active medications.`;

        const medList = meds.map(m =>
            `- **${m.drugName}** (${m.dosage}, ${m.frequency}) - ${m.route}`
        ).join('\n');
        return `**Active Medications for ${name}:**\n${medList}`;
    }

    if (q.includes('note') || q.includes('history') || q.includes('observation')) {
        const notes = patientContext.notes || [];
        if (notes.length === 0) return `No clinical notes recorded for ${name}.`;

        // Get last 3 notes
        const recentNotes = notes.slice(-3).reverse().map(n =>
            `> *"${n.content}"* \n> — ${n.author} (${new Date(n.timestamp).toLocaleDateString()})`
        ).join('\n\n');
        return `**Recent Clinical Notes for ${name}:**\n\n${recentNotes}`;
    }

    return "I can answer questions about vitals, risks, status, labs, or recommendations. Try asking: 'What is the patient risk?' or 'Show current vitals'.";
};
