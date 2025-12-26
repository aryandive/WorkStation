import { Play, Pause, RefreshCw, SkipForward, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback, useRef, useEffect } from 'react';

// --- Improved Sound Player Hook ---
// Fixes "AbortError" by using cloned nodes for overlapping playback
const useSoundPlayer = () => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();
        }
    }, []);

    const playSound = useCallback((soundFile) => {
        if (audioRef.current) {
            // Clone the node to allow overlapping sounds (rapid clicking)
            // This prevents "AbortError" when play() is called while already playing
            const tempAudio = audioRef.current.cloneNode();
            tempAudio.src = soundFile;
            tempAudio.volume = 0.5; // Reasonable default volume for UI clicks
            tempAudio.play().catch(err => {
                // Ignore "user didn't interact" errors or load errors
                console.warn("Sound play failed:", err);
            });
        }
    }, []);

    return playSound;
};

export default function TimerControls({ isRunning, startTimer, pauseTimer, resetTimer, skipMode, isMinimized = false, maximize }) {
    const playClickSound = useSoundPlayer();

    const handleStart = () => {
        playClickSound('/sounds/click-start.mp3');
        startTimer();
    };

    const handlePause = () => {
        playClickSound('/sounds/click-pause.mp3');
        pauseTimer();
    };

    const handleReset = () => {
        playClickSound('/sounds/click-reset.mp3');
        resetTimer();
    };

    const handleSkip = () => {
        playClickSound('/sounds/click-skip.mp3');
        skipMode();
    };

    if (isMinimized) {
        return (
            <>
                {isRunning ? (
                    <Button variant="ghost" size="icon" onClick={handlePause} className="text-white hover:bg-white/20 rounded-full h-12 w-12"><Pause size={24} /></Button>
                ) : (
                    <Button variant="ghost" size="icon" onClick={handleStart} className="text-white hover:bg-white/20 rounded-full h-12 w-12"><Play size={24} /></Button>
                )}
                <Button variant="ghost" size="icon" onClick={maximize} className="text-white hover:bg-white/20 rounded-full h-12 w-12"><Maximize2 size={24} /></Button>
            </>
        )
    }

    return (
        <div className="flex justify-center items-center space-x-4 mt-6">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={handleReset}>
                <RefreshCw size={20} />
            </Button>

            {isRunning ? (
                <Button size="lg" className="bg-white hover:bg-gray-200 text-black w-32 h-12 text-lg font-bold" onClick={handlePause}>
                    <Pause className="mr-2 h-5 w-5" /> PAUSE
                </Button>
            ) : (
                <Button size="lg" className="bg-white hover:bg-gray-200 text-black w-32 h-12 text-lg font-bold" onClick={handleStart}>
                    <Play className="mr-2 h-5 w-5" /> START
                </Button>
            )}

            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={handleSkip}>
                <SkipForward size={20} />
            </Button>
        </div>
    );
}