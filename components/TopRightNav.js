'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Zap, Bell, Flame, Construction, Cloud, CloudOff } from 'lucide-react'; // Added Cloud icons
import AuthButton from './AuthButton';
import { useSubscription } from '@/context/SubscriptionContext'; // Added Subscription Context

// Reusable IconButton component for consistency
const IconButton = ({ src, alt, tooltip, onClick, href }) => {
    const content = (
        <button
            onClick={onClick}
            className="p-2 bg-black/20 border border-white/10 rounded-full hover:bg-white/20 transition-colors duration-200"
        >
            <Image width={20} height={20} src={src} alt={alt} className="invert-[.8]" />
        </button>
    );

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                            {content}
                        </a>
                    ) : (
                        content
                    )}
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default function TopRightNav() {
    const [isStreakOpen, setIsStreakOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Get subscription status for the sync indicator
    const { isPro, loading } = useSubscription();

    // Fullscreen toggle functionality
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Effect to listen for fullscreen changes (e.g., user pressing Esc)
    useEffect(() => {
        const onFullScreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
    }, []);

    return (
        <>
            <div className="flex items-center gap-3">
                {/* --- NEW: Cloud Sync Indicator --- */}
                {!loading && (
                    <div className="hidden md:block mr-1">
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={`p-2 rounded-full border transition-all cursor-help ${isPro ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-yellow-500/50 hover:text-yellow-500'}`}>
                                        {isPro ? <Cloud size={20} /> : <CloudOff size={20} />}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                    <p>{isPro ? "Data Synced to Cloud" : "Local Storage (Not Synced)"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}

                <IconButton
                    src="/streak.svg"
                    alt="Streak"
                    tooltip="My Streak"
                    onClick={() => setIsStreakOpen(true)}
                />
                <IconButton
                    src="/notification.svg"
                    alt="Notifications"
                    tooltip="Notifications"
                    onClick={() => setIsNotificationOpen(true)}
                />
                <IconButton
                    src="/bug.svg"
                    alt="Report Bug"
                    tooltip="Report a Bug"
                    href="https://forms.gle/your-bug-report-form-link" // Replace with your Google Form link
                />
                <IconButton
                    src="/feedback.svg"
                    alt="Feedback"
                    tooltip="Give Feedback"
                    href="https://forms.gle/your-feedback-form-link" // Replace with your Google Form link
                />
                <IconButton
                    src="/fullscreen.svg"
                    alt="Toggle Fullscreen"
                    tooltip={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    onClick={toggleFullScreen}
                />

                {/* AuthButton is included here */}
                <div className="pl-2 border-l border-white/20">
                    <AuthButton />
                </div>
            </div>

            {/* Streak "Coming Soon" Dialog */}
            <Dialog open={isStreakOpen} onOpenChange={setIsStreakOpen}>
                <DialogContent className="bg-gray-900/80 backdrop-blur-md border-gray-700 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center text-yellow-400 mb-2 flex items-center justify-center gap-2">
                            <Flame /> Streak Tracker
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-300">
                            This feature is currently under development.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="my-6 text-center">
                        <Construction size={48} className="mx-auto text-yellow-500 mb-4" />
                        <h3 className="font-semibold text-lg">Work in Progress</h3>
                        <p className="text-sm text-gray-400 mt-2">
                            We&apos;re building an amazing streak tracker to help you stay motivated and build consistent work habits. Stay tuned!
                        </p>
                    </div>
                    <Button onClick={() => setIsStreakOpen(false)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                        Got It
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Notifications Dialog */}
            <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <DialogContent className="bg-gray-900/80 backdrop-blur-md border-gray-700 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                            <Bell /> Notifications
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Notification 1: Welcome Message */}
                        <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                            <h3 className="font-semibold text-lg text-white mb-2">Welcome to Work Station!</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                This is your personal focus environment. Use the **Pomodoro Timer** to start a session, manage your tasks in the **Todo List**, and reflect on your day in the **Journal**. Customize your background and sounds in the **Environment** panel to create your perfect workspace.
                            </p>
                        </div>
                        {/* Notification 2: Early Bird Offer */}
                        <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-700">
                            <h3 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center gap-2"><Zap size={20} /> Early Bird Offer Unlocked!</h3>
                            <p className="text-sm text-yellow-200/90 leading-relaxed">
                                As one of our first users, you have access to an exclusive **50% lifetime discount** on our upcoming Premium plan. This includes unlimited cloud sync, advanced analytics, an expanded ambiance library, and much more.
                            </p>
                            <Button size="sm" className="mt-4 bg-yellow-500 text-gray-900 hover:bg-yellow-400">
                                Learn More
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}