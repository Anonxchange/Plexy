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
  exchangeId?: string;
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

function getRocketXNetworkId(chain: string): string {
  if (!chain) return "";
  const map: Record<string, string> = {
    'BTC': 'bitcoin',
    'BITCOIN': 'bitcoin',
    'ETH': 'ethereum',
    'ETHEREUM': 'ethereum',
    'BSC': 'binance',
    'BINANCE': 'binance',
    'TRX': 'tron',
    'TRON': 'tron',
    'SOL': 'solana',
    'SOLANA': 'solana',
    'POLYGON': 'polygon',
    'MATIC': 'polygon',
    'ARBITRUM': 'arbitrum',
    'OPTIMISM': 'optimism',
    'BASE': 'base',
    'AVALANCHE': 'avaxc-mainnet',
    'NEAR': 'near',
    'XRP': 'ripple',
  };
  return map[chain.toUpperCase()] || chain.toLowerCase();
}

function isNativeToken(symbol: string, chain: string): boolean {
  const s = symbol.toUpperCase();
  const c = chain.toUpperCase();
  return (
    s === c ||
    (s === 'BTC'  && (c === 'BTC'  || c === 'BITCOIN')) ||
    (s === 'BNB'  && (c === 'BSC'  || c === 'BINANCE')) ||
    (s === 'ETH'  && (c === 'ETH'  || c === 'ETHEREUM')) ||
    (s === 'MATIC'&& (c === 'POLYGON' || c === 'MATIC')) ||
    (s === 'TRX'  && (c === 'TRX'  || c === 'TRON')) ||
    (s === 'SOL'  && (c === 'SOL'  || c === 'SOLANA')) ||
    (s === 'NEAR' &&  c === 'NEAR') ||
    (s === 'XRP'  &&  c === 'XRP')
  );
}

