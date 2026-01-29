"use client";

import React, { useState, useMemo } from 'react';
import {
    CheckCircle2,
    Zap,
    ShieldCheck,
    Infinity as InfinityIcon,
    Sparkles,
    ListTodo,
    TrendingDown,
    ArrowRight
} from 'lucide-react';
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
const YEARLY_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID; // The $29.99 Plan ID
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// --- PRICING DATA CONFIGURATION ---
const TIERS = [
    {
        id: 'starter',
        name: 'Starter',
        priceDisplay: '$0',
        priceSuffix: '',
        description: 'Perfect for testing the waters.',
        features: [
            'Basic Task Lists',
            'Pomodoro Timer',
            'Local Browser Storage',
            '30 Journal Entry Limit',
            'Limited Ambiance Sounds'
        ],
        cta: 'Try for Free',
        href: '/signup',
        planId: 'free',
        variant: 'basic',
    },
    {
        id: 'monthly',
        name: 'Focus Pro Monthly',
        priceDisplay: '$7.99',
        priceSuffix: '/ mo',
        subtext: 'Billed monthly. Cancel anytime.',
        description: 'Unlock the full productivity suite.',
        features: [
            'Unlimited Cloud Sync (All Devices)',
            'Unlimited Journal Entries',
            'Premium To-Do (Projects & Sub-tasks)',
            'YouTube Music Integration',
            'Full Ambiance Library (Rain, Cafe, etc.)',
            'Advanced Productivity Analytics',
        ],
        cta: 'Subscribe Monthly',
        href: '#',
        planId: MONTHLY_PLAN_ID,
        variant: 'standard',
    },
    {
        id: 'early-bird',
        name: 'Focus Pro (Early Bird)',
        // Custom logic for price display handled in component
        isSpecialPrice: true,
        priceSuffix: '/ mo',
        subtext: 'Billed $29.99/yr',
        description: 'Join the Founder’s Club. Lock in this price forever.',
        features: [
            'Everything in Monthly',
            'Founding Member Badge',
            'Priority "Direct-to-Dev" Support',
            'Early Access to New Features',
            'Locked-in Price Forever',
        ],
        cta: 'Claim 50% Off Lifetime',
        href: '#',
        planId: YEARLY_PLAN_ID,
        variant: 'hero',
        badge: '🔥 421 / 500 spots claimed',
    },
];

