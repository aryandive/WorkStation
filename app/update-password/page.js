'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setMessage('');

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Your password has been updated successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Choose a New Password</CardTitle>
                    <CardDescription>Enter your new password below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <Input
                            type="password"
                            name="password"
                            placeholder="New Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-gray-700 border-gray-600 placeholder-gray-400"
                        />
                        <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                            Update Password
                        </Button>
                    </form>
                    {message && (
                        <p className="mt-4 p-4 bg-gray-700 text-center text-gray-300 rounded-md">
                            {message}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}