'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function ProfileModal({ isOpen, onClose, user, onProfileUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    // Fetch profile when modal opens
    useEffect(() => {
        if (isOpen && user) {
            const fetchProfile = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', user.id)
                    .single();

                if (data?.display_name) {
                    setDisplayName(data.display_name);
                } else {
                    // Fallback to email prefix if no name set
                    setDisplayName(user.email?.split('@')[0] || '');
                }
            };
            fetchProfile();
        }
        setIsEditing(false); // Reset edit state on open
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
            if (onProfileUpdate) onProfileUpdate(); // Notify parent to refresh
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">My Identity</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-6">
                    {/* 1. The "Face" (Static Placeholder) */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center shadow-2xl">
                            <span className="text-3xl font-bold text-gray-400">
                                {displayName.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* 2. The "Click-to-Edit" Name */}
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