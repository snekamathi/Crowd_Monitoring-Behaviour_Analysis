"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldAlert, Cpu, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Login() {
  const [role, setRole] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://crowd-monitoring-behaviour-analysis.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username);

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      } else {
        setError(data.error || "Login failed. Please check credentials.");
      }
    } catch (err) {
      setError("Server connection failed. Is the backend running?");
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
            <ShieldAlert className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{color: '#0f172a'}}>CrowdSense AI</h1>
          <p className="text-sm mt-1 font-medium" style={{color: '#6b7280'}}>Intelligent Monitoring & Analysis</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[20px] overflow-hidden" style={{border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}}>
          <div className="p-8">
              {error && (
                <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold" style={{background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626'}}>
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

            <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{color: '#6b7280'}}>Access Role</label>
                <div className="flex p-1 rounded-xl" style={{backgroundColor: '#f1f5f9', border: '1px solid #e5e7eb'}}>
                  {["Admin", "Operator", "Authority"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all ${role === r ? "bg-white shadow-sm" : ""}`}
                      style={role === r ? {color: '#2563eb', border: '1px solid #e0f2fe'} : {color: '#94a3b8'}}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{color: '#6b7280'}}>Identity Login</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#111827'}}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mx-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{color: '#6b7280'}}>Access Key</label>
                  <Link href="/forgot-password" title="Recover Access" className="text-[11px] font-bold hover:underline" style={{color: '#2563eb'}}>
                    Find Access?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl outline-none transition-all text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    style={{backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#111827'}}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{backgroundColor: '#0f172a', color: '#ffffff'}}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e293b')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0f172a')}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Cpu className="w-4 h-4" />
                )}
                <span className="text-sm font-bold">{loading ? "Authenticating..." : "System Login"}</span>
              </button>
            </form>
          </div>

          <div className="border-t p-4 text-center" style={{backgroundColor: '#f8fafc', borderColor: '#f1f5f9'}}>
            <p className="text-xs font-medium" style={{color: '#6b7280'}}>
              Internal Access System. <Link href="/register" className="font-bold hover:underline" style={{color: '#2563eb'}}>Register ID</Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-[11px] font-bold uppercase tracking-[2px]" style={{color: '#94a3b8'}}>
          v4.2.0-STABLE • CS-AI INFRASTRUCTURE
        </div>
      </div>
    </div>
  );
}
