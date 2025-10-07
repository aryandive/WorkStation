"use client";

import { BarChart, CheckCircle, Flame, Target, X, Clock, BarChart2, PieChart } from 'lucide-react';
import useStats from '@/hooks/useStats';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Pie, PieChart as RechartsPieChart, Cell } from 'recharts';

// --- Reusable Sub-Components for the Stats Popup ---

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
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#38B2AC" // Teal color
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-white">{focusTime}</span>
                <span className="text-sm text-gray-400">/ {goal} min</span>
            </div>
        </div>
    );
};

const WeeklyTrendChart = ({ data }) => {
    const maxValue = Math.max(...data, 60); // Ensure a minimum height for the chart
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const todayIndex = new Date().getDay();

    const chartData = days.map((day, index) => {
        const dayOffset = (todayIndex - (6 - index) + 7) % 7;
        // This logic correctly maps Sunday (0) to the first bar, etc.
        const targetDayIndex = (todayIndex - dayOffset + 7) % 7;
        return {
            name: days[targetDayIndex],
            minutes: data[targetDayIndex] || 0
        };
    });


    return (
        <ResponsiveContainer width="100%" height={150}>
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ background: "#1F2937", border: '1px solid #4B5563', borderRadius: '0.5rem' }} labelStyle={{ color: '#F9FAFB' }} />
                <Bar dataKey="minutes" fill="#38B2AC" radius={[4, 4, 0, 0]}>
                    {
                        chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 6 ? '#FBBF24' : '#38B2AC'} />
                        ))
                    }
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};


const ProductivityHeatmap = ({ data }) => {
    // ... A real implementation would be more complex, this is a placeholder UI
    return (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-center text-gray-400">(Productivity Heatmap UI would go here)</p>
            <p className="text-center text-xs text-gray-500 mt-2">This feature would show your focus consistency over the past year.</p>
        </div>
    )
}

const FocusByProjectChart = ({ data }) => {
    const COLORS = ['#38B2AC', '#FBBF24', '#60A5FA', '#F87171', '#A78BFA'];
    if (!data || data.length === 0) return <p className="text-center text-gray-400">No project data to display.</p>
    return (
        <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
                <RechartsTooltip contentStyle={{ background: "#1F2937", border: '1px solid #4B5563', borderRadius: '0.5rem' }} />
                <Pie data={data} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
            </RechartsPieChart>
        </ResponsiveContainer>
    )
}


// --- The Main Stats Popup Component ---
export default function StatsPopup({ isOpen, setIsOpen }) {
    const { stats, loading } = useStats();
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900/80 backdrop-blur-md border-gray-700 text-white max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-yellow-400">My Stats</DialogTitle>
                </DialogHeader>

                <div className="border-b border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            Dashboard
                        </button>
                        <button onClick={() => setActiveTab('insights')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'insights' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            Premium Insights
                        </button>
                    </nav>
                </div>


                {loading ? (
                    <div className="flex justify-center items-center h-80"><p>Loading stats...</p></div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 animate-fade-in">
                                <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4">
                                    <h3 className="text-lg font-medium text-gray-300">Today&apos;s Focus Goal</h3>
                                    <FocusGoalRing focusTime={stats.focusTimeToday} goal={stats.focusGoal} />
                                </div>
                                <div className="md:col-span-3 space-y-6">
                                    <div className="grid grid-cols-3 gap-6">
                                        <StatCard icon={<CheckCircle className="h-5 w-5 text-green-400" />} label="Tasks Completed" value={stats.tasksCompletedToday} />
                                        <StatCard icon={<Flame className="h-5 w-5 text-orange-400" />} label="Focus Streak" value={stats.focusStreak} unit="days" />
                                        <StatCard icon={<Clock className="h-5 w-5 text-blue-400" />} label="Total Hours" value={stats.totalHoursFocused} unit="hrs" />
                                    </div>
                                    <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-base font-medium text-gray-400 flex items-center"><BarChart2 className="mr-2 h-5 w-5" />Weekly Trend</CardTitle></CardHeader><CardContent><WeeklyTrendChart data={stats.weeklyFocusTrend} /></CardContent></Card>
                                </div>
                            </div>
                        )}
                        {activeTab === 'insights' && (
                            <div className="py-4 animate-fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-base font-medium text-gray-400 flex items-center"><PieChart className="mr-2 h-5 w-5" />Focus by Project</CardTitle></CardHeader><CardContent><FocusByProjectChart data={stats.focusByProject} /></CardContent></Card>
                                    <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-base font-medium text-gray-400 flex items-center"><BarChart className="mr-2 h-5 w-5" />Productivity Heatmap</CardTitle></CardHeader><CardContent><ProductivityHeatmap data={stats.productivityHeatmap} /></CardContent></Card>
                                </div>
                                <div className="text-center mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                                    <p className="text-yellow-300 font-semibold">More insights are coming soon!</p>
                                    <p className="text-sm text-yellow-400/80">Features like Time of Day Analysis and custom date ranges will be part of the full premium experience.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

