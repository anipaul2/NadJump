"use client";
import { useState } from 'react';
import MonadJumpGame from './components/MonadJumpGame';
import AuthComponent from './components/AuthComponent';
import ScoreDebugger from './components/ScoreDebugger';

export default function Home() {
  const [playerAddress, setPlayerAddress] = useState<string>("");

  return (
    <div className="min-h-screen relative">
      {/* Game takes full screen */}
      <MonadJumpGame playerAddress={playerAddress} />
      
      {/* Auth component positioned at top right above canvas */}
      <div className="absolute top-4 right-4 z-20">
        <AuthComponent onAddressChange={setPlayerAddress} />
      </div>
      
      {/* Debug component positioned at bottom right */}
      {playerAddress && (
        <div className="absolute bottom-4 right-4 z-20">
          <ScoreDebugger playerAddress={playerAddress} />
        </div>
      )}
    </div>
  );
}