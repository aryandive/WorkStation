"use client";

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import PayPalSubscriptionButton from '@/components/PayPalSubscriptionButton';

// --- CONFIGURATION ---
const MONTHLY_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID;
const YEARLY_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

const tiers = [
    {
        name: 'Experience Plan',
        price: '$0',
        priceSuffix: '',
        description: 'Get a feel for the core tools, forever free.',
        features: [
            'Full Pomodoro Timer access',
            'Full Task & Project Management',
            'Local Browser Storage',
            '30 Journal Entry Limit',
            'Limited Ambiance Library',
            'Basic Daily Stats',
        ],
        cta: 'Get Started',
        href: '/signup',
        planId: 'free',
        isMostPopular: false,
    },
    {
        name: 'Focus Pro - Monthly',
        price: '$7.99',
        priceSuffix: '/ month',
        description: 'Unlock the full power of Work Station, one month at a time.',
        features: [
            'Everything in Experience, plus:',
            'Unlimited Cloud Journal Entries',
            'Sync Data Across All Devices',
            'Full Ambiance & Sound Library',
            'YouTube Audio Integration',
            'Advanced Productivity Analytics',
            'Priority Support',
        ],
        cta: 'Upgrade Now',
        href: '#',
        planId: MONTHLY_PLAN_ID,
        isMostPopular: false,
    },
    {
        name: 'Focus Pro - Yearly',
        price: '$59.99',
        displayPrice: '$29.99',
        priceSuffix: '/ year',
        description: 'Commit to your focus and save 50% with our Early Bird deal!',
        features: [
            'Everything in Experience, plus:',
            'Unlimited Cloud Journal Entries',
            'Sync Data Across All Devices',
            'Full Ambiance & Sound Library',
            'YouTube Audio Integration',
            'Advanced Productivity Analytics',
            'Priority Support',
        ],
        cta: 'Get 50% Off Forever',
        href: '#',
        planId: YEARLY_PLAN_ID,
        isMostPopular: true,
    },
];

export default function PricingPage() {
    const [error, setError] = useState(null);
    const router = useRouter();
    const { user } = useAuth();

    // PayPal Initial Options
    const initialOptions = {
        "client-id": CLIENT_ID,
        currency: "USD",
        intent: "subscription",
        vault: true, // Essential for subscriptions!
    };

    const handleApprove = async (data) => {
        // You can add a toast notification here if you have one
        console.log("Subscription successful:", data);
        alert(`Subscription successful! Subscription ID: ${data.subscriptionID}`);

        // Redirect to journal to start using premium features
        // The webhook will handle the actual database update in the background
        window.location.href = '/journal?upgraded=true';
    };

    return (
        <PayPalScriptProvider options={initialOptions}>
            <div className="bg-[#1A202C] text-[#F7FAFC] font-sans min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow py-20 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Find the Plan That’s Right for You</h1>
                            <p className="text-lg text-[#A0AEC0] max-w-2xl mx-auto">Start for free, then upgrade to unlock your full productivity potential.</p>
                        </div>

                        {error && (
                            <div className="mt-8 p-4 bg-red-900/50 text-red-300 border border-red-700 text-center rounded-lg shadow-md">
                                <p className="font-semibold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                            {tiers.map((tier) => (
                                <div key={tier.name} className={cn('rounded-2xl border p-8 flex flex-col relative bg-gray-800/30 backdrop-blur-sm h-full', tier.isMostPopular ? 'border-yellow-400 shadow-2xl shadow-yellow-500/10' : 'border-gray-700')}>
                                    {tier.isMostPopular && <p className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-3 py-1 text-sm font-bold rounded-full">BEST VALUE</p>}

                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-center mb-2">{tier.name}</h3>
                                        <p className="text-sm text-gray-400 text-center min-h-[40px]">{tier.description}</p>

                                        <div className="mt-6 text-center">
                                            <span className="text-4xl font-bold">{tier.displayPrice || tier.price}</span>
                                            <span className="text-base font-medium text-gray-400">{tier.priceSuffix}</span>
                                        </div>

                                        <div className="mt-8">
                                            <ul className="space-y-4 text-sm">
                                                {tier.features.map((feature) => (
                                                    <li key={feature} className="flex items-start gap-3">
                                                        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                        <span className="text-gray-300 text-left">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-8 w-full">
                                        {tier.planId === 'free' ? (
                                            <Button asChild className="w-full text-lg py-6 font-bold bg-gray-700 hover:bg-gray-600 h-12">
                                                <Link href={tier.href}>{tier.cta}</Link>
                                            </Button>
                                        ) : (
                                            <div className="w-full min-h-[50px]">
                                                {/* If user is NOT logged in, show Login Button */}
                                                {!user ? (
                                                    <Button
                                                        onClick={() => router.push('/login?redirect=/pricing')}
                                                        className="w-full text-lg py-6 font-bold bg-yellow-500 hover:bg-yellow-600 text-black h-12"
                                                    >
                                                        Log in to Subscribe
                                                    </Button>
                                                ) : (
                                                    /* If user IS logged in, show PayPal Button */
                                                    <PayPalSubscriptionButton
                                                        planId={tier.planId}
                                                        user={user}
                                                        onApprove={handleApprove}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </PayPalScriptProvider>
    );
}