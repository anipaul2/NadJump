"use client";
import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export default function FarcasterInit({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [readyCalled, setReadyCalled] = useState(false);

  useEffect(() => {
    // Initialize SDK context
    const initSDK = async () => {
      try {
        console.log('🚀 FarcasterInit: Loading SDK context...');
        await sdk.context;
        console.log('✅ FarcasterInit: SDK context loaded - Running inside Farcaster');
        setIsSDKLoaded(true);
        
        // Set global flag for other components
        (window as unknown as { isInFarcaster: boolean }).isInFarcaster = true;
      } catch {
        console.error('❌ FarcasterInit: Error loading SDK context - Running outside Farcaster');
        // Still set as loaded to allow app to continue
        setIsSDKLoaded(true);
        
        // Set global flag for other components  
        (window as unknown as { isInFarcaster: boolean }).isInFarcaster = false;
      }
    };

    initSDK();
  }, []);

  // Call ready when SDK is loaded and we're in Farcaster
  useEffect(() => {
    if (!isSDKLoaded) return;
    
    // Check if we're actually in Farcaster before calling ready
    const isInFarcaster = (window as unknown as { isInFarcaster?: boolean }).isInFarcaster;
    
    if (isInFarcaster) {
      const callReady = async () => {
        try {
          console.log('🚀 FarcasterInit: Calling sdk.actions.ready()...');
          await sdk.actions.ready();
          console.log('✅ FarcasterInit: sdk.actions.ready() called successfully');
          setReadyCalled(true);
        } catch {
          console.error('❌ FarcasterInit: Error calling sdk.actions.ready()');
          // Try again after a delay
          setTimeout(callReady, 1000);
        }
      };
      callReady();
    } else {
      // Not in Farcaster, just mark as ready
      setReadyCalled(true);
    }
  }, [isSDKLoaded]);

  // Show loading while SDK initializes
  if (!readyCalled) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#111',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        flexDirection: 'column'
      }}>
        <div style={{ 
          animation: 'spin 1s linear infinite',
          width: '40px',
          height: '40px',
          border: '3px solid #333',
          borderTop: '3px solid #836EF9',
          borderRadius: '50%',
          marginBottom: '16px'
        }} />
        <h2>Loading NadJump...</h2>
        <p style={{ opacity: 0.7, marginTop: '8px' }}>Initializing Farcaster SDK...</p>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    );
  }

  return <>{children}</>;
}