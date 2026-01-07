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
  // First, try to load wallets from Supabase to support cross-browser access
  // This ensures wallets created in one browser are available in another
  const supabase = createClient();
  try {
    const supabaseWallets = await nonCustodialWalletManager.loadWalletsFromSupabase(supabase, userId);
    console.log("[getUserWallets] Loaded from Supabase:", supabaseWallets.length, "wallets");
  } catch (error) {
    console.error("[getUserWallets] Failed to sync from Supabase:", error);
    // If Supabase sync fails, continue with local storage only
  }
  
  // Fetch non-custodial wallets from local storage (with user-specific key)
  // They should now include any wallets synced from Supabase
  const localWallets = nonCustodialWalletManager.getNonCustodialWallets(userId);
  
  const nonCustodialWallets: Wallet[] = localWallets.map(w => {
    // Determine crypto symbol based on chainId
    let symbol = w.chainId;
    if (w.chainId === 'Ethereum (ERC-20)') symbol = 'ETH';
    else if (w.chainId === 'Bitcoin (SegWit)') symbol = 'BTC';
    else if (w.chainId === 'Binance Smart Chain (BEP-20)') symbol = 'BNB';
    else if (w.chainId === 'Solana') symbol = 'SOL';
    else if (w.chainId === 'Tron (TRC-20)') symbol = 'TRX';
    // For stablecoins, use chainId as-is (e.g., "USDT-Ethereum (ERC-20)")

    const walletObj = {
      id: w.id,
      user_id: userId,
      crypto_symbol: symbol,
      balance: w.balance || 0,
      locked_balance: 0,
      deposit_address: w.address,
      created_at: w.createdAt,
      updated_at: w.createdAt,
      isNonCustodial: true
    };

    // Fetch real balance from blockchain
    try {
      import("./blockchain-api").then(async (api) => {
        console.log(`[SYNC] Starting sync for ${symbol} at ${w.address}`);
        const balance = await api.getAddressBalance(w.address);
        console.log(`[SYNC] Live ${symbol} balance: ${balance}`);
        
        if (balance !== null) {
          // Update the wallet object IMMEDIATELY
          walletObj.balance = balance;

          // Force update the non-custodial manager
          if (typeof (nonCustodialWalletManager as any).updateWalletBalance === 'function') {
            (nonCustodialWalletManager as any).updateWalletBalance(userId, w.id, balance);
            console.log(`[SYNC] Manager updated for ${symbol}`);
          }
        }
      });
    } catch (e) {
      console.error(`[SYNC] Top-level error for ${symbol}:`, e);
    }

    return walletObj;
  });

  return nonCustodialWallets;
}

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find(w => w.crypto_symbol === cryptoSymbol) || null;
}

export async function sendCrypto(
  userId: string,
  cryptoSymbol: string,
  toAddress: string,
  amount: number,
  notes?: string
): Promise<WalletTransaction> {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      crypto_symbol: cryptoSymbol,
      amount: amount,
      to_address: toAddress,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process withdrawal');
  }

  const result = await response.json();
  
  return {
    id: result.transaction.id,
    user_id: userId,
    wallet_id: result.transaction.wallet_id,
    type: 'withdrawal',
    crypto_symbol: cryptoSymbol,
    amount: -amount,
    fee: result.transaction.fee,
    status: result.transaction.status,
    tx_hash: result.tx_hash || null,
    from_address: null,
    to_address: toAddress,
    reference_id: null,
    notes: notes || null,
    confirmations: 0,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
}

export async function getDepositAddress(userId: string, cryptoSymbol: string): Promise<string> {
  const wallets = await getUserWallets(userId);
  
  // Find exact match first
  let wallet = wallets.find(w => w.crypto_symbol === cryptoSymbol);
  
  if (wallet?.deposit_address) {
    return wallet.deposit_address;
  }
  
  // If searching for a stablecoin without chain specified, find the first available instance
  if ((cryptoSymbol === 'USDT' || cryptoSymbol === 'USDC') && !cryptoSymbol.includes('-')) {
    wallet = wallets.find(w => w.crypto_symbol.startsWith(`${cryptoSymbol}-`));
    if (wallet?.deposit_address) {
      return wallet.deposit_address;
    }
  }
  
  // If we have any non-custodial wallet, use its address as fallback
  const anyWallet = wallets.find(w => w.isNonCustodial);
  if (anyWallet?.deposit_address) {
    return anyWallet.deposit_address;
  }
  
  throw new Error('No deposit address found for this non-custodial wallet.');
}

export async function getWalletTransactions(
  userId: string,
  limit: number = 20
): Promise<WalletTransaction[]> {
  // Return empty transactions as we are moving away from server-side history for non-custodial
  return [];
}

export async function monitorDeposits(userId: string, cryptoSymbol: string): Promise<{
  detected: boolean;
  transactions?: any[];
  message?: string;
}> {
  // Non-custodial wallets monitor on-chain, not through server functions
  return { detected: false, message: 'Non-custodial monitoring handled on-client' };
}

export async function monitorWithdrawals(userId: string): Promise<{
  monitored: number;
  updated: any[];
  message?: string;
}> {
  return { monitored: 0, updated: [], message: 'Non-custodial monitoring handled on-client' };
}

export function startDepositMonitoring(
  userId: string,
  cryptoSymbol: string,
  onDeposit: (transactions: any[]) => void,
  intervalMs: number = 30000
): () => void {
  const checkDeposits = async () => {
    try {
      const result = await monitorDeposits(userId, cryptoSymbol);
      if (result.detected && result.transactions && result.transactions.length > 0) {
        onDeposit(result.transactions);
      }
    } catch (error) {
      console.error('Deposit monitoring error:', error);
    }
  };

  const intervalId = setInterval(checkDeposits, intervalMs);
  checkDeposits();

  return () => clearInterval(intervalId);
}

export function startWithdrawalMonitoring(
  userId: string,
  onUpdate: (transactions: any[]) => void,
  intervalMs: number = 30000
): () => void {
  const checkWithdrawals = async () => {
    try {
      const result = await monitorWithdrawals(userId);
      if (result.updated && result.updated.length > 0) {
        onUpdate(result.updated);
      }
    } catch (error) {
      console.error('Withdrawal monitoring error:', error);
    }
  };

  const intervalId = setInterval(checkWithdrawals, intervalMs);
  checkWithdrawals();

  return () => clearInterval(intervalId);
}

export async function sendPexlyPayment(
  senderId: string,
  recipientId: string,
  amount: number,
  cryptoSymbol: string = 'USDT',
  note?: string
): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
}> {
  const supabase = createClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    console.log('🚀 DEBUG: Calling pexly-pay-send edge function:', {
      sender_id: senderId,
      recipient_id: recipientId,
      amount,
      crypto_symbol: cryptoSymbol,
      note
    });

    // Call the pexly-pay-send edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pexly-pay-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        crypto_symbol: cryptoSymbol,
        note: note || null,
      }),
    });

    console.log('📡 DEBUG: Edge function response status:', response.status);

    const result = await response.json();
    
    console.log('📦 DEBUG: Edge function response:', result);

    if (!response.ok) {
      console.error('❌ Edge function error:', result);
      return { 
        success: false, 
        error: result.error || result.message || 'Failed to process transfer' 
      };
    }

    return {
      success: true,
      transactionId: result.transaction_id || result.transactionId,
    };
  } catch (error) {
    console.error('❌ Error in sendPexlyPayment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
