import { getSupabase } from '@/lib/supabase';

export interface RocketXQuote {
  exchange: string;
  exchangeIcon: string;
  type: string;
  fromAmount: number;
  fromToken: string;
  fromTokenId?: number;
  toAmount: number;
  toToken: string;
  toTokenId?: number;
  gasFee: number;
  estimatedTime: string;
  walletless?: boolean;
  minAmount?: number;
  error?: string;
  fromAmountInUsd?: number;
  toAmountInUsd?: number;
  rateId?: string;
  priceImpact?: number;
  savingUsd?: number;
  exchangeId?: string;              // exchangeInfo.keyword (e.g. "BYBIT") — the value excludedExchanges expects
  exchangeType?: string;            // "CEX" | "DEX"
  expiresAt?: string | number;      // expiry of rateId (fixed-rate quotes)
  allowanceAddress?: string;        // DEX routes: ERC-20 approval spender
  isRefundAddressRequired?: boolean; // true => swap needs refundAddress (+ refundMemo)
  memoRequired?: boolean;
  // Source-token details needed to approve + sign a DEX swap
  fromTokenAddress?: string;
  fromTokenDecimals?: number;
  fromChainId?: string;             // hex, e.g. "0x1"
  fromNetworkType?: string;         // "EVM" | ...
  fromIsNative?: boolean;
}

export interface RocketXToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  network: string;
  logoUrl?: string;
}

export interface RocketXNetwork {
  name: string;
  chainId: number;
  nativeCurrency: string;
  logoUrl?: string;
}

async function callRocketX(action: string, params: Record<string, any> = {}) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured — RocketX unavailable.');
      throw new Error('RocketX service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    if (import.meta.env.DEV) console.log('Invoking RocketX Edge Function:', { action, params });

    const client = await getSupabase();
    const { data, error } = await client.functions.invoke('rocketx-swap', {
      body: { action, params },
    });

    if (error) {
      console.error('Supabase function invocation error:', error);
      throw new Error(`Connection error: ${error.message || 'Could not reach swap service'}`);
    }

    if (!data?.success) {
      console.error('RocketX API error:', data);
      throw new Error(data?.error || data?.warning || 'Exchange service returned an error');
    }

    return data.data;
  } catch (err: any) {
    console.error('callRocketX error:', err);
    if (err.message?.includes('Failed to send a request')) {
      throw new Error('The swap service could not be reached. Please verify the edge function is deployed.');
    }
    throw err;
  }
}

// Network IDs are the `id` field of GET /v1/configs -> supported_network[] (verified against a live response).
// NOTE: `id` is NOT the same as `chainId` (e.g. Bitcoin: id "BTC", chainId "bitcoin"; Base: id "Base Chain", chainId "0x2105").
function getRocketXNetworkId(chain: string): string {
  if (!chain) return "";
  const map: Record<string, string> = {
    'BTC': 'BTC',
    'BITCOIN': 'BTC',
    'ETH': 'ethereum',
    'ETHEREUM': 'ethereum',
    'BSC': 'binance',
    'BINANCE': 'binance',
    'TRX': 'TRON',
    'TRON': 'TRON',
    'SOL': 'solana',
    'SOLANA': 'solana',
    'POLYGON': 'polygon',
    'MATIC': 'polygon',
    'ARBITRUM': 'arbitrum',
    'OPTIMISM': 'optimism',
    'BASE': 'Base Chain',
    'AVALANCHE': 'avaxc-mainnet',
    'NEAR': 'NEAR Protocol',
    'XRP': 'XRP',
  };
  return map[chain.toUpperCase()] || chain; // unknown: pass through untouched (IDs are case/space sensitive)
}

// Native asset symbol(s) per chain. NOTE: ETH is native on Base/Arbitrum/Optimism too.
const NATIVE_SYMBOLS: Record<string, string[]> = {
  BTC: ['BTC'], BITCOIN: ['BTC'],
  ETH: ['ETH'], ETHEREUM: ['ETH'], BASE: ['ETH'], ARBITRUM: ['ETH'], OPTIMISM: ['ETH'],
  BSC: ['BNB'], BINANCE: ['BNB'],
  POLYGON: ['POL', 'MATIC'], MATIC: ['POL', 'MATIC'],
  TRX: ['TRX'], TRON: ['TRX'],
  SOL: ['SOL'], SOLANA: ['SOL'],
  AVALANCHE: ['AVAX'],
  NEAR: ['NEAR'],
  XRP: ['XRP'],
};

