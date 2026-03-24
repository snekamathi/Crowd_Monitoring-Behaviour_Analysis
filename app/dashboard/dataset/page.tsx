"use client";
import { useState, useEffect, useRef } from "react";
import { 
    Database, 
    Upload, 
    Video, 
    Download, 
    TrendingUp, 
    CheckCircle2, 
    AlertCircle, 
    FileText, 
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Cpu,
    Zap,
    Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DatasetPage() {
    const [stats, setStats] = useState<any>(null);
    const [validation, setValidation] = useState<any>({ valid: false, message: "Initializing..." });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [uploadSplit, setUploadSplit] = useState<"train" | "val">("train");
    const [trainStatus, setTrainStatus] = useState<any>({ active: false, progress: 0, message: "System Idle" });
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const fetchStats = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const [statsRes, validRes] = await Promise.all([
                fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/validate', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            if (statsRes.ok && validRes.ok) {
                setStats(await statsRes.json());
                setValidation(await validRes.json());
            }
        } catch (err) {
            console.error("Failed to fetch dataset info");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        
        const pollStatus = setInterval(async () => {
            const token = localStorage.getItem("access_token");
            try {
                const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/train/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setTrainStatus(await res.json());
            } catch (err) {}
        }, 3000);

        return () => clearInterval(pollStatus);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const token = localStorage.getItem("access_token");
        
        setActionLoading("manual");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("split", uploadSplit);

        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                await fetchStats();
                alert("File uploaded successfully.");
            }
        } catch (err) {
            alert("Upload failed.");
        } finally {
            setActionLoading(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleVideoToFrames = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const video = e.target.files[0];
        const token = localStorage.getItem("access_token");
        
        setActionLoading("video");
        const formData = new FormData();
        formData.append("video", video);

        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/video-to-frames', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                await fetchStats();
                alert(data.message);
            }
        } catch (err) {
            alert("Video extraction failed.");
        } finally {
            setActionLoading(null);
            if (videoInputRef.current) videoInputRef.current.value = "";
        }
    };

    const handleSampleDownload = async () => {
        const token = localStorage.getItem("access_token");
        setActionLoading("sample");
        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/sample', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchStats();
                alert("Sample dataset loaded.");
            }
        } catch (err) {
            alert("Sample loading failed.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCleanup = async () => {
        const token = localStorage.getItem("access_token");
        setActionLoading("cleanup");
        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/cleanup', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                await fetchStats();
            }
        } catch (err) {
            alert("Cleanup failed.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleTrain = async () => {
        if (!validation.valid || trainStatus.active) return;
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/train', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Model training sequence initiated successfully.");
            } else {
                const data = await res.json();
                alert(data.error || "Training failed to start.");
            }
        } catch (err) {
            alert("Connection error: Failed to initiate training.");
        }
    };

    const handleDeploy = async () => {
        const token = localStorage.getItem("access_token");
        setActionLoading("deploy");
        try {
            const res = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/dataset/deploy', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                alert(data.message);
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            alert("Deployment failed.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50">
                        <Database className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dataset Hub</h1>
                        <p className="text-slate-700 font-medium flex items-center gap-2">
                             Neural Network Training Resources • v4.0.1
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchStats}
                        className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold ${validation.valid ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {validation.valid ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {validation.valid ? "Dataset Verified" : "Action Required"}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Train Images", val: stats?.train?.images || 0, icon: ImageIcon, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Train Labels", val: stats?.train?.labels || 0, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Val Images", val: stats?.val?.images || 0, icon: ImageIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Val Labels", val: stats?.val?.labels || 0, icon: FileText, color: "text-teal-600", bg: "bg-teal-50" },
                ].map((s, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                            <s.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-600 underline decoration-slate-200 underline-offset-4 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className="text-2xl font-bold text-slate-900">{s.val}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Validation Message */}
            {!validation.valid && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center justify-between gap-3 text-red-600">
                    <div className="flex items-center gap-3 text-sm font-semibold">
                        <AlertCircle className="w-5 h-5" />
                        {validation.message}
                    </div>
                    {validation.message.toLowerCase().includes("mismatch") && (
                        <button 
                            onClick={handleCleanup}
                            disabled={actionLoading === "cleanup"}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-200"
                        >
                            {actionLoading === "cleanup" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Resolve Mismatch
                        </button>
                    )}
                </div>
            )}

            {/* Action Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Manual Upload */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Upload className="w-6 h-6 text-blue-600" />
                        <h3 className="font-bold text-slate-800">Manual Ingestion</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                        Manually contribute curated images and YOLO-formatted label files (.txt) to the pool.
                    </p>
                    
                    <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                        {["train", "val"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setUploadSplit(s as any)}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition-all rounded-md ${uploadSplit === s ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-800'}`}
                            >
                                {s} Split
                            </button>
                        ))}
                    </div>

                    <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload}
                        accept="image/*,.txt"
                    />
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={actionLoading === "manual"}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        {actionLoading === "manual" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {actionLoading === "manual" ? "Processing..." : "Select File"}
                    </button>
                </div>

                {/* Video to Dataset */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Video className="w-6 h-6 text-indigo-600" />
                        <h3 className="font-bold text-slate-800">Video Synthesis</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                        Transform raw video footage into a labeled dataset automatically using v8-Intelligence.
                    </p>
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase">
                            <Zap className="w-3 h-3" /> Auto-Annotation Active
                         </div>
                         <div className="text-[11px] text-indigo-900 font-medium">Extracting 1 frame every 10 ticks with YOLO labels.</div>
                    </div>

                    <input 
                        type="file" 
                        className="hidden" 
                        ref={videoInputRef} 
                        onChange={handleVideoToFrames}
                        accept="video/*"
                    />

                    <button 
                        onClick={() => videoInputRef.current?.click()}
                        disabled={actionLoading === "video"}
                        className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                        {actionLoading === "video" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                        {actionLoading === "video" ? "Extracting..." : "Process Video"}
                    </button>
                </div>

                {/* Sample Dataset */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Download className="w-6 h-6 text-teal-600" />
                        <h3 className="font-bold text-slate-800">Demo Manifest</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                        Rapidly initialize your environment by pulling a small subset of the COCO Crowd dataset.
                    </p>
                    
                    <ul className="space-y-2">
                        {["128 Balanced Instances", "Verified YOLOv8 Labels", "Person Class Only"].map((t, i) => (
                            <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase">
                                <CheckCircle2 className="w-3 h-3 text-teal-500" /> {t}
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={handleSampleDownload}
                        disabled={actionLoading === "sample"}
                        className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                        {actionLoading === "sample" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {actionLoading === "sample" ? "Downloading..." : "Populate Sample"}
                    </button>
                </div>
            </div>

            {/* Neural Training Preview */}
            <div className="bg-slate-900 p-10 rounded-3xl text-white overflow-hidden relative border border-slate-800">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                            <Cpu className="w-3 h-3" /> Core Intelligence v4
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Ready for Deployment?</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md font-medium">
                            Once your dataset is verified and balanced, you can initiate the training sequence. 
                            The system will utilize YOLOv8-large to fine-tune your crowd monitoring capabilities.
                        </p>
                        <div className="flex flex-wrap gap-4 items-center">
                            <button 
                                onClick={handleTrain}
                                disabled={!validation.valid || trainStatus.active}
                                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${validation.valid && !trainStatus.active ? 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/40 text-white cursor-pointer active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
                            >
                                {trainStatus.active ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                                {trainStatus.active ? "Training in Progress..." : "Initialize Training"}
                            </button>

                            {!trainStatus.active && trainStatus.progress === 100 && (
                                <button 
                                    onClick={handleDeploy}
                                    disabled={actionLoading === "deploy"}
                                    className="px-8 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-400 text-white shadow-xl shadow-orange-900/40 transition-all flex items-center gap-3 active:scale-95"
                                >
                                    {actionLoading === "deploy" ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    Deploy Custom Model
                                </button>
                            )}
                        </div>
                        {trainStatus.active && (
                            <div className="mt-4 text-xs font-bold text-blue-400 uppercase tracking-widest animate-pulse">
                                Status: {trainStatus.message}
                            </div>
                        )}
                    </div>
                    <div className="hidden md:block">
                        <div className="relative group cursor-crosshair">
                            <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-6 rounded-2xl relative">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Training Epochs</span>
                                        <span>100 Target</span>
                                    </div>
                                    <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                                        <div 
                                            className="h-full bg-blue-600 transition-all duration-1000" 
                                            style={{ width: `${trainStatus.active ? Math.max(10, trainStatus.progress) : (trainStatus.progress === 100 ? 100 : 0)}%` }}
                                        ></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">mAP 50-95</div>
                                            <div className="text-xl font-mono text-blue-400">{trainStatus.metrics?.map || "0.00"}</div>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Loss Trend</div>
                                            <div className="text-xl font-mono text-indigo-400">{trainStatus.metrics?.loss || "0.00"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
