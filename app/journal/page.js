'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { saveLocalJournal, getLocalJournals } from '@/lib/localJournal';
import { createClient } from '@/utils/supabase/client';
import eventBus from '@/lib/eventBus';
import {
    ChevronLeft, ChevronRight, RefreshCw, Bold, Italic, List, Heading1, Heading2, Search,
    Calendar as CalendarIcon, Type as ParagraphIcon, Bot, Lock, Edit, Zap, User, Star, Crown,
    LogIn, Save, Loader2, PanelTopClose, PanelTopOpen, ArrowLeft, ArrowRight, Hourglass, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import Link from 'next/link';
import SignUpModal from '@/components/auth/SignUpModal';
import { Label } from '@/components/ui/label';
import JournalEntriesModal from '@/components/journal/JournalEntriesModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// --- Constants (Defined outside to prevent re-renders) ---
const HIGH_PERFORMANCE_PROMPTS = ["You had a great focus day! What was your secret?", "Biggest win today?", "How to carry this momentum to tomorrow?"];
const LOW_PERFORMANCE_PROMPTS = ["What blocked you today?", "Biggest distraction?", "One small change for tomorrow?"];
const GENERAL_PROMPTS = ["What are you grateful for?", "One thing you learned?", "Interesting problem solved?"];

// --- Sub-Components ---

const Greeting = ({ greeting, username }) => (
    <div className="absolute bottom-6 left-6 z-20 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
            {greeting}, <span className="text-yellow-400">{username}</span>
        </h1>
    </div>
);

const ActivityRing = ({ percentage, color, label, value, onClick }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedPercentage(percentage);
        }, 300);
        return () => clearTimeout(timer);
    }, [percentage]);
    return (
        <div
            onClick={onClick}
            className={`relative w-16 h-16 lg:w-20 lg:h-20 group ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <span className={`font-bold text-base lg:text-lg transition-all duration-500 ${onClick ? 'group-hover:scale-110 group-hover:text-yellow-400' : ''}`}>{value}</span>
                <span className="text-xs -mt-1 opacity-80">{label}</span>
            </div>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"></circle>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${animatedPercentage}, 100`} strokeLinecap="round" className="transition-all duration-1000 ease-out"></circle>
            </svg>
        </div>
    );
};