function isNativeToken(symbol: string, chain: string): boolean {
  const s = symbol.toUpperCase();
  const c = chain.toUpperCase();
  return NATIVE_SYMBOLS[c]?.includes(s) ?? s === c;
}

/**
 * Returns: contract address (string) | null (native token) | undefined (unknown — do NOT quote).
 * EVM addresses are lowercase (matches the docs' examples; avoids EIP-55 checksum rejections).
 */
function getRocketXTokenAddress(symbol: string, chain: string): string | null | undefined {
  if (!chain || !symbol) return undefined;
  const c = chain.toUpperCase();
  const s = symbol.toUpperCase();

  if (isNativeToken(s, c)) return null;

  const tokenMap: Record<string, Record<string, string>> = {
    USDT: {
      ETH: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      ETHEREUM: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      BSC: '0x55d398326f99059ff775485246999027b3197955',
      BINANCE: '0x55d398326f99059ff775485246999027b3197955',
      TRX: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      TRON: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      POLYGON: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      SOLANA: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      SOL: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      ARBITRUM: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      OPTIMISM: '0x94b008aa205766a30e1ed85f482b439f76a8a489',
    },
    USDC: {
      ETH: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      ETHEREUM: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      BSC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      BINANCE: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      BASE: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      SOLANA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      SOL: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      POLYGON: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      ARBITRUM: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      OPTIMISM: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    },
  };

  // Unknown non-native token: return undefined instead of guessing (the old code sent the ticker as an address).
  return tokenMap[s]?.[c];
}

// Decimal string, never scientific notation ((0.0000001).toString() === "1e-7").
function formatAmountForRocketX(amount: number): string {
  if (!isFinite(amount) || amount <= 0) return '0';
  return amount.toFixed(12).replace(/\.?0+$/, '');
}

export async function getRocketxRate(
  from: string,
  fromNetwork: string,
  to?: string,
  toNetwork?: string,
  amount: number = 1,
  params: Record<string, any> = {}
): Promise<RocketXQuote | null> {
  try {
    // Docs: toToken + toNetwork are required.
    if (!from || !to || !fromNetwork || !toNetwork) return null;

    const fromNetId = getRocketXNetworkId(fromNetwork);
    const toNetId = getRocketXNetworkId(toNetwork);
    const fromAddr = getRocketXTokenAddress(from, fromNetwork);
    const toAddr = getRocketXTokenAddress(to, toNetwork);

    if (fromAddr === undefined || toAddr === undefined) {
      console.warn(`RocketX: no token mapping for ${from}@${fromNetwork} or ${to}@${toNetwork}`);
      return null;
    }

    // Only parameters documented for GET /v1/quotation. (fromAddress/toAddress are NOT quotation params.)
    const quotationParams: any = {
      fromToken: fromAddr ?? 'null', // docs: literal "null" = native token
      fromNetwork: fromNetId,
      toToken: toAddr ?? 'null',
      toNetwork: toNetId,
      amount: formatAmountForRocketX(amount || 0),
      slippage: params.slippage ?? 1,
    };
    if (params.fixedRate) quotationParams.fixedRate = true;
    if (params.excludedExchanges) quotationParams.excludedExchanges = params.excludedExchanges;
    if (params.includedExchanges) quotationParams.includedExchanges = params.includedExchanges;
    if (params.disableRoutesWithMemo) quotationParams.disableRoutesWithMemo = true;

    if (import.meta.env.DEV) console.log('RocketX quotationParams:', quotationParams);

    // callRocketX already unwraps the edge-function envelope; RocketX returns { platformToken, quotes, alternateRoute }.
    const data = await rocketXApi.getQuotation(quotationParams);
    const quotes = data?.quotes;
    if (!Array.isArray(quotes) || quotes.length === 0) return null;

    // This app executes DEX routes only (user signs from their own wallet), and signing is EVM-only for now.
    // Pass { dexOnly: false } to see every route.
    const dexOnly = params.dexOnly !== false;

    const mapped: RocketXQuote[] = quotes
      .filter((q: any) => q.isTxnAllowed !== false)
      .filter((q: any) => !dexOnly || (q.exchangeInfo?.exchange_type === 'DEX' && q.fromTokenInfo?.network_type === 'EVM'))
      .map((q: any) => {
        const toAmt = Number(q.toAmount || 0);
        const fromAmt = Number(q.fromAmount || amount);
        const ex = q.exchangeInfo ?? {};
        return {
          exchange: ex.title || 'Unknown',
          exchangeIcon: ex.logo || '',
          exchangeId: ex.keyword,               // was ex.id (numeric) — excludedExchanges expects the keyword
          exchangeType: ex.exchange_type,
          type: q.type || 'swap',
          fromAmount: fromAmt,
          fromToken: q.fromTokenInfo?.token_symbol || from,
          fromTokenId: q.fromTokenInfo?.id,     // required by /v1/swap
          toAmount: toAmt,
          toToken: q.toTokenInfo?.token_symbol || to,
          toTokenId: q.toTokenInfo?.id,         // required by /v1/swap
          gasFee: q.gasFeeUsd ?? q.additionalInfo?.totalFeeUsd ?? 0,
          estimatedTime: q.estTimeInSeconds?.avg ? `~${Math.ceil(q.estTimeInSeconds.avg / 60)}m` : 'Unknown',
          walletless: ex.walletLess,
          isRefundAddressRequired: ex.isRefundAddressRequired,
          memoRequired: ex.memoRequired,
          fromAmountInUsd: q.fromTokenInfo?.price ? fromAmt * q.fromTokenInfo.price : undefined,
          toAmountInUsd: q.toTokenInfo?.price ? toAmt * q.toTokenInfo.price : undefined,
          // The live API spells it "minRecieved"; the docs spell it "minReceived".
          minAmount: q.additionalInfo?.minReceived ?? q.additionalInfo?.minRecieved,
          priceImpact: q.additionalInfo?.priceImpact,
          savingUsd: q.additionalInfo?.savingUsd,
          rateId: q.rateId,
          expiresAt: q.expiresAt,
          allowanceAddress: q.allowanceAddress,
          fromTokenAddress: q.fromTokenInfo?.contract_address,
          fromTokenDecimals: q.fromTokenInfo?.token_decimals,
          fromChainId: q.fromTokenInfo?.chainId,
          fromNetworkType: q.fromTokenInfo?.network_type,
          fromIsNative: q.fromTokenInfo?.is_native_token === 1 || q.fromTokenInfo?.is_native_token === true,
        };
      })
      .filter((q) => q.toAmount > 0);

    if (mapped.length === 0) return null;
    return mapped.reduce((best, q) => (q.toAmount > best.toAmount ? q : best));
  } catch (error) {
    console.error('Error fetching RocketX rate:', error);
    return null;
  }
}

