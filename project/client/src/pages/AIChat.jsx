import React, { useState, useEffect } from 'react';
import AIChatInterface from '../components/ai/AIChatInterface';
import api from '../utils/api';
import { Users } from 'lucide-react';

const AIChat = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');

    useEffect(() => {
        // Force refresh log
        console.log("AIChat Component Mounted - Fetching Patients");
        const fetchPatients = async () => {
            try {
                const data = await api.get('/api/patients');
                setPatients(data);
            } catch (err) {
                console.error("Failed to fetch patients", err);
            }
        };
        fetchPatients();
    }, []);

    const selectedPatient = patients.find(p => p._id === selectedPatientId);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">AI Clinical Assistant</h2>
                    <p className="text-slate-500">Ask questions about patient history, risk factors, or medical guidelines.</p>
                </div>

                <div className="w-full md:w-72">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                        Select Patient Context
                    </label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none"
                        >
                            <option value="">General Inquiry (No Context)</option>
                            {patients.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.name} (Room {p.room})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <AIChatInterface
                patientId={selectedPatientId}
                patientName={selectedPatient?.name}
            />
        </div>
    );
};

export default AIChat;
