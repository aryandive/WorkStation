"use client";

import { useState, useEffect, useCallback } from 'react';
//import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@/utils/supabase/client'; // ADDED
import eventBus from '@/lib/eventBus';

export default function useStats() {
    const [stats, setStats] = useState({
        focusTimeToday: 0,
        focusGoal: 120,
        tasksCompletedToday: 0,
        focusStreak: 0,
        weeklyFocusTrend: [],
        totalHoursFocused: 0,
        productivityHeatmap: {}, // Placeholder for now
        focusByProject: [],
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient(); // ADDED initialization

    const fetchAndCalculateStats = useCallback(async () => {
        setLoading(true);

        const { data, error } = await supabase.rpc('get_user_stats');

        if (error) {
            console.error("Error fetching RPC stats:", error);
            setLoading(false);
            return;
        }

        setStats(prevStats => ({
            ...prevStats, // Keep existing state like goal
            ...data, // Overwrite with fresh data from the database
        }));

        setLoading(false);
    }, [supabase]); // ADDED supabase as dependency

    useEffect(() => {
        fetchAndCalculateStats();

        const handleUpdate = () => fetchAndCalculateStats();
        eventBus.on('tasksUpdated', handleUpdate);

        const { data: authListener } = supabase.auth.onAuthStateChange(() => fetchAndCalculateStats());

        return () => {
            eventBus.remove('tasksUpdated', handleUpdate);
            authListener.subscription.unsubscribe();
        };
    }, [fetchAndCalculateStats, supabase.auth]); // ADDED supabase.auth as dependency

    return { stats, loading };
}

