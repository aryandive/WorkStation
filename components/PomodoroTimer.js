'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import usePomodoroTimer from '@/hooks/usePomodoroTimer';
import SessionSettings from '@/components/pomodoro/SessionSettings';
import ProgressCircle from '@/components/pomodoro/ProgressCircle';
import TimerControls from '@/components/pomodoro/TimerControls';
//import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@/utils/supabase/client'; // ADDED
import { LinkIcon, Settings, Minimize2, Maximize2, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function PomodoroTimer({ isOpen, setIsOpen, onTaskTimeUpdateRef }) {
    const [tasks, setTasks] = useState([]);
    const [linkedTask, setLinkedTask] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const supabase = createClient(); // ADDED initialization

    // FIX: Use a ref to hold the linkedTask to avoid stale closures in the callback.
    const linkedTaskRef = useRef(linkedTask);
    useEffect(() => {
        linkedTaskRef.current = linkedTask;
    }, [linkedTask]);

    const handleSessionComplete = useCallback(({ sessionWasWork }) => {
        // Now, it reads the CURRENT linked task from the ref when the session ends.
        if (sessionWasWork && linkedTaskRef.current && onTaskTimeUpdateRef && typeof onTaskTimeUpdateRef.current === 'function') {
            onTaskTimeUpdateRef.current(linkedTaskRef.current.id, 1);
        }
    }, [onTaskTimeUpdateRef]); // This callback is now stable and doesn't need to change.

    const {
        timeLeft, isRunning, mode, progress, settings,
        startTimer, pauseTimer, resetTimer, skipMode, updateSettings, setMode,
    } = usePomodoroTimer({ onSessionComplete: handleSessionComplete });


    const colorMap = {
        work: { button: 'bg-yellow-500/80 text-white hover:bg-yellow-600/80', progress: 'text-yellow-500' },
        break: { button: 'bg-green-500/80 text-white hover:bg-green-600/80', progress: 'text-green-500' },
        longBreak: { button: 'bg-blue-500/80 text-white hover:bg-blue-600/80', progress: 'text-blue-500' },
    };

    useEffect(() => {
        if (isOpen) {
            const fetchUserAndTasks = async () => {
                const { data: { user } } = await supabase.auth.getUser(); // Uses initialized client
                if (user) {
                    const { data, error } = await supabase.from('todos').select('id, task').eq('user_id', user.id).eq('is_complete', false).is('parent_task_id', null); // Uses initialized client
                    if (error) console.error('Error fetching tasks for pomodoro:', error);
                    else setTasks(data || []);
                } else {
                    const localTasks = JSON.parse(localStorage.getItem('ws_tasks')) || [];
                    setTasks(localTasks.filter(t => !t.is_complete && !t.parent_task_id));
                }
            };
            fetchUserAndTasks();
        }
    }, [isOpen, supabase]); // ADDED supabase as dependency


    if (!isOpen) return null;

    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');

    if (isMinimized) {
        const hours = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
        return (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group animate-in fade-in zoom-in-95">
                <h3 className="text-white/80 text-lg font-semibold drop-shadow-lg mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{linkedTask?.task || 'Focus Session'}</h3>
                <span className="text-8xl font-bold text-white tabular-nums drop-shadow-2xl">
                    {hours}:{minutes}:{seconds}
                </span>
                <div className="flex gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <TimerControls isRunning={isRunning} startTimer={startTimer} pauseTimer={pauseTimer} resetTimer={resetTimer} skipMode={skipMode} isMinimized={true} maximize={() => setIsMinimized(false)} />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in">
            <Card className="w-full max-w-sm bg-gray-900/80 backdrop-blur-md border-gray-700/50 text-white shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-bold">Pomodoro</CardTitle>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white h-8 w-8"><Settings size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white h-8 w-8"><X size={20} /></Button>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-6 pt-2">
                    <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg mb-4">
                        <Button onClick={() => setMode('work')} variant="ghost" className={cn("px-4 py-1 h-auto text-sm", mode === 'work' && colorMap.work.button)}>Focus</Button>
                        <Button onClick={() => setMode('break')} variant="ghost" className={cn("px-4 py-1 h-auto text-sm", mode === 'break' && colorMap.break.button)}>Short Break</Button>
                        <Button onClick={() => setMode('longBreak')} variant="ghost" className={cn("px-4 py-1 h-auto text-sm", mode === 'longBreak' && colorMap.longBreak.button)}>Long Break</Button>
                    </div>

                    <div className="relative my-4">
                        <ProgressCircle progress={progress} colorClass={colorMap[mode].progress} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="flex items-end drop-shadow-xl text-white">
                                <span className="text-7xl font-mono font-bold tabular-nums">{minutes}</span>
                                <span className="text-5xl font-mono pb-1 tabular-nums">:{seconds}</span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="link" className="text-gray-400 hover:text-white h-auto p-1">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                {linkedTask ? linkedTask.task : "Link task"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                            <DropdownMenuItem onSelect={() => setLinkedTask(null)} className="focus:bg-gray-700"><em>Unlink Task</em></DropdownMenuItem>
                            {tasks.map(task => (
                                <DropdownMenuItem key={task.id} onSelect={() => setLinkedTask(task)} className="focus:bg-gray-700">{task.task}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <TimerControls isRunning={isRunning} startTimer={startTimer} pauseTimer={pauseTimer} resetTimer={resetTimer} skipMode={skipMode} />

                    <Button variant="link" className="text-gray-500 mt-2 h-auto p-1" onClick={() => setIsMinimized(true)}>Minimize</Button>
                </CardContent>
            </Card>
            <SessionSettings isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} settings={settings} updateSettings={updateSettings} isRunning={isRunning} />
        </div>
    );
}

