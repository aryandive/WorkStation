"use client";

import { useEnvironment } from '@/context/EnvironmentContext';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { VolumeX } from 'lucide-react'; 

// --- UPDATED: Smart Sound Player ---
const SoundPlayer = ({ src, volume, isPlaying, setSoundLoading, reportAudioError }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = volume;

        if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Playback started successfully
                    })
                    .catch(error => {
                        if (error.name === 'NotAllowedError') {
                            console.warn("Autoplay blocked for:", src);
                            reportAudioError();
                        } else {
                            console.error("Audio play failed:", error);
                        }
                    });
            }
        } else {
            audio.pause();
        }
    }, [volume, isPlaying, src, reportAudioError]);

    return (
        <audio 
            ref={audioRef} 
            src={src} 
            loop 
            onWaiting={() => setSoundLoading(src, true)}   // Buffering started
            onPlaying={() => setSoundLoading(src, false)}  // Buffering finished
            onCanPlay={() => setSoundLoading(src, false)}  // Ready to play
        />
    );
};

export default function MasterPlayer() {
    const { 
        activeScene, activeSounds, soundVolumes, youtube, isGlobalPlaying, isLoaded,
        setSoundLoading, reportAudioError, audioAllowed, resolveAudioError 
    } = useEnvironment();
    
    const videoRef = useRef(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        setIsVideoReady(false);
    }, [activeScene.id, activeScene.videoId]);

    // Local Video Logic
    useEffect(() => {
        if (videoRef.current && activeScene.type === 'video') {
            if (isGlobalPlaying) {
                videoRef.current.play().catch(e => console.error("Video play failed:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isGlobalPlaying, activeScene]);

    if (!isLoaded) return <div className="fixed inset-0 bg-black z-50 transition-opacity duration-700" />;

    const protectMedia = (e) => { e.preventDefault(); return false; };

    const studyModeSrc = youtube.id
        ? `https://www.youtube-nocookie.com/embed/${youtube.id}?autoplay=1&mute=${youtube.isMuted ? 1 : 0}&controls=${youtube.showControls ? 1 : 0}&rel=0&showinfo=0&modestbranding=1&playsinline=1&loop=1&playlist=${youtube.id}&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
        : "";

    const bgYoutubeSrc = activeScene.type === 'youtube-scene'
        ? `https://www.youtube-nocookie.com/embed/${activeScene.videoId}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&playsinline=1&loop=1&playlist=${activeScene.videoId}&disablekb=1&fs=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
        : "";

    const handleVideoLoad = () => {
        setTimeout(() => setIsVideoReady(true), 800);
    };

    return (
        <div 
            className="fixed inset-0 w-full h-full z-0 bg-black select-none"
            onContextMenu={protectMedia} 
        >
            {/* --- NEW: Autoplay Blocker Overlay --- */}
            {!audioAllowed && activeSounds.length > 0 && (
                <div 
                    onClick={resolveAudioError}
                    className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-900/90 hover:bg-red-800 text-white px-6 py-3 rounded-full cursor-pointer shadow-2xl border border-red-500/50 flex items-center gap-3 animate-bounce"
                >
                    <VolumeX className="w-5 h-5" />
                    <span className="font-bold text-sm">Click to Enable Sound</span>
                </div>
            )}

            {/* --- LAYER 1: POSTER --- */}
            {(activeScene.type === 'image' || activeScene.type === 'youtube-scene' || activeScene.type === 'video') && (
                <div 
                    className={`absolute inset-0 z-10 transition-opacity duration-1000 ease-in-out pointer-events-none ${
                        activeScene.type === 'image' ? 'opacity-100' : (isVideoReady ? 'opacity-0' : 'opacity-100')
                    }`}
                    style={{ backgroundColor: '#0f0f0f' }} 
                >
                     <Image
                        src={activeScene.thumbnail || activeScene.path || '/placeholder.webp'}
                        alt="Background Ambience"
                        fill
                        priority
                        quality={90}
                        sizes="100vw"
                        className="object-cover"
                        draggable={false}
                        onError={(e) => {
                            e.target.src = '/placeholder.webp';
                            e.target.srcset = '/placeholder.webp';
                        }}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                </div>
            )}

            {/* --- LAYER 2: LOCAL VIDEO --- */}
            {activeScene.type === 'video' && (
                <video
                    ref={videoRef}
                    key={activeScene.path} 
                    src={activeScene.path}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay={isGlobalPlaying}
                    loop
                    muted
                    playsInline
                    draggable={false}
                    onCanPlay={() => setIsVideoReady(true)}
                />
            )}

            {/* --- LAYER 3: YOUTUBE SCENE --- */}
            {activeScene.type === 'youtube-scene' && (
                 <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh]">
                         <iframe
                            src={bgYoutubeSrc}
                            title="Background Ambience"
                            className="w-full h-full border-0 pointer-events-none"
                            allow="autoplay; encrypted-media"
                            tabIndex={-1}
                            onLoad={handleVideoLoad}
                        />
                    </div>
                 </div>
            )}

            {/* --- LAYER 4: STUDY MODE --- */}
            {youtube.id && (
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden z-20 bg-black animate-in fade-in duration-500"
                    style={{ opacity: youtube.showPlayer ? 1 : 0 }}
                >
                    <iframe
                        src={studyModeSrc}
                        title="Study Mode Player"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.78vh]"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        tabIndex={0}
                    />
                    {!youtube.showControls && (
                        <div className="absolute inset-0 z-30" onContextMenu={protectMedia} />
                    )}
                </div>
            )}

            {/* --- LAYER 5: SOUNDSCAPES (Passed Helpers) --- */}
            {activeSounds.map(soundSrc => (
                <SoundPlayer
                    key={soundSrc}
                    src={soundSrc}
                    volume={soundVolumes[soundSrc] || 0.5}
                    isPlaying={isGlobalPlaying && audioAllowed} // Safety check
                    setSoundLoading={setSoundLoading}
                    reportAudioError={reportAudioError}
                />
            ))}
        </div>
    );
}