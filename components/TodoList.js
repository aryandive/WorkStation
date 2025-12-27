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
    Layers
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

// Main TodoList Component
export default function TodoList({ isOpen, setIsOpen, onTaskTimeUpdateRef }) {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [newTaskText, setNewTaskText] = useState('');
    const [newProjectName, setNewProjectName] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // New Feature States
    const [isFocusMode, setIsFocusMode] = useState(false);

    // In a real app, this setting would be fetched from the user's profile
    const [isAutoJournalingEnabled, setIsAutoJournalingEnabled] = useState(true);

    const supabase = createClient();

    // Create a ref for the audio element
    const completionSoundRef = useRef(null);

    // Preload the audio when the component is open
    useEffect(() => {
        if (isOpen) {
            completionSoundRef.current = new Audio('/sounds/ting.mp3');
        }
    }, [isOpen]);

    const playCompletionSound = () => {
        if (completionSoundRef.current) {
            completionSoundRef.current.currentTime = 0; // Rewind to start
            completionSoundRef.current.play().catch(error => {
                console.error("Error playing sound:", error);
            });
        }
    };

    const fetchData = useCallback(async (currentUser) => {
        setLoading(true);
        if (currentUser) {
            const { data: projectsData, error: projError } = await supabase.from('projects').select('*').eq('user_id', currentUser.id);
            if (projError) console.error("Error fetching projects:", projError);

            const { data: tasksData, error: taskError } = await supabase.from('todos').select('*').eq('user_id', currentUser.id);
            if (taskError) console.error("Error fetching tasks:", taskError);

            setProjects(projectsData || []);
            setTasks(tasksData || []);
            if ((projectsData || []).length > 0 && !activeProjectId) {
                setActiveProjectId(projectsData[0].id);
            } else if ((projectsData || []).length === 0) {
                setActiveProjectId(null);
            }
        } else {
            const localProjects = JSON.parse(localStorage.getItem('ws_projects')) || [{ id: 'local_default', name: 'My Tasks', created_at: new Date().toISOString() }];
            const localTasks = JSON.parse(localStorage.getItem('ws_tasks')) || [];
            setProjects(localProjects);
            setTasks(localTasks);
            if (localProjects.length > 0 && !activeProjectId) {
                setActiveProjectId(localProjects[0].id);
            }
        }
        setLoading(false);
    }, [activeProjectId, supabase]);

    const updateTask = useCallback(async (taskId, updates) => {
        const originalTasks = [...tasks];
        const taskToUpdate = originalTasks.find(t => t.id === taskId);
        const updatedTask = { ...taskToUpdate, ...updates };

        // Play sound if the task is being marked as complete
        if (updates.is_complete && !taskToUpdate.is_complete) {
            playCompletionSound();
        }

        setTasks(currentTasks => currentTasks.map(t => t.id === taskId ? updatedTask : t));
        eventBus.dispatch('tasksUpdated');

        if (user) {
            const { error } = await supabase.from('todos').update(updates).eq('id', taskId);
            if (error) {
                console.error("Error updating task:", error);
                setTasks(originalTasks);
                eventBus.dispatch('tasksUpdated');
            } else {
                // PREMIUM FEATURE: Automated Journaling on task completion
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

        const newPomodorosSpent = (taskToUpdate.pomodoros_spent || 0) + completedPomodoros;
        const isNowComplete = !taskToUpdate.parent_task_id && newPomodorosSpent >= (taskToUpdate.pomodoros_estimated || 1);

        const updates = {
            pomodoros_spent: newPomodorosSpent,
            is_complete: taskToUpdate.is_complete || isNowComplete,
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
            const { data, error } = await supabase.from('projects').insert(newProjectPayload).select().single();
            if (error) { console.error('Error adding project:', error); return; }
            if (data) { setProjects(p => [...p, data]); setActiveProjectId(data.id); }
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
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
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
        // Find top-level completed tasks in the current project
        const tasksToDelete = tasks.filter(t => t.project_id === activeProjectId && t.is_complete && !t.parent_task_id);
        tasksToDelete.forEach(t => deleteTask(t.id));
    };

    const activeProject = projects.find(p => p.id === activeProjectId);

    // Sort and Filter Tasks
    // 1. Filter by Project & Top-Level
    // 2. Sort by Priority (High to Low) -> Created At (Old to New)
    let displayedTasks = tasks
        .filter(t => t.project_id === activeProjectId && !t.parent_task_id)
        .sort((a, b) => {
            // Sort by priority (descending)
            const priorityDiff = (b.priority || 0) - (a.priority || 0);
            if (priorityDiff !== 0) return priorityDiff;
            // Then by date (ascending - oldest first)
            return new Date(a.created_at) - new Date(b.created_at);
        });

    // Apply Focus Mode Filter
    if (isFocusMode) {
        const firstIncomplete = displayedTasks.find(t => !t.is_complete);
        displayedTasks = firstIncomplete ? [firstIncomplete] : [];
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl h-[70vh] bg-gray-900 text-white border-gray-700 flex p-0">
                <aside className="w-1/4 bg-gray-950/50 border-r border-gray-800 p-4 flex flex-col">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Folder size={20} /> Projects</h2>
                    <div className="flex-grow overflow-y-auto">
                        {projects.map(p => (
                            <div key={p.id} className="flex items-center group">
                                <button onClick={() => setActiveProjectId(p.id)} className={cn("w-full text-left p-2 rounded mb-1", activeProjectId === p.id ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-gray-800')}>{p.name}</button>
                                {projects.length > 1 && <Button onClick={() => deleteProject(p.id)} variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/20"><X size={16} /></Button>}
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto flex gap-2">
                        <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addProject()} placeholder="New project..." className="bg-gray-800 border-gray-700" />
                        <Button onClick={addProject} size="icon" className="bg-yellow-500 hover:bg-yellow-600"><ListPlus size={20} /></Button>
                    </div>
                </aside>

                <main className="w-3/4 p-6 flex flex-col relative">
                    {/* Header */}
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

                    {/* Content Area */}
                    {loading ? <p>Loading tasks...</p> : (
                        <TooltipProvider>
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
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

                            {/* Input Area - Hidden in Focus Mode if no tasks, or generally kept for quick add */}
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

    const handleAddSubtask = () => {
        if (!subtaskText.trim()) { setIsAddingSubtask(false); return; };
        onAddTask(subtaskText, task.id);
        setSubtaskText('');
        setIsAddingSubtask(false);
    };

    const subtasks = allTasks.filter(t => t.parent_task_id === task.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return (
        <>
            <div className={cn("bg-black/20 p-3 rounded-lg mb-2 border border-transparent hover:border-gray-700/50 transition-all", task.priority === 3 && !task.is_complete && "border-l-4 border-l-red-500")}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                        <Checkbox checked={task.is_complete} onCheckedChange={(checked) => onUpdate(task.id, { is_complete: !!checked, updated_at: new Date().toISOString() })} className="border-gray-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500" />
                        <span className={cn("truncate transition-all", task.is_complete && 'line-through text-gray-500 opacity-50')}>{task.task}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                        <TaskActions task={task} onUpdate={onUpdate} onDelete={onDelete} onToggleSubtaskInput={() => setIsAddingSubtask(!isAddingSubtask)} onSetNotes={() => setIsNotesModalOpen(true)} />
                    </div>
                </div>

                <div className="ml-8 mt-2 space-y-2">
                    {subtasks.map(sub => <TaskItem key={sub.id} task={sub} allTasks={allTasks} onUpdate={onUpdate} onDelete={onDelete} onAddTask={onAddTask} />)}
                    {isAddingSubtask && (
                        <form onSubmit={(e) => { e.preventDefault(); handleAddSubtask() }} className="flex gap-2 items-center animate-in slide-in-from-top-2">
                            <Input value={subtaskText} onChange={e => setSubtaskText(e.target.value)} placeholder="Add sub-task..." className="h-8 bg-gray-800/50 text-sm" autoFocus />
                            <Button type="submit" size="sm" className="h-8 bg-yellow-500 text-black hover:bg-yellow-600">Add</Button>
                        </form>
                    )}
                </div>
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
                                // Fix: Adjust for local timezone to prevent date shifting back by one day
                                const offset = date.getTimezoneOffset();
                                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                onUpdate(task.id, { due_date: localDate.toISOString().split('T')[0] });
                            }}
                            initialFocus
                            // Fix: Added 'bg-gray-900' and specific text colors to fix visibility
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