'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, BookOpen, Clock, Shield, Zap, RefreshCw } from 'lucide-react';

const FAQItem = ({ question, answer, icon: Icon, isOpen, onClick }) => (
    <div className="border border-gray-800 rounded-xl bg-gray-900/30 overflow-hidden transition-all duration-300 hover:border-gray-700">
        <button 
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 md:p-6 text-left focus:outline-none"
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${isOpen ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                    <Icon size={20} />
                </div>
                <span className={`font-semibold text-lg ${isOpen ? 'text-white' : 'text-gray-300'}`}>{question}</span>
            </div>
            {isOpen ? <ChevronUp className="text-yellow-500" /> : <ChevronDown className="text-gray-500" />}
        </button>
        <div 
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
            <div className="p-4 md:p-6 pt-0 text-gray-400 leading-relaxed border-t border-gray-800/50 mt-2">
                {answer}
            </div>
        </div>
    </div>
);

export default function HelpPage() {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        {
            question: "How does the Focus Timer work?",
            answer: "Our timer uses the Pomodoro Technique. By default, it runs for 25 minutes of focus followed by a 5-minute break. You can customize these intervals in the settings menu (gear icon) on the timer.",
            icon: Clock
        },
        {
            question: "Is my Journal data private?",
            answer: "Yes, absolutely. If you are on the Free plan, your data is stored locally on your device (browser storage). If you are a Premium user, your entries are encrypted and stored securely in the cloud, accessible only by you.",
            icon: Shield
        },
        {
            question: "What is included in Premium?",
            answer: "Premium unlocks unlimited cloud sync across devices, advanced analytics/stats, custom themes, ambient soundscapes, and priority support. It supports the ongoing development of Work Station.",
            icon: Zap
        },
        {
            question: "How do I reset my data?",
            answer: "Currently, you can clear local data by clearing your browser cache. For account deletion or specific data requests, please contact us via the support page.",
            icon: BookOpen
        },
        {
            question: "Where is my stats data?",
            answer: "If you are on the Free plan, your stats data is stored locally in your browser. Clearing your browser cache or switching to different device will remove your local stats. If you are a Premium user, your stats are securely saved in the cloud and synced across devices. Just refresh! do if few times if needed, please contact us via the support page if still not visible.",
            icon: RefreshCw
        }
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white py-12 px-4 sm:px-6 relative">
            <div className="max-w-3xl mx-auto relative z-10">
                <Button variant="ghost" asChild className="mb-8 text-gray-400 hover:text-white pl-0 hover:bg-transparent">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back Home</Link>
                </Button>

                <div className="text-center mb-12 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-200 to-yellow-600 bg-clip-text text-transparent">
                        Help Center
                    </h1>
                    <p className="text-xl text-gray-400">
                        Frequently asked questions and guides.
                    </p>
                </div>

                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    {faqs.map((faq, index) => (
                        <FAQItem 
                            key={index}
                            {...faq}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                        />
                    ))}
                </div>

                <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Still need help?</h3>
                    <p className="text-gray-400 mb-6">Our support team is just a message away.</p>
                    <Button asChild className="bg-white text-black hover:bg-gray-200 font-bold px-8">
                        <Link href="/contact">Contact Support</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
