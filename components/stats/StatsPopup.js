"use client";

import {
    Download, Upload, BarChart, CheckCircle, Clock,
    BarChart2, PieChart, AlertTriangle, CloudOff, Cloud,
    Calendar, Trophy, Zap, TrendingUp, Activity, Info
} from 'lucide-react';
import useStats from '@/hooks/useStats';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useRef, useMemo, useEffect } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import {
    Bar, BarChart as RechartsBarChart, ResponsiveContainer,
    XAxis, YAxis, Tooltip as RechartsTooltip, Pie,
    PieChart as RechartsPieChart, Cell
} from 'recharts';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { PremiumGate } from '@/components/system/PremiumGate';

// --- SUB-COMPONENTS ---

const StatCard = ({ icon, label, value, unit, subtext, colorClass = "text-white" }) => (
    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">{label}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className={cn("text-2xl font-bold", colorClass)}>
                {value} <span className="text-xs text-gray-400">{unit}</span>
            </div>
            {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </CardContent>
    </Card>
);

const DailyTaskRing = ({ done, total }) => {
    const percentage = total > 0 ? Math.min(100, (done / total) * 100) : 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative h-40 w-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"></circle>
                <circle cx="60" cy="60" r={radius} fill="none" stroke={percentage === 100 ? "#10B981" : "#EAB308"} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-white">{done}</span>
                <span className="text-sm text-gray-400">/ {total} Tasks</span>
            </div>
        </div>
    );
};

const tooltipStyle = {
    background: "#1F2937",
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

const SimpleWeeklyTrendChart = ({ data }) => {
    const maxMinutes = useMemo(() => {
        if (!data || data.length === 0) return 60;
        const max = Math.max(...data.map(d => d.minutes));
        return max === 0 ? 60 : Math.ceil(max * 1.2);
    }, [data]);

    return (
        <ResponsiveContainer width="100%" height={150}>
            <RechartsBarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dy={5} />
                <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} domain={[0, maxMinutes]} tickFormatter={(val) => `${val}m`} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }} contentStyle={tooltipStyle} labelStyle={{ color: '#F3F4F6', marginBottom: '4px' }} itemStyle={{ color: '#38B2AC' }} labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label} />
                <Bar dataKey="minutes" fill="#38B2AC" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#FBBF24' : '#38B2AC'} />))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

const FocusHistoryChart = ({ data }) => {
    const [view, setView] = useState('weekly');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const currentData = data[view] || [];

    const yAxisDomain = useMemo(() => {
        if (!currentData.length) return [0, 60];
        const max = Math.max(...currentData.map(d => d.minutes));
        const limit = max === 0 ? 60 : Math.ceil(max * 1.1);
        return [0, limit];
    }, [currentData]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 pl-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Timeframe</span>
                <div className="bg-gray-800 p-1 rounded-lg flex gap-1">
                    {['weekly', 'monthly', 'yearly'].map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "px-3 py-1 text-xs rounded-md capitalize transition-all",
                                view === v ? "bg-gray-700 text-white shadow-sm font-medium" : "text-gray-400 hover:text-gray-200"
                            )}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={currentData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis
                        dataKey="name"
                        stroke="#6B7280"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={5}
                        minTickGap={20}
                    />
                    <YAxis
                        stroke="#6B7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={yAxisDomain}
                        tickFormatter={(val) => `${val}m`}
                    />
                    <RechartsTooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: '#F9FAFB', fontWeight: '600' }}
                        itemStyle={{ color: '#8B5CF6' }}
                        formatter={(value) => [`${value} mins`, 'Focus Time']}
                        labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                    />
                    <Bar dataKey="minutes" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1000} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
};

const FocusByProjectChart = ({ data }) => {
    const COLORS = ['#38B2AC', '#FBBF24', '#60A5FA', '#F87171', '#A78BFA', '#F472B6'];

    if (!data || data.length === 0) {
        return (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-700 rounded-lg">
                <PieChart size={24} className="mb-2 opacity-50" />
                No project data yet.
            </div>
        );
    }

    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                    <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} formatter={(value) => `${value} mins`} />
                    <Pie data={data} dataKey="minutes" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} stroke="none">
                        {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <span className="text-xs text-gray-400 block">Total</span>
                    <span className="text-lg font-bold text-white">{data.reduce((a, b) => a + b.minutes, 0)}m</span>
                </div>
            </div>
        </div>
    )
};

