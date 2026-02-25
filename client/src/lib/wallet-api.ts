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

export async function recordTransaction(
  userId: string,
  walletId: string,
  type: WalletTransaction['type'],
  cryptoSymbol: string,
  amount: number,
  fee: number = 0,
  status: WalletTransaction['status'] = 'completed',
  txHash: string | null = null,
  fromAddress: string | null = null,
  toAddress: string | null = null,
  notes: string | null = null
): Promise<WalletTransaction> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      wallet_id: walletId,
      type,
      crypto_symbol: cryptoSymbol,
      amount,
      fee,
      status,
      tx_hash: txHash,
      from_address: fromAddress,
      to_address: toAddress,
      notes,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("[recordTransaction] Error:", error);
    throw new Error(error.message);
  }

  return data as WalletTransaction;
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  try {
    // Remote sync logic removed as requested (custodial logic/duplicate calls)
    const localWallets = await (nonCustodialWalletManager as any).getWalletsFromStorage(userId);
    console.log(`[getUserWallets] Found ${localWallets.length} local wallets for user ${userId}`);
    return localWallets.map((w: any) => {
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
  } catch (e) {
    console.error(`[getUserWallets] Error fetching wallets:`, e);
    return [];
  }
}

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find(w => w.crypto_symbol === cryptoSymbol) || null;
}

