'use client';
import { useState, useEffect } from 'react';

const Ring = ({ percentage, color, label, value, onClick }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);

    useEffect(() => {
        // Animation delay for smooth entrance
        const timer = setTimeout(() => {
            setAnimatedPercentage(percentage);
        }, 300);
        return () => clearTimeout(timer);
    }, [percentage]);

    return (
        <div
            onClick={onClick}
            className={`relative w-16 h-16 lg:w-20 lg:h-20 group/ring ${onClick ? 'cursor-pointer' : ''} transition-transform duration-300 group-hover/snapshot:scale-[1.05]`}
        >
            {/* Label INSIDE the ring (Restored Design) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 transition-transform duration-300 group-hover/snapshot:-translate-y-0.5">
                <span className={`font-bold text-base lg:text-lg transition-all duration-500 ${onClick ? 'group-hover/ring:scale-110 group-hover/ring:text-yellow-400' : ''} group-hover/snapshot:text-white`}>
                    {value}
                </span>
                <span className="text-[10px] lg:text-xs -mt-1 opacity-80 uppercase tracking-tight group-hover/snapshot:opacity-100 group-hover/snapshot:text-gray-200 transition-colors duration-300">
                    {label}
                </span>
            </div>

            {/* SVG Circles */}
            <svg className="w-full h-full -rotate-90 drop-shadow-sm group-hover/snapshot:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] transition-all duration-300" viewBox="0 0 36 36">
                {/* Background Track */}
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"></circle>
                {/* Value Progress */}
                <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={`${animatedPercentage}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                ></circle>
            </svg>
        </div>
    );
};

export default function ActivityRings({ stats, onEntriesClick }) {
    if (!stats) return null;

    return (
        <div className="flex-shrink-0 flex items-center gap-4 mb-4 p-3 bg-black/30 hover:bg-black/50 rounded-xl backdrop-blur-sm border border-gray-700/50 hover:border-yellow-500/40 overflow-x-auto group/snapshot transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(234,179,8,0.1)] w-full relative">

            <h3 className="font-bold text-gray-400 group-hover/snapshot:text-yellow-400 transition-colors duration-300 hidden sm:block text-sm uppercase tracking-wide whitespace-nowrap">
                Daily Snapshot:
            </h3>
            <div className="flex items-center gap-6 w-full justify-around sm:justify-start">
                <Ring
                    percentage={stats.entries?.percentage || 0}
                    value={stats.entries?.value || '0/0'}
                    label="Entries"
                    color="#38B2AC" // Teal
                    onClick={onEntriesClick}
                />
                <Ring
                    percentage={stats.tasks?.percentage || 0}
                    value={stats.tasks?.value || '0/0'}
                    label="Tasks"
                    color="#48BB78" // Green
                />
                <Ring
                    percentage={stats.sessions?.percentage || 0}
                    value={stats.sessions?.value || '0/0'}
                    label="Focus"
                    color="#FBBF24" // Yellow
                />
            </div>
        </div>
    );
}