import {
  isConnected,
  getAddress,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';
import StellarSdk from 'stellar-sdk';
import type { NetworkConfig, NetworkStats } from './types';

const { Asset, BASE_FEE, Memo, Operation, StrKey, Networks, TransactionBuilder } = StellarSdk;
const { Server } = StellarSdk.Horizon;

export const networkConfig: NetworkConfig = {
  name: 'Test Net',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  passphrase: Networks.TESTNET,
  friendbotUrl: 'https://friendbot.stellar.org',
};

export const server = new Server(networkConfig.horizonUrl);

export async function checkFreighter(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

export async function getWalletAddress(): Promise<string> {
  const result = await getAddress();
  return result.address;
}

export async function getWalletNetwork(): Promise<string> {
  const result = await getNetwork();
  return result.networkPassphrase;
}

export async function loadAccount(publicKey: string) {
  return server.loadAccount(publicKey);
}

export function getNativeBalance(accountData: any): string {
  const nativeBalance = accountData.balances.find(
    (b: any) => b.asset_type === 'native'
  );
  return nativeBalance ? nativeBalance.balance : '0';
}

export function getAvailableBalance(accountData: any): number {
  const balance = parseFloat(getNativeBalance(accountData));
  const minBalance = parseFloat(accountData.minimum_balance || '0');
  const fee = 0.00001;
  return Math.max(0, balance - minBalance - fee);
}

export async function fundWithFriendbot(publicKey: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `${networkConfig.friendbotUrl}?addr=${publicKey}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fund wallet');
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Funding request timed out');
    }
    throw error;
  }
}

export async function submitPayment(
  senderPublicKey: string,
  recipientAddress: string,
  amount: string
): Promise<any> {
  const account = await server.loadAccount(senderPublicKey);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkConfig.passphrase,
  })
    .addOperation(
      Operation.payment({
        destination: recipientAddress,
        asset: Asset.native(),
        amount,
      })
    )
    .addMemo(Memo.text('Stellar dApp Transaction'))
    .setTimeout(300)
    .build();

  const signedXDR = await signTransaction(transaction.toXDR(), {
    networkPassphrase: networkConfig.passphrase,
    address: senderPublicKey,
  });

  const signedTransaction = TransactionBuilder.fromXDR(
    signedXDR.signedTxXdr,
    networkConfig.passphrase
  );

  return server.submitTransaction(signedTransaction);
}

export function isValidStellarAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address);
}

export async function loadNetworkStats(): Promise<NetworkStats> {
  try {
    const response = await fetch(`${networkConfig.horizonUrl}/`);
    const data = await response.json();
    return {
      ledger: data.history_latest_ledger,
      baseFee: 100,
      reserveAmount: 1,
    };
  } catch {
    return { ledger: 0, baseFee: 100, reserveAmount: 1 };
  }
}
