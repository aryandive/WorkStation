'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Database, Wifi, WifiOff } from 'lucide-react'; // Added Wifi icons
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Ensure you have this utility for class merging

export default function GlobalListeners() {
    // --- EXISTING: Storage Logic ---
    const [isStorageFull, setIsStorageFull] = useState(false);

    // --- NEW: Internet Logic ---
    const [isOnline, setIsOnline] = useState(true);
    const [showBackOnline, setShowBackOnline] = useState(false); // To control the "Back Online" success toast

    useEffect(() => {
        // 1. Storage Listener
        const handleStorageFull = () => setIsStorageFull(true);
        window.addEventListener('ws-storage-full', handleStorageFull);

        // 2. Internet Listeners
        // Set initial state (safe for server-side rendering check)
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnline(true);
            // Hide the "Back Online" message after 3 seconds
            setTimeout(() => setShowBackOnline(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBackOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('ws-storage-full', handleStorageFull);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <>
            {/* --- NEW: Internet Connectivity Toast (Slide from Top) --- */}
            <div className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out pointer-events-none",
                // Logic: If offline OR showing 'back online' success, slide down. Otherwise slide up (hide).
                (!isOnline || showBackOnline) ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0"
            )}>
                <div className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md min-w-[300px] justify-center",
                    !isOnline 
                        ? "bg-red-950/80 border-red-500/50 text-red-200" // Offline Style
                        : "bg-green-950/80 border-green-500/50 text-green-200" // Online Style
                )}>
                    {!isOnline ? (
                        <>
                            <WifiOff className="w-5 h-5 animate-pulse" />
                            <span className="font-semibold text-sm">No Internet Connection</span>
                        </>
                    ) : (
                        <>
                            <Wifi className="w-5 h-5" />
                            <span className="font-semibold text-sm">Back Online</span>
                        </>
                    )}
                </div>
            </div>

            {/* --- EXISTING: Storage Dialog --- */}
            <Dialog open={isStorageFull} onOpenChange={setIsStorageFull}>
                <DialogContent className="bg-red-950/90 border-red-500/50 text-white sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-500/20 rounded-full">
                                <Database className="w-6 h-6 text-red-400" />
                            </div>
                            <DialogTitle className="text-xl font-bold">Local Storage Full</DialogTitle>
                        </div>
                        <DialogDescription className="text-red-200">
                            Your browser&apos;s storage is full. <strong>Your last action was not saved.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-gray-300">
                            Browsers limit how much data you can save locally. To continue saving your journals and stats, please create a free account to sync to the cloud.
                        </p>
                        
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Link href="/signup" className="w-full">
                                <Button className="w-full bg-white text-red-900 hover:bg-gray-200 font-bold">
                                    Create Free Account
                                </Button>
                            </Link>
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsStorageFull(false)}
                                className="text-red-300 hover:text-white hover:bg-red-900/50"
                            >
                                Dismiss (Risk Data Loss)
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}