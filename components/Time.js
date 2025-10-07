// components/Time.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';

// A small, curated list of quotes to avoid API calls and keep the component fast.
const quotes = [
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { quote: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
    { quote: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { quote: "Perfection is not attainable, but if we chase perfection we can catch excellence.", author: "Vince Lombardi" }
];

export default function TimeWidget() {
    const [now, setNow] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);

    // Get a new quote every day based on the day of the year. This is efficient and avoids repetition.
    const dailyQuote = useMemo(() => {
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return quotes[dayOfYear % quotes.length];
    }, [now]);

    // Effect to mount the component on the client and start the clock timer.
    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // UI/UX Improvement: Split time string for better visual hierarchy.
    const timeParts = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).split(':');

    const dateString = now.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    // Calculate the percentage of the day that has passed.
    const totalSecondsInDay = 24 * 60 * 60;
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const percentOfDay = Math.floor((currentSeconds / totalSecondsInDay) * 100);


    // Fallback content while waiting for client-side hydration to prevent mismatch.
    if (!isMounted) {
        return (
            <div className="w-full max-w-[280px] p-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl text-white shadow-2xl flex items-center justify-center h-[240px]">
                <Clock className="animate-spin" />
            </div>
        );
    }

    return (
        // UI/UX Improvement: Reduced max-width, padding, and height for a more compact design. Replaced justify-between with gap-4 for consistent spacing.
        <div className="w-full max-w-[280px] p-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl text-white shadow-2xl flex flex-col gap-4 h-auto">

            {/* Main Time and Date Display */}
            <div className="text-center">
                {/* UI/UX Improvement: Reduced font size for a smaller footprint. */}
                <div className="flex items-end justify-center">
                    <span className="text-5xl font-bold font-mono tracking-tighter leading-none">
                        {timeParts[0]}:{timeParts[1]}
                    </span>
                    <span className="text-xl font-mono font-medium leading-none pb-1">
                        :{timeParts[2]}
                    </span>
                </div>
                {/* UI/UX Improvement: Made date text smaller to match the more compact feel. */}
                <p className="text-xs text-gray-300 mt-1.5 flex items-center justify-center gap-1.5">
                    <Calendar size={12} />
                    {dateString}
                </p>
            </div>

            {/* Day Progress Bar */}
            <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Day Progress</span>
                    <span>{percentOfDay}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-300"
                        style={{ width: `${percentOfDay}%` }}
                    />
                </div>
            </div>

            {/* Motivational Quote */}
            {/* UI/UX Improvement: Reduced padding-top to tighten the layout. */}
            <div className="text-center border-t border-white/10 pt-3">
                <div className="flex items-center justify-center gap-2 text-yellow-400/80 mb-2">
                    <Sparkles size={14} />
                    <h3 className="text-xs font-semibold tracking-wider uppercase">Thought for the Day</h3>
                </div>
                <div>
                    {/* UI/UX Improvement: Made quote text smaller. */}
                    <p className="text-xs italic text-gray-200">&quot;{dailyQuote.quote}&quot;</p>
                    <p className="text-xs text-gray-400 mt-1">— {dailyQuote.author}</p>
                </div>
            </div>
        </div>
    );
}

