'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Draggable from 'react-draggable';
import usePomodoroTimer from '@/hooks/usePomodoroTimer';
import { useSessionLogger } from '@/hooks/useSessionLogger';
import SessionSettings from '@/components/pomodoro/SessionSettings';
import ProgressCircle from '@/components/pomodoro/ProgressCircle';
import TimerControls from '@/components/pomodoro/TimerControls';
import { createClient } from '@/utils/supabase/client';
import { LinkIcon, Settings, X, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const useKeyboardSound = () => {
    const audioRef = useRef(null);
    useEffect(() => {
        if (typeof window !== 'undefined') audioRef.current = new Audio();
    }, []);
    return (src) => {
        if (audioRef.current) {
            const sound = audioRef.current.cloneNode();
            sound.src = src;
            sound.volume = 0.5;
            sound.play().catch(() => { });
        }
    };
};

export default function PomodoroTimer({ isOpen, setIsOpen, onTaskTimeUpdateRef }) {
    const [tasks, setTasks] = useState([]);
    const [linkedTask, setLinkedTask] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Draggable State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const draggableNodeRef = useRef(null);

    const supabase = createClient();
    const playSound = useKeyboardSound();
    const { saveSession } = useSessionLogger();
    const linkedTaskRef = useRef(linkedTask);

    useEffect(() => { linkedTaskRef.current = linkedTask; }, [linkedTask]);

    const handleSessionComplete = useCallback(({ sessionWasWork, duration }) => {
        if (sessionWasWork && duration > 0) {
            saveSession({
                duration,
                taskId: linkedTaskRef.current ? linkedTaskRef.current.id : null
            });
            if (linkedTaskRef.current && onTaskTimeUpdateRef?.current) {
                onTaskTimeUpdateRef.current(linkedTaskRef.current.id, 1);
            }
        }
    }, [onTaskTimeUpdateRef, saveSession]);

    const {
        isStoreLoaded, // <--- NEW PROP
        timeLeft, isRunning, mode, progress, settings,
        startTimer, pauseTimer, resetTimer, skipMode, updateSettings, setMode,
    } = usePomodoroTimer({ onSessionComplete: handleSessionComplete });

    const colorMap = {
        work: { button: 'bg-yellow-500/80 text-white hover:bg-yellow-600/80', progress: 'text-yellow-500' },
        break: { button: 'bg-green-500/80 text-white hover:bg-green-600/80', progress: 'text-green-500' },
        longBreak: { button: 'bg-blue-500/80 text-white hover:bg-blue-600/80', progress: 'text-blue-500' },
    };

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            switch (e.code) {
                case 'Space':
                    e.preventDefault(); e.stopPropagation();
                    if (isRunning) { playSound('/sounds/click-pause.mp3'); pauseTimer(); }
                    else { playSound('/sounds/click-start.mp3'); startTimer(); }
                    break;
                case 'KeyN': playSound('/sounds/click-skip.mp3'); skipMode(); break;
                case 'KeyR': playSound('/sounds/click-reset.mp3'); resetTimer(); break;
                case 'KeyM': setIsMinimized(prev => !prev); break;
                case 'Escape':
                    if (isSettingsOpen) setIsSettingsOpen(false);
                    else if (!isMinimized) setIsMinimized(true);
                    else setIsOpen(false);
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isRunning, isMinimized, isSettingsOpen, startTimer, pauseTimer, skipMode, resetTimer, playSound]);

    // Data Fetching
    useEffect(() => {
        if (isOpen) {
            const fetchTasks = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase.from('todos').select('id, task').eq('user_id', user.id).eq('is_complete', false).is('parent_task_id', null);
                    setTasks(data || []);
                } else {
                    const local = JSON.parse(localStorage.getItem('ws_tasks')) || [];
                    setTasks(local.filter(t => !t.is_complete && !t.parent_task_id));
                }
            };
            fetchTasks();
        }
    }, [isOpen, supabase]);

    if (!isOpen) return null;

    // --- FLASH PREVENTION FIX ---
    // Don't render content until state is fully restored from localStorage
    if (!isStoreLoaded) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in backdrop-blur-sm">
                <Card className="w-full max-w-sm bg-gray-900/90 border-gray-700/50">
                    <CardContent className="h-[400px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');

    if (isMinimized) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <Draggable
                    nodeRef={draggableNodeRef}
                    position={position}
                    handle=".drag-handle"
                    onStart={() => { isDraggingRef.current = false; }}
                    onDrag={(e, data) => { setPosition({ x: data.x, y: data.y }); isDraggingRef.current = true; }}
                    onStop={() => { setTimeout(() => { isDraggingRef.current = false; }, 100); }}
                >
                    <div ref={draggableNodeRef} className="pointer-events-auto flex flex-col items-center group">
                        <h3 className="text-white/80 text-lg font-semibold drop-shadow-lg mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {linkedTask?.task || 'Focus Session'}
                        </h3>
                        <span className="text-8xl font-bold text-white tabular-nums drop-shadow-2xl cursor-default select-none">
                            {minutes}:{seconds}
                        </span>
                        <div className="flex gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <TimerControls 
                                isRunning={isRunning} startTimer={startTimer} pauseTimer={pauseTimer} 
                                resetTimer={resetTimer} skipMode={skipMode} isMinimized={true} 
                                maximize={() => setIsMinimized(false)} onRecenter={() => setPosition({x:0, y:0})}
                            />
                        </div>
                    </div>
                </Draggable>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in backdrop-blur-sm">
            <Card className="w-full max-w-sm bg-gray-900/90 backdrop-blur-md border-gray-700/50 text-white shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-bold">Pomodoro</CardTitle>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white h-8 w-8"><Settings size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white h-8 w-8"><X size={20} /></Button>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-6 pt-2">
                    <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg mb-4">
                        {['work', 'break', 'longBreak'].map(m => (
                            <Button 
                                key={m}
                                onClick={() => setMode(m)} 
                                variant="ghost" 
                                className={cn("px-4 py-1 h-auto text-sm transition-colors", mode === m && colorMap[m].button)}
                            >
                                {m === 'work' ? 'Focus' : m === 'break' ? 'Short Break' : 'Long Break'}
                            </Button>
                        ))}
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
                            <Button variant="link" className="text-gray-400 hover:text-white h-auto p-1 max-w-[250px] truncate">
                                <LinkIcon className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">{linkedTask ? linkedTask.task : "Link task"}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white max-h-60 overflow-y-auto">
                            <DropdownMenuItem onSelect={() => setLinkedTask(null)} className="focus:bg-gray-700 cursor-pointer"><em>Unlink Task</em></DropdownMenuItem>
                            {tasks.map(task => (
                                <DropdownMenuItem key={task.id} onSelect={() => setLinkedTask(task)} className="focus:bg-gray-700 cursor-pointer">{task.task}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <TimerControls isRunning={isRunning} startTimer={startTimer} pauseTimer={pauseTimer} resetTimer={resetTimer} skipMode={skipMode} />
                    <Button variant="link" className="text-gray-500 mt-2 h-auto p-1 text-xs" onClick={() => setIsMinimized(prev => !prev)}>Minimize (M)</Button>
                </CardContent>
            </Card>
            <SessionSettings isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} settings={settings} updateSettings={updateSettings} isRunning={isRunning} />
        </div>
    );
}