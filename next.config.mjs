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
        serverActions: {
            allowedOrigins: process.env.NODE_ENV === 'development'
                ? ['localhost:3000', 'expostulatory-jeanine-vaccinial.ngrok-free.dev']
                : [], // In production, Vercel allows the hosted domain by default
        },
    },
};

export default nextConfig;