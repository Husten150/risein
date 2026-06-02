import { useState, useMemo } from 'react';
import { submitPayment, isValidStellarAddress } from '../utils/stellar';
import { getAvailableBalance } from '../utils/stellar';

interface Props {
  publicKey: string | null;
  accountData: any;
  onSuccess: (hash: string, amount: string, recipient: string, ledger: number) => void;
  onBalanceUpdate: () => void;
}

export function SendTransaction({
  publicKey,
  accountData,
  onSuccess,
  onBalanceUpdate,
}: Props) {
  const [recipient, setRecipient] = useState(
    'GC2TC5NCY5IPSX3EOQFNW4F3QWJHXZA4VY4RFRNYEGKMBGPDNLRXW3UX'
  );
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'pending';
    message: string;
  } | null>(null);

  const addressValid = recipient ? isValidStellarAddress(recipient.trim()) : null;
  const availableBalance = useMemo(
    () => (accountData ? getAvailableBalance(accountData) : 0),
    [accountData]
  );

  const totalAmount =
    (parseFloat(amount) || 0) + 0.00001;

  const handleMaxAmount = () => {
    if (availableBalance > 0) {
      setAmount(availableBalance.toFixed(7));
    }
  };

  const handleSend = async () => {
    if (!publicKey || sending) return;

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      setStatus({ type: 'error', message: 'Please enter a recipient address' });
      return;
    }
    if (!isValidStellarAddress(trimmedRecipient)) {
      setStatus({ type: 'error', message: 'Invalid recipient address' });
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }
    if (amountNum > availableBalance) {
      setStatus({ type: 'error', message: 'Insufficient balance' });
      return;
    }

    setSending(true);
    setStatus({ type: 'pending', message: 'Creating transaction...' });

    try {
      setStatus({ type: 'pending', message: 'Waiting for signature...' });
      const result = await submitPayment(
        publicKey,
        trimmedRecipient,
        amount
      );

      setStatus({
        type: 'success',
        message: `Transaction sent successfully! Hash: ${result.hash}`,
      });

      onSuccess(result.hash, amount, trimmedRecipient, result.ledger);
      setAmount('');

      setTimeout(onBalanceUpdate, 3000);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.extras?.result_codes?.operations?.[0] ||
        err.response?.data?.extras?.result_codes?.transaction ||
        err.message ||
        'Unknown error';
      setStatus({ type: 'error', message: `Transaction failed: ${errorMsg}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="fas fa-paper-plane mr-3 text-purple-400"></i>
        Send Transaction
      </h2>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <i className="fas fa-user mr-1"></i>Recipient Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="G..."
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 pr-10"
              />
              <span
                className={`absolute right-2 top-2.5 transition-colors ${
                  addressValid === null
                    ? 'text-gray-400'
                    : addressValid
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                <i
                  className={`fas ${
                    addressValid === null
                      ? 'fa-check-circle'
                      : addressValid
                      ? 'fa-check-circle'
                      : 'fa-exclamation-circle'
                  }`}
                ></i>
              </span>
            </div>
            {addressValid !== null && (
              <p
                className={`text-xs mt-1 ${
                  addressValid ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {addressValid ? 'Valid address' : 'Invalid address format'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <i className="fas fa-coins mr-1"></i>Amount (XLM)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.0"
                min="0.0000001"
                step="0.0000001"
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              />
              <button
                onClick={handleMaxAmount}
                disabled={!publicKey}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-white transition-colors text-xs"
                title="Use maximum available"
              >
                MAX
              </button>
            </div>
            <p className="text-xs mt-1 text-gray-400">
              {publicKey
                ? `Available: ${availableBalance.toFixed(7)} XLM | Minimum: 0.0000001 XLM`
                : 'Minimum: 0.0000001 XLM'}
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-3 text-sm text-gray-300 space-y-1">
          <div className="flex justify-between items-center">
            <span>
              <i className="fas fa-info-circle mr-1"></i>Transaction Fee:
            </span>
            <span className="text-yellow-400">0.00001 XLM</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Total:</span>
            <span className="text-green-400 font-semibold">
              {totalAmount.toFixed(7)} XLM
            </span>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={!publicKey || sending}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <i className="fas fa-rocket mr-2"></i>
          {sending ? 'Sending...' : 'Send Transaction'}
        </button>

        {status && (
          <div
            className={`bg-black/30 rounded-lg p-4 text-sm ${
              status.type === 'success'
                ? 'text-green-400'
                : status.type === 'error'
                ? 'text-red-400'
                : 'text-blue-400'
            }`}
          >
            {status.type === 'pending' ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {status.message}
              </>
            ) : (
              <>
                <i
                  className={`fas ${
                    status.type === 'success'
                      ? 'fa-check-circle'
                      : 'fa-exclamation-circle'
                  } mr-2`}
                ></i>
                {status.message}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
