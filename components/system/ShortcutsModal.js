'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
    const shortcuts = [
        { key: "Space", action: "Start / Pause Timer" },
        { key: "R", action: "Reset Timer" },
        { key: "N", action: "next Timer" },
        { key: "M", action: "Minimixe / Maximize" },
        { key: "Esc", action: "Close Modals" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-yellow-400">
                        <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {shortcuts.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                            <span className="text-gray-300">{s.action}</span>
                            <kbd className="px-2 py-1 bg-gray-950 rounded border border-gray-700 font-mono text-sm text-yellow-500 min-w-[3rem] text-center shadow-sm">
                                {s.key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}