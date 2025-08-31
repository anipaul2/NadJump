"use client";
import { useState } from 'react';
import MonadJumpGame from './components/MonadJumpGame';
import AuthComponent from './components/AuthComponent';
import ScoreDebugger from './components/ScoreDebugger';
import FarcasterInit from './components/FarcasterInit';

export default function PageClient() {
  const [playerAddress, setPlayerAddress] = useState<string>("");
  
  const handleAddressChange = (address: string) => {
    console.log('Home: Received address:', address);
    setPlayerAddress(address);
  };

  return (
    <FarcasterInit>
      <div className="min-h-screen relative">
        {/* Game takes full screen */}
        <MonadJumpGame playerAddress={playerAddress} />
        
        {/* Auth component positioned at top right above canvas */}
        <div className="absolute top-4 right-4 z-20">
          <AuthComponent onAddressChange={handleAddressChange} />
        </div>
        
        {/* Debug component positioned at bottom right */}
        {playerAddress && (
          <div className="absolute bottom-4 right-4 z-20">
            <ScoreDebugger playerAddress={playerAddress} />
          </div>
        )}
      </div>
    </FarcasterInit>
  );
}