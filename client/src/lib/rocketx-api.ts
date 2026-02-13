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
    const { data, error } = await supabase.functions.invoke('rocketx-swap', {
      body: { action, params },
    });

    if (error) {
      console.error('Supabase function invocation error:', {
        message: error.message,
        name: error.name,
        details: error
      });
      throw new Error(`Connection error: ${error.message || 'Could not reach swap service'}`);
    }

    if (!data?.success) {
      console.error('RocketX API business logic error:', data?.error);
      throw new Error(data?.error || 'Exchange service returned an error');
    }

    return data.data;
  } catch (err: any) {
    console.error('Unexpected error in callRocketX:', err);
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
export async function getRocketxRate(from: string, fromNetwork: string, to: string, toNetwork: string, amount: number = 1): Promise<number> {
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
      return bestQuote.toAmount;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching RocketX rate:', error);
    return 0;
  }
}

export const rocketXApi = {
  /** Get supported networks and configuration */
  async getConfiguration() {
    return callRocketX('configuration');
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
