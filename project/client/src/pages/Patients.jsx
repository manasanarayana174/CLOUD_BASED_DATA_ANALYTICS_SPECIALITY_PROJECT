import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CreatePatientModal from '../components/patient/CreatePatientModal';

const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();

    const fetchPatients = () => {
        setLoading(true);
        api.get('/api/patients')
            .then(data => {
                setPatients(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch patients", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Critical': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    const [filterStatus, setFilterStatus] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'All' || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.admissionDate || 0) - new Date(a.admissionDate || 0));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Patient Directory</h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 shadow-sm shadow-indigo-200"
                >
                    <Plus size={20} />
                    Admit Patient
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or diagnosis..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${filterStatus !== 'All' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter size={18} />
                            <span>{filterStatus === 'All' ? 'Filter' : filterStatus}</span>
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                                {['All', 'Critical', 'Moderate', 'Stable'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setFilterStatus(status);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${filterStatus === status ? 'text-indigo-600 font-medium bg-slate-50' : 'text-slate-600'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Diagnosis</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Room</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Score</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" /> Loading Directory...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-slate-500">No patients found.</td>
                                </tr>
                            ) : filteredPatients.map((patient) => (
                                <tr
                                    key={patient._id}
                                    onClick={() => navigate(`/patients/${patient._id}`)}
                                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm uppercase border border-slate-200">
                                                {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{patient.name}</p>
                                                <p className="text-xs text-slate-500 font-mono">ID: #{patient._id.slice(-4).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{patient.diagnosis}</td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{patient.room || patient.bedId?.bedNumber || 'Unassigned'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(patient.status)}`}>
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${patient.aiAnalysis?.riskScore > 60 ? 'bg-rose-500' : patient.aiAnalysis?.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${patient.aiAnalysis?.riskScore || 0}%` }}
                                                />
                                            </div>
                                            <span className="font-bold text-slate-700 text-xs">{patient.aiAnalysis?.riskScore || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreatePatientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPatientCreated={fetchPatients}
            />
        </div>
    );
};

export default Patients;
