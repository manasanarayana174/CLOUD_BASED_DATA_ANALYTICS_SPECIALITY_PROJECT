import React, { useState } from 'react';
import { X, UserPlus, Save, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const CreatePatientModal = ({ isOpen, onClose, onPatientCreated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Male',
        diagnosis: '',
        room: '',
        status: 'Stable'
    });
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validation
            if (!formData.name || !formData.age || !formData.diagnosis || !formData.room) {
                throw new Error("Please fill in all required fields");
            }

            const payload = {
                ...formData,
                vitals: {
                    heartRate: formData.status === 'Critical' ? 110 : 75,
                    bloodPressure: formData.status === 'Critical' ? '90/60' : '120/80',
                    spO2: formData.status === 'Critical' ? 92 : 98,
                    temperature: formData.status === 'Critical' ? 38.5 : 36.5,
                    respiratoryRate: formData.status === 'Critical' ? 22 : 16
                }
            };

            await api.post('/api/patients', payload);
            setLoading(false);
            onPatientCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <UserPlus size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Admit New Patient</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Full Name *</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Room Number *</label>
                            <input
                                name="room"
                                value={formData.room}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="ICU-04"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Age *</label>
                            <input
                                name="age"
                                type="number"
                                value={formData.age}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="45"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Diagnosis *</label>
                        <input
                            name="diagnosis"
                            value={formData.diagnosis}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="e.g. Acute Respiratory Distress"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Initial Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Stable', 'Moderate', 'Critical'].map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status })}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all
                                        ${formData.status === status
                                            ? status === 'Critical' ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500'
                                                : status === 'Moderate' ? 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500'
                                                    : 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Admit Patient
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePatientModal;
