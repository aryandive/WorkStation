'use client';

import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (authLoading) return; // Wait for authentication to settle
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        const fetchSubscription = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('subscriptions')
                .select('status, tier')
                .eq('user_id', user.id)
                .in('status', ['trialing', 'active'])
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
                console.error('Error fetching subscription:', error);
            }

            setSubscription(data);
            setLoading(false);
        };

        fetchSubscription();

    }, [user, authLoading, supabase]);

    const value = useMemo(() => ({
        subscription,
        // The user is considered "premium" if they have any active or trialing subscription.
        isPro: !!subscription,
        loading,
    }), [subscription, loading]);

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}    