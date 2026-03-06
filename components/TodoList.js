'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format } from "date-fns";
import eventBus from '@/lib/eventBus';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Calendar as CalendarIcon,
    Trash2,
    Plus,
    Flag,
    MoreVertical,
    Folder,
    ListPlus,
    X,
    Clock,
    NotebookPen,
    Target,
    CheckCircle,
    Layers,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useAccess } from '@/hooks/useAccess';
import { useAuth } from '@/context/AuthContext';
import { PremiumGate } from '@/components/system/PremiumGate';

export default function TodoList({ isOpen, setIsOpen, onTaskTimeUpdateRef }) {
    const { maxProjects, getCurrentTier } = useAccess();
    const { openSignUpModal } = useAuth();
    const userTier = getCurrentTier();
    const [projects, setProjects] = useState([]);
    const isAtLimit = projects.length >= maxProjects;
    const [tasks, setTasks] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [newTaskText, setNewTaskText] = useState('');
    const [newProjectName, setNewProjectName] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isAutoJournalingEnabled, setIsAutoJournalingEnabled] = useState(true);

    const [supabase] = useState(() => createClient());
    const completionSoundRef = useRef(null);

    // STEP C: Ref to track last fetch time for caching
    const lastFetchTimeRef = useRef(0);

    useEffect(() => {
        if (isOpen) {
            completionSoundRef.current = new Audio('/sounds/ting.mp3');
        }
    }, [isOpen]);

    const playCompletionSound = () => {
        if (completionSoundRef.current) {
            completionSoundRef.current.currentTime = 0;
            completionSoundRef.current.play().catch(error => {
                console.error("Error playing sound:", error);
            });
        }
    };

    const fetchData = useCallback(async (currentUser) => {
        // STEP C: Prevent Re-fetching if data is fresh (< 5 mins) and exists
        const now = Date.now();
        if (currentUser && tasks.length > 0 && (now - lastFetchTimeRef.current < 5 * 60 * 1000)) {
            setLoading(false);
            return;
        }

        setLoading(true);
        if (currentUser) {
            // FIX 1: Filter out soft-deleted projects
            const { data: projectsData, error: projError } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', currentUser.id)
                .is('deleted_at', null);

            if (projError) console.error("Error fetching projects:", projError);

            let pData = projectsData || [];

            // Tier 1 Seeding (Append 2 if exactly the 3 dummy ones)
            if (pData.length === 3) {
                const names = pData.map(p => p.name);
                if (names.includes('Work') && names.includes('Personal') && names.includes('Groceries')) {
                    const { data: insertedData, error: insertError } = await supabase
                        .from('projects')
                        .insert([
                            { name: 'Side Hustle', user_id: currentUser.id },
                            { name: 'Fitness', user_id: currentUser.id }
                        ])
                        .select();
                    if (!insertError && insertedData) {
                        pData = [...pData, ...insertedData];
                    }
                }
            }

            // STEP A: Performance Boost - Only fetch Active tasks OR recently completed (7 days)
            // This prevents loading thousands of historical tasks every time.
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const isoDate = sevenDaysAgo.toISOString();

            const { data: tasksData, error: taskError } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', currentUser.id)
                .or(`is_complete.eq.false,updated_at.gt.${isoDate}`);

            if (taskError) console.error("Error fetching tasks:", taskError);

            setProjects(pData);
            setTasks(tasksData || []);

            if (pData.length > 0 && !activeProjectId) {
                // Keep current selection if valid, else select first
                if (!activeProjectId || !pData.find(p => p.id === activeProjectId)) {
                    setActiveProjectId(pData[0].id);
                }
            } else if (pData.length === 0) {
                setActiveProjectId(null);
            }

            // Update cache timestamp on successful fetch
            lastFetchTimeRef.current = Date.now();
        } else {
            let localProjects = JSON.parse(localStorage.getItem('ws_projects'));
            // Tier 0 Seeding: 3 dummy projects
            if (!localProjects || localProjects.length === 0 || localProjects[0].id === 'local_default') {
                localProjects = [
                    { id: `local_work_${Date.now()}`, name: 'Work', created_at: new Date().toISOString() },
                    { id: `local_personal_${Date.now() + 1}`, name: 'Personal', created_at: new Date().toISOString() },
                    { id: `local_groceries_${Date.now() + 2}`, name: 'Groceries', created_at: new Date().toISOString() }
                ];
            }
            const localTasks = JSON.parse(localStorage.getItem('ws_tasks')) || [];

            setProjects(localProjects);
            setTasks(localTasks);

            if (localProjects.length > 0 && (!activeProjectId || !localProjects.find(p => p.id === activeProjectId))) {
                setActiveProjectId(localProjects[0].id);
            }
        }
        setLoading(false);
    }, [activeProjectId, supabase, tasks.length]); // Dependencies

    const updateTask = useCallback(async (taskId, updates) => {
        const originalTasks = [...tasks];
        const taskToUpdate = originalTasks.find(t => t.id === taskId);
        const updatedTask = { ...taskToUpdate, ...updates };

        if (updates.is_complete && !taskToUpdate.is_complete) {
            playCompletionSound();
        }

        // Optimistic UI Update
        setTasks(currentTasks => currentTasks.map(t => t.id === taskId ? updatedTask : t));
        eventBus.dispatch('tasksUpdated');

        if (user) {
            // FIX 2: Restored correct Task Update logic
            const { error } = await supabase.from('todos').update(updates).eq('id', taskId);

            if (error) {
                console.error("Error updating task:", error);
                setTasks(originalTasks); // Revert on error
                eventBus.dispatch('tasksUpdated');
            } else {
                // Auto-Journaling Logic
                if (updates.is_complete && !taskToUpdate.is_complete && isAutoJournalingEnabled) {
                    const appendToJournal = async () => {
                        const todayStart = new Date();
                        todayStart.setHours(0, 0, 0, 0);

                        const { data: existingEntry, error } = await supabase
                            .from('journal_entries')
                            .select('id, content')
                            .eq('user_id', user.id)
                            .gte('created_at', todayStart.toISOString())
                            .maybeSingle();

                        if (error) { console.error("Error fetching today's journal:", error); return; }

                        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const newLog = `<p>✅ ${timeString}: Completed task "${taskToUpdate.task}"</p>`;

                        if (existingEntry) {
                            const newContent = (existingEntry.content || '') + newLog;
                            await supabase.from('journal_entries').update({ content: newContent }).eq('id', existingEntry.id);
                        } else {
                            await supabase.from('journal_entries').insert({ user_id: user.id, content: newLog, title: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) });
                        }
                    };
                    appendToJournal();
                }
            }
        }
    }, [user, tasks, isAutoJournalingEnabled, supabase]);

    const handleTaskTimeUpdate = useCallback(async (taskId, completedPomodoros = 1) => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;

        // UX: Timer reflects effort only; completion stays manual.
        const newPomodorosSpent = (taskToUpdate.pomodoros_spent || 0) + completedPomodoros;

        const updates = {
            pomodoros_spent: newPomodorosSpent,
            // Do NOT auto-complete based on pomodoro count; user checks the box manually.
            is_complete: taskToUpdate.is_complete,
            updated_at: new Date().toISOString()
        };

        await updateTask(taskId, updates);

    }, [tasks, updateTask]);

    useEffect(() => {
        if (onTaskTimeUpdateRef) {
            onTaskTimeUpdateRef.current = handleTaskTimeUpdate;
        }
    }, [handleTaskTimeUpdate, onTaskTimeUpdateRef]);

    useEffect(() => {
        const getInitialUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            fetchData(user);
        }
        if (isOpen) {
            getInitialUser();
        }
    }, [isOpen, fetchData, supabase.auth]);


    useEffect(() => {
        if (!user && !loading) {
            localStorage.setItem('ws_projects', JSON.stringify(projects));
            localStorage.setItem('ws_tasks', JSON.stringify(tasks));
            eventBus.dispatch('tasksUpdated');
        }
    }, [projects, tasks, user, loading]);

    const addProject = async () => {
        if (!newProjectName.trim()) return;
        const newProjectPayload = { name: newProjectName, user_id: user?.id };

        if (user) {
            const { data, error } = await supabase.from('projects').insert([newProjectPayload]).select();
            if (error) {
                console.error('Error adding project:', JSON.stringify(error, null, 2) || error.message);
                alert(`Error adding project: ${error.message || 'Check console output'}`);
                return;
            }
            if (data && data.length > 0) {
                setProjects(p => [...p, data[0]]);
                setActiveProjectId(data[0].id);
            }
        } else {
            const localNewProject = { ...newProjectPayload, id: `local_${Date.now()}`, created_at: new Date().toISOString() };
            setProjects(p => [...p, localNewProject]); setActiveProjectId(localNewProject.id);
        }
        setNewProjectName('');
    };

    const deleteProject = async (projectId) => {
        if (projects.length <= 1) {
            alert("You cannot delete your only project.");
            return;
        }
        if (user) {
            // FIX 3: Soft Delete Logic placed correctly here
            const { error } = await supabase
                .from('projects')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', projectId);

            if (error) { console.error('Error deleting project:', error); }
        }
        const remainingProjects = projects.filter(p => p.id !== projectId);
        setProjects(remainingProjects);
        if (activeProjectId === projectId) {
            setActiveProjectId(remainingProjects.length > 0 ? remainingProjects[0].id : null);
        }
    };

    const addTask = async (taskText, parentId = null) => {
        if (!taskText.trim() || !activeProjectId) { return; }
        const newTaskPayload = {
            task: taskText,
            user_id: user?.id,
            project_id: activeProjectId,
            parent_task_id: parentId,
            is_complete: false,
            pomodoros_estimated: 1,
            pomodoros_spent: 0,
            updated_at: new Date().toISOString(),
            priority: 0
        };

        if (user) {
            const { data, error } = await supabase.from('todos').insert(newTaskPayload).select().single();
            if (error) { console.error('Error adding task:', error); return; }
            if (data) {
                setTasks(t => [...t, data]);
                eventBus.dispatch('tasksUpdated');
            }
        } else {
            const localNewTask = { ...newTaskPayload, id: `local_${Date.now()}`, created_at: new Date().toISOString() };
            setTasks(t => [...t, localNewTask]);
        }
        if (!parentId) setNewTaskText('');
    };

    const deleteTask = async (taskId) => {
        const getSubtaskIds = (parentId) => {
            let ids = [];
            const children = tasks.filter(t => t.parent_task_id === parentId);
            for (const child of children) { ids.push(child.id); ids = [...ids, ...getSubtaskIds(child.id)]; }
            return ids;
        }
        const taskIdsToDelete = [taskId, ...getSubtaskIds(taskId)];
        const originalTasks = tasks;
        setTasks(currentTasks => currentTasks.filter(t => !taskIdsToDelete.includes(t.id)));
        eventBus.dispatch('tasksUpdated');

        if (user) {
            const { error } = await supabase.from('todos').delete().in('id', taskIdsToDelete);
            if (error) {
                console.error("Error deleting task:", error);
                setTasks(originalTasks);
                eventBus.dispatch('tasksUpdated');
            }
        }
    };

    const clearCompleted = () => {
        const tasksToDelete = tasks.filter(t => t.project_id === activeProjectId && t.is_complete && !t.parent_task_id);
        tasksToDelete.forEach(t => deleteTask(t.id));
    };

    const activeProject = projects.find(p => p.id === activeProjectId);

    let displayedTasks = tasks
        .filter(t => t.project_id === activeProjectId && !t.parent_task_id)
        .sort((a, b) => {
            const priorityDiff = (b.priority || 0) - (a.priority || 0);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.created_at) - new Date(b.created_at);
        });

    if (isFocusMode) {
        const firstIncomplete = displayedTasks.find(t => !t.is_complete);
        displayedTasks = firstIncomplete ? [firstIncomplete] : [];
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="w-[95vw] max-w-lg md:max-w-4xl h-[85vh] md:h-[70vh] bg-gray-900 text-white border-gray-700 flex flex-col md:flex-row p-0 overflow-hidden">
                <aside className="w-full md:w-[28%] bg-gray-950/50 border-b border-gray-800 md:border-b-0 md:border-r p-2 md:p-4 flex flex-col min-w-0 h-[30%] md:h-auto">
                    <h2 className="text-sm md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-1.5 truncate"><Folder size={16} className="shrink-0" /><span className="truncate">Projects</span></h2>
                    {/* Fixed scrollable container */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar min-h-0">
                        {projects.map(p => (
                            <div key={p.id} className="flex items-center group">
                                <button
                                    onClick={() => setActiveProjectId(p.id)}
                                    className={cn("w-full text-left p-2 rounded mb-1 truncate", activeProjectId === p.id ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-gray-800')}
                                >
                                    {p.name}
                                </button>
                                {projects.length > 1 && (
                                    <Button
                                        onClick={() => deleteProject(p.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20"
                                    >
                                        <X size={16} />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto">
                        {isAtLimit ? (
                            userTier === 0 ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex gap-2 group cursor-pointer" onClick={() => {
                                                if (typeof openSignUpModal === 'function') openSignUpModal();
                                            }}>
                                                <Input value={newProjectName} readOnly placeholder="Sign in to add more projects..." className="bg-gray-800 border-gray-700 opacity-50 pointer-events-none select-none text-xs sm:text-sm" />
                                                <Button size="icon" className="bg-yellow-500 opacity-50 w-10 flex-shrink-0 pointer-events-none select-none"><ListPlus size={20} /></Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-gray-800 border-gray-700 text-white z-50">
                                            Sign in to add more projects and unlock secure Cloud Sync.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <PremiumGate featureKey="unlimited_projects" requiredTier={2} lockClassName="absolute -top-2 -right-2">
                                    <div className="flex gap-2">
                                        <Input value={newProjectName} readOnly placeholder="Project limit reached..." className="bg-gray-800 border-gray-700 opacity-50 pointer-events-none select-none text-xs sm:text-sm" />
                                        <Button size="icon" className="bg-yellow-500 opacity-50 w-10 flex-shrink-0 pointer-events-none select-none"><ListPlus size={20} /></Button>
                                    </div>
                                </PremiumGate>
                            )
                        ) : (
                            <div className="flex gap-2">
                                <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addProject()} placeholder="New project..." className="bg-gray-800 border-gray-700" />
                                <Button onClick={addProject} size="icon" className="bg-yellow-500 hover:bg-yellow-600 w-10 flex-shrink-0"><ListPlus size={20} /></Button>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="flex-1 min-w-0 min-h-0 overflow-hidden p-3 md:p-6 flex flex-col relative">
                    <DialogHeader className="flex flex-row items-center justify-between mb-4 space-y-0">
                        <div>
                            <DialogTitle className="text-2xl text-yellow-400 flex items-center gap-2">
                                {isFocusMode && <Target className="animate-pulse" />}
                                {isFocusMode ? 'Focus Mode' : (activeProject?.name || 'Select a Project')}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 sr-only">Manage your projects and tasks.</DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsFocusMode(!isFocusMode)}
                                            className={cn("hover:text-yellow-400 transition-colors", isFocusMode && "text-yellow-400 bg-yellow-400/10")}
                                        >
                                            {isFocusMode ? <Layers size={20} /> : <Target size={20} />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                        <p>{isFocusMode ? "Switch to List View" : "Switch to Focus Mode"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {!isFocusMode && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={clearCompleted} className="hover:text-red-400 hover:bg-red-900/20">
                                                <Trash2 size={20} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                            <p>Clear Completed Tasks</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </DialogHeader>

                    {loading ? <p>Loading tasks...</p> : (
                        <TooltipProvider>
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar pb-20">
                                {displayedTasks.length > 0 ? (
                                    displayedTasks.map(task => <TaskItem key={task.id} task={task} allTasks={tasks} onUpdate={updateTask} onDelete={deleteTask} onAddTask={addTask} />)
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-70 animate-in fade-in zoom-in-95 duration-300">
                                        {isFocusMode ? (
                                            <>
                                                <CheckCircle size={64} className="mb-4 text-green-500" />
                                                <p className="text-xl font-semibold text-gray-300">You are unstoppable!</p>
                                                <p className="text-sm mt-2">No incomplete tasks to focus on.</p>
                                                <Button variant="link" onClick={() => setIsFocusMode(false)} className="mt-4 text-yellow-500">View all tasks</Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="bg-gray-800/50 p-6 rounded-full mb-4">
                                                    <CheckCircle size={48} className="text-gray-400" />
                                                </div>
                                                <p className="text-lg font-medium">All caught up!</p>
                                                <p className="text-sm">Add a task below to get started.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!isFocusMode && (
                                <form onSubmit={(e) => { e.preventDefault(); addTask(newTaskText); }} className="mt-4 flex gap-2">
                                    <Input value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Add a new task..." className="bg-gray-800 border-gray-700 text-base" disabled={!activeProjectId} />
                                    <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600" disabled={!activeProjectId}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
                                </form>
                            )}
                        </TooltipProvider>
                    )}
                </main>
            </DialogContent>
        </Dialog>
    );
}

function TaskItem({ task, allTasks, onUpdate, onDelete, onAddTask }) {
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [subtaskText, setSubtaskText] = useState('');
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

    // --- New States ---
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.task);

    const subtaskInputRef = useRef(null);

    const subtasks = allTasks.filter(t => t.parent_task_id === task.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const hasSubtasks = subtasks.length > 0;

    // Handle Adding Subtasks Continuously
    const handleAddSubtask = () => {
        if (!subtaskText.trim()) {
            setIsAddingSubtask(false);
            return;
        };
        onAddTask(subtaskText, task.id);
        setSubtaskText('');
        // We keep isAddingSubtask true so the input stays open for the next one
        // Ensure expanded is true so we see the new task
        setIsExpanded(true);
    };

    // Auto-focus logic for subtask input
    useEffect(() => {
        if (isAddingSubtask && subtaskInputRef.current) {
            subtaskInputRef.current.focus();
        }
    }, [isAddingSubtask, subtasks]); // Refocus when list changes (new item added)

    // Handle Inline Edit Save
    const handleEditSave = () => {
        if (editText.trim() !== task.task && editText.trim() !== '') {
            onUpdate(task.id, { task: editText, updated_at: new Date().toISOString() });
        } else {
            setEditText(task.task); // Revert if empty
        }
        setIsEditing(false);
    };

    return (
        <>
            <div className={cn("bg-black/20 p-3 rounded-lg mb-2 border border-transparent hover:border-gray-700/50 transition-all", task.priority === 3 && !task.is_complete && "border-l-4 border-l-red-500")}>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-grow min-w-0 pt-1">

                        {/* 1. COLLAPSE CHEVRON */}
                        {(hasSubtasks || isAddingSubtask) ? (
                            <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-white mt-1">
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        ) : (
                            // Spacer to align checkboxes if no chevron
                            <div className="w-4" />
                        )}

                        <Checkbox checked={task.is_complete} onCheckedChange={(checked) => onUpdate(task.id, { is_complete: !!checked, updated_at: new Date().toISOString() })} className="mt-1 border-gray-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500" />

                        {/* 2. INLINE EDITING & WRAPPING */}
                        <div className="flex-grow min-w-0">
                            {isEditing ? (
                                <Input
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                                    autoFocus
                                    className="h-7 py-1 bg-gray-900 border-yellow-500 focus-visible:ring-0"
                                />
                            ) : (
                                <span
                                    onClick={() => setIsEditing(true)}
                                    className={cn(
                                        "block cursor-text hover:text-gray-200 transition-all break-words whitespace-pre-wrap pr-2", // WRAPPING FIX
                                        task.is_complete ? 'line-through text-gray-500 opacity-50' : 'text-gray-300'
                                    )}
                                >
                                    {task.task}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                        {task.notes && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <NotebookPen size={16} className="text-gray-400 cursor-pointer hover:text-yellow-500 transition-colors" onClick={() => setIsNotesModalOpen(true)} />
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700 max-w-xs">
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{task.notes}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {!task.parent_task_id && (
                            <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-700/50 px-2 py-0.5 rounded-full">
                                <Clock size={12} /> {task.pomodoros_spent || 0}/{task.pomodoros_estimated || 1}
                            </span>
                        )}
                        {task.due_date && <span className={cn("text-xs flex items-center", new Date(task.due_date) < new Date() && !task.is_complete ? "text-red-400 font-bold" : "text-gray-400")}>{format(new Date(task.due_date), "MMM d")}</span>}
                        <PriorityFlag priority={task.priority} />
                        <TaskActions
                            task={task}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onToggleSubtaskInput={() => {
                                setIsAddingSubtask(true);
                                setIsExpanded(true); // Auto expand when adding
                            }}
                            onSetNotes={() => setIsNotesModalOpen(true)}
                        />
                    </div>
                </div>

                {/* 3. COLLAPSIBLE SUBTASKS CONTAINER */}
                {(isExpanded || isAddingSubtask) && (
                    <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-800 pl-4 animate-in slide-in-from-top-1 fade-in duration-200">
                        {subtasks.map(sub => <TaskItem key={sub.id} task={sub} allTasks={allTasks} onUpdate={onUpdate} onDelete={onDelete} onAddTask={onAddTask} />)}

                        {/* 4. CONTINUOUS ADD SUBTASK INPUT */}
                        {isAddingSubtask && (
                            <form onSubmit={(e) => { e.preventDefault(); handleAddSubtask() }} className="flex gap-2 items-center">
                                <Input
                                    ref={subtaskInputRef} // FOCUS REF
                                    value={subtaskText}
                                    onChange={e => setSubtaskText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setIsAddingSubtask(false); }}
                                    placeholder="Add sub-task..."
                                    className="h-8 bg-gray-800/50 text-sm"
                                />
                                <Button type="submit" size="sm" className="h-8 bg-yellow-500 text-black hover:bg-yellow-600">Add</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingSubtask(false)} className="h-8 w-8 p-0"><X size={14} /></Button>
                            </form>
                        )}
                    </div>
                )}
            </div>
            <NotesModal isOpen={isNotesModalOpen} setIsOpen={setIsNotesModalOpen} task={task} onUpdate={onUpdate} />
        </>
    );
}

function TaskActions({ task, onUpdate, onDelete, onToggleSubtaskInput, onSetNotes }) {
    const priorities = [{ label: 'High', value: 3, color: 'text-red-500' }, { label: 'Medium', value: 2, color: 'text-yellow-500' }, { label: 'Low', value: 1, color: 'text-blue-500' }, { label: 'None', value: 0, color: 'text-gray-400' }];

    const handlePomodoroEstimateChange = (change) => {
        const currentEstimate = task.pomodoros_estimated || 1;
        const newEstimate = Math.max(1, currentEstimate + change);
        onUpdate(task.id, { pomodoros_estimated: newEstimate });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white shadow-xl">
                <DropdownMenuItem onClick={onToggleSubtaskInput} className="focus:bg-gray-700 cursor-pointer"><Plus size={16} className="mr-2" /> Add Sub-task</DropdownMenuItem>
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-700 w-full">
                            <CalendarIcon size={16} className="mr-2" /> Set Due Date
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-gray-700 bg-gray-900" align="start">
                        <Calendar
                            mode="single"
                            selected={task.due_date ? new Date(task.due_date) : null}
                            onSelect={(date) => {
                                if (!date) {
                                    onUpdate(task.id, { due_date: null });
                                    return;
                                }
                                const offset = date.getTimezoneOffset();
                                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                onUpdate(task.id, { due_date: localDate.toISOString().split('T')[0] });
                            }}
                            initialFocus
                            className="bg-gray-900 text-gray-100 border border-gray-800 rounded-md p-3"
                        />
                    </PopoverContent>
                </Popover>
                <DropdownMenuItem onClick={onSetNotes} className="focus:bg-gray-700 cursor-pointer"><NotebookPen size={16} className="mr-2" /> Add/Edit Note</DropdownMenuItem>
                {!task.parent_task_id && (
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="focus:bg-gray-700 cursor-pointer"><Clock size={16} className="mr-2" /> Est. Pomodoros</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-gray-800 border-gray-700 text-white p-1">
                            <div className="flex items-center justify-center p-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-700" onClick={() => handlePomodoroEstimateChange(-1)}>-</Button>
                                <span className="mx-2 text-lg font-bold w-6 text-center">{task.pomodoros_estimated || 1}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-700" onClick={() => handlePomodoroEstimateChange(1)}>+</Button>
                            </div>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                )}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="focus:bg-gray-700 cursor-pointer"><Flag size={16} className="mr-2" /> Set Priority</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-gray-800 border-gray-700 text-white p-1">
                        {priorities.map(p => (<DropdownMenuItem key={p.label} onClick={() => onUpdate(task.id, { priority: p.value })} className="focus:bg-gray-700 cursor-pointer"><Flag size={16} className={cn("mr-2", p.color)} /> {p.label}</DropdownMenuItem>))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-500 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"><Trash2 size={16} className="mr-2" /> Delete Task</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function PriorityFlag({ priority }) {
    const priorityMap = { 3: 'text-red-500', 2: 'text-yellow-500', 1: 'text-blue-500' };
    if (!priority || !priorityMap[priority]) return null;
    return (
        <Tooltip>
            <TooltipTrigger>
                <Flag size={16} className={priorityMap[priority]} />
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 border-gray-700 text-white text-xs">
                {priority === 3 ? "High" : priority === 2 ? "Medium" : "Low"} Priority
            </TooltipContent>
        </Tooltip>
    );
}

function NotesModal({ isOpen, setIsOpen, task, onUpdate }) {
    const [notes, setNotes] = useState(task.notes || '');

    useEffect(() => {
        setNotes(task.notes || '');
    }, [task.notes]);


    const handleSave = () => {
        onUpdate(task.id, { notes, updated_at: new Date().toISOString() });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900 text-white border-gray-700 shadow-2xl">
                <DialogHeader>
                    <DialogTitle>Notes for: <span className="text-yellow-400">{task.task}</span></DialogTitle>
                    <DialogDescription>Add or edit your notes for this task below.</DialogDescription>
                </DialogHeader>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-60 bg-gray-800 border-gray-700 rounded-md p-4 focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none text-gray-200"
                    placeholder="Add detailed notes here..."
                />
                <DialogFooter>
                    <Button onClick={() => setIsOpen(false)} variant="ghost" className="hover:text-white">Cancel</Button>
                    <Button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Save Notes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}