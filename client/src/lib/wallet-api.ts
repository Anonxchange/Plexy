import { nonCustodialWalletManager } from "./non-custodial-wallet";
import { supabase } from "./supabase";

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
  if (import.meta.env.DEV) {
    // Silenced in DEV to avoid console spam
  }

  try {
    const { data, error } = await supabase.functions.invoke('monitor-deposits');
    
    if (error) {
      console.warn("[getUserWallets] Edge function sync failed:", error);
    }

    const resultData: any = data || {};
    // Extended search for balance data in response
    const balances = resultData.balances || resultData.walletBalances || resultData.data || resultData.result || resultData || {};
    
    let balancesArray: any[] = [];
    if (Array.isArray(balances)) {
      balancesArray = balances;
    } else if (typeof balances === 'object' && balances !== null) {
      balancesArray = Object.entries(balances).map(([key, value]: [string, any]) => {
        // Skip metadata keys
        if (['success', 'message', 'timestamp', 'user_id', 'status'].includes(key.toLowerCase())) return null;
        
        if (typeof value === 'object' && value !== null) {
          return {
            symbol: value.symbol || value.currency || value.chainId || key,
            balance: typeof value.balance === 'number' ? value.balance : (typeof value.balance === 'string' ? parseFloat(value.balance) || 0 : 0),
            locked_balance: typeof value.locked_balance === 'number' ? value.locked_balance : (typeof value.locked_balance === 'string' ? parseFloat(value.locked_balance) || 0 : 0),
            address: value.address || value.deposit_address
          };
        }
        return {
          symbol: key,
          balance: typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0)
        };
      }).filter(Boolean);
    }

    const VALID_CRYPTO_SYMBOLS = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB', 'TRX', 'LTC', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'DOT', 'LINK', 'UNI', 'ATOM', 'APT', 'ARB', 'OP', 'NEAR', 'FTM', 'ALGO', 'VET', 'BASE', 'POLYGON', 'OPTIMISM'];
    
    const wallets: Wallet[] = (balancesArray
      .filter((b: any) => {
        try {
          const symbol = (b?.symbol || b?.crypto_symbol || b?.currency || b?.chainId || '').toUpperCase();
          if (!symbol) return false;
          // Check if it's a valid symbol or a chain-specific one like USDT-ERC20
          return VALID_CRYPTO_SYMBOLS.includes(symbol) || 
                 VALID_CRYPTO_SYMBOLS.some((s: string) => symbol.startsWith(s + '-')) ||
                 symbol.includes('ETHEREUM') || symbol.includes('BITCOIN');
        } catch (e) {
          return false;
        }
      })
      .map((b: any) => {
        try {
          let symbol = (b.symbol || b.crypto_symbol || b.currency || b.chainId || '').toUpperCase();
          // Normalize common names to symbols
          if (symbol.includes('ETHEREUM')) symbol = 'ETH';
          if (symbol.includes('BITCOIN')) symbol = 'BTC';
          
          return {
            id: b.wallet_id || b.address || b.id || `wallet-${symbol}`,
            user_id: userId,
            crypto_symbol: symbol,
            balance: typeof b.balance === 'number' ? b.balance : (typeof b.balance === 'string' ? parseFloat(b.balance) || 0 : 0),
            locked_balance: typeof b.locked_balance === 'number' ? b.locked_balance : (typeof b.locked_balance === 'string' ? parseFloat(b.locked_balance) || 0 : 0),
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
      // Normalize local chainId to symbol for comparison
      let localSymbol = local.chainId;
      if (local.chainId === 'Ethereum (ERC-20)' || local.chainId === 'ethereum') localSymbol = 'ETH';
      else if (local.chainId === 'Bitcoin (SegWit)' || local.chainId === 'bitcoin') localSymbol = 'BTC';
      else if (local.chainId === 'Binance Smart Chain (BEP-20)') localSymbol = 'BNB';
      else if (local.chainId === 'Solana') localSymbol = 'SOL';
      else if (local.chainId === 'Tron (TRC-20)') localSymbol = 'TRX';

      const exists = wallets.find(w => w.crypto_symbol === localSymbol);
      if (!exists) {
        wallets.push({
          id: local.id,
          user_id: userId,
          crypto_symbol: localSymbol,
          balance: typeof local.balance === 'number' ? local.balance : (typeof local.balance === 'string' ? parseFloat(local.balance) || 0 : 0),
          locked_balance: 0,
          deposit_address: local.address,
          created_at: local.createdAt,
          updated_at: local.createdAt,
          isNonCustodial: true
        });
      } else if (!exists.deposit_address && local.address) {
        // Update address if missing
        exists.deposit_address = local.address;
      }
    });

    // console.log("[getUserWallets] Final synced wallets:", wallets.map(w => `${w.crypto_symbol}: ${w.balance}`));
    return wallets;
  } catch (e) {
    console.warn(`[getUserWallets] Remote sync failed, using local non-custodial data:`, e);
    const localWallets = nonCustodialWalletManager.getNonCustodialWallets(userId);
    return localWallets.map((w) => {
      let symbol = w.chainId;
      if (w.chainId === 'Ethereum (ERC-20)' || w.chainId === 'ethereum') symbol = 'ETH';
      else if (w.chainId === 'Bitcoin (SegWit)' || w.chainId === 'bitcoin') symbol = 'BTC';
      else if (w.chainId === 'Binance Smart Chain (BEP-20)') symbol = 'BNB';
      else if (w.chainId === 'Solana') symbol = 'SOL';
      else if (w.chainId === 'Tron (TRC-20)') symbol = 'TRX';

      return {
        id: w.id,
        user_id: userId,
        crypto_symbol: symbol,
        balance: typeof w.balance === 'number' ? w.balance : (typeof w.balance === 'string' ? parseFloat(w.balance) || 0 : 0),
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
  const { data, error } = await supabase.functions.invoke('process-withdrawal', {
    body: {
      user_id: userId,
      crypto_symbol: cryptoSymbol,
      amount: amount,
      to_address: toAddress,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to process withdrawal');
  }

  const result = data as any;
  
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
  console.log("[createCDPSession] Calling cdp-create-session for address:", address);

  const { data, error } = await supabase.functions.invoke('cdp-create-session', {
    body: {
      address,
      assets,
    },
  });

  if (error) {
    console.error("[createCDPSession] Error response:", error);
    throw new Error(error.message || 'Failed to create CDP session');
  }

  console.log("[createCDPSession] Raw result:", JSON.stringify(data, null, 2));

  const result = data as any;
  const token = result?.session_token || result?.sessionToken || result?.token || 
                result?.data?.session_token || result?.data?.sessionToken || result?.data?.token ||
                result?.result?.session_token || result?.result?.sessionToken || result?.result?.token;
  
  if (!token) {
    console.error("[createCDPSession] No token found in response:", data);
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
  try {
    console.log('🚀 DEBUG: Calling pexly-pay-send edge function:', {
      sender_id: senderId,
      recipient_id: recipientId,
      amount,
      crypto_symbol: cryptoSymbol,
      note
    });

    const { data, error } = await supabase.functions.invoke('pexly-pay-send', {
      body: {
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        crypto_symbol: cryptoSymbol,
        note: note || null,
      },
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to process transfer' 
      };
    }

    const result = data as any;
    console.log('📦 DEBUG: Edge function response:', result);

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
