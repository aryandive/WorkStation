'use client';

import { useState } from 'react';
import { useAccess } from '@/hooks/useAccess';
import { PREMIUM_FEATURES } from '@/lib/premiumFeatures';
import { PremiumIntentModal } from '@/components/system/PremiumIntentModal';

export function PremiumGate({ featureKey, requiredTier, children, className = '', lockClassName = 'absolute top-2 right-2', hideLock = false }) {
  const { hasAccess } = useAccess();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Check the source of truth
  const isUnlocked = hasAccess(featureKey, requiredTier);

  // 2. If unlocked, return the raw children. No wrappers, no DOM bloat, no interference.
  if (isUnlocked) {
    return children;
  }

  // 3. If locked, fetch the exact config for the upsell modal
  const featureConfig = PREMIUM_FEATURES[featureKey];

  return (
    <>
      <div
        // We accept `className` to preserve Flexbox/Grid layouts from the parent
        className={`relative group cursor-pointer ${className}`}

        // onClickCapture intercepts the event BEFORE it reaches the children
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
      >
        {/* The Child Element: Fully visible, but intercepts clicks */}
        <div className="transition-opacity group-hover:opacity-90">
          {children}
        </div>

        {/* The Sleek Padlock Overlay */}
        {!hideLock && (
          <div className={`${lockClassName} pointer-events-none z-10 transition-transform duration-300 group-hover:scale-110`}>
            <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/10 flex items-center justify-center">
              {/* Sleek Inline SVG Padlock */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-yellow-400 drop-shadow-md"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* The Context-Aware Upsell Modal */}
      <PremiumIntentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        featureConfig={featureConfig}
      />
    </>
  );
}