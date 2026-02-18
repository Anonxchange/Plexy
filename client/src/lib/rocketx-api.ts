import { supabase } from '@/lib/supabase';
// import { walletClient } from './wallet-client';

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
      throw new Error('Connection error: The Edge Function "rocketx-swap" could not be reached. Please verify the function is deployed.');
    }
    throw err;
  }
}

/**
 * Get the current exchange rate for a crypto pair from RocketX
 */
export async function getRocketxRate(
  from: string,
  fromNetwork: string,
  to: string,
  toNetwork: string,
  amount: number = 1
): Promise<RocketXQuote | null> {
  try {
    const data = await rocketXApi.getQuotation({
      fromTokenAddress: from,
      fromTokenChain: fromNetwork,
      toTokenAddress: to,
      toTokenChain: toNetwork,
      amount,
      fromAddress: "0x0000000000000000000000000000000000000000",
    });

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
  /** Get supported networks and configuration */
  async getConfiguration() {
    return callRocketX('configs');
  },

  /** Get tokens for a specific network with pagination */
  async getTokens(networkId: string, page = 1, limit = 50) {
    return callRocketX('tokens', { networkId, page, limit });
  },

  /** Search tokens by keyword, optionally filtered by network */
  async searchTokens(keyword: string, networkId?: string) {
    return callRocketX('search_tokens', { keyword, ...(networkId ? { networkId } : {}) });
  },

  /** Get swap quotation — params match the RocketX V1 API field names */
  async getQuotation(params: {
    fromTokenAddress: string;
    fromTokenChain: string;
    toTokenAddress?: string;
    toTokenChain?: string;
    amount: number;
    slippage?: number;
    fromAddress?: string;
    toAddress?: string;
  }) {
    return callRocketX('quotation', params);
  },

  /** Execute a swap */
  async executeSwap(params: Record<string, any>) {
    return callRocketX('swap', params);
  },

  /** Check swap status by requestId or txHash */
  async getStatus(requestId?: string, txHash?: string) {
    return callRocketX('status', {
      ...(requestId ? { requestId } : {}),
      ...(txHash ? { txHash } : {}),
    });
  },
};
