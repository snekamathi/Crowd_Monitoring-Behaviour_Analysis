"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    UploadCloud,
    History,
    Settings,
    LogOut,
    ShieldAlert,
    UserCircle,
    Users as UsersIcon,
    AlertCircle,
    Database,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
    { label: "Overview Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["Admin", "Operator", "Authority"] },
    { label: "Analyze Video", icon: UploadCloud, path: "/dashboard/upload", roles: ["Admin", "Operator"] },
    { label: "Incident History", icon: History, path: "/dashboard/history", roles: ["Admin", "Operator", "Authority"] },
    { label: "Dataset & AI Training", icon: Database, path: "/dashboard/dataset", roles: ["Admin"] },
    { label: "User Management", icon: UsersIcon, path: "/dashboard/users", roles: ["Admin"] },
    { label: "System Config", icon: Settings, path: "/dashboard/settings", roles: ["Admin"] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [role, setRole] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [activeAlert, setActiveAlert] = useState<any | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [statsResult, setStatsResult] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        const storedRole = localStorage.getItem("role");
        const storedUsername = localStorage.getItem("username");
        const token = localStorage.getItem("access_token");

        if (!token || token === "null" || token === "undefined") {
            window.location.href = "/";
            return;
        }

        setRole(storedRole);
        setUsername(storedUsername);

        const currentItem = menuItems.find(item => item.path === pathname);
        if (currentItem && storedRole && !currentItem.roles.includes(storedRole)) {
            window.location.href = "/dashboard";
        }

        // Global Alert Listener for Authority & Notifications for all
        const checkAlerts = async () => {
            try {
                const res = await fetch('http://localhost:5001/api/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const stats = await res.json();
                    setStatsResult(stats);
                    
                    if (storedRole === 'Authority') {
                        if (stats.risk === 'Critical') {
                            setActiveAlert({
                                risk: stats.risk,
                                behavior: stats.behavior,
                                count: stats.count
                            });
                        } else {
                            setActiveAlert(null);
                        }
                    }
                }
            } catch (err) { console.debug("Alert polling failed"); }
        };

        const interval = setInterval(checkAlerts, 3000);
        return () => clearInterval(interval);
    }, [pathname]);



    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    if (!mounted || !role) return (
        <div className="h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden font-sans" style={{backgroundColor: '#f8fafc', color: '#111827'}}>
            {/* Sidebar */}
            <aside className="w-64 flex flex-col z-30" style={{backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', boxShadow: '4px 0 12px rgba(0,0,0,0.02)'}}>
                <div className="h-16 flex items-center px-6 border-b" style={{borderColor: '#f1f5f9', backgroundColor: '#ffffff'}}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#0f172a'}}>
                            <ShieldAlert className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight" style={{color: '#0f172a'}}>CrowdSense</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{color: '#64748b'}}>Main Menu</p>
                    {menuItems.map((item) => (
                        item.roles.includes(role) && (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-r-xl text-sm font-semibold transition-all ${pathname === item.path
                                    ? ""
                                    : "hover:bg-slate-50"
                                    }`}
                                style={pathname === item.path
                                    ? {backgroundColor: '#e0f2fe', color: '#2563eb', borderLeft: '3px solid #2563eb'}
                                    : {color: '#334155'}}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        )
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all w-full text-left hover:bg-red-50"
                        style={{color: '#334155'}}
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out System
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden" style={{backgroundColor: '#f8fafc'}}>
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 z-20" style={{backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 4px 6px -4px rgba(0,0,0,0.05)'}}>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{backgroundColor: '#e0f2fe', color: '#2563eb', border: '1px solid #bae6fd'}}>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            Secure Session: {role}
                        </div>
                    </div>

                    <div className="flex items-center gap-5">


                        <div className="relative pl-5 border-l border-slate-200">
                            <button 
                                onClick={() => setShowProfileMenu(!showProfileMenu)} 
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-800 leading-none">{username}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">Status: Online</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                                    {username?.charAt(0).toUpperCase()}
                                </div>
                            </button>
                            
                            <AnimatePresence>
                                {showProfileMenu && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
                                    >
                                        <div className="p-2">
                                            <div className="px-3 py-2 text-xs text-slate-500 font-medium flex items-center justify-between">
                                                <span>Logged in as {role}</span>
                                                <button
                                                    onClick={() => setShowProfileMenu(false)}
                                                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-100"
                                                    aria-label="Close menu"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <hr className="border-slate-100 my-1" />
                                            {role === 'Admin' && (
                                                <button onClick={() => window.location.href = '/dashboard/settings'} className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                                    <Settings className="w-4 h-4" /> Account Settings
                                                </button>
                                            )}
                                            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                                                <LogOut className="w-4 h-4" /> Log Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-8 relative">
                    {children}
                    
                    {/* Global Emergency Toast for Authority */}
                    <AnimatePresence>
                        {activeAlert && (
                            <motion.div 
                                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                className="fixed bottom-8 right-8 z-[100] w-96 bg-white p-6 rounded-2xl overflow-hidden border border-red-100"
                                style={{boxShadow: '0 15px 50px rgba(0,0,0,0.15)'}}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <AlertCircle className="w-24 h-24" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center animate-pulse">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest opacity-80 leading-none mb-1">Emergency Dispatch</p>
                                            <p className="text-lg font-black text-red-600 leading-none">CRITICAL RISK DETECTED</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 mb-6">
                                        {activeAlert.behavior} anomalies detected in Sector A. {activeAlert.count} persons affected.
                                    </p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => (window.location.href = '/dashboard')}
                                            className="flex-1 font-bold py-2.5 rounded-xl text-xs transition-all"
                                            style={{backgroundColor: '#0f172a', color: '#ffffff'}}
                                        >
                                            View Incident Data
                                        </button>
                                        <button 
                                            onClick={() => setActiveAlert(null)}
                                            className="px-4 font-bold py-2.5 rounded-xl text-xs transition-all"
                                            style={{backgroundColor: '#f1f5f9', color: '#6b7280'}}
                                        >
                                            Acknowledge
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
