"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useEnvironment } from '@/context/EnvironmentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
    X, Youtube, Video, Music, Volume2, VolumeX, ImageIcon, Info, Timer,
    CloudRain, Flame, Wind, Waves, CloudLightning, Trees, Radio, Sparkles, Moon,
    Link as LinkIcon, Monitor, Play, MonitorPlay, Settings2, Bookmark, Trash2, Loader2,
    ChevronDown, ChevronUp, LayoutGrid, Image as LucideImage, Plus, HardDrive, AlertCircle, Wifi, ArrowDownToLine
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ANIMATED_SCENES, STATIC_CATEGORIES, STATIC_IMAGES } from '@/lib/environmentConfig';
import { ASSET_TIERS } from '@/lib/environmentAssets';
import { PremiumGate } from '@/components/system/PremiumGate';
import { useAccess } from '@/hooks/useAccess';
import { createClient } from '@/utils/supabase/client';

// --- IndexedDB Helpers ---
const DB_NAME = 'EnvironmentAssetsDB';
const DB_VERSION = 1;

const initDB = () => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('custom_videos')) db.createObjectStore('custom_videos', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('custom_images')) db.createObjectStore('custom_images', { keyPath: 'id' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveToDB = async (storeName, item) => {
    const db = await initDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);
        tx.oncomplete = () => resolve(item);
        tx.onerror = () => reject(tx.error);
    });
};

