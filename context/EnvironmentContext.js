"use client";

import { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { ANIMATED_SCENES } from '@/lib/environmentConfig';

const EnvironmentContext = createContext(null);

// HYBRID MODEL: Default is Local MP4 (Instant Load, High Quality)
const DEFAULT_SCENE = { 
    type: 'video', 
    path: '/videos/cosy.mp4',
    name: 'Cosy Ambience'
};

export function EnvironmentProvider({ children }) {
    // Start with Default to prevent null crashes, but 'isLoaded' gates the visual render
    const [activeScene, setActiveScene] = useState(DEFAULT_SCENE);
    const [lastActiveScene, setLastActiveScene] = useState(null);

    const [activeSounds, setActiveSounds] = useState([]);
    const [soundVolumes, setSoundVolumes] = useState({});
    const [youtube, setYoutube] = useState({ id: null, showPlayer: true, isMuted: true, showControls: false });
    const [isGlobalPlaying, setIsGlobalPlaying] = useState(true);
    
    // THE SHIELD: Prevents "Flash" of wrong content on refresh
    const [isLoaded, setIsLoaded] = useState(false); 

    // --- Persistence Logic ---
    useEffect(() => {
        // 1. Read LocalStorage
        try {
            const savedScene = localStorage.getItem('ws_activeScene');
            if (savedScene) {
                const parsed = JSON.parse(savedScene);
                // Validation: Ensure saved data isn't corrupted
                if (parsed && (parsed.type || parsed.videoId || parsed.path)) {
                    setActiveScene(parsed);
                }
            }
        } catch (e) {
            console.warn("Failed to load saved environment:", e);
        } finally {
            // 2. Lift the Shield (Allow MasterPlayer to render)
            setIsLoaded(true);
        }
    }, []);

    // Save state whenever it changes (only after initial load)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('ws_activeScene', JSON.stringify(activeScene));
        }
    }, [activeScene, isLoaded]);

    const value = useMemo(() => {
        const playScene = (scene) => {
            setYoutube(y => ({ ...y, id: null }));
            setActiveScene(scene);
            setIsGlobalPlaying(true);
        };

        const toggleSound = (soundUrl) => {
            setActiveSounds(current => {
                const soundIndex = current.indexOf(soundUrl);
                if (soundIndex > -1) {
                    return current.filter(s => s !== soundUrl);
                } else {
                    setSoundVolumes(v => ({ ...v, [soundUrl]: v[soundUrl] || 0.5 }));
                    return [...current, soundUrl];
                }
            });
        };

        const changeVolume = (soundUrl, volume) => {
            setSoundVolumes(v => ({ ...v, [soundUrl]: volume }));
        };

        const getYoutubeId = (url) => {
            try {
                const urlObj = new URL(url);
                const host = urlObj.hostname;
                if (host.includes('youtu.be')) {
                    return urlObj.pathname.split('/').filter(Boolean)[0] || null;
                }
                if (host.includes('youtube.com')) {
                    if (urlObj.searchParams.get('v')) return urlObj.searchParams.get('v');
                    const path = urlObj.pathname.split('/').filter(Boolean);
                    if (path[0] === 'shorts' && path[1]) return path[1];
                    if (path[0] === 'embed' && path[1]) return path[1];
                }
            } catch (e) { return null; }
            return null;
        };

        const playYoutube = (url, options = {}) => {
            const videoId = getYoutubeId(url);
            if (videoId) {
                const { isCustom = false } = options;

                if (activeScene.type !== null) {
                    setLastActiveScene(activeScene);
                }

                setYoutube(y => ({
                    ...y,
                    id: videoId,
                    showPlayer: true,
                    isMuted: true,
                    showControls: isCustom ? true : false
                }));
                setIsGlobalPlaying(true);
                return true;
            }
            return false;
        };

        const stopYoutube = () => {
            setYoutube(y => ({ ...y, id: null }));
            if (lastActiveScene) {
                setActiveScene(lastActiveScene);
            }
        };

        const setYoutubeShowPlayer = (show) => setYoutube(y => ({ ...y, showPlayer: show }));
        const setYoutubeMute = (muted) => setYoutube(y => ({ ...y, isMuted: muted }));
        const setYoutubeShowControls = (show) => setYoutube(y => ({ ...y, showControls: show }));
        const toggleGlobalPlay = () => setIsGlobalPlaying(p => !p);

        return {
            activeScene, activeSounds, soundVolumes, youtube, isGlobalPlaying, isLoaded,
            playScene, toggleSound, changeVolume, playYoutube, stopYoutube,
            setYoutubeShowPlayer, setYoutubeMute, toggleGlobalPlay, setYoutubeShowControls
        };
    }, [activeScene, activeSounds, soundVolumes, youtube, isGlobalPlaying, lastActiveScene, isLoaded]);

    return (
        <EnvironmentContext.Provider value={value}>
            {children}
        </EnvironmentContext.Provider>
    );
}

export function useEnvironment() {
    const context = useContext(EnvironmentContext);
    if (!context) {
        throw new Error('useEnvironment must be used within an EnvironmentProvider');
    }
    return context;
}