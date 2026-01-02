"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import eventBus from '@/lib/eventBus';
import { startOfDay, isSameDay, subDays, parseISO, differenceInCalendarDays } from 'date-fns';

export default function useStats() {
    const [stats, setStats] = useState({
        focusTimeToday: 0,
        focusGoal: 120, // Default goal
        tasksCompletedToday: 0,
        focusStreak: 0,
        weeklyFocusTrend: [0, 0, 0, 0, 0, 0, 0],
        totalHoursFocused: 0,
        productivityHeatmap: {},
        focusByProject: [],
    });

    // We combine global loading + specific stats loading
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const { isPro, loading: isSubscriptionLoading } = useSubscription();
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    // --- ENGINE 1: LOCAL CALCULATION (For Free/Guest Users) ---
    const calculateLocalStats = useCallback(() => {
        try {
            const now = new Date();
            const today = startOfDay(now);

            // 1. Fetch Local Data
            const sessions = JSON.parse(localStorage.getItem('ws_focus_sessions') || '[]');
            const tasks = JSON.parse(localStorage.getItem('ws_tasks') || '[]');
            const projects = JSON.parse(localStorage.getItem('ws_projects') || '[]');

            // 2. Filter Metrics
            const todaySessions = sessions.filter(s => isSameDay(parseISO(s.created_at), today));
            const focusTimeToday = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

            const tasksCompletedToday = tasks.filter(t =>
                t.is_complete &&
                t.updated_at &&
                isSameDay(parseISO(t.updated_at), today)
            ).length;

            const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

            // 3. Weekly Trend (Last 7 Days)
            const weeklyTrend = [];
            // Recharts expects array in order (e.g., Sun -> Sat). 
            // But your component maps them based on "Today".
            // Let's standardly return an array where index 0 is 6 days ago, index 6 is Today.
            for (let i = 6; i >= 0; i--) {
                const targetDay = subDays(today, i);
                const dailyMins = sessions
                    .filter(s => isSameDay(parseISO(s.created_at), targetDay))
                    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
                weeklyTrend.push(dailyMins);
            }

            // 4. Focus By Project
            const projectMap = {};
            sessions.forEach(session => {
                let projectName = 'Unlinked';
                if (session.task_id) {
                    const task = tasks.find(t => t.id === session.task_id);
                    if (task && task.project_id) {
                        const project = projects.find(p => p.id === task.project_id);
                        if (project) projectName = project.name;
                    }
                }
                projectMap[projectName] = (projectMap[projectName] || 0) + (session.duration_minutes || 0);
            });

            const focusByProject = Object.keys(projectMap).map(name => ({
                name,
                minutes: projectMap[name]
            }));

            // 5. Streak Logic (Simple Version)
            // Sort sessions by date descending
            const sortedDates = [...new Set(sessions.map(s => startOfDay(parseISO(s.created_at)).toISOString()))].sort().reverse();
            let streak = 0;
            // Check if we have a session today or yesterday to keep streak alive
            if (sortedDates.length > 0) {
                const lastSessionDate = parseISO(sortedDates[0]);
                const diff = differenceInCalendarDays(today, lastSessionDate);

                if (diff <= 1) {
                    streak = 1;
                    for (let i = 0; i < sortedDates.length - 1; i++) {
                        const current = parseISO(sortedDates[i]);
                        const prev = parseISO(sortedDates[i + 1]);
                        if (differenceInCalendarDays(current, prev) === 1) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                }
            }

            return {
                focusTimeToday,
                focusGoal: 120, // Keep default or fetch from settings if you have them
                tasksCompletedToday,
                focusStreak: streak,
                weeklyFocusTrend: weeklyTrend, // Needs to match Recharts data structure
                totalHoursFocused: parseFloat((totalMinutes / 60).toFixed(1)),
                productivityHeatmap: {},
                focusByProject,
            };

        } catch (e) {
            console.error("Error calculating local stats:", e);
            return null;
        }
    }, []);

    // --- ENGINE 2: HYBRID FETCHER ---
    const fetchStats = useCallback(async () => {
        setIsLoadingStats(true);

        if (isPro && user) {
            // --- OPTION A: PRO USER (Fetch from DB) ---
            const { data, error } = await supabase.rpc('get_user_stats');

            if (error) {
                console.error("Error fetching RPC stats:", error);
                // Fallback to local if server fails? For now just stop.
                setIsLoadingStats(false);
                return;
            }

            if (data) {
                setStats(prev => ({ ...prev, ...data }));
            }
        } else {
            // --- OPTION B: FREE USER (Calculate Locally) ---
            const localData = calculateLocalStats();
            if (localData) {
                // We map the weekly trend to match the DB format if necessary
                // The DB logic usually needs to match the specific "Daily" index logic in your chart.
                // For now, passing the raw array.
                setStats(prev => ({ ...prev, ...localData }));
            }
        }

        setIsLoadingStats(false);
    }, [isPro, user, supabase, calculateLocalStats]);

    // --- TRIGGERS ---
    useEffect(() => {
        if (!isSubscriptionLoading) {
            fetchStats();
        }

        const handleUpdate = () => fetchStats();

        // Listen to global events
        eventBus.on('tasksUpdated', handleUpdate); // For task counts
        eventBus.on('sessionCompleted', handleUpdate); // You might need to add this dispatch in your logger!

        // Also listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                fetchStats();
            }
        });

        return () => {
            eventBus.remove('tasksUpdated', handleUpdate);
            eventBus.remove('sessionCompleted', handleUpdate);
            subscription.unsubscribe();
        };
    }, [fetchStats, isSubscriptionLoading, supabase]);

    return { stats, loading: isLoadingStats || isSubscriptionLoading };
}