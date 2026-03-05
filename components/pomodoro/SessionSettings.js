"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

export default function SessionSettings({ isOpen, setIsOpen, settings, updateSettings, isRunning }) {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);

    // Handle text input changes (allow empty string for better typing UX)
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Allow user to clear input (empty string) while typing
        if (value === '') {
            setLocalSettings(prev => ({ ...prev, [name]: '' }));
            return;
        }
        // Otherwise update as number
        setLocalSettings((prev) => ({
            ...prev,
            [name]: parseInt(value, 10),
        }));
    };

    // Validate on blur (when user leaves the field)
    const handleBlur = (e) => {
        const { name, value } = e.target;
        let numVal = parseInt(value, 10);

        // Default to 1 if empty or invalid
        if (isNaN(numVal) || numVal < 1) {
            numVal = 1;
        }

        setLocalSettings(prev => ({ ...prev, [name]: numVal }));
    };

    const handleSwitchChange = (checked, name) => {
        setLocalSettings(prev => ({ ...prev, [name]: checked }));
    }

    const handleSelectChange = (value, name) => {
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Final validation before saving
        const safeSettings = {
            ...localSettings,
            workMinutes: localSettings.workMinutes || 25,
            breakMinutes: localSettings.breakMinutes || 5,
            longBreakMinutes: localSettings.longBreakMinutes || 15,
            longBreakInterval: localSettings.longBreakInterval || 4,
        };
        updateSettings(safeSettings);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900/95 backdrop-blur-md border-gray-700 text-white max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-yellow-400">Settings</DialogTitle>
                    {/* Fix: Added DialogDescription for accessibility to remove warning */}
                    <DialogDescription className="sr-only">
                        Adjust your Pomodoro timer duration, sound, and notification settings.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">

                    {/* Timer Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-200">Timer</h3>
                        <Separator className="bg-gray-700 mb-4" />
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <Label htmlFor="workMinutes" className="text-xs text-gray-400">Focus</Label>
                                <Input
                                    id="workMinutes"
                                    name="workMinutes"
                                    type="number"
                                    min="1"
                                    value={localSettings.workMinutes}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isRunning}
                                    className="bg-gray-800 border-gray-700 focus:border-yellow-500 transition-colors"
                                />
                            </div>
                            <div>
                                <Label htmlFor="breakMinutes" className="text-xs text-gray-400">Short Break</Label>
                                <Input
                                    id="breakMinutes"
                                    name="breakMinutes"
                                    type="number"
                                    min="1"
                                    value={localSettings.breakMinutes}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isRunning}
                                    className="bg-gray-800 border-gray-700 focus:border-green-500 transition-colors"
                                />
                            </div>
                            <div>
                                <Label htmlFor="longBreakMinutes" className="text-xs text-gray-400">Long Break</Label>
                                <Input
                                    id="longBreakMinutes"
                                    name="longBreakMinutes"
                                    type="number"
                                    min="1"
                                    value={localSettings.longBreakMinutes}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isRunning}
                                    className="bg-gray-800 border-gray-700 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="autoStartBreaks" className="cursor-pointer">Auto Start Breaks</Label>
                                <Switch id="autoStartBreaks" checked={localSettings.autoStartBreaks} onCheckedChange={(c) => handleSwitchChange(c, 'autoStartBreaks')} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="autoStartPomodoros" className="cursor-pointer">Auto Start Pomodoros</Label>
                                <Switch id="autoStartPomodoros" checked={localSettings.autoStartPomodoros} onCheckedChange={(c) => handleSwitchChange(c, 'autoStartPomodoros')} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="longBreakInterval">Long Break Interval</Label>
                                <Input
                                    id="longBreakInterval"
                                    name="longBreakInterval"
                                    type="number"
                                    min="1"
                                    value={localSettings.longBreakInterval}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className="bg-gray-800 border-gray-700 w-20 text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notification Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-200">Notifications</h3>
                        <Separator className="bg-gray-700 mb-4" />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="notificationOnFinish" className="cursor-pointer">Desktop Notification</Label>
                            <Switch id="notificationOnFinish" checked={localSettings.notificationOnFinish} onCheckedChange={(c) => handleSwitchChange(c, 'notificationOnFinish')} />
                        </div>
                    </div>

                    {/* Sound Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-200">Sound</h3>
                        <Separator className="bg-gray-700 mb-4" />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="alarmSound">Alarm Sound</Label>
                                <Select value={localSettings.alarmSound} onValueChange={(v) => handleSelectChange(v, 'alarmSound')}>
                                    <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                                        <SelectValue placeholder="Select sound" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                        <SelectItem value="alarm-bell.mp3">Classic Bell</SelectItem>
                                        <SelectItem value="alarm-bird.mp3">Bird Song</SelectItem>
                                        <SelectItem value="alarm-digital.mp3">Digital</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="px-1">
                                <div className="flex items-center justify-between mb-3">
                                    <Label htmlFor="volume">Volume</Label>
                                    <span className="text-xs text-gray-400">{Math.round((localSettings.volume || 0.8) * 100)}%</span>
                                </div>
                                <Slider
                                    id="volume"
                                    defaultValue={[localSettings.volume || 0.8]}
                                    max={1}
                                    step={0.05}
                                    onValueChange={(vals) => setLocalSettings(prev => ({ ...prev, volume: vals[0] }))}
                                    className="py-1 cursor-grab active:cursor-grabbing"
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold" disabled={isRunning}>
                        {isRunning ? 'Stop Timer to Edit' : 'Save Changes'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}