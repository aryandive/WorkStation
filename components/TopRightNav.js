'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Zap, Bell, Flame, Construction, Cloud, CloudOff, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import AuthButton from './AuthButton';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';

// --- UserStatusBadge ---
const UserStatusBadge = ({ user, isPro, authLoading, subLoading }) => {
    if (authLoading || (user && subLoading)) {
        return (
            <span className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-gray-800 text-transparent animate-pulse w-14 h-5">
                ...
            </span>
        );
    }
    if (isPro) {
        return (
            <span className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)] border border-yellow-300">
                PRO
            </span>
        );
    }
    if (user) {
        return (
            <span className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                FREE
            </span>
        );
    }
    return (
        <span className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-800 text-gray-400 border border-gray-700">
            GUEST
        </span>
    );
};

// Reusable IconButton component
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
                <TooltipTrigger asChild>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{content}</a> : content}</TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-white border-gray-700"><p>{tooltip}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default function TopRightNav() {
    const [isStreakOpen, setIsStreakOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // --- Connectivity State ---
    const [isOnline, setIsOnline] = useState(true);

    const { isPro, loading: subLoading } = useSubscription();
    const { isMigrating, user, loading: authLoading } = useAuth(); // Migration Spinner State and User for Badge

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => console.error(err));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const onFullScreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullScreenChange);

        // Online/Offline Listeners
        if (typeof window !== 'undefined') setIsOnline(navigator.onLine);
        const setOnline = () => setIsOnline(true);
        const setOffline = () => setIsOnline(false);
        window.addEventListener('online', setOnline);
        window.addEventListener('offline', setOffline);

        return () => {
            document.removeEventListener('fullscreenchange', onFullScreenChange);
            window.removeEventListener('online', setOnline);
            window.removeEventListener('offline', setOffline);
        };
    }, []);

    // --- RENDER HELPERS ---
    const renderSyncIcon = () => {
        // 1. Migration in Progress (Highest Priority)
        if (isMigrating) {
            return {
                icon: <RefreshCw size={20} className="animate-spin text-yellow-400" />,
                text: "Syncing Data...",
                style: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
            };
        }

        // 2. Offline State (Paid User)
        if (isPro && !isOnline) {
            return {
                icon: <WifiOff size={20} className="text-yellow-500" />,
                text: "Sync Pending (Offline)",
                style: "bg-yellow-900/20 border-yellow-700/50 text-yellow-500 animate-pulse"
            };
        }

        // 3. Synced State (Paid User)
        if (isPro) {
            return {
                icon: <Cloud size={20} />,
                text: "Cloud Sync Active",
                style: "bg-green-500/10 border-green-500/30 text-green-400"
            };
        }

        // 4. Local State (Free/Guest)
        return {
            icon: <CloudOff size={20} />,
            text: "Local Storage (Not Synced)",
            style: "bg-gray-800/50 border-gray-700 text-gray-500 hover:border-yellow-500/50 hover:text-yellow-500"
        };
    };

    const syncStatus = renderSyncIcon();

    return (
        <>
            <div className="flex items-center gap-3">
                {/* --- Sync Indicator --- */}
                {!subLoading && (
                    <div className="hidden md:block mr-1">
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={`p-2 rounded-full border transition-all cursor-help ${syncStatus.style}`}>
                                        {syncStatus.icon}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-900 border-gray-700 text-white">
                                    <p className="font-medium">{syncStatus.text}</p>
                                    {!isPro && !isMigrating && (
                                        <p className="text-xs text-gray-400 mt-1">Upgrade to backup data.</p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}

                <IconButton src="/streak.svg" alt="Streak" tooltip="My Streak" onClick={() => setIsStreakOpen(true)} />
                <IconButton src="/notification.svg" alt="Notifications" tooltip="Notifications" onClick={() => setIsNotificationOpen(true)} />
                <IconButton src="/bug.svg" alt="Report Bug" tooltip="Report a Bug" href="https://forms.gle/bug-report" />
                <IconButton src="/feedback.svg" alt="Feedback" tooltip="Give Feedback" href="https://forms.gle/feedback" />
                <IconButton src="/fullscreen.svg" alt="Toggle Fullscreen" tooltip={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'} onClick={toggleFullScreen} />

                {/* Status Badge & Auth */}
                <div className="pl-3 border-l border-white/20 flex items-center gap-3">
                    <UserStatusBadge user={user} isPro={isPro} authLoading={authLoading} subLoading={subLoading} />
                    <AuthButton />
                </div>
            </div>

            {/* Streak Modal (Placeholder) */}
            <Dialog open={isStreakOpen} onOpenChange={setIsStreakOpen}>
                <DialogContent className="bg-gray-900/80 backdrop-blur-md border-gray-700 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center text-yellow-400 mb-2 flex items-center justify-center gap-2">
                            <Flame /> Streak Tracker
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-300">
                            Coming Soon
                        </DialogDescription>
                    </DialogHeader>
                    <div className="my-6 text-center">
                        <Construction size={48} className="mx-auto text-yellow-500 mb-4" />
                        <h3 className="font-semibold text-lg">Work in Progress</h3>
                        <p className="text-sm text-gray-400 mt-2">
                            We&apos;re building an amazing streak tracker to help you stay motivated.
                        </p>
                    </div>
                    <Button onClick={() => setIsStreakOpen(false)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900">Got It</Button>
                </DialogContent>
            </Dialog>

            {/* Notifications Modal */}
            <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <DialogContent className="bg-gray-900/80 backdrop-blur-md border-gray-700 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                            <Bell /> Notifications
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                            <h3 className="font-semibold text-lg text-white mb-2">Welcome to Work Station!</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                This is your personal focus environment. Customize your background, track tasks, and journal your progress.
                            </p>
                        </div>
                        <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-700">
                            <h3 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center gap-2"><Zap size={20} /> Early Bird Offer!</h3>
                            <p className="text-sm text-yellow-200/90 leading-relaxed">
                                Get a **Lifetime License** for a single one-time payment. Support indie development and own the tool forever.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}