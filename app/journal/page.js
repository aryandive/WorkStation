'use client';
import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { saveLocalJournal, getLocalJournals } from '@/lib/localJournal';
import { createClient } from '@/utils/supabase/client';
import eventBus from '@/lib/eventBus';
import {
    ChevronLeft, ChevronRight, RefreshCw, Bold, Italic, List, Heading1, Heading2, Search,
    Calendar as CalendarIcon, Type as ParagraphIcon, Bot, Lock, Edit, Zap, User, Star, Crown,
    LogIn, Save, Loader2, PanelTopClose, PanelTopOpen, ArrowLeft, ArrowRight, Hourglass, History, AlertTriangle, Home
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Ensure these are imported

// --- Constants ---
const HIGH_PERFORMANCE_PROMPTS = ["You had a great focus day! What was your secret?", "Biggest win today?", "How to carry this momentum to tomorrow?"];
const LOW_PERFORMANCE_PROMPTS = ["What blocked you today?", "Biggest distraction?", "One small change for tomorrow?"];
const GENERAL_PROMPTS = ["What are you grateful for?", "One thing you learned?", "Interesting problem solved?"];

/** Returns true if the entry has non-empty content (excludes ghost/empty entries). */
function hasRealContent(entry) {
    if (!entry || typeof entry.content !== 'string') return false;
    return entry.content.replace(/<[^>]*>/g, '').trim() !== '';
}

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
            const hasEntry = !!entryForDay; 

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

const JournalEditor = forwardRef(function JournalEditor({
    entry, onEntryChange, dailyStats, isPastDate, isFutureDate, isEditMode, setIsEditMode,
    isSavingDisabled, onEntriesClick, saveStatus, onNavigate, isContentLoading
}, ref) {
    const editorRef = useRef(null);
    const [localTitle, setLocalTitle] = useState(entry.title || '');
    const [activeFormats, setActiveFormats] = useState({
        bold: false, italic: false, list: false, h1: false, h2: false, p: false
    });
    const saveTimeoutRef = useRef(null);
    const latestForFlushRef = useRef({ title: entry.title || '', content: entry.content || '' });

    const isLocked = ((isPastDate || isFutureDate) && !isEditMode);
    const isEmpty = !entry.content || entry.content.replace(/<[^>]*>/g, '').trim() === '';

    const checkFormats = () => {
        if (!document) return;
        const getVal = (cmd) => document.queryCommandState(cmd);
        const getBlock = () => document.queryCommandValue('formatBlock');
        setActiveFormats({
            bold: getVal('bold'),
            italic: getVal('italic'),
            list: getVal('insertUnorderedList'),
            h1: getBlock() === 'h1',
            h2: getBlock() === 'h2',
            p: getBlock() === 'p' || getBlock() === 'div'
        });
    };

    const handleSelectionChange = () => { checkFormats(); };

    useEffect(() => {
        setLocalTitle(entry.title || '');
        if (editorRef.current) {
            editorRef.current.innerHTML = entry.content || '';
        }
        setActiveFormats({ bold: false, italic: false, list: false, h1: false, h2: false, p: false });
        // Intentionally only when date changes so we don't reset editor on every content/title update
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entry.date]);

    useEffect(() => {
        if (!isContentLoading && editorRef.current && entry.content) {
            if (editorRef.current.innerHTML.trim() === '') {
                editorRef.current.innerHTML = entry.content;
            }
        }
    }, [isContentLoading, entry.content]);

    const triggerSave = useCallback((newTitle, newContent) => {
        latestForFlushRef.current = { title: newTitle, content: newContent };
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            onEntryChange({ ...entry, title: newTitle, content: newContent });
        }, 500);
    }, [entry, onEntryChange]);

    const handleContentInput = (e) => {
        const content = e.currentTarget.innerHTML;
        latestForFlushRef.current = { ...latestForFlushRef.current, content };
        triggerSave(localTitle, content);
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setLocalTitle(title);
        latestForFlushRef.current = { ...latestForFlushRef.current, title };
        const content = editorRef.current ? editorRef.current.innerHTML : '';
        latestForFlushRef.current = { ...latestForFlushRef.current, content };
        triggerSave(title, content);
    };

    // Expose flush so parent can save current content before changing date
    useImperativeHandle(ref, () => ({
        flushSave: () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            const title = latestForFlushRef.current.title;
            const content = editorRef.current?.innerHTML ?? latestForFlushRef.current.content;
            if (title !== undefined || content !== undefined) {
                onEntryChange({ ...entry, title, content });
            }
        }
    }), [entry, onEntryChange]);

    useEffect(() => {
        latestForFlushRef.current = { title: localTitle, content: entry.content || (editorRef.current?.innerHTML ?? '') };
    }, [localTitle, entry.content]);

    const formatDoc = (command, value = null) => {
        if (command === 'formatBlock' && value) {
            const currentBlock = document.queryCommandValue('formatBlock');
            if (currentBlock === value) {
                document.execCommand('formatBlock', false, 'p');
            } else {
                document.execCommand(command, false, value);
            }
        } else {
            document.execCommand(command, false, value);
        }
        if (editorRef.current) editorRef.current.focus();
        checkFormats();
    };

    const onToolbarMouseDown = (e) => e.preventDefault();
    const getBtnClass = (isActive) => cn(
        "p-1.5 md:p-2 rounded-md transition-all disabled:opacity-30",
        isActive ? "bg-yellow-500 text-black shadow-inner" : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
    );

    return (
        <section className="flex-grow bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-xl border border-gray-700 animate-fade-in-left h-full">
            <div className="p-5 md:p-7 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 w-full">
                        <Button variant="ghost" size="icon" onClick={() => onNavigate(-1)} className="text-gray-400 hover:text-white shrink-0"><ChevronLeft /></Button>
                        <div className="relative flex-grow">
                            <input
                                value={localTitle} 
                                onChange={handleTitleChange}
                                disabled={isLocked}
                                className="bg-transparent text-xl md:text-3xl font-bold w-full focus:outline-none border-b-2 border-transparent focus:border-yellow-500 transition-all pb-1 disabled:opacity-70 placeholder:text-gray-600"
                                placeholder={isFutureDate ? "Time Capsule Title" : "Journal Entry Title"}
                            />
                            <div className="absolute right-0 top-0 md:top-2 text-xs font-medium flex items-center gap-1.5">
                                {saveStatus === 'saving' && <span className="text-yellow-500 flex items-center gap-1 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
                                {saveStatus === 'saved' && <span className="text-green-500 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1 duration-500"><Save className="w-3 h-3" /> Saved</span>}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onNavigate(1)} className="text-gray-400 hover:text-white shrink-0"><ChevronRight /></Button>
                    </div>

                    <div className="self-end md:self-auto shrink-0">
                        {!dailyStats.user ? (
                            <Button size="sm" asChild className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-9 px-4 rounded-full shadow-lg"><Link href="/login">Sign In</Link></Button>
                        ) : dailyStats.isPro ? (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg border-2 border-white/20" title="Pro User"><Crown className="text-black w-5 h-5" /></div>
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 border-2 border-yellow-500/50 shadow-lg" title="Experience User"><Star className="text-yellow-500 w-5 h-5" /></div>
                        )}
                    </div>
                </div>

                {isSavingDisabled && (
                    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                        <p className="font-bold text-yellow-300 text-sm">Journal Limit Reached</p>
                        <Button asChild size="sm" variant="link" className="text-yellow-200 h-auto p-0"><Link href="/landing">Upgrade to Pro</Link></Button>
                    </div>
                )}

                <div className="flex-shrink-0 flex items-center gap-4 mb-4 p-3 bg-black/30 rounded-xl backdrop-blur-sm border border-gray-700/50 overflow-x-auto">
                    <h3 className="font-bold text-gray-400 hidden sm:block text-sm uppercase tracking-wide">Daily Snapshot:</h3>
                    <div className="flex items-center gap-6 w-full justify-around sm:justify-start">
                        <ActivityRing percentage={dailyStats.entries.percentage} color="#38B2AC" value={dailyStats.entries.value} label="Entries" onClick={onEntriesClick} />
                        <ActivityRing percentage={dailyStats.tasks.percentage} color="#48BB78" value={dailyStats.tasks.value} label="Tasks" />
                        <ActivityRing percentage={dailyStats.sessions.percentage} color="#FBBF24" value={dailyStats.sessions.value} label="Focus" />
                    </div>
                </div>
            </div>

            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-y border-gray-700 px-5 py-2 flex items-center gap-1 shadow-md">
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.p && !activeFormats.h1 && !activeFormats.h2)} onClick={() => formatDoc('formatBlock', 'p')} aria-label="Paragraph"><ParagraphIcon size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.bold)} onClick={() => formatDoc('bold')} aria-label="Bold"><Bold size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.italic)} onClick={() => formatDoc('italic')} aria-label="Italic"><Italic size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.list)} onClick={() => formatDoc('insertUnorderedList')} aria-label="Bulleted List"><List size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.h1)} onClick={() => formatDoc('formatBlock', 'h1')} aria-label="Heading 1"><Heading1 size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.h2)} onClick={() => formatDoc('formatBlock', 'h2')} aria-label="Heading 2"><Heading2 size={16} /></button>
                <div className="ml-auto flex items-center gap-2">
                    {(isPastDate || isFutureDate) && !isEditMode && (
                        <Button onClick={() => setIsEditMode(true)} size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 h-8 text-xs" disabled={isSavingDisabled}><Edit size={14} className="mr-1" /> Edit</Button>
                    )}
                    {(isPastDate || isFutureDate) && isEditMode && (
                        <Button onClick={() => setIsEditMode(false)} size="sm" variant="outline" className="text-yellow-400 border-yellow-500 hover:bg-yellow-500/10 h-8 text-xs"><Lock size={14} className="mr-1" /> Lock</Button>
                    )}
                </div>
            </div>

            <div className="flex-grow relative bg-gray-900/50">
                {isContentLoading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" />
                            <span className="text-sm text-gray-300">Loading entry...</span>
                        </div>
                    </div>
                )}
                {isPastDate && isEmpty && !isEditMode && !isContentLoading && (
                    <div onClick={() => setIsEditMode(true)} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm cursor-pointer hover:bg-gray-900/50 transition-all group">
                        <div className="bg-gray-800 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform border border-gray-700 group-hover:border-yellow-500"><History size={32} className="text-gray-400 group-hover:text-yellow-400" /></div>
                        <p className="text-lg font-bold text-gray-200 group-hover:text-white">No entry recorded.</p>
                        <p className="text-sm text-gray-400 mt-1">Add a retrospective note? <span className="text-yellow-400 underline">Click to Edit</span></p>
                    </div>
                )}
                {isFutureDate && isEmpty && !isEditMode && !isContentLoading && (
                    <div onClick={() => setIsEditMode(true)} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-[2px] cursor-pointer hover:bg-gray-900/30 transition-all group">
                        <div className="bg-gray-800/80 p-4 rounded-full mb-3 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform"><Hourglass size={32} className="text-indigo-400" /></div>
                        <p className="text-lg font-bold text-indigo-200">Time Capsule</p>
                        <p className="text-sm text-indigo-300/80 mt-1">Write a note to your future self. <span className="text-white underline">Click to open.</span></p>
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable={!isLocked && !isContentLoading}
                    onInput={handleContentInput}
                    onMouseUp={handleSelectionChange}
                    onKeyUp={handleSelectionChange}
                    className={cn(
                        "prose prose-invert max-w-none w-full h-full overflow-y-auto custom-scrollbar p-6 leading-relaxed focus:outline-none",
                        isLocked ? 'opacity-80' : ''
                    )}
                    placeholder={isFutureDate ? "Dear Future Me..." : "Start writing here..."}
                ></div>
            </div>
        </section>
    );
});

