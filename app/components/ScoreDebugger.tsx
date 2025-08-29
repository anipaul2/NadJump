"use client";
import { useState, useEffect, useCallback } from 'react';
import { getPlayerTotalData, getPlayerGameData } from '../lib/score-api';
import { GAME_CONFIG } from '../lib/game-config';

interface ScoreDebuggerProps {
  playerAddress: string;
}

interface PlayerData {
  totalScore: string;
  totalTransactions: string;
}

interface GameData {
  score: string;
  transactions: string;
}

export default function ScoreDebugger({ playerAddress }: ScoreDebuggerProps) {
  const [totalData, setTotalData] = useState<PlayerData | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!playerAddress) return;
    
    setLoading(true);
    try {
      const [total, game] = await Promise.all([
        getPlayerTotalData(playerAddress),
        getPlayerGameData(playerAddress, GAME_CONFIG.GAME_ADDRESS),
      ]);
      setTotalData(total);
      setGameData(game);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  }, [playerAddress]);

  useEffect(() => {
    if (playerAddress && isVisible) {
      fetchData();
    }
  }, [playerAddress, isVisible, fetchData]);

  if (!playerAddress) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-black/70 text-white px-2 py-1 rounded text-xs hover:bg-black/90 mb-1"
      >
        {isVisible ? 'Hide' : 'Show'} Stats
      </button>
      
      {isVisible && (
        <div className="bg-black/80 text-white p-2 rounded shadow-lg max-w-xs border border-gray-700 text-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs">Stats</h3>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-blue-600 text-xs px-1 py-0.5 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : '↻'}
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div>
              <strong>Player:</strong> {playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}
            </div>
            
            <div className="border-t border-gray-700 pt-2">
              <strong>Total (All Games):</strong>
              {totalData ? (
                <div className="ml-2">
                  <div>Score: {totalData.totalScore}</div>
                  <div>Transactions: {totalData.totalTransactions}</div>
                </div>
              ) : (
                <div className="ml-2 text-gray-400">Not loaded</div>
              )}
            </div>
            
            <div className="border-t border-gray-700 pt-2">
              <strong>This Game:</strong>
              {gameData ? (
                <div className="ml-2">
                  <div>Score: {gameData.score}</div>
                  <div>Transactions: {gameData.transactions}</div>
                </div>
              ) : (
                <div className="ml-2 text-gray-400">Not loaded</div>
              )}
            </div>
            
            <div className="border-t border-gray-700 pt-2 text-gray-400">
              <div>Game: {GAME_CONFIG.GAME_ADDRESS.slice(0, 6)}...{GAME_CONFIG.GAME_ADDRESS.slice(-4)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}