// for gemini copy/components/auth/HashAuthHandler.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function HashAuthHandler() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const type = params.get('type');
        const accessToken = params.get('access_token');

        // Only act on password recovery links
        if (type === 'recovery' && accessToken) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                // Wait for the specific 'SIGNED_IN' event which confirms session establishment
                if (event === 'SIGNED_IN' && session) {
                    // Unsubscribe to avoid this running again
                    subscription.unsubscribe();

                    // Clean the URL of sensitive tokens
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

                    // Now it's safe to redirect
                    router.replace('/update-password');
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}