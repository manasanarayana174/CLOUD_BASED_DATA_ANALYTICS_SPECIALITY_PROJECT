import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, subtext, icon: Icon, color = 'medical', trend }) => {
    const colorClasses = {
        medical: 'from-teal-500 to-teal-600',
        rose: 'from-rose-500 to-rose-600',
        amber: 'from-amber-500 to-amber-600',
        emerald: 'from-emerald-500 to-emerald-600',
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600'
    };

    const iconBgClasses = {
        medical: 'bg-teal-100 text-teal-600',
        rose: 'bg-rose-100 text-rose-600',
        amber: 'bg-amber-100 text-amber-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600'
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
                    <p className="text-xs text-slate-400">{subtext}</p>

                    {trend !== undefined && (
                        <div className="mt-3 flex items-center gap-1">
                            {trend > 0 ? (
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-rose-500" />
                            )}
                            <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {Math.abs(trend)}% {trend > 0 ? 'increase' : 'decrease'}
                            </span>
                        </div>
                    )}
                </div>

                <div className={`p-3 rounded-xl ${iconBgClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
