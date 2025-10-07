'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthButton() {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Also fetch the initial session
        const getInitialUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }
        getInitialUser();

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh(); // Force a refresh to update server components
    };

    return user ? (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-black/20 hover:bg-white/20">
                    <User className="h-5 w-5 text-white" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">My Account</p>
                        <p className="text-xs leading-none text-gray-400 truncate">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer focus:bg-gray-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ) : (
        <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-10">
            <Link href="/login">Login</Link>
        </Button>
    );
}

