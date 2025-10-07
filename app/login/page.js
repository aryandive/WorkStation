import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage({ searchParams }) {
    const signIn = async (formData) => {
        'use server';

        const email = formData.get('email');
        const password = formData.get('password');
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return redirect('/login?message=Could not authenticate user');
        }

        return redirect('/');
    };

    const signInWithGoogle = async () => {
        'use server';
        const supabase = createClient();
        const origin = headers().get('origin');

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback`,
            },
        });

        if (data.url) {
            return redirect(data.url);
        }
        return redirect('/login?message=Could not authenticate with Google');
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>Sign in to access your Work Station.</CardDescription>
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
                        <Button formAction={signIn} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                            Sign In
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <form>
                        <Button formAction={signInWithGoogle} variant="outline" className="w-full border-gray-600 hover:bg-gray-700">
                            Google
                        </Button>
                    </form>

                    {searchParams?.message && (
                        <p className="mt-4 p-4 bg-red-900/50 text-red-300 text-center rounded-md">
                            {searchParams.message}
                        </p>
                    )}

                    <div className="text-center text-sm">
                        <Link href="/signup" className="text-yellow-400 hover:underline">
                            Don&apos;t have an account? Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
