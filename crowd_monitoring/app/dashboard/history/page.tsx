"use client";
import { useState, useEffect } from "react";
import { Calendar, Search, Download, Filter, Eye, Activity, AlertTriangle, RefreshCw, X, Clock, MapPin, Shield, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
    id: number;
    timestamp: string;
    count: number;
    density: string;
    behavior: string;
    risk: string;
    location: string;
    status: string;
}

export default function AlertHistoryPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch("http://localhost:5001/api/history", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (err) {
            console.error("Fetch alerts failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleExport = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch("http://localhost:5001/api/history/export/csv", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `alert_history_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const filteredAlerts = alerts.filter(a =>
        a.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.behavior?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.risk?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Security Incident Archives</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Deep analysis log of all system detected anomalies.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchAlerts} className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handleExport} className="font-bold py-2 px-5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs text-white" style={{backgroundColor: '#0f172a'}}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e293b')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0f172a')}>
                        <Download className="w-4 h-4" />
                        Export Data
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" style={{boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter by location, behavior..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Records...</p>
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                            <AlertTriangle className="w-12 h-12 mb-4 opacity-10" />
                            <p className="font-bold text-sm">No historical records found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Status / Behavior</th>
                                    <th className="px-6 py-4">Risk Matrix</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAlerts.map((alert) => (
                                    <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">#{alert.id}</td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">{alert.timestamp}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">{alert.behavior}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-xl text-[10px] font-bold border inline-flex items-center gap-1.5 ${alert.risk === 'Critical' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${alert.risk === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                                {alert.risk}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-600">{alert.location}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedAlert(alert)}
                                                className="p-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-all shadow-sm"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <AnimatePresence>
                {selectedAlert && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Incident Analytics</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Record #{selectedAlert.id}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedAlert(null)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Timestamp
                                        </label>
                                        <p className="font-semibold text-slate-800">{selectedAlert.timestamp}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> Location
                                        </label>
                                        <p className="font-semibold text-slate-800">{selectedAlert.location}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Users className="w-3 h-3" /> Person Count
                                        </label>
                                        <p className="text-2xl font-bold text-slate-900">{selectedAlert.count} <span className="text-sm font-medium text-slate-500">Detected</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> Density
                                        </label>
                                        <p className="text-2xl font-bold text-blue-600">{selectedAlert.density}</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-6 items-center">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Behavior Signature</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            <p className="font-bold text-slate-800">{selectedAlert.behavior}</p>
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 ${selectedAlert.risk === 'Critical' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                        <AlertTriangle className="w-6 h-6 mb-1" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest leading-none mt-1">{selectedAlert.risk} RISK</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={() => setSelectedAlert(null)}
                                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
                                >
                                    Close Analytics
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