export async function getWalletTransactions(userId: string, limit: number = 29): Promise<WalletTransaction[]> {
  // Fetch transactions where the user is the owner (custodial/recorded)
  // OR where their address matches from/to (non-custodial/blockchain)
  const wallets = await getUserWallets(userId);
  const addresses = wallets.map(w => w.deposit_address).filter(Boolean);

  console.log(`[getWalletTransactions] Fetching for user ${userId} and addresses:`, addresses);

  let query = supabase
    .from('wallet_transactions')
    .select('*');

  if (addresses.length > 0) {
    // Search by user_id OR from_address OR to_address
    const addressFilter = addresses.map(addr => `from_address.eq."${addr}",to_address.eq."${addr}"`).join(',');
    query = query.or(`user_id.eq."${userId}",${addressFilter}`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getWalletTransactions] wallet_transactions error:", error);
  }

  // Also fetch from pexly_transactions for internal transfers
  const { data: pexlyData, error: pexlyError } = await supabase
    .from('pexly_transactions')
    .select('*')
    .or(`sender_id.eq."${userId}",receiver_id.eq."${userId}"`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (pexlyError) {
    console.error("[getWalletTransactions] pexly_transactions error:", pexlyError);
  }

  let transactions = (data ?? []) as WalletTransaction[];
  
  if (!pexlyError && pexlyData) {
    const internalTxs: WalletTransaction[] = pexlyData.map((tx: any) => ({
      id: tx.id,
      user_id: userId,
      wallet_id: 'pexly-internal',
      type: tx.sender_id === userId ? 'withdrawal' : 'deposit',
      crypto_symbol: 'USDT', // Pexly internal usually USDT
      amount: Number(tx.amount),
      fee: Number(tx.fee),
      status: tx.status as any,
      tx_hash: null,
      from_address: tx.sender_id,
      to_address: tx.receiver_id,
      reference_id: tx.id,
      notes: tx.note,
      confirmations: 1,
      created_at: tx.created_at,
      completed_at: tx.created_at
    }));
    transactions = [...transactions, ...internalTxs];
  }

  // Deduplicate and sort
  const uniqueTxs = Array.from(new Map(transactions.map(item => [item.id, item])).values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  console.log(`[getWalletTransactions] Found ${uniqueTxs.length} total transactions for user ${userId}`);
  return uniqueTxs;
}

export async function sendCrypto(
  userId: string,
  cryptoSymbol: string,
  toAddress: string,
  amount: number,
  notes?: string
): Promise<WalletTransaction> {
  // Custodial withdrawal replaced with local placeholder or signing logic
  console.log("[sendCrypto] Withdrawal requested for non-custodial flow", { cryptoSymbol, amount, toAddress });
  
  throw new Error("Withdrawal must be initiated via wallet signing");
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

export async function createCDPSession(
  address: string, 
  assets: string[], 
  paymentAmount?: string, 
  paymentCurrency?: string,
  options?: { network?: string }
): Promise<string> {
  console.log("[createCDPSession] Calling cdp-create-session for address:", address, "assets:", assets, "amount:", paymentAmount, "network:", options?.network);

  const { data: { session } } = await supabase.auth.getSession();
  const access_token = session?.access_token;

  const purchaseCurrency = assets[0] || 'USDC';

  // Map network based on currency if not provided
  let destinationNetwork = options?.network;
  if (!destinationNetwork) {
    if (purchaseCurrency === 'BTC') {
      destinationNetwork = 'bitcoin';
    } else if (purchaseCurrency === 'ETH' || purchaseCurrency === 'USDC' || purchaseCurrency === 'USDT') {
      destinationNetwork = 'ethereum';
    } else if (purchaseCurrency === 'SOL') {
      destinationNetwork = 'solana';
    } else {
      destinationNetwork = 'ethereum'; // Default
    }
  }

  const { data, error } = await supabase.functions.invoke('cdp-create-session', {
    body: {
      address,
      purchaseCurrency,
      assets,
      paymentAmount,
      paymentCurrency,
      destinationNetwork,
      sourceNetwork: destinationNetwork
    },
    headers: access_token ? {
      Authorization: `Bearer ${access_token}`,
    } : undefined,
  });

  if (error) {
    console.error("[createCDPSession] Error response:", error);
    throw new Error(error.message || 'Failed to create CDP session');
  }

  console.log("[createCDPSession] Raw result:", JSON.stringify(data, null, 2));

  const result = data as any;
  const token = result?.session_token || result?.sessionToken || result?.token || 
                result?.data?.session_token || result?.data?.sessionToken || result?.data?.token ||
                result?.result?.session_token || result?.result?.sessionToken || result?.result?.token ||
                result?.session?.sessionToken || result?.session?.session_token;
  
  const onrampUrl = result?.onramp_url || result?.onrampUrl || 
                    result?.data?.onramp_url || result?.data?.onrampUrl ||
                    result?.session?.onrampUrl || result?.session?.onramp_url;

  if (onrampUrl) return onrampUrl;
  
  if (!token && !onrampUrl) {
    console.error("[createCDPSession] No token or URL found in response:", data);
    if (typeof data === 'string' && data.length > 20) return data;
  }

  return token;
}

export async function createCDPOfframpSession(
  address: string, 
  assets: string[], 
  sellAmount?: string, 
  fiatCurrency?: string,
  options?: { network?: string }
): Promise<string> {
  console.log("[createCDPOfframpSession] Calling cdp-offramp-session for address:", address, "assets:", assets, "amount:", sellAmount);

  const { data: { session } } = await supabase.auth.getSession();
  const access_token = session?.access_token;

  const sellCurrency = assets[0] || 'USDC';

  // Map network based on currency if not provided
  let sellNetwork = options?.network;
  if (!sellNetwork) {
    if (sellCurrency === 'BTC') {
      sellNetwork = 'bitcoin';
    } else if (sellCurrency === 'ETH' || sellCurrency === 'USDC' || sellCurrency === 'USDT') {
      sellNetwork = 'ethereum';
    } else if (sellCurrency === 'SOL') {
      sellNetwork = 'solana';
    } else {
      sellNetwork = 'ethereum'; // Default
    }
  }

  const { data, error } = await supabase.functions.invoke('cdp-create-offramp-session', {
    body: {
      address,
      sourceAddress: address,
      sellCurrency,
      sellNetwork,
      assets,
      sellAmount,
      fiatCurrency,
    },
    headers: access_token ? {
      Authorization: `Bearer ${access_token}`,
    } : undefined,
  });

  if (error) {
    console.error("[createCDPOfframpSession] Error response:", error);
    throw new Error(error.message || 'Failed to create CDP offramp session');
  }

  const result = data as any;
  const token = result?.session_token || result?.sessionToken || result?.token || 
                result?.data?.session_token || result?.data?.sessionToken || result?.data?.token ||
                result?.session?.sessionToken || result?.session?.session_token;
  
  const offrampUrl = result?.offramp_url || result?.offrampUrl || 
                     result?.data?.offramp_url || result?.data?.offrampUrl ||
                     result?.session?.offrampUrl || result?.session?.offramp_url;

  if (offrampUrl) return offrampUrl;
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
