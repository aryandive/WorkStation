'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Database, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function GlobalListeners() {
    const [isStorageFull, setIsStorageFull] = useState(false);

    useEffect(() => {
        const handleStorageFull = () => setIsStorageFull(true);

        // Listen for the custom event we dispatched in lib/localJournal.js
        window.addEventListener('ws-storage-full', handleStorageFull);

        return () => {
            window.removeEventListener('ws-storage-full', handleStorageFull);
        };
    }, []);

    return (
        <Dialog open={isStorageFull} onOpenChange={setIsStorageFull}>
            <DialogContent className="bg-red-950/90 border-red-500/50 text-white">
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
    );
}