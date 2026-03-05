'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Cloud, Smartphone, Lock, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function SignUpModal({ isOpen, setIsOpen, mode = 'signup' }) {
    const isUpgrade = mode === 'upgrade';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 text-white max-w-md shadow-2xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center text-yellow-400 mb-2">
                        {isUpgrade ? "Unlock Premium Power" : "Save This Entry Forever?"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-300 leading-relaxed">
                        {isUpgrade
                            ? "Upgrade to Pro to remove limits, unlock unlimited journaling, and gain deep insights into your productivity."
                            : "Create a free account to securely save your journal, sync across all your devices, and unlock the full power of Work Station."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="my-6 space-y-4">
                    {!isUpgrade ? (
                        <>
                            <div className="flex items-start gap-4">
                                <Cloud className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Secure Cloud Storage</h3>
                                    <p className="text-sm text-gray-400">Never lose your thoughts. Your entries are safely backed up in the cloud.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Smartphone className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Sync Across Devices</h3>
                                    <p className="text-sm text-gray-400">Continue writing seamlessly on your desktop, laptop, or phone.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Zap className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Unlock Premium Features</h3>
                                    <p className="text-sm text-gray-400">Integrate your journal with tasks, track your progress, and more.</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-start gap-4">
                                <Rocket className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Unlimited Journaling</h3>
                                    <p className="text-sm text-gray-400">Write as much as you want. No more 30-entry limit.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Lock className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold">Exclusive Insights</h3>
                                    <p className="text-sm text-gray-400">Access advanced productivity stats and trends.</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Link href={isUpgrade ? "/landing" : "/signup"} passHref>
                        <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold text-base py-6 rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 shadow-lg hover:shadow-yellow-500/20">
                            {isUpgrade ? "Upgrade to Pro" : "Create Free Account & Save"}
                        </Button>
                    </Link>
                    <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        {isUpgrade ? "Continue with Free Plan" : "Maybe Later"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}