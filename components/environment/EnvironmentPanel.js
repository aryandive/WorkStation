"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useEnvironment } from '@/context/EnvironmentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { X, Youtube, Video, Music, Volume2, VolumeX, ImageIcon, Info, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// helper duplicated here for client-side checks in the panel
function getYoutubeId(url) {
    try {
        const u = new URL(url);
        const host = u.hostname;
        if (host.includes('youtu.be')) {
            return u.pathname.split('/').filter(Boolean)[0] || null;
        }
        if (host.includes('youtube.com')) {
            if (u.searchParams.get('v')) return u.searchParams.get('v');
            const path = u.pathname.split('/').filter(Boolean);
            if (path[0] === 'shorts' && path[1]) return path[1];
            if (path[0] === 'embed' && path[1]) return path[1];
        }
    } catch (e) { return null; }
    return null;
}

const scenes = [
    { name: 'Cosy Room', type: 'video', path: '/videos/cosy.mp4', thumbnail: '/Images/thumbnails/cosy-room.jpg' },
    { name: 'New Video', type: 'video', path: '/videos/video1.mp4', thumbnail: '/Images/thumbnails/video1.jpg' },
];
const images = [
    { name: 'Forest Path', type: 'image', path: '/Images/lion.jpg', thumbnail: '/Images/thumbnails/lion.jpg' },
    { name: 'Night Sky', type: 'image', path: '/Images/mountain.jpg', thumbnail: '/Images/thumbnails/mountain.jpg' },
];
const curatedYoutube = [
    { name: 'Lofi Hip Hop', url: 'https://www.youtube.com/watch?v=sAkVnhthpMI', thumbnail: 'https://img.youtube.com/vi/sAkVnhthpMI/mqdefault.jpg' },
    { name: 'Ambient Space', url: 'https://www.youtube.com/watch?v=0nTO4zSEpOs', thumbnail: 'https://img.youtube.com/vi/0nTO4zSEpOs/mqdefault.jpg' },
    { name: 'Rainy Cafe', url: 'https://www.youtube.com/watch?v=Ze42hH2GzHc', thumbnail: 'https://img.youtube.com/vi/Ze42hH2GzHc/mqdefault.jpg' },
    { name: 'Forest Sounds', url: 'https://www.youtube.com/watch?v=QZl_HuHjfnQ', thumbnail: 'https://img.youtube.com/vi/QZl_HuHjfnQ/mqdefault.jpg' },
];
const soundscapes = [
    { name: 'Rain', path: '/sounds/rain.mp3' },
    { name: 'Fireplace', path: '/sounds/fireplace.mp3' },
    { name: 'Windy', path: '/sounds/windy.mp3' },
    { name: 'Waves', path: '/sounds/wave.mp3' },
    { name: 'Thunderstorm', path: '/sounds/thunderstorm.mp3' },
    { name: 'Nature', path: '/sounds/nature.mp3' },
    { name: 'White Noise', path: '/sounds/whitenoise.mp3' },
];

