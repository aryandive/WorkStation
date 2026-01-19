"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useEnvironment } from '@/context/EnvironmentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
    X, Youtube, Video, Music, Volume2, VolumeX, ImageIcon, Info, Timer,
    CloudRain, Flame, Wind, Waves, CloudLightning, Trees, Radio, Sparkles, Moon,
    Link as LinkIcon, Monitor, Play, MonitorPlay, Settings2,
    Library, Bookmark, Trash2, Plus, Loader2, FolderHeart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getYoutubeId } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Fallback helper
function localGetYoutubeId(url) {
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

// UPDATED LIST (11 Items now)
const curatedYoutube = [
    { name: 'Lofi Hip Hop', url: 'https://www.youtube.com/watch?v=sAkVnhthpMI', thumbnail: 'https://img.youtube.com/vi/sAkVnhthpMI/mqdefault.jpg' },
    { name: 'Ambient Space', url: 'https://www.youtube.com/watch?v=0nTO4zSEpOs', thumbnail: 'https://img.youtube.com/vi/0nTO4zSEpOs/mqdefault.jpg' },
    { name: 'Rainy Cafe', url: 'https://www.youtube.com/watch?v=Ze42hH2GzHc', thumbnail: 'https://img.youtube.com/vi/Ze42hH2GzHc/mqdefault.jpg' },
    { name: 'Forest Sounds', url: 'https://www.youtube.com/watch?v=QZl_HuHjfnQ', thumbnail: 'https://img.youtube.com/vi/QZl_HuHjfnQ/mqdefault.jpg' },
    { name: 'Cozy Rain Library', url: 'https://youtu.be/qe3l1rvJMlA?si=P9rZLhDHygoh3bC0', thumbnail: 'https://img.youtube.com/vi/qe3l1rvJMlA/mqdefault.jpg' },
    { name: 'Magical Library', url: 'https://youtu.be/t822he3vtLE?si=Y-fm_Toe9c76A6hJ', thumbnail: 'https://img.youtube.com/vi/t822he3vtLE/mqdefault.jpg' },
    { name: 'Night Cafe', url: 'https://youtu.be/mXpLHdYhMKA?si=MiyYNGoPed9nSmbs', thumbnail: 'https://img.youtube.com/vi/mXpLHdYhMKA/mqdefault.jpg' },
    { name: 'Lofi Girl Radio', url: 'https://www.youtube.com/live/qlSWhX_4slI?si=JS2hUuiujfv_YNXj', thumbnail: 'https://img.youtube.com/vi/qlSWhX_4slI/mqdefault.jpg' },
    // 3 NEW REQUESTED VIDEOS
    { name: 'Valley of Dreams', url: 'https://youtu.be/e5pGt1-Wy04?si=NpwZGbU0JFQWiE8n', thumbnail: 'https://img.youtube.com/vi/e5pGt1-Wy04/mqdefault.jpg' },
    { name: 'Lofi Cat', url: 'https://youtu.be/sR6tjNq8Ywk?si=bJ78cnu5b_Zv0EHh', thumbnail: 'https://img.youtube.com/vi/sR6tjNq8Ywk/mqdefault.jpg' },
    { name: 'Deep Focus', url: 'https://youtu.be/sUwD3GRPJos?si=HzK87cFUtVqTq4Eu', thumbnail: 'https://img.youtube.com/vi/sUwD3GRPJos/mqdefault.jpg' },
];

const soundscapes = [
    { name: 'Rain', path: '/sounds/rain.mp3', icon: CloudRain },
    { name: 'Fireplace', path: '/sounds/fireplace.mp3', icon: Flame },
    { name: 'Windy', path: '/sounds/windy.mp3', icon: Wind },
    { name: 'Waves', path: '/sounds/wave.mp3', icon: Waves },
    { name: 'Thunder', path: '/sounds/thunderstorm.mp3', icon: CloudLightning },
    { name: 'Nature', path: '/sounds/nature.mp3', icon: Trees },
    { name: 'White Noise', path: '/sounds/whitenoise.mp3', icon: Radio },
    { name: 'Night', path: '/sounds/night.mp3', icon: Moon },
];

const MAX_SAVED_VIDEOS = 10;

export default function EnvironmentPanel({ isOpen, setIsOpen }) {
    const {
        activeScene, activeSounds, soundVolumes, youtube,
        playScene, toggleSound, changeVolume, playYoutube, stopYoutube,
        setYoutubeShowPlayer, setYoutubeMute, setYoutubeShowControls
    } = useEnvironment();
    const [activeTab, setActiveTab] = useState('scenes');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeError, setYoutubeError] = useState('');
    
    // LIBRARY STATE
    const [savedVideos, setSavedVideos] = useState([]);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false); // Controls visibility
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const supabase = createClient();

    // Fetch Library
    const fetchLibrary = useCallback(async () => {
        setIsLoadingLibrary(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('user_videos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (data) setSavedVideos(data);
            if (error) console.error("Error fetching library:", error);
        }
        setIsLoadingLibrary(false);
    }, [supabase]);

    useEffect(() => {
        if (isOpen && activeTab === 'youtube') {
            fetchLibrary();
        }
    }, [isOpen, activeTab, fetchLibrary]);

    const handleYoutubePlay = (url) => {
        setYoutubeError('');
        const success = playYoutube(url, { isCustom: true });
        if (success) {
            setYoutubeUrl('');
        } else {
            setYoutubeError('Invalid YouTube URL.');
        }
    };

    const handleSaveToLibrary = async () => {
        if (savedVideos.length >= MAX_SAVED_VIDEOS) {
            setYoutubeError(`Limit reached (${MAX_SAVED_VIDEOS}). Delete videos to save more.`);
            return;
        }

        const videoId = typeof getYoutubeId === 'function' ? getYoutubeId(youtubeUrl) : localGetYoutubeId(youtubeUrl);
        if (!videoId) {
            setYoutubeError('Invalid YouTube URL.');
            return;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setYoutubeError('Sign in to save videos.');
                setIsSaving(false);
                return;
            }

            const exists = savedVideos.some(v => v.video_id === videoId);
            if (exists) {
                setYoutubeError('Already in library.');
                setIsSaving(false);
                return;
            }

            const newVideo = {
                user_id: user.id,
                video_id: videoId,
                url: youtubeUrl,
                title: `Custom Video ${savedVideos.length + 1}`, 
                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
            };

            const { data, error } = await supabase.from('user_videos').insert([newVideo]).select();
            if (error) throw error;
            if (data) {
                setSavedVideos(prev => [data[0], ...prev]);
                setYoutubeUrl('');
                setYoutubeError('');
                setIsLibraryOpen(true); // Auto-open library on save
            }
        } catch (error) {
            console.error("Error saving:", error);
            setYoutubeError('Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFromLibrary = async (id, e) => {
        e.stopPropagation();
        const { error } = await supabase.from('user_videos').delete().eq('id', id);
        if (!error) {
            setSavedVideos(prev => prev.filter(v => v.id !== id));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900/80 backdrop-blur-md border-gray-700 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-2xl font-bold text-yellow-400">Environment</DialogTitle></DialogHeader>

                <div className="border-b border-gray-700 sticky top-0 bg-gray-900/95 z-10 pt-2">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('scenes')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'scenes' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}><Video size={16} /> Scenes</button>
                        <button onClick={() => setActiveTab('youtube')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'youtube' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}><Youtube size={16} /> YouTube</button>
                        <button onClick={() => setActiveTab('soundscapes')} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'soundscapes' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}><Music size={16} /> Soundscapes</button>
                    </nav>
                </div>

                <div className="py-4 min-h-[300px]">
                    {activeTab === 'scenes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Pro Tip Banner */}
                            <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <MonitorPlay className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="text-sm text-gray-300">
                                    <h4 className="font-semibold text-white mb-1">Study Mode</h4>
                                    <p className="opacity-90">Paste a lecture or tutorial link below. Enable <strong>Controls</strong> to pause/rewind.</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-300 mb-3">Curated Playlists</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Render Curated Videos */}
                                    {curatedYoutube.map(yt => {
                                        const id = typeof getYoutubeId === 'function' ? getYoutubeId(yt.url) : localGetYoutubeId(yt.url);
                                        return (
                                            <SceneButton
                                                key={yt.url}
                                                scene={{ ...yt, type: 'youtube' }}
                                                isActive={youtube.id === id}
                                                onClick={() => playYoutube(yt.url, { isCustom: false })}
                                            />
                                        );
                                    })}

                                    {/* 12th ITEM: Your Library Toggle Button */}
                                    <button
                                        onClick={() => setIsLibraryOpen(prev => !prev)}
                                        className={cn(
                                            "rounded-lg border-2 border-dashed transition-all group flex flex-col items-center justify-center relative aspect-[16/9] hover:bg-gray-800",
                                            isLibraryOpen ? "border-yellow-400 bg-gray-800" : "border-gray-700"
                                        )}
                                    >
                                        <div className={cn("p-3 rounded-full mb-2 transition-colors", isLibraryOpen ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-400 group-hover:bg-gray-700")}>
                                            <FolderHeart size={24} />
                                        </div>
                                        <p className={cn("text-xs font-medium", isLibraryOpen ? "text-yellow-400" : "text-gray-400 group-hover:text-white")}>
                                            Your Library
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* CONDITIONAL LIBRARY SECTION */}
                            {isLibraryOpen && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                                                <Bookmark size={16} /> Saved Videos
                                            </h4>
                                            <span className={cn("text-xs px-2 py-0.5 rounded-full border", 
                                                savedVideos.length >= MAX_SAVED_VIDEOS ? "border-red-500 text-red-400" : "border-gray-700 text-gray-400"
                                            )}>
                                                {savedVideos.length} / {MAX_SAVED_VIDEOS}
                                            </span>
                                        </div>

                                        {isLoadingLibrary ? (
                                            <div className="flex justify-center p-8 text-gray-500"><Loader2 className="animate-spin" /></div>
                                        ) : savedVideos.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {savedVideos.map(vid => (
                                                    <div key={vid.id} className="relative group">
                                                        {/* FIX: Mapped title to name here */}
                                                        <SceneButton
                                                            scene={{ ...vid, name: vid.title, type: 'youtube' }}
                                                            isActive={youtube.id === vid.video_id}
                                                            onClick={() => playYoutube(vid.url, { isCustom: false })}
                                                        />
                                                        <button 
                                                            onClick={(e) => handleDeleteFromLibrary(vid.id, e)}
                                                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                            title="Remove from library"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                                                <p className="text-gray-500 text-sm">Library is empty. Paste a URL below to save.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Custom Video Input Section */}
                            <div className="pt-4 border-t border-gray-700">
                                <h4 className="font-semibold text-gray-300 flex items-center gap-2 mb-3">
                                    <LinkIcon size={16} /> Custom Video Source
                                </h4>

                                <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700 space-y-4">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                placeholder="Paste any YouTube URL..."
                                                value={youtubeUrl}
                                                onChange={(e) => { setYoutubeUrl(e.target.value); setYoutubeError(''); }}
                                                className={cn("bg-gray-900/50 border-gray-600 pl-9", youtubeError && "border-red-500")}
                                            />
                                            <Youtube className="absolute left-3 top-2.5 text-gray-500 h-4 w-4" />
                                        </div>
                                        
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        onClick={handleSaveToLibrary} 
                                                        variant="secondary"
                                                        disabled={isSaving || savedVideos.length >= MAX_SAVED_VIDEOS}
                                                        className={cn("gap-2", savedVideos.length >= MAX_SAVED_VIDEOS && "opacity-50 cursor-not-allowed")}
                                                    >
                                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
                                                    </Button>
                                                </TooltipTrigger>
                                                {savedVideos.length >= MAX_SAVED_VIDEOS && (
                                                    <TooltipContent>
                                                        <p>Limit Reached</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>

                                        <Button onClick={() => handleYoutubePlay(youtubeUrl)} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                                            <Play size={16} fill="currentColor" /> Load
                                        </Button>
                                    </div>
                                    {youtubeError && <p className="text-xs text-red-400 px-1">{youtubeError}</p>}

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-gray-900/50 rounded-lg">
                                        <div className="flex items-center justify-between gap-2 px-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Monitor size={16} /> <Label htmlFor="show-player" className="cursor-pointer">Video</Label>
                                            </div>
                                            <Switch id="show-player" checked={youtube.showPlayer} onCheckedChange={setYoutubeShowPlayer} />
                                        </div>

                                        <div className="flex items-center justify-between gap-2 px-2 border-l-0 sm:border-l border-gray-700">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                {youtube.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                                <Label htmlFor="mute-yt" className="cursor-pointer">Muted</Label>
                                            </div>
                                            <Switch id="mute-yt" checked={youtube.isMuted} onCheckedChange={setYoutubeMute} />
                                        </div>

                                        <div className="flex items-center justify-between gap-2 px-2 border-l-0 sm:border-l border-gray-700">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Settings2 size={16} />
                                                <Label htmlFor="controls-yt" className="cursor-pointer">Controls</Label>
                                            </div>
                                            <Switch id="controls-yt" checked={youtube.showControls} onCheckedChange={setYoutubeShowControls} />
                                        </div>
                                    </div>

                                    {youtube.id && (
                                        <Button onClick={stopYoutube} variant="outline" size="sm" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                            Stop YouTube Playback
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'soundscapes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Mix & Match Tip Section */}
                            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="text-sm text-gray-300">
                                    <h4 className="font-semibold text-white mb-1">Create Your Atmosphere</h4>
                                    <p className="mb-2">Combine sounds and scenes to maximize your experience:</p>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs opacity-90">
                                        <li className="flex items-center gap-2">🔥 <span className="font-medium">Fire</span> + 🌲 <span className="font-medium">Nature</span> = <span className="text-yellow-300">Jungle Campfire</span></li>
                                        <li className="flex items-center gap-2">⛈️ <span className="font-medium">Thunder</span> + 🌧️ <span className="font-medium">Rain</span> + 🏠 <span className="text-purple-300">Cozy Room Video</span></li>
                                        <li className="flex items-center gap-2">🌊 <span className="font-medium">Waves</span> + 💨 <span className="font-medium">Wind</span> = <span className="text-blue-300">Ocean Breeze</span></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Sound Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {soundscapes.map(sound => {
                                    const isActive = activeSounds.includes(sound.path);
                                    const volume = soundVolumes[sound.path] || 0.5;
                                    const Icon = sound.icon;

                                    return (
                                        <div
                                            key={sound.path}
                                            className={cn(
                                                "relative group rounded-xl border-2 transition-all duration-300 overflow-hidden",
                                                isActive
                                                    ? "border-yellow-400 bg-yellow-950/20"
                                                    : "border-gray-700 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800"
                                            )}
                                        >
                                            <button
                                                onClick={() => toggleSound(sound.path)}
                                                className="w-full p-4 flex flex-col items-center gap-3 text-center"
                                            >
                                                <div className={cn(
                                                    "p-3 rounded-full transition-colors",
                                                    isActive ? "bg-yellow-400 text-black" : "bg-gray-700 text-gray-400 group-hover:text-white"
                                                )}>
                                                    <Icon size={24} />
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    isActive ? "text-yellow-400" : "text-gray-400 group-hover:text-gray-200"
                                                )}>
                                                    {sound.name}
                                                </span>
                                            </button>

                                            {/* Volume Slider - Slides up when active */}
                                            <div className={cn(
                                                "px-4 pb-4 pt-0 transition-all duration-300 origin-top",
                                                isActive ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden"
                                            )}>
                                                <div className="flex items-center gap-2">
                                                    <VolumeX size={14} className="text-yellow-400/50" />
                                                    <Slider
                                                        value={[volume * 100]}
                                                        onValueChange={([val]) => changeVolume(sound.path, val / 100)}
                                                        className="w-full cursor-pointer"
                                                        max={100}
                                                        step={1}
                                                    />
                                                    <Volume2 size={14} className="text-yellow-400" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// FIX: Added '|| "Scene"' fallback to alt prop to prevent undefined error
function SceneButton({ scene, isActive, onClick }) {
    return (
        <button onClick={onClick} className={cn("rounded-lg overflow-hidden border-2 transition-all group relative w-full", isActive ? "border-yellow-400 ring-2 ring-yellow-400/50" : "border-transparent hover:border-gray-600")}>
            <div className="relative aspect-[16/9] w-full">
                <Image src={scene.thumbnail || '/placeholder.jpg'} alt={scene.name || 'Scene'} fill sizes="(max-width: 768px) 33vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs font-medium text-center text-white truncate px-1">{scene.name || 'Untitled'}</p>
            </div>
        </button>
    );
}