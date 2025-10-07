// for gemini copy/components/journal/JournalCalendar.js
'use client';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function JournalCalendar({ selectedDate, onDateSelect, entryDates }) {
    return (
        <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            className="rounded-md"
            modifiers={{
                hasEntry: entryDates.map(dateStr => new Date(dateStr + 'T12:00:00Z')) // Normalize to avoid timezone issues
            }}
            modifiersClassNames={{
                hasEntry: 'bg-yellow-500/20 text-yellow-300 rounded-full'
            }}
        />
    );
}