'use client';

import { Flame, Trophy } from 'lucide-react';

export default function HabitStreak({ current, best }) {
    return (
        <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl shadow-inner mt-4">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-400 leading-none mb-1">Current Streak</p>
                    <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-400">
                        {current} {current === 1 ? 'Day' : 'Days'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-zinc-800">
                <Trophy className="w-4 h-4 text-zinc-500" />
                <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 font-medium">Best</span>
                    <span className="text-sm text-zinc-400 font-bold">{best}</span>
                </div>
            </div>
        </div>
    );
}
