'use client';

import { useState } from 'react';
import { useAccess } from '@/hooks/useAccess';
import { PREMIUM_FEATURES } from '@/lib/premiumFeatures';
import { PremiumIntentModal } from '@/components/system/PremiumIntentModal';

export function PremiumGate({ featureKey, children, className = '' }) {
  const { hasAccess } = useAccess();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Check the source of truth
  const isUnlocked = hasAccess(featureKey);

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
        {/* The Child Element: Visually dimmed and physically unclickable */}
        <div className="opacity-50 pointer-events-none transition-opacity group-hover:opacity-40">
          {children}
        </div>

        {/* The Visual Padlock Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 p-2 rounded-full shadow-md border">
            {/* Inline SVG Padlock so we don't rely on external icon libraries */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-foreground"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>
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