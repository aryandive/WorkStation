'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const Ring = ({ percentage, color, value, label, onClick }) => {
    const [animatedPct, setAnimatedPct] = useState(0);
    useEffect(() => {
        // Simple animation on mount/update
        const timer = setTimeout(() => setAnimatedPct(Math.min(100, Math.max(0, percentage))), 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    return (
        <div 
            onClick={onClick} 
            className={cn("relative flex flex-col items-center justify-center group", onClick && "cursor-pointer")}
        >
            <div className="relative w-16 h-16 md:w-20 md:h-20 transition-transform duration-300 group-hover:scale-105">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                    {/* Background Path */}
                    <path
                        className="text-gray-800"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    {/* Value Path */}
                    <path
                        className="transition-all duration-1000 ease-out"
                        style={{ stroke: color }}
                        strokeDasharray={`${animatedPct}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-sm md:text-base font-bold text-white transition-colors", onClick && "group-hover:text-yellow-400")}>
                        {value}
                    </span>
                </div>
            </div>
            <span className="mt-2 text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wide">{label}</span>
        </div>
    );
};

export default function ActivityRings({ stats, onEntriesClick }) {
    // stats prop structure: { entries: { percentage, value }, tasks: { percentage, value }, sessions: { percentage, value } }
    if (!stats) return null;

    return (
        <div className="bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 flex flex-col gap-4">
             {/* --- TOTAL GOAL / DASHBOARD STYLE HEADER --- */}
             <div className="flex items-center justify-between border-b border-gray-700/50 pb-2 mb-1">
                <div>
                    <h2 className='text-gray-400 text-[10px] uppercase tracking-widest'>Today&apos;s Focus</h2>
                    <h1 className='text-lg font-bold text-white'>Daily Goals</h1>
                </div>
             </div>

            <div className="flex items-center justify-around px-2">
                <Ring 
                    percentage={stats.entries?.percentage || 0} 
                    value={stats.entries?.value || '0/0'} 
                    label="Entries" 
                    color="#38B2AC" 
                    onClick={onEntriesClick} 
                />
                <Ring 
                    percentage={stats.tasks?.percentage || 0} 
                    value={stats.tasks?.value || '0/0'} 
                    label="Tasks" 
                    color="#48BB78" 
                />
                <Ring 
                    percentage={stats.sessions?.percentage || 0} 
                    value={stats.sessions?.value || '0/0'} 
                    label="Focus" 
                    color="#FBBF24" 
                />
            </div>
        </div>
    );
}