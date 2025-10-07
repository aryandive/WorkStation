"use client"

import { useState, useEffect, useCallback, useRef } from 'react';

// --- Helper Functions for Notifications ---
const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "denied") await Notification.requestPermission();
};

const showNotification = (title, body) => {
    if (Notification.permission === "granted") new Notification(title, { body });
};

// --- The Main Timer Hook ---
export default function usePomodoroTimer({ onSessionComplete }) {
    const [settings, setSettings] = useState({
        workMinutes: 25,
        breakMinutes: 5,
        longBreakMinutes: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        longBreakInterval: 4,
        notificationOnFinish: true,
        alarmSound: 'alarm-bell.mp3',
    });

    const [mode, setMode] = useState('work');
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);

    const onSessionCompleteRef = useRef(onSessionComplete);
    useEffect(() => {
        onSessionCompleteRef.current = onSessionComplete;
    }, [onSessionComplete]);


    const alarmRef = useRef(null);

    const getTimeForMode = useCallback((m) => {
        switch (m) {
            case 'break': return settings.breakMinutes * 60;
            case 'longBreak': return settings.longBreakMinutes * 60;
            default: return settings.workMinutes * 60;
        }
    }, [settings]);

    const [timeLeft, setTimeLeft] = useState(getTimeForMode('work'));

    const playAlarm = useCallback(() => {
        if (alarmRef.current) {
            alarmRef.current.src = `/sounds/${settings.alarmSound}`;
            alarmRef.current.play().catch(error => console.error("Error playing alarm:", error));
        }
    }, [settings.alarmSound]);

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
        setIsRunning(shouldAutoStart);
        setTimeLeft(getTimeForMode(nextMode));

    }, [mode, completedSessions, settings, playAlarm, getTimeForMode]);


    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isRunning && timeLeft === 0) {
            handleSessionEnd(false);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, handleSessionEnd]);

    useEffect(() => {
        requestNotificationPermission();
        if (typeof window !== 'undefined') {
            alarmRef.current = new Audio();
        }
    }, []);

useEffect(() => {
        // When the mode changes, reset the displayed time to the full duration for that mode.
        // Do not tie this to isRunning; pausing should not reset the remaining time.
        setTimeLeft(getTimeForMode(mode));
    }, [mode, getTimeForMode]);


    const startTimer = () => {
        if (alarmRef.current && alarmRef.current.paused) {
            alarmRef.current.volume = 0;
            alarmRef.current.play().catch(() => { });
            alarmRef.current.volume = 1;
        }
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