// --- Main Journal Page ---
export default function JournalPage() {
    const { user, loading: authLoading } = useAuth();
    const { isPro, loading: subLoading } = useSubscription();
    const router = useRouter();
    const supabase = createClient();
    const [displayName, setDisplayName] = useState(''); 

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [entry, setEntry] = useState({ id: null, date: null, title: '', content: '' });
    const [allEntries, setAllEntries] = useState({});
    const [greeting, setGreeting] = useState('');

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isContentLoading, setIsContentLoading] = useState(false);

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

    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('signup');
    const [hasCheckedMigration, setHasCheckedMigration] = useState(false);
    const [isEntriesListOpen, setIsEntriesListOpen] = useState(false);

    // Phase 4: Data Risk Popup
    const [isDataRiskModalOpen, setIsDataRiskModalOpen] = useState(false);

    const editorRef = useRef(null);
    const entryRef = useRef(entry);
    entryRef.current = entry;

    const getDateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const journalEntryCount = Object.keys(allEntries).length;
    const isFreeTierLimitReached = !isPro && journalEntryCount >= 30;
    const isLoading = authLoading || subLoading;

    const changeDate = (days) => {
        editorRef.current?.flushSave?.();
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const safeSetSelectedDate = (date) => {
        editorRef.current?.flushSave?.();
        setSelectedDate(date);
    };

    const fetchJournalEntries = useCallback(async () => {
        if (isLoading) return;

        // PHASE 4 LOGIC: If User is logged in but NOT Pro, treat as local storage for fetching.
        if (user && isPro) {
            const { data, error } = await supabase.from('journal_entries').select('id, date, title, user_id').eq('user_id', user.id);
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
            // Free User or Anonymous -> Use Local Storage
            setAllEntries(getLocalJournals());
        }
    }, [user, isPro, isLoading, supabase]);

    const fetchEntryContent = useCallback(async (dateKey) => {
        // Only fetch from server if Pro. 
        if (!user || !isPro) return null;
        const [y, m, d] = dateKey.split('-').map(Number);
        const isoDate = new Date(y, m - 1, d).toISOString().split('T')[0];

        const { data, error } = await supabase.from('journal_entries').select('content').eq('user_id', user.id).eq('date', isoDate).single();
        if (error) return null;
        return data.content;
    }, [user, isPro, supabase]);

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

    useEffect(() => {
        if (user) {
            const fetchProfileName = async () => {
                const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
                if (data?.display_name) { setDisplayName(data.display_name); }
            };
            fetchProfileName();
        }
    }, [user, supabase]);

    useEffect(() => {
        const hour = new Date().getHours();
        setGreeting(hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening');
        fetchDailyStats();
        eventBus.on('tasksUpdated', fetchDailyStats);
        return () => eventBus.remove('tasksUpdated', fetchDailyStats);
    }, [fetchDailyStats]);

    useEffect(() => {
        const count = Object.keys(allEntries).length;
        const limit = isPro ? 365 : 30;
        const percentage = Math.min(100, (count / limit) * 100);
        setDailyStats(prev => ({ ...prev, entries: { percentage, value: `${count}/${limit}`, limit } }));
    }, [allEntries, isPro]);

    useEffect(() => { fetchJournalEntries(); }, [fetchJournalEntries]);

    // Phase 4: Data Risk Popup Logic
    useEffect(() => {
        if (user && !isPro && !isLoading) {
            const lastWarned = localStorage.getItem('journal_data_risk_popup_last_shown');
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            
            if (!lastWarned || (now - parseInt(lastWarned)) > oneDay) {
                 // Check if there is actually data to lose
                 if (Object.keys(getLocalJournals()).length > 0) {
                     setIsDataRiskModalOpen(true);
                     localStorage.setItem('journal_data_risk_popup_last_shown', now.toString());
                 }
            }
        }
    }, [user, isPro, isLoading]);


    // Migration Logic (Keep existing)
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

    // Load Content Logic (with Ghost Dot Fix)
    useEffect(() => {
        const dateKey = getDateKey(selectedDate);
        const cachedEntry = allEntries[dateKey];
        const defaultTitle = selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const updateEntryState = (entryData) => {
             setEntry({
                id: entryData?.id || null,
                date: dateKey,
                title: entryData?.title || defaultTitle,
                content: entryData?.content || '' 
            });
        };

        const loadContent = async () => {
            if (cachedEntry && typeof cachedEntry.content !== 'undefined') {
                updateEntryState(cachedEntry);
                return;
            }
            if (cachedEntry && user && isPro) {
                const currentEntry = entryRef.current;
                const isSameDate = currentEntry.date === dateKey;
                const hasContentAlready = currentEntry.content && currentEntry.content.replace(/<[^>]*>/g, '').trim() !== '';
                // Don't re-fetch or clear when re-opening same date with content (prevents overwriting unsaved or current content)
                if (isSameDate && hasContentAlready) {
                    updateEntryState(currentEntry);
                    return;
                }
                setIsContentLoading(true);
                if (!isSameDate) updateEntryState({ ...cachedEntry, content: '' });

                const content = await fetchEntryContent(dateKey);
                setIsContentLoading(false);

                // GHOST: If fetched content is empty, remove from cache so count/dots stay correct.
                if (!content || content.trim() === '') {
                     setAllEntries(prev => {
                        const copy = { ...prev };
                        delete copy[dateKey];
                        return copy;
                     });
                     updateEntryState(null);
                } else {
                    const fullEntry = { ...cachedEntry, content: content };
                    setAllEntries(prev => ({ ...prev, [dateKey]: fullEntry }));
                    updateEntryState(fullEntry);
                }
                return;
            }
            updateEntryState(null);
        };
        loadContent();
    }, [selectedDate, allEntries, fetchEntryContent, user, isPro]);

    useEffect(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const check = new Date(selectedDate); check.setHours(0, 0, 0, 0);
        setIsEditMode(check.getTime() === today.getTime());
    }, [selectedDate]);

    useEffect(() => {
        if (!searchQuery.trim()) { setFilteredEntryDays(null); return; }
        const filtered = Object.entries(allEntries)
            .filter(([, v]) => v.title?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(([k]) => k);
        setFilteredEntryDays(filtered);
    }, [searchQuery, allEntries]);

    // Saving Logic (With Phase 4 Checks)
    const handleEntryChange = useCallback(async (newEntry) => {
        setSaveStatus('saving');

        const dateKey = getDateKey(selectedDate);
        const strippedContent = newEntry.content ? newEntry.content.replace(/<[^>]*>/g, '').trim() : '';
        const isEmpty = strippedContent.length === 0;

        if (isFreeTierLimitReached && !allEntries[dateKey] && !isEmpty) {
            setSaveStatus('error');
            return;
        }

        // PHASE 4: Only save to Cloud if User AND Pro. Otherwise Local.
        if (user && isPro) {
            if (isEmpty && newEntry.id) {
                await supabase.from('journal_entries').delete().eq('id', newEntry.id);
                setAllEntries(prev => {
                    const copy = { ...prev };
                    delete copy[dateKey];
                    return copy;
                });
                setEntry(prev => ({...prev, id: null}));
            } else if (!isEmpty) {
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
            }
        } else {
            // Local Storage Logic (For Free Users & Anonymous)
            if (isEmpty) {
                const allJournals = getLocalJournals();
                delete allJournals[dateKey];
                localStorage.setItem('ws_journal_entries', JSON.stringify(allJournals));
                setAllEntries(allJournals);
            } else {
                saveLocalJournal(dateKey, { title: newEntry.title, content: newEntry.content });
                setAllEntries(getLocalJournals());
            }
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, [selectedDate, user, isPro, isFreeTierLimitReached, allEntries, supabase]);

    const handleEditorClick = () => {
        if (!user) { setModalMode('signup'); setIsSignUpModalOpen(true); return; }
        if (user && !isPro) {
            // Logic handled by Data Risk Popup, but we can still show upgrade nudge if they hit limits
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
            <JournalEntriesModal isOpen={isEntriesListOpen} setIsOpen={setIsEntriesListOpen} allEntries={allEntries} onSelectEntry={safeSetSelectedDate} />
            
            {/* Phase 4: Data Risk Modal */}
             <Dialog open={isDataRiskModalOpen} onOpenChange={setIsDataRiskModalOpen}>
                <DialogContent className="bg-gray-900 border-yellow-600 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-yellow-500"><AlertTriangle className="w-5 h-5"/> Data Warning</DialogTitle>
                        <DialogDescription className="text-gray-300">
                            You are on the <strong>Free Plan</strong>. Your journal entries are stored <strong>locally on this device</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-700/50 text-sm text-yellow-200">
                        <p>If you clear your browser history or cookies, <strong>you will lose your data forever.</strong></p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                         <Button variant="ghost" onClick={() => setIsDataRiskModalOpen(false)}>I Understand</Button>
                         <Button className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold" asChild>
                            <Link href="/landing">Secure My Data (Upgrade)</Link>
                         </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

                <header className="flex-shrink-0 h-48 lg:h-56 relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                    <div className="absolute inset-0 w-full h-full z-0">
                         <Image 
                            src="/video123.webm" 
                            alt="Immersive Background" 
                            fill 
                            className="object-cover" 
                            priority
                            unoptimized 
                         />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/40 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-black/20 z-10"></div>

                    <div className="absolute top-4 right-4 z-20">
                        <Button asChild variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg">
                            <Link href="/" className="flex items-center gap-2">
                                <Home className="w-4 h-4" /> Home
                            </Link>
                        </Button>
                    </div>
                    <Greeting
                        greeting={greeting}
                        username={displayName || user?.email?.split('@')[0] || 'Explorer'}
                    />
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
                    <aside className={cn(
                        "w-full lg:w-1/3 lg:max-w-xs flex-shrink-0 flex flex-col gap-5 transition-all duration-300 overflow-hidden",
                        isSidebarOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100 lg:w-1/3 lg:block hidden"
                    )}>
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-3">
                            <button onClick={() => safeSetSelectedDate(new Date())} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold py-2.5 px-4 rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-md">
                                Today
                            </button>
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                            </div>
                        </div>
                        <Calendar onDateSelect={safeSetSelectedDate} allEntries={allEntries} selectedDate={selectedDate} searchFilter={filteredEntryDays} />
                        <Prompt dailyStats={dailyStats} />

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

                    <div {...editorWrapperProps} className="flex-grow min-h-[500px] lg:h-auto">
                        <JournalEditor
                            ref={editorRef}
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
                            isContentLoading={isContentLoading}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}