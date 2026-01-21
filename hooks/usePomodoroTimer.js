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

    // Track initial duration to calculate elapsed time later
    const initialTimeRef = useRef(DEFAULT_SETTINGS.workMinutes * 60);

    // --- NEW: Refs for "Save on Exit" Logic ---
    // These act as a "Black Box" recorder, accessible even during unmount/cleanup
    const timeLeftRef = useRef(DEFAULT_SETTINGS.workMinutes * 60);
    const modeRef = useRef('work');

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

    // --- NEW: Sync State to Refs (The Recorder) ---
    // We update these refs whenever state changes so the cleanup function has the latest data
    useEffect(() => {
        timeLeftRef.current = timeLeft;
    }, [timeLeft]);

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);


    // Handle Mode/Settings changes
    // We intentionally exclude isRunning to prevent reset on pause
    useEffect(() => {
        if (!isRunning) {
            const time = getTimeForMode(mode);
            setTimeLeft(time);
            initialTimeRef.current = time;
            timeLeftRef.current = time; // Ensure ref is synced immediately
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, settings, getTimeForMode]);

    const playAlarm = useCallback(() => {
        if (alarmRef.current) {
            alarmRef.current.src = `/sounds/${settings.alarmSound}`;
            alarmRef.current.volume = settings.volume || 1;
            alarmRef.current.play().catch(error => console.error("Error playing alarm:", error));
        }
    }, [settings.alarmSound, settings.volume]);

    // --- Core Logic: Handle Session End ---
    const handleSessionEnd = useCallback((wasSkipped = false) => {
        const sessionWasWork = mode === 'work';

        // Calculate actual duration
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
            // Log if at least 1 minute passed
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
        } else {
            nextMode = 'work';
        }

        const nextTime = getTimeForMode(nextMode);
        setMode(nextMode);
        setTimeLeft(nextTime);
        initialTimeRef.current = nextTime;
        timeLeftRef.current = nextTime; // Update ref immediately to prevent race conditions

        const shouldAutoStart = !wasSkipped && ((sessionWasWork && settings.autoStartBreaks) || (!sessionWasWork && settings.autoStartPomodoros));

        if (shouldAutoStart) {
            endTimeRef.current = Date.now() + nextTime * 1000;
            setIsRunning(true);
        } else {
            setIsRunning(false);
        }

    }, [mode, timeLeft, completedSessions, settings, playAlarm, getTimeForMode]);

    // Timer Loop
    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                const now = Date.now();
                const difference = endTimeRef.current - now;
                const remainingSeconds = Math.max(0, Math.ceil(difference / 1000));

                setTimeLeft(remainingSeconds);
                // Ref is updated via the useEffect dependency on [timeLeft] above,
                // but updating it here ensures synchronous access inside the loop if needed.
                
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

    // --- NEW: Save on Unmount (The Fix) ---
    useEffect(() => {
        return () => {
            // This code runs ONLY when the component unmounts (closes)
            
            // 1. Retrieve the latest values from our "Black Box" refs
            const currentMode = modeRef.current;
            const currentTime = timeLeftRef.current;
            const initialTime = initialTimeRef.current;

            // 2. Only save if it was a WORK session and wasn't finished (time > 0)
            // If time == 0, handleSessionEnd already saved it.
            if (currentMode === 'work' && currentTime > 0) {
                const elapsedSeconds = initialTime - currentTime;
                const elapsedMinutes = Math.floor(elapsedSeconds / 60);

                // 3. Threshold: Only save if > 1 minute elapsed
                if (elapsedMinutes >= 1) {
                    console.log("Unmount detected: Saving partial session of", elapsedMinutes, "mins");
                    if (onSessionCompleteRef.current) {
                        onSessionCompleteRef.current({
                            sessionWasWork: true,
                            duration: elapsedMinutes
                        });
                    }
                }
            }
        };
    }, []); // Empty dependency ensures this only runs on mount/unmount

    useEffect(() => {
        requestNotificationPermission();
        if (typeof window !== 'undefined') {
            alarmRef.current = new Audio();
        }
    }, []);

    const startTimer = () => {
        endTimeRef.current = Date.now() + timeLeft * 1000;
        setIsRunning(true);
    };

    const pauseTimer = () => setIsRunning(false);
    const skipMode = () => handleSessionEnd(true);

    const resetTimer = () => {
        // 1. Check if we are in work mode (we only log work, not breaks)
        if (mode === 'work') {
            // Calculate how much time passed since the start
            const elapsedSeconds = initialTimeRef.current - timeLeft;
            const elapsedMinutes = Math.floor(elapsedSeconds / 60);

            // 2. If user focused for at least 1 minute, SAVE IT
            if (elapsedMinutes > 0 && onSessionCompleteRef.current) {
                console.log("Saving cancelled session:", elapsedMinutes, "minutes");
                onSessionCompleteRef.current({
                    sessionWasWork: true,
                    duration: elapsedMinutes
                });
            }
        }

        // 3. Now actually reset the timer visual state
        setIsRunning(false);
        const time = getTimeForMode(mode);
        setTimeLeft(time);
        initialTimeRef.current = time;
        timeLeftRef.current = time; // Sync ref
    };

    const updateSettings = (newSettings) => {
        setIsRunning(false);
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

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