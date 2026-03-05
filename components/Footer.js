import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="py-8 text-center text-sm text-[#A0AEC0] border-t border-gray-800 bg-[#1A202C]">
            <div className="flex justify-center gap-6 mb-4 font-medium">
                <Link href="/terms" className="hover:text-yellow-400 transition-colors">
                    Terms & Conditions
                </Link>
                <Link href="/terms" className="hover:text-yellow-400 transition-colors">
                    Privacy Policy
                </Link>
                <Link href="/help" className="hover:text-yellow-400 transition-colors">
                    Refund Policy
                </Link>
            </div>
            <p className="opacity-75">&copy; {new Date().getFullYear()} Work Station. All rights reserved.</p>
        </footer>
    );
}