"use client";

import React, { useState, useMemo } from 'react';
import {
    CheckCircle2,
    ShieldCheck,
    Infinity as InfinityIcon,
    Sparkles,
    TrendingDown,
    ArrowRight,
    Clock,
    Server,
    HeartHandshake,
    BrainCircuit // Icon for the new 3rd point
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import PayPalSubscriptionButton from '@/components/PayPalSubscriptionButton';

// --- CONFIGURATION ---
const MONTHLY_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// --- TIERS DATA ---
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
            'Limited Ambiance Sound'
        ],
        cta: 'Try for Free',
        href: '/signup',
        planId: 'free',
        variant: 'basic',
    },
    {
        id: 'monthly',
        name: 'Focus Pro Monthly',
        priceDisplay: '$4.99',
        priceSuffix: '/ mo',
        subtext: 'Billed monthly. Cancel anytime.',
        description: 'Unlock the full productivity suite.',
        // Visual Trap: Show the yearly cost to discourage renting
        yearlyAnchor: '$59.88 / yr',
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
        id: 'lifetime',
        name: 'The Believer',
        isSpecialPrice: true,
        priceDisplay: '$19.99',
        priceSuffix: ' once',
        subtext: 'One-time payment. Own it forever.',
        description: 'Join the Founder’s Club. Never pay again.',
        features: [
            'Everything in Monthly',
            'Founding Member Badge 🏅',
            'Priority "Direct-to-Dev" Support',
            'Early Access to New Features',
            'Locked-in Price Forever',
        ],
        cta: 'Claim Lifetime Access',
        href: '#',
        variant: 'hero',
        badge: '🔥 17 / 25 Spots Left (Server Fund)',
    },
];

