import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function UpdatePassword({ searchParams }) {
    const sp = await searchParams;

    const updatePassword = async (formData) => {
        'use server';
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            return redirect('/update-password?message=Passwords do not match');
        }

        const supabase = await createClient();
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            return redirect(`/update-password?message=${encodeURIComponent(error.message)}`);
        }

        return redirect('/?message=Password updated successfully');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Update Password</CardTitle>
                    <CardDescription>Enter your new password below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={updatePassword} className="space-y-4">
                        <Input
                            type="password"
                            name="password"
                            placeholder="New Password"
                            required
                            className="bg-gray-700 border-gray-600 placeholder-gray-400"
                        />
                        <Input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm New Password"
                            required
                            className="bg-gray-700 border-gray-600 placeholder-gray-400"
                        />
                        <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                            Update Password
                        </Button>
                    </form>

                    {sp?.message && (
                        <p className="mt-4 p-4 bg-red-900/50 text-red-300 text-center rounded-md">
                            {sp.message}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}