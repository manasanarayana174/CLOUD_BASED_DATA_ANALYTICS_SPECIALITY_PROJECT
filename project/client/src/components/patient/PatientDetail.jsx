import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import VitalsWidget from '../dashboard/VitalsWidget'; // Assuming this component exists and handles history
import {
    ArrowLeft, Activity, AlertTriangle, Brain, Clock,
    FileText, Pill, Stethoscope, History, Thermometer, ChevronDown, UserCog, LogOut
} from 'lucide-react';
import api from '../../utils/api'; // Use the api utility

import EditPatientModal from './EditPatientModal';

import AIChatInterface from '../ai/AIChatInterface';
import { X } from 'lucide-react';

const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { user } = useAuth();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [vitalsHistory, setVitalsHistory] = useState([]);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const handleDischarge = async () => {
        if (!window.confirm("Are you sure you want to discharge this patient? This will free up their bed.")) return;

        try {
            await api.post(`/api/patients/${id}/discharge`);
            fetchPatientData(); // Refresh to show status update
            setShowActions(false);
        } catch (err) {
            console.error("Discharge failed", err);
            alert("Failed to discharge patient");
        }
    };

    const fetchPatientData = async () => {
        setLoading(true);
        try {
            // Fetch Patient Details
            console.log("Fetching patient:", id);
            try {
                const patientRes = await api.get(`/api/patients/${id}`);
                console.log("Patient data:", patientRes);
                setPatient(patientRes);
            } catch (err) {
                console.error("Error fetching patient base data:", err);
                setError("Failed to load patient details.");
                setLoading(false);
                return;
            }

            // Fetch History (Non-blocking)
            try {
                const historyRes = await api.get(`/api/patients/${id}/vitals-history`);
                if (historyRes && historyRes.vitalsHistory) {
                    setVitalsHistory(historyRes.vitalsHistory);
                }
            } catch (err) {
                console.warn("Could not fetch vitals history:", err);
                // Don't block the UI for history failure
            }

        } catch (err) {
            console.error("Unexpected error in fetchPatientData:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPatientData();
        }

        if (socket) {
            socket.on('vitals_updated', () => {
                // Optional: debounce this or only fetch if tab is active
                // fetchPatientData(); 
            });
            return () => {
                socket.off('vitals_updated');
            };
        }
    }, [id, socket]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen text-slate-500">
            <Activity className="animate-spin mr-2" /> Loading Patient Profile...
        </div>
    );

    if (error) return <div className="p-10 text-center text-rose-500">{error}</div>;
    if (!patient) return <div className="p-10 text-center text-slate-500">Patient Not Found (ID: {id})</div>;

    const riskScore = patient.aiAnalysis?.riskScore || 0;
    const riskColor = riskScore > 60 ? 'text-rose-600' : riskScore > 30 ? 'text-amber-600' : 'text-emerald-600';
    const borderColor = riskScore > 60 ? 'border-rose-200' : riskScore > 30 ? 'border-amber-200' : 'border-emerald-200';
    const bgColor = riskScore > 60 ? 'bg-rose-50' : riskScore > 30 ? 'bg-amber-50' : 'bg-emerald-50';

    const Tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'labs', label: 'Lab Results', icon: FileText },
        { id: 'meds', label: 'Medications', icon: Pill },
        { id: 'notes', label: 'Clinical Notes', icon: FileText },
        { id: 'care', label: 'Care Team', icon: Stethoscope },
    ];

    return (
        <div className="space-y-6 pb-10">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <button onClick={() => navigate('/patients')} className="self-start p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
                            <div className="relative">
                                <button
                                    onClick={() => setIsEditModalOpen(!isEditModalOpen)} // Reusing this state for now, wait better create new state
                                    className="hidden" // Hiding old button
                                />
                                <button
                                    onClick={() => setShowActions(!showActions)}
                                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    Actions
                                    <ChevronDown size={14} />
                                </button>

                                {showActions && (
                                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                            onClick={() => {
                                                setIsEditModalOpen(true);
                                                setShowActions(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <UserCog size={16} className="text-indigo-600" />
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={handleDischarge}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Discharge Patient
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm("Are you sure you want to PERMANENTLY DELETE this patient? This cannot be undone.")) return;
                                                try {
                                                    await api.delete(`/api/patients/${id}`);
                                                    navigate('/patients');
                                                } catch (err) {
                                                    console.error("Delete failed", err);
                                                    alert("Failed to delete patient");
                                                }
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                                        >
                                            <AlertTriangle size={16} />
                                            Delete Patient
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                            <span>ID: <span className="font-mono text-slate-700">#{patient._id.slice(-6).toUpperCase()}</span></span>
                            <span>•</span>
                            <span>Age: {patient.age}</span>
                            <span>•</span>
                            <span>Gender: {patient.gender}</span>
                            <span>•</span>
                            <span>Room: {patient.bedId?.bedNumber || patient.room || 'Unassigned'}</span>
                        </div>
                    </div>
                    <div className="md:ml-auto flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-xl border ${borderColor} ${bgColor} flex items-center gap-2`}>
                            <Activity size={18} className={riskColor} />
                            <span className={`font-bold ${riskColor}`}>{patient.status}</span>
                        </div>
                        <button
                            onClick={() => setIsAiChatOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Brain size={18} />
                            Ask AI Assistant
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    {Tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {activeTab === 'overview' && (
                        <>
                            {/* Live Vitals Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <VitalCard label="Heart Rate" value={patient.vitals.heartRate} unit="bpm" />
                                <VitalCard label="Blood Pressure" value={patient.vitals.bloodPressure} unit="mmHg" />
                                <VitalCard label="SpO2" value={patient.vitals.spO2} unit="%" />
                                <VitalCard label="Temperature" value={Number(patient.vitals.temperature).toFixed(1)} unit="°C" />
                            </div>

                            {/* Vitals Charts */}
                            {/* Vitals Charts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <VitalsWidget
                                    title="Heart Rate History"
                                    data={vitalsHistory}
                                    dataKey="heartRate"
                                    unit="bpm"
                                    color="#ef4444"
                                />
                                <VitalsWidget
                                    title="Oxygen Saturation (SpO2)"
                                    data={vitalsHistory}
                                    dataKey="spO2"
                                    unit="%"
                                    color="#3b82f6"
                                />
                                <VitalsWidget
                                    title="Systolic Blood Pressure"
                                    data={vitalsHistory}
                                    dataKey="systolic"
                                    unit="mmHg"
                                    color="#8b5cf6"
                                />
                                <VitalsWidget
                                    title="Temperature Trend"
                                    data={vitalsHistory}
                                    dataKey="temperature"
                                    unit="°C"
                                    color="#f59e0b"
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'labs' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-semibold text-slate-800">Recent Lab Results</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {patient.recentLabs?.length > 0 ? (
                                    patient.recentLabs.map((lab, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="font-medium text-slate-800">{lab.testName}</p>
                                                <p className="text-xs text-slate-500">{new Date(lab.timestamp).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${lab.isAbnormal ? 'text-rose-600' : 'text-slate-700'}`}>
                                                    {lab.value}
                                                </p>
                                                {lab.isAbnormal && <span className="text-xs text-rose-500 font-medium">Abnormal</span>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400">No recent lab results found.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'meds' && (
                        <div className="space-y-6">
                            {/* Prescribe Medication Form */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                <h3 className="font-semibold text-slate-800 mb-3">Prescribe Medication</h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const data = {
                                        drugName: formData.get('drugName'),
                                        dosage: formData.get('dosage'),
                                        frequency: formData.get('frequency'),
                                        route: formData.get('route'),
                                        prescribedBy: user?._id // Passing user ID if available
                                    };

                                    try {
                                        await api.post(`/api/patients/${id}/medications`, data);
                                        e.target.reset();
                                        fetchPatientData();
                                    } catch (err) {
                                        console.error("Failed to add medication", err);
                                        alert("Failed to prescribe medication");
                                    }
                                }}>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                        <input name="drugName" placeholder="Drug Name (e.g. Aspirin)" required className="p-2 border rounded-lg text-sm" />
                                        <input name="dosage" placeholder="Dosage (e.g. 500mg)" required className="p-2 border rounded-lg text-sm" />
                                        <select name="frequency" required className="p-2 border rounded-lg text-sm">
                                            <option value="">Frequency</option>
                                            <option value="Daily">Daily</option>
                                            <option value="BID">BID (2x/day)</option>
                                            <option value="TID">TID (3x/day)</option>
                                            <option value="QID">QID (4x/day)</option>
                                            <option value="Every 4 hours">Every 4 hours</option>
                                            <option value="PRN">PRN (As needed)</option>
                                        </select>
                                        <select name="route" required className="p-2 border rounded-lg text-sm">
                                            <option value="">Route</option>
                                            <option value="Oral">Oral</option>
                                            <option value="IV">IV</option>
                                            <option value="IM">IM</option>
                                            <option value="Subcutaneous">Subcutaneous</option>
                                            <option value="Topical">Topical</option>
                                            <option value="Inhalation">Inhalation</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                                            Prescribe
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-semibold text-slate-800">Active Medications</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {patient.activeMedications?.length > 0 ? (
                                        patient.activeMedications.map((med, idx) => (
                                            <div key={idx} className="p-4 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                        <Pill size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{med.drugName}</p>
                                                        <p className="text-sm text-slate-500">{med.dosage} • {med.frequency}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                                                        Active
                                                    </span>
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm("Delete this medication?")) return;
                                                            try {
                                                                await api.delete(`/api/medications/${med._id}`);
                                                                fetchPatientData();
                                                            } catch (err) {
                                                                console.error("Failed to delete medication", err);
                                                            }
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Delete Medication"
                                                    >
                                                        <LogOut size={14} className="rotate-180" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-400">No active medications.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-6">
                            {/* Add Note Form */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                <h3 className="font-semibold text-slate-800 mb-3">Add Progress Note</h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const note = e.target.note.value;
                                    if (!note) return;
                                    try {
                                        await api.post(`/api/patients/${id}/notes`, {
                                            content: note,
                                            author: user?.name || 'Dr. AI'
                                        });
                                        e.target.reset();
                                        fetchPatientData(); // Refresh to see new note
                                    } catch (err) {
                                        console.error("Failed to add note", err);
                                    }
                                }}>
                                    <textarea
                                        name="note"
                                        placeholder="Type a clinical note..."
                                        className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-3 text-sm min-h-[100px]"
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                                            Save Note
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Notes List */}
                            <div className="space-y-4">
                                {patient.notes && patient.notes.length > 0 ? (
                                    [...patient.notes].reverse().map((note, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                        {note.author?.charAt(0) || 'D'}
                                                    </div>
                                                    <span className="font-medium text-slate-900 text-sm">{note.author}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(note.timestamp).toLocaleString()}
                                                    </span>
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm("Delete this note?")) return;
                                                            try {
                                                                await api.delete(`/api/patients/${id}/notes/${note._id}`);
                                                                fetchPatientData();
                                                            } catch (err) {
                                                                console.error("Failed to delete note", err);
                                                            }
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete Note"
                                                    >
                                                        <LogOut size={14} className="rotate-180" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm whitespace-pre-line pl-10">
                                                {note.content}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        No clinical notes recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'care' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-semibold text-slate-800">Care Team</h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {patient.careTeam?.length > 0 ? (
                                    patient.careTeam.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                {member.staffId?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{member.staffId?.name || 'Unknown Staff'}</p>
                                                <p className="text-xs text-slate-500">{member.role} • {member.staffId?.specialization || 'General'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-slate-400 py-4">No care team assigned.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar: AI Intelligence */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Brain className="text-indigo-600" size={24} />
                            <h3 className="text-lg font-bold text-slate-800">AI Risk Analysis</h3>
                        </div>

                        <div className="mb-6 text-center">
                            <div className={`text-5xl font-bold ${riskColor} mb-2`}>
                                {riskScore}<span className="text-2xl text-slate-300">/100</span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Risk Score</p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Sepsis Risk</span>
                                    <span className="font-semibold text-slate-800">{patient.aiAnalysis?.riskFactors?.sepsisScore || 0}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${patient.aiAnalysis?.riskFactors?.sepsisScore || 0}%` }}></div>
                                </div>

                                <div className="flex justify-between text-sm mt-3">
                                    <span className="text-slate-600">Deterioration Index</span>
                                    <span className="font-semibold text-slate-800">{patient.aiAnalysis?.riskFactors?.deteriorationIndex || 0}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${patient.aiAnalysis?.riskFactors?.deteriorationIndex || 0}%` }}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Insights</h4>
                                {patient.aiAnalysis?.explanation ? (
                                    <div className="text-sm text-slate-700 bg-indigo-50 p-3 rounded-lg leading-relaxed whitespace-pre-line">
                                        {patient.aiAnalysis.explanation}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic">
                                        AI analysis indicates {patient.status.toLowerCase()} condition.
                                        {riskScore > 50 ? " strict monitoring recommended." : " routine monitoring sufficient."}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className="text-teal-400" size={20} />
                            <h3 className="font-semibold">AI Prediction</h3>
                        </div>

                    </div>
                    <p className="text-slate-300 text-sm mb-4">
                        Based on current vitals trends, the AI predicts a <span className="text-white font-bold">{patient.aiAnalysis?.predictions?.[0]?.probability > 50 ? 'High' : 'Low'}</span> probability of {patient.aiAnalysis?.predictions?.[0]?.type || 'deterioration'} in the next 4 hours.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={12} />
                        Last updated: {patient.aiAnalysis?.lastUpdated ? new Date(patient.aiAnalysis.lastUpdated).toLocaleTimeString() : 'Just now'}
                    </div>
                </div>
            </div>
            <EditPatientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                patient={patient}
                onPatientUpdated={fetchPatientData}
            />

            {/* AI Chat Modal */}
            {isAiChatOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsAiChatOpen(false)}
                            className="absolute right-4 top-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"
                        >
                            <X size={20} className="text-slate-600" />
                        </button>
                        <div className="p-1">
                            <AIChatInterface
                                patientId={id}
                                patientName={patient.name}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

const VitalCard = ({ label, value, unit }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <p className="text-xs text-slate-500 uppercase font-bold mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800">
            {value} <span className="text-sm font-normal text-slate-400">{unit}</span>
        </p>
    </div>
);

export default PatientDetail;
