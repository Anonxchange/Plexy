import { nonCustodialWalletManager } from "./non-custodial-wallet";
import { createClient } from "./supabase";

export interface Wallet {
  id: string;
  user_id: string;
  crypto_symbol: string;
  balance: number;
  locked_balance: number;
  deposit_address: string | null;
  created_at: string;
  updated_at: string;
  isNonCustodial?: boolean;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'swap' | 'p2p_buy' | 'p2p_sell' | 'escrow_lock' | 'escrow_release' | 'fee';
  crypto_symbol: string;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  reference_id: string | null;
  notes: string | null;
  confirmations: number | null;
  created_at: string;
  completed_at: string | null;
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const supabase = createClient();
  console.log("[getUserWallets] Fetching balances for user:", userId);

  try {
    const result = await supabase.functions.invoke('monitor-deposits');
    
    // Check for potential error without stopping execution
    if (result?.error) {
      console.warn("[getUserWallets] Edge function sync failed:", result.error);
    }

    const balances = result?.data?.balances || result?.balances || result?.walletBalances || result?.data || result || {};
    
    // If it's an object with keys being symbols
    const balancesArray = Array.isArray(balances) ? balances : Object.entries(balances || {}).map(([symbol, data]: [string, any]) => {
      if (typeof data === 'object' && data !== null) {
        return {
          symbol: data.symbol || data.currency || data.chainId || symbol,
