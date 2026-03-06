'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

/**
 * Handles Email/Password Login
 */
export async function login(formData) {
    const supabase = await createClient();

    const email = formData.get('email');
    const password = formData.get('password');

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    // We revalidate the layout to update the UI (e.g., AuthButton)
    revalidatePath('/', 'layout');

    // We return success so the client can show the toast and handle the redirect
    return { success: true };
}

/**
 * Handles Google OAuth Login
 */
export async function signInWithGoogle() {
    const supabase = await createClient();
    const headersList = await headers();
    const origin = headersList.get('origin');

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (error) {
        console.error('Google Login Error:', error);
        return { error: error.message };
    }

    if (data.url) {
        // Return the URL instead of redirecting server-side
        return { url: data.url };
    }
    return {};
}