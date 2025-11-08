'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Import useRouter
import { saveLocalJournal, getLocalJournals, countLocalJournals } from '@/lib/localJournal';
import { createClient } from '@/utils/supabase/client';
import eventBus from '@/lib/eventBus';
import {
    ChevronLeft, ChevronRight, RefreshCw, Bold, Italic, List, Heading1, Heading2, Search, Calendar as CalendarIcon, Type as ParagraphIcon, Bot, Lock, Edit, Zap
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { useSubscription } from '@/context/SubscriptionContext'; // Import useSubscription
import Link from 'next/link';
// --- ADDON: Import SignUpModal (or a new "Migration Success" modal)
import SignUpModal from '@/components/auth/SignUpModal'; // Re-using this modal for now

// --- Reusable Sub-Components (assuming they are defined in the same file or imported) ---
const Greeting = ({ greeting }) => (
    <div className="flex items-center gap-4 animate-fade-in">
        <h1 className="text-4xl lg:text-5xl font-bold z-20 bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            {greeting}
        </h1>
    </div>
);

const ActivityRing = ({ percentage, color, label, value }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedPercentage(percentage);
        }, 300);
        return () => clearTimeout(timer);
    }, [percentage]);
    return (
        <div className="relative w-16 h-16 lg:w-20 lg:h-20 group">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <span className="font-bold text-base lg:text-lg transition-all duration-500 group-hover:scale-110">{value}</span>
                <span className="text-xs -mt-1 opacity-80">{label}</span>
            </div>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"></circle>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${animatedPercentage}, 100`} strokeLinecap="round" className="transition-all duration-1000 ease-out"></circle>
            </svg>
        </div>
    );
};

// ... (Prompt, Calendar, and other sub-components remain the same) ...
const highPerformancePrompts = ["You had a great focus day! What was your secret to success?", "You completed a lot of tasks today. What was your biggest win?", "Momentum was on your side. How can you carry this into tomorrow?"];
const lowPerformancePrompts = ["It looks like today was a challenge. What were some of the blockers you faced?", "What was the biggest distraction for you today?", "What's one small thing you can change to make tomorrow more focused?"];
const generalPrompts = ["What are you most grateful for right now?", "Describe one thing you learned today, big or small.", "What was the most interesting problem you worked on today?"];

const Prompt = ({ dailyStats }) => {
    const [prompt, setPrompt] = useState("Let's reflect on your day.");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshPrompt = useCallback(() => {
        setIsRefreshing(true);
        let promptPool = generalPrompts;

        if (dailyStats && dailyStats.sessions.value) {
            const pomosCompleted = parseInt(dailyStats.sessions.value, 10);
            if (pomosCompleted >= 4) promptPool = highPerformancePrompts;
            else if (pomosCompleted <= 1 && new Date().getHours() > 18) promptPool = lowPerformancePrompts;
        }

        setPrompt(currentPrompt => {
            let newPrompt = currentPrompt;
            while (newPrompt === currentPrompt) {
                newPrompt = promptPool[Math.floor(Math.random() * promptPool.length)];
            }
            return newPrompt;
        });

        setTimeout(() => setIsRefreshing(false), 500);
    }, [dailyStats]);

    useEffect(() => {
        refreshPrompt();
    }, [dailyStats, refreshPrompt]);

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700 animate-fade-in-up">
            <h2 className="font-bold mb-2 text-yellow-400 text-sm uppercase tracking-wider flex items-center"><Bot className="mr-2 w-4 h-4" /> Reflective Prompt</h2>
            <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg transition-all duration-300 hover:bg-black/40">
                <p className="text-sm text-gray-200 flex-grow transition-opacity duration-300">{prompt}</p>
                <button onClick={refreshPrompt} className="p-2 rounded-full bg-gray-700 hover:bg-yellow-500 hover:text-gray-900 transition-all duration-300 flex-shrink-0" aria-label="Refresh prompt"><RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
            </div>
        </div>
    );
};


