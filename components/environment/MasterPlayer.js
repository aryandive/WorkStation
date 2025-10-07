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

    useEffect(() => {
        if (videoRef.current) {
            if (isGlobalPlaying) {
                if (videoRef.current.currentSrc || videoRef.current.src) {
                    videoRef.current.play().catch(e => console.error("Video play failed:", e));
                }
            } else {
                videoRef.current.pause();
            }
        }
    }, [isGlobalPlaying, activeScene]);

    const videoSrc = activeScene.type === 'video' ? activeScene.path : undefined;

    const youtubeSrc = youtube.id
        ? `https://www.youtube.com/embed/${youtube.id}?autoplay=1&mute=${youtube.isMuted ? 1 : 0}&controls=${youtube.showControls ? 1 : 0}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&playsinline=1&loop=1&playlist=${youtube.id}&fs=0&cc_load_policy=0&disablekb=${youtube.showControls ? 0 : 1}`
        : "";

    // When showing controls, ensure the iframe can receive keyboard focus so arrow keys work
    useEffect(() => {
        if (youtube.id && youtube.showControls && iframeRef.current) {
            try {
                iframeRef.current.focus();
            } catch (_) { }
        }
    }, [youtube.id, youtube.showControls]);

    // Minimal key handler: when controls are visible, focus the iframe on space/arrow keys
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!youtube.showControls || !iframeRef.current) return;
            if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // prevent page scroll and hand over to YouTube's own handler
                e.preventDefault();
                try { iframeRef.current.focus(); } catch (_) { }
            }
        };
        window.addEventListener('keydown', handleKeyDown, { passive: false });
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [youtube.showControls]);

    return (
        <div className="fixed inset-0 w-full h-full z-0 bg-black">
            {activeScene.type === 'image' && (
                <Image
                    key={activeScene.path}
                    src={activeScene.path}
                    alt="Background Scene"
                    fill
                    sizes="100vw"
                    className="object-cover animate-fade-in"
                    priority
                />
            )}

            <video
                ref={videoRef}
                key={videoSrc}
                src={videoSrc}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
                autoPlay={isGlobalPlaying}
                loop
                muted
                playsInline
                style={{ opacity: activeScene.type === 'video' ? 1 : 0 }}
            />

            {youtube.id && (
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden"
                    style={{ opacity: youtube.showPlayer ? 1 : 0, transition: 'opacity 500ms ease-in-out' }}
                    onContextMenu={(e) => e.preventDefault()} // Disable right-click context menu on the entire container
                >
                    <iframe
                        ref={iframeRef}
                        key={youtube.id + (youtube.showControls ? '_c' : '')}
                        src={youtubeSrc}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen={false}
                        tabIndex={0}
                        // The iframe is now always clickable, but the overlay will intercept clicks.
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '177.78vh',
                            height: '100vh',
                            minWidth: '100vw',
                            minHeight: '56.25vw',
                            border: 0,
                        }}
                    />
                    {/* Transparent overlay only when controls are hidden */}
                    {!youtube.showControls && (
                        <div
                            className="absolute top-0 left-0 right-0"
                            style={{
                                bottom: '0',
                                zIndex: 1,
                            }}
                        />
                    )}
                </div>
            )}

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

