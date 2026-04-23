import React from 'react';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';

const RiskIntelligencePanel = ({ patients = [] }) => {
    const getRiskColor = (score) => {
        if (score >= 80) return 'from-rose-500 to-rose-600';
        if (score >= 60) return 'from-orange-500 to-orange-600';
        if (score >= 40) return 'from-amber-500 to-amber-600';
        return 'from-emerald-500 to-emerald-600';
    };

    const getRiskBadge = (score) => {
        if (score >= 80) return { text: 'Critical', class: 'bg-rose-100 text-rose-700 border-rose-200' };
        if (score >= 60) return { text: 'High', class: 'bg-orange-100 text-orange-700 border-orange-200' };
        if (score >= 40) return { text: 'Moderate', class: 'bg-amber-100 text-amber-700 border-amber-200' };
        return { text: 'Low', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Risk Intelligence</h3>
                    <p className="text-sm text-slate-500 mt-1">AI-ranked high-risk patients</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                </div>
            </div>

            <div className="space-y-3">
                {patients.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400">No high-risk patients</p>
                    </div>
                ) : (
                    patients.slice(0, 10).map((patient, index) => {
                        const riskScore = patient.aiAnalysis?.riskScore || 0;
                        const badge = getRiskBadge(riskScore);

                        return (
                            <div
                                key={patient._id || index}
                                className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Risk Score Circle */}
                                    <div className="relative">
                                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getRiskColor(riskScore)} flex items-center justify-center shadow-lg`}>
                                            <span className="text-white font-bold text-lg">{riskScore}</span>
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                            <TrendingUp className="w-3 h-3 text-white" />
                                        </div>
                                    </div>

                                    {/* Patient Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">
                                                {patient.name}
                                            </h4>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.class}`}>
                                                {badge.text}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-600 mb-2">{patient.diagnosis}</p>

                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span>Room: {patient.room || patient.bedId?.bedNumber || 'N/A'}</span>
                                            <span>•</span>
                                            <span>{patient.departmentId?.name || 'Unknown Dept'}</span>
                                        </div>

                                        {/* Risk Factors */}
                                        {patient.aiAnalysis?.riskFactors && (
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {patient.aiAnalysis.riskFactors.sepsisScore > 50 && (
                                                    <span className="text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded-full border border-rose-200">
                                                        Sepsis Risk
                                                    </span>
                                                )}
                                                {patient.aiAnalysis.riskFactors.deteriorationIndex > 50 && (
                                                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-200">
                                                        Deteriorating
                                                    </span>
                                                )}
                                                {patient.aiAnalysis.riskFactors.earlyWarningScore >= 7 && (
                                                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-200">
                                                        High EWS
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RiskIntelligencePanel;
