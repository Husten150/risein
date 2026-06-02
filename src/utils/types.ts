export interface NetworkConfig {
  name: string;
  horizonUrl: string;
  passphrase: string;
  friendbotUrl: string;
}

export interface NetworkStats {
  ledger: number;
  baseFee: number;
  reserveAmount: number;
}

export interface TransactionRecord {
  hash: string;
  amount: string;
  recipient: string;
  timestamp: string;
  status: 'success' | 'failed';
  ledger: number;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connected'
  | 'locked'
  | 'error'
  | 'wrong-network';
