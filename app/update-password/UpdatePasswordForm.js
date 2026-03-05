'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function UpdatePasswordForm({ updatePasswordAction }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <form action={updatePasswordAction} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-medium">New Password</Label>
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        placeholder="••••••••"
                        required
                        className="bg-[#0D1117] border-[#30363D] text-white placeholder:text-gray-600 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all h-10 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">Confirm Password</Label>
                <div className="relative">
                    <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        placeholder="••••••••"
                        required
                        className="bg-[#0D1117] border-[#30363D] text-white placeholder:text-gray-600 focus:border-yellow-500/50 focus:ring-yellow-500/20 transition-all h-10 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                    >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>
            <Button type="submit" className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold h-10 transition-all shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] mt-2">
                Update Password
            </Button>
        </form>
    );
}
