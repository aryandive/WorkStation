// app/error.js
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }) {

    useEffect(() => {
        // Log the error to an error reporting service (e.g., Sentry)
        console.error('🛑 CLIENT APPLICATION ERROR:', error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-950 p-4 text-white">
            <div className="max-w-md w-full text-center space-y-6">

                {/* Icon & Title */}
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-red-900/20 rounded-full ring-1 ring-red-500/50">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Something went wrong!
                    </h2>
                    <p className="text-gray-400">
                        We encountered an unexpected issue. The error has been logged and we are looking into it.
                    </p>
                </div>

                {/* Error Details (Dev Mode Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-800 text-left overflow-auto max-h-40">
                        <p className="font-mono text-xs text-red-400">
                            {error.message || "Unknown Error"}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <Button
                        onClick={() => reset()} // Attempt to recover by re-rendering the segment
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-bold hover:from-yellow-400 hover:to-yellow-500 gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Try Again
                    </Button>

                    <Link href="/" passHref>
                        <Button variant="outline" className="border-gray-700 hover:bg-gray-800 text-gray-300 gap-2 w-full sm:w-auto">
                            <Home className="w-4 h-4" />
                            Back Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}