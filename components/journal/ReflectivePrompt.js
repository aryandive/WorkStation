// for gemini copy/components/journal/ReflectivePrompt.js
'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const prompts = [
    "What was a small win today?",
    "What challenged you the most?",
    "What are you grateful for right now?",
    "What did you learn today?",
    "How did you take care of yourself today?"
];

export default function ReflectivePrompt() {
    const [prompt, setPrompt] = useState(prompts[0]);

    const getNewPrompt = () => {
        let newPrompt = prompt;
        while (newPrompt === prompt) {
            newPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        }
        setPrompt(newPrompt);
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg mb-4">
            <p className="text-sm italic text-gray-300 flex-grow">&quot;{prompt}&quot;</p>
            <button onClick={getNewPrompt} className="text-gray-400 hover:text-white transition-colors">
                <RefreshCw size={16} />
            </button>
        </div>
    );
}