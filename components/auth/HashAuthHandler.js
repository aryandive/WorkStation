// for gemini copy/components/auth/HashAuthHandler.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function HashAuthHandler() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // This is the correct event for password resets.
            if (event === 'PASSWORD_RECOVERY') {
                // This event fires after Supabase processes the recovery token
                // from the URL hash and establishes a secure session.
                
                // Unsubscribe to prevent this listener from firing again.
                subscription.unsubscribe();

                // It is now safe to redirect to the update password page.
                router.replace('/update-password');
            }
        });

        // Cleanup function to unsubscribe when the component unmounts.
        return () => {
            subscription.unsubscribe();
        };
    // The empty dependency array ensures this listener is set up only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null; // This component renders nothing.
}