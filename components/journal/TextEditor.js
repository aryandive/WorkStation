'use client';
import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    Bold, Italic, List, Heading1, Heading2, Type as ParagraphIcon,
    Loader2, Edit, Lock, History, Hourglass, Save,
    ChevronLeft, ChevronRight, Crown, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityRings from './ActivityRings';
import { PremiumGate } from '@/components/system/PremiumGate';

const TextEditor = forwardRef(({
    entry,
    onEntryChange,
    dailyStats,
    isPro,
    user,
    isPastDate,
    isFutureDate,
    isEditMode,
    setIsEditMode,
    isSavingDisabled,
    saveStatus,
    isContentLoading,
    onNavigate,
    onEntriesClick,
    onSnapshotClick
}, ref) => {
    const editorRef = useRef(null);
    const [localTitle, setLocalTitle] = useState(entry?.title || '');
    const [activeFormats, setActiveFormats] = useState({
        bold: false, italic: false, list: false, h1: false, h2: false, p: false
    });
    const saveTimeoutRef = useRef(null);
    // Track the latest content for flush saves
    const latestForFlushRef = useRef({ title: entry?.title || '', content: entry?.content || '' });

    const isLocked = ((isPastDate || isFutureDate) && !isEditMode);
    const isEmpty = !entry?.content || entry.content.replace(/<[^>]*>/g, '').trim() === '';

    // --- Format Check Logic ---
    const checkFormats = () => {
        if (typeof document === 'undefined') return;
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
    const onToolbarMouseDown = (e) => e.preventDefault();
    const getBtnClass = (isActive) => cn(
        "p-1.5 md:p-2 rounded-md transition-all disabled:opacity-30",
        isActive ? "bg-yellow-500 text-black shadow-inner" : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
    );

    // --- CRITICAL FIX: Strict Reset on Date Change ---
    useEffect(() => {
        // When the date changes, we MUST reset the internal state immediately.
        setLocalTitle(entry?.title || '');

        if (editorRef.current) {
            // Force overwrite the editor content with the new entry's content (or empty string)
            editorRef.current.innerHTML = entry?.content || '';
        }

        // Update the ref so we don't accidentally save the OLD content to the NEW date
        latestForFlushRef.current = { title: entry?.title || '', content: entry?.content || '' };

        // Reset formats
        setActiveFormats({ bold: false, italic: false, list: false, h1: false, h2: false, p: false });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entry?.date]); // Dependency: Only run when DATE changes

    // --- Ghost Text / Async Load Fix ---
    useEffect(() => {
        // This effect runs when content finishes loading asynchronously (for the SAME date)
        if (!isContentLoading && editorRef.current && entry?.content !== undefined) {
            const currentHTML = editorRef.current.innerHTML;
            const currentText = editorRef.current.innerText.trim();
            const hasNoText = currentText.length === 0;
            const hasNoMedia = !currentHTML.includes('<img');

            // Safety: Only overwrite if editor is effectively empty OR if content matches exactly
            // This prevents overwriting user's typing if they started before load finished
            if ((hasNoText && hasNoMedia) || currentHTML === entry.content) {
                if (editorRef.current.innerHTML !== entry.content) {
                    editorRef.current.innerHTML = entry.content;
                }
            }
        }
    }, [isContentLoading, entry?.content]); // Dependency: Loading state or content updates

    useEffect(() => {
        // If we are saving or just typed (local title diff/content diff), we are 'dirty'
        // leveraging the existing saveStatus prop is the most reliable way.
        const isUnsaved = saveStatus === 'saving' || saveStatus === 'unsaved';

        const event = new CustomEvent('sys-journal-status', {
            detail: { isUnsaved }
        });
        window.dispatchEvent(event);
    }, [saveStatus]);

    // --- Saving Logic ---
    const triggerSave = useCallback((newTitle, newContent) => {
        latestForFlushRef.current = { title: newTitle, content: newContent };
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            onEntryChange({ ...entry, title: newTitle, content: newContent });
        }, 500);
    }, [entry, onEntryChange]);

    const handleContentInput = (e) => {
        const content = e.currentTarget.innerHTML;
        latestForFlushRef.current.content = content;
        triggerSave(localTitle, content);
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setLocalTitle(title);
        const content = editorRef.current ? editorRef.current.innerHTML : '';
        triggerSave(title, content);
    };

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

    const formatDoc = (command, value = null) => {
        if (command === 'formatBlock' && value) {
            const currentBlock = document.queryCommandValue('formatBlock');
            document.execCommand(command, false, currentBlock === value ? 'p' : value);
        } else {
            document.execCommand(command, false, value);
        }
        editorRef.current?.focus();
        checkFormats();
    };

    return (
        <section className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 animate-fade-in-left">
            {/* Header Area */}
            <div className="p-5 md:p-7 pb-2 shrink-0">
                {/* Title & Navigation Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 w-full">
                        <Button variant="ghost" size="icon" onClick={() => onNavigate(-1)} className="text-gray-400 hover:text-white shrink-0">
                            <ChevronLeft />
                        </Button>
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
                        <Button variant="ghost" size="icon" onClick={() => onNavigate(1)} className="text-gray-400 hover:text-white shrink-0">
                            <ChevronRight />
                        </Button>
                    </div>

                    {/* Pro / Auth Badge */}
                    <div className="self-end md:self-auto shrink-0">
                        {!user ? (
                            <Button size="sm" asChild className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-9 px-4 rounded-full shadow-lg">
                                <Link href="/login">Sign In</Link>
                            </Button>
                        ) : isPro ? (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg border-2 border-white/20" title="Pro User">
                                <Crown className="text-black w-5 h-5" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 border-2 border-yellow-500/50 shadow-lg" title="Free User">
                                <Star className="text-yellow-500 w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Limit Reached Warning */}
                {isSavingDisabled && (
                    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                        <p className="font-bold text-yellow-300 text-sm">Journal Limit Reached</p>
                        <Button asChild size="sm" variant="link" className="text-yellow-200 h-auto p-0">
                            <Link href="/landing">Upgrade to Pro</Link>
                        </Button>
                    </div>
                )}

                {/* Activity Rings Integration */}
                <PremiumGate featureKey="journal_insights" requiredTier={2} lockClassName="absolute -top-2 -right-2">
                    <div onClick={onSnapshotClick} className="cursor-pointer">
                        <ActivityRings stats={dailyStats} onEntriesClick={(e) => { e.stopPropagation(); onEntriesClick(); }} />
                    </div>
                </PremiumGate>
            </div>

            {/* Formatting Toolbar */}
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-y border-gray-700 px-5 py-2 flex items-center gap-1 shadow-md shrink-0 overflow-x-auto">
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.p && !activeFormats.h1)} onClick={() => formatDoc('formatBlock', 'p')} aria-label="Paragraph"><ParagraphIcon size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.bold)} onClick={() => formatDoc('bold')} aria-label="Bold"><Bold size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.italic)} onClick={() => formatDoc('italic')} aria-label="Italic"><Italic size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.list)} onClick={() => formatDoc('insertUnorderedList')} aria-label="Bulleted List"><List size={16} /></button>
                <div className="w-px h-5 bg-gray-700 mx-2 hidden md:block"></div>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.h1)} onClick={() => formatDoc('formatBlock', 'h1')} aria-label="Heading 1"><Heading1 size={16} /></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.h2)} onClick={() => formatDoc('formatBlock', 'h2')} aria-label="Heading 2"><Heading2 size={16} /></button>

                <div className="ml-auto flex items-center gap-2">
                    {(isPastDate || isFutureDate) && !isEditMode && (
                        <Button onClick={() => setIsEditMode(true)} size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 h-8 text-xs" disabled={isSavingDisabled}>
                            <Edit size={14} className="mr-1" /> Edit
                        </Button>
                    )}
                    {(isPastDate || isFutureDate) && isEditMode && (
                        <Button onClick={() => setIsEditMode(false)} size="sm" variant="outline" className="text-yellow-400 border-yellow-500 hover:bg-yellow-500/10 h-8 text-xs">
                            <Lock size={14} className="mr-1" /> Lock
                        </Button>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-grow relative bg-gray-900/50">
                {isContentLoading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-2" />
                            <span className="text-sm text-gray-300">Loading entry...</span>
                        </div>
                    </div>
                )}

                {/* Past Date Empty State */}
                {isPastDate && isEmpty && !isEditMode && !isContentLoading && (
                    <div onClick={() => setIsEditMode(true)} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm cursor-pointer hover:bg-gray-900/50 transition-all group">
                        <div className="bg-gray-800 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform border border-gray-700 group-hover:border-yellow-500">
                            <History size={32} className="text-gray-400 group-hover:text-yellow-400" />
                        </div>
                        <p className="text-lg font-bold text-gray-200 group-hover:text-white">No entry recorded.</p>
                        <p className="text-sm text-gray-400 mt-1">Add a retrospective note? <span className="text-yellow-400 underline">Click to Edit</span></p>
                    </div>
                )}

                {/* Future Date Empty State */}
                {isFutureDate && isEmpty && !isEditMode && !isContentLoading && (
                    <div onClick={() => setIsEditMode(true)} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-[2px] cursor-pointer hover:bg-gray-900/30 transition-all group">
                        <div className="bg-gray-800/80 p-4 rounded-full mb-3 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform">
                            <Hourglass size={32} className="text-indigo-400" />
                        </div>
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
                    onFocus={(e) => {
                        // iOS virtual keyboard safety: scroll cursor into view when keyboard raises
                        requestAnimationFrame(() => {
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        });
                    }}
                    className={cn(
                        // pb-[50vh] gives the cursor room to breathe above the iOS virtual keyboard.
                        // Desktop: overflow-y-auto already limits scroll to section height, no visual change.
                        "prose prose-invert max-w-none w-full h-full overflow-y-auto custom-scrollbar p-6 leading-relaxed focus:outline-none pb-[50vh]",
                        isLocked ? 'opacity-80' : ''
                    )}
                    placeholder={isFutureDate ? "Dear Future Me..." : "Start writing here..."}
                ></div>
            </div>
        </section>
    );
});

TextEditor.displayName = "TextEditor";
export default TextEditor;