// hooks/useAccess.js
'use client'; import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

export function useAccess() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();

  const isLoading = authLoading || subLoading;

  // New Helper: Extrapolating User Tier for Data-Driven Gatekeeper
  const getCurrentTier = () => {
    if (isPro) return 2; // Pro user
    if (user) return 1;  // Free logged-in user
    return 0;            // Anonymous
  };

  // Define the strict access rules in one dictionary mapping
  // This maps a potential "featureKey" directly to its boolean requirement
  const featureAccessMap = {
    // 1. Environment & Focus
    'premium_sounds': isPro,
    'audio_mixing': isPro,
    'premium_wallpaper': isPro,

    // 2. Stats & Insights
    'historical_stats': isPro,
    'journal_insights': isPro,

    // 3. Project Limits (Boolean evaluation for simple gates)
    'unlimited_projects': isPro,

    // 4. Base Features (Always true if they are logged in, etc.)
    'cloud_sync': !!user,
  };

  return {
    isLoading,

    // Role Helpers
    isAnonymous: !user,
    isFree: !!user && !isPro,
    isPro: !!isPro,

    // Project Limits (Keeping your custom logic here)
    maxProjects: !user ? 3 : (isPro ? Infinity : 5),

    // --- NEW: The unified check function for the Gatekeeper ---
    // Pass in a featureKey string, it returns true if they have access, false if locked.
    // If a requiredTier is passed, it ignores the featureAccessMap and performs a strict tier comparison.
    hasAccess: (featureKey, requiredTier) => {
      if (requiredTier !== undefined) {
        return getCurrentTier() >= requiredTier;
      }

      // If the key doesn't exist in our map, fail secure (deny access)
      if (featureAccessMap[featureKey] === undefined) {
        console.warn(`Access check failed: Feature key '${featureKey}' is not defined.`);
        return false;
      }
      return featureAccessMap[featureKey];
    },

    // Keeping your original flags for backward compatibility if you used them elsewhere
    canSyncToCloud: !!user,
    canUsePremiumSounds: isPro,
    canUploadWallpaper: isPro,
    canViewHistoricalStats: isPro,
    canViewJournalInsights: isPro,
    getCurrentTier,
  };
}