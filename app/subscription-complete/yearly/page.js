import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function SubscriptionSuccess() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md w-full border border-gray-700">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-2 text-white">Payment Successful!</h1>
                <p className="text-gray-400 mb-8">
                    Your Yearly subscription is now active. You have full access to all Pro features.
                </p>
                <Link href="/journal">
                    <button className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors">
                        Go to Work Station
                    </button>
                </Link>
            </div>
        </div>
    );
}