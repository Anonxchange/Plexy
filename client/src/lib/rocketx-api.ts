import { supabase } from '@/lib/supabase';

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

    console.log('Invoking RocketX Edge Function:', { action, params });

    // Ensure action and params are sent correctly to match the edge function's expected structure
    const { data, error } = await supabase.functions.invoke('rocketx-swap', {
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

const rocketXNetworks = [
  { symbol: "BTC", name: "Bitcoin", chain: "BTC", rocketXNetId: "BTC" },
  { symbol: "ETH", name: "Ethereum", chain: "ETH", rocketXNetId: "ETH" },
  { symbol: "USDT", name: "Tether", chain: "ETH", rocketXNetId: "ETH" },
  { symbol: "USDC", name: "USD Coin", chain: "ETH", rocketXNetId: "ETH" },
  { symbol: "BNB", name: "BNB", chain: "BSC", rocketXNetId: "BSC" },
  { symbol: "MATIC", name: "Polygon", chain: "POLYGON", rocketXNetId: "POLYGON" },
  { symbol: "ARB", name: "Arbitrum", chain: "ARBITRUM", rocketXNetId: "ARBITRUM" },
  { symbol: "OP", name: "Optimism", chain: "OPTIMISM", rocketXNetId: "OPTIMISM" },
  { symbol: "SOL", name: "Solana", chain: "SOL", rocketXNetId: "SOL" },
  { symbol: "TRX", name: "Tron", chain: "TRX", rocketXNetId: "TRX" },
];

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
  };
  const upper = chain.toUpperCase();
  return map[upper] || upper;
}

function isEvmChain(chain: string): boolean {
  if (!chain) return false;
  const evmChains = ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'BASE', 'AVALANCHE'];
  return evmChains.includes(chain.toUpperCase());
}

