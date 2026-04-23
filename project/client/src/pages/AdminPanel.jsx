import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Settings, Activity,
    AlertTriangle, Database, Shield, Radio
} from 'lucide-react';
import api from '../utils/api';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const statsRes = await api.get('/api/admin/stats');
            setStats(statsRes);

            const usersRes = await api.get('/api/users');
            setUsers(usersRes);
        } catch (err) {
            console.error("Admin fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-4 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 space-y-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <LayoutDashboard size={18} />
                        System Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Users size={18} />
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Settings size={18} />
                        System Configuration
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-slate-500">
                            Loading Admin Data...
                        </div>
                    ) : error ? (
                        <div className="p-6 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
                            {error}
                        </div>
                    ) : (
                        <>
                            {activeTab === 'dashboard' && stats && (
                                <div className="space-y-6 animate-in fade-in">
                                    <h2 className="text-2xl font-bold text-slate-800">System Overview</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <StatCard
                                            title="Total Patients"
                                            value={stats.patients?.total || 0}
                                            subtext={`${stats.patients?.critical || 0} Critical Cases`}
                                            icon={Activity}
                                            color="bg-emerald-500"
                                        />
                                        <StatCard
                                            title="Hospital Capacity"
                                            value={`${stats.capacity?.percentage || 0}%`}
                                            subtext={`${stats.capacity?.occupied || 0}/${stats.capacity?.total || 0} Beds Occupied`}
                                            icon={Database}
                                            color="bg-blue-500"
                                        />
                                        <StatCard
                                            title="Active Alerts"
                                            value={stats.alerts?.recent || 0}
                                            subtext="Last 24 Hours"
                                            icon={AlertTriangle}
                                            color="bg-rose-500"
                                        />
                                    </div>

                                    {/* Additional sections can go here */}
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-bold text-lg text-slate-800">Staff Directory</h3>
                                        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                                            Add New Staff
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                                <tr>
                                                    <th className="px-6 py-4">Name</th>
                                                    <th className="px-6 py-4">Role</th>
                                                    <th className="px-6 py-4">Department</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {users.map(user => (
                                                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                                        <td className="px-6 py-4">{user.role}</td>
                                                        <td className="px-6 py-4 text-slate-500">
                                                            {/* Populate if department name available, otherwise fallback */}
                                                            {user.specialization || 'General'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                                                                user.status === 'Busy' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {user.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <h2 className="text-2xl font-bold text-slate-800">System Configuration</h2>

                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                                    <Radio size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">Live Simulation Engine</h3>
                                                    <p className="text-sm text-slate-500">Control the global vitals simulation service.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg text-sm">
                                                    Active
                                                </button>
                                                <button className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-200">
                                                    Pause
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                                        Server Version v1.0.4 • Build 2026-01-23
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
