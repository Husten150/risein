import type { TransactionRecord } from '../utils/types';

interface Props {
  transactions: TransactionRecord[];
  onClear: () => void;
}

export function TransactionHistory({ transactions, onClear }: Props) {
  return (
    <section className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <i className="fas fa-history mr-3 text-orange-400"></i>
          Transaction History
        </h2>
        {transactions.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-trash mr-1"></i>Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-inbox text-4xl mb-3"></i>
            <p>No transactions yet</p>
            <p className="text-sm">
              Send your first transaction to see it here!
            </p>
          </div>
        ) : (
          transactions.map((tx, i) => (
            <div
              key={`${tx.hash}-${i}`}
              className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-check-circle text-green-400"></i>
                    <span className="text-green-400 font-semibold">
                      Successful
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                    {tx.ledger && (
                      <span className="text-xs text-gray-500">
                        Ledger: {tx.ledger}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      Sent{' '}
                      <span className="text-yellow-400 font-bold">
                        {parseFloat(tx.amount).toFixed(7)} XLM
                      </span>
                    </p>
                    <p className="text-gray-400">
                      To:{' '}
                      <code className="text-blue-300">
                        {tx.recipient.substring(0, 8)}...
                        {tx.recipient.substring(tx.recipient.length - 8)}
                      </code>
                    </p>
                    <p className="text-gray-400">
                      Hash:{' '}
                      <code className="text-blue-300">
                        {tx.hash.substring(0, 8)}...
                        {tx.hash.substring(tx.hash.length - 8)}
                      </code>
                    </p>
                  </div>
                  <div className="flex space-x-3 mt-2">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                      <i className="fas fa-external-link-alt mr-1"></i>Explorer
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(tx.hash)}
                      className="text-gray-400 hover:text-white text-sm underline"
                    >
                      <i className="fas fa-copy mr-1"></i>Copy Hash
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
