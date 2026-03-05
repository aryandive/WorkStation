'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { FileText, Calendar, Clock, ChevronRight, Crown, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext'; // Import Subscription Context
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function JournalEntriesModal({ isOpen, setIsOpen, allEntries, onSelectEntry }) {
    // 1. Get Subscription Status
    const { isPro } = useSubscription();
    const FREE_LIMIT = 30;

    // Convert entries to array, sort by date (newest first)
    const sortedEntries = Object.entries(allEntries)
        .map(([dateKey, data]) => {
            const [year, month, day] = dateKey.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

            return {
                dateKey,
                dateObj,
                title: data.title || 'Untitled Entry',
                timestamp: data.updated_at || data.created_at || null,
                snippet: data.content 
                    ? data.content.replace(/<[^>]*>/g, '').substring(0, 60) + '...' 
                    : 'Click to read entry...'
            };
        })
        .sort((a, b) => b.dateObj - a.dateObj);

    // 2. Calculate Usage Metrics
    const entryCount = sortedEntries.length;
    const usagePercent = Math.min((entryCount / FREE_LIMIT) * 100, 100);
    
    // Color Logic: <66% Green, <90% Yellow, >90% Red
    const progressColor = usagePercent > 90 ? 'bg-red-500' : (usagePercent > 66 ? 'bg-yellow-500' : 'bg-green-500');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b border-gray-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                                <FileText className="w-6 h-6" /> Journal History
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 mt-1">
                                {entryCount} entries recorded.
                            </DialogDescription>
                        </div>

                        {/* --- NEW: Plan Usage Meter --- */}
                        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 w-48 shadow-inner">
                            {isPro ? (
                                <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm justify-center">
                                    <Crown className="w-4 h-4" /> Unlimited Access
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-gray-300">Free Plan</span>
                                        <span className={cn(
                                            entryCount >= FREE_LIMIT ? "text-red-400" : "text-gray-400"
                                        )}>
                                            {entryCount} / {FREE_LIMIT} Used
                                        </span>
                                    </div>
                                    {/* Progress Bar Track */}
                                    <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className={cn("h-full transition-all duration-500", progressColor)} 
                                            style={{ width: `${usagePercent}%` }}
                                        />
                                    </div>
                                    {entryCount >= 20 && (
                                        <Link href="/pricing" onClick={() => setIsOpen(false)} className="block mt-2 text-[10px] text-center text-yellow-500 hover:text-yellow-400 underline">
                                            Upgrade for Unlimited
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 pt-2 space-y-3">
                    {sortedEntries.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No entries found. Start writing today!</div>
                    ) : (
                        sortedEntries.map((entry) => (
                            <div
                                key={entry.dateKey}
                                onClick={() => {
                                    onSelectEntry(entry.dateObj);
                                    setIsOpen(false);
                                }}
                                className="group flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-yellow-500/50 rounded-xl p-4 cursor-pointer transition-all duration-200"
                            >
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-bold text-gray-200 group-hover:text-yellow-400 truncate transition-colors">
                                        {entry.title}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(entry.dateObj, "MMM d, yyyy")}
                                        </span>
                                        {entry.timestamp && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(entry.timestamp), "h:mm a")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2 truncate group-hover:text-gray-400">
                                        {entry.snippet}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-yellow-500 transform group-hover:translate-x-1 transition-all" />
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}