function getRocketXTokenAddress(symbol: string, chain: string): string | null {
  if (!chain || !symbol) return null;
  const chainUpper = chain.toUpperCase();
  const symbolUpper = symbol.toUpperCase();

  const tokenMap: Record<string, Record<string, string>> = {
    'USDT': {
      'ETH': '0xdac17f958d2ee523a2206206994597C13D831ec7',
      'ETHEREUM': '0xdac17f958d2ee523a2206206994597C13D831ec7',
      'BSC': '0x55d398326f99059ff775485246999027b3197955',
      'BINANCE': '0x55d398326f99059ff775485246999027b3197955',
      'TRX': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      'TRON': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      'POLYGON': '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      'SOLANA': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'SOL': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'ARBITRUM': '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      'OPTIMISM': '0x94b008aa205766a30e1ed85f482b439f76a8a489',
    },
    'USDC': {
      'ETH': '0xa0b86991c6218b36c1d19D4a2e9Eb0ce3606eb48',
      'ETHEREUM': '0xa0b86991c6218b36c1d19D4a2e9Eb0ce3606eb48',
      'BSC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      'BINANCE': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      'BASE': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      'SOLANA': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'SOL': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'POLYGON': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      'ARBITRUM': '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      'OPTIMISM': '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    }
  };

  const addr = tokenMap[symbolUpper]?.[chainUpper];
  if (addr) return addr;

  if (isNativeToken(symbolUpper, chainUpper)) return null;

  return symbol;
}

// RocketX quotation API expects decimal amounts (e.g. 0.2 BTC, 100 USDT), NOT wei.
function formatAmountForRocketX(amount: number): string {
  return amount.toString();
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
    const fromNetId = getRocketXNetworkId(fromNetwork);
    const toNetId = toNetwork ? getRocketXNetworkId(toNetwork) : undefined;

    const fromAddr = getRocketXTokenAddress(from || "", fromNetwork || "");
    const toAddr = to ? getRocketXTokenAddress(to, toNetwork || fromNetwork) : null;

    if (import.meta.env.DEV) {
      console.log(`RocketX Quote: ${from}(${fromNetId}) -> ${to ?? '?'}(${toNetId}) amount=${amount}`);
    }

    // Addresses are optional for quotes — attach when available for better gas estimates.
    const quotationParams: any = {
      fromToken: fromAddr,
      fromNetwork: fromNetId,
      toToken: toAddr,
      toNetwork: toNetId,
      amount: formatAmountForRocketX(amount || 0),
      slippage: params.slippage || 1,
    };

    if (params.fromAddress) quotationParams.fromAddress = params.fromAddress;
    if (params.toAddress) quotationParams.toAddress = params.toAddress;
    if (params.excludedExchanges) quotationParams.excludedExchanges = params.excludedExchanges;
    if (params.fixedRate) quotationParams.fixedRate = params.fixedRate;

    if (import.meta.env.DEV) console.log('RocketX quotationParams:', JSON.stringify(quotationParams, null, 2));

    const data = await rocketXApi.getQuotation(quotationParams);
    if (import.meta.env.DEV) console.log('RocketX raw response:', data);

    const actualData = data?.data?.data || data?.data || data;
    const quotes = actualData?.quotes;

    if (quotes && Array.isArray(quotes) && quotes.length > 0) {
      const mappedQuotes: RocketXQuote[] = quotes.map((q: any) => {
        const toAmt  = Number(q.toAmount || q.toTokenAmount || 0);
        const fromAmt = Number(q.fromAmount || q.fromTokenAmount || amount);

        return {
          exchange: q.exchangeInfo?.title || q.exchange || 'Unknown',
          exchangeIcon: q.exchangeInfo?.logo || q.exchangeLogo || '',
          exchangeId: q.exchangeInfo?.id || q.exchangeId,
          type: q.type || 'swap',
          fromAmount: fromAmt,
          fromToken: q.fromTokenInfo?.token_symbol || from,
          fromTokenId: q.fromTokenInfo?.id,        // ← needed for /v1/swap
          toAmount: toAmt,
          toToken: q.toTokenInfo?.token_symbol || (to || ""),
          toTokenId: q.toTokenInfo?.id,            // ← needed for /v1/swap
          gasFee: q.gasFeeUsd || q.totalFeeUsd || 0,
          estimatedTime: q.estTimeInSeconds?.avg
            ? `~${Math.ceil(q.estTimeInSeconds.avg / 60)}m`
            : 'Unknown',
          walletless: q.exchangeInfo?.walletLess ?? q.walletLess,
          fromAmountInUsd: q.fromTokenInfo?.price
            ? fromAmt * q.fromTokenInfo.price
            : undefined,
          toAmountInUsd: q.toTokenInfo?.price
            ? toAmt * q.toTokenInfo.price
            : undefined,
          minAmount: q.additionalInfo?.minReceived || q.additionalInfo?.minRecieved,
          priceImpact: q.additionalInfo?.priceImpact || q.priceImpact,
          savingUsd: q.additionalInfo?.savingUsd,
          rateId: q.rateId,                        // ← fixed-rate lock
        };
      });

      const valid = mappedQuotes.filter(q => q.toAmount > 0);
      if (valid.length === 0) return null;

      // Return the quote with the highest output amount
      return valid.reduce((best, q) => q.toAmount > best.toAmount ? q : best);
    }

    return null;
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
    fromAddress?: string;
    toAddress?: string;
    fixedRate?: boolean;
    excludedExchanges?: string;
  }) {
    return callRocketX('quotation', params);
  },

  /**
   * Execute a swap. Params must match the RocketX /v1/swap body exactly.
   *
   * Required: fromTokenId, toTokenId, userAddress, destinationAddress, amount
   * Optional: fee (default 0.6%), slippage, rateId, referrerAddress, disableEstimate
   *
   * For walletless exchanges: only destinationAddress is required (userAddress still sent for record-keeping).
   * For DEX routes: referrerAddress is required to receive partner fee.
   */
  async executeSwap(params: {
    fromTokenId: number;
    toTokenId: number;
    userAddress: string;
    destinationAddress: string;
    amount: number;
    fee?: number;
    slippage?: number;
    rateId?: string;
    referrerAddress?: string;
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
