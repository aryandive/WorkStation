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

    const fetchSubscription = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('subscriptions')
            .select('status, tier')
            .eq('user_id', user?.id)
            .in('status', ['trialing', 'active'])
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching subscription:', error);
        }

        setSubscription(data);
        setLoading(false);
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        fetchSubscription();

        // Listen for real-time changes to the subscription table to update the badge instantly
        const channel = supabase
            .channel('public:subscriptions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` }, payload => {
                fetchSubscription();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [user, authLoading, supabase]);

    const value = useMemo(() => {
        // Real logic: Check if subscription exists and is active/trialing
        const hasValidSubscription = !!subscription;

        // Dev Override: Check your .env.local for a flag
        const isDevOverride = process.env.NEXT_PUBLIC_FORCE_PREMIUM === 'true';

        return {
            subscription,
            isPro: hasValidSubscription || isDevOverride,
            loading,
            refreshSubscription: fetchSubscription
        };
    }, [subscription, loading]);

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
};