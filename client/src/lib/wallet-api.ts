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
    const { data: { session } } = await supabase.auth.getSession();
    const result = await supabase.functions.invoke<any>('monitor-deposits', {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}
    });
    
    // Check for potential error without stopping execution
    if (result?.error) {
      console.warn("[getUserWallets] Edge function sync failed:", result.error);
    }

    const data: any = (result as any)?.data || {};
    const balances = data.balances || data.walletBalances || (result as any)?.balances || (result as any)?.walletBalances || (result as any)?.data || result || {};
    
    // If it's an object with keys being symbols
    const balancesArray = Array.isArray(balances) ? balances : Object.entries(balances || {}).map(([symbol, data]: [string, any]) => {
      if (typeof data === 'object' && data !== null) {
        return {
          symbol: data.symbol || data.currency || data.chainId || symbol,
          balance: typeof data.balance === 'number' ? data.balance : 0,
          locked_balance: typeof data.locked_balance === 'number' ? data.locked_balance : 0,
          address: data.address || data.deposit_address
        };
      }
      return {
        symbol,
        balance: typeof data === 'number' ? data : 0
      };
    });

    // CRITICAL: Filter out non-crypto symbols (junk from API responses like "success", "message", etc.)
    const VALID_CRYPTO_SYMBOLS = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB', 'TRX', 'LTC', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'DOT', 'LINK', 'UNI', 'ATOM', 'APT', 'ARB', 'OP', 'NEAR', 'FTM', 'ALGO', 'VET', 'BASE'];
    
    const wallets: Wallet[] = (balancesArray
      .filter((b: any) => {
        try {
          const symbol = (b?.symbol || b?.crypto_symbol || b?.currency || '').toUpperCase();
          return symbol && (VALID_CRYPTO_SYMBOLS.includes(symbol) || VALID_CRYPTO_SYMBOLS.some((s: string) => symbol.startsWith(s + '-')));
        } catch (e) {
          return false;
        }
      })
      .map((b: any) => {
        try {
          const symbol = (b.symbol || b.crypto_symbol || b.currency || '').toUpperCase();
          return {
            id: b.wallet_id || b.address || b.id || `wallet-${symbol}`,
            user_id: userId,
            crypto_symbol: symbol,
            balance: typeof b.balance === 'number' ? b.balance : 0,
            locked_balance: typeof b.locked_balance === 'number' ? b.locked_balance : 0,
            deposit_address: b.address || b.deposit_address,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            isNonCustodial: true
          };
        } catch (e) {
          return null;
        }
      }) as (Wallet | null)[])
      .filter((w: Wallet | null): w is Wallet => w !== null);

    // Sync with local non-custodial wallets to ensure we have all addresses
    const localWallets = nonCustodialWalletManager.getNonCustodialWallets(userId);
    localWallets.forEach(local => {
      const exists = wallets.find(w => w.crypto_symbol === local.chainId || w.deposit_address === local.address);
      if (!exists) {
        wallets.push({
          id: local.id,
          user_id: userId,
          crypto_symbol: local.chainId,
          balance: local.balance || 0,
          locked_balance: 0,
          deposit_address: local.address,
          created_at: local.createdAt,
          updated_at: local.createdAt,
          isNonCustodial: true
        });
      }
    });

    // For non-custodial, we should really be checking the blockchain directly
    // but for now we ensure it's handled as much as possible on the client side
    // avoiding unnecessary backend calls if possible, or ensuring they are non-blocking
    console.log("[getUserWallets] Synced wallets:", wallets.map(w => `${w.crypto_symbol}: ${w.balance}`));
    return wallets;
  } catch (e) {
    console.warn(`[getUserWallets] Remote sync failed, using local non-custodial data:`, e);
    // Fallback to local wallets if sync fails
    const localWallets = nonCustodialWalletManager.getNonCustodialWallets(userId);
    return localWallets.map((w) => {
      let symbol = w.chainId;
      if (w.chainId === 'Ethereum (ERC-20)') symbol = 'ETH';
      else if (w.chainId === 'Bitcoin (SegWit)') symbol = 'BTC';
      else if (w.chainId === 'Binance Smart Chain (BEP-20)') symbol = 'BNB';
      else if (w.chainId === 'Solana') symbol = 'SOL';
      else if (w.chainId === 'Tron (TRC-20)') symbol = 'TRX';

      return {
        id: w.id,
        user_id: userId,
        crypto_symbol: symbol,
        balance: typeof w.balance === 'number' ? w.balance : 0,
        locked_balance: 0,
        deposit_address: w.address,
        created_at: w.createdAt,
        updated_at: w.createdAt,
        isNonCustodial: true
      };
    });
  }
}

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find(w => w.crypto_symbol === cryptoSymbol) || null;
}

export async function getWalletTransactions(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getWalletTransactions] Error:", error);
    throw new Error(error.message);
  }

  return (data ?? []) as WalletTransaction[];
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
  
  let wallet = wallets.find(w => w.crypto_symbol === cryptoSymbol);
  
  if (wallet?.deposit_address) {
    return wallet.deposit_address;
  }
  
  if ((cryptoSymbol === 'USDT' || cryptoSymbol === 'USDC') && !cryptoSymbol.includes('-')) {
    wallet = wallets.find(w => w.crypto_symbol.startsWith(`${cryptoSymbol}-`));
    if (wallet?.deposit_address) {
      return wallet.deposit_address;
    }
  }
  
  const anyWallet = wallets.find(w => w.isNonCustodial);
  if (anyWallet?.deposit_address) {
    return anyWallet.deposit_address;
  }
  
  throw new Error('No deposit address found for this wallet.');
}

export async function monitorDeposits(userId: string, cryptoSymbol: string): Promise<{
  detected: boolean;
  transactions?: any[];
  message?: string;
}> {
  return { detected: false, message: 'Non-custodial monitoring handled on-client' };
}

export async function createCDPSession(address: string, assets: string[]): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  console.log("[createCDPSession] Calling cdp-create-session for address:", address);

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cdp-create-session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'X-Client-Info': 'pexly-client',
    },
    body: JSON.stringify({
      address,
      assets,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error("[createCDPSession] Error response:", errorData);
    throw new Error(errorData.error || errorData.message || `Failed to create CDP session: ${response.statusText}`);
  }

  const data = await response.json();

  // Debug raw response
  console.log("[createCDPSession] Raw result:", JSON.stringify(data, null, 2));

  // The Supabase Edge function response structure might vary
  // Check for session_token, sessionToken, or token in common locations
  const token = data?.session_token || data?.sessionToken || data?.token || 
                data?.data?.session_token || data?.data?.sessionToken || data?.data?.token ||
                data?.result?.session_token || data?.result?.sessionToken || data?.result?.token;
  
  if (!token) {
    console.error("[createCDPSession] No token found in response:", data);
    // If the data itself is a string, it might be the token
    if (typeof data === 'string' && data.length > 20) return data;
  }

  return token;
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

export async function monitorWithdrawals(userId: string): Promise<{
  updated: any[];
  message?: string;
}> {
  return { updated: [], message: 'Withdrawal monitoring handled on-client' };
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
