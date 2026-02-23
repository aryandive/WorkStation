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
      <DialogContent className="sm:max-w-md text-center p-6">
        <DialogHeader className="flex flex-col items-center gap-4">
          {/* Visual Anchor */}
          {icon && (
            <div className="p-4 rounded-full bg-primary/10 mb-2">
              <Image 
                src={icon} 
                alt={`${title} icon`} 
                width={48} 
                height={48} 
                className="opacity-80"
              />
            </div>
          )}
          
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {title}
          </DialogTitle>
          
          <DialogDescription className="text-base text-muted-foreground mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-8">
          {/* The CTA: Opens in a new tab to protect the user's active focus session.
            We also call onClose to dismiss the modal in the original tab.
          */}
          <Link 
            href={checkoutUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full"
          >
            <Button className="w-full h-12 text-lg font-semibold" size="lg">
              {ctaText}
            </Button>
          </Link>

          {/* Explicit Escape Hatch */}
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}