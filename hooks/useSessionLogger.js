"use client";

import { useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { createClient } from '@/utils/supabase/client';
import eventBus from '@/lib/eventBus';

// Helper: Simple retry logic with linear backoff
async function retryOperation(operation, retries = 2, delay = 1000) {
    try {
        return await operation();
    } catch (err) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return retryOperation(operation, retries - 1, delay * 1.5);
        }
        throw err;
    }
}

export function useSessionLogger() {
    const { user } = useAuth();
    const { isPro } = useSubscription();
    const supabase = createClient();

    // --- RECOVERY LOGIC ---
    const processOfflineQueue = useCallback(async () => {
        if (!user || !isPro) return;
        
        // Safety check for window
        if (typeof window === 'undefined') return;

        const queue = JSON.parse(localStorage.getItem('ws_offline_queue') || '[]');
        if (queue.length === 0) return;

        const remaining = [];
        for (const session of queue) {
            const { error } = await supabase.from('focus_sessions').insert(session);
            if (error) {
                console.warn("Failed to process offline session:", error);
                remaining.push(session); 
            }
        }
        
        localStorage.setItem('ws_offline_queue', JSON.stringify(remaining));
        
        if (queue.length !== remaining.length) {
            eventBus.dispatch('sessionCompleted');
            eventBus.dispatch('tasksUpdated');
        }
    }, [user, isPro, supabase]);

    // Listen for online status AND mount
    useEffect(() => {
        processOfflineQueue();
        
        const handleOnline = () => processOfflineQueue();
        window.addEventListener('online', handleOnline);
        
        return () => window.removeEventListener('online', handleOnline);
    }, [processOfflineQueue]);
    // -----------------------

    const saveSession = useCallback(async ({ duration, taskId, projectId }) => {
        if (!duration || duration <= 0) return;

        const sessionData = {
            user_id: user?.id || 'guest',
            task_id: taskId || null,
            project_id: projectId || null,
            duration_minutes: duration,
            created_at: new Date().toISOString(),
        };

        if (isPro && user) {
            // --- PRO USER: Save to Cloud with Retry ---
            try {
                await retryOperation(async () => {
                    const { error } = await supabase.from('focus_sessions').insert({
                       ...sessionData,
                       user_id: user.id 
                    });
                    if (error) throw new Error(error.message);
                });
                processOfflineQueue(); // Flush queue on success
            } catch (error) {
                console.error("Cloud save failed. Queuing locally:", error);
                // --- FALLBACK QUEUE ---
                const queue = JSON.parse(localStorage.getItem('ws_offline_queue') || '[]');
                queue.push(sessionData);
                localStorage.setItem('ws_offline_queue', JSON.stringify(queue));
            }
        } else {
            // --- FREE/GUEST USER: Save to Local Storage ---
            try {
                const existing = JSON.parse(localStorage.getItem('ws_focus_sessions') || '[]');
                existing.push({ ...sessionData, id: crypto.randomUUID() });
                localStorage.setItem('ws_focus_sessions', JSON.stringify(existing));
            } catch (e) {
                console.error("Failed to save session locally:", e);
                if (e.name === 'QuotaExceededError' && typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ws-storage-full'));
                }
            }
        }

        eventBus.dispatch('tasksUpdated'); 
        eventBus.dispatch('sessionCompleted'); 
        
    }, [user, isPro, supabase, processOfflineQueue]);

    return { saveSession };
}