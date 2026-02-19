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
      throw new Error('RocketX service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    console.log('Invoking RocketX Edge Function:', { action, params });

    const { data, error } = await supabase.functions.invoke('rocketx-swap', {
      body: { action, params },
    });

    if (error) throw new Error(`Connection error: ${error.message || 'Could not reach swap service'}`);
    if (!data?.success) throw new Error(data?.error || data?.warning || 'Exchange service returned an error');

    return data.data;
  } catch (err: any) {
    console.error('callRocketX error:', err);
    throw err;
  }
}

function getRocketXNetworkId(chain: string): string {
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
  return map[chain.toUpperCase()] || chain.toUpperCase();
}

function isEvmChain(chain: string): boolean {
  const evmChains = ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'BASE', 'AVALANCHE'];
  return evmChains.includes(chain.toUpperCase());
}

function getRocketXTokenAddress(symbol: string, chain: string): string {
  const tokenMap: Record<string, Record<string, string>> = {
    'USDT': {
      'ETH': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'BSC': '0x55d398326f99059ff775485246999027b3197955',
      'TRON': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      'POLYGON': '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      'SOL': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    },
    'USDC': {
      'ETH': '0xa0b86991c6218b36c1d19D4a2e9Eb0ce3606eb48',
      'BSC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      'POLYGON': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      'SOL': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
  };

  const chainUpper = chain.toUpperCase();
  const symbolUpper = symbol.toUpperCase();

  if (tokenMap[symbolUpper]?.[chainUpper]) return tokenMap[symbolUpper][chainUpper];

  if (symbolUpper === chainUpper || 
      (symbolUpper === 'BTC' && chainUpper === 'BTC') ||
      (symbolUpper === 'ETH' && chainUpper === 'ETH') ||
      (symbolUpper === 'BNB' && chainUpper === 'BSC') ||
      (symbolUpper === 'MATIC' && chainUpper === 'POLYGON') ||
      (symbolUpper === 'TRX' && (chainUpper === 'TRX' || chainUpper === 'TRON')) ||
      (symbolUpper === 'SOL' && (chainUpper === 'SOL' || chainUpper === 'SOLANA'))) {

    if (isEvmChain(chainUpper)) return '0x0000000000000000000000000000000000000000';
    if (chainUpper === 'BTC') return 'BTC';
    if (chainUpper === 'SOL' || chainUpper === 'SOLANA') return 'SOL';
    if (chainUpper === 'TRX' || chainUpper === 'TRON') return 'TRX';
  }

  return symbol;
}

function formatAmountForRocketX(amount: number, symbol: string, chain: string, decimals?: number): string {
  let finalDecimals = decimals;
  const chainUpper = chain.toUpperCase();
  const symbolUpper = symbol.toUpperCase();

  if (finalDecimals === undefined) {
    if (symbolUpper === 'BTC' || chainUpper === 'BTC') finalDecimals = 8;
    else if (symbolUpper === 'TRX' || chainUpper === 'TRX') finalDecimals = 6;
    else if (symbolUpper === 'SOL' || chainUpper === 'SOL') finalDecimals = 9;
    else if (symbolUpper === 'USDT' || symbolUpper === 'USDC') finalDecimals = ['ETH','ARBITRUM','OPTIMISM','BASE'].includes(chainUpper) ? 6 : 18;
    else finalDecimals = 18;
  }

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

    const tokens: any[] = await rocketXApi.getTokens(fromNetId).catch(() => []);
    const targetTokens: any[] = toNetId ? await rocketXApi.getTokens(toNetId).catch(() => []) : [];

    const fromToken = tokens.find((t: any) => t.symbol?.toUpperCase() === from?.toUpperCase());
    const toToken = targetTokens.find((t: any) => t.symbol?.toUpperCase() === to?.toUpperCase());

    const fromAddr = fromToken?.address || getRocketXTokenAddress(from, fromNetwork);
    const toAddr = toToken?.address || getRocketXTokenAddress(to || '', toNetwork || fromNetwork);

    const formattedAmount = formatAmountForRocketX(amount, from, fromNetwork, fromToken?.decimals || params.fromDecimals);

    const isFromEvm = isEvmChain(fromNetwork);
    const isToEvm = toNetwork ? isEvmChain(toNetwork) : isFromEvm;

    const quotationParams = {
      fromTokenAddress: fromAddr,
      fromTokenChain: fromNetId,
      toTokenAddress: toAddr,
      toTokenChain: toNetId,
      amount: formattedAmount,
      fromAddress: params.fromAddress || (isFromEvm ? 'YOUR_REAL_EVM_ADDRESS' : 'YOUR_REAL_BTC_ADDRESS'),
      toAddress: params.toAddress || (isToEvm ? 'YOUR_REAL_EVM_ADDRESS' : 'YOUR_REAL_BTC_ADDRESS'),
      slippage: params.slippage || 3,
    };

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
  async getTokens(networkId: string, page = 1, limit = 50) { return callRocketX('tokens', { networkId, page, limit }); },
  async searchTokens(keyword: string, networkId?: string) { return callRocketX('search_tokens', { keyword, ...(networkId ? { networkId } : {}) }); },
  async getQuotation(params: { fromTokenAddress: string; fromTokenChain: string; toTokenAddress?: string; toTokenChain?: string; amount: number; slippage?: number; fromAddress?: string; toAddress?: string; }) {
    return callRocketX('quotation', params);
  },
  async executeSwap(params: Record<string, any>) { return callRocketX('swap', params); },
  async getStatus(requestId?: string, txHash?: string) {
    return callRocketX('status', { ...(requestId ? { requestId } : {}), ...(txHash ? { txHash } : {}) });
  },
};
