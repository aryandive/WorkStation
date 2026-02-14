'use server';

import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signup(formData) {
    const supabase = await createClient();
    const origin = (await headers()).get('origin');

    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name'); // Optional: Capture name if you want

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // This is critical for the email confirmation link to work
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
                full_name: name, // Store their name in metadata immediately
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

// We can reuse the same Google logic, but keeping it here makes the folder self-contained
export async function signUpWithGoogle() {
    const supabase = await createClient();
    const origin = (await headers()).get('origin');

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

    if (error) return { error: error.message };
    if (data.url) redirect(data.url);
}