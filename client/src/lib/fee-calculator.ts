
import { createClient } from "./supabase";

export interface FeeConfiguration {
  id: string;
  transaction_type: string;
  crypto_symbol: string;
  fee_type: 'fixed' | 'percentage' | 'tiered';
  fixed_fee_amount?: number;
  percentage_fee?: number;
  min_fee?: number;
  max_fee?: number;
  min_amount?: number;
  max_amount?: number;
  notes?: string;
}

export interface BlockchainNetworkFee {
  id: string;
  crypto_symbol: string;
  network: string;
  fee_type: 'withdrawal' | 'deposit' | 'transfer';
  current_fee: number;
  fee_unit: string;
  priority_level: 'low' | 'standard' | 'high';
  estimated_confirmation_time?: number;
}

export interface CalculatedFee {
  platformFee: number;
  networkFee: number;
  totalFee: number;
  feePercentage?: number;
  breakdown: {
    type: string;
    amount: number;
    description: string;
  }[];
  feeConfigId?: string;
}

export class FeeCalculator {
  private supabase = createClient();

  async calculateSendFee(
    cryptoSymbol: string,
    amount: number,
    isInternal: boolean = false
  ): Promise<CalculatedFee> {
    const transactionType = isInternal ? 'internal_transfer' : 'withdrawal';
    
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      const response = await this.supabase.functions.invoke('calculate-fee', {
        body: {
          transaction_type: transactionType,
          crypto_symbol: cryptoSymbol,
          amount: amount,
        },
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (response.error) throw response.error;

      const data = response.data;
      
      const breakdown = [];
      if (data.platform_fee > 0) {
        breakdown.push({
          type: 'platform',
          amount: data.platform_fee,
          description: `Pexly ${isInternal ? 'internal transfer' : 'withdrawal'} fee`
        });
      }
      if (data.network_fee > 0 && !isInternal) {
        breakdown.push({
          type: 'network',
          amount: data.network_fee,
          description: `${cryptoSymbol} network fee`
        });
      }

      return {
        platformFee: data.platform_fee,
        networkFee: data.network_fee,
        totalFee: data.total_fee,
        feePercentage: data.fee_percentage,
        breakdown,
        feeConfigId: data.fee_config?.id
      };
    } catch (error) {
      console.error('Error calculating send fee:', error);
      throw error;
    }
  }

  async calculateMarketplaceFee(
    cryptoSymbol: string,
    amount: number,
    paymentMethod: string,
    isBuy: boolean
  ): Promise<CalculatedFee> {
    const transactionType = isBuy ? 'marketplace_buy' : 'marketplace_sell';
    
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      const response = await this.supabase.functions.invoke('calculate-fee', {
        body: {
          transaction_type: transactionType,
          crypto_symbol: cryptoSymbol,
          amount: amount,
          payment_method: paymentMethod,
        },
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (response.error) throw response.error;

      const data = response.data;

      return {
        platformFee: data.platform_fee,
        networkFee: data.network_fee,
        totalFee: data.total_fee,
        feePercentage: data.fee_percentage,
        breakdown: [{
          type: 'marketplace',
          amount: data.platform_fee,
          description: `${isBuy ? 'Buy' : 'Sell'} fee - ${paymentMethod}`
        }],
        feeConfigId: data.fee_config?.id
      };
    } catch (error) {
      console.error('Error calculating marketplace fee:', error);
      throw error;
    }
  }

  async calculateSwapFee(
    fromCrypto: string,
    toCrypto: string,
    amount: number
  ): Promise<CalculatedFee> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      const response = await this.supabase.functions.invoke('calculate-fee', {
        body: {
          transaction_type: 'swap',
          crypto_symbol: fromCrypto,
          from_crypto: fromCrypto,
          to_crypto: toCrypto,
          amount: amount,
        },
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (response.error) throw response.error;

      const data = response.data;

      return {
        platformFee: data.platform_fee,
        networkFee: data.network_fee,
        totalFee: data.total_fee,
        feePercentage: data.fee_percentage,
        breakdown: [{
          type: 'swap',
          amount: data.platform_fee,
          description: `Swap fee ${fromCrypto}/${toCrypto}`
        }],
        feeConfigId: data.fee_config?.id
      };
    } catch (error) {
      console.error('Error calculating swap fee:', error);
      throw error;
    }
  }

  async recordFeeTransaction(params: {
    transactionType: string;
    cryptoSymbol: string;
    amount: number;
    platformFee: number;
    networkFee: number;
    totalFee: number;
    feeConfigId?: string;
    transactionId?: string;
    paymentMethod?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await this.supabase.functions.invoke('record-fee-transaction', {
        body: {
          transaction_type: params.transactionType,
          crypto_symbol: params.cryptoSymbol,
          amount: params.amount,
          platform_fee: params.platformFee,
          network_fee: params.networkFee,
          total_fee: params.totalFee,
          fee_config_id: params.feeConfigId,
          transaction_id: params.transactionId,
          payment_method: params.paymentMethod,
          metadata: params.metadata,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;

      return response.data;
    } catch (error) {
      console.error('Error recording fee transaction:', error);
      throw error;
    }
  }

  async getNetworkFee(cryptoSymbol: string, feeType: string = 'withdrawal'): Promise<BlockchainNetworkFee | null> {
    const { data } = await this.supabase
      .from('blockchain_network_fees')
      .select('*')
      .eq('crypto_symbol', cryptoSymbol)
      .eq('fee_type', feeType)
      .eq('is_active', true)
      .single();

    return data;
  }

  async getAllFeeConfigurations(): Promise<FeeConfiguration[]> {
    const { data } = await this.supabase
      .from('fee_configurations')
      .select('*')
      .order('crypto_symbol', { ascending: true });

    return data || [];
  }
}

export const feeCalculator = new FeeCalculator();