export default function PricingPage() {
    const [error, setError] = useState(null);
    const router = useRouter();
    const { user } = useAuth();

    // PayPal Initial Options - Memoized to prevent script reload issues
    const initialOptions = useMemo(() => ({
        "client-id": CLIENT_ID,
        currency: "USD",
        intent: "subscription",
        vault: true,
    }), []);

    const handleApprove = async (data) => {
        console.log("Subscription successful:", data);
        window.location.href = '/journal?upgraded=true';
    };

    return (
        <PayPalScriptProvider options={initialOptions}>
            <div className="bg-[#1A202C] text-[#F7FAFC] font-sans min-h-screen flex flex-col">
                <Header />

                <main className="flex-grow">
                    {/* --- HERO SECTION --- */}
                    <div className="relative py-20 px-6 overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl pointer-events-none">
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full mix-blend-screen opacity-50" />
                        </div>

                        <div className="relative z-10 max-w-5xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-950/30 border border-yellow-500/20 text-yellow-400 text-xs font-bold tracking-wider uppercase mb-8 shadow-lg shadow-yellow-900/5 backdrop-blur-sm">
                                <Sparkles className="w-3.5 h-3.5 fill-yellow-400" />
                                <span>Official v2.0 Launch Offer</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white">
                                Invest in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500">Focus</span>.
                            </h1>

                            <p className="text-xl text-[#A0AEC0] max-w-2xl mx-auto leading-relaxed mb-4">
                                Stop renting your productivity. Join the <span className="text-gray-200 font-semibold">Founder&apos;s Club</span> and lock in our lowest rate forever.
                            </p>

                            <p className="text-sm text-gray-500 font-medium mb-16">
                                30-day money-back guarantee • Cancel anytime
                            </p>
                        </div>

                        {error && (
                            <div className="mb-8 max-w-lg mx-auto p-4 bg-red-900/50 text-red-300 border border-red-700 text-center rounded-lg shadow-md animate-in fade-in slide-in-from-top-4">
                                <p className="font-semibold">Error processing request</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* --- PRICING CARDS GRID --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto relative z-20">
                            {TIERS.map((tier) => (
                                <PricingCard
                                    key={tier.id}
                                    tier={tier}
                                    user={user}
                                    router={router}
                                    onApprove={handleApprove}
                                />
                            ))}
                        </div>
                    </div>

                    {/* --- VALUE BREAKDOWN / COMPARISON --- */}
                    <ValueBreakdownSection />
                </main>

                <Footer />
            </div>
        </PayPalScriptProvider>
    );
}

// --- SUB-COMPONENT: Pricing Card ---
function PricingCard({ tier, user, router, onApprove }) {
    const isHero = tier.variant === 'hero';
    const isFree = tier.planId === 'free';

    // Logic Fix: Redirect logged-in users to app instead of signup
    const handleFreeClick = (e) => {
        if (isFree && user) {
            e.preventDefault();
            router.push('/journal');
        }
    };

    return (
        <div className={cn(
            'relative flex flex-col p-8 rounded-2xl border transition-all duration-300 h-full',
            'bg-gray-800/40 backdrop-blur-sm',
            // Removed md:scale-105 to fix overlap issue
            isHero
                ? 'border-yellow-400/50 shadow-[0_0_30px_-5px_rgba(250,204,21,0.2)] bg-gray-800/80 ring-1 ring-yellow-400/20'
                : 'border-gray-700 hover:border-gray-600'
        )}>
            {/* Scarcity Badge for Hero */}
            {isHero && tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 px-3 py-1 text-[11px] font-bold rounded-full shadow-lg whitespace-nowrap uppercase tracking-wider flex items-center gap-1.5 z-20">
                    {tier.badge}
                </div>
            )}

            {/* Header */}
            <div className="mb-6 text-center">
                <h3 className={cn("text-xl font-bold mb-2", isHero ? "text-yellow-400" : "text-white")}>
                    {tier.name}
                </h3>
                <p className="text-sm text-gray-400 h-10 flex items-center justify-center">
                    {tier.description}
                </p>
            </div>

            {/* Price Display */}
            <div className="mb-6 text-center">
                <div className="flex justify-center items-center gap-2">
                    {tier.isSpecialPrice ? (
                        <>
                            {/* Strikethrough Price (Red) */}
                            <span className="text-2xl font-bold text-red-400 line-through decoration-2 decoration-red-400/50 opacity-80">
                                $4.99
                            </span>
                            {/* Actual Price (Green) */}
                            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-green-400">
                                $2.49
                            </span>
                        </>
                    ) : (
                        <span className={cn("text-4xl md:text-5xl font-extrabold tracking-tight", isHero ? "text-white" : "text-gray-200")}>
                            {tier.priceDisplay}
                        </span>
                    )}

                    {tier.priceSuffix && (
                        <span className="text-lg font-medium text-gray-500 self-end mb-2">
                            {tier.priceSuffix}
                        </span>
                    )}
                </div>

                {/* Subtext */}
                {tier.subtext && (
                    <div className="mt-2 text-sm text-gray-400 font-medium">
                        {tier.subtext}
                    </div>
                )}

                {/* STAMPS (New Request) */}
                {isHero && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-[11px] font-bold text-green-400 uppercase tracking-wide">
                            <TrendingDown className="w-3 h-3" />
                            Save ~50% vs Standard
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-[11px] font-bold text-yellow-400 uppercase tracking-wide">
                            <TrendingDown className="w-3 h-3" />
                            Save 68.72% vs Monthly
                        </div>
                    </div>
                )}
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8 flex-grow">
                {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className={cn("h-5 w-5 flex-shrink-0 mt-0.5", isHero ? "text-yellow-400" : "text-green-400")} />
                        <span className="text-gray-300 text-sm leading-tight">{feature}</span>
                    </li>
                ))}
            </ul>

            {/* CTA Button Area */}
            <div className="mt-auto pt-4">
                {isFree ? (
                    <Button
                        asChild={!user} // Only asChild if NOT logged in, otherwise we use onClick
                        onClick={handleFreeClick}
                        className="w-full h-12 text-base font-bold bg-gray-700 hover:bg-gray-600 text-white shadow-lg cursor-pointer"
                    >
                        {user ? (
                            // Logic Fix: Button text changes if logged in
                            <span className="flex items-center gap-2">
                                Go to Workstation <ArrowRight className="w-4 h-4" />
                            </span>
                        ) : (
                            <Link href={tier.href}>{tier.cta}</Link>
                        )}
                    </Button>
                ) : (
                    <div className="w-full min-h-[50px]">
                        {!user ? (
                            <Button
                                onClick={() => router.push(`/login?redirect=/pricing`)}
                                className={cn(
                                    "w-full h-12 text-base font-bold shadow-lg transition-all hover:translate-y-[-1px]",
                                    isHero
                                        ? "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
                                        : "bg-gray-700 hover:bg-gray-600 text-white"
                                )}
                            >
                                {isHero ? "Claim Discount (Login)" : "Login to Subscribe"}
                            </Button>
                        ) : (
                            <div className={cn("rounded-lg overflow-hidden", isHero && "ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-[#1A202C]")}>
                                <PayPalSubscriptionButton
                                    planId={tier.planId}
                                    user={user}
                                    onApprove={onApprove}
                                    styleLabel={isHero ? "checkout" : "rect"}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


// --- SUB-COMPONENT: Value Breakdown Section ---
function ValueBreakdownSection() {
    return (
        <section className="py-20 bg-black/20 border-t border-gray-800">
            <div className="max-w-4xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-center mb-12 text-white">Why the &ldquo;Early Bird&ldquo; is a No-Brainer</h2>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Visual Comparison (Updated to 1 Year) */}
                    {/* Visual Comparison */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-300 mb-8 uppercase tracking-wider text-center">Cost Over 1 Year</h3>

                        {/* Monthly Path (The Anchor) */}
                        <div className="mb-8 relative group">
                            <div className="flex justify-between text-sm mb-2 text-gray-400 font-medium">
                                <span>Monthly ($7.99/mo)</span>
                                <span>~$96.00</span>
                            </div>
                            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-500 w-full"></div>
                            </div>
                        </div>

                        {/* Standard Annual */}
                        <div className="mb-8 relative group">
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-gray-400">Standard Yearly ($59.99/yr)</span>

                                {/* Standard Badge: Aligned Right (Above Bar) */}
                                <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                                    Save $36
                                </div>
                            </div>
                            <div className="relative h-4 bg-gray-700 rounded-full">
                                <div className="h-full bg-blue-500/40 w-[62%] rounded-l-full"></div>
                            </div>
                        </div>

                        {/* Early Bird Path */}
                        <div className="relative group">
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-white font-bold">Early Bird ($29.99/yr)</span>

                                {/* Glowing Badge: Aligned Right (Above Bar) */}
                                <div className="bg-[#10B981] text-black text-xs font-bold px-3 py-1 rounded shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1 border border-green-400 transform -rotate-1 origin-bottom-right">
                                    <Sparkles className="w-3 h-3 fill-black" />
                                    Save $66
                                </div>
                            </div>

                            <div className="relative h-4 bg-gray-700 rounded-full">
                                <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 w-[31%] rounded-l-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Highlights */}
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-yellow-400/10 p-3 rounded-lg h-fit">
                                <InfinityIcon className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Grandfathered Pricing</h4>
                                <p className="text-gray-400 text-sm mt-1">
                                    Prices will go up as we add features. Your $29.99/year rate is locked in for life as long as you stay subscribed.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-blue-500/10 p-3 rounded-lg h-fit">
                                <ShieldCheck className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Priority &ldquo;Direct&quot; Support</h4>
                                <p className="text-gray-400 text-sm mt-1">
                                    Your feedback shapes the roadmap. Early Birds get a direct line to the developer via the Founder&apos;s Discord channel.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-green-500/10 p-3 rounded-lg h-fit">
                                <ListTodo className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Unleash the Productivity Suite</h4>
                                <p className="text-gray-400 text-sm mt-1">
                                    Get full access to Premium To-Do (Projects, Sub-tasks), YouTube Integration, and unlimited Journaling immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}