// --- Main Environment Panel Component ---
export default function EnvironmentPanel({ isOpen, setIsOpen }) {
    const {
        activeScene, activeSounds, soundVolumes, youtube,
        playScene, toggleSound, changeVolume, playYoutube, stopYoutube,
        setYoutubeShowPlayer, setYoutubeMute, setYoutubeShowControls
    } = useEnvironment();
    const [activeTab, setActiveTab] = useState('scenes');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeError, setYoutubeError] = useState('');

    const handleYoutubePlay = (url) => {
        setYoutubeError('');
        // Pass isCustom: true for custom videos
        const success = playYoutube(url, { isCustom: true });
        if (success) {
            setYoutubeUrl('');
        } else {
            setYoutubeError('Invalid YouTube URL.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900/80 backdrop-blur-md border-gray-700 text-white max-w-3xl">
                <DialogHeader><DialogTitle className="text-2xl font-bold text-yellow-400">Environment</DialogTitle></DialogHeader>

                <div className="border-b border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('scenes')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'scenes' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}><Video size={16} /> Scenes</button>
                        <button onClick={() => setActiveTab('youtube')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'youtube' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}><Youtube size={16} /> YouTube</button>
                        <button onClick={() => setActiveTab('soundscapes')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'soundscapes' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}><Music size={16} /> Soundscapes</button>
                    </nav>
                </div>

                <div className="py-4 min-h-[300px]">
                    {activeTab === 'scenes' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-3 flex items-center gap-2"><Video size={16} /> Animated Scenes</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {scenes.map(s => (<SceneButton key={s.path} scene={s} isActive={activeScene.path === s.path} onClick={() => playScene(s)} />))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-3 flex items-center gap-2"><ImageIcon size={16} /> Static Images</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {images.map(img => (<SceneButton key={img.path} scene={img} isActive={activeScene.path === img.path} onClick={() => playScene(img)} />))}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'youtube' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-3">Curated Playlists</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {curatedYoutube.map(yt => {
                                        const id = getYoutubeId(yt.url);
                                        return (
                                            <SceneButton
                                                key={yt.url}
                                                scene={{ ...yt, type: 'youtube' }}
                                                isActive={youtube.id === id}
                                                onClick={() => playYoutube(yt.url, { isCustom: false })} // Pass isCustom: false
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-gray-700">
                                <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                                    Custom
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info size={16} className="text-gray-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-gray-800 text-white border-gray-700 max-w-xs">
                                                <p>Paste any YouTube video or playlist URL to create your custom ambiance. You can enable time controls for watching lectures or educational videos within your focus environment.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </h4>
                                <Input placeholder="Paste any YouTube URL..." value={youtubeUrl} onChange={(e) => { setYoutubeUrl(e.target.value); setYoutubeError(''); }} className={cn("bg-gray-800 border-gray-700", youtubeError && "border-red-500")} />
                                {youtubeError && <p className="text-xs text-red-400">{youtubeError}</p>}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center space-x-2"><Switch id="show-player" checked={youtube.showPlayer} onCheckedChange={setYoutubeShowPlayer} /><Label htmlFor="show-player">Show Video</Label></div>
                                        <div className="flex items-center space-x-2"><Switch id="mute-yt" checked={youtube.isMuted} onCheckedChange={setYoutubeMute} /><Label htmlFor="mute-yt">Mute Sound</Label></div>
                                        <div className="flex items-center space-x-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", youtube.showControls && "bg-yellow-500/20 text-yellow-400")} onClick={() => setYoutubeShowControls(!youtube.showControls)}>
                                                            <Timer size={16} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                                        <p>Toggle Video Controls (Progress Bar)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                    <Button onClick={() => handleYoutubePlay(youtubeUrl)} className="bg-red-600 hover:bg-red-700 text-white">Play</Button>
                                </div>
                                {youtube.id && (<Button onClick={stopYoutube} variant="outline" size="sm" className="w-full">Stop YouTube</Button>)}
                            </div>
                        </div>
                    )}
                    {activeTab === 'soundscapes' && (
                        <div className="space-y-4 animate-fade-in">
                            {soundscapes.map(sound => {
                                const isActive = activeSounds.includes(sound.path);
                                const volume = soundVolumes[sound.path] || 0.5;
                                return (
                                    <div key={sound.path} className="p-3 bg-gray-800/50 rounded-lg transition-all duration-300">
                                        <div className="flex items-center justify-between"><Label htmlFor={sound.name}>{sound.name}</Label><Switch id={sound.name} checked={isActive} onCheckedChange={() => toggleSound(sound.path)} /></div>
                                        {isActive && (
                                            <div className="flex items-center gap-2 mt-3 animate-fade-in">
                                                <VolumeX size={16} className="text-gray-400" /><Slider value={[volume * 100]} onValueChange={([val]) => changeVolume(sound.path, val / 100)} className="w-full" /><Volume2 size={16} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SceneButton({ scene, isActive, onClick }) {
    return (
        <button onClick={onClick} className={cn("rounded-lg overflow-hidden border-2 transition-all group relative", isActive ? "border-yellow-400 ring-2 ring-yellow-400/50" : "border-transparent hover:border-gray-600")}>
            <div className="relative aspect-[16/9]">
                <Image src={scene.thumbnail} alt={scene.name} fill sizes="(max-width: 768px) 33vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <p className="text-xs p-1 bg-black/50 absolute bottom-0 w-full text-center font-medium">{scene.name}</p>
        </button>
    );
}

