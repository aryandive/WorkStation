// lib/premiumFeatures.js

export const PREMIUM_FEATURES = {
  'audio_mixing': {
    title: 'Mix Your Perfect Atmosphere',
    description: 'Layer rain, forest, and white noise simultaneously to create your ultimate deep-work environment.',
    icon: '/ambience.svg',
    ctaText: 'Unlock Audio Mixer',
    // The tracking ID allows the pricing page to know what triggered the visit
    trackingId: 'upsell_audio_mix'
  },

  'premium_sounds': {
    title: 'Unlock Exclusive Soundscapes',
    description: 'Access our high-fidelity premium audio library designed specifically for cognitive focus.',
    icon: '/ambience.svg',
    ctaText: 'Get Premium Sounds',
    trackingId: 'upsell_premium_sounds'
  },

  'animated_scenes': {
    title: 'Unlock Premium Scenes',
    description: 'Access our beautifully crafted, high-quality animated scenes to elevate your focus environment.',
    icon: '/ambience.svg',
    ctaText: 'Unlock Premium Scenes',
    trackingId: 'upsell_animated_scenes'
  },

  'premium_wallpaper': {
    title: 'Unlock Premium Backgrounds',
    description: 'Immerse yourself in deep work with our curated collection of stunning static wallpapers.',
    icon: '/ambience.svg',
    ctaText: 'Get Premium Wallpapers',
    trackingId: 'upsell_premium_wallpaper'
  },

  'premium_youtube': {
    title: 'Unlock Advanced Media Integrations',
    description: 'Mix your own focus aesthetic by importing custom YouTube videos and accessing the full curation library.',
    icon: '/ambience.svg',
    ctaText: 'Unlock YouTube Integrations',
    trackingId: 'upsell_premium_youtube'
  },

  'historical_stats': {
    title: 'Deep Productivity Insights',
    description: 'Visualize your focus trends, view the Ghost Bar history, and uncover your peak performance hours.',
    icon: '/stats.svg',
    ctaText: 'Unlock Focus Analytics',
    trackingId: 'upsell_historical_stats'
  },

  'journal_insights': {
    title: 'Advanced Journal Analytics',
    description: 'Review your Activity Rings and mood trends over time to master your mental well-being.',
    icon: '/journal.svg',
    ctaText: 'Unlock Journal Insights',
    trackingId: 'upsell_journal_insights'
  },

  'unlimited_projects': {
    title: 'Remove Project Limits',
    description: 'Your ambitions shouldn\'t be capped. Create unlimited projects and conquer complex workflows.',
    icon: '/todo.svg',
    ctaText: 'Unlock Unlimited Projects',
    trackingId: 'upsell_unlimited_projects'
  }
};