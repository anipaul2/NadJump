import { Metadata } from 'next';
import PageClient from './page-client';

const frame = {
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
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'NadJump - Jump & Compete',
    description: 'A fun jumping game built for Monad Games ID Mission 7 - compete on the leaderboard!',
    openGraph: {
      title: 'NadJump - Jump & Compete', 
      description: 'A fun jumping game built for Monad Games ID Mission 7 - compete on the leaderboard!',
      images: [
        {
          url: 'https://images.mirror-media.xyz/publication-images/lfQW4WaW_6wEX_2sS2m3n.jpeg?height=800&width=1200',
          width: 1200,
          height: 800,
        },
      ],
    },
    other: {
      'fc:miniapp': JSON.stringify(frame),
      'fc:frame': JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <PageClient />;
}