const Calendar = ({ onDateSelect, allEntries, selectedDate, searchFilter }) => {
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate));
    const [transitionDirection, setTransitionDirection] = useState('right');

    const entryDays = Object.keys(allEntries);

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
        }, 150)
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
            const hasEntryWithContent = entryForDay && entryForDay.content && entryForDay.content.replace(/<[^>]*>/g, '').trim() !== '';

            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const isFilteredOut = searchFilter && hasEntryWithContent && !searchFilter.includes(dateKey);

            days.push(
                <div key={i} onClick={() => onDateSelect(date)} className={`p-1 cursor-pointer rounded-full text-center relative transition-all duration-200 transform hover:scale-110 ${isSelected ? 'bg-yellow-500 text-gray-900 font-bold scale-110 shadow-lg' : isToday ? 'border-2 border-yellow-500' : 'hover:bg-gray-700'} ${isFilteredOut ? 'opacity-20 pointer-events-none' : ''}`}>
                    {i}
                    {hasEntryWithContent && !isSelected && (<span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-yellow-500"></span>)}
                </div>
            );
        }

        return (
            <div className={`animate-fade-in-${transitionDirection}`}>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth('left')} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-300"><ChevronLeft size={20} /></button>
                    <h3 className="font-bold text-lg flex items-center"><CalendarIcon className="mr-2 w-5 h-5 text-yellow-500" />{displayDate.toLocaleString('default', { month: 'long' })} {displayDate.getFullYear()}</h3>
                    <button onClick={() => changeMonth('right')} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-300"><ChevronRight size={20} /></button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-sm">
                    {dayHeaders.map((day, index) => (<div key={`${day}-${index}`} className="font-bold text-gray-400 text-center py-1">{day}</div>))}
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-2xl shadow-lg border border-gray-700 flex-grow">
            {renderCalendar()}
        </div>
    );
};

