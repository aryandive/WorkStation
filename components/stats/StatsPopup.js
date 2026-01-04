"use client";

import {
    Download, Upload, BarChart, CheckCircle, Flame, Clock,
    BarChart2, PieChart, AlertTriangle, CloudOff, Cloud, Lock
} from 'lucide-react'; // ADDED 'Upload' icon
import useStats from '@/hooks/useStats';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react'; // ADDED useRef
import { useSubscription } from '@/context/SubscriptionContext';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Pie, PieChart as RechartsPieChart, Cell } from 'recharts';
import Link from 'next/link';

// ... (Keep ALL Sub-Components: StatCard, FocusGoalRing, WeeklyTrendChart, etc. exactly the same) ...
// ... [Reuse previous sub-components code here] ...

const StatCard = ({ icon, label, value, unit }) => (
    <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">{label}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-white">
                {value} <span className="text-xs text-gray-400">{unit}</span>
            </div>
        </CardContent>
    </Card>
);

const FocusGoalRing = ({ focusTime, goal }) => {
    const percentage = goal > 0 ? Math.min(100, (focusTime / goal) * 100) : 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative h-40 w-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"></circle>
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#38B2AC" strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-white">{focusTime}</span>
                <span className="text-sm text-gray-400">/ {goal} min</span>
            </div>
        </div>
    );
};

const WeeklyTrendChart = ({ data }) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const todayIndex = new Date().getDay();
    const chartData = days.map((day, index) => {
        const dayOffset = (todayIndex - (6 - index) + 7) % 7;
        const targetDayIndex = (todayIndex - dayOffset + 7) % 7;
        return { name: days[targetDayIndex], minutes: data[targetDayIndex] || 0 };
    });
    return (
        <ResponsiveContainer width="100%" height={150}>
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ background: "#1F2937", border: '1px solid #4B5563', borderRadius: '0.5rem' }} labelStyle={{ color: '#F9FAFB' }} />
                <Bar dataKey="minutes" fill="#38B2AC" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 6 ? '#FBBF24' : '#38B2AC'} />))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

const ProductivityHeatmap = ({ data }) => (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-center text-gray-400">Heatmap Preview</p>
        <p className="text-center text-xs text-gray-500 mt-2">Consistent focus builds momentum.</p>
    </div>
);

