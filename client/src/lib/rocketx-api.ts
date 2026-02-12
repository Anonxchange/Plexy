import { supabase } from '@/integrations/supabase/client';

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
  const { data, error } = await supabase.functions.invoke('rocketx-swap', {
    body: { action, params },
  });

  if (error) {
    throw new Error(error.message || 'RocketX API call failed');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'RocketX API returned an error');
  }

  return data.data;
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
  async executeSwap(params: {
    quoteId: string;
    fromAddress: string;
    toAddress: string;
    [key: string]: any;
  }) {
    return callRocketX('swap', params);
  },

  /** Check swap status */
  async getStatus(id: string) {
    return callRocketX('status', { id });
  },
};
