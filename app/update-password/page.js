import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default async function UpdatePassword({ searchParams }) {
    const sp = await searchParams;

    const updatePassword = async (formData) => {
        'use server';
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            return redirect('/update-password?message=Passwords do not match');
        }

        if (password.length < 6) {
             return redirect('/update-password?message=Password must be at least 6 characters long');
        }

        const supabase = await createClient();
        
        // Because the user clicked the link in their email, 
        // Supabase has already securely logged them in via the /auth/callback route.
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            return redirect(`/update-password?message=${encodeURIComponent(error.message)}`);
        }

        // Successfully updated! Send them to the app (or login)
        return redirect('/?message=Password updated successfully! Welcome back.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D1117] px-4 py-12 relative overflow-hidden">
            {/* Background Decoration (Subtle Glow) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />

            <Card className="w-full max-w-md bg-[#161B22] border-[#30363D] shadow-2xl relative z-10">
                <CardHeader className="space-y-1 text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">
                        Set New Password
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Please enter a strong new password for your account.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-4">
                    {/* Error Message Display */}
                    {sp?.message && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3 flex items-start gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <span>{sp.message}</span>
                        </div>
                    )}

                    <form action={updatePassword} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300 font-medium">New Password</Label>
                            <Input
                                type="password"
                                name="password"
                                id="password"
                                placeholder="••••••••"
                                required
                                className="bg-[#0D1117] border-[#30363D] text-white placeholder:text-gray-600 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">Confirm Password</Label>
                            <Input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="••••••••"
                                required
                                className="bg-[#0D1117] border-[#30363D] text-white placeholder:text-gray-600 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all h-10"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold h-10 transition-all shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] mt-2">
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}