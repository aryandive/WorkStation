'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, BookOpen, Clock, Target, CheckCircle, BarChart3, Folder, Award, Trophy } from 'lucide-react';
import { format, subMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SnapshotsModal({ isOpen, setIsOpen, date }) {
    const { user } = useAuth();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ tasks: [], projects: [], journalPreview: null });
    const [activeTab, setActiveTab] = useState('entries'); // 'entries', 'tasks', 'focus'

    useEffect(() => {
        if (!isOpen || !user || !date) return;

        const fetchData = async () => {
            setLoading(true);
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);

            const isoStart = targetDate.toISOString();
            const isoEnd = nextDate.toISOString();

            // Fetch completed tasks for that day
            const { data: tasksData } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_complete', true)
                .gte('updated_at', isoStart)
                .lt('updated_at', isoEnd);

            // Fetch projects mapping
            const { data: projectsData } = await supabase
                .from('projects')
                .select('id, name')
                .eq('user_id', user.id);

            // Fetch journal entry preview
            const y = targetDate.getFullYear();
            const m = targetDate.getMonth() + 1;
            const d = targetDate.getDate();
            const isoDateOnly = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            const { data: journalData } = await supabase
                .from('journal_entries')
                .select('content, title')
                .eq('user_id', user.id)
                .eq('date', isoDateOnly)
                .single();

            setData({
                tasks: tasksData || [],
                projects: projectsData || [],
                journalPreview: journalData
            });
            setLoading(false);
        };

        fetchData();
        // Reset tab on open
        setActiveTab('entries');
    }, [isOpen, user, date, supabase]);

    const projectMap = useMemo(() => {
        const map = {};
        data.projects.forEach(p => { map[p.id] = p.name; });
        return map;
    }, [data.projects]);

    const enrichedTasks = useMemo(() => {
        return data.tasks.map(t => {
            const minutes = (t.pomodoros_spent || 0) * 25;
            const updatedTime = new Date(t.updated_at);
            const startTime = subMinutes(updatedTime, minutes);
            const timeRange = minutes > 0
                ? `${format(startTime, 'HH:mm')} ~ ${format(updatedTime, 'HH:mm')}`
                : format(updatedTime, 'HH:mm');

            return {
                ...t,
                projectName: t.project_id ? projectMap[t.project_id] || 'No Project' : 'No Project',
                minutes,
                dateFormatted: format(updatedTime, 'dd-MMM-yyyy'),
                timeRange
            };
        });
    }, [data.tasks, projectMap]);

    const focusMetrics = useMemo(() => {
        let totalMinutes = 0;
        let tasksCompleted = enrichedTasks.length;
        const projectMinutes = {};

        enrichedTasks.forEach(t => {
            totalMinutes += t.minutes;
            if (t.minutes > 0) {
                projectMinutes[t.projectName] = (projectMinutes[t.projectName] || 0) + t.minutes;
            }
        });

        let mostActiveProject = 'None';
        let maxProjectMin = 0;
        Object.entries(projectMinutes).forEach(([proj, mins]) => {
            if (mins > maxProjectMin) {
                maxProjectMin = mins;
                mostActiveProject = proj;
            }
        });

        return {
            totalMinutes,
            tasksCompleted,
            mostActiveProject
        };
    }, [enrichedTasks]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl bg-gray-950 border-gray-800 text-gray-100 max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl shadow-2xl">
                <div className="p-6 pb-4 border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                            <Target className="w-6 h-6" />
                            Daily Snapshot: {date ? format(new Date(date), 'MMMM do, yyyy') : ''}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            A complete summary of your journaling, task activity, and focus metrics.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tabs Navigation */}
                    <div className="flex gap-2 mt-6 bg-gray-900/50 p-1 rounded-lg border border-gray-800 inline-flex">
                        <button
                            onClick={() => setActiveTab('entries')}
                            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2", activeTab === 'entries' ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50")}
                        >
                            <BookOpen size={16} /> Entries
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2", activeTab === 'tasks' ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50")}
                        >
                            <CheckCircle size={16} /> Tasks
                        </button>
                        <button
                            onClick={() => setActiveTab('focus')}
                            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2", activeTab === 'focus' ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50")}
                        >
                            <BarChart3 size={16} /> Focus
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-gray-950">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {/* Tab: Entries (Untouched original UI) */}
                            {activeTab === 'entries' && (
                                <section className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 shadow-inner">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <BookOpen className="text-indigo-400" size={20} /> Journal Preview
                                    </h3>
                                    {data.journalPreview ? (
                                        <div>
                                            <h4 className="font-semibold text-gray-200 mb-3 pl-4 border-l-2 border-indigo-500">{data.journalPreview.title}</h4>
                                            <div
                                                className="text-gray-300 text-sm prose prose-invert max-w-none bg-gray-900 p-5 rounded-lg border border-gray-800 shadow-sm"
                                                dangerouslySetInnerHTML={{ __html: data.journalPreview.content }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center bg-gray-900 rounded-lg border border-gray-800/50">
                                            <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No journal entry for this day.</p>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Tab: Tasks (Detailed Activity Log Table) */}
                            {activeTab === 'tasks' && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <CheckCircle className="text-green-500" size={20} /> Activity Log
                                        </h3>
                                        <span className="text-sm font-medium text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                                            {enrichedTasks.length} Completed
                                        </span>
                                    </div>

                                    {enrichedTasks.length > 0 ? (
                                        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-gray-400 uppercase bg-gray-950/50 border-b border-gray-800">
                                                        <tr>
                                                            <th className="px-6 py-4 font-semibold">Date</th>
                                                            <th className="px-6 py-4 font-semibold">Time Range</th>
                                                            <th className="px-6 py-4 font-semibold">Project</th>
                                                            <th className="px-6 py-4 font-semibold">Task Name</th>
                                                            <th className="px-6 py-4 font-semibold text-right">Minutes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-800/50">
                                                        {enrichedTasks.map(t => (
                                                            <tr key={t.id} className="hover:bg-gray-800/50 transition-colors group">
                                                                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{t.dateFormatted}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-xs">{t.timeRange}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 text-xs font-medium border border-gray-700 group-hover:border-gray-600 transition-colors">
                                                                        <Folder size={12} className="text-yellow-500" />
                                                                        {t.projectName}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-gray-200 font-medium">{t.task}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                    <span className="inline-flex items-center justify-end gap-1 text-yellow-500 font-semibold w-full">
                                                                        <Clock size={14} /> {t.minutes}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-16 text-center bg-gray-900 rounded-xl border border-gray-800 shadow-inner">
                                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                                                <CheckCircle className="w-8 h-8 text-gray-600" />
                                            </div>
                                            <h4 className="text-lg font-medium text-gray-300 mb-1">No tasks completed</h4>
                                            <p className="text-gray-500 text-sm">You didn&apos;t complete any tracked tasks on this day.</p>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Tab: Focus (High-Level Summary KPI Cards) */}
                            {activeTab === 'focus' && (
                                <section>
                                    <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                                        <BarChart3 className="text-yellow-500" size={20} /> Focus Overview
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        {/* Card 1: Total Focus Time */}
                                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group hover:border-yellow-500/50 transition-all">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                                                <Clock size={80} className="text-yellow-500" />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-sm font-medium text-gray-400 mb-1">Total Focus Time</p>
                                                <p className="text-4xl font-bold text-white flex items-baseline gap-2">
                                                    {focusMetrics.totalMinutes} <span className="text-lg text-yellow-500 font-normal">min</span>
                                                </p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-700/50 relative z-10">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Target size={12} /> Time spent on focused sessions
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card 2: Tasks Completed */}
                                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group hover:border-green-500/50 transition-all">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                                                <CheckCircle size={80} className="text-green-500" />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-sm font-medium text-gray-400 mb-1">Tasks Completed</p>
                                                <p className="text-4xl font-bold text-white flex items-baseline gap-2">
                                                    {focusMetrics.tasksCompleted} <span className="text-lg text-green-500 font-normal">tasks</span>
                                                </p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-700/50 relative z-10">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Trophy size={12} /> Items checked off your list
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card 3: Most Active Project */}
                                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                                                <Award size={80} className="text-indigo-500" />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-sm font-medium text-gray-400 mb-1">Most Active Project</p>
                                                <p className="text-3xl font-bold text-white truncate pr-4" title={focusMetrics.mostActiveProject}>
                                                    {focusMetrics.mostActiveProject}
                                                </p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-700/50 relative z-10">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Folder size={12} /> Project with highest minutes
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
