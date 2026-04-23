import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

const AIChatInterface = ({ patientId, patientName }) => {
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            text: patientName
                ? `Hello. I am reviewing the file for **${patientName}**. I can analyze their risks, vitals, and lab results. What would you like to know?`
                : 'Hello, I am MedIntel AI. I can assist with patient inquiries, risk analysis, and operational status. How can I help?'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Reset chat when switching patients
    useEffect(() => {
        if (patientId && patientName) {
            setMessages([{
                role: 'ai',
                text: `Context switched to **${patientName}**. I am ready to answer clinical questions based on their latest data.`
            }]);
        }
    }, [patientId, patientName]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Direct fetch to backend
            const res = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMsg,
                    patientId: patientId || null
                })
            });
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Connection Error: Ensure backend is running.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">MedIntel Assistant</h3>
                        <p className="text-xs text-slate-500">Local Inference Engine • Offline Capable</p>
                    </div>
                </div>
                {patientName && (
                    <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full flex items-center gap-2 animate-in fade-in">
                        <User size={12} />
                        Context: {patientName}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                            ? 'bg-medical-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none'
                            }`}>
                            {/* Markdown-like rendering could go here */}
                            {/* Markdown-like rendering */}
                            <div className="text-sm space-y-2">
                                {msg.text.split('\n').map((line, i) => {
                                    // Header
                                    if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-base mt-2">{line.replace('### ', '')}</h4>;

                                    // Bullet point
                                    if (line.trim().startsWith('- ')) {
                                        return (
                                            <div key={i} className="flex gap-2 ml-2">
                                                <span className="text-slate-400">•</span>
                                                <span>
                                                    {line.replace('- ', '').split(/(\*\*.*?\*\*)/).map((part, j) =>
                                                        part.startsWith('**') && part.endsWith('**')
                                                            ? <strong key={j}>{part.slice(2, -2)}</strong>
                                                            : part
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    }

                                    // Blockquote
                                    if (line.startsWith('> ')) {
                                        return (
                                            <div key={i} className="border-l-4 border-indigo-200 pl-3 py-1 my-1 italic text-slate-600 bg-slate-50/50 rounded-r">
                                                {line.replace('> ', '')}
                                            </div>
                                        );
                                    }

                                    // Standard paragraph with bold support
                                    if (line.trim() === '') return <div key={i} className="h-2" />;

                                    return (
                                        <p key={i}>
                                            {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                                                part.startsWith('**') && part.endsWith('**')
                                                    ? <strong key={j}>{part.slice(2, -2)}</strong>
                                                    : part
                                            )}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-2xl p-4 rounded-bl-none flex items-center gap-2">
                            <Loader2 className="animate-spin text-slate-400" size={16} />
                            <span className="text-xs text-slate-400">Processing vitals & medical context...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about patient risk, vitals, or status..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500/20 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700 disabled:opacity-50 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatInterface;