const Prompt = ({ dailyStats }) => {
    const [prompt, setPrompt] = useState("Let's reflect on your day.");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshPrompt = useCallback(() => {
        setIsRefreshing(true);
        let promptPool = GENERAL_PROMPTS;
        if (dailyStats && dailyStats.sessions.value) {
            const pomosCompleted = parseInt(dailyStats.sessions.value, 10);
            if (pomosCompleted >= 4) promptPool = HIGH_PERFORMANCE_PROMPTS;
            else if (pomosCompleted <= 1 && new Date().getHours() > 18) promptPool = LOW_PERFORMANCE_PROMPTS;
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

    useEffect(() => { refreshPrompt(); }, [dailyStats, refreshPrompt]);

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="font-bold mb-2 text-yellow-400 text-sm uppercase tracking-wider flex items-center"><Bot className="mr-2 w-4 h-4" /> Reflective Prompt</h2>
            <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg transition-all duration-300 hover:bg-black/40">
                <p className="text-sm text-gray-200 flex-grow transition-opacity duration-300">{prompt}</p>
                <button onClick={refreshPrompt} className="p-2 rounded-full bg-gray-700 hover:bg-yellow-500 hover:text-gray-900 transition-all duration-300 flex-shrink-0"><RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
            </div>
        </div>
    );
};

const Calendar = ({ onDateSelect, allEntries, selectedDate, searchFilter }) => {
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate));
    const [transitionDirection, setTransitionDirection] = useState('right');

    useEffect(() => { setDisplayDate(new Date(selectedDate)); }, [selectedDate]);

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
            const hasEntry = entryForDay && entryForDay.content && entryForDay.content.replace(/<[^>]*>/g, '').trim() !== '';

            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
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
                                {hasEntry && !isSelected && (<span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-yellow-500"></span>)}
                            </div>
                        </TooltipTrigger>
                        {hasEntry && (
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white text-xs">
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
                    <button onClick={() => changeMonth('left')} className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"><ChevronLeft size={16} /></button>
                    <h3 className="font-bold text-base flex items-center"><CalendarIcon className="mr-2 w-4 h-4 text-yellow-500" />{displayDate.toLocaleString('default', { month: 'long' })} {displayDate.getFullYear()}</h3>
                    <button onClick={() => changeMonth('right')} className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"><ChevronRight size={16} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                    {dayHeaders.map((day, index) => (<div key={`${day}-${index}`} className="font-bold text-gray-500 text-center">{day}</div>))}
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
};

const JournalEditor = ({
    entry, onEntryChange, dailyStats, isPastDate, isFutureDate, isEditMode, setIsEditMode,
    isSavingDisabled, onEntriesClick, saveStatus, onNavigate
}) => {
    const editorRef = useRef(null);

    // Lock logic: Locked if it's (Past OR Future) AND not in edit mode.
    // This ensures Time Capsules are locked by default until "Opened".
    const isLocked = ((isPastDate || isFutureDate) && !isEditMode);

    const isEmpty = !entry.content || entry.content.replace(/<[^>]*>/g, '').trim() === '';

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== entry.content) {
            editorRef.current.innerHTML = entry.content;
        }
    }, [entry.id, entry.content]);

    const handleContentChange = (e) => {
        onEntryChange({ ...entry, content: e.currentTarget.innerHTML });
    };
    const handleTitleChange = (e) => {
        onEntryChange({ ...entry, title: e.target.value });
    };
    const formatDoc = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current.focus();
    };
    const formatButtonClass = "p-1.5 md:p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-all text-gray-300 hover:text-white disabled:opacity-30";

    return (
        <section className="flex-grow bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-xl border border-gray-700 animate-fade-in-left h-full">
            {/* Header Area */}
            <div className="p-5 md:p-7 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    {/* Navigation and Title */}
                    <div className="flex items-center gap-3 w-full">
                        <Button variant="ghost" size="icon" onClick={() => onNavigate(-1)} className="text-gray-400 hover:text-white shrink-0">
                            <ChevronLeft />
                        </Button>

                        <div className="relative flex-grow">
                            <input
                                value={entry.title || ''}
                                onChange={handleTitleChange}
                                disabled={isLocked}
                                className="bg-transparent text-xl md:text-3xl font-bold w-full focus:outline-none border-b-2 border-transparent focus:border-yellow-500 transition-all pb-1 disabled:opacity-70 placeholder:text-gray-600"
                                placeholder={isFutureDate ? "Time Capsule Title" : "Journal Entry Title"}
                            />
                            {/* Auto-Save Indicator */}
                            <div className="absolute right-0 top-0 md:top-2 text-xs font-medium flex items-center gap-1.5">
                                {saveStatus === 'saving' && (
                                    <span className="text-yellow-500 flex items-center gap-1 animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                                    </span>
                                )}
                                {saveStatus === 'saved' && (
                                    <span className="text-green-500 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1 duration-500">
                                        <Save className="w-3 h-3" /> Saved
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => onNavigate(1)} className="text-gray-400 hover:text-white shrink-0">
                            <ChevronRight />
                        </Button>
                    </div>

                    {/* User Badge */}
                    <div className="self-end md:self-auto shrink-0">
                        {!dailyStats.user ? (
                            <Button size="sm" asChild className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-9 px-4 rounded-full shadow-lg">
                                <Link href="/login">Sign In</Link>
                            </Button>
                        ) : dailyStats.isPro ? (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg border-2 border-white/20" title="Pro User">
                                <Crown className="text-black w-5 h-5" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 border-2 border-yellow-500/50 shadow-lg" title="Experience User">
                                <Star className="text-yellow-500 w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>  

                {isSavingDisabled && (
                    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                        <p className="font-bold text-yellow-300 text-sm">Journal Limit Reached</p>
                        <Button asChild size="sm" variant="link" className="text-yellow-200 h-auto p-0">
                            <Link href="/landing">Upgrade to Pro</Link>
                        </Button>
                    </div>
                )}

                {/* Stats / Rings */}
                <div className="flex-shrink-0 flex items-center gap-4 mb-4 p-3 bg-black/30 rounded-xl backdrop-blur-sm border border-gray-700/50 overflow-x-auto">
                    <h3 className="font-bold text-gray-400 hidden sm:block text-sm uppercase tracking-wide">Daily Snapshot:</h3>
                    <div className="flex items-center gap-6 w-full justify-around sm:justify-start">
                        <ActivityRing percentage={dailyStats.entries.percentage} color="#38B2AC" value={dailyStats.entries.value} label="Entries" onClick={onEntriesClick} />
                        <ActivityRing percentage={dailyStats.tasks.percentage} color="#48BB78" value={dailyStats.tasks.value} label="Tasks" />
                        <ActivityRing percentage={dailyStats.sessions.percentage} color="#FBBF24" value={dailyStats.sessions.value} label="Focus" />
                    </div>
                </div>
            </div>

            {/* Sticky Toolbar */}
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-y border-gray-700 px-5 py-2 flex items-center gap-1 shadow-md">
                <button className={formatButtonClass} onClick={() => formatDoc('formatBlock', 'p')} aria-label="Paragraph"><ParagraphIcon size={16} /></button>
                <button className={formatButtonClass} onClick={() => formatDoc('bold')} aria-label="Bold"><Bold size={16} /></button>
                <button className={formatButtonClass} onClick={() => formatDoc('italic')} aria-label="Italic"><Italic size={16} /></button>
                <button className={formatButtonClass} onClick={() => formatDoc('insertUnorderedList')} aria-label="Bulleted List"><List size={16} /></button>
                <button className={formatButtonClass} onClick={() => formatDoc('formatBlock', 'h1')} aria-label="Heading 1"><Heading1 size={16} /></button>
                <button className={formatButtonClass} onClick={() => formatDoc('formatBlock', 'h2')} aria-label="Heading 2"><Heading2 size={16} /></button>
                <div className="ml-auto flex items-center gap-2">
                    {/* Unified Edit/Lock Button for Past and Future Dates */}
                    {(isPastDate || isFutureDate) && !isEditMode && (
                        <Button onClick={() => setIsEditMode(true)} size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 h-8 text-xs" disabled={isSavingDisabled}><Edit size={14} className="mr-1" /> Edit</Button>
                    )}
                    {(isPastDate || isFutureDate) && isEditMode && (
                        <Button onClick={() => setIsEditMode(false)} size="sm" variant="outline" className="text-yellow-400 border-yellow-500 hover:bg-yellow-500/10 h-8 text-xs"><Lock size={14} className="mr-1" /> Lock</Button>
                    )}
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-grow relative bg-gray-900/50">

                {/* Retrospective Overlay (Past & Empty & Locked) */}
                {isPastDate && isEmpty && !isEditMode && (
                    <div
                        onClick={() => setIsEditMode(true)}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm cursor-pointer hover:bg-gray-900/50 transition-all group"
                    >
                        <div className="bg-gray-800 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform border border-gray-700 group-hover:border-yellow-500">
                            <History size={32} className="text-gray-400 group-hover:text-yellow-400" />
                        </div>
                        <p className="text-lg font-bold text-gray-200 group-hover:text-white">No entry recorded.</p>
                        <p className="text-sm text-gray-400 mt-1">Add a retrospective note? <span className="text-yellow-400 underline">Click to Edit</span></p>
                    </div>
                )}

                {/* Time Capsule Overlay (Future & Empty & Locked) */}
                {isFutureDate && isEmpty && !isEditMode && (
                    <div
                        onClick={() => setIsEditMode(true)} // Clicking now enters Edit Mode
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-[2px] cursor-pointer hover:bg-gray-900/30 transition-all group"
                    >
                        <div className="bg-gray-800/80 p-4 rounded-full mb-3 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform">
                            <Hourglass size={32} className="text-indigo-400" />
                        </div>
                        <p className="text-lg font-bold text-indigo-200">Time Capsule</p>
                        <p className="text-sm text-indigo-300/80 mt-1">Write a note to your future self. <span className="text-white underline">Click to open.</span></p>
                    </div>
                )}

                <div
                    ref={editorRef}
                    contentEditable={!isLocked}
                    onInput={handleContentChange}
                    className={cn(
                        "prose prose-invert max-w-none w-full h-full overflow-y-auto custom-scrollbar p-6 leading-relaxed focus:outline-none",
                        isLocked ? 'opacity-80' : ''
                    )}
                    placeholder={isFutureDate ? "Dear Future Me..." : "Start writing here..."}
                ></div>
            </div>
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

    // UI States
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [saveStatus, setSaveStatus] = useState('idle');

    // Stats State
    const [dailyStats, setDailyStats] = useState({
        entries: { percentage: 0, value: '0/0', limit: 30 },
        tasks: { percentage: 0, value: '0/0' },
        sessions: { percentage: 0, value: '0/0' },
        user: null,
        isPro: false
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEntryDays, setFilteredEntryDays] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Modal States
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('signup');
    const [hasCheckedMigration, setHasCheckedMigration] = useState(false);
    const [isEntriesListOpen, setIsEntriesListOpen] = useState(false);

    const getDateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    // Updated: Count only non-empty entries
    const journalEntryCount = Object.values(allEntries).filter(e => {
        const content = e.content ? e.content.replace(/<[^>]*>/g, '').trim() : '';
        return content.length > 0;
    }).length;

    const isFreeTierLimitReached = !isPro && journalEntryCount >= 30;
    const isLoading = authLoading || subLoading;

    // --- Helpers ---
    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    // --- Fetch Logic ---
    const fetchJournalEntries = useCallback(async () => {
        if (isLoading) return;

        if (user && isPro) {
            const { data, error } = await supabase.from('journal_entries').select('*').eq('user_id', user.id);
            if (error) { console.error("Error fetching journal entries:", error); setAllEntries({}); }
            else {
                const entriesMap = data.reduce((acc, entry) => {
                    const date = new Date(entry.date.includes('T') ? entry.date : entry.date + 'T12:00:00Z');
                    acc[getDateKey(date)] = entry;
                    return acc;
                }, {});
                setAllEntries(entriesMap);
            }
        } else {
            setAllEntries(getLocalJournals());
        }
    }, [user, isPro, isLoading, supabase]);

    const fetchDailyStats = useCallback(async () => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        let activeTasks = [];

        if (user) {
            const { data } = await supabase.from('todos').select('is_complete, pomodoros_spent, pomodoros_estimated').eq('user_id', user.id).gte('updated_at', todayStart);
            activeTasks = data || [];
        } else {
            const localTasks = JSON.parse(localStorage.getItem('ws_tasks')) || [];
            activeTasks = localTasks.filter(t => new Date(t.updated_at || t.created_at) >= new Date(todayStart));
        }

        const tasksCompleted = activeTasks.filter(t => t.is_complete).length;
        const tasksTotal = activeTasks.length;
        const pomosCompleted = activeTasks.reduce((acc, t) => acc + (t.pomodoros_spent || 0), 0);
        const pomosTotal = activeTasks.reduce((acc, t) => acc + (t.pomodoros_estimated || 1), 0);

        setDailyStats(prev => ({
            ...prev,
            tasks: { percentage: tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0, value: `${tasksCompleted}/${tasksTotal}` },
            sessions: { percentage: pomosTotal > 0 ? (pomosCompleted / pomosTotal) * 100 : 0, value: `${pomosCompleted}/${pomosTotal}` },
            user: user,
            isPro: isPro
        }));
    }, [supabase, user, isPro]);

    // --- Effects ---
    useEffect(() => {
        const hour = new Date().getHours();
        setGreeting(hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening');
        fetchDailyStats();
        eventBus.on('tasksUpdated', fetchDailyStats);
        return () => eventBus.remove('tasksUpdated', fetchDailyStats);
    }, [fetchDailyStats]);

    useEffect(() => {
        // Use the updated logic here too for the ring visual
        const count = Object.values(allEntries).filter(e => {
            const content = e.content ? e.content.replace(/<[^>]*>/g, '').trim() : '';
            return content.length > 0;
        }).length;

        const limit = isPro ? 365 : 30;
        const percentage = Math.min(100, (count / limit) * 100);
        setDailyStats(prev => ({ ...prev, entries: { percentage, value: `${count}/${limit}`, limit } }));
    }, [allEntries, isPro]);

    useEffect(() => { fetchJournalEntries(); }, [fetchJournalEntries]);

    useEffect(() => {
        if (isPro && user && !isLoading && !hasCheckedMigration) {
            setHasCheckedMigration(true);
            const local = getLocalJournals();
            if (Object.keys(local).length > 0) {
                const formatted = Object.entries(local).map(([k, v]) => {
                    const [y, m, d] = k.split('-').map(Number);
                    return { user_id: user.id, date: new Date(y, m - 1, d).toISOString().split('T')[0], title: v.title, content: v.content };
                });
                supabase.from('journal_entries').upsert(formatted, { onConflict: 'user_id, date' })
                    .then(() => { localStorage.removeItem('ws_journal_entries'); fetchJournalEntries(); });
            }
        }
    }, [isPro, user, isLoading, hasCheckedMigration, supabase, fetchJournalEntries]);

    useEffect(() => {
        const dateKey = getDateKey(selectedDate);
        const saved = allEntries[dateKey] || {};
        const title = saved.title || selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        setEntry({ id: saved.id || null, date: dateKey, title, content: saved.content || '' });
    }, [selectedDate, allEntries]);
    // 2. Lock Logic Effect: Runs ONLY when you actually change the date
    // This prevents the app from re-locking while you are typing/saving on the same date.
    useEffect(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const check = new Date(selectedDate); check.setHours(0, 0, 0, 0);
        // If it's Today -> Unlocked (Edit Mode True)
        // If it's Past/Future -> Locked (Edit Mode False)
        // This only runs ONCE when you navigate to the date.
        setIsEditMode(check.getTime() === today.getTime());
    }, [selectedDate]);

    useEffect(() => {
        if (!searchQuery.trim()) { setFilteredEntryDays(null); return; }
        const filtered = Object.entries(allEntries)
            .filter(([, v]) => v.title?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(([k]) => k);
        setFilteredEntryDays(filtered);
    }, [searchQuery, allEntries]);

    // --- Saving Logic ---
    const timeoutRef = useRef(null);
    const handleEntryChange = useCallback((newEntry) => {
        setEntry(newEntry);
        setSaveStatus('saving');

        const dateKey = getDateKey(selectedDate);
        // Only block saving if limit is reached AND this is a NEW entry that actually has content
        if (isFreeTierLimitReached && !allEntries[dateKey]) {
            const newContent = newEntry.content?.replace(/<[^>]*>/g, '').trim() || '';
            if (newContent.length > 0) {
                setSaveStatus('error');
                return;
            }
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            if (user && isPro) {
                const payload = {
                    user_id: user.id,
                    date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toISOString().split('T')[0],
                    title: newEntry.title,
                    content: newEntry.content,
                };
                if (newEntry.id) payload.id = newEntry.id;
                const { data } = await supabase.from('journal_entries').upsert(payload, { onConflict: 'user_id, date' }).select().single();
                if (data) {
                    setAllEntries(prev => ({ ...prev, [dateKey]: data }));
                    if (!newEntry.id) setEntry(prev => ({ ...prev, id: data.id }));
                }
            } else {
                saveLocalJournal(dateKey, { title: newEntry.title, content: newEntry.content });
                setAllEntries(getLocalJournals());
            }
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1000);
    }, [selectedDate, user, isPro, isFreeTierLimitReached, allEntries, supabase]);

    // --- Popups ---
    const handleEditorClick = () => {
        if (!user) { setModalMode('signup'); setIsSignUpModalOpen(true); return; }
        if (user && !isPro) {
            const todayStr = new Date().toDateString();
            if (localStorage.getItem('journal_upgrade_popup_last_shown') !== todayStr) {
                setModalMode('upgrade'); setIsSignUpModalOpen(true);
                localStorage.setItem('journal_upgrade_popup_last_shown', todayStr);
            }
        }
    };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDate); checkDate.setHours(0, 0, 0, 0);
    const isPastDate = checkDate < today;
    const isFutureDate = checkDate > today;

    const editorWrapperProps = !isPro ? { onClickCapture: handleEditorClick } : {};

    if (isLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2" /> Loading...</div>;

    const reducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

    return (
        <div className="min-h-screen w-full bg-gray-950 text-gray-100 font-sans flex flex-col">
            <SignUpModal isOpen={isSignUpModalOpen} setIsOpen={setIsSignUpModalOpen} mode={modalMode} />
            <JournalEntriesModal isOpen={isEntriesListOpen} setIsOpen={setIsEntriesListOpen} allEntries={allEntries} onSelectEntry={setSelectedDate} />

            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
                .animate-fade-in-left { animation: fadeInLeft 0.6s ease-out forwards; }
                ${reducedMotion ? `* { animation-duration: 0.01ms !important; }` : ''}
                [contenteditable]:focus { outline: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
                .prose p { margin-top: 0.5em; margin-bottom: 0.5em; }
                .prose h1, .prose h2 { margin-top: 1em; margin-bottom: 0.5em; }
           `}</style>

            <div className="flex flex-col flex-grow py-4 px-3 sm:px-6 md:px-8 lg:px-12 gap-5 max-w-[1920px] mx-auto w-full">

                {/* Header with Video Background */}
                <header className="flex-shrink-0 h-48 lg:h-56 relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
                        <source src="/video123.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/40 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-black/20 z-10"></div>

                    <Greeting greeting={greeting} username={user?.email?.split('@')[0] || 'Explorer'} />
                </header>

                {/* Mobile: Toggle Sidebar Button */}
                <div className="lg:hidden flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="bg-gray-800 border-gray-700 text-yellow-400 hover:text-yellow-300"
                    >
                        {isSidebarOpen ? <><PanelTopClose className="mr-2 h-4 w-4" /> Hide Tools</> : <><PanelTopOpen className="mr-2 h-4 w-4" /> Show Tools</>}
                    </Button>
                </div>

                <main className="flex-grow flex flex-col lg:flex-row gap-5 h-full">
                    {/* Sidebar (Collapsible on Mobile) */}
                    <aside className={cn(
                        "w-full lg:w-1/3 lg:max-w-xs flex-shrink-0 flex flex-col gap-5 transition-all duration-300 overflow-hidden",
                        isSidebarOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100 lg:w-1/3 lg:block hidden"
                    )}>
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-3">
                            <button onClick={() => setSelectedDate(new Date())} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold py-2.5 px-4 rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-md">
                                Today
                            </button>
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                            </div>
                        </div>
                        <Calendar onDateSelect={setSelectedDate} allEntries={allEntries} selectedDate={selectedDate} searchFilter={filteredEntryDays} />
                        <Prompt dailyStats={dailyStats} />

                        {/* Usage Status */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700">
                            {!user ? (
                                <div className="text-center">
                                    <h3 className="font-bold text-white mb-1">Journal Entries</h3>
                                    <p className="text-xs text-gray-400 mb-3">Sign in to save securely.</p>
                                    <Button asChild size="sm" className="w-full bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-bold">
                                        <Link href="/login">Sign In</Link>
                                    </Button>
                                </div>
                            ) : !isPro ? (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="font-medium text-white text-sm">Free Plan</Label>
                                        <span className="text-xs text-gray-400">{journalEntryCount} / 30 entries</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                                        <div className="bg-yellow-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(journalEntryCount / 30) * 100}%` }}></div>
                                    </div>
                                    <Button asChild size="sm" variant="outline" className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/10">
                                        <Link href="/landing">Upgrade to Unlimited</Link>
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Crown size={18} className="text-yellow-400" />
                                        <span className="font-bold text-white text-sm">Unlimited Access</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-black bg-yellow-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Editor Area */}
                    <div {...editorWrapperProps} className="flex-grow min-h-[500px] lg:h-auto">
                        <JournalEditor
                            entry={entry}
                            onEntryChange={handleEntryChange}
                            dailyStats={dailyStats}
                            isPastDate={isPastDate}
                            isFutureDate={isFutureDate}
                            isEditMode={isEditMode}
                            setIsEditMode={setIsEditMode}
                            isSavingDisabled={isFreeTierLimitReached && !allEntries[getDateKey(selectedDate)]}
                            entryCount={journalEntryCount}
                            onEntriesClick={() => setIsEntriesListOpen(true)}
                            saveStatus={saveStatus}
                            onNavigate={changeDate}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}