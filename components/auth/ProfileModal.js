'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, Loader2, HardDrive, User, ShieldAlert } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function ProfileModal({ isOpen, onClose, user, onProfileUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    
    // --- NEW: Storage State for Anonymous Users ---
    const [storageUsage, setStorageUsage] = useState({ usedKB: 0, percent: 0 });
    
    const supabase = createClient();

    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            return;
        }

        // A. Logic for LOGGED IN Users
        if (user) {
            const fetchProfile = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', user.id)
                    .single();

                if (data?.display_name) {
                    setDisplayName(data.display_name);
                } else {
                    setDisplayName(user.email?.split('@')[0] || '');
                }
            };
            fetchProfile();
        } 
        
        // B. Logic for ANONYMOUS Users (Calculate Local Storage)
        else {
            if (typeof window !== 'undefined' && window.localStorage) {
                // Approximate size in KB
                const total = 5000; // ~5MB browser limit (safe estimate)
                let used = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        used += ((localStorage[key].length + key.length) * 2); // *2 for char byte size
                    }
                }
                const usedKB = (used / 1024).toFixed(1);
                const percent = Math.min((usedKB / total) * 100, 100);
                
                setStorageUsage({ usedKB, percent });
                setDisplayName("Guest User");
            }
        }
    }, [isOpen, user, supabase]);

    const handleSave = async () => {
        if (!displayName.trim()) return;
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                display_name: displayName,
                updated_at: new Date().toISOString()
            });

        setLoading(false);

        if (!error) {
            setIsEditing(false);
            if (onProfileUpdate) onProfileUpdate(); 
        }
    };

    // --- RENDER: ANONYMOUS VIEW ---
    if (!user) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
                             <User className="w-5 h-5 text-gray-400" /> Guest Session
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-6 py-6">
                        {/* Guest Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center">
                            <span className="text-3xl font-bold text-gray-500">?</span>
                        </div>

                        {/* Local Storage Meter */}
                        <div className="w-full bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <div className="flex items-center gap-2 mb-3 text-gray-300 text-sm font-semibold">
                                <HardDrive className="w-4 h-4 text-blue-400" />
                                <span>Browser Storage</span>
                            </div>
                            
                            <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-500" 
                                    style={{ width: `${storageUsage.percent}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-[11px] text-gray-500">
                                <span>{storageUsage.usedKB} KB Used</span>
                                <span>~5 MB Limit</span>
                            </div>
                        </div>

                        {/* Warning & CTA */}
                        <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-lg flex gap-3 items-start">
                            <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-yellow-200/80">
                                <p className="font-bold text-yellow-500 mb-1">Data Risk Warning</p>
                                If you clear your browser cache or use Incognito, your data will be lost forever.
                            </div>
                        </div>

                        <Link href="/signup" className="w-full">
                            <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold">
                                Create Account to Sync
                            </Button>
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // --- RENDER: LOGGED IN VIEW (Existing Logic) ---
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">My Identity</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center shadow-2xl">
                            <span className="text-3xl font-bold text-gray-400">
                                {displayName.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="w-full max-w-[240px] text-center">
                        {isEditing ? (
                            <div className="relative animate-in fade-in zoom-in duration-200">
                                <Input
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="bg-gray-800 border-yellow-500/50 text-center font-bold text-lg h-10 focus-visible:ring-yellow-500"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                />
                                <div className="flex gap-2 mt-3 justify-center">
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white h-8">
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={loading} className="bg-yellow-500 text-black hover:bg-yellow-400 h-8">
                                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditing(true)}
                                className="group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                            >
                                <h2 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                                    {displayName || 'Set Display Name'}
                                </h2>
                                <Edit2 className="w-4 h-4 text-gray-500 group-hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}