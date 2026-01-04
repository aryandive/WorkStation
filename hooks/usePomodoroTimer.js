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

// Define defaults
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
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

    const [mode, setMode] = useState('work');
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);

    const onSessionCompleteRef = useRef(onSessionComplete);
    const alarmRef = useRef(null);
    const endTimeRef = useRef(null);

    // NEW: Track the initial duration of the current session to calculate elapsed time
    const initialTimeRef = useRef(DEFAULT_SETTINGS.workMinutes * 60);

    useEffect(() => {
        onSessionCompleteRef.current = onSessionComplete;
    }, [onSessionComplete]);

    // Load Settings
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pomodoro_settings');
            if (saved) {
                try {
                    setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
                } catch (e) {
                    console.error("Failed to parse settings", e);
                }
            }
            setIsSettingsLoaded(true);
        }
    }, []);

    // Save Settings
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

    // Update initialTimeRef whenever we switch modes or settings change (and timer is stopped)
    useEffect(() => {
        if (!isRunning) {
            const time = getTimeForMode(mode);
            setTimeLeft(time);
            initialTimeRef.current = time; // Sync initial time
        }
    }, [mode, settings, getTimeForMode, isRunning]);

    const playAlarm = useCallback(() => {
        if (alarmRef.current) {
            alarmRef.current.src = `/sounds/${settings.alarmSound}`;
            alarmRef.current.volume = settings.volume || 1;
            alarmRef.current.play().catch(error => console.error("Error playing alarm:", error));
        }
    }, [settings.alarmSound, settings.volume]);

    // --- Core Logic Update: Accurate Duration Calculation ---
    const handleSessionEnd = useCallback((wasSkipped = false) => {
        const sessionWasWork = mode === 'work';

        // Calculate actual duration
        // If skipped: (Start Time - Current Time Left)
        // If finished: (Start Time)
        const totalSeconds = initialTimeRef.current;
        const elapsedSeconds = wasSkipped ? (totalSeconds - timeLeft) : totalSeconds;
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);

        if (!wasSkipped) {
            playAlarm();
            if (settings.notificationOnFinish) {
                const message = sessionWasWork ? "Time for a break!" : "Time to get back to focus!";
                showNotification("Session Finished!", message);
            }
        }

        // Pass the calculated duration to the callback
        if (onSessionCompleteRef.current) {
            // Only report if at least 1 minute has passed
            if (elapsedMinutes > 0) {
                onSessionCompleteRef.current({
                    sessionWasWork,
                    duration: elapsedMinutes
                });
            }
        }

        let nextMode = 'work';
        if (sessionWasWork && !wasSkipped) {
            const newCompleted = completedSessions + 1;
            setCompletedSessions(newCompleted);
            nextMode = newCompleted > 0 && newCompleted % settings.longBreakInterval === 0 ? 'longBreak' : 'break';
        } else if (sessionWasWork && wasSkipped) {
            // If work was skipped, don't advance to break, stay on work (or user preference?)
            // Usually, if you skip work, you might want to restart work or take a break. 
            // Let's keep it on 'work' to let them retry, or 'break' if they gave up.
            // For now, staying on 'work' is safer for accidental skips.
            nextMode = 'work';
        } else {
            // If break was finished or skipped, go back to work
            nextMode = 'work';
        }

        const nextTime = getTimeForMode(nextMode);
        setMode(nextMode);
        setTimeLeft(nextTime);
        initialTimeRef.current = nextTime; // Reset initial time for next session

        const shouldAutoStart = !wasSkipped && ((sessionWasWork && settings.autoStartBreaks) || (!sessionWasWork && settings.autoStartPomodoros));

        if (shouldAutoStart) {
            endTimeRef.current = Date.now() + nextTime * 1000;
            setIsRunning(true);
        } else {
            setIsRunning(false);
        }

    }, [mode, timeLeft, completedSessions, settings, playAlarm, getTimeForMode]); // Added timeLeft dependency

    // Timer Loop
    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                const now = Date.now();
                const difference = endTimeRef.current - now;
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

    // Title Sync
    useEffect(() => {
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        const modeLabel = mode === 'work' ? 'Focus' : 'Break';
        document.title = `${minutes}:${seconds} - ${modeLabel} | Work Station`;
        return () => { document.title = "Work Station"; };
    }, [timeLeft, mode]);

    useEffect(() => {
        requestNotificationPermission();
        if (typeof window !== 'undefined') {
            alarmRef.current = new Audio();
        }
    }, []);

    const startTimer = () => {
        if (alarmRef.current && alarmRef.current.paused) {
            alarmRef.current.volume = 0;
            alarmRef.current.play().catch(() => { });
            alarmRef.current.volume = settings.volume || 1;
        }
        endTimeRef.current = Date.now() + timeLeft * 1000;
        setIsRunning(true);
    };

    const pauseTimer = () => setIsRunning(false);
    const skipMode = () => handleSessionEnd(true);

    const resetTimer = () => {
        setIsRunning(false);
        const time = getTimeForMode(mode);
        setTimeLeft(time);
        initialTimeRef.current = time;
    };

    const updateSettings = (newSettings) => {
        setIsRunning(false);
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // Calculate progress based on INITIAL time, not dynamic getModeTime (which changes with settings)
    const progress = initialTimeRef.current > 0 ? ((initialTimeRef.current - timeLeft) / initialTimeRef.current) * 100 : 0;

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