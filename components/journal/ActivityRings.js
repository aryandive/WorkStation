// for gemini copy/components/journal/ActivityRings.js
'use client';
import React from 'react';

const Ring = ({ color, percentage, label }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <svg className="w-20 h-20 transform -rotate-90">
                <circle
                    className="text-gray-700"
                    strokeWidth="5"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="40"
                    cy="40"
                />
                <circle
                    className={color}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="40"
                    cy="40"
                />
            </svg>
            <span className="text-xs text-gray-400 mt-1">{label}</span>
        </div>
    );
};

export default function ActivityRings() {
    // Replace with real data later
    const focusData = { percentage: 75, label: "120/180 min" };
    const tasksData = { percentage: 60, label: "3/5 tasks" };
    const pomodoroData = { percentage: 80, label: "4/5 sessions" };

    return (
        <div className="bg-black/20 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-white">Today&apos;s Focus</h3>
            <div className="flex justify-around">
                <Ring color="text-blue-400" percentage={focusData.percentage} label={focusData.label} />
                <Ring color="text-green-400" percentage={tasksData.percentage} label={tasksData.label} />
                <Ring color="text-yellow-400" percentage={pomodoroData.percentage} label={pomodoroData.label} />
            </div>
        </div>
    );
}