'use client';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { parseISO } from 'date-fns';

export default function JournalCalendar({ selectedDate, onDateSelect, allEntries = {}, className }) {
    // Extract dates from entries object keys (YYYY-MM-DD)
    const entryDates = Object.keys(allEntries).map(dateStr => parseISO(dateStr));

    return (
        <div className={cn("p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg border border-gray-700", className)}>
             <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                modifiers={{ hasEntry: entryDates }}
                modifiersClassNames={{
                    hasEntry: 'bg-yellow-500/20 text-yellow-400 font-bold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-yellow-500 after:rounded-full'
                }}
                className="p-0 w-full"
                classNames={{
                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-700 rounded-full transition-colors text-gray-300",
                    day_selected: "bg-yellow-500 text-black hover:bg-yellow-400 hover:text-black focus:bg-yellow-500 focus:text-black font-bold shadow-lg scale-110",
                    day_today: "border border-yellow-500 text-yellow-500",
                    head_cell: "text-gray-500 w-9 font-bold text-[0.8rem]",
                    nav_button: "border-0 hover:bg-gray-700 rounded-full p-1",
                    caption: "flex justify-center pt-1 relative items-center mb-2",
                    caption_label: "text-sm font-bold text-white flex items-center gap-2",
                }}
            />
        </div>
    );
}