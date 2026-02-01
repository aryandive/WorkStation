'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Icons & UI ---
import { 
    Search, Loader2, PanelTopClose, PanelTopOpen, AlertTriangle, Home, Crown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from "@/lib/utils";

// --- Logic & Data ---
import { saveLocalJournal, getLocalJournals } from '@/lib/localJournal';
import { createClient } from '@/utils/supabase/client';
import eventBus from '@/lib/eventBus';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

// --- Components ---
import Greeting from '@/components/journal/Greeting';
import ActivityRings from '@/components/journal/ActivityRings';
import ReflectivePrompt from '@/components/journal/ReflectivePrompt';
import JournalCalendar from '@/components/journal/JournalCalendar';
import TextEditor from '@/components/journal/TextEditor';
import SignUpModal from '@/components/auth/SignUpModal';
import JournalEntriesModal from '@/components/journal/JournalEntriesModal';

export default function JournalPage() {
    // --- Auth & Data State ---
    const { user, loading: authLoading } = useAuth();
    const { isPro, loading: subLoading } = useSubscription();
    const router = useRouter();
    const supabase = createClient();
    
    // --- UI State ---
    const [greeting, setGreeting] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [displayName, setDisplayName] = useState(''); 
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('signup');
    const [isEntriesListOpen, setIsEntriesListOpen] = useState(false);
    const [isDataRiskModalOpen, setIsDataRiskModalOpen] = useState(false);
    
    // --- Journal State ---
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [entry, setEntry] = useState({ id: null, date: null, title: '', content: '' });
    const [allEntries, setAllEntries] = useState({});
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isContentLoading, setIsContentLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // --- Search State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEntryDays, setFilteredEntryDays] = useState(null);

    // --- Stats State ---
    const [dailyStats, setDailyStats] = useState({
        entries: { percentage: 0, value: '0/0', limit: 30 },
        tasks: { percentage: 0, value: '0/0' },
        sessions: { percentage: 0, value: '0/0' },
        user: null,
        isPro: false
    });

    // Refs
    const editorRef = useRef(null);
    const entryRef = useRef(entry);
    entryRef.current = entry;

    // --- Helpers ---
    const getDateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const journalEntryCount = Object.keys(allEntries).length;
    const isFreeTierLimitReached = !isPro && journalEntryCount >= 30;
    const isLoading = authLoading || subLoading;
    const reducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

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

    // --- Data Fetching ---
    const fetchJournalEntries = useCallback(async () => {
        if (isLoading) return;
        if (user && isPro) {
            const { data, error } = await supabase.from('journal_entries').select('id, date, title, user_id').eq('user_id', user.id);
            if (error) { console.error("Error fetching journal entries:", error); setAllEntries({}); }
            else {
                const entriesMap = data.reduce((acc, entry) => {
                    const dateStr = entry.date.includes('T') ? entry.date.split('T')[0] : entry.date;
                    const [y, m, d] = dateStr.split('-').map(Number);
                    acc[`${y}-${m}-${d}`] = entry;
                    return acc;
                }, {});
                setAllEntries(entriesMap);
            }
        } else {
            setAllEntries(getLocalJournals());
        }
    }, [user, isPro, isLoading, supabase]);

    const fetchEntryContent = useCallback(async (dateKey) => {
        if (!user || !isPro) return null;
        const [y, m, d] = dateKey.split('-').map(Number);
        const isoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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

    // --- Effects ---
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

    // Risk Popup Logic
    useEffect(() => {
        if (user && !isPro && !isLoading) {
            const lastWarned = localStorage.getItem('journal_data_risk_popup_last_shown');
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (!lastWarned || (now - parseInt(lastWarned)) > oneDay) {
                 if (Object.keys(getLocalJournals()).length > 0) {
                     setIsDataRiskModalOpen(true);
                     localStorage.setItem('journal_data_risk_popup_last_shown', now.toString());
                 }
            }
        }
    }, [user, isPro, isLoading]);

    // Load Content Logic
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
                
                if (isSameDate && hasContentAlready) {
                    updateEntryState(currentEntry);
                    return;
                }
                setIsContentLoading(true);
                if (!isSameDate) updateEntryState({ ...cachedEntry, content: '' });

                const content = await fetchEntryContent(dateKey);
                setIsContentLoading(false);

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

    // Saving Logic
    const handleEntryChange = useCallback(async (newEntry) => {
        setSaveStatus('saving');
        const dateKey = getDateKey(selectedDate);
        const strippedContent = newEntry.content ? newEntry.content.replace(/<[^>]*>/g, '').trim() : '';
        const isEmpty = strippedContent.length === 0;

        if (isFreeTierLimitReached && !allEntries[dateKey] && !isEmpty) {
            setSaveStatus('error');
            return;
        }

        if (user && isPro) {
            if (isEmpty && newEntry.id) {
                await supabase.from('journal_entries').delete().eq('id', newEntry.id);
                setAllEntries(prev => { const copy = { ...prev }; delete copy[dateKey]; return copy; });
                setEntry(prev => ({...prev, id: null}));
            } else if (!isEmpty) {
                const y = selectedDate.getFullYear();
                const m = selectedDate.getMonth() + 1;
                const d = selectedDate.getDate();
                const isoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const payload = { user_id: user.id, date: isoDate, title: newEntry.title, content: newEntry.content };
                if (newEntry.id) payload.id = newEntry.id;
                
                const { data } = await supabase.from('journal_entries').upsert(payload, { onConflict: 'user_id, date' }).select().single();
                if (data) {
                    setAllEntries(prev => ({ ...prev, [dateKey]: data }));
                    if (!newEntry.id) setEntry(prev => ({ ...prev, id: data.id }));
                }
            }
        } else {
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
        if (!user) { setModalMode('signup'); setIsSignUpModalOpen(true); }
    };

    if (isLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDate); checkDate.setHours(0, 0, 0, 0);
    const isPastDate = checkDate < today;
    const isFutureDate = checkDate > today;
    const editorWrapperProps = !isPro ? { onClickCapture: handleEditorClick } : {};

    return (
        <div className="min-h-screen w-full bg-gray-950 text-gray-100 font-sans flex flex-col">
            <SignUpModal isOpen={isSignUpModalOpen} setIsOpen={setIsSignUpModalOpen} mode={modalMode} />
            <JournalEntriesModal isOpen={isEntriesListOpen} setIsOpen={setIsEntriesListOpen} allEntries={allEntries} onSelectEntry={safeSetSelectedDate} />
            
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
                        <video src="/video123.webm" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" aria-hidden />
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
                    <Greeting greeting={greeting} username={displayName || user?.email?.split('@')[0] || 'Explorer'} />
                </header>

                <div className="lg:hidden flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-gray-800 border-gray-700 text-yellow-400 hover:text-yellow-300">
                        {isSidebarOpen ? <><PanelTopClose className="mr-2 h-4 w-4" /> Hide Tools</> : <><PanelTopOpen className="mr-2 h-4 w-4" /> Show Tools</>}
                    </Button>
                </div>

                <main className="flex-grow flex flex-col lg:flex-row gap-5 h-full">
                    <aside className={cn("w-full lg:w-1/3 lg:max-w-xs flex-shrink-0 flex flex-col gap-5 transition-all duration-300 overflow-hidden", isSidebarOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100 lg:w-1/3 lg:block hidden")}>
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700 flex items-center gap-3">
                            <button onClick={() => safeSetSelectedDate(new Date())} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold py-2.5 px-4 rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-md">Today</button>
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all" />
                            </div>
                        </div>
                        
                        <JournalCalendar onDateSelect={safeSetSelectedDate} allEntries={allEntries} selectedDate={selectedDate} searchFilter={filteredEntryDays} />
                        <ReflectivePrompt dailyStats={dailyStats} />

                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700">
                            {!user ? (
                                <div className="text-center">
                                    <h3 className="font-bold text-white mb-1">Journal Entries</h3>
                                    <p className="text-xs text-gray-400 mb-3">Sign in to save securely.</p>
                                    <Button asChild size="sm" className="w-full bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-bold"><Link href="/login">Sign In</Link></Button>
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
                                    <Button asChild size="sm" variant="outline" className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"><Link href="/landing">Upgrade to Unlimited</Link></Button>
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
                        <TextEditor
                            ref={editorRef}
                            entry={entry}
                            onEntryChange={handleEntryChange}
                            dailyStats={dailyStats}
                            isPro={isPro}
                            user={user}
                            isPastDate={isPastDate}
                            isFutureDate={isFutureDate}
                            isEditMode={isEditMode}
                            setIsEditMode={setIsEditMode}
                            isSavingDisabled={isFreeTierLimitReached && !allEntries[getDateKey(selectedDate)]}
                            saveStatus={saveStatus}
                            onNavigate={changeDate}
                            isContentLoading={isContentLoading}
                            onEntriesClick={() => setIsEntriesListOpen(true)}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}