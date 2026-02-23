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