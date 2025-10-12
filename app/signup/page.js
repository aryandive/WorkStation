import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function SignupPage({ searchParams }) {
    // If already signed in, send user away from signup
    const supabaseForPage = await createClient();
    const { data: { user: existingUser } } = await supabaseForPage.auth.getUser();
    if (existingUser) {
        return redirect('/?message=' + encodeURIComponent('You are already signed in'));
    }

    const signUp = async (formData) => {
        'use server';
        const hdrs = await headers();
        const headerOrigin = hdrs.get('origin');
        const fallbackOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const origin = headerOrigin || fallbackOrigin;
        const email = formData.get('email');
        const password = formData.get('password');
        const supabase = await createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            const msg = encodeURIComponent(error.message || 'Could not create account. Please try again.');
            return redirect(`/signup?message=${msg}`);
        }

        const successMsg = encodeURIComponent('Check your email to confirm your account. If you did not receive it, check Spam and ensure your redirect URL is allowed in Supabase.');
        return redirect(`/signup?message=${successMsg}`);
    };

    const sp = await searchParams;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                    <CardDescription>Start your focus journey with Work Station.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form className="space-y-4" action={signUp}>
                        <Input
                            name="email"
                            placeholder="Email"
                            required
                            className="bg-gray-700 border-gray-600 placeholder-gray-400"
                        />
                        <Input
                            type="password"
                            name="password"
                            placeholder="Password"
                            required
                            className="bg-gray-700 border-gray-600 placeholder-gray-400"
                        />
                        <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                            Sign Up
                        </Button>
                    </form>

                    {sp?.message && (
                        <p className="mt-4 p-4 bg-gray-700 text-gray-300 text-center rounded-md">
                            {sp.message}
                        </p>
                    )}

                    <div className="text-center text-sm">
                        <Link href="/login" className="text-yellow-400 hover:underline">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
