"use client";
import { useState, useEffect } from "react";
import { Settings, Shield, Bell, Cpu, Save, RefreshCw } from "lucide-react";

export default function SettingsPage() {
    const [config, setConfig] = useState({
        confidence: 0.35,
        iou: 0.45,
        model: "YOLOv8n",
        low_density_threshold: 50,
        high_density_threshold: 150,
        alerts_email: false,
        alerts_sms: false,
        sms_phone: "",
        report_email: ""
    });

    const [modalConfig, setModalConfig] = useState({
        type: null as 'sms' | 'email' | null,
        value: ""
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    
    // Add toast state for alert testing overrides
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const res = await fetch("https://crowd-monitoring-behaviour-analysis.onrender.com/api/settings", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setConfig(prev => ({ ...prev, ...data }));
                } else {
                    setError("Failed to fetch settings.");
                }
            } catch (err) {
                setError("Error connecting to server.");
            } finally {
                setFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch("https://crowd-monitoring-behaviour-analysis.onrender.com/api/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    confidence: config.confidence,
                    iou: config.iou,
                    low_density_threshold: config.low_density_threshold,
                    high_density_threshold: config.high_density_threshold,
                    alerts_email: config.alerts_email,
                    alerts_sms: config.alerts_sms,
                    sms_phone: config.sms_phone,
                    report_email: config.report_email
                })
            });

            if (res.ok) {
                setMessage("Configuration saved successfully.");
                setTimeout(() => setMessage(""), 3000);
            } else {
                setError("Failed to save settings.");
            }
        } catch (err) {
            setError("Server connection failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleTestAlert = async (type: 'sms' | 'email') => {
        try {
            // Requirement 9: Node Backend runs on 5000. Python API moved to 5001.
            const url = `https://crowd-monitoring-behaviour-analysis.onrender.com/api/send-${type}`;
            const timestamp = new Date().toLocaleString();
            
            const payload = type === 'sms' 
                ? { to: config.sms_phone, location: "Admin Dashboard", camera: "Test Camera", count: "TEST", risk: "Critical (Test)", timestamp }
                : { to: config.report_email, location: "Admin Dashboard", timestamp, count: "TEST", risk: "Critical (Test)" };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                // Requirement 8: Display status messages
                setToast({ message: data.message || `${type.toUpperCase()} Sent Successfully`, type: 'success' });
            } else {
                setToast({ message: data.message || `${type.toUpperCase()} Failed`, type: 'error' });
            }
            setTimeout(() => setToast(null), 4000);
        } catch (err) {
            setToast({ message: "Alert Server connectivity issue", type: 'error' });
            setTimeout(() => setToast(null), 4000);
        }
    };

    if (fetching) {
        return <div className="p-8 text-center text-slate-500 font-bold">Loading System Settings...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{backgroundColor: '#0f172a'}}>
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Configure AI parameters and notification preferences.</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                    style={{backgroundColor: '#0f172a'}}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e293b')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0f172a')}
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {message && (
                <div className="bg-blue-50 border border-blue-100 px-5 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold mb-6" style={{color: '#2563eb'}}>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    {message}
                </div>
            )}

            {toast && (
                <div className={`fixed bottom-8 right-8 z-50 px-6 py-3.5 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-2xl animate-in slide-in-from-bottom border ${toast.type === 'success' ? '' : ''}`}
                    style={toast.type === 'success' ? {backgroundColor: '#ffffff', borderColor: '#e0f2fe', color: '#2563eb'} : {backgroundColor: '#ffffff', borderColor: '#fee2e2', color: '#dc2626'}}>
                    <div className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.4)]'}`}></div>
                    {toast.message}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-lg flex items-center gap-3 text-sm font-semibold mb-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Configuration */}
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Cpu className="w-5 h-5 text-slate-500" />
                        AI Recognition Engine
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-slate-700">Detection Confidence</label>
                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold border border-slate-200">{(config.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range" min="0.1" max="0.9" step="0.05"
                                value={config.confidence}
                                onChange={(e) => setConfig({ ...config, confidence: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                                <span>Sensitive (0.1)</span>
                                <span>Strict (0.9)</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-slate-700">IOU Tracking Overlap Limit</label>
                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold border border-slate-200">{(config.iou * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range" min="0.1" max="0.9" step="0.05"
                                value={config.iou}
                                onChange={(e) => setConfig({ ...config, iou: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                                <span>Overlap (0.1)</span>
                                <span>Unique (0.9)</span>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-8 mb-6 border-t border-slate-100 pt-6">
                        <Shield className="w-5 h-5 text-yellow-500" />
                        Crowd Density Thresholds
                    </h3>

                    <div className="space-y-5">
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Moderate Density Start</label>
                                <input
                                    type="number"
                                    value={config.low_density_threshold}
                                    onChange={(e) => setConfig({ ...config, low_density_threshold: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 text-sm transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">High / Crowded Alert</label>
                                <input
                                    type="number"
                                    value={config.high_density_threshold}
                                    onChange={(e) => setConfig({ ...config, high_density_threshold: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none font-bold text-slate-800 text-sm transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm h-min">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-yellow-400" />
                            Alert Preferences
                        </h3>
                        <button 
                            onClick={async () => {
                                await handleTestAlert('sms');
                                await handleTestAlert('email');
                            }}
                            className="px-4 py-1.5 bg-slate-800 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-slate-700 transition-all shadow-sm"
                        >
                            Test All Alerts
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* SMS Alerts Section */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg border ${config.alerts_sms ? 'bg-yellow-50 text-yellow-500 border-yellow-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">SMS Notifications</p>
                                        <p className="text-xs text-slate-500 font-medium">Emergency text alerts for critical events</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setConfig({ ...config, alerts_sms: !config.alerts_sms })}
                                    className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${config.alerts_sms ? 'bg-slate-400' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${config.alerts_sms ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            
                            {config.alerts_sms && (
                                <div className="space-y-4 animate-in slide-in-duration-200">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">Alert Phone Number</label>
                                        <input
                                            type="tel"
                                            value={config.sms_phone}
                                            onChange={(e) => setConfig({ ...config, sms_phone: e.target.value })}
                                            placeholder="+91 98765 43210"
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 outline-none font-medium text-slate-700 text-sm shadow-sm"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleTestAlert('sms')}
                                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded text-slate-600 text-xs font-bold uppercase transition-colors"
                                    >
                                        Test SMS Alert
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Email Reports Section */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg border ${config.alerts_email ? 'bg-yellow-50 text-yellow-500 border-yellow-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Email Reports</p>
                                        <p className="text-xs text-slate-500 font-medium">Daily incident summaries to Authority</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setConfig({ ...config, alerts_email: !config.alerts_email })}
                                    className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${config.alerts_email ? 'bg-slate-400' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${config.alerts_email ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            
                            {config.alerts_email && (
                                <div className="space-y-4 animate-in slide-in-duration-200">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">Alert Email Address</label>
                                        <input
                                            type="email"
                                            value={config.report_email}
                                            onChange={(e) => setConfig({ ...config, report_email: e.target.value })}
                                            placeholder="admin@example.com"
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 outline-none font-medium text-slate-700 text-sm shadow-sm"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleTestAlert('email')}
                                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded text-slate-600 text-xs font-bold uppercase transition-colors"
                                    >
                                        Test Email Report
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
