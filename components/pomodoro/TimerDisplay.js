// for gemini copy/components/pomodoro/TimerDisplay.js
'use client';

import { Clock } from 'lucide-react';
import ProgressCircle from './ProgressCircle';

export default function TimerDisplay({ timeLeft, mode, progress }) {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');

    const modeText = mode === 'work' ? 'Focus' : (mode === 'longBreak' ? 'Long Break' : 'Short Break');
    const modeColor = mode === 'work' ? 'text-red-400' : 'text-green-400';

    return (
        <div className="flex flex-col items-center">
            <h2 className={`text-2xl font-semibold mb-4 ${modeColor} drop-shadow-lg`}>
                {modeText}
            </h2>

            <div className="relative">
                <ProgressCircle progress={progress} mode={mode} />

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="flex items-end drop-shadow-xl text-white">
                        <span className="text-7xl font-mono font-bold tabular-nums">{minutes}</span>
                        <span className="text-5xl font-mono pb-1 tabular-nums">:{seconds}</span>
                    </div>
                    <div className="flex items-center mt-2 text-gray-300 drop-shadow-lg">
                        <Clock className="mr-1 h-4 w-4" />
                        <span className="text-sm">
                            {mode === 'work' ? 'Time to focus' : 'Take a break'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}