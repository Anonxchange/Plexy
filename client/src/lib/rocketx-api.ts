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
    
    // If Supabase is not configured, try to call RocketX directly or show a better error
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, using mock/local mode for RocketX');
      throw new Error('RocketX service is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    console.log('Invoking RocketX Edge Function:', {
      url: `${supabaseUrl}/functions/v1/rocketx-swap`,
      action,
      params
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    };

    const { data, error } = await supabase.functions.invoke('rocketx-swap', {
      body: { action, params },
      headers
    });

    if (error) {
      console.error('Supabase function invocation error:', error);
      // Check if it's a network error vs a function error
      const errorMsg = error.message || 'Could not reach swap service';
      throw new Error(`Connection error: ${errorMsg}`);
    }

    if (!data?.success) {
      console.error('RocketX API business logic error:', data?.error);
      throw new Error(data?.error || 'Exchange service returned an error');
    }

    return data.data;
  } catch (err: any) {
    console.error('Unexpected error in callRocketX:', err);
    // If it's the "Failed to send a request" error, provide more context
    if (err.message?.includes('Failed to send a request')) {
      throw new Error('Connection error: The Edge Function "rocketx-swap" could not be reached. Please verify the function is deployed and CORS is enabled.');
    }
    throw err;
  }
}

/**
 * Get the current exchange rate for a crypto pair from RocketX
 * @param from symbol of from crypto (e.g. 'BTC')
 * @param fromNetwork network of from crypto (e.g. 'BTC')
 * @param to symbol of to crypto (e.g. 'USDT')
 * @param toNetwork network of to crypto (e.g. 'ETH')
 * @returns market rate as number
 */
export async function getRocketxRate(from: string, fromNetwork: string, to: string, toNetwork: string, amount: number = 1): Promise<RocketXQuote | null> {
  try {
    const data = await rocketXApi.getQuotation({
      fromToken: from,
      fromNetwork: fromNetwork,
      toToken: to,
      toNetwork: toNetwork,
      amount: amount
    });
    
    if (data && data.length > 0) {
      // Find the best rate (highest toAmount)
      const bestQuote = data.reduce((prev: RocketXQuote, current: RocketXQuote) => {
        return (prev.toAmount > current.toAmount) ? prev : current;
      });
      return bestQuote;
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
  async getTokens(network: string, page = 1, limit = 50) {
    return callRocketX('tokens', { network, page, limit });
  },

  /** Search tokens by keyword */
  async searchTokens(keyword: string) {
    return callRocketX('search_tokens', { keyword });
  },

  /** Get swap quotation from all exchanges */
  async getQuotation(params: {
    fromToken: string;
    fromNetwork: string;
    toToken?: string;
    toNetwork?: string;
    amount: number;
    slippage?: number;
  }) {
    return callRocketX('quotation', params);
  },

  /** Execute a swap */
  async executeSwap(params: Record<string, any>) {
    return callRocketX('swap', params);
  },

  /** Check swap status */
  async getStatus(id: string) {
    return callRocketX('status', { id });
  },
};
