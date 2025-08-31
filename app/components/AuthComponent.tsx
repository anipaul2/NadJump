"use client";
import { useEffect, useState } from "react";
import {
  usePrivy,
  CrossAppAccountWithMetadata,
} from "@privy-io/react-auth";
import { useMonadGamesUser } from "../hooks/useMonadGamesUser";

// Separate component for when Privy is not configured
function AuthNotConfigured() {
  return (
    <div className="text-yellow-400 text-sm">
      Authentication not configured
    </div>
  );
}

// Main auth component with Privy hooks
function PrivyAuth({ onAddressChange }: { onAddressChange: (address: string) => void }) {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  
  const { 
    user: monadUser, 
    hasUsername 
  } = useMonadGamesUser(accountAddress);

  useEffect(() => {
    // Check if privy is ready and user is authenticated
    if (authenticated && user && ready) {
      // Check if user has linkedAccounts
      if (user.linkedAccounts.length > 0) {
        // Get the cross app account created using Monad Games ID        
        const crossAppAccount: CrossAppAccountWithMetadata = user.linkedAccounts.filter(account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42")[0] as CrossAppAccountWithMetadata;

        // The first embedded wallet created using Monad Games ID, is the wallet address
        if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
          const address = crossAppAccount.embeddedWallets[0].address;
          console.log('AuthComponent: Setting address:', address);
          setAccountAddress(address);
          onAddressChange(address);
        } else {
          console.log('AuthComponent: No embedded wallets found');
        }
      } else {
        setMessage("You need to link your Monad Games ID account to continue.");
      }
    } else {
      // Clear address when not authenticated
      setAccountAddress("");
      onAddressChange("");
    }
  }, [authenticated, user, ready, onAddressChange]);

  const copyToClipboard = async () => {
    if (accountAddress) {
      try {
        await navigator.clipboard.writeText(accountAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!ready) {
    return <div className="text-white text-sm">Loading...</div>;
  }

  if (!authenticated) {
    // Check if running inside Farcaster
    const isInFarcaster = typeof window !== 'undefined' && (window as any).isInFarcaster;
    
    if (isInFarcaster) {
      return (
        <div className="text-center bg-black/70 px-3 py-2 rounded text-xs max-w-xs">
          <div className="text-yellow-400 mb-2">⚠️ Login Required</div>
          <div className="text-white text-xs leading-tight">
            Open this game in your browser to login with Monad Games ID
          </div>
          <button 
            onClick={() => {
              // Try to open in external browser
              if (typeof window !== 'undefined') {
                window.open('https://nad-jump.vercel.app/', '_blank');
              }
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 mt-2"
          >
            Open in Browser
          </button>
        </div>
      );
    }
    
    return (
      <button 
        onClick={login}
        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
      >
        Login
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 text-sm max-w-xs">
      {accountAddress ? (
        <>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {hasUsername && monadUser ? (
              <span className="text-blue-300 text-xs bg-black/50 px-2 py-1 rounded">ID: {monadUser.username}</span>
            ) : (
              <a 
                href="https://monad-games-id-site.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
              >
                Register
              </a>
            )}
            
            <button 
              onClick={logout}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
            >
              Logout
            </button>
          </div>
          
          <div className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs">
            <span className="text-white font-mono">{formatAddress(accountAddress)}</span>
            <button
              onClick={copyToClipboard}
              className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs hover:bg-blue-600"
              title={accountAddress}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </>
      ) : message ? (
        <span className="text-red-400 text-xs bg-black/50 px-2 py-1 rounded">{message}</span>
      ) : (
        <span className="text-yellow-400 text-xs bg-black/50 px-2 py-1 rounded">Checking...</span>
      )}
    </div>
  );
}

// Main component that conditionally renders based on Privy configuration
export default function AuthComponent({ onAddressChange }: { onAddressChange: (address: string) => void }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!privyAppId) {
    return <AuthNotConfigured />;
  }
  
  return <PrivyAuth onAddressChange={onAddressChange} />;
}