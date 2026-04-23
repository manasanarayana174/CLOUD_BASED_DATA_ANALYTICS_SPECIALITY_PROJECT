import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const VitalsWidget = ({ title, data, dataKey = "value", color = "#0d9488", unit }) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-64">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{unit}</span>
            </div>

            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="timestamp" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: color, fontWeight: 600 }}
                            labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#gradient-${title})`}
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default VitalsWidget;
