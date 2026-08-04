import { nonCustodialWalletManager } from "./non-custodial-wallet";
import { supabase } from "./supabase";
import { getWalletMonitorTargets } from "./wallet-chain-monitor";

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

function mapChainIdToSymbol(chainId: string): string {
  if (chainId === 'Ethereum (ERC-20)' || chainId === 'ethereum') return 'ETH';
  if (chainId === 'Bitcoin (SegWit)'  || chainId === 'bitcoin')  return 'BTC';
  if (chainId === 'Binance Smart Chain (BEP-20)' || chainId === 'BNB' || chainId === 'BSC') return 'BNB';
  if (chainId === 'Solana')           return 'SOL';
  if (chainId === 'Tron (TRC-20)')    return 'TRX';
  if (chainId === 'XRP')              return 'XRP';
  return chainId;
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  try {
    const localWallets = await (nonCustodialWalletManager as any).getWalletsFromStorage(userId);
    if (import.meta.env.DEV) console.log(`[getUserWallets] Found ${localWallets.length} local wallets`);
    return localWallets.map((w: any) => ({
      id: w.id,
      user_id: userId,
      crypto_symbol: mapChainIdToSymbol(w.chainId),
      balance: typeof w.balance === 'number' ? w.balance : (typeof w.balance === 'string' ? parseFloat(w.balance) || 0 : 0),
      locked_balance: 0,
      deposit_address: w.address,
      created_at: w.createdAt,
      updated_at: w.createdAt,
      isNonCustodial: true
    }));
  } catch (e) {
    console.error(`[getUserWallets] Error fetching wallets:`, e);
    return [];
  }
}

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find(w => w.crypto_symbol === cryptoSymbol) || null;
}

function readString(raw: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = raw?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readAmount(raw: any): number {
  const value = raw?.amount ?? raw?.tokenAmount ?? raw?.value_decimal ?? raw?.value;
  const candidate = typeof value === "object" ? value?.amount ?? value?.value : value;
  const amount = typeof candidate === "string" && candidate.startsWith("0x")
    ? parseInt(candidate, 16)
    : Number(candidate);
  return Number.isFinite(amount) ? amount : 0;
}

function readDate(raw: any): string {
  const value = raw?.created_at ?? raw?.createdAt ?? raw?.timestamp ?? raw?.time ?? raw?.block_time;
  if (typeof value === "number") {
    return new Date(value < 1_000_000_000_000 ? value * 1000 : value).toISOString();
  }
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function normalizeOnChainTransaction(
  raw: any,
  userId: string,
  target: { address: string; chain: string },
): WalletTransaction | null {
  const hash = readString(raw, "hash", "txHash", "transactionHash", "tx_hash", "signature", "id");
  if (!hash) return null;

  const from = readString(raw, "from", "fromAddress", "from_address", "sender");
  const to = readString(raw, "to", "toAddress", "to_address", "recipient");
  const sameAddress = (left: string | null, right: string) =>
    !!left && left.toLowerCase() === right.toLowerCase();
  const isDeposit = sameAddress(to, target.address) && !sameAddress(from, target.address);
  const type = isDeposit
    ? "deposit"
    : sameAddress(from, target.address)
      ? "withdrawal"
      : raw?.type === "swap" ? "swap" : "deposit";

  const rawStatus = String(raw?.status ?? "").toLowerCase();
  const status: WalletTransaction["status"] =
    rawStatus === "failed" || raw?.success === false
      ? "failed"
      : rawStatus === "pending" || raw?.confirmed === false
        ? "pending"
        : "completed";

  const symbol = (
    readString(raw, "crypto_symbol", "cryptoSymbol", "symbol", "tokenSymbol", "asset") ??
    (target.chain === "BSC" ? "BNB" : target.chain === "POLYGON" ? "POL" : target.chain)
  ).toUpperCase();

  return {
    id: `onchain:${target.chain}:${hash}:${symbol}`,
    user_id: userId,
    wallet_id: `onchain:${target.chain}:${target.address}`,
    type,
    crypto_symbol: symbol,
    amount: readAmount(raw),
    fee: Number(raw?.fee ?? 0) || 0,
    status,
    tx_hash: hash,
    from_address: from,
    to_address: to,
    reference_id: hash,
    notes: "On-chain transaction",
    confirmations: Number(raw?.confirmations ?? 0) || null,
    created_at: readDate(raw),
    completed_at: status === "completed" ? readDate(raw) : null,
  };
}

/**
 * Read wallet activity from the same public-address monitor used for balances.
 * This intentionally does not query wallet_transactions or pexly_transactions:
 * in a non-custodial wallet, the chain is the source of truth.
 */
export async function getOnChainTransactions(userId: string, limit: number = 200): Promise<WalletTransaction[]> {
  const targets = await getWalletMonitorTargets(userId);
  if (targets.length === 0) return [];

  const results = await Promise.all(
    targets.map(async (target) => {
      const { data, error } = await supabase.functions.invoke("monitor-deposits", {
        body: {
          address: target.address,
          chain: target.chain,
          mode: "transactions",
          limit,
        },
      });
      if (error) throw new Error(`${target.chain}: ${error.message}`);

      const rawTransactions = Array.isArray(data)
        ? data
        : Array.isArray(data?.transactions)
          ? data.transactions
          : Array.isArray(data?.data?.transactions)
            ? data.data.transactions
            : [];

      return rawTransactions
        .map((raw: any) => normalizeOnChainTransaction(raw, userId, target))
        .filter((tx: WalletTransaction | null): tx is WalletTransaction => !!tx);
    }),
  );

  const unique = new Map<string, WalletTransaction>();
  results.flat().forEach((tx) => unique.set(tx.id, tx));

  return Array.from(unique.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function sendCrypto(
  userId: string,
  cryptoSymbol: string,
  toAddress: string,
  amount: number,
  notes?: string
): Promise<WalletTransaction> {
  // Custodial withdrawal replaced with local placeholder or signing logic
  
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
  if (import.meta.env.DEV) console.log("[createCDPSession] Initiating cdp-create-session");

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
      addresses: [{ address, network: destinationNetwork }],
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

  if (import.meta.env.DEV) console.log("[createCDPSession] Session created successfully");

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
  options?: { network?: string, paymentMethod?: string }
): Promise<string> {
  if (import.meta.env.DEV) console.log("[createCDPOfframpSession] Initiating cdp-offramp-session");

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
      sourceAddress: address,
      sellCurrency,
      sellNetwork,
      sellAmount,
      cashoutCurrency: fiatCurrency || 'USD',
      cashoutMethod: options?.paymentMethod || 'BANK_ACCOUNT',
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
