'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { FileText, Calendar, Clock, ChevronRight } from 'lucide-react';

export default function JournalEntriesModal({ isOpen, setIsOpen, allEntries, onSelectEntry }) {

    // Convert entries object to an array and sort by date (newest first)
    // Convert entries object to an array, filter out empty ones, and sort by date
    const sortedEntries = Object.entries(allEntries)
        .filter(([_, data]) => {
            // Check if content exists and has text (ignoring HTML tags)
            const cleanContent = data.content ? data.content.replace(/<[^>]*>/g, '').trim() : '';
            return cleanContent.length > 0;
        })
        .map(([dateKey, data]) => {
            const [year, month, day] = dateKey.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

            return {
                dateKey,
                dateObj,
                title: data.title || 'Untitled Entry',
                timestamp: data.updated_at || data.created_at || null,
                snippet: data.content ? data.content.replace(/<[^>]*>/g, '').substring(0, 60) + '...' : ''
            };
        })
        .sort((a, b) => b.dateObj - a.dateObj);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                        <FileText className="w-6 h-6" /> Journal History
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {sortedEntries.length} entries recorded.
                    </DialogDescription>
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