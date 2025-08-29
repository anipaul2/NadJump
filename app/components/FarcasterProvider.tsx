"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FarcasterContextType {
  isReady: boolean;
  user: any;
  sendNotification: (message: string) => void;
  shareGame: (score?: number) => void;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isReady: false,
  user: null,
  sendNotification: () => {},
  shareGame: () => {},
});

export const useFarcaster = () => useContext(FarcasterContext);

export default function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function initFarcaster() {
      try {
        console.log('Initializing Farcaster SDK...');
        
        // Get context and user info
        const context = await sdk.context;
        console.log('Farcaster context:', context);
        
        if (context?.user) {
          setUser(context.user);
          console.log('Farcaster user:', context.user);
        }
        
        // Call ready() to hide splash screen and signal app is loaded
        await sdk.actions.ready();
        console.log('Farcaster SDK ready() called successfully');
        
        setIsReady(true);
      } catch (error) {
        console.log('Farcaster SDK not available or failed to initialize:', error);
        // Still set ready for standalone mode
        setIsReady(true);
      }
    }

    // Small delay to ensure DOM is ready
    setTimeout(initFarcaster, 100);
  }, []);

  const sendNotification = async (message: string) => {
    try {
      // Using new SDK
      await sdk.actions.sendNotification({ message });
      console.log('Notification sent:', message);
    } catch (error) {
      console.log('Notification not sent:', error);
    }
  };

  const shareGame = async (score?: number) => {
    try {
      console.log('Sharing game with score:', score);
      
      const text = score 
        ? `🎮 Just scored ${score} points in NadJump! Can you beat my score? 🚀 #MonadGames` 
        : '🎮 Check out NadJump - an awesome jumping game on Monad! 🚀 #MonadGames';
      
      // Use the new composeCast method
      await sdk.actions.composeCast({
        text,
        embeds: [{ url: window.location.href }]
      });
      
      console.log('Cast composed successfully');
    } catch (error) {
      console.log('Share not available or failed:', error);
      // Fallback for non-Farcaster environments
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'NadJump Game',
            text: score ? `I just scored ${score} points in NadJump!` : 'Check out NadJump!',
            url: window.location.href
          });
        } catch (shareError) {
          console.log('Native share failed:', shareError);
        }
      }
    }
  };

  return (
    <FarcasterContext.Provider value={{
      isReady,
      user,
      sendNotification,
      shareGame,
    }}>
      {children}
    </FarcasterContext.Provider>
  );
}