const getAllFromDB = async (storeName) => {
    const db = await initDB();
    if (!db) return [];
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const deleteFromDB = async (storeName, id) => {
    const db = await initDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

// --- Helper Functions ---
function localGetYoutubeId(url) {
    try {
        if (!url) return null;
        const u = new URL(url);
        const host = u.hostname;
        if (host.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || null;
        if (host.includes('youtube.com')) {
            if (u.searchParams.get('v')) return u.searchParams.get('v');
            const path = u.pathname.split('/').filter(Boolean);
            if (path[0] === 'shorts' && path[1]) return path[1];
            if (path[0] === 'embed' && path[1]) return path[1];
        }
    } catch (e) { return null; }
    return null;
}

// --- Constants ---
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

const curatedYoutube = [
    { name: 'Lofi Hip Hop', url: 'https://www.youtube.com/watch?v=sAkVnhthpMI', thumbnail: 'https://img.youtube.com/vi/sAkVnhthpMI/mqdefault.jpg' },
    { name: 'Ambient Space', url: 'https://www.youtube.com/watch?v=0nTO4zSEpOs', thumbnail: 'https://img.youtube.com/vi/0nTO4zSEpOs/mqdefault.jpg' },
    { name: 'Rainy Cafe', url: 'https://www.youtube.com/watch?v=Ze42hH2GzHc', thumbnail: 'https://img.youtube.com/vi/Ze42hH2GzHc/mqdefault.jpg' },
    { name: 'Forest Sounds', url: 'https://www.youtube.com/watch?v=QZl_HuHjfnQ', thumbnail: 'https://img.youtube.com/vi/QZl_HuHjfnQ/mqdefault.jpg' },
    { name: 'Cozy Rain Library', url: 'https://youtu.be/qe3l1rvJMlA?si=P9rZLhDHygoh3bC0', thumbnail: 'https://img.youtube.com/vi/qe3l1rvJMlA/mqdefault.jpg' },
    { name: 'Magical Library', url: 'https://youtu.be/t822he3vtLE?si=Y-fm_Toe9c76A6hJ', thumbnail: 'https://img.youtube.com/vi/t822he3vtLE/mqdefault.jpg' },
    { name: 'Deep Focus', url: 'https://youtu.be/sUwD3GRPJos?si=HzK87cFUtVqTq4Eu', thumbnail: 'https://img.youtube.com/vi/sUwD3GRPJos/mqdefault.jpg' },
];

const MAX_SAVED_VIDEOS = 10;
const MAX_CUSTOM_SCENES = 5;
const MAX_CUSTOM_IMAGES = 12;

// --- Sub-Components (Clean Code) ---

const HighDataDisclaimer = ({ isBottom, onDismiss }) => (
    <div className={cn(
        "bg-yellow-950/30 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-3 transition-all duration-500",
        isBottom ? "mb-0 mt-8 animate-in fade-in slide-in-from-top-4" : "mb-6 animate-in fade-in slide-in-from-top-1"
    )}>
        <div className="p-2 bg-yellow-500/10 rounded-lg shrink-0">
            <Wifi className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="text-sm text-gray-300 flex-1">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white mb-0.5">High Quality Streaming</h4>
                {!isBottom && (
                    <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                )}
            </div>
            <p className="opacity-90 text-xs leading-relaxed">
                This setting uses highest quality video for maximum immersion.
                Animated scenes require significant data to run smoothly.
                We recommend <strong>Wi-Fi</strong> or switching to <strong>Static Backgrounds</strong> if you have limited internet speed.
            </p>
        </div>
    </div>
);

const StudyModeTip = ({ isBottom, onDismiss }) => (
    <div className={cn(
        "bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 transition-all duration-500",
        isBottom ? "mb-0 mt-8 animate-in fade-in slide-in-from-top-4" : "mb-0 animate-in fade-in slide-in-from-top-1"
    )}>
        <div className="p-2 bg-red-500/10 rounded-lg shrink-0">
            <MonitorPlay className="w-5 h-5 text-red-400" />
        </div>
        <div className="text-sm text-gray-300 flex-1">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white mb-1">Study Mode</h4>
                {!isBottom && (
                    <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                )}
            </div>
            <p className="opacity-90">Paste a lecture or tutorial link below. <span className="text-red-400 font-semibold">Tip:</span> Use longer videos (1 hour+) for uninterrupted focus.</p>
        </div>
    </div>
);

function SceneButton({ scene, isActive, onClick }) {
    const preventTheft = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const renderMedia = () => {
        if (scene.type === 'video') {
            return (
                <video
                    src={scene.url}
                    className="object-cover w-full h-full select-none"
                    muted
                    loop
                    onMouseOver={e => e.target.play().catch(() => { })}
                    onMouseOut={e => e.target.pause()}
                    onContextMenu={preventTheft}
                    onDragStart={preventTheft}
                    draggable={false}
                />
            );
        }
        return (
            <Image
                src={scene.thumbnail || '/placeholder.webp'}
                alt={scene.name || 'Scene'}
                fill
                sizes="(max-width: 768px) 33vw, 20vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                onContextMenu={preventTheft}
                onDragStart={preventTheft}
                draggable={false}
            />
        );
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded-lg overflow-hidden border-2 transition-all group relative aspect-[16/9] w-full select-none",
                isActive ? "border-yellow-400 ring-2 ring-yellow-400/50" : "border-transparent hover:border-gray-600 bg-black/40"
            )}
            onContextMenu={preventTheft}
        >
            {renderMedia()}
            {/* z-20 layer for protection */}
            <div className="absolute inset-0 z-20" onContextMenu={preventTheft} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 z-30 pointer-events-none">
                <p className="text-xs font-medium text-center text-white truncate">{scene.name}</p>
            </div>
        </button>
    );
}

// --- Main Component ---

export default function EnvironmentPanel({ isOpen, setIsOpen }) {
    const {
        activeScene, activeSounds, soundVolumes, youtube,
        playScene, toggleSound, changeVolume, playYoutube, stopYoutube,
        setYoutubeShowPlayer, setYoutubeMute, setYoutubeShowControls, loadingSounds
    } = useEnvironment();

    const { getCurrentTier } = useAccess();

    const [activeTab, setActiveTab] = useState('scenes');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeError, setYoutubeError] = useState('');

    // --- Scenes Tab State ---
    const [isAnimatedExpanded, setIsAnimatedExpanded] = useState(false);
    const [activeImageCategory, setActiveImageCategory] = useState('all');

    // --- Custom Local Assets State ---
    const [customScenes, setCustomScenes] = useState([]);
    const [customImages, setCustomImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    // --- Library State ---
    const [savedVideos, setSavedVideos] = useState([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    // --- UX State: Banner Positions ---
    const [dataDisclaimerAtBottom, setDataDisclaimerAtBottom] = useState(false);
    const [studyTipAtBottom, setStudyTipAtBottom] = useState(false);
    const [preferencesLoaded, setPreferencesLoaded] = useState(false);

    // Initialize Preferences from LocalStorage on Mount
    useEffect(() => {
        const savedDataDisclaimer = localStorage.getItem('env_disclaimer_docked') === 'true';
        const savedStudyTip = localStorage.getItem('env_studytip_docked') === 'true';

        setDataDisclaimerAtBottom(savedDataDisclaimer);
        setStudyTipAtBottom(savedStudyTip);
        setPreferencesLoaded(true);
    }, []);

    // --- NEW: Entitlement Auditor (Graceful Degradation) ---
    useEffect(() => {
        // Find the fallback static background for Tier 0
        const TIER_0_FALLBACK = '/wallpaper/nature/pexels-pixabay-33109.webp';

        const auditorCheck = () => {
            if (!activeScene) return;

            // 1. Determine what the active scene is (either videoId or path)
            let currentAssetId = activeScene.path || activeScene.videoId;
            let currentCategory = activeScene.type === 'video' || (activeScene.type === 'image' && activeScene.path.startsWith('blob:')) ? 'custom' : 'scene';

            let lookupId = currentAssetId;

            // We need to do a reverse lookup if the path isn't the direct key (which it often isn't for scenes)
            if (ASSET_TIERS[lookupId] === undefined) {
                // Need to scan ANIMATED_SCENES and STATIC_IMAGES to find the ID based on path/videoId
                const animMatch = ANIMATED_SCENES.find(a => a.videoId === currentAssetId);
                if (animMatch) {
                    lookupId = animMatch.id;
                } else {
                    const staticMatch = STATIC_IMAGES.find(s => s.src === currentAssetId);
                    if (staticMatch) {
                        lookupId = staticMatch.id;
                    }
                }
            }

            // Extract the required tier
            const requiredTier = ASSET_TIERS.getTier(lookupId, currentCategory);
            const userTier = getCurrentTier();

            // 2. If they are in a state they shouldn't be, gracefully reset
            if (requiredTier > userTier) {
                console.warn(`Entitlement Auditor: Active scene requires Tier ${requiredTier}, but user is Tier ${userTier}. Resetting.`);
                playScene({ type: 'image', path: TIER_0_FALLBACK });
            }
        };

        auditorCheck();
    }, [getCurrentTier, activeScene, playScene]);

    // Handlers for Dismissing Banners
    const dismissDataDisclaimer = () => {
        setDataDisclaimerAtBottom(true);
        localStorage.setItem('env_disclaimer_docked', 'true');
    };

    const dismissStudyTip = () => {
        setStudyTipAtBottom(true);
        localStorage.setItem('env_studytip_docked', 'true');
    };

    // Load Local Custom Assets on Mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const loadAssets = async () => {
                try {
                    const scenes = await getAllFromDB('custom_videos');
                    const images = await getAllFromDB('custom_images');

                    const scenesWithUrls = scenes.map(s => ({ ...s, url: URL.createObjectURL(s.blob) }));
                    const imagesWithUrls = images.map(i => ({ ...i, url: URL.createObjectURL(i.blob) }));

                    setCustomScenes(scenesWithUrls);
                    setCustomImages(imagesWithUrls);
                } catch (e) {
                    console.error("Failed to load local assets:", e);
                }
            };
            loadAssets();
        }
    }, []);

    // Fetch Library (Only if YouTube tab is active)
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

    // --- Asset Upload Handlers ---
    const handleSceneUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (customScenes.length >= MAX_CUSTOM_SCENES) return;

        if (!file.type.startsWith('video/')) {
            alert('Please select a video file.');
            return;
        }

        setIsUploading(true);
        try {
            const newAsset = {
                id: `scene_${Date.now()}`,
                blob: file,
                name: file.name,
                created: Date.now()
            };
            await saveToDB('custom_videos', newAsset);

            const url = URL.createObjectURL(file);
            setCustomScenes(prev => [...prev, { ...newAsset, url }]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to save video. Storage might be full.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (customImages.length >= MAX_CUSTOM_IMAGES) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        setIsUploading(true);
        try {
            const newAsset = {
                id: `img_${Date.now()}`,
                blob: file,
                name: file.name,
                created: Date.now()
            };
            await saveToDB('custom_images', newAsset);

            const url = URL.createObjectURL(file);
            setCustomImages(prev => [...prev, { ...newAsset, url }]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to save image.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteCustom = async (type, id) => {
        try {
            if (type === 'video') {
                await deleteFromDB('custom_videos', id);
                setCustomScenes(prev => prev.filter(i => i.id !== id));
            } else {
                await deleteFromDB('custom_images', id);
                setCustomImages(prev => prev.filter(i => i.id !== id));
            }
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    // --- Handlers for YouTube ---
    const handleYoutubePlay = (url) => {
        setYoutubeError('');

        if (!url || url.trim() === '') {
            setYoutubeError('Please enter a YouTube URL.');
            return;
        }

        const id = localGetYoutubeId(url);
        if (!id) {
            setYoutubeError('Invalid YouTube URL format.');
            return;
        }

        const success = playYoutube(url, { isCustom: true });

        if (success) {
            setYoutubeUrl('');
            setYoutubeShowControls(true);
        } else {
            setYoutubeError('Could not load video.');
        }
    };

    const handleSaveToLibrary = async () => {
        if (savedVideos.length >= MAX_SAVED_VIDEOS) {
            setYoutubeError(`Limit reached (${MAX_SAVED_VIDEOS}). Delete videos to save more.`);
            return;
        }
        const videoId = localGetYoutubeId(youtubeUrl);
        if (!videoId) {
            setYoutubeError('Invalid YouTube URL.');
            return;
        }
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setYoutubeError('Sign in to save videos.');
                return;
            }
            const exists = savedVideos.some(v => v.video_id === videoId);
            if (exists) {
                setYoutubeError('Already in library.');
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
            }
        } catch (error) {
            console.error("Error saving:", error);
            setYoutubeError('Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- UPDATED DELETE HANDLER ---
    const handleDeleteFromLibrary = async (id, e) => {
        // Stop the click from bubbling up to the SceneButton (playing the video)
        e.stopPropagation();
        e.preventDefault();

        // Optimistic update: Remove it from UI immediately for "Instant" feel
        const originalList = [...savedVideos];
        setSavedVideos(prev => prev.filter(v => v.id !== id));

        try {
            const { error } = await supabase.from('user_videos').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error("Delete failed:", error);
            // Revert UI if the server request fails
            setSavedVideos(originalList);
            setYoutubeError('Failed to delete. Try again.');
        }
    };

    // Filter Static Images
    const filteredImages = activeImageCategory === 'custom'
        ? customImages
        : activeImageCategory === 'all'
            ? STATIC_IMAGES
            : STATIC_IMAGES.filter(img => img.category === activeImageCategory);

    // Merge Config Scenes + Custom Scenes
    const allAnimatedScenes = [
        ...ANIMATED_SCENES.map(s => ({ ...s, type: 'youtube-scene' })),
        ...customScenes.map(s => ({ ...s, type: 'video', thumbnail: null }))
    ];

    const displayedAnimatedScenes = isAnimatedExpanded ? allAnimatedScenes : allAnimatedScenes.slice(0, 4);
    const categoriesList = [...STATIC_CATEGORIES, { id: 'custom', label: 'Custom' }];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900/80 backdrop-blur-md border-gray-700 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-yellow-400">Environment</DialogTitle>
                    <DialogDescription className="text-gray-400">Customize your focus space.</DialogDescription>
                </DialogHeader>

                {/* --- Top Nav Tabs --- */}
                <div className="border-b border-gray-700 sticky top-0 bg-gray-900/95 z-10 pt-2">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('scenes')} className={cn("flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors", activeTab === 'scenes' ? "border-yellow-400 text-yellow-400" : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500")}><Video size={16} /> Scenes</button>
                        <button onClick={() => setActiveTab('youtube')} className={cn("flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors", activeTab === 'youtube' ? "border-yellow-400 text-yellow-400" : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500")}><Youtube size={16} /> YouTube</button>
                        <button onClick={() => setActiveTab('soundscapes')} className={cn("flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors", activeTab === 'soundscapes' ? "border-yellow-400 text-yellow-400" : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500")}><Music size={16} /> Soundscapes</button>
                    </nav>
                </div>

                <div className="py-4 min-h-[300px]">

                    {/* --- TAB 1: SCENES --- */}
                    {activeTab === 'scenes' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* TOP DISCLAIMER (Only render if preferences loaded and NOT docked) */}
                            {preferencesLoaded && !dataDisclaimerAtBottom && (
                                <HighDataDisclaimer isBottom={false} onDismiss={dismissDataDisclaimer} />
                            )}

                            {/* 1. Animated Scenes Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                                        <Video size={18} className="text-yellow-400" /> Animated Scenes
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsAnimatedExpanded(!isAnimatedExpanded)}
                                        className="text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                                    >
                                        {isAnimatedExpanded ? (
                                            <span className="flex items-center gap-1">Collapse <ChevronUp size={14} /></span>
                                        ) : (
                                            <span className="flex items-center gap-1">Expand Library <ChevronDown size={14} /></span>
                                        )}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {displayedAnimatedScenes.map(scene => (
                                        <div key={scene.id} className="relative group">
                                            <PremiumGate featureKey="animated_scenes" requiredTier={ASSET_TIERS.getTier(scene.videoId || scene.url, 'scene')}>
                                                <SceneButton
                                                    scene={scene}
                                                    isActive={
                                                        (scene.videoId && activeScene.videoId === scene.videoId) ||
                                                        (scene.url && activeScene.path === scene.url)
                                                    }
                                                    onClick={() => {
                                                        if (scene.type === 'youtube-scene') {
                                                            playScene({ type: 'youtube-scene', videoId: scene.videoId, path: null });
                                                        } else {
                                                            playScene({ type: 'video', path: scene.url });
                                                        }
                                                    }}
                                                />
                                            </PremiumGate>
                                            {scene.type === 'video' && (
                                                <button
                                                    onClick={(e) => handleDeleteCustom('video', scene.id)}
                                                    className="absolute top-1 right-1 p-1.5 bg-red-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {/* Import Card */}
                                    {isAnimatedExpanded && customScenes.length < MAX_CUSTOM_SCENES && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <label className="cursor-pointer border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-yellow-400 hover:text-yellow-400 hover:bg-gray-800 transition-all aspect-[16/9] w-full h-full">
                                                        {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                                                        <span className="text-xs font-medium">Import Video</span>
                                                        <span className="text-[10px] opacity-70">Max 5</span>
                                                        <input type="file" accept="video/*" className="hidden" onChange={handleSceneUpload} disabled={isUploading} />
                                                    </label>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs z-[100]">
                                                    <p>Local videos are stored in your browser.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>

                            {/* 2. Static Images Section */}
                            <div>
                                <h4 className="font-semibold text-gray-300 flex items-center gap-2 mb-4">
                                    <LucideImage size={18} className="text-blue-400" /> Static Backgrounds
                                </h4>
                                <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mask-gradient">
                                    {categoriesList.map(cat => (
                                        <Button
                                            key={cat.id}
                                            variant={activeImageCategory === cat.id ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setActiveImageCategory(cat.id)}
                                            className={cn(
                                                "whitespace-nowrap rounded-full px-4 transition-all",
                                                activeImageCategory === cat.id
                                                    ? "bg-yellow-400 text-black hover:bg-yellow-500 border-transparent"
                                                    : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 bg-transparent"
                                            )}
                                        >
                                            {cat.label}
                                        </Button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {activeImageCategory === 'custom' && getCurrentTier() >= 2 && (
                                        <div className="col-span-full mb-2 bg-yellow-900/20 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-200/80">
                                            Note: Custom imports are saved in local browser storage and may be lost if cache is cleared.
                                        </div>
                                    )}
                                    {activeImageCategory === 'custom' && customImages.length < MAX_CUSTOM_IMAGES && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <label className="cursor-pointer border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-400 hover:bg-gray-800 transition-all aspect-[16/9] w-full h-full">
                                                        {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                                                        <span className="text-xs font-medium">Import Image</span>
                                                        <span className="text-[10px] opacity-70">Max 12</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                                                    </label>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-gray-900 border-gray-700 text-gray-300 text-xs z-[100]">
                                                    <p>Local images are stored in your browser.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {(activeImageCategory === 'custom' ? customImages : filteredImages).map((img, idx) => {
                                        const requiredTier = activeImageCategory === 'custom' ? 2 : ASSET_TIERS.getTier(img.id, 'image');
                                        return (
                                            <div key={img.id || idx} className="relative group">
                                                <PremiumGate featureKey="premium_wallpaper" requiredTier={requiredTier}>
                                                    <SceneButton
                                                        scene={{
                                                            ...img,
                                                            type: 'image',
                                                            thumbnail: activeImageCategory === 'custom' ? img.url : img.src
                                                        }}
                                                        isActive={activeScene.path === (activeImageCategory === 'custom' ? img.url : img.src)}
                                                        onClick={() => playScene({ type: 'image', path: activeImageCategory === 'custom' ? img.url : img.src })}
                                                    />
                                                </PremiumGate>
                                                {activeImageCategory === 'custom' && (
                                                    <button
                                                        onClick={(e) => handleDeleteCustom('image', img.id)}
                                                        className="absolute top-1 right-1 p-1.5 bg-red-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* BOTTOM DISCLAIMER (Render if docked) */}
                            {preferencesLoaded && dataDisclaimerAtBottom && (
                                <HighDataDisclaimer isBottom={true} onDismiss={null} />
                            )}
                        </div>
                    )}

                    {/* --- TAB 2: YOUTUBE --- */}
                    {activeTab === 'youtube' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* TOP BANNERS */}
                            {preferencesLoaded && !dataDisclaimerAtBottom && (
                                <HighDataDisclaimer isBottom={false} onDismiss={dismissDataDisclaimer} />
                            )}
                            {preferencesLoaded && !studyTipAtBottom && (
                                <StudyModeTip isBottom={false} onDismiss={dismissStudyTip} />
                            )}

                            <div>
                                <h4 className="font-semibold text-gray-300 mb-3">Curated Playlists</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {curatedYoutube.map(yt => {
                                        const id = typeof getYoutubeId === 'function' ? getYoutubeId(yt.url) : localGetYoutubeId(yt.url);
                                        const requiredTier = ASSET_TIERS.getTier('youtube_curated');
                                        return (
                                            <PremiumGate key={yt.url} featureKey="premium_youtube" requiredTier={requiredTier}>
                                                <SceneButton
                                                    scene={{ ...yt, type: 'youtube' }}
                                                    isActive={youtube.id === id}
                                                    onClick={() => playYoutube(yt.url, { isCustom: false })}
                                                />
                                            </PremiumGate>
                                        );
                                    })}

                                    <PremiumGate featureKey="premium_youtube" requiredTier={ASSET_TIERS.getTier('youtube_library')}>
                                        <button
                                            onClick={() => {
                                                const librarySection = document.getElementById('custom-library-section');
                                                if (librarySection) librarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }}
                                            className="rounded-lg border-2 border-dashed border-gray-700 transition-all group flex flex-col items-center justify-center relative aspect-[16/9] hover:bg-gray-800 w-full h-full"
                                        >
                                            <div className="p-3 rounded-full mb-2 bg-gray-800 text-gray-400 group-hover:bg-gray-700 transition-colors">
                                                <Bookmark size={24} />
                                            </div>
                                            <p className="text-xs font-medium text-gray-400 group-hover:text-white">Scroll to Library</p>
                                        </button>
                                    </PremiumGate>
                                </div>
                            </div>

                            {/* Custom Video & Library Section */}
                            <div id="custom-library-section" className="pt-4 border-t border-gray-700">
                                <PremiumGate featureKey="premium_youtube" requiredTier={ASSET_TIERS.getTier('youtube_custom')} hideLock={true}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                                            <LinkIcon size={16} /> Custom Video Source
                                            {getCurrentTier() < ASSET_TIERS.getTier('youtube_custom') && (
                                                <div className="bg-black/60 backdrop-blur-md p-1 rounded-full shadow-lg border border-white/10 flex items-center justify-center ml-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 drop-shadow-md">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                    </svg>
                                                </div>
                                            )}
                                        </h4>
                                        <span className={cn("text-xs px-2 py-0.5 rounded-full border",
                                            savedVideos.length >= MAX_SAVED_VIDEOS ? "border-red-500 text-red-400" : "border-gray-700 text-gray-400"
                                        )}>
                                            Library: {savedVideos.length} / {MAX_SAVED_VIDEOS}
                                        </span>
                                    </div>

                                    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700 space-y-4">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    placeholder="Paste any YouTube URL..."
                                                    value={youtubeUrl}
                                                    onChange={(e) => { setYoutubeUrl(e.target.value); setYoutubeError(''); }}
                                                    className={cn("bg-gray-900/50 border-gray-600 pl-9", youtubeError && "border-red-500 focus-visible:ring-red-500")}
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
                                                        <TooltipContent><p>Limit Reached</p></TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>

                                            <Button
                                                onClick={() => handleYoutubePlay(youtubeUrl)}
                                                className="bg-red-600 hover:bg-red-700 text-white gap-2 font-semibold"
                                            >
                                                <Play size={16} fill="currentColor" /> Load
                                            </Button>
                                        </div>
                                        {youtubeError && (
                                            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-2 rounded-md border border-red-900/50 animate-in fade-in slide-in-from-top-1">
                                                <AlertCircle size={14} /> {youtubeError}
                                            </div>
                                        )}

                                        {/* Saved Library Grid */}
                                        {savedVideos.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                                                <h5 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Your Saved Videos</h5>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {savedVideos.map(vid => (
                                                        <div key={vid.id} className="relative group">
                                                            <SceneButton
                                                                scene={{ ...vid, name: vid.title, type: 'youtube' }}
                                                                isActive={youtube.id === vid.video_id}
                                                                onClick={() => playYoutube(vid.url, { isCustom: false })}
                                                            />
                                                            {/* FIXED DELETE BUTTON (Z-Index 50) */}
                                                            <button
                                                                onClick={(e) => handleDeleteFromLibrary(vid.id, e)}
                                                                className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-50 cursor-pointer"
                                                                title="Delete from Library"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* YouTube Controls */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-gray-900/50 rounded-lg mt-2">
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
                                    </div>

                                    {youtube.id && (
                                        <Button onClick={stopYoutube} variant="outline" size="sm" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 mt-2">
                                            Stop YouTube Playback
                                        </Button>
                                    )}
                                </PremiumGate>
                            </div>
                            {preferencesLoaded && studyTipAtBottom && (
                                <StudyModeTip isBottom={true} onDismiss={null} />
                            )}
                            {preferencesLoaded && dataDisclaimerAtBottom && (
                                <HighDataDisclaimer isBottom={true} onDismiss={null} />
                            )}
                        </div>
                    )
                    }

                    {/* --- TAB 3: SOUNDSCAPES --- */}
                    {
                        activeTab === 'soundscapes' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Sparkles className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        <h4 className="font-semibold text-white mb-1">Create Your Atmosphere</h4>
                                        <p className="mb-2">Combine sounds and scenes to maximize your experience.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {soundscapes.map(sound => {
                                        const isActive = activeSounds.includes(sound.path);
                                        const isLoading = loadingSounds[sound.path];
                                        const volume = soundVolumes[sound.path] || 0.5;
                                        const Icon = sound.icon;
                                        const requiredTier = ASSET_TIERS.getTier(sound.path, 'soundscape');

                                        return (
                                            <PremiumGate key={sound.path} featureKey="premium_sounds" requiredTier={requiredTier}>
                                                <div
                                                    className={cn(
                                                        "relative group rounded-xl border-2 transition-all duration-300 overflow-hidden",
                                                        isActive ? "border-yellow-400 bg-yellow-950/20" : "border-gray-700 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800"
                                                    )}
                                                >
                                                    <button
                                                        onClick={() => toggleSound(sound.path)}
                                                        className="w-full p-4 flex flex-col items-center gap-3 text-center"
                                                        disabled={isLoading && !isActive} // Prevent double clicks
                                                    >
                                                        <div className={cn("p-3 rounded-full transition-colors relative", isActive ? "bg-yellow-400 text-black" : "bg-gray-700 text-gray-400 group-hover:text-white")}>
                                                            {/* --- NEW: Spinner or Icon --- */}
                                                            {isLoading ? (
                                                                <Loader2 size={24} className="animate-spin text-current" />
                                                            ) : (
                                                                <Icon size={24} />
                                                            )}
                                                        </div>
                                                        <span className={cn("text-sm font-medium", isActive ? "text-yellow-400" : "text-gray-400 group-hover:text-gray-200")}>
                                                            {sound.name}
                                                        </span>
                                                    </button>

                                                    {/* (Volume Slider Code remains the same...) */}
                                                    <div className={cn(
                                                        "px-4 pb-4 transition-all duration-300",
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
                                            </PremiumGate>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    }
                </div >
            </DialogContent >
        </Dialog >
    );
}