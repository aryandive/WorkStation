// for gemini copy/components/auth/UpdatePassword.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setMessage('Error: Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setMessage('Error: Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        setMessage('');

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setMessage(`Error: ${error.message}`);
            setLoading(false);
        } else {
            setMessage('Success! Your password has been updated. Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in">
            <Card className="w-full max-w-sm bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Choose a New Password</CardTitle>
                    <CardDescription>Enter your new password below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="New Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-gray-700 border-gray-600 placeholder-gray-400"
                        />
                        <Input
                            type="password"
                            placeholder="Confirm New Password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-gray-700 border-gray-600 placeholder-gray-400"
                        />
                        <Button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold disabled:opacity-50">
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                    {message && (
                        <div className={`mt-4 p-3 text-center rounded-md text-sm ${
                            message.includes('Error') 
                                ? 'bg-red-900/50 text-red-300' 
                                : 'bg-green-900/50 text-green-300'
                        }`}>
                            {message}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}