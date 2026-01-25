'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import './globals.css'; // Ensure styling is available

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error('💥 GLOBAL APPLICATION CRASH:', error);
    }, [error]);

    return (
        <html lang="en">
            <body className="bg-gray-950 text-white antialiased h-screen flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-red-900/20 rounded-full ring-1 ring-red-500/50">
                            <AlertTriangle className="w-12 h-12 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Critical Error
                        </h1>
                        <p className="text-gray-400">
                            The application encountered a critical error and cannot recover automatically.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => reset()}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Reload Application
                        </button>
                    </div>
                    
                    {/* Minimal Footer */}
                    <p className="text-xs text-gray-600 mt-8">
                        Error Code: GLOBAL_LAYOUT_FAILURE
                    </p>
                </div>
            </body>
        </html>
    );
}