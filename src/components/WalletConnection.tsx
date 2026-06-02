import { useState } from 'react';
import type { ConnectionStatus } from '../utils/types';

interface Props {
  publicKey: string | null;
  connectionStatus: ConnectionStatus;
  loading: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export function WalletConnection({
  publicKey,
  connectionStatus,
  loading,
  onConnect,
  onDisconnect,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <section className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="fas fa-wallet mr-3 text-blue-400"></i>
        Wallet Connection
      </h2>

      <div className="space-y-4">
        {!publicKey ? (
          <button
            onClick={onConnect}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <i className="fas fa-plug mr-2"></i>
            {loading ? 'Connecting...' : 'Connect Freighter'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Connected Address:</p>
              <div className="flex items-center space-x-2">
                <p className="font-mono text-sm text-blue-300 flex-1 break-all">
                  {publicKey}
                </p>
                <button
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-white transition-colors shrink-0"
                  title="Copy address"
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400">
                  Network:{' '}
                  <span className="text-green-400">Stellar Testnet</span>
                </p>
              </div>
            </div>
            <button
              onClick={onDisconnect}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <i className="fas fa-unlink mr-2"></i>
              Disconnect
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