function getRocketXTokenAddress(symbol: string, chain: string): string {
  if (!chain || !symbol) return "0x0000000000000000000000000000000000000000";
  const chainUpper = chain.toUpperCase();
  const symbolUpper = symbol.toUpperCase();

  const tokenMap: Record<string, Record<string, string>> = {
    'USDT': {
      'ETH': '0xdac17f958d2ee523a2206206994597C13D831ec7',
      'BSC': '0x55d398326f99059ff775485246999027b3197955',
      'TRX': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      'TRON': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      'POLYGON': '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      'SOLANA': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'SOL': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    },
    'USDC': {
      'ETH': '0xa0b86991c6218b36c1d19D4a2e9Eb0ce3606eb48',
      'BSC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      'BASE': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      'SOLANA': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'SOL': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'POLYGON': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    }
  };

  const addr = tokenMap[symbolUpper]?.[chainUpper];
  if (addr) return addr;

  const isNative = symbolUpper === chainUpper ||
    (symbolUpper === 'BTC' && (chainUpper === 'BTC' || chainUpper === 'BITCOIN')) ||
    (symbolUpper === 'BNB' && chainUpper === 'BSC') ||
    (symbolUpper === 'ETH' && chainUpper === 'ETH') ||
    (symbolUpper === 'MATIC' && chainUpper === 'POLYGON') ||
    (symbolUpper === 'TRX' && (chainUpper === 'TRX' || chainUpper === 'TRON')) ||
    (symbolUpper === 'SOL' && (chainUpper === 'SOL' || chainUpper === 'SOLANA'));

  if (isNative) {
    if (isEvmChain(chainUpper)) {
      return '0x0000000000000000000000000000000000000000';
    }
    // RocketX expects the symbol for native non-EVM tokens in fromToken/toToken
    if (chainUpper === 'BTC' || chainUpper === 'BITCOIN') return 'BTC';
    if (chainUpper === 'SOLANA' || chainUpper === 'SOL') return 'SOL';
    if (chainUpper === 'TRON' || chainUpper === 'TRX') return 'TRX';
    return '0x0000000000000000000000000000000000000000';
  }

  return symbol; 
}

function formatAmountForRocketX(amount: number, symbol: string, chain: string, decimals?: number): string {
  const chainUpper = chain.toUpperCase();
  const symbolUpper = symbol.toUpperCase();
  
  // RocketX expects decimal string for these non-EVM chains
  if (chainUpper === 'BTC' || symbolUpper === 'BTC' || 
      chainUpper === 'SOL' || symbolUpper === 'SOL' ||
      chainUpper === 'TRX' || symbolUpper === 'TRX' || chainUpper === 'TRON' ||
      chainUpper === 'BITCOIN' || chainUpper === 'NEAR' || symbolUpper === 'NEAR') {
    return amount.toString();
  }

  // Determine decimals for EVM/Token units if not provided
  let finalDecimals = decimals;
  if (finalDecimals === undefined) {
    if (symbolUpper === 'USDT' || symbolUpper === 'USDC') {
       if (chainUpper === 'ETH' || chainUpper === 'ARBITRUM' || chainUpper === 'OPTIMISM' || chainUpper === 'BASE') finalDecimals = 6;
       else finalDecimals = 18;
    }
    else finalDecimals = 18;
  }

  // Use decimal string instead of satoshis/wei for better API compatibility
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

    // Check if we have tokens for the networks
    let tokens: any[] = [];
    try {
      tokens = await rocketXApi.getTokens(fromNetId);
    } catch (e) {
      console.warn('Failed to fetch fromTokens from RocketX', e);
    }

    let targetTokens: any[] = [];
    if (toNetId) {
      try {
        targetTokens = await rocketXApi.getTokens(toNetId);
      } catch (e) {
        console.warn('Failed to fetch toTokens from RocketX', e);
      }
    }

    const fromToken = Array.isArray(tokens) ? tokens.find((t: any) => t?.token_symbol?.toUpperCase() === (from || "").toUpperCase()) : null;
    const toToken = to && Array.isArray(targetTokens) ? targetTokens.find((t: any) => t?.token_symbol?.toUpperCase() === (to || "").toUpperCase()) : null;

    const fromAddr_fallback = getRocketXTokenAddress(from || "", fromNetwork || "");
    const fromAddr = fromToken?.is_native_token === 1 || fromAddr_fallback === '0x0000000000000000000000000000000000000000' || fromAddr_fallback === 'BTC' || fromAddr_fallback === 'SOL' || fromAddr_fallback === 'TRX' ? 'null' : fromAddr_fallback;
    const toAddr_fallback = to ? getRocketXTokenAddress(to, toNetwork || fromNetwork) : 'null';
    const toAddr = toToken?.is_native_token === 1 || toAddr_fallback === '0x0000000000000000000000000000000000000000' || toAddr_fallback === 'BTC' || toAddr_fallback === 'SOL' || toAddr_fallback === 'TRX' ? 'null' : toAddr_fallback;
    
    const fromDecimals = fromToken?.token_decimals || params.fromDecimals;
    const formattedAmount = formatAmountForRocketX(amount || 0, from || "", fromNetwork || "", fromDecimals);

    // Validation: Ensure we don't send placeholders to RocketX
    if (params.toAddress === 'YOUR_REAL_EVM_ADDRESS' || !params.toAddress) {
      console.warn('Invalid toAddress detected, suppressing quote request');
      return null;
    }

    console.log(`RocketX Quote Request: ${from} (${fromNetId}:${fromAddr}) -> ${to ?? 'walletless'} (${toNetId ?? 'walletless'}), amount: ${formattedAmount}`);

    const isFromEvm = isEvmChain(fromNetwork);
    const isToEvm = toNetwork ? isEvmChain(toNetwork) : isFromEvm;

    // Build quotation params to match Edge Function expectations
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

    console.log('RocketX getQuotation Params:', JSON.stringify(quotationParams, null, 2));

    const data = await rocketXApi.getQuotation(quotationParams);
    console.log('RocketX Quotation Raw Response:', data);

    // The Edge Function returns { success: boolean, status: number, data: { quotes: [...] } }
    const quotes = data?.quotes || data?.data?.quotes;
    if (quotes && Array.isArray(quotes) && quotes.length > 0) {
      // Map RocketX response to our internal RocketXQuote interface
      const mappedQuotes: RocketXQuote[] = quotes.map((q: any) => ({
        exchange: q.exchangeInfo?.title || 'Unknown',
        exchangeIcon: q.exchangeInfo?.logo || '',
        type: q.type || 'swap',
        fromAmount: q.fromAmount,
        fromToken: q.fromTokenInfo?.token_symbol || from,
        toAmount: q.toAmount,
        toToken: q.toTokenInfo?.token_symbol || to,
        gasFee: q.gasFeeUsd || 0,
        estimatedTime: q.estTimeInSeconds?.avg ? `${Math.floor(q.estTimeInSeconds.avg / 60)}m` : 'Unknown',
        walletless: q.exchangeInfo?.walletLess,
        fromAmountInUsd: q.fromTokenInfo?.price ? q.fromAmount * q.fromTokenInfo.price : undefined,
        toAmountInUsd: q.toTokenInfo?.price ? q.toAmount * q.toTokenInfo.price : undefined,
        minAmount: q.additionalInfo?.minReceived,
      }));

      // Return the best quote (highest toAmount)
      return mappedQuotes.reduce((prev, current) =>
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
  async getTokens(chainId: string, page = 1, perPage = 100) { 
    return callRocketX('tokens', { chainId, page, perPage }); 
  },
  async searchTokens(keyword: string, chainId?: string) { 
    return callRocketX('tokens', { keyword, ...(chainId ? { chainId } : {}), perPage: 100 }); 
  },
  async getQuotation(params: { fromToken: string; fromNetwork: string; toToken?: string; toNetwork?: string; amount: string; slippage?: number; fromAddress?: string; toAddress?: string; }) {
    return callRocketX('quotation', params);
  },
  async executeSwap(params: Record<string, any>) { return callRocketX('swap', params); },
  async getStatus(requestId?: string, txHash?: string) {
    return callRocketX('status', { ...(requestId ? { requestId } : {}), ...(txHash ? { txHash } : {}) });
  },
};