const FocusByProjectChart = ({ data }) => {
    const COLORS = ['#38B2AC', '#FBBF24', '#60A5FA', '#F87171', '#A78BFA'];
    if (!data || data.length === 0) return <p className="text-center text-gray-400">No project data to display.</p>
    return (
        <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
                <RechartsTooltip contentStyle={{ background: "#1F2937", border: '1px solid #4B5563', borderRadius: '0.5rem' }} />
                <Pie data={data} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                    {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
            </RechartsPieChart>
        </ResponsiveContainer>
    )
};

export default function StatsPopup({ isOpen, setIsOpen }) {
    const { stats, loading } = useStats();
    const { isPro } = useSubscription();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Hidden Input Reference
    const fileInputRef = useRef(null);

    // --- 1. Export Function ---
    const handleDownloadBackup = () => {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                version: 1, // Good practice for future migrations
                sessions: JSON.parse(localStorage.getItem('ws_focus_sessions') || '[]'),
                tasks: JSON.parse(localStorage.getItem('ws_tasks') || '[]'),
                projects: JSON.parse(localStorage.getItem('ws_projects') || '[]'),
            };

            if (backupData.sessions.length === 0 && backupData.tasks.length === 0) {
                alert("No data to export yet!");
                return;
            }

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workstation_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Failed to create backup.");
        }
    };

    // --- 2. Import Function ---
    const handleImportBackup = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Simple validation
                if (!Array.isArray(data.sessions) || !Array.isArray(data.tasks)) {
                    alert("Invalid backup file format.");
                    return;
                }

                if (confirm(`Restore data from ${new Date(data.timestamp).toLocaleDateString()}?\n\n⚠️ This will replace your current local data.`)) {
                    localStorage.setItem('ws_focus_sessions', JSON.stringify(data.sessions));
                    localStorage.setItem('ws_tasks', JSON.stringify(data.tasks));
                    if (data.projects) localStorage.setItem('ws_projects', JSON.stringify(data.projects));

                    alert("Data restored successfully!");
                    window.location.reload(); // Reload to refresh stats
                }
            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to read backup file.");
            }
        };
        reader.readAsText(file);
        // Reset input so the same file can be selected again if needed
        event.target.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900/95 backdrop-blur-md border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-yellow-400">My Stats</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                View your detailed productivity statistics and focus trends.
                            </DialogDescription>
                        </div>
                        {isPro ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/50 rounded-full text-green-400 text-xs font-medium">
                                <Cloud size={14} /> Cloud Synced
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/50 rounded-full text-orange-400 text-xs font-medium">
                                <CloudOff size={14} /> Local Storage
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* --- WARNING & RESTORE BANNER --- */}
                {!isPro && (
                    <div className="mx-1 mt-2 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-start gap-3 flex-grow">
                            <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-sm font-semibold text-yellow-500">Data Saved Locally</h4>
                                <p className="text-xs text-gray-400 mt-1">
                                    Your stats are saved in this browser. Backup your data to keep it safe.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImportBackup}
                                className="hidden"
                                accept=".json"
                            />

                            {/* Import Button */}
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                size="sm"
                                variant="outline"
                                className="border-yellow-600/50 text-yellow-500 hover:bg-yellow-900/40 text-xs h-8"
                                title="Restore from Backup"
                            >
                                <Upload size={12} className="mr-1" /> Import
                            </Button>

                            {/* Export Button */}
                            <Button
                                onClick={handleDownloadBackup}
                                size="sm"
                                variant="outline"
                                className="border-yellow-600/50 text-yellow-500 hover:bg-yellow-900/40 text-xs h-8"
                                title="Download Backup"
                            >
                                <Download size={12} className="mr-1" /> Backup
                            </Button>

                            {/* Upsell Button */}
                            <Link href="/pricing" onClick={() => setIsOpen(false)}>
                                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs h-8">
                                    Sync Data
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* ... (Keep Tabs and Content Logic exactly as before) ... */}
                <div className="border-b border-gray-700 mt-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            Dashboard
                        </button>
                        <button onClick={() => setActiveTab('insights')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'insights' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            {!isPro && <Lock size={12} className="text-gray-500" />} Premium Insights
                        </button>
                    </nav>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-80"><p>Loading stats...</p></div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 animate-fade-in">
                                <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4 bg-gray-800/30 rounded-xl p-4 border border-white/5">
                                    <h3 className="text-lg font-medium text-gray-300">Today&apos;s Focus</h3>
                                    <FocusGoalRing focusTime={stats.focusTimeToday} goal={stats.focusGoal} />
                                </div>
                                <div className="md:col-span-3 space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <StatCard icon={<CheckCircle className="h-5 w-5 text-green-400" />} label="Tasks" value={stats.tasksCompletedToday} unit="" />
                                        <StatCard icon={<Flame className="h-5 w-5 text-orange-400" />} label="Streak" value={stats.focusStreak} unit="days" />
                                        <StatCard icon={<Clock className="h-5 w-5 text-blue-400" />} label="Total" value={stats.totalHoursFocused} unit="hrs" />
                                    </div>
                                    <Card className="bg-gray-800/50 border-gray-700"><CardHeader className="py-3"><CardTitle className="text-base font-medium text-gray-400 flex items-center"><BarChart2 className="mr-2 h-5 w-5" />Weekly Trend (Mins)</CardTitle></CardHeader><CardContent><WeeklyTrendChart data={stats.weeklyFocusTrend} /></CardContent></Card>
                                </div>
                            </div>
                        )}
                        {activeTab === 'insights' && (
                            <div className="py-4 animate-fade-in">
                                {isPro ? (
                                    <>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-base font-medium text-gray-400 flex items-center"><PieChart className="mr-2 h-5 w-5" />Focus by Project</CardTitle></CardHeader><CardContent><FocusByProjectChart data={stats.focusByProject} /></CardContent></Card>
                                            <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-base font-medium text-gray-400 flex items-center"><BarChart className="mr-2 h-5 w-5" />Productivity Heatmap</CardTitle></CardHeader><CardContent><ProductivityHeatmap data={stats.productivityHeatmap} /></CardContent></Card>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-80 text-center space-y-4 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                                        <div className="p-4 bg-gray-800 rounded-full text-yellow-500 mb-2">
                                            <Lock size={48} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Unlock Premium Insights</h3>
                                        <p className="text-gray-400 max-w-md">Gain deep visibility into how you work. See which projects consume your time, visualize your momentum with heatmaps, and access historical data.</p>
                                        <Link href="/pricing" onClick={() => setIsOpen(false)}>
                                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                                                Upgrade to Premium
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}