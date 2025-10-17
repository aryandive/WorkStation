'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // THIS IS THE KEY: This event only fires AFTER Supabase has processed the URL
            // and created the temporary recovery session.
            if (event === 'PASSWORD_RECOVERY') {
                router.push('/update-password');
                return; // Stop further processing for this event
            }

            // For all other events, update the user state.
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Also check for user on initial load
        const getInitialUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        }

        getInitialUser();

        return () => subscription.unsubscribe();
    }, [supabase.auth, router]);

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