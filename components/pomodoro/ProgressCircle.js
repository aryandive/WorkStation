import { cn } from '@/lib/utils';

export default function ProgressCircle({ progress, colorClass }) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-60 h-60">
            <svg className="absolute inset-0" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                    className="stroke-current text-white/20"
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeWidth="5"
                    fill="none"
                />
                {/* Progress Ring */}
                <circle
                    className={cn("stroke-current transition-all duration-300 ease-linear", colorClass)}
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                />
            </svg>
        </div>
    );
}

