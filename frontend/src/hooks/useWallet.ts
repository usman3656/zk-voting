import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: () => void) => void;
      removeListener: (event: string, handler: () => void) => void;
    };
  }
}

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      checkConnection();
      setupListeners();
    }
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(new BrowserProvider(window.ethereum));
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const setupListeners = () => {
    if (!window.ethereum) return;

    const handleAccountsChanged = () => {
      checkConnection();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  };

  const connect = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(new BrowserProvider(window.ethereum));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setError(null);
  };

  return {
    account,
    provider,
    isConnecting,
    error,
    connect,
    disconnect,
    isConnected: !!account,
  };
}

