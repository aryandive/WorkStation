import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { EnvironmentProvider } from '@/context/EnvironmentContext';
import GlobalListeners from '@/components/system/GlobalListeners';

// 1. Optimize Fonts (Variable fonts for performance)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // UX: Prevents invisible text during load
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// 2. SEO Metadata (Static)
export const metadata = {
  title: {
    template: '%s | SyncFlowState',
    default: 'SyncFlowState - Immersive Productivity Platform',
  },
  description: 'Boost focus with our immersive productivity suite. Features Pomodoro timer, ambient soundscapes, task management, and reflective journaling.',
  keywords: ['productivity', 'pomodoro', 'focus', 'journal', 'ambient sounds', '  '],
  authors: [{ name: 'SyncFlowState' }],
  creator: 'SyncFlowState',
  openGraph: {
    title: 'SyncFlowState - Master Your Focus',
    description: 'Immersive productivity tools for deep work.',
    // url: 'https://SyncFlowStatefocus.com', // Replace with your actual domain
    url: 'https://syncflowstate.com',
    siteName: 'SyncFlowState',
    images: [
      {
        url: '/og-image.jpg', // Ensure you add this image to public/ folder
        width: 1200,
        height: 630,
        alt: 'SyncFlowState Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SyncFlowState - Master Your Focus',
    description: 'Immersive productivity tools for deep work.',
    images: ['/og-image.jpg'], // Same image as OG
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png', // Add this to public/ if you have it
  },
};

// 3. Viewport Configuration (Separated in Next.js 14)
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // UX: Prevents input zooming on mobile
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <AuthProvider>
          <SubscriptionProvider>
            <EnvironmentProvider>
              <GlobalListeners />
              {children}
            </EnvironmentProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}