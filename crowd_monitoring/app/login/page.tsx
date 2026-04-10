"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Login() {
  const [role, setRole] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username);
        router.push("/dashboard");
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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-slate-600/30">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-600/10 rounded-full blur-[160px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-600/10 rounded-full blur-[160px] animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[460px] bg-[#0a0a0a]/60 backdrop-blur-[40px] border border-white/5 rounded-[48px] p-12 z-10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-24 h-24 bg-slate-50 rounded-[30px] flex items-center justify-center mb-8 shadow-[0_20px_40px_rgba(59,130,246,0.3)] border border-white/20"
          >
            <ShieldAlert className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-3">
            CrowdSense<span className="text-slate-500">.</span>
          </h1>
          <p className="text-neutral-500 text-xs font-black uppercase tracking-[4px] ml-1">
            Neural Infrastructure
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-[11px] font-black uppercase tracking-widest flex items-center gap-4 backdrop-blur-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-neutral-600 ml-2 uppercase tracking-[2px]">System Authorization</label>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 rounded-3xl border border-white/5">
                {["Admin", "Operator", "Authority"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${role === r
                      ? "bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                      : "text-neutral-600 hover:text-neutral-300"
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-neutral-600 ml-2 uppercase tracking-[2px]">Identity Token</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-neutral-700 group-focus-within:text-slate-400 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="USER@NETWORK.NET"
                  className="w-full pl-14 pr-6 py-4.5 bg-black/40 border border-white/5 rounded-[24px] focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500/30 outline-none transition-all text-white placeholder:text-neutral-800 text-sm font-medium shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between mx-2">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-[2px]">Neural Key</label>
                <Link href="/forgot-password" title="Recover Access" className="text-[9px] font-black text-slate-500/60 hover:text-slate-400 uppercase tracking-widest transition-all">
                  Lost Key?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-700 group-focus-within:text-slate-400 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-14 py-4.5 bg-black/40 border border-white/5 rounded-[24px] focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500/30 outline-none transition-all text-white placeholder:text-neutral-800 text-sm font-medium shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <button
              type="submit"
              disabled={loading}
              className="group w-full relative h-[64px] bg-white text-black font-black py-4 rounded-[24px] shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] outline-none flex items-center justify-center gap-4 disabled:opacity-50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors duration-500">
                {loading ? (
                  <div className="w-5 h-5 border-[3px] border-black/20 border-t-black group-hover:border-white/20 group-hover:border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Cpu className="w-5 h-5" />
                )}
                <span className="text-[11px] tracking-[4px] uppercase">{loading ? "Synchronizing..." : "Initialize System"}</span>
              </div>
            </button>

            <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                New Identity?{" "}
                <Link href="/register" className="text-white hover:text-slate-400 font-black transition-colors ml-1">
                  Forge Account
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <p className="text-[9px] text-neutral-800 uppercase tracking-[4px] font-black">
              SECURE ACCESS NODE • STABLE_v4.2.0
            </p>
          </div>
        </form>
      </motion.div>
    </div>



  );
}
