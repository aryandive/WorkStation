// app/pricing/page.js
"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext'; // IMPORTED

// --- Tier Data (Updated) ---
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
        // This MUST match the key in your .env.local file
        planIdEnvVar: 'NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID',
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
        // This MUST match the key in your .env.local file
        planIdEnvVar: 'NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID',
        isMostPopular: true,
    },
];

// PayPal Client ID from environment variables
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

/**
 * Renders a PayPal Subscription Button.
 * This component handles the entire subscription flow for a specific plan.
 */
function PayPalSubscriptionButton({ planId, planName, user, router, setLoadingPlan, setError }) {
    const [paypalSdkReady, setPaypalSdkReady] = useState(false);
    const buttonContainerId = `paypal-button-container-${planId}`;

    useEffect(() => {
        // Load the PayPal SDK script
        const scriptId = 'paypal-sdk-script';
        if (document.getElementById(scriptId) || window.paypal) {
            console.log("PayPal SDK already loaded.");
            setPaypalSdkReady(true);
            return;
        }

        if (!PAYPAL_CLIENT_ID) {
            console.error("PayPal Client ID is not set.");
            setError("Payment system configuration error.");
            return;
        }

        console.log("Loading PayPal SDK script for subscriptions...");
        const script = document.createElement('script');
        script.id = scriptId;
        // NOTE: Added &intent=subscription&components=buttons
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=subscription&components=buttons`;
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => {
            console.log("PayPal SDK script loaded successfully.");
            setPaypalSdkReady(true);
        };
        script.onerror = () => {
            console.error("Failed to load PayPal SDK script.");
            setError("Could not load payment options. Please refresh.");
        };
        document.body.appendChild(script);
    }, [setError]);

    // Render the PayPal button once the SDK is ready
    useEffect(() => {
        if (paypalSdkReady && window.paypal && window.paypal.Buttons) {
            const container = document.getElementById(buttonContainerId);
            if (!container || container.hasChildNodes()) {
                // Already rendered or container not found
                return;
            }

            const buttons = window.paypal.Buttons({
                style: {
                    shape: 'rect',
                    color: planName.includes('Yearly') ? 'gold' : 'black',
                    layout: 'vertical',
                    label: 'subscribe',
                    height: 48,
                    tagline: false,
                },

                /**
                 * Creates the subscription on our server.
                 */
                createSubscription: async (data, actions) => {
                    // Check for user *just before* creating the subscription
                    if (!user) {
                        setError("You must be logged in to subscribe.");
                        setLoadingPlan(null);
                        router.push('/login?redirect=/pricing');
                        return;
                    }

                    console.log(`Creating subscription for plan: ${planId}`);
                    setLoadingPlan(planId); // Show loader on this button
                    setError(null);

                    try {
                        const response = await fetch('/api/paypal/create-subscription', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ planId }), // Send the Plan ID
                        });

                        const responseData = await response.json();

                        if (!response.ok) {
                            throw new Error(responseData.error || 'Failed to create subscription.');
                        }

                        console.log("Subscription created, ID:", responseData.id);
                        return responseData.id; // Return the subscriptionID to PayPal

                    } catch (err) {
                        console.error("Error in createSubscription fetch:", err);
                        setError(`Could not initiate subscription: ${err.message}`);
                        setLoadingPlan(null);
                        return;
                    }
                },

                /**
                 * Called when the user approves the subscription in the PayPal popup.
                 */
                onApprove: async (data, actions) => {
                    console.log("Subscription approved by user:", data);
                    setError(null);
                    setLoadingPlan(planId); // Keep loading as "Processing..."

                    // The webhook will handle the database update.
                    // We just need to show a success message and redirect.
                    alert(`Subscription successful! Your ${planName} plan is now activating. You will be redirected.`);

                    // Redirect to the journal page, the SubscriptionContext will update automatically
                    router.push('/journal?upgraded=true');
                },

                /**
                 * Called on client-side errors (e.g., popup closed).
                 */
                onError: (err) => {
                    console.error("PayPal Button SDK Error:", err);
                    setError("An error occurred during checkout. Please try again.");
                    setLoadingPlan(null);
                },

                /**
                 * Called when the user cancels the flow.
                 */
                onCancel: (data) => {
                    console.log("Subscription cancelled by user:", data);
                    setLoadingPlan(null);
                }
            });

            buttons.render(`#${buttonContainerId}`).catch(err => {
                console.error(`Failed to render PayPal button for ${buttonContainerId}:`, err);
                setError("Could not display payment buttons. Please refresh.");
            });
        }
    }, [paypalSdkReady, planId, planName, buttonContainerId, user, router, setLoadingPlan, setError]);

    return (
        <div className="relative h-[48px]"> {/* Explicit height */}
            {/* Container for PayPal button */}
            <div id={buttonContainerId} className="absolute inset-0 z-10 transition-opacity duration-300" />

            {/* Loading/Disabled state overlay */}
            {!paypalSdkReady && (
                <div className="absolute inset-0 bg-gray-700/80 flex items-center justify-center rounded-md cursor-not-allowed z-20">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-white" />
                    <span className="text-white font-semibold">Loading Payment...</span>
                </div>
            )}
        </div>
    );
}
PayPalSubscriptionButton.displayName = 'PayPalSubscriptionButton';


