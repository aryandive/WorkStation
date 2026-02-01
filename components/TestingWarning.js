'use client';

import { useState, useEffect } from 'react';
import { FlaskConical, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function TestingWarning() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Check if the user has seen this warning before
        const hasSeenWarning = localStorage.getItem('ws_testing_warning_seen');
        if (!hasSeenWarning) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Save the flag so it doesn't pop up automatically next time
        localStorage.setItem('ws_testing_warning_seen', 'true');
    };

    if (!isMounted) return null;

    return (
        <>
            {/* 1. The UI Icon / Badge in the Header */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 px-3 py-1.5 rounded-full transition-all group backdrop-blur-md"
                title="Click to view testing status"
            >
                <FlaskConical size={16} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Test Mode</span>
            </button>

            {/* 2. The Pop-up Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-gray-900 border-yellow-500 text-white max-w-md shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl text-yellow-500">
                            <AlertTriangle className="h-6 w-6" />
                            Testing Phase
                        </DialogTitle>
                        <DialogDescription className="text-gray-300 pt-2 text-base">
                            Welcome to the <strong>Beta Testing</strong> version of WorkStation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-yellow-950/30 p-4 rounded-xl border border-yellow-500/20 space-y-3">
                        <p className="text-sm text-yellow-200 leading-relaxed">
                            ⚠️ <strong>Important:</strong> Please <span className="underline decoration-yellow-500 underline-offset-4">DO NOT</span> use real money for any subscriptions or features.
                        </p>
                        <p className="text-sm text-gray-400">
                            Payment gateways are in <strong>Sandbox Mode</strong>. Any &ldquo;payment&ldquo; you make should be for testing purposes only. No real money involved and user will be solely responsible.
                        </p>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            onClick={handleClose}
                            className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
                        >
                            I Understand
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}