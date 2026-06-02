import type { NetworkStats } from '../utils/types';

interface Props {
  stats: NetworkStats;
  transactionCount: number;
}

export function NetworkInfo({ stats, transactionCount }: Props) {
  return (
    <section className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="fas fa-chart-line mr-3 text-cyan-400"></i>
        Network Information
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-black/30 rounded-lg p-3">
          <p className="text-2xl font-bold text-cyan-400">{stats.ledger || '-'}</p>
          <p className="text-xs text-gray-400">Ledger</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <p className="text-2xl font-bold text-green-400">{stats.baseFee}</p>
          <p className="text-xs text-gray-400">Base Fee</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <p className="text-2xl font-bold text-yellow-400">{stats.reserveAmount}</p>
          <p className="text-xs text-gray-400">Reserve (XLM)</p>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <p className="text-2xl font-bold text-purple-400">{transactionCount}</p>
          <p className="text-xs text-gray-400">Transactions</p>
        </div>
      </div>
    </section>
  );
}
