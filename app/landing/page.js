'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    CheckCircle2, 
    BarChart3, 
    Layers, 
    Music, 
    BrainCircuit, 
    ArrowRight, 
    Sparkles, 
    Clock,
    ShieldCheck,
    CalendarClock,
    Flag,
    Cloud,
    ListTree,
    Youtube,
    Plus,
    BookOpen,
    Coffee,
    LineChart,
    ClipboardList
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

// --- Helper: Countdown Timer ---
const CountdownTimer = () => {
    const calculateTimeLeft = () => {
        const difference = +new Date("2026-04-13T00:00:00") - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                m: Math.floor((difference / 1000 / 60) % 60),
                s: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex gap-3 md:gap-6 text-center bg-gray-900/50 backdrop-blur-md border border-gray-700 p-4 rounded-xl shadow-2xl">
            {Object.entries(timeLeft).map(([interval, value]) => (
                <div key={interval} className="flex flex-col items-center min-w-[50px]">
                    <span className="text-2xl md:text-3xl font-mono font-bold text-yellow-400">
                        {String(value).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-semibold">
                        {interval}
                    </span>
                </div>
            ))}
        </div>
    );
};

// --- Main Landing Page ---
export default function LandingPage() {
    return (
        <div className="bg-[#0F1115] text-[#F7FAFC] font-sans antialiased min-h-screen selection:bg-yellow-500/30">
            <Header />

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen opacity-30 animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-yellow-500/5 blur-[100px] rounded-full mix-blend-screen opacity-20" />
                </div>

                <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold tracking-wide uppercase mb-8 shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:bg-yellow-500/20 transition-all cursor-default">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>v2.0 Early Access • 421/500 Spots Claimed</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
                        Master Your <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 drop-shadow-sm">
                            Flow State.
                        </span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-[#A0AEC0] max-w-2xl mx-auto mb-10 leading-relaxed">
                        The all-in-one workspace for deep work. <span className="text-white font-medium">Plan, Focus, and Journal</span> in a beautiful, distraction-free environment.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
                        <Button asChild size="lg" className="h-14 px-8 text-lg font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all transform hover:scale-105">
                            <Link href="/pricing">
                                Get Early Bird Access <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white backdrop-blur-sm">
                            <Link href="/journal">
                                Try Demo (No Login)
                            </Link>
                        </Button>
                    </div>

                    <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                            Official Launch In
                        </p>
                        <CountdownTimer />
                    </div>
                </div>
            </section>

            {/* --- THE PROBLEM --- */}
            <section className="py-24 px-6 border-y border-white/5 bg-black/20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6 text-white">Why is it so hard to focus?</h2>
                    <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                        We switch apps every 6 minutes. To-do lists are in one tab, timers in another, and music in a third. <br />
                        <span className="text-white font-semibold">Context switching is killing your productivity.</span>
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        <ProblemCard 
                            icon={<Layers className="w-8 h-8 text-red-400" />}
                            title="Fragmented Tools"
                            description="Toggling between Spotify, Todoist, and Notion breaks your flow instantly."
                        />
                        <ProblemCard 
                            icon={<BrainCircuit className="w-8 h-8 text-orange-400" />}
                            title="Mental Clutter"
                            description="Without a system to capture thoughts, your brain loops on open loops."
                        />
                        <ProblemCard 
                            icon={<BarChart3 className="w-8 h-8 text-blue-400" />}
                            title="Invisible Progress"
                            description="You work all day but feel like you achieved nothing. No feedback loop."
                        />
                    </div>
                </div>
            </section>

            {/* --- NEW SECTION: A STORY OF FOCUS --- */}
            <section className="py-24 px-6 relative overflow-hidden">
                {/* Background Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent hidden md:block" />
                
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">A Story of Focus</h2>
                        <p className="text-gray-400 text-lg">See how Work Station seamlessly integrates into your daily routine.</p>
                    </div>

                    <div className="space-y-12 relative z-10">
                        {/* 8:00 AM */}
                        <TimelineItem 
                            time="8:00 AM"
                            title="Plan Your Day"
                            description="Organize your tasks for the day using projects, sub-tasks, and priorities in your Advanced To-Do list."
                            icon={<ClipboardList className="w-6 h-6 text-blue-400" />}
                            side="left"
                        />
                        
                        {/* 10:00 AM */}
                        <TimelineItem 
                            time="10:00 AM"
                            title="Deep Work Session"
                            description="Start your first Pomodoro session. Tune out distractions with a 'Rainy Cafe' ambiance and focus on what matters most."
                            icon={<BrainCircuit className="w-6 h-6 text-purple-400" />}
                            side="right"
                        />
                        
                        {/* 4:00 PM */}
                        <TimelineItem 
                            time="4:00 PM"
                            title="Review Your Progress"
                            description="Check your Analytics dashboard to see your completed sessions and tasks, celebrating your daily achievements."
                            icon={<LineChart className="w-6 h-6 text-green-400" />}
                            side="left"
                        />
                        
                        {/* 8:00 PM */}
                        <TimelineItem 
                            time="8:00 PM"
                            title="Reflect on Your Day"
                            description="Use the Journal to capture your thoughts, insights, and challenges from the day's work, creating a powerful record of your growth."
                            icon={<BookOpen className="w-6 h-6 text-yellow-400" />}
                            side="right"
                        />
                    </div>
                </div>
            </section>

            {/* --- BENTO GRID FEATURES --- */}
            <section className="py-24 px-6 bg-gray-900/30 border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Everything you need.<br/>One Tab.</h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg">
                            We consolidated the entire productivity stack into a single, cohesive interface.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        {/* Feature 1: Project Management */}
                        <div className="md:col-span-2 row-span-1 md:row-span-2 bg-black/40 border border-gray-800 rounded-3xl p-8 relative overflow-hidden group hover:border-gray-700 transition-colors">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all" />
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                                        <Layers className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Project Management</h3>
                                    <p className="text-gray-400 max-w-md">
                                        Organize tasks into projects, break them down with sub-tasks, and set priority levels. It&lsquo;s Trello meets a simple checklist.
                                    </p>
                                </div>
                                {/* Mock UI */}
                                <div className="mt-8 bg-[#1A202C] border border-gray-700 rounded-xl p-4 shadow-xl opacity-80 group-hover:opacity-100 transition-opacity transform translate-y-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-4 h-4 rounded-full border-2 border-green-500" />
                                        <div className="h-2 bg-gray-700 rounded w-32" />
                                    </div>
                                    <div className="flex items-center gap-3 ml-6">
                                        <div className="w-3 h-3 rounded-full border border-gray-600" />
                                        <div className="h-1.5 bg-gray-800 rounded w-24" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2: Pomodoro */}
                        <div className="bg-black/40 border border-gray-800 rounded-3xl p-8 relative overflow-hidden group hover:border-gray-700 transition-colors">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-[60px] rounded-full group-hover:bg-red-500/20 transition-all" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Focus Timer</h3>
                                <p className="text-gray-400 text-sm">
                                    Customizable Pomodoro sessions that auto-sync with your analytics.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3: Ambiance */}
                        <div className="bg-black/40 border border-gray-800 rounded-3xl p-8 relative overflow-hidden group hover:border-gray-700 transition-colors">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 blur-[60px] rounded-full group-hover:bg-purple-500/20 transition-all" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                    <Music className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Soundscapes</h3>
                                <p className="text-gray-400 text-sm">
                                    Built-in rain, cafe, and nature sounds. Plus, embed <b>YouTube Music</b> directly.
                                </p>
                            </div>
                        </div>

                        {/* Feature 4: Analytics */}
                        <div className="md:col-span-3 bg-black/40 border border-gray-800 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 group hover:border-gray-700 transition-colors">
                            <div className="absolute left-0 bottom-0 w-96 h-96 bg-green-500/5 blur-[100px] rounded-full" />
                            <div className="flex-1 relative z-10">
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                                    <BarChart3 className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Gamified Insights</h3>
                                <p className="text-gray-400">
                                    Visualize your productivity. Track streak days, hours focused, and tasks completed. Watch your consistency grow.
                                </p>
                            </div>
                            <div className="flex-1 w-full max-w-sm">
                                {/* Abstract Chart Graphic */}
                                <div className="h-32 flex items-end justify-between gap-2 px-4 pb-0">
                                    {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                                        <div key={i} className="w-full bg-green-500/20 rounded-t-sm relative group-hover:bg-green-500/30 transition-colors">
                                            <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-green-500 rounded-t-sm opacity-80" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- NEW SECTION: EVERYTHING IN PREMIUM v2.0.0 --- */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-16 text-white">Everything in Premium v2.0.0</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <PremiumFeatureCard 
                            icon={<Layers className="w-5 h-5 text-blue-400" />}
                            title="Projects & Lists" 
                            description="Organize your tasks into separate projects like 'Work' or 'Personal'." 
                        />
                        <PremiumFeatureCard 
                            icon={<ListTree className="w-5 h-5 text-purple-400" />}
                            title="Sub-tasks" 
                            description="Break down your bigger goals into small, manageable steps." 
                        />
                        <PremiumFeatureCard 
                            icon={<CalendarClock className="w-5 h-5 text-red-400" />}
                            title="Due Dates & Reminders" 
                            description="Never miss a deadline with an integrated calendar and notifications." 
                        />
                        <PremiumFeatureCard 
                            icon={<Flag className="w-5 h-5 text-yellow-400" />}
                            title="Priority Levels" 
                            description="Mark tasks as high, medium, or low priority to focus on what matters." 
                        />
                        <PremiumFeatureCard 
                            icon={<Music className="w-5 h-5 text-pink-400" />}
                            title="Expanded Ambiance Library" 
                            description="Access dozens of new themes, sounds, and animations." 
                        />
                        <PremiumFeatureCard 
                            icon={<Youtube className="w-5 h-5 text-red-500" />}
                            title="YouTube Audio Integration" 
                            description="Play audio from any YouTube video as your background soundscape." 
                        />
                        <PremiumFeatureCard 
                            icon={<BarChart3 className="w-5 h-5 text-green-400" />}
                            title="Advanced Analytics" 
                            description="Track your Pomodoro sessions, completed tasks, and focus trends." 
                        />
                        <PremiumFeatureCard 
                            icon={<Cloud className="w-5 h-5 text-cyan-400" />}
                            title="Cloud Sync" 
                            description="Keep your tasks and journal entries synced across all your devices." 
                        />
                        <PremiumFeatureCard 
                            icon={<Plus className="w-5 h-5 text-gray-400" />}
                            title="And Much More..." 
                            description="Continuous updates with new features and improvements." 
                        />
                    </div>
                </div>
            </section>

            {/* --- PRICING CTA --- */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-yellow-500/30 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.05)]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-md bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        <div className="inline-block bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
                            Limited Time Launch Offer
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Lock in the <span className="text-yellow-400">Founder&apos;s Rate</span>.
                        </h2>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Join the first 500 members and get <span className="text-white font-bold">50% off for life</span>. <br/>
                            Pay $2.50/mo instead of $7.99/mo.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-xl hover:scale-105 transition-transform">
                                <Link href="/pricing">Claim 50% Discount</Link>
                            </Button>
                        </div>
                        
                        <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> 30-day money-back guarantee
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

// --- Helper: Problem Card ---
function ProblemCard({ icon, title, description }) {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-left hover:bg-white/10 transition-colors">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

// --- Helper: Timeline Item (Story of Focus) ---
function TimelineItem({ time, title, description, icon, side }) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 group">
            {/* Left Side Content (only for 'left' alignment on desktop) */}
            <div className={`hidden md:block w-1/2 text-right ${side === 'left' ? 'order-1' : 'order-3 opacity-0'}`}>
                {side === 'left' && (
                    <>
                        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-gray-400">{description}</p>
                    </>
                )}
            </div>

            {/* Center Node */}
            <div className="relative z-10 flex flex-col items-center order-2">
                <div className="bg-gray-800 border-2 border-gray-600 rounded-full p-2 mb-2 group-hover:border-yellow-400 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <div className="bg-gray-900 p-2 rounded-full">
                        {icon}
                    </div>
                </div>
                <div className="px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700 text-yellow-400 font-mono text-sm font-bold">
                    {time}
                </div>
            </div>

            {/* Right Side Content (only for 'right' alignment on desktop, or ALL on mobile) */}
            <div className={`w-full md:w-1/2 text-center md:text-left ${side === 'right' ? 'order-3' : 'order-1 md:order-3 md:opacity-0'}`}>
                {/* Mobile: Show content regardless of side */}
                <div className="md:hidden">
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm">{description}</p>
                </div>
                {/* Desktop: Show content only if side is right */}
                <div className="hidden md:block">
                    {side === 'right' && (
                        <>
                            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                            <p className="text-gray-400">{description}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Helper: Premium Feature Card ---
function PremiumFeatureCard({ icon, title, description }) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white text-lg mb-1">{title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}