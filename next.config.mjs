/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'img.youtube.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            }
        ],
    },
    experimental: {
        // "allowedDevOrigins" is often flagged as invalid. 
        // We use "serverActions.allowedOrigins" instead, which solves the Ngrok host issue.
        serverActions: {
            allowedOrigins: [
                'localhost:3000',
                'expostulatory-jeanine-vaccinial.ngrok-free.dev', // Your Ngrok domain
            ],
        },
    },
};

export default nextConfig;