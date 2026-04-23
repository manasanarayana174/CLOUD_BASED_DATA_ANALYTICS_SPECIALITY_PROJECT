import React from 'react';

const CapacityHeatmap = ({ data = [] }) => {
    const getOccupancyColor = (rate) => {
        if (rate >= 90) return 'bg-rose-500';
        if (rate >= 75) return 'bg-amber-500';
        if (rate >= 50) return 'bg-emerald-500';
        return 'bg-teal-500';
    };

    const getOccupancyTextColor = (rate) => {
        if (rate >= 90) return 'text-rose-700';
        if (rate >= 75) return 'text-amber-700';
        if (rate >= 50) return 'text-emerald-700';
        return 'text-teal-700';
    };

    const getStatusBadge = (status) => {
        const badges = {
            Critical: 'bg-rose-100 text-rose-700 border-rose-200',
            High: 'bg-amber-100 text-amber-700 border-amber-200',
            Normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            Low: 'bg-teal-100 text-teal-700 border-teal-200'
        };
        return badges[status] || badges.Normal;
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Bed Occupancy Heatmap</h3>
                <p className="text-sm text-slate-500 mt-1">Real-time capacity across departments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((dept, index) => (
                    <div
                        key={dept.departmentId || index}
                        className="border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">
                                    {dept.department}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {dept.occupied}/{dept.total} beds
                                </p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusBadge(dept.status)}`}>
                                {dept.status}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-500">Occupancy</span>
                                <span className={`text-sm font-bold ${getOccupancyTextColor(dept.occupancyRate)}`}>
                                    {dept.occupancyRate}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full ${getOccupancyColor(dept.occupancyRate)} transition-all duration-500 rounded-full`}
                                    style={{ width: `${dept.occupancyRate}%` }}
                                />
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                            <div>
                                <p className="text-xs text-slate-500">Available</p>
                                <p className="text-lg font-bold text-emerald-600">{dept.available}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Occupied</p>
                                <p className="text-lg font-bold text-slate-700">{dept.occupied}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {data.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No department data available</p>
                </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    <span className="text-slate-600">&lt;50%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600">50-75%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-slate-600">75-90%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="text-slate-600">&gt;90%</span>
                </div>
            </div>
        </div>
    );
};

export default CapacityHeatmap;
