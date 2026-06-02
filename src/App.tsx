import { useState, useCallback, useEffect } from 'react';
import { useFreighter } from './hooks/useFreighter';
import { WalletConnection } from './components/WalletConnection';
import { BalanceCard } from './components/BalanceCard';
import { FundWallet } from './components/FundWallet';
import { SendTransaction } from './components/SendTransaction';
import { TransactionHistory } from './components/TransactionHistory';
import { NetworkInfo } from './components/NetworkInfo';
import { StatusBar } from './components/StatusBar';
import type { TransactionRecord } from './utils/types';

function App() {
  const {
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
  } = useFreighter();

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('stellar_transaction_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [statusMessages, setStatusMessages] = useState<
    { id: number; message: string; type: string }[]
  >([]);

  const addStatus = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      const id = Date.now();
      setStatusMessages((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setStatusMessages((prev) => prev.filter((m) => m.id !== id));
      }, 5000);
    },
    []
  );

  const handleConnect = useCallback(async () => {
    try {
      await connect();
      addStatus('Wallet connected successfully!', 'success');
    } catch (err: any) {
      if (err.message?.includes('User rejected')) {
        addStatus('Connection rejected by user', 'error');
      } else if (err.message?.includes('not detected')) {
        addStatus(
          'Freighter wallet not detected. Please install from freight.app',
          'error'
        );
      } else {
        addStatus(`Connection failed: ${err.message}`, 'error');
      }
    }
  }, [connect, addStatus]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    addStatus('Wallet disconnected', 'info');
  }, [disconnect, addStatus]);

  const handleTransactionSuccess = useCallback(
    (hash: string, amount: string, recipient: string, ledger: number) => {
      const tx: TransactionRecord = {
        hash,
        amount,
        recipient,
        timestamp: new Date().toISOString(),
        status: 'success',
        ledger,
      };
      const updated = [tx, ...transactions];
      setTransactions(updated);
      localStorage.setItem(
        'stellar_transaction_history',
        JSON.stringify(updated)
      );
      addStatus('Transaction sent successfully!', 'success');
    },
    [transactions, addStatus]
  );

  const handleClearHistory = useCallback(() => {
    setTransactions([]);
    localStorage.removeItem('stellar_transaction_history');
    addStatus('Transaction history cleared', 'info');
  }, [addStatus]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).freighter) {
      const handler = () => {
        if (publicKey) {
          addStatus('Wallet account changed. Please reconnect.', 'warning');
          disconnect();
        }
      };
      (window as any).freighter.on('accountChanged', handler);
      return () => {
        (window as any).freighter?.off?.('accountChanged', handler);
      };
    }
  }, [publicKey, disconnect, addStatus]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="gradient-border p-1 rounded-full">
              <div className="bg-slate-900 p-4 rounded-full">
                <i className="fas fa-rocket text-4xl bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent"></i>
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Stellar dApp
          </h1>
          <p className="text-gray-300 text-xl mb-2">
            Complete Freighter Wallet Integration
          </p>
          <StatusBar connectionStatus={connectionStatus} />
        </header>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <WalletConnection
              publicKey={publicKey}
              connectionStatus={connectionStatus}
              loading={loading}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
            <BalanceCard
              balance={balance}
              accountData={accountData}
              publicKey={publicKey}
              onRefresh={refreshBalance}
            />
            <FundWallet
              publicKey={publicKey}
              onFunded={refreshBalance}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <SendTransaction
              publicKey={publicKey}
              accountData={accountData}
              onSuccess={handleTransactionSuccess}
              onBalanceUpdate={refreshBalance}
            />
            <TransactionHistory
              transactions={transactions}
              onClear={handleClearHistory}
            />
            <NetworkInfo
              stats={networkStats}
              transactionCount={transactions.length}
            />
          </div>
        </div>
      </div>

      {/* Status Messages */}
      <div className="fixed top-4 right-4 space-y-2 z-50 max-w-sm">
        {statusMessages.map((msg) => (
          <div
            key={msg.id}
            className={`${
              msg.type === 'success'
                ? 'bg-green-500'
                : msg.type === 'error'
                ? 'bg-red-500'
                : msg.type === 'warning'
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            } text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300`}
          >
            <i
              className={`fas ${
                msg.type === 'success'
                  ? 'fa-check-circle'
                  : msg.type === 'error'
                  ? 'fa-exclamation-circle'
                  : msg.type === 'warning'
                  ? 'fa-exclamation-triangle'
                  : 'fa-info-circle'
              }`}
            ></i>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <i className="fas fa-spinner fa-spin text-2xl text-blue-400"></i>
              <span className="text-white">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