export const rocketXApi = {
  async getConfiguration() { return callRocketX('configs'); },

  async getTokens(chainId: string, page = 1, perPage = 100, keyword = 'All') {
    return callRocketX('tokens', { chainId, page, perPage, keyword });
  },

  async searchTokens(keyword: string, chainId?: string) {
    return callRocketX('search_tokens', { keyword, ...(chainId ? { chainId } : {}) });
  },

  async getQuotation(params: {
    fromToken: string | null;
    fromNetwork: string;
    toToken?: string | null;
    toNetwork?: string;
    amount: string;
    slippage?: number;
    fixedRate?: boolean;
    excludedExchanges?: string;
    includedExchanges?: string;
    disableRoutesWithMemo?: boolean;
  }) {
    return callRocketX('quotation', params);
  },

  /**
   * Execute a swap. `fee` and `referrerAddress` are set by the edge function — do NOT send them.
   * If the chosen quote has isRefundAddressRequired, pass refundAddress (+ refundMemo).
   * Response (per the PDF): { requestId, txId (INTERNAL integer — NOT the on-chain hash), swap: { depositAddress, ..., tx: { from, to, data, value, gas, gasPrice, memo } } }.
   * For DEX routes the `tx` object is what the user's wallet signs and broadcasts; the resulting hash is what /status calls `txId`.
   */
  async executeSwap(params: {
    fromTokenId: number;
    toTokenId: number;
    userAddress: string;
    destinationAddress: string;
    amount: number;
    slippage?: number;
    rateId?: string;
    refundAddress?: string;
    refundMemo?: string;
    disableEstimate?: boolean;
  }) {
    return callRocketX('swap', params);
  },

  /**
   * Get swap status.
   * requestId is always required (from swap response).
   * txId (on-chain tx hash) is required for non-walletless / DEX routes.
   *
   * subState values (in order):
   *   transaction_pending → pending → approved → executed → withdrawal → withdraw_success
   *   invalid = timed out
   */
  async getStatus(requestId: string, txId?: string) {
    return callRocketX('status', {
      requestId,
      ...(txId ? { txId } : {}),
    });
  },
};
