import type { ConnectionStatus } from '../utils/types';

interface Props {
  connectionStatus: ConnectionStatus;
}

const statusConfig: Record<
  ConnectionStatus,
  { icon: string; text: string; color: string }
> = {
  connected: {
    icon: 'fa-circle',
    text: 'Connected',
    color: 'text-green-400',
  },
  disconnected: {
    icon: 'fa-circle',
    text: 'Disconnected',
    color: 'text-red-400',
  },
  locked: { icon: 'fa-lock', text: 'Wallet Locked', color: 'text-yellow-400' },
  error: {
    icon: 'fa-exclamation-triangle',
    text: 'Connection Error',
    color: 'text-red-400',
  },
  'wrong-network': {
    icon: 'fa-exclamation-triangle',
    text: 'Wrong Network',
    color: 'text-orange-400',
  },
};

export function StatusBar({ connectionStatus }: Props) {
  const config = statusConfig[connectionStatus] || statusConfig.disconnected;

  return (
    <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
      <span>
        <i className="fas fa-network-wired mr-1"></i>Testnet
      </span>
      <span>•</span>
      <span id="connection-status">
        <i className={`fas ${config.icon} ${config.color} mr-1`}></i>
        {config.text}
      </span>
    </div>
  );
}
