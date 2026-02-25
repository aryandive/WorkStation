// components/journal/DailySnapshotModal.js
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DailySnapshotModal({ isOpen, setIsOpen, date }) {
    const { user } = useAuth();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ tasks: [], focusLogs: [], journalPreview: null });

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

            // Fetch focus logs (assuming pomodoro or tasks spent)
            const { data: focusData } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', user.id)
                .gt('pomodoros_spent', 0)
                .gte('updated_at', isoStart)
                .lt('updated_at', isoEnd);

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
                focusLogs: focusData || [],
                journalPreview: journalData
            });
            setLoading(false);
        };

        fetchData();
    }, [isOpen, user, date, supabase]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-gray-100 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-yellow-400">
                        Daily Snapshot: {date ? format(new Date(date), 'MMMM do, yyyy') : ''}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        A correlated deep dive into your focus, tasks, and journal.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                    </div>
                ) : (
                    <div className="space-y-6 mt-4">
                        {/* Tasks Section */}
                        <section className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-bold mb-3 flex items-center text-white">
                                <CheckCircle className="mr-2 text-green-500" size={20} />
                                Tasks Completed ({data.tasks?.length || 0})
                            </h3>
                            {data.tasks?.length > 0 ? (
                                <ul className="space-y-2">
                                    {data.tasks.map(t => (
                                        <li key={t.id} className="text-gray-300 text-sm flex items-center p-3 rounded-lg group hover:bg-gray-700/50 hover:text-white transition-all duration-200 border-l-2 border-transparent hover:border-green-500 cursor-default">
                                            <span className="mr-3 w-2 h-2 bg-green-500/50 group-hover:bg-green-500 rounded-full shrink-0 transition-colors"></span>
                                            {t.task}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No tasks completed on this day.</p>
                            )}
                        </section>

                        {/* Focus Logs Section */}
                        <section className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-bold mb-3 flex items-center text-white">
                                <Clock className="mr-2 text-yellow-500" size={20} />
                                Focus Activity
                            </h3>
                            {data.focusLogs?.length > 0 ? (
                                <ul className="space-y-2">
                                    {data.focusLogs.map(t => (
                                        <li key={t.id} className="text-gray-300 text-sm flex items-center justify-between p-3 rounded-lg group hover:bg-gray-700/50 hover:text-white transition-all duration-200 border-l-2 border-transparent hover:border-yellow-500 cursor-default">
                                            <span className="flex items-center">
                                                <span className="mr-3 w-2 h-2 bg-yellow-500/50 group-hover:bg-yellow-500 rounded-full shrink-0 transition-colors"></span>
                                                {t.task}
                                            </span>
                                            <span className="text-yellow-500/70 group-hover:text-yellow-400 font-bold ml-4 shrink-0 transition-colors">{t.pomodoros_spent} pomodoros</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No focus activity recorded.</p>
                            )}
                        </section>

                        {/* Journal Preview Section */}
                        <section className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-bold mb-3 text-white">Journal Preview</h3>
                            {data.journalPreview ? (
                                <div>
                                    <h4 className="font-semibold text-gray-200 mb-2 pl-3">{data.journalPreview.title}</h4>
                                    <div
                                        className="text-gray-400 text-sm prose prose-invert line-clamp-4 p-3 rounded-lg group hover:bg-gray-700/50 cursor-default transition-all duration-200 border-l-2 border-transparent hover:border-indigo-500 hover:text-gray-300"
                                        dangerouslySetInnerHTML={{ __html: data.journalPreview.content }}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No journal entry for this day.</p>
                            )}
                        </section>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
