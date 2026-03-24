"use client";
import { useState, useRef } from "react";
import { UploadCloud, FileVideo, CheckCircle, Cpu, Loader2, PlaySquare, AlertCircle, RefreshCcw, Users, Activity, ShieldAlert, BarChart3 } from "lucide-react";

interface AnalysisResult {
    processed_video_url: string;
    people_count: number;
    density_level: string;
    behavior_status: string;
    risk_level: string;
}

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [showResults, setShowResults] = useState(false);

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);
        setProgress(10);

        const interval = setInterval(() => {
            setProgress((prev: number) => (prev < 99 ? prev + (prev < 90 ? 5 : 1) : prev));
        }, 400);

        const formData = new FormData();
        formData.append('video', file);

        const token = localStorage.getItem("access_token");
        if (!token) {
            setError("Session expired. Please log in again.");
            setIsAnalyzing(false);
            return;
        }

        try {
            const response = await fetch('https://crowd-monitoring-behaviour-analysis.onrender.com/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            clearInterval(interval);

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to analyze video');
            }

            const data = await response.json();
            setProgress(100);
            setResults(data);
            setTimeout(() => {
                setIsAnalyzing(false);
                setShowResults(true);
            }, 500);
        } catch (err: any) {
            clearInterval(interval);
            setIsAnalyzing(false);
            setProgress(0);
            setError(err.message || 'Connection failed.');
        }
    };

    const handleReset = () => {
        setFile(null);
        setResults(null);
        setShowResults(false);
        setProgress(0);
        setError(null);
    };

    if (showResults && results) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{backgroundColor: '#e0f2fe', color: '#2563eb', border: '1px solid #bae6fd'}}>
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Analysis Complete</h1>
                            <p className="text-slate-500 text-sm font-medium mt-1">Review the processed spatial data and risk metrics.</p>
                        </div>
                    </div>
                    <button onClick={handleReset} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm">
                        <RefreshCcw className="w-4 h-4" />
                        Start New Analysis
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video Player */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">Processed Footage</h2>
                        </div>
                        <div className="bg-slate-100 border-t border-b border-slate-200 relative flex-1 min-h-[400px]">
                            <video src={results.processed_video_url} controls autoPlay loop className="w-full h-full object-contain mix-blend-multiply absolute inset-0" />
                            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                                <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white text-slate-800 flex items-center gap-2 text-xs font-bold shadow-sm">
                                    <Users className="w-3.5 h-3.5 text-slate-500" /> Count: {results.people_count}
                                </div>
                                <div className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest shadow-sm ${results.risk_level === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                    {results.risk_level} Risk
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 mb-2 px-1">Spatial Intelligence</h3>

                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-500 border border-yellow-100">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Detected</p>
                                <p className="text-2xl font-bold text-slate-800">{results.people_count}</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Density Level</p>
                                <p className="text-xl font-bold text-slate-800">{results.density_level}</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
                            <div className={`p-3 rounded-lg border ${results.behavior_status === 'Abnormal' ? 'bg-yellow-50 text-yellow-500 border-yellow-100' : 'bg-yellow-50 text-yellow-500 border-yellow-100'}`}>
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Behavior</p>
                                <p className={`text-xl font-bold ${results.behavior_status === 'Abnormal' ? 'text-yellow-500' : 'text-slate-800'}`}>{results.behavior_status}</p>
                            </div>
                        </div>

                        <div className={`border rounded-xl p-5 shadow-sm flex items-start gap-4 bg-white ${results.risk_level === 'Critical' ? 'border-red-200' : results.risk_level === 'Warning' ? 'border-yellow-200' : 'border-yellow-200'}`}>
                            <div className={`p-3 rounded-lg border ${results.risk_level === 'Critical' ? 'bg-red-50 text-red-500 border-red-100' : results.risk_level === 'Warning' ? 'bg-yellow-50 text-yellow-500 border-yellow-100' : 'bg-yellow-50 text-yellow-500 border-yellow-100'}`}>
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Assessment</p>
                                <p className={`text-2xl font-bold ${results.risk_level === 'Critical' ? 'text-red-500' : results.risk_level === 'Warning' ? 'text-yellow-500' : 'text-yellow-500'}`}>{results.risk_level}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-4">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{backgroundColor: '#0f172a'}}>
                    <UploadCloud className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Archive Upload</h1>
                    <p className="text-slate-700 text-sm font-medium mt-1">Upload video files for offline crowd analysis and reporting.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-lg flex items-center gap-3 text-sm font-semibold">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all bg-white ${file && !isAnalyzing ? "border-slate-400 bg-slate-50" :
                            isAnalyzing ? "border-slate-300 opacity-50 pointer-events-none" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                >
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        {file ? <FileVideo className="w-8 h-8 text-slate-500" /> : <UploadCloud className="w-8 h-8 text-slate-400" />}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                        {file ? file.name : "Drag & Drop Video"}
                    </h3>
                    <p className="text-slate-700 text-sm mb-6 max-w-[200px]">
                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready` : "Upload MP4, AVI, or MOV files for processing."}
                    </p>

                    {!file && (
                        <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-6 rounded-lg shadow-sm text-sm transition-all">
                            Browse Files
                            <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                        </label>
                    )}

                    {file && !isAnalyzing && progress === 0 && (
                        <div className="flex items-center gap-3 w-full max-w-[240px]">
                            <button onClick={handleAnalyze} className="flex-1 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm" style={{backgroundColor: '#0f172a'}}>
                                <Cpu className="w-4 h-4" /> Analyze
                            </button>
                            <button onClick={handleReset} className="p-2.5 rounded-lg border border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all">
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="w-full max-w-[240px] space-y-3 mt-4">
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin text-slate-500" /> Analyzing</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pipeline Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-slate-500" /> Processing Pipeline
                    </h3>

                    <div className="space-y-6 flex-1">
                        {[
                            { label: 'Video Preprocessing', status: progress > 10 ? 'done' : progress > 0 ? 'active' : 'idle' },
                            { label: 'YOLOv8 Detection', status: progress > 40 ? 'done' : progress > 10 ? 'active' : 'idle' },
                            { label: 'Density Estimation', status: progress > 70 ? 'done' : progress > 40 ? 'active' : 'idle' },
                            { label: 'LSTM Behavior Analysis', status: progress > 90 ? 'done' : progress > 70 ? 'active' : 'idle' },
                            { label: 'Generate Report', status: progress >= 100 ? 'done' : progress > 90 ? 'active' : 'idle' }
                        ].map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${step.status === 'done' ? 'border-blue-500 bg-blue-50' :
                                            step.status === 'active' ? 'bg-white border-blue-400' : 'bg-slate-50 border-slate-200'
                                        }`}>
                                        {step.status === 'done' && <CheckCircle className="w-3.5 h-3.5" style={{color: '#2563eb'}} />}
                                        {step.status === 'active' && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                                    </div>
                                    {idx < 4 && <div className={`w-0.5 h-6 mt-1 flex-1 ${step.status === 'done' ? 'bg-blue-200' : 'bg-slate-100'}`} />}
                                </div>
                                <div className={`text-sm font-semibold pt-0.5 ${step.status === 'done' ? 'text-slate-900' :
                                        step.status === 'active' ? 'text-slate-800' : 'text-slate-600'
                                    }`}>
                                    {step.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        disabled={progress !== 100}
                        onClick={() => setShowResults(true)}
                        className={`w-full mt-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${progress === 100 ? 'text-white shadow-xl' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        style={progress === 100 ? {backgroundColor: '#2563eb'} : {}}
                    >
                        <PlaySquare className="w-4 h-4" />
                        View Results
                    </button>
                </div>
            </div>
        </div>
    );
}
