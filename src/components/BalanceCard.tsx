import { useMemo } from 'react';

interface Props {
  balance: string;
  accountData: any;
  publicKey: string | null;
  onRefresh: () => void;
}

export function BalanceCard({
  balance,
  accountData,
  publicKey,
  onRefresh,
}: Props) {
  const minBalance = useMemo(
    () => parseFloat(accountData?.minimum_balance || '0'),
    [accountData]
  );
  const available = useMemo(
    () => Math.max(0, parseFloat(balance) - minBalance),
    [balance, minBalance]
  );

  return (
    <section className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="fas fa-coins mr-3 text-yellow-400"></i>
        Balance
      </h2>

      <div className="space-y-4">
        <div className="bg-black/30 rounded-lg p-4">
          <p className="text-gray-300 mb-2">Available Balance:</p>
          <div className="text-3xl font-bold text-yellow-400 flex items-center">
            {publicKey ? (
              <>
                <i className="fas fa-coins mr-2"></i>
                {parseFloat(balance).toFixed(7)} XLM
              </>
            ) : (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                <span>Connect wallet</span>
              </>
            )}
          </div>
          {publicKey && accountData && (
            <div className="mt-3 text-sm text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Reserved:</span>
                <span>{minBalance.toFixed(7)} XLM</span>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="text-green-400">{available.toFixed(7)} XLM</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={!publicKey}
          className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh Balance
        </button>
      </div>
    </section>
  );
}
