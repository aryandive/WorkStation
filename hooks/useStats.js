"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import eventBus from '@/lib/eventBus';
import { 
    startOfDay, isSameDay, subDays, parseISO, subMonths, 
    format, isSameMonth 
} from 'date-fns';

export default function useStats() {
    const defaultStats = useMemo(() => ({
        tasksDoneToday: 0,
        totalTasksToday: 0,
        daysAccessed: 0,
        totalFocusTimeFormatted: "0h 0m",
        weeklyFocusTrend: [],
        chartData: { weekly: [], monthly: [], yearly: [] },
        productivityHeatmap: {},
        focusByProject: [],
        todaysFocusMinutes: 0,
        bestFocusMinutes: 0,
        allTimeFocusMinutes: 0,
        weeklyGrowthPercentage: 0
    }), []);

    const [stats, setStats] = useState(defaultStats);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const { isPro, loading: isSubscriptionLoading } = useSubscription();
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    // --- 1. Core Logic (O(N) Complexity) ---
    const processStatsData = useCallback((sessions, tasks, projects) => {
        const now = new Date();
        const today = startOfDay(now);
        const todayStr = format(today, 'yyyy-MM-dd');

        // A. Process Tasks
        let totalTasksToday = 0;
        let tasksDoneToday = 0;
        
        tasks.forEach(t => {
            const created = t.created_at ? parseISO(t.created_at) : new Date();
            const updated = t.updated_at ? parseISO(t.updated_at) : created;
            if (isSameDay(created, today) || isSameDay(updated, today)) {
                totalTasksToday++;
                if (t.is_complete) tasksDoneToday++;
            }
        });

        // B. Process Sessions (Aggregation Maps)
        const dailyMap = new Map();   
        const monthlyMap = new Map(); 
        const projectMap = new Map(); 
        const heatMap = {};           

        let totalMinutesAllTime = 0;
        let maxSession = 0;
        let todayMinutes = 0;
        const uniqueDays = new Set();

        sessions.forEach(s => {
            const duration = s.duration_minutes || 0;
            if (duration <= 0) return;

            const sDate = parseISO(s.created_at);
            const dateKey = format(sDate, 'yyyy-MM-dd');
            const monthKey = format(sDate, 'yyyy-MM');

            totalMinutesAllTime += duration;
            if (duration > maxSession) maxSession = duration;
            uniqueDays.add(dateKey);

            if (dateKey === todayStr) todayMinutes += duration;

            dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + duration);
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + duration);

            const heatKey = startOfDay(sDate).toISOString();
            heatMap[heatKey] = (heatMap[heatKey] || 0) + duration;

            let projectName = 'Unlinked';
            if (s.task_id) {
                const task = tasks.find(t => t.id === s.task_id);
                if (task && task.project_id) {
                    const project = projects.find(p => p.id === task.project_id);
                    if (project) projectName = project.name;
                }
            }
            projectMap.set(projectName, (projectMap.get(projectName) || 0) + duration);
        });

        // C. Generate Chart Data
        const generateChartData = (daysBack, dateFormat, labelFormat) => {
            const data = [];
            for (let i = daysBack - 1; i >= 0; i--) {
                const targetDate = subDays(today, i);
                const key = format(targetDate, dateFormat);
                const mins = dailyMap.get(key) || 0;
                
                data.push({
                    name: format(targetDate, labelFormat), 
                    minutes: mins,
                    fullDate: format(targetDate, 'd MMM yyyy'),
                });
            }
            return data;
        };

        // Weekly (Last 7 Days)
        const weeklyData = generateChartData(7, 'yyyy-MM-dd', 'EEE');

        // Monthly (Last 30 Days) - FIX: Always provide a name for correct tooltips
        const monthlyData = generateChartData(30, 'yyyy-MM-dd', 'd MMM');

        // Yearly (Last 12 Months)
        const yearlyData = [];
        for (let i = 11; i >= 0; i--) {
            const targetMonth = subMonths(today, i);
            const key = format(targetMonth, 'yyyy-MM');
            yearlyData.push({
                name: format(targetMonth, 'MMM'),
                minutes: monthlyMap.get(key) || 0,
                fullDate: format(targetMonth, 'MMMM yyyy')
            });
        }

        // D. Growth & Formatting
        const thisWeekSum = weeklyData.reduce((acc, curr) => acc + curr.minutes, 0);
        let lastWeekSum = 0;
        for (let i = 13; i >= 7; i--) {
            const targetDate = subDays(today, i);
            const key = format(targetDate, 'yyyy-MM-dd');
            lastWeekSum += (dailyMap.get(key) || 0);
        }

        let growth = 0;
        if (lastWeekSum === 0) growth = thisWeekSum > 0 ? 100 : 0;
        else growth = Math.round(((thisWeekSum - lastWeekSum) / lastWeekSum) * 100);

        const hours = Math.floor(totalMinutesAllTime / 60);
        const mins = totalMinutesAllTime % 60;
        const focusByProject = Array.from(projectMap.entries()).map(([name, minutes]) => ({ name, minutes }));

        return {
            tasksDoneToday,
            totalTasksToday,
            daysAccessed: uniqueDays.size,
            totalFocusTimeFormatted: `${hours}h ${mins}m`,
            weeklyFocusTrend: weeklyData,
            chartData: { weekly: weeklyData, monthly: monthlyData, yearly: yearlyData },
            productivityHeatmap: heatMap,
            focusByProject,
            todaysFocusMinutes: todayMinutes,
            bestFocusMinutes: maxSession,
            allTimeFocusMinutes: totalMinutesAllTime,
            weeklyGrowthPercentage: growth
        };
    }, []);

    // --- 2. Local Storage Logic ---
    const calculateLocalStats = useCallback(() => {
        try {
            if (typeof window === 'undefined') return null;
            const sessions = JSON.parse(localStorage.getItem('ws_focus_sessions') || '[]');
            const tasks = JSON.parse(localStorage.getItem('ws_tasks') || '[]');
            const projects = JSON.parse(localStorage.getItem('ws_projects') || '[]');
            return processStatsData(sessions, tasks, projects);
        } catch (e) {
            console.error("Error calculating local stats:", e);
            return null;
        }
    }, [processStatsData]);

    // --- 3. Optimistic Loading (Instant Local Load) ---
    useEffect(() => {
        const local = calculateLocalStats();
        if (local) {
            setStats(local);
            setIsLoadingStats(false); // Immediate "Ready" state
        }
    }, [calculateLocalStats]);

    // --- 4. Cloud Fetch (Background Sync) ---
    const fetchStats = useCallback(async () => {
        // If we don't have local data yet, show loading. 
        // If we do, keep showing local data while we fetch (silent update).
        if (!stats.daysAccessed) setIsLoadingStats(true);

        if (isPro && user) {
            try {
                const { data: sessions } = await supabase.from('focus_sessions').select('created_at, duration_minutes, task_id').gte('created_at', subDays(new Date(), 365).toISOString()); // Optimization: Fetch last year only
                const { data: tasks } = await supabase.from('todos').select('id, created_at, updated_at, is_complete, project_id');
                const { data: projects } = await supabase.from('projects').select('id, name');
                
                if (sessions) setStats(processStatsData(sessions, tasks || [], projects || []));
            } catch (error) {
                console.error("Error fetching cloud stats:", error);
            }
        }
        setIsLoadingStats(false);
    }, [isPro, user, supabase, processStatsData, stats.daysAccessed]);

    // --- 5. Event Listeners ---
    useEffect(() => {
        if (!isSubscriptionLoading) fetchStats();
        
        const handleUpdate = () => {
            // Update immediately from local, then sync
            const local = calculateLocalStats();
            if (local) setStats(local);
            fetchStats();
        };

        eventBus.on('tasksUpdated', handleUpdate);
        eventBus.on('sessionCompleted', handleUpdate);
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') fetchStats();
        });
        
        return () => {
            eventBus.remove('tasksUpdated', handleUpdate);
            eventBus.remove('sessionCompleted', handleUpdate);
            subscription.unsubscribe();
        };
    }, [fetchStats, isSubscriptionLoading, supabase, calculateLocalStats]);

    return { stats, loading: isLoadingStats };
}