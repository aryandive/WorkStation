'use client';

import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import eventBus from '@/lib/eventBus';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // --- MIGRATION LOGIC (Wrapped in useCallback) ---
    const migrateGuestData = useCallback(async (userId) => {
        const localProjects = JSON.parse(localStorage.getItem('ws_projects') || '[]');
        const localTasks = JSON.parse(localStorage.getItem('ws_tasks') || '[]');

        if (localProjects.length === 0 && localTasks.length === 0) return;

        console.log("Migrating guest data...");
        const idMap = {}; // Maps local_id -> supabase_uuid

        // 1. Migrate Projects
        for (const p of localProjects) {
            // Remove local ID, assign user_id

            const { id, ...projectData } = p;
            const { data, error } = await supabase
                .from('projects')
                .insert({ ...projectData, user_id: userId })
                .select()
                .single();

            if (error) {
                console.error("Migration error (project):", error);
                continue;
            }
            if (data) idMap[p.id] = data.id;
        }

        // 2. Migrate Tasks (using new Project IDs)
        const tasksToUpload = localTasks.map(t => {

            const { id, ...taskData } = t;
            return {
                ...taskData,
                user_id: userId,
                project_id: idMap[t.project_id] || null // Map to new UUID
            };
        });

        if (tasksToUpload.length > 0) {
            const { error } = await supabase.from('todos').insert(tasksToUpload);
            if (error) console.error("Migration error (tasks):", error);
        }

        // 3. Clear Local Storage
        localStorage.removeItem('ws_projects');
        localStorage.removeItem('ws_tasks');
        localStorage.removeItem('ws_focus_sessions');

        console.log("Migration complete.");
        eventBus.dispatch('tasksUpdated');
    }, [supabase]); // Dependency is strictly supabase client

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

            // Trigger Migration on Sign In
            if (event === 'SIGNED_IN' && session?.user) {
                await migrateGuestData(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth, migrateGuestData]); // migrateGuestData is now a stable dependency

    const value = {
        user,
        loading,
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