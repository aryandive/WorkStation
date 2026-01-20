"use client";

import { useEnvironment } from '@/context/EnvironmentContext';
import { useEffect, useRef } from 'react';
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
    const { activeScene, activeSounds, soundVolumes, youtube, isGlobalPlaying } = useEnvironment();
    const videoRef = useRef(null);
    const iframeRef = useRef(null);
    const bgYoutubeRef = useRef(null);

    // --- Protection Helper ---
    const protectMedia = (e) => {
        e.preventDefault();
        return false;
    };

    // --- Audio/Video Playback Logic ---
    useEffect(() => {
        if (videoRef.current) {
            if (isGlobalPlaying && activeScene.type === 'video') {
                videoRef.current.play().catch(e => console.error("Video play failed:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isGlobalPlaying, activeScene]);

    // --- Construct Sources ---
    const localVideoSrc = activeScene.type === 'video' ? activeScene.path : null;
    
    // Foreground (Study Mode) Player
    const studyModeSrc = youtube.id
        ? `https://www.youtube.com/embed/${youtube.id}?autoplay=1&mute=${youtube.isMuted ? 1 : 0}&controls=${youtube.showControls ? 1 : 0}&rel=0&showinfo=0&modestbranding=1&playsinline=1&loop=1&playlist=${youtube.id}`
        : "";

    // Background (Animated Scene) Player
    const bgYoutubeSrc = activeScene.type === 'youtube-scene'
        ? `https://www.youtube.com/embed/${activeScene.videoId}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&playsinline=1&loop=1&playlist=${activeScene.videoId}&disablekb=1&fs=0`
        : "";

    return (
        <div 
            className="fixed inset-0 w-full h-full z-0 bg-black select-none"
            onContextMenu={protectMedia} // GLOBAL RIGHT CLICK BLOCK ON BG
        >
            
            {/* 1. STATIC IMAGE LAYER - Protected */}
            {activeScene.type === 'image' && activeScene.path && (
                <div className="absolute inset-0 animate-fade-in pointer-events-none user-select-none">
                     <Image
                        src={activeScene.path}
                        alt="Background Scene"
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                        draggable={false}
                        onContextMenu={protectMedia}
                        onDragStart={protectMedia}
                    />
                    {/* Transparent Shield Overlay for extra safety */}
                    <div className="absolute inset-0 z-10" />
                </div>
            )}

            {/* 2. LOCAL VIDEO LAYER - Protected */}
            <video
                ref={videoRef}
                key={localVideoSrc || 'no-video'}
                src={localVideoSrc}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out pointer-events-none"
                autoPlay={isGlobalPlaying}
                loop
                muted
                playsInline
                draggable={false}
                onContextMenu={protectMedia}
                style={{ opacity: activeScene.type === 'video' ? 1 : 0 }}
            />

            {/* 3. YOUTUBE BACKGROUND LAYER - Protected via pointer-events-none */}
            {activeScene.type === 'youtube-scene' && (
                 <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh]">
                         <iframe
                            ref={bgYoutubeRef}
                            src={bgYoutubeSrc}
                            title="Background Ambience"
                            className="w-full h-full border-0 pointer-events-none"
                            allow="autoplay; encrypted-media"
                        />
                    </div>
                    {/* Click Shield */}
                    <div className="absolute inset-0 z-50" onContextMenu={protectMedia} />
                 </div>
            )}

            {/* 4. FOREGROUND YOUTUBE PLAYER (Study Mode) */}
            {youtube.id && (
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden z-10"
                    style={{ opacity: youtube.showPlayer ? 1 : 0, transition: 'opacity 500ms ease-in-out' }}
                >
                    <iframe
                        ref={iframeRef}
                        src={studyModeSrc}
                        title="Study Mode Player"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.78vh]"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        tabIndex={0}
                    />
                    {!youtube.showControls && (
                        <div className="absolute inset-0 z-20" onContextMenu={protectMedia} />
                    )}
                </div>
            )}

            {/* 5. SOUND LAYERS */}
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