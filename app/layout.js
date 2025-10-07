import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EnvironmentProvider } from "@/context/EnvironmentContext";
import { AuthProvider } from "@/context/AuthContext"; // Import the new provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Work Station",
  description: "Your personal focus environment.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider> {/* Add the AuthProvider here */}
          <EnvironmentProvider>
            {children}
          </EnvironmentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

