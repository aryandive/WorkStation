'use client';

import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import eventBus from '@/lib/eventBus';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    // --- NEW: Track Migration Status for UI ---
    const [isMigrating, setIsMigrating] = useState(false);
    
    const supabase = createClient();

    // --- MIGRATION LOGIC (The Bridge) ---
    const migrateGuestData = useCallback(async (userId) => {
        // 1. Check if already run or nothing to migrate
        if (typeof window !== 'undefined' && localStorage.getItem('ws_migration_done')) return;

        const localProjects = JSON.parse(localStorage.getItem('ws_projects') || '[]');
        const localTasks = JSON.parse(localStorage.getItem('ws_tasks') || '[]');
        const localJournals = JSON.parse(localStorage.getItem('ws_journal_entries') || '{}');
        
        const hasJournals = Object.keys(localJournals).length > 0;
        const hasTasks = localProjects.length > 0 || localTasks.length > 0;

        if (!hasTasks && !hasJournals) return;

        console.log("🌊 Starting Data Migration...");
        setIsMigrating(true); // Start Spinner

        try {
            // --- A. Migrate Journals ---
            if (hasJournals) {
                const journalInserts = Object.entries(localJournals).map(([date, entry]) => ({
                    user_id: userId,
                    date: date, // 'YYYY-MM-DD'
                    title: entry.title || '',
                    content: entry.content || '',
                    updated_at: new Date().toISOString()
                }));

                // Batch insert (ignore duplicates to be safe)
                const { error: journalError } = await supabase
                    .from('journal_entries')
                    .upsert(journalInserts, { onConflict: 'user_id, date' });

                if (journalError) console.error("Migration error (journals):", journalError);
                else console.log(`✅ Migrated ${journalInserts.length} journals.`);
            }

            // --- B. Migrate Projects & Tasks ---
            if (hasTasks) {
                const idMap = {}; 

                // Projects
                for (const p of localProjects) {
                    const { id, ...projectData } = p;
                    const { data, error } = await supabase
                        .from('projects')
                        .insert({ ...projectData, user_id: userId })
                        .select()
                        .single();

                    if (!error && data) idMap[p.id] = data.id;
                }

                // Tasks
                const tasksToUpload = localTasks.map(t => {
                    const { id, ...taskData } = t;
                    return {
                        ...taskData,
                        user_id: userId,
                        project_id: idMap[t.project_id] || null 
                    };
                });

                if (tasksToUpload.length > 0) {
                    const { error: taskError } = await supabase.from('todos').insert(tasksToUpload);
                    if (taskError) console.error("Migration error (tasks):", taskError);
                }
            }

            // --- C. Cleanup & Finish ---
            localStorage.removeItem('ws_projects');
            localStorage.removeItem('ws_tasks');
            localStorage.removeItem('ws_focus_sessions');
            localStorage.removeItem('ws_journal_entries'); // Clear journals
            
            localStorage.setItem('ws_migration_done', 'true');
            
            // Notify System
            eventBus.dispatch('tasksUpdated');
            // We can also dispatch a 'journalsUpdated' if your journal page listens for it
            
        } catch (err) {
            console.error("Migration Critical Failure:", err);
        } finally {
            setIsMigrating(false); // Stop Spinner
            console.log("✨ Migration Complete.");
        }
    }, [supabase]);

    useEffect(() => {
        const getInitialUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        }

        getInitialUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);

            if (event === 'SIGNED_IN' && session?.user) {
                await migrateGuestData(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth, migrateGuestData]);

    const value = {
        user,
        loading,
        isMigrating, // Exposed for UI
        isSignUpModalOpen,
        openSignUpModal: () => setIsSignUpModalOpen(true),
        closeSignUpModal: () => setIsSignUpModalOpen(false),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}