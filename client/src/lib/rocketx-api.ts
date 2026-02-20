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
    'BTC': 'BTC',
    'ETH': 'ETH',
    'BSC': 'BSC',
    'TRX': 'TRON',
    'TRON': 'TRON',
    'SOL': 'SOLANA',
    'SOLANA': 'SOLANA',
    'POLYGON': 'POLYGON',
    'ARBITRUM': 'ARBITRUM',
    'OPTIMISM': 'OPTIMISM',
    'BASE': 'BASE',
    'AVALANCHE': 'AVALANCHE',
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
    // For non-EVM native tokens, use specific identifiers as required by RocketX
    if (chainUpper === 'BTC') return 'BTC';
    if (chainUpper === 'SOLANA' || chainUpper === 'SOL') return 'SOL';
    if (chainUpper === 'TRON' || chainUpper === 'TRX') return 'TRX';
    return '0x0000000000000000000000000000000000000000'; // Default for other natives if needed
  }

  return symbol; 
}

function formatAmountForRocketX(amount: number, symbol: string, chain: string, decimals?: number): string {
  const chainUpper = chain.toUpperCase();
  const symbolUpper = symbol.toUpperCase();
  
  // For BTC, SOL, and TRX, RocketX typically expects the amount as a decimal string (e.g., "0.0001")
  // The user mentioned 1000 being wrong for Bitcoin. 1000 sats = 0.00001 BTC.
  // If the user inputs 0.0001, we should return "0.0001".
  
  if (chainUpper === 'BTC' || symbolUpper === 'BTC' || 
      chainUpper === 'SOL' || symbolUpper === 'SOL' ||
      chainUpper === 'TRX' || symbolUpper === 'TRX' || chainUpper === 'TRON' ||
      chainUpper === 'BITCOIN') {
    // Return with sufficient precision for crypto amounts
    return amount.toFixed(8).replace(/\.?0+$/, "");
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

  // Use a more robust way to handle decimals to avoid floating point issues
  return Math.floor(amount * Math.pow(10, finalDecimals)).toString();
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

    // Ensure we handle cases where symbol might be missing or different from what we expect
    const fromToken = Array.isArray(tokens) ? tokens.find((t: any) => t?.token_symbol?.toUpperCase() === (from || "").toUpperCase()) : null;
    const toToken = to && Array.isArray(targetTokens) ? targetTokens.find((t: any) => t?.token_symbol?.toUpperCase() === (to || "").toUpperCase()) : null;

    const fromAddr = fromToken?.contract_address || getRocketXTokenAddress(from || "", fromNetwork || "");
    const toAddr = toToken?.contract_address || (to ? getRocketXTokenAddress(to, toNetwork || fromNetwork) : '0x0000000000000000000000000000000000000000');
    
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

    const quotationParams: any = {
      fromToken: fromAddr,
      fromNetwork: fromNetId,
      toToken: toAddr,
      toNetwork: toNetId,
      amount: formattedAmount,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      slippage: params.slippage || 3,
    };

    // Ensure toAddress is always set to the user's destination wallet address
    if (params.toAddress) {
      quotationParams.toAddress = params.toAddress;
    }

    // Fix for specific toTokenAddress mapping if missing from API
    if (to === 'USDT' && toNetwork === 'ETH' && (quotationParams.toToken === 'USDT' || !quotationParams.toToken)) {
      quotationParams.toToken = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    }

    console.log('RocketX getQuotation Params:', JSON.stringify(quotationParams, null, 2));

    const data = await rocketXApi.getQuotation(quotationParams);

    if (data && data.length > 0) {
      return data.reduce((prev: RocketXQuote, current: RocketXQuote) =>
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
