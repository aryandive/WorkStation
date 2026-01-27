'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, MessageSquare, Send, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

// ... existing imports
import { createClient } from '@/utils/supabase/client'; // Import Supabase
import { useAuth } from '@/context/AuthContext'; // Import Auth to link user (optional)

export default function ContactPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    // Get the current user (if logged in)
    const { user } = useAuth();
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // --- REAL SUBMISSION LOGIC ---
        try {
            const { error } = await supabase
                .from('contact_messages')
                .insert({
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                    user_id: user?.id || null // Link to user ID if they are logged in
                });

            if (error) throw error;

            setIsSent(true);
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ... rest of the component
    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
                <Button variant="ghost" asChild className="mb-6 text-gray-400 hover:text-white pl-0 hover:bg-transparent">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Work Station</Link>
                </Button>

                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Get in Touch
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Have a bug to report or a feature to request? We&apos;d love to hear from you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSent ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                                <p className="text-gray-400 mb-6">Thank you for reaching out. We&apos;ll get back to you shortly.</p>
                                <Button onClick={() => setIsSent(false)} variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                                    Send Another
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Name</label>
                                    <div className="relative">
                                        <Input
                                            required
                                            placeholder="Your Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-gray-800/50 border-gray-700 text-white pl-4 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            required
                                            type="email"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="bg-gray-800/50 border-gray-700 text-white pl-10 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Message</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <textarea
                                            required
                                            rows={5}
                                            placeholder="How can we help you?"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="flex w-full rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 pl-10 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-transform active:scale-95">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    {isLoading ? 'Sending...' : 'Send Message'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Or email us directly at <a href="mailto:support@workstation.so" className="text-yellow-500 hover:underline">support@workstation.so</a></p>
                </div>
            </div>
        </div>
    );
}