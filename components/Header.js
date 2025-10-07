import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Header() {
    return (
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
            <Link href="/" className="flex items-center gap-3">
                <Image src="/logo.jpg" width={40} height={40} alt="Work Station Logo" className="rounded-md" />
                <span className="font-bold text-lg text-white">Work Station</span>
            </Link>
            <div className="flex items-center gap-4">
                <Link href="/pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Pricing
                </Link>
                <Button asChild>
                    <Link href="/login">Sign In</Link>
                </Button>
            </div>
        </header>
    );
}
