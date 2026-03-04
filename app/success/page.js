'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Only allow access if they just completed a purchase
        const hasPurchased = sessionStorage.getItem('recent_purchase');

        if (hasPurchased !== 'true') {
            router.push('/journal');
        } else {
            setIsAuthorized(true);
            // Immediately remove to prevent refreshing back into this page
            sessionStorage.removeItem('recent_purchase');
        }
    }, [router]);

    if (!isAuthorized) {
        return null; // Return empty while checking or redirecting
    }

    return (
        <div className="min-h-screen bg-[#0D1117] flex items-center justify-center relative overflow-hidden px-4">
            {/* Premium Gold/Green Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-green-500/10 via-yellow-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full bg-[#161B22] border border-[#30363D]/80 shadow-[0_0_50px_rgba(234,179,8,0.05)] rounded-3xl p-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mx-auto w-24 h-24 mb-8 relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-50" />
                    <div className="relative w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.4)]">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                    Thank You!
                </h1>

                <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                    Your payment was successful. Welcome to the Founder's Club. Your account has been upgraded and all premium features are now unlocked.
                </p>

                <Button
                    onClick={() => router.push('/journal')}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.3)] rounded-xl"
                >
                    Enter WorkStation <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
