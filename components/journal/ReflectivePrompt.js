'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bot, RefreshCw } from 'lucide-react';

// --- Expanded Prompt Libraries ---
const HIGH_PERFORMANCE_PROMPTS = [
    "You had a great focus day! What was your secret?",
    "Biggest win today?",
    "How to carry this momentum to tomorrow?",
    "You are on fire! What motivated you?",
    "What allowed you to stay so focused today?"
];

const LOW_PERFORMANCE_PROMPTS = [
    "What blocked you today?",
    "Biggest distraction?",
    "One small change for tomorrow?",
    "What drained your energy today?",
    "How can you make tomorrow 1% better?"
];

const GENERAL_PROMPTS = [
    "What are you grateful for?",
    "One thing you learned?",
    "Interesting problem solved?",
    "Who made you smile today?",
    "What is one thing you want to improve?",
    "Describe your day in three words.",
    "What was the best part of your day?",
    "Did you step out of your comfort zone today?",
    "What is a goal for tomorrow?",
    "How did you take care of yourself today?",
    "What made you feel proud today?",
    "A moment of stillness you enjoyed?",
    "What is something you are looking forward to?",
    "Who did you help today?"
];

export default function ReflectivePrompt({ dailyStats }) {
    const [prompt, setPrompt] = useState("Let's reflect on your day.");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshPrompt = useCallback(() => {
        setIsRefreshing(true);
        let promptPool = GENERAL_PROMPTS;

        // Logic: Switch pool based on focus performance
        // if (dailyStats && dailyStats.sessions.value) {
        //     const pomosCompleted = parseInt(dailyStats.sessions.value, 10);
        //     
        //     if (pomosCompleted >= 4) {
        //         promptPool = HIGH_PERFORMANCE_PROMPTS;
        //     } else if (pomosCompleted <= 1 && new Date().getHours() > 18) {
        //         promptPool = LOW_PERFORMANCE_PROMPTS;
        //     }
        // }

        setPrompt(currentPrompt => {
            let newPrompt = currentPrompt;
            // Prevent same prompt appearing twice in a row
            while (newPrompt === currentPrompt) {
                newPrompt = promptPool[Math.floor(Math.random() * promptPool.length)];
            }
            return newPrompt;
        });

        setTimeout(() => setIsRefreshing(false), 500);
    }, []);

    // Initial load
    useEffect(() => {
        refreshPrompt();
    }, [refreshPrompt]);

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="font-bold mb-2 text-yellow-400 text-sm uppercase tracking-wider flex items-center">
                <Bot className="mr-2 w-4 h-4" /> Reflective Prompt
            </h2>
            <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg transition-all duration-300 hover:bg-black/40">
                <p className="text-sm text-gray-200 flex-grow transition-opacity duration-300 italic">
                    &quot;{prompt}&quot;
                </p>
                <button
                    onClick={refreshPrompt}
                    className="p-2 rounded-full bg-gray-700 hover:bg-yellow-500 hover:text-gray-900 transition-all duration-300 flex-shrink-0"
                    title="Get new prompt"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
    );
}