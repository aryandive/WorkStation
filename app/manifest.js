// app/manifest.js
// Next.js App Router auto-serves this at /manifest.webmanifest
// The `display: 'standalone'` entry is the key PWA setting — it removes
// the browser chrome (URL bar, bottom navigation) when launched from home screen.

export default function manifest() {
    return {
        name: 'Work Station',
        short_name: 'Work Station',
        description: 'Your immersive focus environment — Pomodoro, Journal, Ambience.',
        start_url: '/',
        display: 'standalone',         // ← removes browser UI on iOS & Android
        orientation: 'portrait',
        background_color: '#030712',   // Tailwind gray-950 (matches app bg)
        theme_color: '#030712',        // Status bar color on Android
        categories: ['productivity', 'lifestyle'],
        icons: [
            {
                src: '/logo.webp',
                sizes: '192x192',
                type: 'image/webp',
                purpose: 'any maskable',
            },
            {
                src: '/logo.webp',
                sizes: '512x512',
                type: 'image/webp',
                purpose: 'any maskable',
            },
        ],
    };
}
