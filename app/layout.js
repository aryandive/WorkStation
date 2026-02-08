import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EnvironmentProvider } from "@/context/EnvironmentContext";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext"; // Import the new provider
import GlobalListeners from '@/components/system/GlobalListeners';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'WorkStation - Focus, Journal, & Grow',
  description: 'The ultimate productivity hub with Pomodoro timer, journaling, and immersive environments.',
  openGraph: {
    title: 'WorkStation',
    description: 'Boost your productivity today.',
    images: ['/og-image.jpg'], // Add a nice image to public/ folder
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SubscriptionProvider> {/* Wrap with SubscriptionProvider */}
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