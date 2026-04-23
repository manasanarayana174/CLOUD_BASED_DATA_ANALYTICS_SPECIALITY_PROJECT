import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import StatsCard from '../components/dashboard/StatsCard';
import AlertsFeed from '../components/dashboard/AlertsFeed';
import CapacityHeatmap from '../components/dashboard/CapacityHeatmap';
import RiskIntelligencePanel from '../components/dashboard/RiskIntelligencePanel';
import { Users, AlertCircle, Bed, Activity, UserCheck, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const { lastVitalsUpdate } = useSocket();
    const [overview, setOverview] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [highRiskPatients, setHighRiskPatients] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        // Fallback polling every 30s in case socket fails or for non-realtime data
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [lastVitalsUpdate]);

    const fetchDashboardData = async () => {
        try {
            setError(null);

            // Fetch hospital overview
            const overviewData = await api.get('/api/analytics/hospital-overview');
            setOverview(overviewData);

            // Fetch bed occupancy heatmap
            const heatmapData = await api.get('/api/beds/occupancy/heatmap');
            setHeatmapData(heatmapData);

            // Fetch high-risk patients
            const patientsData = await api.get('/api/patients/high-risk?threshold=40');
            setHighRiskPatients(patientsData);

            // Fetch alerts
            const alertsData = await api.get('/api/alerts?acknowledged=false');
            setAlerts(alertsData);

            setLoading(false);
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Activity className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-rose-700 mb-2">Connection Error</h3>
                    <p className="text-slate-600 mb-4">{error}</p>
                    <p className="text-sm text-slate-500 mb-4">Make sure the backend server is running on port 5000</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">
                    Welcome to Hospital Intelligence Platform
                </h2>
                <p className="text-slate-500 mt-2">
                    Real-time hospital operations and risk intelligence dashboard
                </p>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Patients"
                    value={overview?.patients?.total || 0}
                    subtext="Active admissions"
                    icon={Users}
                    color="blue"
                />
                <StatsCard
                    title="Critical Cases"
                    value={overview?.patients?.critical || 0}
                    subtext="Requires immediate attention"
                    icon={AlertCircle}
                    color={overview?.patients?.critical > 0 ? "rose" : "emerald"}
                />
                <StatsCard
                    title="Bed Occupancy"
                    value={`${Math.round(overview?.beds?.occupancyRate || 0)}%`}
                    subtext={`${overview?.beds?.available || 0} beds available`}
                    icon={Bed}
                    color={overview?.beds?.occupancyRate > 90 ? "rose" : overview?.beds?.occupancyRate > 75 ? "amber" : "emerald"}
                />
                <StatsCard
                    title="Staff Availability"
                    value={`${overview?.staff?.available || 0}/${overview?.staff?.total || 0}`}
                    subtext="Available staff members"
                    icon={UserCheck}
                    color="purple"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">Avg Risk Score</h3>
                        <TrendingUp className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-3xl font-bold">{Math.round(overview?.patients?.avgRiskScore || 0)}</p>
                    <p className="text-xs opacity-75 mt-1">Across all patients</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">Active Alerts</h3>
                        <AlertCircle className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-3xl font-bold">{overview?.alerts?.total || 0}</p>
                    <p className="text-xs opacity-75 mt-1">{overview?.alerts?.critical || 0} critical</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">System Load</h3>
                        <Activity className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-3xl font-bold">{overview?.systemLoad || 'Normal'}</p>
                    <p className="text-xs opacity-75 mt-1">Operational status</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Risk Intelligence & Heatmap */}
                <div className="lg:col-span-2 space-y-6">
                    <RiskIntelligencePanel patients={highRiskPatients} />
                    <CapacityHeatmap data={heatmapData} />
                </div>

                {/* Right Column - Alerts */}
                <div className="lg:col-span-1">
                    <AlertsFeed alerts={alerts} />
                </div>
            </div>

            {/* Department Quick Stats */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Department Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {heatmapData.slice(0, 5).map((dept, index) => (
                        <div key={index} className="text-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                            <p className="text-xs text-slate-500 mb-1">{dept.department}</p>
                            <p className="text-2xl font-bold text-slate-800">{dept.occupied}</p>
                            <p className="text-xs text-slate-400">patients</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
