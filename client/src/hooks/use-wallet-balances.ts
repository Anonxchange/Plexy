import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/* =========================================
   TYPES
========================================= */
export interface Wallet {
  id: string;
  user_id: string;
  crypto_symbol: string;
  balance: number;
  locked_balance: number;
  deposit_address: string | null;
  chain_id: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type:
    | 'deposit'
    | 'withdrawal'
    | 'swap'
    | 'p2p_buy'
    | 'p2p_sell'
    | 'escrow_lock'
    | 'escrow_release'
    | 'fee';
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

/* =========================================
   MULTICHAIN CONFIG
========================================= */

interface ChainConfig {
  rpc?: string;
  symbol: string;
  decimals: number;
  tokens?: { symbol: string; contract?: string; decimals: number }[];
}

const CHAINS: Record<string, ChainConfig> = {
  BTC: { symbol: 'BTC', decimals: 8 },
  ETH: {
    symbol: 'ETH',
    decimals: 18,
    rpc: 'https://eth.llamarpc.com',
    tokens: [
      { symbol: 'USDT', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      { symbol: 'USDC', contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    ],
  },
  BSC: {
    symbol: 'BNB',
    decimals: 18,
    rpc: 'https://bsc-dataseed.binance.org',
    tokens: [
      { symbol: 'USDT', contract: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      { symbol: 'USDC', contract: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
    ],
  },
  POLYGON: {
    symbol: 'MATIC',
    decimals: 18,
    rpc: 'https://polygon-rpc.com',
    tokens: [
      { symbol: 'USDT', contract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      { symbol: 'USDC', contract: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    ],
  },
  ARBITRUM: {
    symbol: 'ETH',
    decimals: 18,
    rpc: 'https://arb1.arbitrum.io/rpc',
    tokens: [
      { symbol: 'USDT', contract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
      { symbol: 'USDC', contract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    ],
  },
  OPTIMISM: {
    symbol: 'ETH',
    decimals: 18,
    rpc: 'https://mainnet.optimism.io',
    tokens: [
      { symbol: 'USDT', contract: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
      { symbol: 'USDC', contract: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    ],
  },
  SOL: { symbol: 'SOL', decimals: 9 },
  TRX: { symbol: 'TRX', decimals: 6 },
  XRP: { symbol: 'XRP', decimals: 6 },
};

/* =========================================
   HELPERS
========================================= */

function formatBalance(raw: number, decimals: number): number {
  return parseFloat(raw.toFixed(decimals));
}

function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

/* =========================================
   EVM BALANCES
========================================= */

async function evmGetBalance(rpc: string, address: string): Promise<number> {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    }),
  });
  const { result } = await res.json();
  return hexToNumber(result) / 1e18;
}

async function evmGetTokenBalance(
  rpc: string,
  address: string,
  contract: string,
  decimals: number
): Promise<number> {
  const padded = address.toLowerCase().replace('0x', '').padStart(64, '0');
  const data = '0x70a08231' + padded;

  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_call', params: [{ to: contract, data }, 'latest'], id: 1 }),
  });

  const { result } = await res.json();
  if (!result || result === '0x') return 0;
  return hexToNumber(result) / Math.pow(10, decimals);
}

/* =========================================
   FETCH PER WALLET
========================================= */

async function fetchWalletBalance(wallet: any): Promise<Wallet | null> {
  try {
    const chain = wallet.chain_id.toUpperCase();
    const cfg = CHAINS[chain];
    if (!cfg) return null;

    let balance = 0;

    // Non-EVM chains handled by edge function
    if (['BTC', 'SOL', 'TRX', 'XRP'].includes(chain)) {
      const { data, error } = await supabase.functions.invoke('monitor-deposits', {
        body: { address: wallet.deposit_address, chain: chain },
      });

      if (error || !data?.success) return null;
      balance = Number(data.balance ?? 0);
    }

    // EVM chains
    if (cfg.rpc) {
      balance = await evmGetBalance(cfg.rpc, wallet.deposit_address);
    }

    return {
      id: wallet.id,
      user_id: wallet.user_id,
      crypto_symbol: wallet.crypto_symbol,
      balance: formatBalance(balance, cfg.decimals),
      locked_balance: Number(wallet.locked_balance ?? 0),
      deposit_address: wallet.deposit_address,
      chain_id: wallet.chain_id,
      created_at: wallet.created_at,
      updated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[fetchWalletBalance] Failed for', wallet.crypto_symbol, err);
    return null;
  }
}

/* =========================================
   GET USER WALLETS
========================================= */

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data: userWallets, error } = await supabase.from('user_wallets').select('*').eq('user_id', userId);
  if (error || !userWallets) return [];

  const wallets = await Promise.all(userWallets.map(fetchWalletBalance));
  return wallets.filter(Boolean) as Wallet[];
}

/* =========================================
   REACT QUERY HOOK
========================================= */

export function useWalletBalances() {
  return useQuery({
    queryKey: ['wallet-balances'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return [];
      return getUserWallets(user.id);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/* =========================================
   OTHER HELPERS
========================================= */

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find((w) => w.crypto_symbol === cryptoSymbol) || null;
}

export async function getWalletTransactions(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as WalletTransaction[]) ?? [];
}

export async function getDepositAddress(userId: string, cryptoSymbol: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_wallets')
    .select('deposit_address')
    .eq('user_id', userId)
    .eq('crypto_symbol', cryptoSymbol)
    .single();
  if (error || !data?.deposit_address) throw new Error('No deposit address found.');
  return data.deposit_address;
}
