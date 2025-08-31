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
  title: "NadJump",
  description: "Jump through platforms and compete on the Monad Games leaderboard! Can you reach the top?",
  openGraph: {
    title: "NadJump",
    description: "Jump through platforms and compete on the Monad Games leaderboard! Can you reach the top?",
    images: ["/monad-logo.svg"],
    url: "https://nad-jump.vercel.app",
  },
  other: {
    // Farcaster Frame metadata
    "fc:frame": "vNext",
    "fc:frame:image": "https://images.mirror-media.xyz/publication-images/lfQW4WaW_6wEX_2sS2m3n.jpeg?height=800&width=1200",
    "fc:frame:button:1": "🎮 Play NadJump",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://nad-jump.vercel.app",
    
    // Farcaster Miniapp metadata
    "fc:miniapp": JSON.stringify({
      "version": "1",
      "imageUrl": "https://images.mirror-media.xyz/publication-images/lfQW4WaW_6wEX_2sS2m3n.jpeg?height=800&width=1200",
      "button": {
        "title": "🎮 Play NadJump",
        "action": {
          "type": "launch_miniapp",
          "name": "NadJump", 
          "url": "https://nad-jump.vercel.app/",
          "splashImageUrl": "https://images.mirror-media.xyz/publication-images/lfQW4WaW_6wEX_2sS2m3n.jpeg?height=800&width=1200",
          "splashBackgroundColor": "#836EF9"
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
          position="top-center"
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
