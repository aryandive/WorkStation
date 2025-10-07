import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SignupPage({ searchParams }) {
    const signUp = async (formData) => {
        'use server';

        const origin = headers().get('origin');
        const email = formData.get('email');
        const password = formData.get('password');
        const supabase = createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            return redirect('/signup?message=Could not create account. Please try again.');
        }

        return redirect('/signup?message=Check your email to confirm your account');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                    <CardDescription>Start your focus journey with Work Station.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form className="space-y-4">
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
                        <Button formAction={signUp} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                            Sign Up
                        </Button>
                    </form>

                    {searchParams?.message && (
                        <p className="mt-4 p-4 bg-gray-700 text-gray-300 text-center rounded-md">
                            {searchParams.message}
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
