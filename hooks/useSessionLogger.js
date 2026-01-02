"use client";

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { createClient } from '@/utils/supabase/client';
import eventBus from '@/lib/eventBus';

export function useSessionLogger() {
    const { user } = useAuth();
    const { isPro } = useSubscription();
    const supabase = createClient();

    const saveSession = useCallback(async ({ duration, taskId }) => {
        if (!duration || duration <= 0) return;

        // 1. Prepare the data object (Normalized for both storages)
        const sessionData = {
            id: crypto.randomUUID(), // Generate a unique ID
            user_id: user?.id || 'guest',
            task_id: taskId || null,
            duration_minutes: duration,
            created_at: new Date().toISOString(),
            synced: isPro // Flag to track if this needs syncing later
        };

        // 2. Traffic Control Logic
        if (isPro && user) {
            // --- PRO USER: Save to Cloud ---
            const { error } = await supabase.from('focus_sessions').insert({
                user_id: user.id,
                task_id: taskId || null,
                duration_minutes: duration
            });

            if (error) {
                console.error("Failed to log session to cloud:", error);
                // Fallback: Save locally if cloud fails? 
                // For now, let's just log the error to avoid complexity.
            }
        } else {
            // --- FREE/GUEST USER: Save to Local Storage ---
            try {
                // Fetch existing sessions
                const existing = JSON.parse(localStorage.getItem('ws_focus_sessions') || '[]');

                // Add new session
                existing.push(sessionData);

                // Save back
                localStorage.setItem('ws_focus_sessions', JSON.stringify(existing));

                console.log("Session saved locally:", sessionData);
            } catch (e) {
                console.error("Failed to save session locally:", e);
            }
        }

        // AFTER saving to DB or LocalStorage:
        eventBus.dispatch('tasksUpdated'); // Update task list
        eventBus.dispatch('sessionCompleted'); // Update stats
        
    }, [user, isPro, supabase]);

    return { saveSession };
}