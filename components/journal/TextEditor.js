'use client';
import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
    Bold, Italic, List, Heading1, Heading2, Type as ParagraphIcon, 
    Loader2, Edit, Lock, History, Hourglass 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TextEditor = forwardRef(({ 
    entry, 
    onEntryChange, 
    isPastDate, 
    isFutureDate, 
    isEditMode, 
    setIsEditMode, 
    isSavingDisabled, 
    saveStatus, 
    isContentLoading 
}, ref) => {
    const editorRef = useRef(null);
    const [localTitle, setLocalTitle] = useState(entry?.title || '');
    const [activeFormats, setActiveFormats] = useState({
        bold: false, italic: false, list: false, h1: false, h2: false, p: false
    });
    const saveTimeoutRef = useRef(null);
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

    // --- Content Loading & Sync ---
    useEffect(() => {
        setLocalTitle(entry?.title || '');
    }, [entry?.title, entry?.date]);

    // THE REFRESH BUG FIX IS HERE
    useEffect(() => {
        if (!isContentLoading && editorRef.current && entry?.content !== undefined) {
            const currentHTML = editorRef.current.innerHTML;
            const currentText = editorRef.current.innerText.trim();
            const hasNoText = currentText.length === 0;
            const hasNoMedia = !currentHTML.includes('<img');
            
            // Logic: If editor is effectively empty (only ghost tags), overwrite it.
            if ((hasNoText && hasNoMedia) || currentHTML === entry.content) {
                if (editorRef.current.innerHTML !== entry.content) {
                    editorRef.current.innerHTML = entry.content;
                }
            }
        }
    }, [isContentLoading, entry?.content]);

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
        <section className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700">
            {/* Header / Title Area */}
            <div className="p-6 pb-2 shrink-0">
                <div className="flex flex-col gap-2">
                    <input
                        value={localTitle} 
                        onChange={handleTitleChange}
                        disabled={isLocked}
                        className="bg-transparent text-2xl md:text-3xl font-bold w-full focus:outline-none border-b-2 border-transparent focus:border-yellow-500 transition-all pb-1 disabled:opacity-70 placeholder:text-gray-600"
                        placeholder={isFutureDate ? "Time Capsule Title" : "Title your entry..."}
                    />
                    <div className="flex items-center justify-between h-6">
                        <div className="text-xs font-medium">
                            {saveStatus === 'saving' && <span className="text-yellow-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
                            {saveStatus === 'saved' && <span className="text-green-500 flex items-center gap-1">Saved</span>}
                        </div>
                        {/* Edit/Lock Controls */}
                        <div className="flex items-center gap-2">
                            {(isPastDate || isFutureDate) && !isEditMode && (
                                <Button onClick={() => setIsEditMode(true)} size="sm" variant="secondary" className="h-7 text-xs"><Edit size={12} className="mr-1"/> Edit</Button>
                            )}
                            {(isPastDate || isFutureDate) && isEditMode && (
                                <Button onClick={() => setIsEditMode(false)} size="sm" variant="outline" className="h-7 text-xs border-yellow-500 text-yellow-400"><Lock size={12} className="mr-1"/> Lock</Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-y border-gray-700 px-4 py-2 flex items-center gap-1 shrink-0 overflow-x-auto">
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.p && !activeFormats.h1)} onClick={() => formatDoc('formatBlock', 'p')}><ParagraphIcon size={16}/></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.bold)} onClick={() => formatDoc('bold')}><Bold size={16}/></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.italic)} onClick={() => formatDoc('italic')}><Italic size={16}/></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.list)} onClick={() => formatDoc('insertUnorderedList')}><List size={16}/></button>
                <div className="w-px h-5 bg-gray-700 mx-2"></div>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.h1)} onClick={() => formatDoc('formatBlock', 'h1')}><Heading1 size={16}/></button>
                <button onMouseDown={onToolbarMouseDown} className={getBtnClass(activeFormats.h2)} onClick={() => formatDoc('formatBlock', 'h2')}><Heading2 size={16}/></button>
            </div>

            {/* Editor Area */}
            <div className="flex-grow relative bg-gray-900/50">
                {isContentLoading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                    </div>
                )}
                
                {/* Empty State Overlays */}
                {isPastDate && isEmpty && !isEditMode && !isContentLoading && (
                    <div onClick={() => setIsEditMode(true)} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/60 cursor-pointer hover:bg-gray-900/50 group">
                        <History size={48} className="text-gray-600 group-hover:text-yellow-500 mb-2 transition-colors"/>
                        <p className="text-gray-400 group-hover:text-gray-200 font-medium">No entry recorded.</p>
                        <p className="text-sm text-yellow-500/50 group-hover:text-yellow-500">Click to write retrospectively</p>
                    </div>
                )}
                
                 {isFutureDate && isEmpty && !isEditMode && !isContentLoading && (
                    <div onClick={() => setIsEditMode(true)} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/60 cursor-pointer hover:bg-gray-900/50 group">
                        <Hourglass size={48} className="text-indigo-500 mb-2 transition-transform group-hover:scale-110"/>
                        <p className="text-indigo-200 font-bold">Time Capsule</p>
                    </div>
                )}

                <div
                    ref={editorRef}
                    contentEditable={!isLocked && !isContentLoading}
                    onInput={handleContentInput}
                    onMouseUp={handleSelectionChange}
                    onKeyUp={handleSelectionChange}
                    className={cn(
                        "prose prose-invert max-w-none w-full h-full overflow-y-auto p-6 focus:outline-none custom-scrollbar pb-20",
                        isLocked && "opacity-80 pointer-events-none select-none"
                    )}
                    placeholder="Write your thoughts..."
                />
            </div>
        </section>
    );
});

TextEditor.displayName = "TextEditor";
export default TextEditor;