import { getSupabase } from '@/lib/supabase';

export interface RocketXQuote {
  exchange: string;
  exchangeIcon: string;
  type: string;
  fromAmount: number;
  fromToken: string;
  toAmount: number;
  toToken: string;
  gasFee: number;
  estimatedTime: string;
  walletless?: boolean;
  minAmount?: number;
  error?: string;
  fromAmountInUsd?: number;
  toAmountInUsd?: number;
  id?: string;
  priceImpact?: number;
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
      console.warn('Supabase not configured, using mock/local mode for RocketX');
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
      throw new Error('Connection error: The Edge Function "rocketx-swap" could not be reached. Please verify the function name is "rocketx-swap" and it is deployed.');
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
    'BSC': 'binance',
    'TRX': 'tron',
    'TRON': 'tron',
    'SOL': 'solana',
    'SOLANA': 'solana',
    'POLYGON': 'polygon',
    'ARBITRUM': 'arbitrum',
    'OPTIMISM': 'optimism',
    'BASE': 'base',
    'AVALANCHE': 'avaxc-mainnet',
    'NEAR': 'near',
    'ETHEREUM': 'ethereum',
    'BINANCE': 'binance',
  };
  const upper = chain.toUpperCase();
  return map[upper] || upper;
}

function isEvmChain(chain: string): boolean {
  if (!chain) return false;
  const evmChains = ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'BASE', 'AVALANCHE'];
  return evmChains.includes(chain.toUpperCase());
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
    (s === 'NEAR' &&  c === 'NEAR')
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

  if (isNativeToken(symbolUpper, chainUpper)) {
    return null;
  }

  return symbol;
}

function formatAmountForRocketX(amount: number, symbol: string, chain: string, decimals?: number): string {
  const chainUpper = chain.toUpperCase();
  const symbolUpper = symbol.toUpperCase();

  if (
    chainUpper === 'BTC' || symbolUpper === 'BTC' || chainUpper === 'BITCOIN' ||
    chainUpper === 'SOL' || symbolUpper === 'SOL' || chainUpper === 'SOLANA' ||
    chainUpper === 'TRX' || symbolUpper === 'TRX' || chainUpper === 'TRON' ||
    chainUpper === 'NEAR' || symbolUpper === 'NEAR' ||
    chainUpper === 'XRP' || symbolUpper === 'XRP'
  ) {
    return amount.toString();
  }

  let finalDecimals = decimals;
  if (finalDecimals === undefined) {
    if (symbolUpper === 'USDT' || symbolUpper === 'USDC') {
      if (['ETH', 'ETHEREUM', 'ARBITRUM', 'OPTIMISM', 'BASE'].includes(chainUpper)) {
        finalDecimals = 6;
      } else {
        finalDecimals = 18;
      }
    } else {
      finalDecimals = 18;
    }
  }

  const baseUnits = BigInt(Math.round(amount * Math.pow(10, finalDecimals)));
  return baseUnits.toString();
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

    const fromDecimals = params.fromDecimals || (
      (from?.toUpperCase() === 'USDT' || from?.toUpperCase() === 'USDC')
        ? (['ETH', 'ARBITRUM', 'OPTIMISM', 'BASE'].includes(fromNetwork?.toUpperCase() || '') ? 6 : 18)
        : 18
    );
    const formattedAmount = formatAmountForRocketX(amount || 0, from || "", fromNetwork || "", fromDecimals);

    if (import.meta.env.DEV) console.log(`RocketX Quote Request: ${from}/${fromNetwork} -> ${to ?? 'walletless'}/${toNetwork}`);

    // Addresses are optional for quotes — only required at swap execution time.
    // Always build the quotation params; attach addresses when available for more accurate gas estimates.
    const quotationParams: any = {
      fromToken: fromAddr,
      fromNetwork: fromNetId,
      toToken: toAddr,
      toNetwork: toNetId,
      amount: formattedAmount,
      slippage: params.slippage || 1,
    };

    if (params.fromAddress) quotationParams.fromAddress = params.fromAddress;
    if (params.toAddress) quotationParams.toAddress = params.toAddress;
    if (params.excludedExchanges) quotationParams.excludedExchanges = params.excludedExchanges;

    if (import.meta.env.DEV) console.log('RocketX getQuotation Params:', JSON.stringify(quotationParams, null, 2));

    const data = await rocketXApi.getQuotation(quotationParams);
    if (import.meta.env.DEV) console.log('RocketX Quotation Raw Response:', data);

    const actualData = data?.data?.data || data?.data || data;
    const quotes = actualData?.quotes;

    if (quotes && Array.isArray(quotes) && quotes.length > 0) {
      const mappedQuotes: RocketXQuote[] = quotes.map((q: any) => {
        const toAmount = q.toAmount || q.toTokenAmount || 0;
        const fromAmount = q.fromAmount || q.fromTokenAmount || amount;

        return {
          exchange: q.exchangeInfo?.title || q.exchange || 'Unknown',
          exchangeIcon: q.exchangeInfo?.logo || q.exchangeLogo || '',
          type: q.type || 'swap',
          fromAmount: Number(fromAmount),
          fromToken: q.fromTokenInfo?.token_symbol || q.fromTokenSymbol || from,
          toAmount: Number(toAmount),
          toToken: q.toTokenInfo?.token_symbol || q.toTokenSymbol || (to || ""),
          gasFee: q.gasFeeUsd || q.totalFeeUsd || 0,
          estimatedTime: q.estTimeInSeconds?.avg ? `${Math.floor(q.estTimeInSeconds.avg / 60)}m` : 'Unknown',
          walletless: q.exchangeInfo?.walletLess || q.walletLess,
          fromAmountInUsd: q.fromTokenInfo?.price ? Number(fromAmount) * q.fromTokenInfo.price : undefined,
          toAmountInUsd: q.toTokenInfo?.price ? Number(toAmount) * q.toTokenInfo.price : undefined,
          minAmount: q.additionalInfo?.minRecieved || q.additionalInfo?.minReceived,
          priceImpact: q.additionalInfo?.priceImpact || q.priceImpact,
        };
      });

      const validQuotes = mappedQuotes.filter(q => q.toAmount > 0);
      if (validQuotes.length === 0) return null;

      return validQuotes.reduce((prev, current) =>
        prev.toAmount > current.toAmount ? prev : current
      );
    }

    return null;
  } catch (error) {
    console.error('Error fetching RocketX rate:', error);
    return null;
  }
}

export const rocketXApi = {
  async getConfiguration() { return callRocketX('configs'); },
  async getTokens(network: string, page = 1, limit = 50) {
    return callRocketX('tokens', { network, page, limit });
  },
  async searchTokens(keyword: string, network?: string) {
    return callRocketX('search_tokens', { keyword, ...(network ? { network } : {}) });
  },
  async getQuotation(params: { fromToken: string | null; fromNetwork: string; toToken?: string | null; toNetwork?: string; amount: string; slippage?: number; fromAddress?: string; toAddress?: string; }) {
    return callRocketX('quotation', params);
  },
  async executeSwap(params: Record<string, any>) { return callRocketX('swap', params); },
  async getStatus(requestId?: string, txId?: string) {
    return callRocketX('status', { ...(requestId ? { requestId } : {}), ...(txId ? { txId } : {}) });
  },
};
