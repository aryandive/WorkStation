'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * A unified hook to manage state that seamlessly switches between Supabase (for authenticated users)
 * and localStorage (for anonymous/guest users). This enables a "Try Before You Buy" experience.
 *
 * @param {string} tableName - The Supabase table name (e.g., 'todos', 'projects')
 * @param {string} localKey - The localStorage key used for guests (e.g., 'ws_tasks', 'ws_projects')
 */
export function useGuestState(tableName, localKey) {
    const [data, setData] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // stable supabase client
    const supabase = createClient();

    // 1. Initialize user state using Edge-friendly getSession
    useEffect(() => {
        const initUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);
        };
        initUser();

        // Listen for auth changes to smoothly transition from guest to auth
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase.auth]);

    // 2. Fetch Data (Intercepts DB calls depending on Auth State)
    const fetchData = useCallback(async (queryModifier = null) => {
        if (loading) return; // Wait until auth state is known

        if (user) {
            // Evaluates Supabase query
            let query = supabase.from(tableName).select('*').eq('user_id', user.id);
            if (queryModifier) {
                query = queryModifier(query);
            }

            const { data: result, error: fetchError } = await query;
            if (fetchError) {
                console.error(`[useGuestState] Fetch Error on ${tableName}:`, fetchError);
                setError(fetchError);
                return [];
            }
            setData(result || []);
            return result;
        } else {
            // Guest Mode: load from localStorage
            try {
                const localData = localStorage.getItem(localKey);
                const parsed = localData ? JSON.parse(localData) : [];
                setData(parsed);
                return parsed;
            } catch (e) {
                console.error(`[useGuestState] LocalStorage Error on ${localKey}:`, e);
                return [];
            }
        }
    }, [user, loading, tableName, localKey, supabase]);

    // 3. Insert Data
    const insertData = async (newItem) => {
        if (user) {
            const payload = { ...newItem, user_id: user.id };
            const { data: result, error: insertError } = await supabase.from(tableName).insert([payload]).select();
            if (insertError) {
                setError(insertError);
                return null;
            }
            setData(prev => [...prev, ...(result || [])]);
            return result;
        } else {
            // Generates a mock UUID and saves locally
            const mockId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const payload = { ...newItem, id: mockId, created_at: new Date().toISOString() };

            const newData = [...data, payload];
            setData(newData);
            localStorage.setItem(localKey, JSON.stringify(newData));
            return [payload];
        }
    };

    // 4. Update Data
    const updateData = async (id, updates) => {
        if (user) {
            const { data: result, error: updateError } = await supabase.from(tableName).update(updates).eq('id', id).select();
            if (updateError) {
                setError(updateError);
                return null;
            }
            setData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
            return result;
        } else {
            const newData = data.map(item => item.id === id ? { ...item, ...updates } : item);
            setData(newData);
            localStorage.setItem(localKey, JSON.stringify(newData));
            return newData.filter(item => item.id === id);
        }
    };

    // 5. Delete Data
    const deleteData = async (id) => {
        if (user) {
            const { error: deleteError } = await supabase.from(tableName).delete().eq('id', id);
            if (deleteError) {
                setError(deleteError);
                return false;
            }
            setData(prev => prev.filter(item => item.id !== id));
            return true;
        } else {
            const newData = data.filter(item => item.id !== id);
            setData(newData);
            localStorage.setItem(localKey, JSON.stringify(newData));
            return true;
        }
    };

    return {
        data,
        user,
        loading,
        error,
        fetchData,
        insertData,
        updateData,
        deleteData,
        setData // Provide manual override if needed
    };
}
