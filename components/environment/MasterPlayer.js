"use client";

import { useEnvironment } from '@/context/EnvironmentContext';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const SoundPlayer = ({ src, volume, isPlaying }) => {
    const audioRef = useRef(null);
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [volume, isPlaying, src]);
    return <audio ref={audioRef} src={src} loop />;
};

export default function MasterPlayer() {
    const { activeScene, activeSounds, soundVolumes, youtube, isGlobalPlaying, isLoaded } = useEnvironment();
    const videoRef = useRef(null);
    
    // --- STATE: POSTER SWAP ENGINE ---
    // We track if the video layer is actually ready to be shown.
    // Initially false, which keeps the static thumbnail visible.
    const [isVideoReady, setIsVideoReady] = useState(false);

    // Reset ready state when scene changes, so we show the new thumbnail immediately
    useEffect(() => {
        setIsVideoReady(false);
    }, [activeScene.id, activeScene.videoId]);

    // --- Audio/Video Playback Logic (Local Files) ---
    useEffect(() => {
        if (videoRef.current && activeScene.type === 'video') {
            if (isGlobalPlaying) {
                videoRef.current.play().catch(e => console.error("Video play failed:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isGlobalPlaying, activeScene]);

    // --- LOADING SHIELD ---
    // Only block the UI if the global context is completely missing
    if (!isLoaded) {
        return <div className="fixed inset-0 bg-black z-50 transition-opacity duration-700" />;
    }

    // --- Protection Helper ---
    const protectMedia = (e) => {
        e.preventDefault();
        return false;
    };

    // --- SOURCE CONSTRUCTION (THE SAFETY UPGRADE) ---
    
    // 1. Study Mode (Foreground) Player
    // STRICT RULE: Click-to-play is handled by the UI "Load" button.
    // Here we ensure it loads safely. 'mute=1' is the fail-safe.
    const studyModeSrc = youtube.id
        ? `https://www.youtube-nocookie.com/embed/${youtube.id}?autoplay=1&mute=${youtube.isMuted ? 1 : 0}&controls=${youtube.showControls ? 1 : 0}&rel=0&showinfo=0&modestbranding=1&playsinline=1&loop=1&playlist=${youtube.id}&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
        : "";

    // 2. Background (Animated Scene) Player
    // STRICT RULE: ALWAYS Muted Autoplay (mute=1). This is the "Shield" against bot checks.
    // We added 'iv_load_policy=3' to hide annotations.
    const bgYoutubeSrc = activeScene.type === 'youtube-scene'
        ? `https://www.youtube-nocookie.com/embed/${activeScene.videoId}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&playsinline=1&loop=1&playlist=${activeScene.videoId}&disablekb=1&fs=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
        : "";

    // Helper: Handle when YouTube iframe actually loads (Network level)
    const handleVideoLoad = () => {
        // We add a small "Safety Buffer" (500ms) to allow the player to initialize rendering
        // before we fade out the poster. This ensures NO black flash.
        setTimeout(() => {
            setIsVideoReady(true);
        }, 800);
    };

    return (
        <div 
            className="fixed inset-0 w-full h-full z-0 bg-black select-none"
            onContextMenu={protectMedia} 
        >
{/* --- LAYER 1: THE POSTER (Visual Anchor) --- */}
{(activeScene.type === 'image' || activeScene.type === 'youtube-scene' || activeScene.type === 'video') && (
                <div 
                    className={`absolute inset-0 z-10 transition-opacity duration-1000 ease-in-out pointer-events-none ${
                        // Logic: If it's a static image, always show.
                        // If video, fade out only when video is ready.
                        activeScene.type === 'image' ? 'opacity-100' : (isVideoReady ? 'opacity-0' : 'opacity-100')
                    }`}
                    // SAFETY LAYER 1: Dark background if image fails
                    style={{ backgroundColor: '#0f0f0f' }} 
                >
                     <Image
                        // SAFETY LAYER 2: Try the path, fallback to local placeholder if empty
                        src={activeScene.thumbnail || activeScene.path || '/placeholder.webp'}
                        alt="Background Ambience"
                        fill
                        priority
                        quality={90}
                        sizes="100vw"
                        className="object-cover"
                        draggable={false}
                        // SAFETY LAYER 3: If Supabase load fails, force switch to local fallback
                        onError={(e) => {
                            e.target.src = '/placeholder.webp'; // Ensure you have a public/placeholder.webp
                            e.target.srcset = '/placeholder.webp';
                        }}
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-black/20" />
                </div>
            )}

            {/* --- LAYER 2: LOCAL VIDEO ENGINE --- */}
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
                    onCanPlay={() => setIsVideoReady(true)} // Native video ready event
                />
            )}

            {/* --- LAYER 3: YOUTUBE BACKGROUND ENGINE (The Hybrid) --- */}
            {activeScene.type === 'youtube-scene' && (
                 <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh]">
                         <iframe
                            src={bgYoutubeSrc}
                            title="Background Ambience"
                            className="w-full h-full border-0 pointer-events-none"
                            allow="autoplay; encrypted-media"
                            tabIndex={-1}
                            referrerPolicy="strict-origin-when-cross-origin"
                            onLoad={handleVideoLoad} // Triggers the Poster Swap
                        />
                    </div>
                 </div>
            )}

            {/* --- LAYER 4: STUDY MODE FOREGROUND PLAYER (Custom Links) --- */}
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
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                    {!youtube.showControls && (
                        <div className="absolute inset-0 z-30" onContextMenu={protectMedia} />
                    )}
                </div>
            )}

            {/* --- LAYER 5: SOUNDSCAPES --- */}
            {activeSounds.map(soundSrc => (
                <SoundPlayer
                    key={soundSrc}
                    src={soundSrc}
                    volume={soundVolumes[soundSrc] || 0.5}
                    isPlaying={isGlobalPlaying}
                />
            ))}
        </div>
    );
}