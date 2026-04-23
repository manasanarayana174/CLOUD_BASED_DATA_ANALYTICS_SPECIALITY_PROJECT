import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const AlertsFeed = ({ alerts = [] }) => {
    const getSeverityConfig = (severity) => {
        const configs = {
            Critical: {
                icon: AlertCircle,
                bgColor: 'bg-rose-50',
                borderColor: 'border-rose-200',
                textColor: 'text-rose-700',
                iconColor: 'text-rose-500',
                badgeColor: 'bg-rose-100 text-rose-700'
            },
            High: {
                icon: AlertTriangle,
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                textColor: 'text-orange-700',
                iconColor: 'text-orange-500',
                badgeColor: 'bg-orange-100 text-orange-700'
            },
            Medium: {
                icon: Info,
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200',
                textColor: 'text-amber-700',
                iconColor: 'text-amber-500',
                badgeColor: 'bg-amber-100 text-amber-700'
            },
            Low: {
                icon: CheckCircle,
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-700',
                iconColor: 'text-blue-500',
                badgeColor: 'bg-blue-100 text-blue-700'
            }
        };
        return configs[severity] || configs.Medium;
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 h-full flex flex-col">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">Critical Alerts</h3>
                <p className="text-sm text-slate-500 mt-1">{alerts.length} active alerts</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
                        <p className="text-slate-500 font-medium">No active alerts</p>
                        <p className="text-xs text-slate-400 mt-1">All systems operating normally</p>
                    </div>
                ) : (
                    alerts.map((alert, index) => {
                        const config = getSeverityConfig(alert.severity);
                        const Icon = config.icon;

                        return (
                            <div
                                key={alert._id || index}
                                className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${config.iconColor} bg-white`}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeColor}`}>
                                                {alert.severity}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatTime(alert.timestamp)}
                                            </span>
                                        </div>

                                        <p className={`text-sm font-medium ${config.textColor} leading-snug`}>
                                            {alert.message}
                                        </p>

                                        {alert.patientName && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Patient: {alert.patientName}
                                            </p>
                                        )}

                                        {alert.predictive && (
                                            <div className="mt-2 flex items-center gap-1">
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                                    AI Prediction
                                                </span>
                                                {alert.confidence && (
                                                    <span className="text-xs text-slate-500">
                                                        {alert.confidence}% confidence
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

export default AlertsFeed;
