import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function ForgotPassword({ searchParams }) {
    const sp = await searchParams;

    const sendResetLink = async (formData) => {
        'use server';
        const email = formData.get('email');
        const supabase = await createClient();

        // Dynamic origin logic (reusing your robust logic from login)
        const headerStore = await headers();
        const forwardedHost = headerStore.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        let origin = process.env.NEXT_PUBLIC_SITE_URL;

        if (forwardedHost) {
            origin = `https://${forwardedHost}`;
        } else if (!origin) {
            const host = headerStore.get('host');
            origin = isLocalEnv ? `http://${host}` : `https://${host}`;
        }

        // Remove trailing slash if present
        const baseUrl = origin?.replace(/\/$/, '');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // Crucial: We redirect them to the callback, but with a 'next' param
            // that points to the update-password page.
            redirectTo: `${baseUrl}/auth/callback?next=/update-password`,
        });

        if (error) {
            return redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`);
        }

        return redirect('/forgot-password?message=Check your email for the password reset link&type=success');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>Enter your email to receive a reset link.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={sendResetLink} className="space-y-4">
                        <Input
                            name="email"
                            placeholder="Email"
                            required
                            className="bg-gray-700 border-gray-600 placeholder-gray-400"
                        />
                        <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                            Send Reset Link
                        </Button>
                    </form>

                    {sp?.message && (
                        <p className={`mt-4 p-4 text-center rounded-md ${sp.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                            }`}>
                            {sp.message}
                        </p>
                    )}

                    <div className="text-center text-sm">
                        <Link href="/login" className="text-yellow-400 hover:underline">
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}