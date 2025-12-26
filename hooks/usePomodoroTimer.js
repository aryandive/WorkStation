"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// --- Helper Functions for Notifications ---
const requestNotificationPermission = async () => {
    if (typeof window === 'undefined') return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "denied") await Notification.requestPermission();
};

const showNotification = (title, body) => {
    if (typeof window === 'undefined') return;
    if (Notification.permission === "granted") new Notification(title, { body });
};

// Define defaults outside the component to keep it clean
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

// --- The Main Timer Hook ---
export default function usePomodoroTimer({ onSessionComplete }) {
    // 1. Initialize with defaults
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false); // Guard to prevent overwriting local storage on init

    const [mode, setMode] = useState('work');
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);

    const onSessionCompleteRef = useRef(onSessionComplete);
    const alarmRef = useRef(null);
    const endTimeRef = useRef(null);

    useEffect(() => {
        onSessionCompleteRef.current = onSessionComplete;
    }, [onSessionComplete]);

    // --- Persistence Logic ---
    // A. Load settings on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pomodoro_settings');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Merge saved settings with defaults (handles new keys added in future updates)
                    setSettings(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Failed to parse settings", e);
                }
            }
            setIsSettingsLoaded(true);
        }
    }, []);

    // B. Save settings on change (only after initial load)
    useEffect(() => {
        if (isSettingsLoaded && typeof window !== 'undefined') {
            localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
        }
    }, [settings, isSettingsLoaded]);


    const getTimeForMode = useCallback((m) => {
        switch (m) {
            case 'break': return settings.breakMinutes * 60;
            case 'longBreak': return settings.longBreakMinutes * 60;
            default: return settings.workMinutes * 60;
        }
    }, [settings]);

    const [timeLeft, setTimeLeft] = useState(getTimeForMode('work'));

    // Audio Player Helper
    const playAlarm = useCallback(() => {
        if (alarmRef.current) {
            alarmRef.current.src = `/sounds/${settings.alarmSound}`;
            alarmRef.current.volume = settings.volume || 1;
            alarmRef.current.play().catch(error => console.error("Error playing alarm:", error));
        }
    }, [settings.alarmSound, settings.volume]);

    // Handle Session Completion logic
    const handleSessionEnd = useCallback((wasSkipped = false) => {
        const sessionWasWork = mode === 'work';

        if (!wasSkipped) {
            playAlarm();
            if (settings.notificationOnFinish) {
                const message = sessionWasWork ? "Time for a break!" : "Time to get back to focus!";
                showNotification("Session Finished!", message);
            }
            if (onSessionCompleteRef.current) {
                onSessionCompleteRef.current({ sessionWasWork });
            }
        }

        let nextMode = 'work';
        if (sessionWasWork) {
            const newCompleted = completedSessions + 1;
            setCompletedSessions(newCompleted);
            nextMode = newCompleted > 0 && newCompleted % settings.longBreakInterval === 0 ? 'longBreak' : 'break';
        }

        const shouldAutoStart = (sessionWasWork && settings.autoStartBreaks) || (!sessionWasWork && settings.autoStartPomodoros);

        setMode(nextMode);

        // Setup next session
        const nextTime = getTimeForMode(nextMode);
        setTimeLeft(nextTime);

        if (shouldAutoStart) {
            endTimeRef.current = Date.now() + nextTime * 1000;
            setIsRunning(true);
        } else {
            setIsRunning(false);
        }

    }, [mode, completedSessions, settings, playAlarm, getTimeForMode]);

    // --- The Drift Fix (Timer Loop) ---
    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                const now = Date.now();
                const difference = endTimeRef.current - now;

                // Calculate remaining seconds
                const remainingSeconds = Math.max(0, Math.ceil(difference / 1000));

                setTimeLeft(remainingSeconds);

                if (remainingSeconds <= 0) {
                    clearInterval(interval);
                    handleSessionEnd(false);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, handleSessionEnd]);

    // --- Title Sync (UX) ---
    useEffect(() => {
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        const modeLabel = mode === 'work' ? 'Focus' : 'Break';

        document.title = `${minutes}:${seconds} - ${modeLabel} | Work Station`;

        return () => {
            document.title = "Work Station";
        };
    }, [timeLeft, mode]);

    useEffect(() => {
        requestNotificationPermission();
        if (typeof window !== 'undefined') {
            alarmRef.current = new Audio();
        }
    }, []);

    // Update time when settings change (if timer is stopped)
    // FIX APPLIED HERE: Removed 'isRunning' from dependency array
    useEffect(() => {
        if (!isRunning) {
            setTimeLeft(getTimeForMode(mode));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, settings.workMinutes, settings.breakMinutes, settings.longBreakMinutes, getTimeForMode]);


    const startTimer = () => {
        if (alarmRef.current && alarmRef.current.paused) {
            alarmRef.current.volume = 0;
            alarmRef.current.play().catch(() => { });
            alarmRef.current.volume = settings.volume || 1;
        }

        endTimeRef.current = Date.now() + timeLeft * 1000;
        setIsRunning(true);
    };

    const pauseTimer = () => {
        setIsRunning(false);
    };

    const skipMode = () => handleSessionEnd(true);

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(getTimeForMode(mode));
    };

    const updateSettings = (newSettings) => {
        setIsRunning(false);
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const totalTimeForMode = getTimeForMode(mode);
    const progress = totalTimeForMode > 0 ? ((totalTimeForMode - timeLeft) / totalTimeForMode) * 100 : 0;

    return {
        timeLeft, isRunning, mode, progress, settings,
        startTimer, pauseTimer, updateSettings, resetTimer, skipMode,
        setMode: (newMode) => {
            if (!isRunning) {
                setMode(newMode);
            }
        },
    };
}