export default function PricingPage() {
    const [error, setError] = useState(null);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Scarcity Logic: Static start to feel real
    const [spotsLeft, setSpotsLeft] = useState(17);

    // PayPal Options
    const initialOptions = useMemo(() => ({
        "client-id": CLIENT_ID,
        currency: "USD",
        intent: "capture", // Changed to 'capture' for one-time payments (standard for Orders)
        vault: true,       // Keep vault true for the subscription buttons to work in the same provider
    }), []);

    const handleApproveSubscription = async (data) => {
        console.log("Subscription successful:", data);
        window.location.href = '/journal?upgraded=true&type=subscription';
    };

    // --- UPDATED: Secure Lifetime Approval ---
    const handleApproveLifetime = async (details, actions) => {
        console.log("Lifetime payment captured:", details);

        try {
            // 1. Call our new verification endpoint to update Supabase immediately
            const res = await fetch('/api/paypal/verify-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderID: details.id }), // details.id is the Order ID
            });

            const result = await res.json();

            if (!res.ok) {
                // Log the FULL result to the console so we can see the "real" error
                console.error("❌ SERVER ERROR DETECTED:", result);

                // Throw a readable error string
                const errorMessage = typeof result.error === 'object'
                    ? JSON.stringify(result.error)
                    : result.error || 'Verification failed';

                throw new Error(errorMessage);
            }

            // 2. Success! Redirect to the journal
            sessionStorage.setItem('recent_purchase', 'true');
            router.push('/success');

        } catch (err) {
            console.error("Verification Error:", err);
            setError("Payment successful, but account update failed. Please contact support with Order ID: " + details.id);
        }
    };

    return (
        <PayPalScriptProvider options={initialOptions}>
            <div className="bg-[#1A202C] text-[#F7FAFC] font-sans min-h-screen flex flex-col">
                <Header />

                <main className="flex-grow">
                    {/* --- HERO SECTION --- */}
                    <div className="relative py-20 px-6 overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl pointer-events-none">
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full mix-blend-screen opacity-50" />
                        </div>

                        <div className="relative z-10 max-w-5xl mx-auto text-center">
                            {/* Server Fund Banner */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-950/40 border border-yellow-500/30 text-yellow-400 text-xs font-bold tracking-wider uppercase mb-8 shadow-lg backdrop-blur-md">
                                <Server className="w-3.5 h-3.5" />
                                <span>The Server Fund Project</span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white leading-tight">
                                Invest in your Focus.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500">
                                    Not a Subscription.
                                </span>
                            </h1>

                            <p className="text-xl text-[#A0AEC0] max-w-2xl mx-auto leading-relaxed mb-4">
                                Stop renting your tools. Help a student developer keep the lights on and get <span className="text-white font-bold">Lifetime Access</span> for the price of a pizza.
                            </p>

                            {/* UPDATED: 14-Day Guarantee Text */}
                            <p className="text-sm text-gray-500 font-medium mb-16 flex justify-center items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> 14-day money-back guarantee*
                            </p>
                        </div>

                        {error && (
                            <div className="mb-8 max-w-lg mx-auto p-4 bg-red-900/50 text-red-300 border border-red-700 text-center rounded-lg shadow-md animate-in fade-in slide-in-from-top-4">
                                <p className="font-semibold">Error processing request</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* --- PRICING CARDS --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-6xl mx-auto relative z-20">
                            {TIERS.map((tier) => (
                                <PricingCard
                                    key={tier.id}
                                    tier={tier}
                                    user={user}
                                    authLoading={authLoading}
                                    router={router}
                                    onApproveSubscription={handleApproveSubscription}
                                    onApproveLifetime={handleApproveLifetime}
                                    spotsLeft={spotsLeft}
                                />
                            ))}
                        </div>
                    </div>

                    {/* --- DEVELOPER NOTE --- */}
                    <DeveloperNoteSection />

                    {/* --- VALUE BREAKDOWN --- */}
                    <ValueBreakdownSection />
                </main>

                <Footer />
            </div>
        </PayPalScriptProvider>
    );
}

// --- COMPONENT: Pricing Card ---
function PricingCard({ tier, user, authLoading, router, onApproveSubscription, onApproveLifetime, spotsLeft }) {
    const isHero = tier.variant === 'hero';
    const isFree = tier.planId === 'free';
    const isLifetime = tier.id === 'lifetime';

    // NEW: State for Terms Checkbox (Lifetime Only)
    const [agreedToTerms, setAgreedToTerms] = useState(false);

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
            isHero
                ? 'border-yellow-400/50 bg-gray-800/90 ring-1 ring-yellow-400/30 z-10'
                : 'border-gray-700 hover:border-gray-600 z-0'
        )}>
            {/* Scarcity Badge for Hero */}
            {isHero && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-4 py-1.5 text-xs font-black rounded-full shadow-lg whitespace-nowrap uppercase tracking-wider flex items-center gap-1.5 z-20 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    {spotsLeft} Spots Left
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
                <div className="flex justify-center items-center gap-2 flex-wrap">
                    <span className={cn("text-4xl md:text-5xl font-extrabold tracking-tight", isHero ? "text-yellow-400" : "text-gray-200")}>
                        {tier.priceDisplay}
                    </span>
                    {tier.priceSuffix && (
                        <span className="text-lg font-medium text-gray-500 self-end mb-2">
                            {tier.priceSuffix}
                        </span>
                    )}
                </div>

                {tier.yearlyAnchor && (
                    <div className="mt-1 text-sm font-medium text-red-400/80 line-through decoration-red-500/50">
                        ({tier.yearlyAnchor})
                    </div>
                )}

                {isLifetime && (
                    <div className="mt-1 text-sm font-bold text-yellow-500 uppercase tracking-widest">
                        Pay Once • Own Forever
                    </div>
                )}

                {!isLifetime && tier.subtext && (
                    <div className="mt-2 text-sm text-gray-400 font-medium">
                        {tier.subtext}
                    </div>
                )}
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8 flex-grow">
                {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={cn("h-5 w-5 flex-shrink-0 mt-0.5", isHero ? "text-yellow-400" : "text-green-400")} />
                        <span className="text-gray-300 text-sm leading-tight text-left">{feature}</span>
                    </li>
                ))}
            </ul>

            {/* CTA Button Area */}
            <div className="mt-auto pt-4">
                {isFree ? (
                    <Button
                        asChild={!user}
                        onClick={handleFreeClick}
                        className="w-full h-12 text-base font-bold bg-gray-700 hover:bg-gray-600 text-white shadow-lg cursor-pointer"
                    >
                        {user ? (
                            <span className="flex items-center gap-2">
                                Go to SyncFlowState <ArrowRight className="w-4 h-4" />
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
                                disabled={authLoading}
                                className={cn(
                                    "w-full h-12 text-base font-bold shadow-lg transition-all hover:translate-y-[-1px]",
                                    isHero
                                        ? "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
                                        : "bg-gray-700 hover:bg-gray-600 text-white",
                                    authLoading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {authLoading ? "Loading..." : isHero ? "Login to Support" : "Login to Subscribe"}
                            </Button>
                        ) : (
                            <div className={cn("rounded-lg relative", isHero && "ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-[#1A202C]")}>

                                {/* --- NEW: Refund Policy Checkbox for Lifetime --- */}
                                {isLifetime && (
                                    <div className="mb-3 flex items-start gap-2 px-1">
                                        <input
                                            type="checkbox"
                                            id="terms-check"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500/50 cursor-pointer accent-yellow-500"
                                        />
                                        <label htmlFor="terms-check" className="text-[11px] text-gray-400 leading-tight cursor-pointer select-none">
                                            I have read the <Link href="/terms" className="text-yellow-400 hover:underline">terms and conditions and refund policy</Link> before proceeding.
                                        </label>
                                    </div>
                                )}

                                {isLifetime ? (
                                    <div className={cn("transition-opacity duration-200", !agreedToTerms && "opacity-50 pointer-events-none grayscale")}>
                                        <PayPalButtons
                                            disabled={!agreedToTerms}
                                            style={{ shape: 'rect', label: 'checkout', height: 48 }}
                                            createOrder={(data, actions) => {
                                                // CRITICAL: Passing user ID for Webhook/Backend
                                                return actions.order.create({
                                                    purchase_units: [{
                                                        description: "SyncFlowState Lifetime Access (Server Fund)",
                                                        amount: { value: "19.99" },
                                                        custom_id: user?.id
                                                    }]
                                                });
                                            }}
                                            onApprove={(data, actions) => {
                                                return actions.order.capture().then((details) => {
                                                    onApproveLifetime(details, actions);
                                                });
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <PayPalSubscriptionButton
                                        planId={tier.planId}
                                        user={user}
                                        onApprove={onApproveSubscription}
                                        styleLabel="rect"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Urgency Footer for Lifetime */}
            {isHero && (
                <p className="text-[10px] text-center text-yellow-500/80 mt-3 font-medium">
                    *Proceeds go directly to server costs.
                </p>
            )}
        </div>
    );
}

// --- COMPONENT: Developer Note (Trust Builder) ---
function DeveloperNoteSection() {
    return (
        <section className="py-16 px-6">
            <div className="max-w-3xl mx-auto bg-[#1A202C] border border-gray-700 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                {/* Decorative Quote Mark */}
                <div className="absolute top-4 left-6 text-7xl text-gray-800 font-serif opacity-50">“</div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        {/* Avatar / Placeholder */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-gray-900 font-bold text-xl shadow-lg">
                            AD
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-lg">A Note from the Developer</h4>
                            <p className="text-gray-400 text-sm">Aryan Dive, ECE Student & Solo Founder</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-gray-300 leading-relaxed">
                        <p>
                            Hi, I&apos;m Aryan. I&apos;m not a big tech company; I&apos;m an ECE student building this from my dorm room because I refused to pay another monthly subscription for a simple productivity tool.
                        </p>
                        <p>
                            <span className="text-yellow-400 font-semibold">Why the limited Lifetime Deal?</span> It&apos;s not a gimmick—it&apos;s a necessity.
                            I&apos;ve calculated the exact cost to keep SyncFlowState fast, secure, and ad-free, covering everything from <span className="text-white font-medium">VPS hosting and Apple Developer fees to database backups</span>.
                        </p>
                        <p>
                            Instead of taking venture capital, I&apos;m crowdfunding these costs directly from you.
                            The revenue from these 25 spots goes <span className="text-white font-medium">100% into infrastructure</span>, ensuring the app survives. You get a tool forever, I get to keep the lights on.
                        </p>
                        <p>
                            And because I want you to trust this
                            indie project, I offer a <span className="text-yellow-400 font-semibold">personal 14-day money-back guarantee</span>.
                            If it doesn&apos;t help you, I&apos;ll refund you myself—no bots, just me.
                        </p>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-sm text-gray-500 font-medium italic">
                        <HeartHandshake className="w-4 h-4 text-red-400" />
                        Thank you for supporting independent software.
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- COMPONENT: Value Breakdown (The No-Brainer Logic) ---
function ValueBreakdownSection() {
    return (
        <section className="py-20 bg-black/20 border-t border-gray-800">
            <div className="max-w-4xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-center mb-12 text-white">Why &quot;The Believer&quot; Deal is a No-Brainer</h2>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Math Card */}
                    <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <TrendingDown className="text-green-400" /> The Cold Hard Math
                        </h3>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                                <span className="text-gray-400">1 Year of Monthly ($4.99)</span>
                                <span className="text-red-400 line-through font-semibold">$59.88</span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                                <span className="text-yellow-100 font-medium">Lifetime Access</span>
                                <span className="text-yellow-400 font-bold text-xl">$19.99</span>
                            </div>
                        </div>

                        <p className="mt-6 text-gray-400 text-sm text-center">
                            You break even in just <span className="text-white font-bold">4 months</span>.
                            After that, you profit forever.
                        </p>
                    </div>

                    {/* Features Card */}
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-yellow-400/10 p-3 rounded-lg h-fit shrink-0">
                                <InfinityIcon className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Legacy Status</h4>
                                <p className="text-gray-400 text-sm mt-1">
                                    Prices will eventually switch to subscription-only. You will be grandfathered in. You will never see a paywall again.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-blue-500/10 p-3 rounded-lg h-fit shrink-0">
                                <Sparkles className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Direct Influence</h4>
                                <p className="text-gray-400 text-sm mt-1">
                                    &quot;Believers&quot; get a special badge in the database. When you request a feature (like new sounds or integrations), I build it first.
                                </p>
                            </div>
                        </div>

                        {/* NEW: 3rd Point */}
                        <div className="flex gap-4">
                            <div className="bg-purple-500/10 p-3 rounded-lg h-fit shrink-0">
                                <BrainCircuit className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Mental Freedom</h4>
                                <p className="text-gray-400 text-sm mt-1">
                                    No recurring billing. No &quot;cancel anytime&quot; anxiety. One payment, zero clutter, and full ownership of your focus tools.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}