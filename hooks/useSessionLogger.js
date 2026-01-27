"use client";

import { useCallback } from 'react';
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

    const saveSession = useCallback(async ({ duration, taskId, projectId }) => {
        if (!duration || duration <= 0) return;

        const sessionData = {
            id: crypto.randomUUID(),
            user_id: user?.id || 'guest',
            task_id: taskId || null,
            project_id: projectId || null,
            duration_minutes: duration,
            created_at: new Date().toISOString(),
            synced: !!(isPro && user) // simplified boolean cast
        };

        // 2. Traffic Control Logic
        if (isPro && user) {
            // --- PRO USER: Save to Cloud with Retry ---
            try {
                await retryOperation(async () => {
                    const { error } = await supabase.from('focus_sessions').insert({
                        user_id: user.id,
                        task_id: taskId || null,
                        duration_minutes: duration
                    });
                    if (error) throw new Error(error.message);
                });
            } catch (error) {
                console.error("Failed to log session to cloud after retries:", error);
                // Future consideration: Save to local storage as fallback queue
            }
        } else {
            // --- FREE/GUEST USER: Save to Local Storage ---
            try {
                const existing = JSON.parse(localStorage.getItem('ws_focus_sessions') || '[]');
                existing.push(sessionData);
                localStorage.setItem('ws_focus_sessions', JSON.stringify(existing));
                console.log("Session saved locally:", sessionData);
            } catch (e) {
                console.error("Failed to save session locally:", e);
                // Dispatch global warning if storage is full
                if (e.name === 'QuotaExceededError' && typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ws-storage-full'));
                }
            }
        }

        // AFTER saving to DB or LocalStorage:
        eventBus.dispatch('tasksUpdated'); 
        eventBus.dispatch('sessionCompleted'); 
        
    }, [user, isPro, supabase]);

    return { saveSession };
}