// --- Main Pricing Page Component ---
export default function PricingPage() {
    const [loadingPlan, setLoadingPlan] = useState(null); // Tracks which plan is being processed
    const [error, setError] = useState(null);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth(); // GET THE USER

    return (
        <div className="bg-[#1A202C] text-[#F7FAFC] font-sans min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Find the Plan That’s Right for You
                        </h1>
                        <p className="text-lg text-[#A0AEC0] max-w-2xl mx-auto">
                            Start for free, then upgrade to unlock your full productivity potential.
                        </p>
                    </div>

                    {error && (
                        <div className="mt-8 p-4 bg-red-900/50 text-red-300 border border-red-700 text-center rounded-lg shadow-md">
                            <p className="font-semibold">Payment Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                        {tiers.map((tier) => {
                            const displayPrice = tier.displayPrice || tier.price;
                            const isLoadingThisPlan = loadingPlan === tier.planIdEnvVar;
                            // Get the actual plan ID from the environment
                            const planId = process.env[tier.planIdEnvVar];

                            return (
                                <div
                                    key={tier.name}
                                    className={cn(
                                        'rounded-2xl border p-8 flex flex-col relative bg-gray-800/30 backdrop-blur-sm',
                                        tier.isMostPopular ? 'border-yellow-400 shadow-2xl shadow-yellow-500/10' : 'border-gray-700'
                                    )}
                                >
                                    {tier.isMostPopular && (
                                        <p className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-3 py-1 text-sm font-bold rounded-full">
                                            BEST VALUE
                                        </p>
                                    )}
                                    <h3 className="text-xl font-bold">{tier.name}</h3>
                                    <p className="mt-4 text-sm text-gray-400 flex-grow">{tier.description}</p>
                                    <div className="mt-6">
                                        <span className="text-4xl font-bold">{displayPrice}</span>
                                        <span className="text-base font-medium text-gray-400">{tier.priceSuffix}</span>
                                        {tier.displayPrice && tier.price !== tier.displayPrice && (
                                            <span className="ml-2 text-base font-medium text-gray-500 line-through">{tier.price}</span>
                                        )}
                                    </div>
                                    <ul className="mt-8 space-y-4 text-sm">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-auto pt-8">
                                        {tier.planId === 'free' ? (
                                            <Button
                                                asChild
                                                className={cn(
                                                    'w-full text-lg py-6 font-bold',
                                                    'bg-gray-700 hover:bg-gray-600'
                                                )}
                                            >
                                                <Link href={tier.href}>{tier.cta}</Link>
                                            </Button>
                                        ) : (
                                            // This is a paid plan
                                            <>
                                                {isLoadingThisPlan ? (
                                                    // Show loading overlay
                                                    <div className="relative h-[48px] bg-gray-700/80 flex items-center justify-center rounded-md cursor-not-allowed z-20">
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin text-white" />
                                                        <span className="text-white font-semibold">Processing...</span>
                                                    </div>
                                                ) : (
                                                    // Show PayPal Button
                                                    <PayPalSubscriptionButton
                                                        planId={planId}
                                                        planName={tier.name}
                                                        user={user}
                                                        router={router}
                                                        setLoadingPlan={setLoadingPlan}
                                                        setError={setError}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}