"use client";
import { useState, useEffect } from "react";
import { 
    Users, 
    AlertTriangle, 
    ShieldCheck, 
    Activity, 
    Video, 
    Camera, 
    CameraOff, 
    Power, 
    X,
    Shield,
    Siren,
    Clock,
    Zap,
    Radio,
    CheckCircle2,
    Megaphone,
    Send,
    BarChart3,
    ArrowRight,
    Map as MapIcon,
    Search
} from "lucide-react";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
    const [role, setRole] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setRole(localStorage.getItem("role"));
        setMounted(true);
    }, []);
    const [activeAlert, setActiveAlert] = useState<any | null>(null);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sirenPlaying, setSirenPlaying] = useState(false);
    const [sirenAudio, setSirenAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio("/siren.mp3");
        audio.loop = true;
        setSirenAudio(audio);
        return () => {
            audio.pause();
        };
    }, []);

    const trendData = [
        { name: '08:00', density: 40, risk: 10 },
        { name: '10:00', density: 120, risk: 30 },
        { name: '12:00', density: 450, risk: 85 },
        { name: '14:00', density: 380, risk: 60 },
        { name: '16:00', density: 520, risk: 95 },
        { name: '18:00', density: 200, risk: 40 },
    ];

    const distributionData = [
        { zone: 'Main Square', count: 450 },
        { zone: 'Gate A', count: 120 },
        { zone: 'Gate B', count: 85 },
        { zone: 'Terminal 1', count: 310 },
        { zone: 'Exit Hall', count: 45 },
    ];

    const handleAction = async (id: string, action: string) => {
        try {
            // Requirement 3 & 6: Sync status with Central Backend
            const res = await fetch(`https://crowd-monitoring-alerts.onrender.com/api/alerts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action })
            });

            if (res.ok) {
                // If resolved, we also log it as a persistent record in Python backend (Requirement 6 & 9)
                if (action === 'Resolved') {
                    const token = localStorage.getItem("access_token");
                    const alertDetail = (incidents as any[]).find(i => i.id === id);
                    await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/emergency/action', {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify({ 
                            alert_id: id, 
                            action: "UNIT_DEPLOYED",
                            location: alertDetail?.location,
                            details: `RESOLVED: ${alertDetail?.behavior}`
                        })
                    });
                }
                
                // Refresh local UI state (Requirement 7)
                setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: action } : inc));
                alert(`System synchronized: Incident ${action.toLowerCase()}`);
            }
        } catch (err) {
            console.error("Central backend sync failure:", err);
        }
    };

    const handleSiren = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/emergency/siren', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                if (sirenAudio) {
                    sirenAudio.play().catch(e => console.error("Audio playback failed:", e));
                    setSirenPlaying(true);
                }
                alert("EMERGENCY SIREN ACTIVATED");
            }
        } catch (err) { alert("Failed to trigger siren"); }
    };

    const stopSiren = () => {
        if (sirenAudio) {
            sirenAudio.pause();
            sirenAudio.currentTime = 0;
            setSirenPlaying(false);
        }
    };

    const handleBroadcast = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/emergency/broadcast', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: "Emergency evacuation protocol initiated. Please follow staff instructions." })
            });
            if (res.ok) alert("Emergency broadcast message sent to all units.");
        } catch (err) { alert("Failed to send broadcast"); }
    };

    const [data, setData] = useState([
        { time: "10:00", count: 20 },
        { time: "10:05", count: 45 },
        { time: "10:10", count: 85 },
        { time: "10:15", count: 120 },
        { time: "10:20", count: 95 },
        { time: "10:25", count: 180 },
        { time: "10:30", count: 210 },
    ]);

    const [stats, setStats] = useState({
        count: 0,
        unique_count: 0,
        avg_speed: 0,
        trend: "Stable",
        spike_detected: false,
        zones: {} as Record<string, number>,
        model_used: "YOLOv8l",
        confidence_used: 0.4,
        density: "Low",
        behavior: "Normal",
        risk: "Normal",
        abnormal_count: 0,
        is_persistent: false
    });

    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isCctvModalOpen, setIsCctvModalOpen] = useState(false);
    const [cctvConfig, setCctvConfig] = useState({ url: "", user: "", password: "" });
    const [activeSource, setActiveSource] = useState<"webcam" | "cctv">("webcam");
    const [isConnecting, setIsConnecting] = useState(false);
    const [alertsHistory, setAlertsHistory] = useState<any[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [streamSource, setStreamSource] = useState<"backend" | "local">("backend");
    const [streamKey, setStreamKey] = useState(0);
    const [streamLoading, setStreamLoading] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);
    const [processedNotificationIds, setProcessedNotificationIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchCameraStatus = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) return;
            try {
                const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/camera/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsCameraOn(data.active);
                }
            } catch (err) {
                console.debug("Camera status check failed.");
            }
        };

        const fetchStats = async () => {
            const token = localStorage.getItem("access_token");
            if (!token || token === "null" || token === "undefined") {
                window.location.href = "/";
                return;
            }

            try {
                const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    localStorage.clear();
                    window.location.href = "/";
                    return;
                }

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const result = await res.json();
                setStats(prev => ({ ...prev, ...result }));

                const now = new Date();
                const istTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
                setData(prev => {
                    const newData = [...prev, { time: istTime, count: result.unique_count || result.count }];
                    return newData.slice(-15);
                });

                if (result.latest_notification) {
                    const notif = result.latest_notification;
                    setProcessedNotificationIds(prev => {
                        if (!prev.has(notif.id)) {
                            // Automatically add to toasts
                            setToasts(t => [...t, ...notif.messages.map((m: string) => ({ id: Math.random().toString(), message: m, time: Date.now() }))]);
                            
                            // Auto dismiss
                            setTimeout(() => {
                                setToasts(t => t.filter(toast => Date.now() - toast.time < 5000));
                            }, 5000);
                            
                            const newSet = new Set(prev);
                            newSet.add(notif.id);
                            return newSet;
                        }
                        return prev;
                    });
                }
            } catch (err) {
                console.debug("Failed to fetch stats.");
            }
        };

        const fetchHistory = async () => {
            const token = localStorage.getItem("access_token");
            if (!token || token === "null" || token === "undefined") return;

            try {
                const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    localStorage.clear();
                    window.location.href = "/";
                    return;
                }

                if (res.ok) {
                    const data = await res.json();
                    setAlertsHistory(data);
                }
            } catch (err) {
                console.debug("Failed to fetch history.");
            }
        };

        // Requirement 4 & 5: Real-time Authority Alert Fetching (Synchronized)
        const fetchCentralAlerts = async () => {
            if (localStorage.getItem('role') !== 'Authority') return;
            try {
                const res = await fetch("https://crowd-monitoring-alerts.onrender.com/api/alerts");
                if (res.ok) {
                    const alertsData = await res.json();
                    console.info(`[SYSTEM-SYNC] ${new Date().toLocaleTimeString()} • Polled ${alertsData.length} alerts.`); 
                    setIncidents(alertsData);
                    setLoading(false);
                }
            } catch (err) {
                console.debug("Central alerts polling offline");
            }
        };

        const interval = setInterval(fetchStats, 2000);
        const historyInterval = setInterval(fetchHistory, 5000);
        const centralInterval = setInterval(fetchCentralAlerts, 3000); // 3s Polling (Requirement 4)

        fetchCameraStatus();
        fetchStats();
        fetchHistory();
        fetchCentralAlerts();

        return () => {
            clearInterval(interval);
            clearInterval(historyInterval);
            clearInterval(centralInterval);
        };
    }, []);

    const toggleCamera = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/camera/toggle', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ active: !isCameraOn })
            });

            if (res.ok) {
                const data = await res.json();
                setIsCameraOn(data.active);
                if (!data.active && localStream) {
                    localStream.getTracks().forEach(t => t.stop());
                    setLocalStream(null);
                }
            }
        } catch (err) {
            console.error("Failed to toggle camera.");
        }
    };

    const handleCctvConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("access_token");
        if (!token) return;
        setIsConnecting(true);

        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/camera/source', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: "cctv",
                    url: cctvConfig.url,
                    user: cctvConfig.user,
                    password: cctvConfig.password
                })
            });

            if (res.ok) {
                setActiveSource("cctv");
                setIsCctvModalOpen(false);
                if (!isCameraOn) toggleCamera();
            }
        } catch (err) {
            console.error("Failed to connect CCTV.");
        } finally {
            setIsConnecting(false);
        }
    };

    const switchSource = async (source: "webcam" | "cctv") => {
        if (source === "webcam") {
            const token = localStorage.getItem("access_token");
            try {
                await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/camera/source', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source: "webcam" })
                });
                setActiveSource("webcam");
            } catch (err) { console.error(err); }
        } else {
            setIsCctvModalOpen(true);
        }
    };

    if (!mounted) return null;

    if (role === 'Authority') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header / Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-400 flex items-center justify-center text-white shadow-lg shadow-slate-100 ring-4 ring-slate-50">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Public Security Command Center</h1>
                            <p className="text-slate-500 text-sm font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                Official Authority Access • CS-AI INFRASTRUCTURE
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Active Critical Alerts", val: incidents.filter(i => i.risk === 'Critical' && i.status !== 'Resolved').length, icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50" },
                        { label: "People Count", val: stats.unique_count || 0, icon: Users, color: "text-slate-600", bg: "bg-slate-100" },
                        { label: "Current Density", val: stats.density, icon: Activity, color: "text-slate-500", bg: "bg-slate-50" },
                        { label: "System Risk Level", val: stats.risk, icon: ShieldCheck, color: "text-slate-600", bg: "bg-slate-100" },
                    ].map((stat, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-5"
                            style={{boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{backgroundColor: stat.bg === 'bg-red-50' ? '#fef2f2' : '#e0f2fe'}}>
                                <stat.icon className="w-6 h-6" style={{color: stat.color.includes('red') ? '#dc2626' : '#2563eb'}} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                <p className="text-xl font-bold text-slate-900 leading-none">{stat.val}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Alerts and Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 text-slate-500" />
                                Predictive Crowd Flow & Risk Analysis
                            </h3>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorDen" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={{ stroke: '#f1f5f9' }} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6b7280'}} dy={10} />
                                        <YAxis axisLine={{ stroke: '#f1f5f9' }} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6b7280'}} dx={-10} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: '700' }} />
                                        <Area type="monotone" dataKey="density" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDen)" />
                                        <Area type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <MapIcon className="w-5 h-5 text-slate-500" />
                                Regional Incident Distribution
                            </h3>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={distributionData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="zone" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#475569'}} width={100} />
                                        <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Live Critical Feed */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col h-[550px]">
                            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 flex items-center gap-3 text-sm">
                                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                                    Live Alerts Panel • {incidents.length} Active System-wide
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {(incidents as any[]).map((inc) => (
                                    <div key={inc.id} className={`p-5 rounded-xl border shadow-sm transition-all ${inc.risk === 'Critical' ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${inc.risk === 'Critical' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'}`}>
                                                {inc.risk || 'Warning'}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {inc.timestamp?.includes('T') ? new Date(inc.timestamp).toLocaleTimeString() : inc.timestamp}
                                            </span>
                                        </div>
                                        <h4 className="text-slate-800 font-bold text-sm mb-1">{inc.location}</h4>
                                        <div className="flex items-center gap-3 mb-4">
                                            <p className="text-slate-500 text-xs font-semibold flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {inc.count} Detected
                                            </p>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <p className="text-slate-500 text-xs font-semibold">{inc.behavior}</p>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1 font-mono">Status: {inc.status}</div>
                                            <div className="flex gap-2">
                                                {inc.status === 'Resolved' ? (
                                                    <div className="flex-1 text-center py-2 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="w-3 h-3" /> Incident Resolved
                                                    </div>
                                                ) : (
                                                    <>
                                                        {inc.status !== 'Acknowledged' && (
                                                            <button 
                                                                onClick={() => handleAction(inc.id, 'Acknowledged')} 
                                                                className="flex-1 bg-slate-800 text-white text-[10px] font-bold py-2.5 rounded-lg hover:bg-slate-700 transition-all shadow-sm"
                                                            >
                                                                Acknowledge
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleAction(inc.id, 'Resolved')} 
                                                            className="flex-1 bg-white border-2 border-slate-200 text-slate-700 text-[10px] font-bold py-2.5 rounded-lg hover:border-red-200 hover:bg-red-50/30 transition-all shadow-sm"
                                                        >
                                                            Deploy Unit
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {incidents.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60 py-20">
                                        <ShieldCheck className="w-12 h-12 stroke-[1px]" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No Alerts Detected</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Protocols */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 text-sm flex items-center gap-3">
                                <Zap className="w-4 h-4 text-yellow-500" /> Emergency Protocols
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {sirenPlaying ? (
                                    <button onClick={stopSiren} className="p-4 bg-red-50 text-red-500 border border-red-200 rounded-xl flex flex-col items-center gap-2 hover:bg-red-100 transition-all shadow-sm">
                                        <div className="relative">
                                            <Siren className="w-5 h-5 animate-pulse" />
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase">Stop Siren</span>
                                    </button>
                                ) : (
                                    <button onClick={handleSiren} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 hover:bg-yellow-50 hover:text-yellow-600 transition-all group">
                                        <Siren className="w-5 h-5 text-slate-400 group-hover:text-yellow-500" />
                                        <span className="text-[10px] font-bold uppercase text-slate-600 group-hover:text-yellow-600">Activate Siren</span>
                                    </button>
                                )}
                                <button onClick={handleBroadcast} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 hover:bg-yellow-50 hover:text-yellow-600 transition-all group">
                                    <Megaphone className="w-5 h-5 text-slate-400 group-hover:text-yellow-500" />
                                    <span className="text-[10px] font-bold uppercase text-slate-600 group-hover:text-yellow-600">Send Broadcast</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-500" /> Incident Audit Log
                    </h3>
                    <div className="space-y-4">
                        {incidents.slice(0, 5).map(log => (
                            <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-yellow-50 text-yellow-500 flex items-center justify-center rounded-lg text-xs font-bold">{log.location[0]}</div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">{log.location} - {log.behavior}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{log.timestamp}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.risk === 'Critical' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-yellow-50 text-yellow-500 border border-yellow-100'}`}>
                                    {log.risk}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-slate-800">System Monitoring Overview</h1>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Live Telemetry • {mounted ? new Date().toLocaleDateString() : ""}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md" style={{boxShadow: '0 4px 20px rgba(0,0,0,0.03)'}}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">IN FRAME</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.count} Persons</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md" style={{boxShadow: '0 4px 20px rgba(0,0,0,0.03)'}}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 text-red-600 border border-red-100/50">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">ABNORMAL EVENTS</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.abnormal_count || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md" style={{boxShadow: '0 4px 20px rgba(0,0,0,0.03)'}}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">BEHAVIOR</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.behavior}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md" style={{boxShadow: '0 4px 20px rgba(0,0,0,0.03)'}}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">RISK LEVEL</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.risk}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Feed */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Video className="w-4 h-4 text-slate-500" />
                                Visual Analytics Stream
                            </h2>
                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button onClick={() => switchSource("webcam")} className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${activeSource === "webcam" ? "bg-white shadow-sm" : ""}`} style={activeSource === "webcam" ? {color: '#2563eb'} : {color: '#6b7280'}}>Local</button>
                                <button onClick={() => switchSource("cctv")} className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${activeSource === "cctv" ? "bg-white shadow-sm" : ""}`} style={activeSource === "cctv" ? {color: '#2563eb'} : {color: '#6b7280'}}>CCTV</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${isCameraOn ? "bg-yellow-50 text-yellow-600 border-yellow-100" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isCameraOn ? "bg-yellow-500" : "bg-slate-300"}`}></div>
                                {isCameraOn ? "ACTIVE" : "STANDBY"}
                            </div>
                            <button onClick={toggleCamera} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isCameraOn ? "bg-red-50 border border-red-100" : ""}`} style={isCameraOn ? {color: '#b91c1c'} : {backgroundColor: '#334155', color: '#ffffff'}}>
                                {isCameraOn ? "Terminate" : "Initialize"}
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-100 aspect-video flex items-center justify-center relative border-t border-b border-slate-200">
                        {isCameraOn ? (
                            <img
                                key={streamKey}
                                src={`https://crowd-monitoring-behaviour-analysis.onrender.com/api/video_feed?token=${localStorage.getItem('access_token')}`}
                                alt="Detection Feed"
                                className="w-full h-full object-contain mix-blend-multiply"
                                onError={() => setTimeout(() => setStreamKey(k => k + 1), 2000)}
                            />
                        ) : (
                            <div className="text-center space-y-4">
                                <CameraOff className="w-12 h-12 text-slate-300 mx-auto" />
                                <p className="text-slate-400 text-sm font-medium">Vision system is currently offline</p>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md text-slate-800 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded border border-white">
                            Source: {activeSource.toUpperCase()} • Mode: DETECT_COUNT
                        </div>
                    </div>
                </div>

                {/* Right Side Info */}
                <div className="space-y-6 flex flex-col">
                    {/* Graph */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-yellow-500" />
                            Crowd Intensity
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickMargin={8} axisLine={{ stroke: '#f1f5f9' }} tickLine={{ stroke: '#f1f5f9' }} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickMargin={8} axisLine={{ stroke: '#f1f5f9' }} tickLine={{ stroke: '#f1f5f9' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 2, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#0f172a' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Alert Log */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                Incident Log
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[240px] divide-y divide-slate-50">
                            {alertsHistory.length > 0 ? alertsHistory.map((alert) => (
                                <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${alert.risk === 'Critical' ? 'text-red-500' : 'text-yellow-500'}`}>{alert.risk}: {alert.behavior}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{alert.timestamp.split(' ')[1]}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-tight">Sector: {alert.location} • Count: {alert.count}</p>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Recent Incidents</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RTSP Modal */}
            {isCctvModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 p-8 rounded-2xl w-full max-w-sm shadow-xl relative">
                        <button onClick={() => setIsCctvModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">CCTV Configuration</h3>
                        <p className="text-slate-500 text-sm mb-6">Enter RTSP stream details</p>
                        <form onSubmit={handleCctvConnect} className="space-y-4">
                            <input type="text" placeholder="rtsp://url:554/stream" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm outline-none focus:border-slate-500" value={cctvConfig.url} onChange={(e) => setCctvConfig({ ...cctvConfig, url: e.target.value })} required />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Username" className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm outline-none" value={cctvConfig.user} onChange={(e) => setCctvConfig({ ...cctvConfig, user: e.target.value })} />
                                <input type="password" placeholder="Password" className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm outline-none" value={cctvConfig.password} onChange={(e) => setCctvConfig({ ...cctvConfig, password: e.target.value })} />
                            </div>
                            <button type="submit" disabled={isConnecting} className="w-full font-bold py-3 rounded-xl disabled:opacity-50 transition-all" style={{backgroundColor: '#0f172a', color: '#ffffff'}}>
                                {isConnecting ? "Establishing Link..." : "Link CCTV Node"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        {/* Toast Notifications */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className="bg-white p-4 rounded-2xl flex items-start gap-4 max-w-sm w-full relative overflow-hidden border border-slate-100"
                        style={{borderLeft: '4px solid #2563eb', boxShadow: '0 10px 30px rgba(0,0,0,0.08)'}}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                            <motion.div 
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="h-full bg-slate-400"
                            />
                        </div>
                        <div className="bg-slate-50 text-slate-600 p-2 rounded-lg mt-1">
                            <Send className="w-5 h-5" />
                        </div>
                        <div className="flex-1 mt-1">
                            <h4 className="text-sm font-bold text-slate-800">Notification Sent</h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{toast.message}</p>
                        </div>
                        <button 
                            onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))}
                            className="text-slate-400 hover:text-slate-600 mt-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
        </div>
    );
}
