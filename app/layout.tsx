import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PrivyProvider from "./components/PrivyProvider";
import FarcasterProvider from "./components/FarcasterProvider";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NadJump - Mission 7 Game",
  description: "🎮 Jump through platforms and compete on the Monad Games leaderboard! Can you reach the top?",
  openGraph: {
    title: "NadJump - Mission 7 Game",
    description: "🎮 Jump through platforms and compete on the Monad Games leaderboard! 🚀 #MonadGames",
    images: ["/monad-logo.svg"],
    url: "https://your-app-url.vercel.app",
  },
  other: {
    // Farcaster Frame metadata
    "fc:frame": "vNext",
    "fc:frame:image": "/monad-logo.svg",
    "fc:frame:button:1": "🎮 Play NadJump",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://your-app-url.vercel.app",
    
    // Farcaster Miniapp metadata
    "fc:miniapp": JSON.stringify({
      "version": "1",
      "name": "NadJump",
      "iconUrl": "/monad-logo.svg",
      "homeUrl": "https://your-app-url.vercel.app",
      "imageUrl": "/monad-logo.svg",
      "description": "Jump through platforms and compete on the Monad Games leaderboard!",
      "button": {
        "title": "🎮 Play Now",
        "action": {
          "type": "launch_miniapp"
        }
      }
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProvider>
          <FarcasterProvider>
            {children}
          </FarcasterProvider>
        </PrivyProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
