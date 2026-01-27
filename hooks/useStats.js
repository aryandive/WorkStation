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
        tasksDoneAllTime: 0,
        totalTasksAllTime: 0,

        daysAccessed: 0,
        totalFocusTimeFormatted: "0h 0m",
        todaysFocusFormatted: "0h 0m",

        weeklyFocusTrend: [],
        chartData: { weekly: [], monthly: [], yearly: [] },
        productivityHeatmap: {},

        // --- UPDATED: Split Project Data ---
        focusByProject: { today: [], week: [] },

        todaysFocusMinutes: 0,
        bestFocusMinutes: 0,
        bestDayDate: null,
        allTimeFocusMinutes: 0,
        weeklyGrowthPercentage: 0
    }), []);

    const [stats, setStats] = useState(defaultStats);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const { isPro, loading: isSubscriptionLoading } = useSubscription();
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    const processStatsData = useCallback((sessions, tasks, projects) => {
        const now = new Date();
        const today = startOfDay(now);
        const todayStr = format(today, 'yyyy-MM-dd');
        const weekStart = subDays(today, 6); // Start of "This Week" (Rolling 7 days)

        // A. Process Tasks
        const totalTasksAllTime = tasks.length;
        const tasksDoneAllTime = tasks.filter(t => t.is_complete).length;

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

        // B. Process Sessions
        const dailyMap = new Map();
        const monthlyMap = new Map();

        // --- UPDATED: Separate Maps for Projects ---
        const projectMapToday = new Map();
        const projectMapWeek = new Map();

        const heatMap = {};

        let totalMinutesAllTime = 0;
        let todayMinutes = 0;
        const uniqueDays = new Set();

        sessions.forEach(s => {
            const duration = s.duration_minutes || 0;
            if (duration <= 0) return;

            const sDate = parseISO(s.created_at);
            const dateKey = format(sDate, 'yyyy-MM-dd');
            const monthKey = format(sDate, 'yyyy-MM');

            totalMinutesAllTime += duration;
            uniqueDays.add(dateKey);

            if (dateKey === todayStr) todayMinutes += duration;

            dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + duration);
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + duration);

            const heatKey = startOfDay(sDate).toISOString();
            heatMap[heatKey] = (heatMap[heatKey] || 0) + duration;

            // Project Logic
            let projectName = 'Unlinked';

            // STRATEGY:
            // 1. Try to get Project ID directly from the session (The Fix)
            // 2. Fallback: If session.project_id is missing (old data), try to find it via task_id
            let effectiveProjectId = s.project_id;

            if (!effectiveProjectId && s.task_id) {
                const task = tasks.find(t => t.id === s.task_id);
                if (task) effectiveProjectId = task.project_id;
            }

            // Now lookup the name using the found ID
            if (effectiveProjectId) {
                const project = projects.find(p => p.id === effectiveProjectId);
                if (project) projectName = project.name;
            }
            // Populate Today Map
            if (isSameDay(sDate, today)) {
                projectMapToday.set(projectName, (projectMapToday.get(projectName) || 0) + duration);
            }

            // Populate Week Map (Rolling 7 Days)
            if (sDate >= weekStart) {
                projectMapWeek.set(projectName, (projectMapWeek.get(projectName) || 0) + duration);
            }
        });

        // Calculate Best Day Record
        let maxDailyMinutes = 0;
        let maxDailyDate = null;
        dailyMap.forEach((minutes, dateStr) => {
            if (minutes > maxDailyMinutes) {
                maxDailyMinutes = minutes;
                maxDailyDate = format(parseISO(dateStr), 'MMM d, yyyy');
            }
        });

        // Generate Chart Data
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

        const weeklyData = generateChartData(7, 'yyyy-MM-dd', 'EEE');
        const monthlyData = generateChartData(30, 'yyyy-MM-dd', 'd MMM');
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

        const formatTime = (totalMins) => {
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            return `${h}h ${m}m`;
        };

        // --- UPDATED: Return separate arrays ---
        const focusByProject = {
            today: Array.from(projectMapToday.entries()).map(([name, minutes]) => ({ name, minutes })),
            week: Array.from(projectMapWeek.entries()).map(([name, minutes]) => ({ name, minutes }))
        };

        return {
            tasksDoneToday, totalTasksToday, tasksDoneAllTime, totalTasksAllTime,
            daysAccessed: uniqueDays.size,
            totalFocusTimeFormatted: formatTime(totalMinutesAllTime),
            todaysFocusFormatted: formatTime(todayMinutes),
            weeklyFocusTrend: weeklyData,
            chartData: { weekly: weeklyData, monthly: monthlyData, yearly: yearlyData },
            productivityHeatmap: heatMap,
            focusByProject, // Returns Object { today: [], week: [] }
            todaysFocusMinutes: todayMinutes,
            bestFocusMinutes: maxDailyMinutes,
            bestDayDate: maxDailyDate,
            allTimeFocusMinutes: totalMinutesAllTime,
            weeklyGrowthPercentage: growth
        };
    }, []);

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

    useEffect(() => {
        const local = calculateLocalStats();
        if (local) {
            setStats(local);
            setIsLoadingStats(false);
        }
    }, [calculateLocalStats]);

    const fetchStats = useCallback(async () => {
        if (!stats.daysAccessed) setIsLoadingStats(true);
        if (isPro && user) {
            try {
                const { data: sessions } = await supabase.from('focus_sessions').select('created_at, duration_minutes, task_id').gte('created_at', subDays(new Date(), 365).toISOString());
                const { data: tasks } = await supabase.from('todos').select('id, created_at, updated_at, is_complete, project_id');
                const { data: projects } = await supabase.from('projects').select('id, name');
                if (sessions) setStats(processStatsData(sessions, tasks || [], projects || []));
            } catch (error) { console.error("Error fetching cloud stats:", error); }
        }
        setIsLoadingStats(false);
    }, [isPro, user, supabase, processStatsData, stats.daysAccessed]);

    useEffect(() => {
        if (!isSubscriptionLoading) fetchStats();
        const handleUpdate = () => {
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