"use client";

import { createContext, useState, useContext, useMemo } from 'react';

const EnvironmentContext = createContext(null);

export function EnvironmentProvider({ children }) {
    const [activeScene, setActiveScene] = useState({ type: 'video', path: '/videos/cosy.mp4' });
    const [activeSounds, setActiveSounds] = useState([]);
    const [soundVolumes, setSoundVolumes] = useState({});
    const [youtube, setYoutube] = useState({ id: null, showPlayer: true, isMuted: true, showControls: false });
    const [isGlobalPlaying, setIsGlobalPlaying] = useState(true);

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
                playScene({ type: null, path: null });
                // If it's a curated video, force controls off. If custom, respect the user's current toggle state.
                setYoutube(y => ({
                    ...y,
                    id: videoId,
                    showPlayer: true,
                    isMuted: true,
                    showControls: isCustom ? y.showControls : false
                }));
                setIsGlobalPlaying(true);
                return true;
            }
            return false;
        };

        const stopYoutube = () => {
            setYoutube(y => ({ ...y, id: null }));
            playScene({ type: 'video', path: '/videos/cosy.mp4' });
        };

        const setYoutubeShowPlayer = (show) => setYoutube(y => ({ ...y, showPlayer: show }));
        const setYoutubeMute = (muted) => setYoutube(y => ({ ...y, isMuted: muted }));
        const setYoutubeShowControls = (show) => setYoutube(y => ({ ...y, showControls: show }));
        const toggleGlobalPlay = () => setIsGlobalPlaying(p => !p);

        return {
            activeScene, activeSounds, soundVolumes, youtube, isGlobalPlaying,
            playScene, toggleSound, changeVolume, playYoutube, stopYoutube, setYoutubeShowPlayer, setYoutubeMute, toggleGlobalPlay,
            setYoutubeShowControls
        };
    }, [activeScene, activeSounds, soundVolumes, youtube, isGlobalPlaying]);

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

