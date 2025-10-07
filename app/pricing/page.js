import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const tiers = [
    {
        name: 'Experience Plan',
        price: '$0',
        priceSuffix: '',
        description: 'Get a feel for the core tools, forever free.',
        features: [
            'Full Pomodoro Timer access',
            'Full Task & Project Management',
            'Local Browser Storage',
            '30 Journal Entry Limit',
            'Limited Ambiance Library',
            'Basic Daily Stats',
        ],
        cta: 'Get Started',
        href: '/signup',
        isMostPopular: false,
    },
    {
        name: 'Focus Pro - Monthly',
        price: '$7.99',
        priceSuffix: '/ month',
        description: 'Unlock the full power of Work Station, one month at a time.',
        features: [
            'Everything in Experience, plus:',
            'Unlimited Cloud Journal Entries',
            'Sync Data Across All Devices',
            'Full Ambiance & Sound Library',
            'YouTube Audio Integration',
            'Advanced Productivity Analytics',
            'Priority Support',
        ],
        cta: 'Upgrade Now',
        href: '#', // This will link to Stripe checkout in the next step
        isMostPopular: false,
    },
    {
        name: 'Focus Pro - Yearly',
        price: '$59.99',
        priceSuffix: '/ year',
        description: 'Commit to your focus and save 37%. Our best value.',
        features: [
            'Everything in Experience, plus:',
            'Unlimited Cloud Journal Entries',
            'Sync Data Across All Devices',
            'Full Ambiance & Sound Library',
            'YouTube Audio Integration',
            'Advanced Productivity Analytics',
            'Priority Support',
        ],
        cta: 'Upgrade & Save',
        href: '#', // This will link to Stripe checkout in the next step
        isMostPopular: true,
    },
];

export default function PricingPage() {
    return (
        <div className="bg-[#1A202C] text-[#F7FAFC] font-sans">
            <Header />
            <main className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Find the Plan That’s Right for You
                        </h1>
                        <p className="text-lg text-[#A0AEC0] max-w-2xl mx-auto">
                            Start for free, then upgrade to unlock your full productivity potential.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={cn(
                                    'rounded-2xl border p-8 flex flex-col',
                                    tier.isMostPopular ? 'border-yellow-400 shadow-2xl shadow-yellow-500/10' : 'border-gray-700'
                                )}
                            >
                                {tier.isMostPopular && (
                                    <p className="absolute top-0 -translate-y-1/2 bg-yellow-400 text-gray-900 px-3 py-1 text-sm font-bold rounded-full">
                                        BEST VALUE
                                    </p>
                                )}
                                <h3 className="text-xl font-bold">{tier.name}</h3>
                                <p className="mt-4 text-sm text-gray-400 flex-grow">{tier.description}</p>
                                <div className="mt-6">
                                    <span className="text-4xl font-bold">{tier.price}</span>
                                    <span className="text-base font-medium text-gray-400">{tier.priceSuffix}</span>
                                </div>
                                <ul className="mt-8 space-y-4 text-sm">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-auto pt-8">
                                    <Button
                                        asChild
                                        className={cn(
                                            'w-full text-lg py-6 font-bold',
                                            tier.isMostPopular ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' : 'bg-gray-700 hover:bg-gray-600'
                                        )}
                                    >
                                        <Link href={tier.href}>{tier.cta}</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
