"use client";
import { useState } from "react";
import { Mail, ShieldAlert, Cpu, ArrowLeft, CheckCircle, KeyRound, Eye, EyeOff, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Step = "email" | "newPassword" | "done";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>("email");
    const [resetToken, setResetToken] = useState("");

    /* ── Step 1: request reset token ── */
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await fetch("http://localhost:5001/api/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                // Extract token from debug_link e.g. ".../reset-password?token=<uuid>"
                const token = data.debug_link?.split("token=")[1] ?? "";
                setResetToken(token);
                setStep("newPassword");
            } else {
                setError(data.error || "Failed to verify account");
            }
        } catch {
            setError("Server connection failed");
        } finally {
            setLoading(false);
        }
    };

    /* ── Step 2: set new password ── */
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("http://localhost:5001/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: resetToken, password: newPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                setStep("done");
            } else {
                setError(data.error || "Failed to reset password");
            }
        } catch {
            setError("Server connection failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'}}>
            <div className="w-full max-w-[400px]">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#0f172a', boxShadow: '0 8px 16px rgba(15,23,42,0.15)'}}>
                        <KeyRound className="w-9 h-9 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{color: '#0f172a'}}>Identity Recovery</h1>
                    <p className="text-sm mt-1 font-medium" style={{color: '#6b7280'}}>Access Neural Protocol</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-[20px] overflow-hidden" style={{border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}}>
                    <div className="p-8">
                        {/* Error banner */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-sm font-medium"
                                >
                                    <ShieldAlert className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Step: done ── */}
                        {step === "done" ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Password Updated!</h2>
                                <p className="text-slate-500 text-sm mb-6 font-medium">
                                    Your password has been reset successfully. You can now log in with your new credentials.
                                </p>
                                <Link
                                    href="/"
                                    className="flex items-center justify-center w-full font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm"
                                    style={{backgroundColor: '#0f172a', color: '#ffffff'}}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e293b')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0f172a')}
                                >
                                    Return to Login
                                </Link>
                            </div>

                        ) : step === "newPassword" ? (
                            /* ── Step: set new password ── */
                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <button
                                    type="button"
                                    onClick={() => { setStep("email"); setError(""); }}
                                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-xs font-bold uppercase tracking-wider mb-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>

                                <p className="text-xs text-slate-500 font-medium -mt-2">
                                    Account verified for <span className="font-bold text-slate-700">{email}</span>. Set your new password below.
                                </p>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type={showNew ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 text-sm font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(!showNew)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter your password"
                                            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 text-sm font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    style={{backgroundColor: '#0f172a', color: '#ffffff'}}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e293b')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0f172a')}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <KeyRound className="w-4 h-4" />
                                    )}
                                    <span className="text-sm font-bold">{loading ? "Updating..." : "Set New Password"}</span>
                                </button>
                            </form>

                        ) : (
                            /* ── Step: email ── */
                            <form onSubmit={handleEmailSubmit} className="space-y-6">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-xs font-bold uppercase tracking-wider mb-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </Link>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Identity Token</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@organization.com"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    style={{backgroundColor: '#0f172a', color: '#ffffff'}}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e293b')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0f172a')}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Cpu className="w-4 h-4" />
                                    )}
                                    <span className="text-sm font-bold">{loading ? "Verifying..." : "Authorize Recovery"}</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-[11px] text-slate-400 font-bold uppercase tracking-[2px]">
                    v4.2.0-STABLE • CS-AI INFRASTRUCTURE
                </div>
            </div>
        </div>
    );
}