const CalendarHeatmap = ({ data }) => {
    const days = useMemo(() => {
        const today = new Date();
        const startDate = subDays(today, 364);
        return eachDayOfInterval({ start: startDate, end: today });
    }, []);

    const getColor = (minutes) => {
        if (!minutes || minutes === 0) return 'bg-gray-800/50 hover:bg-gray-800';
        if (minutes < 30) return 'bg-emerald-900/40 hover:bg-emerald-900/60';
        if (minutes < 60) return 'bg-emerald-700/60 hover:bg-emerald-700/80';
        if (minutes < 120) return 'bg-emerald-500/80 hover:bg-emerald-500';
        return 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]';
    };

    return (
        <div className="flex flex-col gap-2">
            <TooltipProvider>
                <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    <div className="grid grid-rows-7 grid-flow-col gap-1 w-max min-w-full" style={{ height: '140px' }}>
                        {days.map((day) => {
                            const dateKey = startOfDay(day).toISOString();
                            const minutes = data[dateKey] || 0;
                            const isToday = isSameDay(day, new Date());

                            return (
                                <Tooltip key={dateKey} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                "w-3 h-3 rounded-[2px] transition-all duration-200 cursor-pointer",
                                                getColor(minutes),
                                                isToday && "ring-1 ring-white ring-offset-1 ring-offset-black"
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-900 border-gray-700 text-white text-xs">
                                        <div className="text-center">
                                            <p className="font-semibold text-emerald-400">{minutes} minutes</p>
                                            <p className="text-gray-400">{format(day, 'EEE, MMM d, yyyy')}</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            </TooltipProvider>

            <div className="flex items-center justify-end gap-2 text-xs text-gray-500 mt-1">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-[2px] bg-gray-800/50"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-emerald-900/40"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-emerald-700/60"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-emerald-500/80"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-emerald-400"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
};

export default function StatsPopup({ isOpen, setIsOpen }) {
    const { user, openSignUpModal } = useAuth();
    const { stats, loading } = useStats();
    const { isPro } = useSubscription();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [projectView, setProjectView] = useState('week');

    const fileInputRef = useRef(null);

    // --- Tier 1: Dummy Data Injector ---
    const { dummyProjectData, dummyHeatmapData } = useMemo(() => {
        if (isPro) return { dummyProjectData: null, dummyHeatmapData: null };

        // Synthesize beautiful, fake distribution data
        const dummyProjectData = {
            today: [{ name: 'Deep Work', minutes: 120 }, { name: 'Admin', minutes: 45 }, { name: 'Learning', minutes: 60 }],
            week: [{ name: 'Deep Work', minutes: 840 }, { name: 'Admin', minutes: 210 }, { name: 'Learning', minutes: 320 }, { name: 'Client A', minutes: 150 }]
        };

        // Synthesize a realistic heatmap shape (past 3 months dense, rest sparse)
        const dummyHeatmapData = {};
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = subDays(today, i);
            const key = startOfDay(d).toISOString();
            // Higher intensity closer to today, dropping off exponentially, with random noise
            const weight = Math.max(0, 1 - (i / 90));
            if (Math.random() < weight) {
                dummyHeatmapData[key] = Math.floor(Math.random() * 120) + 15; // 15 to 135 mins
            }
        }

        return { dummyProjectData, dummyHeatmapData };
    }, [isPro]);

    // --- Tier 0: Data Risk Throttle ---
    useEffect(() => {
        if (isOpen && !user) {
            const lastWarned = localStorage.getItem('stats_risk_popup_last_shown');
            const now = Date.now();
            // 24 hours = 86400000 ms
            if (!lastWarned || (now - parseInt(lastWarned, 10)) > 86400000) {
                // Since this opens over a dialog, a simple alert or a toast is cleanest.
                // Using a native alert for immediate, bulletproof priority before they interact.
                setTimeout(() => {
                    alert("⚠️ Data at Risk\n\nYou are in Local Mode. Your stats and history are saved only to this browser.\n\nClearing your cache will permanently delete your progress. Sign in to enable Cloud Sync.");
                    localStorage.setItem('stats_risk_popup_last_shown', now.toString());
                }, 500); // Small delay to let the modal animate in first
            }
        }
    }, [isOpen, user]);

    const handleDownloadBackup = () => {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                version: 1,
                sessions: JSON.parse(localStorage.getItem('ws_focus_sessions') || '[]'),
                tasks: JSON.parse(localStorage.getItem('ws_tasks') || '[]'),
                projects: JSON.parse(localStorage.getItem('ws_projects') || '[]'),
            };
            if (backupData.sessions.length === 0 && backupData.tasks.length === 0) { alert("No data to export yet!"); return; }
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `workstation_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        } catch (e) { console.error("Export failed:", e); alert("Failed to create backup."); }
    };

    const handleImportBackup = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm(`Restore data from ${new Date(data.timestamp).toLocaleDateString()}?\n\n⚠️ This will replace your current local data.`)) {
                    localStorage.setItem('ws_focus_sessions', JSON.stringify(data.sessions));
                    localStorage.setItem('ws_tasks', JSON.stringify(data.tasks));
                    if (data.projects) localStorage.setItem('ws_projects', JSON.stringify(data.projects));
                    alert("Data restored successfully!"); window.location.reload();
                }
            } catch (error) { console.error("Import failed:", error); alert("Failed to read backup file."); }
        };
        reader.readAsText(file); event.target.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-[#0F1115] border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <DialogHeader className="pb-4 border-b border-gray-800/60">
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                                Productivity Hub
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 mt-1">
                                Track your progress and analyze your focus patterns.
                            </DialogDescription>
                        </div>
                        {isPro ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-500/30 rounded-full text-green-400 text-xs font-medium">
                                <Cloud size={14} /> Cloud Synced
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-900/20 border border-orange-500/30 rounded-full text-orange-400 text-xs font-medium">
                                <CloudOff size={14} /> Local Mode
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {!isPro && (
                    <div className="mt-4 p-3 bg-yellow-950/30 border border-yellow-700/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-yellow-500 shrink-0" size={18} />
                            <div>
                                <h4 className="text-sm font-semibold text-yellow-500">Data is stored locally</h4>
                                <p className="text-xs text-gray-400">Clear cache or changing browsers will lose data.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleImportBackup} className="hidden" accept=".json" />
                            <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" className="h-8 text-xs border-gray-700 hover:bg-gray-800 text-gray-300">
                                <Upload size={12} className="mr-2" /> Import
                            </Button>
                            <Button onClick={handleDownloadBackup} size="sm" variant="outline" className="h-8 text-xs border-gray-700 hover:bg-gray-800 text-gray-300">
                                <Download size={12} className="mr-2" /> Backup
                            </Button>
                            <Link href="/pricing" onClick={() => setIsOpen(false)}>
                                <Button size="sm" className="h-8 text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                                    Sync Data
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                <div className="mt-6 mb-4">
                    <nav className="flex space-x-6 border-b border-gray-800" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={cn(
                                "pb-3 px-1 border-b-2 font-medium text-sm transition-all",
                                activeTab === 'dashboard' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-gray-400 hover:text-gray-200'
                            )}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={cn(
                                "flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition-all",
                                activeTab === 'insights' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-gray-400 hover:text-gray-200'
                            )}
                        >
                            <Zap size={14} className={activeTab === 'insights' ? "text-yellow-500" : "text-gray-500"} />
                            Premium Insights
                        </button>
                    </nav>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 space-y-4">
                        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm">Crunching the numbers...</p>
                    </div>
                ) : (
                    <div className="min-h-[300px]">
                        {activeTab === 'dashboard' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4 bg-gray-800/20 rounded-xl p-4 border border-gray-800">
                                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Total Goal</h3>
                                    <DailyTaskRing done={stats.tasksDoneAllTime} total={stats.totalTasksAllTime} />
                                    <div className="text-xs text-gray-500 text-center px-2">
                                        {stats.tasksDoneAllTime === stats.totalTasksAllTime && stats.totalTasksAllTime > 0
                                            ? "🎉 All tasks completed!"
                                            : "Keep pushing!"}
                                    </div>
                                </div>

                                <div className="md:col-span-3 space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <StatCard icon={<CheckCircle className="h-4 w-4 text-green-400" />} label="Tasks Done" value={stats.tasksDoneToday} unit="" />
                                        <StatCard icon={<Calendar className="h-4 w-4 text-purple-400" />} label="Streak" value={stats.daysAccessed} unit="days" />
                                        <StatCard icon={<Clock className="h-4 w-4 text-blue-400" />} label="Today's Focus" value={stats.todaysFocusFormatted} unit="" />
                                    </div>
                                    <Card className="bg-gray-800/20 border-gray-800">
                                        <CardHeader className="py-3 border-b border-gray-800/50">
                                            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                                                <BarChart2 className="mr-2 h-4 w-4" /> Weekly Activity
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <SimpleWeeklyTrendChart data={stats.weeklyFocusTrend} />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeTab === 'insights' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
                                {!user ? (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0F1115]/80 backdrop-blur-sm rounded-xl border border-gray-800">
                                        <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm">
                                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                                                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Insights Locked</h3>
                                            <p className="text-sm text-gray-400 mb-6">
                                                Sign in to unlock Premium Insights and securely back up your productivity history to the cloud.
                                            </p>
                                            <Button
                                                onClick={() => { setIsOpen(false); openSignUpModal(); }}
                                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg"
                                            >
                                                Sign In to Unlock
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}

                                <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", !user && "opacity-20 pointer-events-none blur-sm")}>

                                    {/* --- Tier 1 Tease Banner --- */}
                                    {user && !isPro && (
                                        <div className="lg:col-span-2 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 flex animate-in fade-in items-center justify-center text-center">
                                            <p className="text-yellow-400 text-sm font-medium">
                                                <span className="font-bold">Preview Mode:</span> This is how your data will look. Upgrade to Pro to unlock your beautiful historical analytics.
                                            </p>
                                        </div>
                                    )}

                                    <Card className="bg-gray-800/20 border-gray-800">
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <PieChart className="mr-2 h-4 w-4" /> Project Distribution
                                                </div>

                                                {/* --- UPDATED: Toggle Buttons --- */}
                                                <div className="flex bg-gray-800 rounded-md p-0.5 ml-auto">
                                                    <button
                                                        onClick={() => setProjectView('today')}
                                                        className={cn("px-2 py-0.5 text-[10px] rounded-sm transition-all relative z-10", projectView === 'today' ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200")}
                                                    >Today</button>
                                                    <button
                                                        onClick={() => setProjectView('week')}
                                                        className={cn("px-2 py-0.5 text-[10px] rounded-sm transition-all relative z-10", projectView === 'week' ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200")}
                                                    >This Week</button>
                                                </div>

                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <PremiumGate featureKey="historical_stats" requiredTier={2} hideLock={false}>
                                                <FocusByProjectChart data={!isPro ? dummyProjectData[projectView] : stats.focusByProject[projectView]} />
                                            </PremiumGate>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gray-800/20 border-gray-800 flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <Activity className="mr-2 h-4 w-4" /> Productivity Heatmap
                                                </div>
                                                <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-500">Last Year</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow flex flex-col justify-center">
                                            <PremiumGate featureKey="historical_stats" requiredTier={2} hideLock={false}>
                                                <CalendarHeatmap data={!isPro ? dummyHeatmapData : stats.productivityHeatmap} />
                                            </PremiumGate>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", !user && "opacity-20 pointer-events-none blur-sm")}>
                                    <StatCard icon={<Calendar className="h-4 w-4 text-yellow-400" />} label="Total Days Accessed" value={stats.daysAccessed} unit="days" colorClass="text-yellow-400" />
                                    <StatCard icon={<Trophy className="h-4 w-4 text-orange-400" />} label="Best Day Record" value={stats.bestFocusMinutes} unit="m" subtext={stats.bestDayDate || "No data yet"} colorClass="text-orange-400" />
                                    <StatCard icon={<Clock className="h-4 w-4 text-blue-400" />} label="All Time" value={Math.floor(stats.allTimeFocusMinutes / 60)} unit="h" subtext={`${stats.allTimeFocusMinutes % 60}m remaining`} />
                                    <StatCard icon={<TrendingUp className="h-4 w-4 text-green-400" />} label="Growth" value={`${stats.weeklyGrowthPercentage > 0 ? '+' : ''}${stats.weeklyGrowthPercentage}`} unit="%" colorClass={stats.weeklyGrowthPercentage >= 0 ? "text-green-400" : "text-red-400"} subtext="vs Last Week" />
                                </div>

                                <Card className={cn("bg-gray-800/20 border-gray-800", !user && "opacity-20 pointer-events-none blur-sm")}>
                                    <CardHeader className="py-3 border-b border-gray-800/50">
                                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                                            <BarChart className="mr-2 h-4 w-4" /> Focus History
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <FocusHistoryChart data={stats.chartData} />
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}