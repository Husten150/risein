import { useState, useEffect, useCallback } from 'react';
import {
  checkFreighter,
  getWalletAddress,
  getWalletNetwork,
  loadAccount,
  getNativeBalance,
  networkConfig,
  loadNetworkStats,
} from '../utils/stellar';
import type { ConnectionStatus, NetworkStats } from '../utils/types';

export function useFreighter() {
  const [freighterAvailable, setFreighterAvailable] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [accountData, setAccountData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    ledger: 0,
    baseFee: 100,
    reserveAmount: 1,
  });
  const [loading, setLoading] = useState(false);

  const checkFreighterStatus = useCallback(async () => {
    const available = await checkFreighter();
    setFreighterAvailable(available);
    if (!available) {
      setConnectionStatus('disconnected');
    }
    return available;
  }, []);

  const fetchBalance = useCallback(async (pk: string) => {
    try {
      const account = await loadAccount(pk);
      setAccountData(account);
      setBalance(getNativeBalance(account));
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const available = await checkFreighterStatus();
      if (!available) {
        throw new Error('Freighter wallet not detected');
      }

      const pk = await getWalletAddress();
      setPublicKey(pk);
      setConnectionStatus('connected');

      // Check network
      try {
        const network = await getWalletNetwork();
        if (network !== networkConfig.passphrase) {
          setConnectionStatus('wrong-network');
        }
      } catch {
        // ignore
      }

      await fetchBalance(pk);
    } catch (err: any) {
      setConnectionStatus('error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkFreighterStatus, fetchBalance]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setBalance('0');
    setAccountData(null);
    setConnectionStatus('disconnected');
  }, []);

  const refreshBalance = useCallback(async () => {
    if (publicKey) {
      await fetchBalance(publicKey);
    }
  }, [publicKey, fetchBalance]);

  const refreshNetworkStats = useCallback(async () => {
    const stats = await loadNetworkStats();
    setNetworkStats(stats);
  }, []);

  useEffect(() => {
    checkFreighterStatus();
    refreshNetworkStats();
    const interval = setInterval(refreshNetworkStats, 30000);
    return () => clearInterval(interval);
  }, [checkFreighterStatus, refreshNetworkStats]);

  return {
    freighterAvailable,
    publicKey,
    balance,
    accountData,
    connectionStatus,
    networkStats,
    loading,
    connect,
    disconnect,
    refreshBalance,
    refreshNetworkStats,
  };
}
