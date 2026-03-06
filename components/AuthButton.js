'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Keyboard, Crown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProfileModal from '@/components/auth/ProfileModal';
import ShortcutsModal from '@/components/system/ShortcutsModal';

export default function AuthButton() {
    const [user, setUser] = useState(null);
    const [profileName, setProfileName] = useState('');

    // Modal States
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

    const router = useRouter();
    const [supabase] = useState(() => createClient());

    const [loading, setLoading] = useState(true);

    // Helper to fetch profile name
    const fetchProfile = async (userId) => {
        if (!userId) return;
        const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).single();
        if (data?.display_name) {
            setProfileName(data.display_name);
        }
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) fetchProfile(currentUser.id);
            setLoading(false);
        });

        const getInitialUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) fetchProfile(user.id);
            setLoading(false);
        }
        getInitialUser();

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    // Callback when profile is updated in the modal
    const handleProfileUpdate = () => {
        if (user) fetchProfile(user.id);
    };

    if (loading) {
        return (
            <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse"></div>
        );
    }

    if (!user) {
        return (
            <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-10">
                <Link href="/login">Login</Link>
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {/* HIG: min-w/min-h instead of fixed w-10 h-10 so tap target is ≥44px */}
                    <Button variant="ghost" className="relative h-10 w-10 max-md:min-w-[44px] max-md:min-h-[44px] rounded-full bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-white/10 shadow-lg p-0 overflow-hidden">
                        {/* Avatar Placeholder: Uses initials of display name or email */}
                        <span className="font-bold text-gray-200">
                            {(profileName || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 bg-gray-900 border-gray-800 text-white p-2" align="end" forceMount>

                    {/* Item 1: Identity */}
                    <div
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer mb-2 group transition-colors"
                    >
                        <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-yellow-500/50 transition-colors">
                            <User className="h-5 w-5 text-gray-400 group-hover:text-yellow-500" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                                {profileName || 'My Account'}
                            </span>
                            <span className="text-xs text-gray-500 truncate">{user.email}</span>
                        </div>
                    </div>

                    <DropdownMenuSeparator className="bg-gray-800" />

                    {/* Item 2: Premium */}
                    <DropdownMenuItem asChild className="cursor-pointer focus:bg-yellow-500/10 focus:text-yellow-500 my-1">
                        <Link href="/landing" className="flex items-center w-full">
                            <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-yellow-500">Premium</span>
                        </Link>
                    </DropdownMenuItem>

                    {/* Item 3: Shortcuts */}
                    <DropdownMenuItem onClick={() => setIsShortcutsOpen(true)} className="cursor-pointer focus:bg-gray-800 my-1">
                        <Keyboard className="mr-2 h-4 w-4 text-gray-400" />
                        <span>Shortcuts</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-gray-800" />

                    {/* Item 4: Logout */}
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer focus:bg-red-900/20 focus:text-red-400 text-gray-400 mt-1">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Render the Modals */}
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
                onProfileUpdate={handleProfileUpdate}
            />

            <ShortcutsModal
                isOpen={isShortcutsOpen}
                onClose={() => setIsShortcutsOpen(false)}
            />
        </>
    );
}