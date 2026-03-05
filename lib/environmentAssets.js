// lib/environmentAssets.js

export const ASSET_TIERS = {
    // 0 = Anonymous, 1 = Free, 2 = Pro

    // --- STATIC BACKGROUNDS ---
    // Tier 0
    'nat_1': 0, // 'nature pixabay 1'
    'nat_2': 0, // 'nature pixabay 2'
    'city_1': 0, // 'manhatten skyline'

    // Tier 1
    'anime_1': 1, // 'Tanjiro kamado'
    'animal_1': 1, // 'pascal muller animal'
    'animal_2': 1, // 'hanny naibaho animal'
    // ... all other static backgrounds default to 2

    // --- YOUTUBE ---
    // Tier 0 & 1
    'youtube_curated': 0, // Curated playlists are available for everyone

    // Tier 2
    'youtube_custom': 2,  // Custom source
    'youtube_library': 2, // Scroll to library

    // --- SOUNDSCAPES ---
    // Tier 0
    '/sounds/rain.mp3': 0,

    // Tier 1
    '/sounds/fireplace.mp3': 0,
    // ... all other soundscapes default to 2

    // --- ANIMATED SCENES ---
    // Tier 1 (Free Users)
    // 'cosy-ambience': 1, // 'cozy ambience'
    // 'astronaut': 1, // 'astronaut drowning'
    // 'adventure-time': 1, // 'adventure times'
    // ... all other animated scenes default to Tier 2 (Pro)

    'iDyDYLHqx5c': 1, // astronaut
    'Ga6FD1lDnck': 0, // adventure-time
    'iT9hfpVl9yI': 0, // cosy-ambience
    // --- HELPER FUNCTION ---
    // Helper to get tier securely, defaulting to Pro (2) if not explicitly listed
    getTier: (id, categoryType) => {
        // Custom stuff is automatically Tier 2 (Pro)
        if (categoryType === 'custom') return 2;

        // Otherwise, look up the ID. If it doesn't exist, default to 2 (Pro)
        return ASSET_TIERS[id] !== undefined ? ASSET_TIERS[id] : 2;
    }
};
