'use client';

import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

export function useAccess() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();

  const isLoading = authLoading || subLoading;

  return {
    isLoading,
    // Role Helpers
    isAnonymous: !user,
    isFree: !!user && !isPro,
    isPro: !!isPro,

    // Feature Flags (The "Rules")
    
    // 1. Data Persistence
    canSyncToCloud: !!user, // Only logged-in users sync to Supabase
    
    // 2. Project Limits
    // Anonymous: 3 projects max (stored locally)
    // Free: 5 projects max
    // Pro: Unlimited
    maxProjects: !user ? 3 : (isPro ? Infinity : 5),

    // 3. Environment & Focus
    // Pro users get full mixing and premium wallpapers
    canUsePremiumSounds: isPro,
    canUploadWallpaper: isPro,
    
    // 4. Stats & Insights
    // Everyone sees a simple timer.
    // Only Pro users see "The Ghost Bar" (History) and Heatmaps.
    canViewHistoricalStats: isPro, 
    
    // 5. Journaling
    // Writing is free (build the habit).
    // Reviewing past "Moods" or "Activity Rings" is Pro.
    canViewJournalInsights: isPro,
  };
}