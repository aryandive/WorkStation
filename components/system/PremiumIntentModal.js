'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export function PremiumIntentModal({ isOpen, onClose, featureConfig }) {
  // Fail gracefully if no config is passed
  if (!featureConfig) return null;

  const { title, description, icon, ctaText, trackingId } = featureConfig;

  // Construct the tracking URL for your landing page
  const checkoutUrl = `/landing?intent=${trackingId}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only trigger onClose if Radix tells us the dialog is closing 
      // (handles outside clicks and the escape key natively)
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md text-center p-8 bg-zinc-950 border border-yellow-500/20 shadow-2xl shadow-yellow-500/10 overflow-hidden">

        {/* Ambient Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="flex flex-col items-center gap-4 relative z-10">
          {/* Visual Anchor (Luxurious Icon Container) */}
          {icon && (
            <div className="relative group">
              <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative p-5 rounded-full bg-gradient-to-br from-zinc-900 to-black border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] ring-1 ring-yellow-500/50 mb-2">
                <Image
                  src={icon}
                  alt={`${title} icon`}
                  width={40}
                  height={40}
                  className="drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                />
              </div>
            </div>
          )}

          <DialogTitle className="text-3xl font-bold tracking-tight bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
            {title}
          </DialogTitle>

          {/* CRITICAL UX FIX: Upgraded to text-zinc-300 for WCAG legibility */}
          <DialogDescription className="text-[15px] leading-relaxed text-zinc-300 mt-2 font-medium max-w-[90%] mx-auto">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-10 relative z-10">
          {/* The CTA: Luxurious Shimmer Button */}
          <Link
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full block group"
          >
            <Button
              className="relative w-full h-14 text-lg font-bold rounded-xl overflow-hidden bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] border-none cursor-pointer"
            >
              <span className="relative z-10">{ctaText}</span>
              {/* Shimmer Effect */}
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                <div className="relative h-full w-12 bg-white/40 blur-sm" />
              </div>
            </Button>
          </Link>

          {/* CRITICAL UX FIX: Upgraded to text-zinc-400 to prevent mobile dead-ends */}
          <button
            onClick={onClose}
            className="uppercase tracking-widest text-xs font-bold text-zinc-400 hover:text-yellow-400 transition-colors duration-300 w-full py-2 cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}