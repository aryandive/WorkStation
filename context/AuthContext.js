'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { createClient } from '@/utils/supabase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [loading, setLoading] = useState(true); // Add loading state
    const supabase = createClient();

    useEffect(() => {
        const getInitialUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        }

        getInitialUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });


        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const value = {
        user,
        loading, // Expose loading state
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