const JournalEditor = ({ entry, onEntryChange, dailyStats, isPastDate, isEditMode, setIsEditMode, isSavingDisabled, entryCount }) => {
    const editorRef = useRef(null);

    const isLocked = (isPastDate && !isEditMode) || isSavingDisabled;

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== entry.content) {
            editorRef.current.innerHTML = entry.content;
        }
    }, [entry.id, entry.content]);

    const handleContentChange = (e) => {
        if (isLocked) return;
        onEntryChange({ ...entry, content: e.currentTarget.innerHTML });
    };
    const handleTitleChange = (e) => {
        if (isLocked) return;
        onEntryChange({ ...entry, title: e.target.value });
    };
    const formatDoc = (command, value = null) => {
        if (isLocked) return;
        document.execCommand(command, false, value);
        editorRef.current.focus();
    };
    const formatButtonClass = "p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:pointer-events-none";

    return (
        <section className="flex-grow bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-5 md:p-7 flex flex-col overflow-hidden shadow-xl border border-gray-700 animate-fade-in-left">
            <div className="flex items-center gap-4 mb-6 relative">
                <input value={entry.title || ''} onChange={handleTitleChange} disabled={isLocked} className="bg-transparent text-2xl lg:text-3xl font-bold w-full focus:outline-none border-b-2 border-transparent focus:border-yellow-500 transition-all duration-300 pb-1 disabled:opacity-70" placeholder="Journal Entry Title" />
                <div className="relative">
                    <Image src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTFmM2U3ZDAxMDRmOTczZGIyNDkyODYzOTczY2I1MjZkYmFjNGE2ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/RgzryV9I1h5oYc1R26/giphy.gif" alt="Decorative animation" width={48} height={48} unoptimized={true} className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-yellow-500 shadow-lg" />
                </div>
            </div>

            {isSavingDisabled && (
                <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center">
                    <p className="font-bold text-yellow-300">Journal Limit Reached</p>
                    <p className="text-sm text-yellow-200/90 mt-1">You&apos;ve reached the 30-entry limit for the free plan.</p>
                    <Button asChild size="sm" className="mt-3 bg-yellow-500 text-gray-900 hover:bg-yellow-400">
                        <Link href="/pricing"><Zap size={14} className="mr-2" /> Upgrade to Pro for Unlimited Entries</Link>
                    </Button>
                </div>
            )}

            <div className="flex-shrink-0 flex items-center gap-4 md:gap-6 mb-6 p-4 bg-black/30 rounded-xl backdrop-blur-sm border border-gray-700/50">
                <h3 className="font-bold text-gray-400 hidden sm:block">Today&apos;s Focus:</h3>
                <div className="flex items-center gap-4 md:gap-6 w-full justify-around sm:justify-start">
                    <ActivityRing percentage={dailyStats.focus.percentage} color="#38B2AC" value={dailyStats.focus.value} label="Focus Goal" />
                    <ActivityRing percentage={dailyStats.tasks.percentage} color="#48BB78" value={dailyStats.tasks.value} label="Tasks Today" />
                    <ActivityRing percentage={dailyStats.sessions.percentage} color="#FBBF24" value={dailyStats.sessions.value} label="Pomos Today" />
                </div>
            </div>
            <div className="flex gap-2 mb-4 border-b border-gray-700 pb-3 items-center">
                <button className={formatButtonClass} disabled={isLocked} onClick={() => formatDoc('formatBlock', 'p')} aria-label="Paragraph"><ParagraphIcon size={18} /></button>
                <button className={formatButtonClass} disabled={isLocked} onClick={() => formatDoc('bold')} aria-label="Bold"><Bold size={18} /></button>
                <button className={formatButtonClass} disabled={isLocked} onClick={() => formatDoc('italic')} aria-label="Italic"><Italic size={18} /></button>
                <button className={formatButtonClass} disabled={isLocked} onClick={() => formatDoc('insertUnorderedList')} aria-label="Bulleted List"><List size={18} /></button>
                <button className={formatButtonClass} disabled={isLocked} onClick={() => formatDoc('formatBlock', 'h1')} aria-label="Heading 1"><Heading1 size={18} /></button>
                <button className={formatButtonClass} disabled={isLocked} onClick={() => formatDoc('formatBlock', 'h2')} aria-label="Heading 2"><Heading2 size={18} /></button>
                <div className="ml-auto flex items-center gap-2">
                    {isPastDate && (entry.content && entry.content.replace(/<[^>]*>/g, '').trim() !== '') && !isEditMode && (
                        <Button onClick={() => setIsEditMode(true)} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900" disabled={isSavingDisabled}><Edit size={16} className="mr-2" /> Edit Entry</Button>
                    )}
                    {isPastDate && isEditMode && (
                        <Button onClick={() => setIsEditMode(false)} variant="outline" className="text-yellow-400 border-yellow-500 hover:bg-yellow-500/10"><Lock size={16} className="mr-2" /> Save & Lock</Button>
                    )}
                </div>
            </div>
            <div ref={editorRef} contentEditable={!isLocked} onInput={handleContentChange} className={`prose prose-invert max-w-none flex-grow overflow-y-auto custom-scrollbar p-4 leading-relaxed bg-gray-900/50 rounded-xl border border-gray-700/30 focus:outline-none transition-all duration-300 ${isLocked ? 'focus:ring-0 opacity-70 cursor-not-allowed' : 'focus:ring-2 focus:ring-yellow-500'}`} placeholder="Start writing here..."></div>
        </section>
    );
};

