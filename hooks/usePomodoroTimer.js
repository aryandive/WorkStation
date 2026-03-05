"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// --- Utils ---
const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !("Notification" in window)) return;
    if (Notification.permission !== "denied") await Notification.requestPermission();
};

const showNotification = (title, body) => {
    if (typeof window === 'undefined' || Notification.permission !== "granted") return;
    new Notification(title, { body });
};

const DEFAULT_SETTINGS = {
    workMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4,
    notificationOnFinish: true,
    alarmSound: 'alarm-bell.mp3',
    volume: 0.8,
};

export default function usePomodoroTimer({ onSessionComplete }) {
    // --- State ---
    const [isStoreLoaded, setIsStoreLoaded] = useState(false);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [mode, setMode] = useState('work');
    const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);

    // --- Refs ---
    const onSessionCompleteRef = useRef(onSessionComplete);
    const alarmRef = useRef(null);
    const endTimeRef = useRef(null);
    
    // Core Refs for Logic
    const initialTimeRef = useRef(DEFAULT_SETTINGS.workMinutes * 60);
    const timeLeftRef = useRef(DEFAULT_SETTINGS.workMinutes * 60);
    const modeRef = useRef('work');

    // --- Helpers ---
    const getTimeForMode = useCallback((m, currentSettings = settings) => {
        switch (m) {
            case 'break': return currentSettings.breakMinutes * 60;
            case 'longBreak': return currentSettings.longBreakMinutes * 60;
            default: return currentSettings.workMinutes * 60;
        }
    }, [settings]);

    // --- 1. Initialization & Hydration ---
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // A. Load Settings
        const savedSettings = localStorage.getItem('pomodoro_settings');
        let currentSettings = DEFAULT_SETTINGS;
        if (savedSettings) {
            try {
                currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
                setSettings(currentSettings);
            } catch (e) { console.error("Settings parse error", e); }
        }

        // B. Load State
        const savedState = localStorage.getItem('pomodoro_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                const { 
                    mode: savedMode, 
                    timeLeft: savedTimeLeft, 
                    isRunning: wasRunning, 
                    targetEndTime, 
                    initialDuration 
                } = parsed;

                setMode(savedMode);
                modeRef.current = savedMode;

                const totalDuration = initialDuration || getTimeForMode(savedMode, currentSettings);
                initialTimeRef.current = totalDuration;

                let newTimeLeft = savedTimeLeft;
                if (wasRunning && targetEndTime) {
                    const now = Date.now();
                    const secondsRemaining = Math.ceil((targetEndTime - now) / 1000);
                    newTimeLeft = secondsRemaining > 0 ? secondsRemaining : 0;
                }

                setTimeLeft(newTimeLeft);
                timeLeftRef.current = newTimeLeft;
                
                if (newTimeLeft > 0 && wasRunning) {
                    setIsRunning(true);
                    endTimeRef.current = Date.now() + (newTimeLeft * 1000);
                } else if (newTimeLeft <= 0 && wasRunning) {
                    setIsRunning(false);
                    setTimeLeft(0);
                } else {
                    setIsRunning(false);
                }

            } catch (e) { console.error("State restore error", e); }
        } else {
            const startDuration = getTimeForMode('work', currentSettings);
            setTimeLeft(startDuration);
            timeLeftRef.current = startDuration;
            initialTimeRef.current = startDuration;
        }

        alarmRef.current = new Audio();
        requestNotificationPermission();
        setIsStoreLoaded(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    useEffect(() => { onSessionCompleteRef.current = onSessionComplete; }, [onSessionComplete]);

    // --- 2. Persistence Loop ---
    useEffect(() => {
        if (!isStoreLoaded || typeof window === 'undefined') return;

        const stateToSave = {
            mode,
            timeLeft,
            isRunning,
            targetEndTime: isRunning && endTimeRef.current ? endTimeRef.current : null,
            initialDuration: initialTimeRef.current,
            lastUpdated: Date.now()
        };
        localStorage.setItem('pomodoro_state', JSON.stringify(stateToSave));
        
        timeLeftRef.current = timeLeft;
        modeRef.current = mode;

    }, [mode, timeLeft, isRunning, isStoreLoaded]);

    useEffect(() => {
        if (isStoreLoaded) localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
    }, [settings, isStoreLoaded]);


    // --- 3. Timer Engine ---
    const handleSessionEnd = useCallback((wasSkipped = false) => {
        const sessionWasWork = modeRef.current === 'work';
        const totalDuration = initialTimeRef.current;
        const currentLeft = timeLeftRef.current;
        
        const elapsedSeconds = wasSkipped ? (totalDuration - currentLeft) : totalDuration;
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);

        if (!wasSkipped) {
            if (alarmRef.current) {
                alarmRef.current.src = `/sounds/${settings.alarmSound}`;
                alarmRef.current.volume = settings.volume || 1;
                alarmRef.current.play().catch(() => {});
            }
            if (settings.notificationOnFinish) {
                showNotification("Timer Finished", sessionWasWork ? "Take a break!" : "Back to work!");
            }
        }

        if (onSessionCompleteRef.current && elapsedMinutes > 0) {
            onSessionCompleteRef.current({ sessionWasWork, duration: elapsedMinutes });
        }

        let nextMode = 'work';
        if (sessionWasWork && !wasSkipped) {
            const newCompleted = completedSessions + 1;
            setCompletedSessions(newCompleted);
            nextMode = (newCompleted > 0 && newCompleted % settings.longBreakInterval === 0) ? 'longBreak' : 'break';
        }

        const nextTime = getTimeForMode(nextMode);
        
        setMode(nextMode);
        modeRef.current = nextMode;
        
        setTimeLeft(nextTime);
        timeLeftRef.current = nextTime;
        
        initialTimeRef.current = nextTime;

        const shouldAutoStart = !wasSkipped && (
            (sessionWasWork && settings.autoStartBreaks) || 
            (!sessionWasWork && settings.autoStartPomodoros)
        );

        if (shouldAutoStart) {
            endTimeRef.current = Date.now() + (nextTime * 1000);
            setIsRunning(true);
        } else {
            setIsRunning(false);
        }
    }, [completedSessions, settings, getTimeForMode]);


    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                const now = Date.now();
                const difference = endTimeRef.current - now;
                const remaining = Math.max(0, Math.ceil(difference / 1000));

                setTimeLeft(remaining);

                // --- NEW: 5-Minute Warning ---
                // Trigger only if exactly 300s (5m) remain AND the total session was > 5m
                if (remaining === 300 && initialTimeRef.current > 300) {
                     showNotification("5 Minutes Left", "Time to wrap up!");
                }

                if (remaining <= 0) {
                    clearInterval(interval);
                    handleSessionEnd(false);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, handleSessionEnd]);


    // --- 4. Controls ---
    const startTimer = () => {
        if (timeLeft <= 0) return;
        endTimeRef.current = Date.now() + (timeLeft * 1000);
        setIsRunning(true);
    };

    const pauseTimer = () => setIsRunning(false);

    const resetTimer = () => {
        if (mode === 'work') {
            const elapsed = Math.floor((initialTimeRef.current - timeLeft) / 60);
            if (elapsed > 0 && onSessionCompleteRef.current) {
                onSessionCompleteRef.current({ sessionWasWork: true, duration: elapsed });
            }
        }
        
        setIsRunning(false);
        const t = getTimeForMode(mode);
        setTimeLeft(t);
        initialTimeRef.current = t;
        timeLeftRef.current = t;
        
        localStorage.removeItem('pomodoro_state');
    };

    const skipMode = () => handleSessionEnd(true);

    const switchMode = (newMode) => {
        if (isRunning) return; 
        const t = getTimeForMode(newMode);
        setMode(newMode);
        setTimeLeft(t);
        initialTimeRef.current = t;
        timeLeftRef.current = t;
    };
    
    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const progress = initialTimeRef.current > 0 
        ? ((initialTimeRef.current - timeLeft) / initialTimeRef.current) * 100 
        : 0;

    // Browser Title Sync
    useEffect(() => {
        if (!isStoreLoaded) return;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        const label = mode === 'work' ? 'Focus' : (mode === 'break' ? 'Short Break' : 'Long Break');
        document.title = `${m}:${s} - ${label} | Work Station`;
        return () => { document.title = "Work Station"; };
    }, [timeLeft, mode, isStoreLoaded]);

    // Save on Unmount
    useEffect(() => {
        return () => {
            const cMode = modeRef.current;
            const cTime = timeLeftRef.current;
            const cInit = initialTimeRef.current;
            
            if (cMode === 'work' && cTime > 0) {
                const eMin = Math.floor((cInit - cTime) / 60);
                if (eMin >= 1 && onSessionCompleteRef.current) {
                    onSessionCompleteRef.current({ sessionWasWork: true, duration: eMin });
                }
            }
        };
    }, []);

    useEffect(() => {
        const event = new CustomEvent('sys-timer-status', { 
            detail: { isRunning } 
        });
        window.dispatchEvent(event);
    }, [isRunning]);

    // --- 6. UX: Detect Tab Sleep ---
    useEffect(() => {
        if (!isRunning) return;

        let lastTick = Date.now();
        const driftCheckInterval = setInterval(() => {
            const now = Date.now();
            const delta = now - lastTick;
            
            // If gap > 2000ms, tab was asleep.
            if (delta > 2000) {
                // REMOVED: showNotification("Timer Synced"...)
                // The math updates automatically via endTimeRef in the main loop.
            }
            lastTick = now;
        }, 1000);

        return () => clearInterval(driftCheckInterval);
    }, [isRunning]);

    return {
        isStoreLoaded,
        timeLeft, 
        isRunning, 
        mode, 
        progress, 
        settings,
        startTimer, 
        pauseTimer, 
        updateSettings, 
        resetTimer, 
        skipMode,
        setMode: switchMode,
    };
}