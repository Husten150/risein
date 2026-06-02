import { useState } from 'react';
import { fundWithFriendbot } from '../utils/stellar';

interface Props {
  publicKey: string | null;
  onFunded: () => void;
}

export function FundWallet({ publicKey, onFunded }: Props) {
  const [funding, setFunding] = useState(false);
  const [fundStatus, setFundStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleFund = async () => {
    if (!publicKey || funding) return;
    setFunding(true);
    setFundStatus(null);
    try {
      const result = await fundWithFriendbot(publicKey);
      setFundStatus({
        type: 'success',
        message: `Successfully funded with 10,000 testnet XLM! (Ledger: ${result.result_attr_ledger})`,
      });
      setTimeout(onFunded, 2000);
    } catch (err: any) {
      setFundStatus({
        type: 'error',
        message: `Funding failed: ${err.message}`,
      });
    } finally {
      setFunding(false);
    }
  };

  return (
    <section className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="fas fa-hand-holding-usd mr-3 text-green-400"></i>
        Fund Wallet
      </h2>

      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          Get 10,000 testnet XLM from Friendbot:
        </p>
        <button
          onClick={handleFund}
          disabled={!publicKey || funding}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <i className="fas fa-faucet mr-2"></i>
          {funding ? 'Funding...' : 'Fund with Testnet XLM'}
        </button>
        {fundStatus && (
          <div
            className={`bg-black/30 rounded-lg p-4 text-sm ${
              fundStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <i
              className={`fas ${
                fundStatus.type === 'success'
                  ? 'fa-check-circle'
                  : 'fa-exclamation-circle'
              } mr-2`}
            ></i>
            {fundStatus.message}
          </div>
        )}
      </div>
    </section>
  );
}
