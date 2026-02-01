'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function JournalCalendar({ onDateSelect, allEntries, selectedDate, searchFilter }) {
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate));
    const [transitionDirection, setTransitionDirection] = useState('right');

    // Sync internal display state when the selected date changes externally
    useEffect(() => {
        setDisplayDate(new Date(selectedDate));
    }, [selectedDate]);

    const changeMonth = (direction) => {
        setTransitionDirection(direction === 'left' ? 'right' : 'left');
        setTimeout(() => {
            setTransitionDirection(direction);
            const newDate = new Date(displayDate);
            newDate.setMonth(newDate.getMonth() + (direction === 'left' ? -1 : 1));
            setDisplayDate(newDate);
        }, 150);
    };

    const renderCalendar = () => {
        const month = displayDate.getMonth();
        const year = displayDate.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const days = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`}></div>);

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateKey = `${year}-${month + 1}-${i}`;
            const entryForDay = allEntries[dateKey];
            const hasEntry = !!entryForDay; 

            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            
            // Search Logic: If a filter exists, dim days that don't match
            const isFilteredOut = searchFilter && hasEntry && !searchFilter.includes(dateKey);

            days.push(
                <TooltipProvider key={i}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                onClick={() => onDateSelect(date)}
                                className={cn(
                                    "p-1 cursor-pointer rounded-full text-center relative transition-all duration-200 h-8 w-8 flex items-center justify-center text-sm",
                                    isSelected ? 'bg-yellow-500 text-black font-bold shadow-lg scale-110 z-10' : 'hover:bg-gray-700 text-gray-300',
                                    isToday && !isSelected ? 'border-2 border-yellow-500 text-yellow-500 font-semibold' : '',
                                    isFilteredOut ? 'opacity-20 pointer-events-none' : ''
                                )}
                            >
                                {i}
                                {hasEntry && !isSelected && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-yellow-500"></span>
                                )}
                            </div>
                        </TooltipTrigger>
                        {hasEntry && (
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white text-xs z-50">
                                <p>{entryForDay.title || "Untitled Entry"}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return (
            <div className={`animate-fade-in-${transitionDirection}`}>
                <div className="flex justify-between items-center mb-4">
                    <button 
                        onClick={() => changeMonth('left')} 
                        className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                        aria-label="Previous Month"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <h3 className="font-bold text-base flex items-center">
                        <CalendarIcon className="mr-2 w-4 h-4 text-yellow-500" />
                        {displayDate.toLocaleString('default', { month: 'long' })} {displayDate.getFullYear()}
                    </h3>
                    <button 
                        onClick={() => changeMonth('right')} 
                        className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                        aria-label="Next Month"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                    {dayHeaders.map((day, index) => (
                        <div key={`${day}-${index}`} className="font-bold text-gray-500 text-center">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700 flex-grow">
            {renderCalendar()}
        </div>
    );
}