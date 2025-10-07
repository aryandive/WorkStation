"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

export default function SessionSettings({ isOpen, setIsOpen, settings, updateSettings, isRunning }) {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalSettings((prev) => ({
            ...prev,
            [name]: Math.max(1, parseInt(value, 10) || 1),
        }));
    };

    const handleSwitchChange = (checked, name) => {
        setLocalSettings(prev => ({ ...prev, [name]: checked }));
    }

    const handleSelectChange = (value, name) => {
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateSettings(localSettings);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-gray-900/80 backdrop-blur-sm border-gray-700 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-yellow-400">Settings</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">

                    {/* Timer Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Timer</h3>
                        <Separator className="bg-gray-700 mb-4" />
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div><Label htmlFor="workMinutes">Focus</Label><Input id="workMinutes" name="workMinutes" type="number" min="1" value={localSettings.workMinutes} onChange={handleChange} disabled={isRunning} className="bg-gray-800 border-gray-700" /></div>
                            <div><Label htmlFor="breakMinutes">Short Break</Label><Input id="breakMinutes" name="breakMinutes" type="number" min="1" value={localSettings.breakMinutes} onChange={handleChange} disabled={isRunning} className="bg-gray-800 border-gray-700" /></div>
                            <div><Label htmlFor="longBreakMinutes">Long Break</Label><Input id="longBreakMinutes" name="longBreakMinutes" type="number" min="1" value={localSettings.longBreakMinutes} onChange={handleChange} disabled={isRunning} className="bg-gray-800 border-gray-700" /></div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label htmlFor="autoStartBreaks">Auto Start Breaks</Label><Switch id="autoStartBreaks" checked={localSettings.autoStartBreaks} onCheckedChange={(c) => handleSwitchChange(c, 'autoStartBreaks')} /></div>
                            <div className="flex items-center justify-between"><Label htmlFor="autoStartPomodoros">Auto Start Pomodoros</Label><Switch id="autoStartPomodoros" checked={localSettings.autoStartPomodoros} onCheckedChange={(c) => handleSwitchChange(c, 'autoStartPomodoros')} /></div>
                            <div className="flex items-center justify-between"><Label htmlFor="longBreakInterval">Long Break Interval</Label><Input id="longBreakInterval" name="longBreakInterval" type="number" min="1" value={localSettings.longBreakInterval} onChange={handleChange} className="bg-gray-800 border-gray-700 w-20" /></div>
                        </div>
                    </div>

                    {/* Notification Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                        <Separator className="bg-gray-700 mb-4" />
                        <div className="flex items-center justify-between"><Label htmlFor="notificationOnFinish">Timer Finished Notification</Label><Switch id="notificationOnFinish" checked={localSettings.notificationOnFinish} onCheckedChange={(c) => handleSwitchChange(c, 'notificationOnFinish')} /></div>
                    </div>

                    {/* Sound Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Sound</h3>
                        <Separator className="bg-gray-700 mb-4" />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="alarmSound">Alarm Sound</Label>
                            <Select value={localSettings.alarmSound} onValueChange={(v) => handleSelectChange(v, 'alarmSound')}>
                                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700"><SelectValue placeholder="Select sound" /></SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="alarm-bell.mp3">Bell</SelectItem>
                                    <SelectItem value="alarm-bird.mp3">Bird Song</SelectItem>
                                    <SelectItem value="alarm-digital.mp3">Digital</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600" disabled={isRunning}>
                        Save Settings
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
