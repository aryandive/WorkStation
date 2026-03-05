"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulate network request
        setTimeout(() => {
            setIsLoading(false);
            setIsSent(true);
        }, 1500);
    };

    return (
        <div className="bg-[#1A202C] text-[#F7FAFC] font-sans min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow py-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-white mb-4">Get in Touch</h1>
                        <p className="text-gray-400 text-lg">
                            Want to contact me or request a feature? We&apos;d love to hear from you.
                        </p>
                    </div>

                    <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
                        {isSent ? (
                            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                                <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                <p className="text-gray-400 mb-8">
                                    Thanks for reaching out. I usually reply within 24-48 hours.
                                </p>
                                <Button 
                                    onClick={() => setIsSent(false)}
                                    variant="outline" 
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                                >
                                    Send Another Message
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-gray-300">Name</Label>
                                        <Input 
                                            id="name" 
                                            placeholder="John Doe" 
                                            required 
                                            className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:ring-yellow-400/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-300">Email</Label>
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            placeholder="john@example.com" 
                                            required 
                                            className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:ring-yellow-400/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reason" className="text-gray-300">Reason for Contact</Label>
                                    <Select required>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:ring-yellow-400/20">
                                            <SelectValue placeholder="Select a topic..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                            <SelectItem value="feedback">General Feedback</SelectItem>
                                            <SelectItem value="feature">Feature Request 💡</SelectItem>
                                            <SelectItem value="bug">Report a Bug 🐛</SelectItem>
                                            <SelectItem value="deletion">Account Deletion (Delete All Data) 🗑️</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-gray-300">Message</Label>
                                    <Textarea 
                                        id="message" 
                                        placeholder="Tell us what's on your mind..." 
                                        required 
                                        className="min-h-[150px] bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-600 focus:border-yellow-400 focus:ring-yellow-400/20 resize-none"
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold h-12 text-base transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">Sending...</span>
                                    ) : (
                                        <span className="flex items-center gap-2">Send Message <Send className="w-4 h-4" /></span>
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Simplified Direct Email Section */}
                    <div className="mt-8 text-center">
                         <a href="mailto:support@syncflowstate.com" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors bg-gray-800/50 px-6 py-3 rounded-full border border-gray-700 hover:border-yellow-400/30">
                            <Mail className="w-5 h-5" />
                            <span>Prefer to email directly? <strong>support@syncflowstate.com</strong></span>
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}