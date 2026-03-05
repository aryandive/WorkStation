'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'; // Icons for UX
import { login, signInWithGoogle } from './actions';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect') || '/';

    // UI States
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // UX: Toggle State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form Handlers
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData(event.currentTarget);

        try {
            const result = await login(formData);
            if (result?.error) {
                setError(result.error);
                setLoading(false);
            } else {
                setSuccess('Login successful! Redirecting...');
                // Slight delay to show success state before redirect
                setTimeout(() => router.push(redirectPath), 500);
            }
        } catch (e) {
            setError('An unexpected error occurred.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await signInWithGoogle();
        } catch (error) {
            setError('Failed to initiate Google login.');
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D1117] px-4 py-12 relative overflow-hidden">

            {/* Background Decoration (Subtle Glow) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />

            <Card className="w-full max-w-md bg-[#161B22] border-[#30363D] shadow-2xl relative z-10">
                <CardHeader className="space-y-1 text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Enter your credentials to access your workspace
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">

                    {/* --- Error / Success Messages --- */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3 flex items-start gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-900/20 border border-green-500/50 rounded-md p-3 flex items-start gap-3 text-green-200 text-sm animate-in fade-in slide-in-from-top-1">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* --- Email / Password Form --- */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300 font-medium">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="bg-[#0D1117] border-[#30363D] text-white placeholder:text-gray-600 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                                <a
                                    href="/forgot-password"
                                    className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    className="bg-[#0D1117] border-[#30363D] text-white placeholder:text-gray-600 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all h-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold h-10 transition-all shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg aria-hidden="true" role="status" className="w-4 h-4 text-black animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" fillOpacity="0.2" />
                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                                    </svg>
                                    Signing in...
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    {/* --- Divider --- */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#161B22] px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    {/* --- Improved Google Button --- */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading || googleLoading}
                        aria-label="Sign in with Google"
                        className="w-full relative flex items-center bg-google-button-blue rounded-md p-1 pr-3 transition-colors duration-300 hover:bg-google-button-blue-hover disabled:opacity-70 disabled:cursor-not-allowed h-11"
                    >
                        <div className="flex items-center justify-center bg-white w-10 h-10 rounded-l shrink-0 z-10">
                            {googleLoading ? (
                                <svg aria-hidden="true" role="status" className="w-5 h-5 text-gray-300 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#4285F4" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                    <title>Sign in with Google</title>
                                    <desc>Google G Logo</desc>
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" className="fill-google-logo-blue"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" className="fill-google-logo-green"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" className="fill-google-logo-yellow"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" className="fill-google-logo-red"></path>
                                </svg>
                            )}
                        </div>
                        <span className="absolute inset-0 flex items-center justify-center text-sm text-white tracking-wider font-medium pointer-events-none">
                            {googleLoading ? "Connecting..." : "Sign in with Google"}
                        </span>
                    </button>
                </CardContent>

                <CardFooter className="flex justify-center pb-6">
                    <p className="text-sm text-gray-400">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-yellow-500 hover:text-yellow-400 font-medium hover:underline transition-all">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
                <div className="w-8 h-8 border-2 border-yellow-500/50 border-t-yellow-500 rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}