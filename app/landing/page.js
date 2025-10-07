'use client';
import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header'; // Import shared Header
import Footer from '@/components/Footer'; // Import shared Footer
import { Button } from '@/components/ui/button';

// --- Helper: Countdown Timer Component ---
const CountdownTimer = () => {
    const calculateTimeLeft = () => {
        const difference = +new Date("2025-10-12T00:00:00") - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    return (
        <div className="flex justify-center gap-4 md:gap-8 text-center">
            {Object.entries(timeLeft).map(([interval, value]) => (
                <div key={interval} className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl font-bold text-white">{String(value).padStart(2, '0')}</span>
                    <p className="text-xs text-[#A0AEC0] capitalize">{interval}</p>
                </div>
            ))}
        </div>
    );
};


// --- Main Landing Page Component ---
export default function LandingPage() {
    return (
        <div className="bg-[#1A202C] text-[#F7FAFC] font-sans antialiased">
            <Header />

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                <div className="absolute inset-0 z-0 bg-black/50"></div>
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white">
                        Your Personal Focus Environment.
                    </h1>
                    <p className="text-lg md:text-xl text-[#A0AEC0] max-w-2xl mx-auto mb-8">
                        The full v1.0.0 launches on **October 12th**. Join as an early bird and lock in a lifetime discount.
                    </p>
                    <div className="mb-8">
                        <CountdownTimer />
                    </div>
                    <Button asChild size="lg" className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 text-lg font-bold py-7 px-8 rounded-lg shadow-lg">
                        <Link href="/pricing">Claim Your 50% Early Bird Discount</Link>
                    </Button>
                    <p className="text-xs text-[#A0AEC0] mt-4">Currently in pre-release (v0.0.0)</p>
                </div>
            </section>

            {/* --- "A DAY WITH WORK STATION" --- */}
            <section className="py-20 px-6 bg-gray-900/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4 text-white">A Story of Focus</h2>
                    <p className="text-[#A0AEC0] mb-12">See how Work Station seamlessly integrates into your daily routine.</p>
                    <div className="space-y-8">
                        <DayInTheLifeStep time="8:00 AM" title="Plan Your Day" description="Organize your tasks for the day using projects, sub-tasks, and priorities in your Advanced To-Do list." />
                        <DayInTheLifeStep time="10:00 AM" title="Deep Work Session" description="Start your first Pomodoro session. Tune out distractions with a 'Rainy Cafe' ambiance and focus on what matters most." />
                        <DayInTheLifeStep time="4:00 PM" title="Review Your Progress" description="Check your Analytics dashboard to see your completed sessions and tasks, celebrating your daily achievements." />
                        <DayInTheLifeStep time="8:00 PM" title="Reflect on Your Day" description="Use the Journal to capture your thoughts, insights, and challenges from the day's work, creating a powerful record of your growth." />
                    </div>
                </div>
            </section>

            {/* --- PRICING & OFFER SECTION (IMPROVED) --- */}
            <section id="pricing" className="py-20 px-6 bg-black/20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4 text-white">An Unbeatable Early-Bird Offer.</h2>
                    <p className="text-[#A0AEC0] mb-2">Limited to the first <span className="text-white font-bold">500 members</span>.</p>
                    <p className="text-[#A0AEC0] mb-12">Sign up before launch to lock in your exclusive discount forever.</p>

                    <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
                        {/* Standard Price Card for Comparison */}
                        <div className="w-full max-w-sm p-8 bg-white/5 rounded-xl border border-white/10 flex flex-col relative opacity-70">
                            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                STANDARD PRICE
                            </div>
                            <h3 className="font-bold text-xl mb-2">Focus Pro Annual</h3>
                            <p className="text-sm text-gray-400 mb-6">The price after launch.</p>
                            <div className="my-auto">
                                <p className="text-4xl font-bold text-gray-400 line-through">$59.99/yr</p>
                                <p className="text-lg text-gray-500 mt-2">(Equivalent to $5.00/mo)</p>
                            </div>
                        </div>

                        {/* Early Bird Offer Card */}
                        <div className="w-full max-w-sm p-8 bg-white/10 rounded-xl border-2 border-yellow-400 shadow-2xl shadow-yellow-500/10 relative flex flex-col">
                            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                                EARLY BIRD
                            </div>
                            <h3 className="font-bold text-xl mb-2">Lifetime Discount</h3>
                            <p className="text-sm text-yellow-200/80 mb-6">Limited time offer.</p>
                            <div className="my-auto">
                                <p className="text-5xl font-bold text-yellow-400">$29.99/yr</p>
                                <p className="text-xl font-bold text-white mt-2">50% OFF FOREVER</p>
                                <p className="text-sm text-gray-300 mt-2">(Just $2.50 per month)</p>
                            </div>
                            <Button asChild size="lg" className="mt-8 bg-yellow-400 text-gray-900 hover:bg-yellow-300 text-lg font-bold py-6">
                                <Link href="/pricing">Claim Your Spot</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>


            {/* --- FEATURES SECTION --- */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-white">Everything in Premium v1.0.0</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureItem title="Projects & Lists" description="Organize your tasks into separate projects like 'Work' or 'Personal'." />
                        <FeatureItem title="Sub-tasks" description="Break down your bigger goals into small, manageable steps." />
                        <FeatureItem title="Due Dates & Reminders" description="Never miss a deadline with an integrated calendar and notifications." />
                        <FeatureItem title="Priority Levels" description="Mark tasks as high, medium, or low priority to focus on what matters." />
                        <FeatureItem title="Expanded Ambiance Library" description="Access dozens of new themes, sounds, and animations." />
                        <FeatureItem title="YouTube Audio Integration" description="Play audio from any YouTube video as your background soundscape." />
                        <FeatureItem title="Advanced Analytics" description="Track your Pomodoro sessions, completed tasks, and focus trends." />
                        <FeatureItem title="Cloud Sync" description="Keep your tasks and journal entries synced across all your devices." />
                        <FeatureItem title="And Much More..." description="Continuous updates with new features and improvements." />
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-20 px-6 text-center">
                <h2 className="text-3xl font-bold mb-4 text-white">Ready to Transform Your Workflow?</h2>
                <p className="text-[#A0AEC0] mb-8">Don&apos;t miss out. Only 500 early bird slots are available.</p>
                <Button asChild size="lg" className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 text-lg font-bold py-7 px-8 rounded-lg shadow-lg">
                    <Link href="/pricing">Claim Your 50% Early Bird Discount</Link>
                </Button>
            </section>

            <Footer />
        </div>
    );
}

// --- Helper Components ---
function FeatureItem({ title, description }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
                <h4 className="font-bold text-white">{title}</h4>
                <p className="text-sm text-[#A0AEC0]">{description}</p>
            </div>
        </div>
    );
}

function DayInTheLifeStep({ time, title, description }) {
    return (
        <div>
            <p className="text-sm font-bold text-yellow-400">{time}</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{title}</h3>
            <p className="text-[#A0AEC0] mt-2 max-w-xl mx-auto">{description}</p>
        </div>
    )
}

