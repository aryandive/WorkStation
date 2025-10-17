// context/AuthContext.js
'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation'; // Import useRouter

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter(); // Initialize the router

    useEffect(() => {
        const getInitialUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        }

        getInitialUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // *** NEW LOGIC HERE ***
            // If the event is PASSWORD_RECOVERY, it means the user clicked a reset link.
            // We must redirect them to the update page immediately.
            if (event === 'PASSWORD_RECOVERY') {
                router.push('/update-password');
            } else {
                // For all other events (SIGNED_IN, SIGNED_OUT, etc.), just update the user state.
                setUser(session?.user ?? null);
            }
            setLoading(false);
        });


        return () => subscription.unsubscribe();
    }, [supabase.auth, router]); // Add router to the dependency array

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