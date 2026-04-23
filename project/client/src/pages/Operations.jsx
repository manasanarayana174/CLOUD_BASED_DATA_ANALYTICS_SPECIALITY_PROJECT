import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    Bed, Users, Activity, Clock, AlertCircle,
    ArrowRight, UserCheck, Stethoscope, Briefcase
} from 'lucide-react';

const Operations = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [beds, setBeds] = useState([]);
    const [staff, setStaff] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [viewMode, setViewMode] = useState('beds'); // 'beds' or 'staff'

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bedsRes, staffRes, deptRes] = await Promise.all([
                    api.get('/api/beds'),
                    api.get('/api/staff'),
                    api.get('/api/departments')
                ]);
                setBeds(bedsRes);
                setStaff(staffRes);
                setDepartments(deptRes);
            } catch (err) {
                console.error("Error fetching operations data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-screen text-slate-500">
            <Activity className="animate-spin mr-2" /> Loading Operations Center...
        </div>
    );

    // Calculate Metrics
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'Occupied' || b.status === 'Cleaning').length;
    const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

    const totalStaff = staff.length;
    const availableStaff = staff.filter(s => s.status === 'Available').length;

    return (
        <div className="space-y-6 pb-10">
            {/* Operations Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Operations Command Center</h1>
                <p className="text-slate-500 mt-2">Real-time resource management and capacity planning</p>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Bed Occupancy"
                    value={`${occupancyRate}%`}
                    subtext={`${totalBeds - occupiedBeds} beds available`}
                    icon={Bed}
                    color={occupancyRate > 90 ? 'rose' : occupancyRate > 75 ? 'amber' : 'emerald'}
                />
                <MetricCard
                    title="Staff On-Duty"
                    value={`${availableStaff}/${totalStaff}`}
                    subtext="Currently available"
                    icon={UserCheck}
                    color="indigo"
                />
                <MetricCard
                    title="Pending Transfers"
                    value="3"
                    subtext="Avg wait: 12m"
                    icon={Clock}
                    color="blue"
                />
                <MetricCard
                    title="Maintenance"
                    value="2"
                    subtext="Equipment alerts"
                    icon={AlertCircle}
                    color="slate"
                />
            </div>

            {/* Main Control Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setViewMode('beds')}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${viewMode === 'beds' ? 'bg-slate-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Bed Management
                    </button>
                    <button
                        onClick={() => setViewMode('staff')}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${viewMode === 'staff' ? 'bg-slate-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Staff Scheduling
                    </button>
                </div>

                <div className="p-6">
                    {viewMode === 'beds' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-slate-800">Bed Status by Department</h3>
                                <div className="flex gap-2">
                                    <span className="flex items-center text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Available</span>
                                    <span className="flex items-center text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-rose-500 mr-1"></span>Occupied</span>
                                    <span className="flex items-center text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>Cleaning</span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {departments.map(dept => {
                                    const deptBeds = beds.filter(b => {
                                        // Handle populated departmentId (object) or raw ID (string)
                                        const bedDeptId = b.departmentId?._id || b.departmentId;
                                        // Ensure string comparison to avoid ObjectId vs string mismatches
                                        return String(bedDeptId) === String(dept._id) || b.department === dept.name;
                                    });
                                    return (
                                        <div key={dept._id} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-slate-700">{dept.name}</h4>
                                                <span className="text-xs text-slate-400">{deptBeds.filter(b => b.status === 'Available').length} / {deptBeds.length} available</span>
                                            </div>
                                            <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
                                                {deptBeds.map(bed => (
                                                    <div
                                                        key={bed._id}
                                                        onClick={() => {
                                                            if (bed.status === 'Occupied' && bed.currentPatientId) {
                                                                // Handle both populated object or direct ID
                                                                const patientId = typeof bed.currentPatientId === 'object' ? bed.currentPatientId._id : bed.currentPatientId;
                                                                navigate(`/patients/${patientId}`);
                                                            }
                                                        }}
                                                        className={`
                                                            aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-105 border-2 border-transparent
                                                            ${bed.status === 'Occupied' ? 'bg-rose-100 text-rose-700 hover:border-rose-300' :
                                                                bed.status === 'Cleaning' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-emerald-100 text-emerald-700'}
                                                        `}
                                                        title={`Bed ${bed.bedNumber}: ${bed.status}${bed.status === 'Occupied' ? ' (Click to view)' : ''}`}
                                                    >
                                                        {bed.bedNumber}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {viewMode === 'staff' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-semibold text-slate-800">Staff Directory & Status</h3>
                                <input placeholder="Search staff..." className="px-4 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {staff.map(member => (
                                    <div key={member._id} className="p-4 border border-slate-200 rounded-xl flex items-center gap-4 hover:border-indigo-200 transition-colors bg-white">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{member.name}</p>
                                            <p className="text-xs text-slate-500">{member.role} • {member.specialization}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                ${member.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                                                    member.status === 'Busy' ? 'bg-rose-50 text-rose-700' :
                                                        'bg-slate-100 text-slate-600'}
                                            `}>
                                                {member.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subtext, icon: Icon, color }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600',
        rose: 'bg-rose-50 text-rose-600',
        amber: 'bg-amber-50 text-amber-600',
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        slate: 'bg-slate-50 text-slate-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colors[color] || colors.slate}`}>
                    <Icon size={20} />
                </div>
            </div>
            <p className="text-xs text-slate-400">{subtext}</p>
        </div>
    );
};

export default Operations;