// --- Main Journal Page ---
export default function JournalPage() {
    const { user, loading: authLoading } = useAuth();
    const { isPro, loading: subLoading } = useSubscription();
    const router = useRouter();
    const supabase = createClient();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [entry, setEntry] = useState({ id: null, date: null, title: '', content: '' });
    const [allEntries, setAllEntries] = useState({});
    const [greeting, setGreeting] = useState('');
    const [dailyStats, setDailyStats] = useState({ focus: { percentage: 0, value: '0/120m' }, tasks: { percentage: 0, value: '0/0' }, sessions: { percentage: 0, value: '0/0' }, });
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEntryDays, setFilteredEntryDays] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // --- ADDON: State for auth/migration modal
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [hasCheckedMigration, setHasCheckedMigration] = useState(false);
    //

    const getDateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const journalEntryCount = Object.keys(allEntries).length;
    const isFreeTierLimitReached = !isPro && journalEntryCount >= 30;

    // **NEW**: Combined loading state
    const isLoading = authLoading || subLoading;

    // --- Data Fetching and Side Effects ---

    useEffect(() => {
        // Redirect anonymous users
        if (!isLoading && !user) {
            router.push('/landing');
        }
    }, [user, isLoading, router]);

    const fetchJournalEntries = useCallback(async () => {
        if (isLoading || !user) return; // Wait for loading to finish and user to be present

        if (isPro) { // Premium User
            console.log("User is Pro, fetching from Supabase...");
            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error("Error fetching journal entries:", error);
                setAllEntries({});
            } else {
                const entriesMap = data.reduce((acc, entry) => {
                    // Handle potential timestamp with timezone
                    const date = new Date(entry.date.includes('T') ? entry.date : entry.date + 'T12:00:00Z');
                    const key = getDateKey(date);
                    acc[key] = entry;
                    return acc;
                }, {});
                setAllEntries(entriesMap);
            }
        } else { // Free Tier User
            console.log("User is Free, fetching from Local Storage...");
            setAllEntries(getLocalJournals());
        }
    }, [user, isPro, isLoading, supabase]);


    const fetchDailyStats = useCallback(async () => {
        // This function logic remains the same
        const { data: { user } } = await supabase.auth.getUser();
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        let activeTasks = [];
        let allTasks = [];
        if (user) {
            const { data: activeData, error: activeError } = await supabase.from('todos').select('is_complete, pomodoros_spent, pomodoros_estimated').eq('user_id', user.id).gte('updated_at', todayStart);
            if (activeError) { console.error("Error fetching active daily stats:", activeError); return; }
            activeTasks = activeData || [];
            const { data: allData, error: allError } = await supabase.from('todos').select('id, is_complete').eq('user_id', user.id);
            if (allError) { console.error("Error fetching all tasks:", allError); return; }
            allTasks = allData || [];
        } else {
            const localTasks = JSON.parse(localStorage.getItem('ws_tasks')) || [];
            allTasks = localTasks;
            activeTasks = localTasks.filter(t => {
                const updatedDate = new Date(t.updated_at || t.created_at);
                return updatedDate >= new Date(todayStart);
            });
        }
        const focusTime = Math.round(activeTasks.reduce((acc, t) => acc + (t.pomodoros_spent || 0), 0) * 25);
        const focusGoal = 120;
        const tasksCompletedToday = activeTasks.filter(t => t.is_complete).length;
        const tasksWorkedOnToday = activeTasks.length;
        const pomodorosCompleted = activeTasks.reduce((acc, t) => acc + (t.pomodoros_spent || 0), 0);
        const pomodorosEstimated = activeTasks.reduce((acc, t) => acc + (t.pomodoros_estimated || 1), 0);
        setDailyStats({
            focus: { percentage: focusGoal > 0 ? Math.min(100, (focusTime / focusGoal) * 100) : 0, value: `${focusTime}/${focusGoal}m` },
            tasks: { percentage: tasksWorkedOnToday > 0 ? (tasksCompletedToday / tasksWorkedOnToday) * 100 : 0, value: `${tasksCompletedToday}/${tasksWorkedOnToday}` },
            sessions: { percentage: pomodorosEstimated > 0 ? (pomodorosCompleted / pomodorosEstimated) * 100 : 0, value: `${pomodorosCompleted}/${pomodorosEstimated}` },
        });
    }, [supabase]); // Made supabase a dependency

    useEffect(() => {
        const initialize = () => {
            const hour = new Date().getHours();
            setGreeting(hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening');
            fetchDailyStats();

            const handleTasksUpdated = () => fetchDailyStats();
            eventBus.on('tasksUpdated', handleTasksUpdated);

            return () => eventBus.remove('tasksUpdated', handleTasksUpdated);
        };
        initialize();
    }, [fetchDailyStats]);

    useEffect(() => {
        fetchJournalEntries();
    }, [fetchJournalEntries]); // Re-fetch when user/pro status changes

    // --- ADDON: Data Migration Effect ---
    useEffect(() => {
        if (isPro && user && !isLoading && !hasCheckedMigration) {
            console.log("Checking for local data to migrate...");
            setHasCheckedMigration(true); // Only run this check once

            const localJournals = getLocalJournals();
            const localEntries = Object.entries(localJournals);

            if (localEntries.length > 0) {
                console.log(`Found ${localEntries.length} local entries. Migrating to Supabase...`);

                const formattedEntries = localEntries.map(([dateKey, entry]) => {
                    const [year, month, day] = dateKey.split('-').map(Number);
                    const isoDate = new Date(year, month - 1, day).toISOString().split('T')[0];
                    return {
                        user_id: user.id,
                        date: isoDate,
                        title: entry.title,
                        content: entry.content,
                    };
                });

                const migrateData = async () => {
                    try {
                        // Upsert to prevent duplicates if user downgraded and re-upgraded
                        const { error } = await supabase
                            .from('journal_entries')
                            .upsert(formattedEntries, { onConflict: 'user_id, date' });

                        if (error) {
                            throw error;
                        }

                        console.log("Migration successful!");
                        localStorage.removeItem('ws_journal_entries'); // Clear local data
                        // (Optional: show a success modal)

                        // Refetch entries from Supabase to update the UI
                        fetchJournalEntries();

                    } catch (error) {
                        console.error("Error migrating local journal entries:", error);
                        // (Optional: show an error modal)
                    }
                };
                migrateData();
            } else {
                console.log("No local journal entries found to migrate.");
            }
        }
    }, [isPro, user, isLoading, hasCheckedMigration, supabase, fetchJournalEntries]);
    // --- End of Data Migration Effect ---


    useEffect(() => {
        const dateKey = getDateKey(selectedDate);
        const savedEntry = allEntries[dateKey] || {};
        const title = savedEntry.title || selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        setEntry({
            id: savedEntry.id || null,
            date: dateKey,
            title,
            content: savedEntry.content || ''
        });
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const checkDate = new Date(selectedDate); checkDate.setHours(0, 0, 0, 0);
        setIsEditMode(checkDate >= today);
    }, [selectedDate, allEntries]);

    // --- Search Filtering ---
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEntryDays(null);
            return;
        }
        const filteredDays = Object.entries(allEntries)
            .filter(([, entryData]) => entryData.title?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(([dateKey]) => dateKey);
        setFilteredEntryDays(filteredDays);
    }, [searchQuery, allEntries]);

    // --- Entry Saving Logic ---
    const timeoutRef = useRef(null);
    const handleEntryChange = useCallback((newEntry) => {
        setEntry(newEntry);

        // Prevent saving for free tier if limit is reached and it's a new entry
        const dateKey = getDateKey(selectedDate);
        const isNewEntry = !allEntries[dateKey];
        if (isFreeTierLimitReached && isNewEntry) {
            // This now just prevents saving, the UI is handled by `isSavingDisabled`
            console.warn("Journal limit reached. Upgrade to save new entries.");
            return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            if (user && isPro) {
                // Save to Supabase for Pro users
                const { data, error } = await supabase
                    .from('journal_entries')
                    .upsert({
                        id: newEntry.id,
                        user_id: user.id,
                        date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toISOString().split('T')[0],
                        title: newEntry.title,
                        content: newEntry.content,
                    }, { onConflict: 'id' }) // Use 'id' for conflict to ensure upsert works correctly
                    .select()
                    .single();

                if (error) {
                    console.error("Error saving to Supabase:", error);
                } else if (data) {
                    setAllEntries(prev => ({ ...prev, [dateKey]: data }));
                    if (!newEntry.id) setEntry(prev => ({ ...prev, id: data.id }));
                }
            } else if (user) {
                // Save to local storage for Free users
                saveLocalJournal(dateKey, { title: newEntry.title, content: newEntry.content });
                setAllEntries(getLocalJournals());
            }
        }, 1000);
    }, [selectedDate, user, isPro, isFreeTierLimitReached, allEntries, supabase]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDate); checkDate.setHours(0, 0, 0, 0);
    const isPastDate = checkDate < today;

    // ADDON: Handle auth modal for free users
    const handleEditorClick = () => {
        if (!isPro && !isLoading) {
            setIsSignUpModalOpen(true);
        }
    };

    // MODIFIED: Show modal on editor focus *only if free user*
    const editorWrapperProps = !isPro ? { onClick: handleEditorClick } : {};


    // Loading state for initial auth/sub check
    if (isLoading) {
        return <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center text-white">Loading your journal...</div>;
    }

    // This shouldn't be reached if the redirect works, but as a fallback.
    if (!user) {
        return <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center text-white">Redirecting...</div>;
    }

    // Check if motion reduction is enabled
    const reducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

    // Render the journal page
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 font-sans">
            <SignUpModal isOpen={isSignUpModalOpen} setIsOpen={setIsSignUpModalOpen} />
            <style jsx global>{`
                /* ... animations ... */
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
                .animate-fade-in-left { animation: fadeInLeft 0.6s ease-out forwards; }
                .animate-fade-in-right { animation: fadeInRight 0.6s ease-out forwards; }

                ${reducedMotion ? `
                .animate-fade-in, .animate-fade-in-up, .animate-fade-in-left, .animate-fade-in-right {
                    animation-duration: 0.01ms !important;
                }
                ` : ''}

                [contenteditable]:focus { outline: none; }

                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

                /* --- STYLING FIXES --- */
                .prose p {
                    font-size: 1rem;
                    line-height: 1.7; /* Increased for readability */
                    margin-top: 0.25em;
                    margin-bottom: 0.25em;
                }
                .prose h1 { font-size: 1.875rem; margin-bottom: 0.75rem; margin-top: 1.5rem; }
                .prose h2 { font-size: 1.5rem; margin-bottom: 0.75rem; margin-top: 1.25rem; }
                .prose ul, .prose ol { padding-left: 1.75rem; margin-top: 0.5em; margin-bottom: 0.5em; }
           `}</style>
            <div className="flex flex-col py-4 px-4 sm:px-8 md:px-12 lg:px-16 gap-5">
                <header className="flex-shrink-0 h-48 lg:h-56 relative flex justify-center items-center rounded-2xl overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-blue-900/50 to-indigo-900/70 z-0"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-gray-900/80 to-gray-950 z-10"></div>
                    <Greeting greeting={`${greeting}, ${user?.email?.split('@')[0] || 'Explorer'}`} />
                </header>
                <main className="flex-grow flex flex-col lg:flex-row gap-5">
                    <aside className="w-full lg:w-1/3 lg:max-w-xs flex-shrink-0 flex flex-col gap-5">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-3">
                            <button onClick={() => setSelectedDate(new Date())} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold py-2.5 px-4 rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 shadow-md hover:shadow-lg">
                                Go to Today
                            </button>
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="search"
                                    placeholder="Search entries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                                />
                            </div>
                        </div>
                        <Calendar onDateSelect={setSelectedDate} allEntries={allEntries} selectedDate={selectedDate} searchFilter={filteredEntryDays} />
                        <Prompt dailyStats={dailyStats} />

                        {!isPro && user && (
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700">
                                <div className="flex items-center justify-between">
                                    <Label className="flex flex-col space-y-1">
                                        <span className="font-medium text-white">Journal Entries</span>
                                        <span className="font-normal text-sm text-gray-400">{journalEntryCount} / 30 used</span>
                                    </Label>
                                    <Button asChild size="sm" className="bg-yellow-500 text-gray-900 hover:bg-yellow-400">
                                        <Link href="/pricing">Upgrade</Link>
                                    </Button>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${(journalEntryCount / 30) * 100}%` }}></div>
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* MODIFIED: Added wrapper div with click handler */}
                    <div {...editorWrapperProps} className="flex-grow">
                        <JournalEditor
                            entry={entry}
                            onEntryChange={handleEntryChange}
                            dailyStats={dailyStats}
                            isPastDate={isPastDate}
                            isEditMode={isEditMode}
                            setIsEditMode={setIsEditMode}
                            isSavingDisabled={isFreeTierLimitReached && !allEntries[getDateKey(selectedDate)]}
                            entryCount={journalEntryCount}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}