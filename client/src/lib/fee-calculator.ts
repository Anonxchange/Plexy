
import { createClient } from "./supabase";
import { chainRpc, btcFees } from "./chain-gateway";

// ── EVM chain resolution ──────────────────────────────────────────────────────
// Maps a crypto symbol (as passed by the send dialog) to the chain key expected
// by chain-gateway's chainRpc(). Handles both bare symbols (ETH, BNB) and
// network-specific symbols (USDT_BSC, WETH_ARB, etc.).

const EVM_CHAIN_BASE: Record<string, string> = {
  ETH: "ETH",
  BNB: "BSC", BSC: "BSC",
  POL: "POL", MATIC: "POL",
  ARB: "ARB",
};

function evmChainForSymbol(symbol: string): string | null {
  if (symbol in EVM_CHAIN_BASE) return EVM_CHAIN_BASE[symbol];
  // e.g. USDT_BSC, USDC_ETH, WBTC_ARB → take the last segment
  const suffix = symbol.split("_").pop() ?? "";
  if (suffix in EVM_CHAIN_BASE) return EVM_CHAIN_BASE[suffix];
  return null;
}

// Standard EVM gas units for display-time estimation.
// Native-token transfers cost 21 000; ERC-20 transfers cost ~65 000.
const EVM_NATIVE_SYMBOLS = new Set(["ETH", "BNB", "POL", "MATIC"]);
function evmGasUnits(symbol: string): bigint {
  const base = symbol.split("_")[0];
  return EVM_NATIVE_SYMBOLS.has(base) ? 21_000n : 65_000n;
}

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
      // ── Step 1: Platform fee (always from Supabase — business rule, server-side) ──
      let platformFee = 0;
      let feePercentage: number | undefined;
      let feeConfigId: string | undefined;
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        const response = await this.supabase.functions.invoke('calculate-fee', {
          body: { transaction_type: transactionType, crypto_symbol: cryptoSymbol, amount },
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (!response.error) {
          platformFee    = response.data.platform_fee  ?? 0;
          feePercentage  = response.data.fee_percentage;
          feeConfigId    = response.data.fee_config?.id;
        }
      } catch (e) {
        console.warn('calculateSendFee: could not fetch platform fee, using 0:', e);
      }

      // ── Step 2: Network fee — live source per chain type ──────────────────────
      let networkFee = 0;
      let networkFeeLabel = `${cryptoSymbol} network fee`;

      if (!isInternal) {
        // ── Bitcoin: gateway → mempool.space (fast tier, matches executeSend) ──
        if (cryptoSymbol === 'BTC') {
          try {
            const fees = await btcFees();
            // "fast" tier is what executeSend uses (feesResult.fast).
            // Standard P2WPKH tx ~141 vBytes, legacy P2PKH ~225 vBytes — use 225
            // to be conservative (over-estimates slightly for SegWit, safe).
            const satPerByte = fees.fast || fees.normal || 10;
            const networkFeeSats = 225 * satPerByte;
            networkFee      = networkFeeSats / 1e8;
            networkFeeLabel = `BTC network fee (${satPerByte} sat/vB, fast)`;
          } catch (e) {
            console.warn('calculateSendFee: could not fetch BTC fee from gateway:', e);
          }

        // ── EVM chains: gateway → Alchemy eth_gasPrice (same source as signing) ──
        } else {
          const evmChain = evmChainForSymbol(cryptoSymbol);
          if (evmChain) {
            try {
              const gasPriceHex = await chainRpc(evmChain, 'eth_gasPrice', []);
              if (gasPriceHex) {
                const gasPrice = BigInt(gasPriceHex);
                const gasUnits = evmGasUnits(cryptoSymbol);
                networkFee      = Number(gasPrice * gasUnits) / 1e18;
                networkFeeLabel = `${cryptoSymbol} network fee (live gas price)`;
              }
            } catch (e) {
              console.warn(`calculateSendFee: could not fetch ${evmChain} gas price:`, e);
            }
          }
          // Non-EVM chains (SOL, TRX, XRP, etc.) fall through with networkFee = 0;
          // their fees come from the Supabase edge function below if available, or
          // are negligible enough that 0 is an acceptable display default.
        }
      }

      // ── Step 3: Assemble breakdown ─────────────────────────────────────────
      const breakdown: { type: string; amount: number; description: string }[] = [];
      if (platformFee > 0) {
        breakdown.push({
          type: 'platform',
          amount: platformFee,
          description: `Pexly ${isInternal ? 'internal transfer' : 'withdrawal'} fee`,
        });
      }
      if (networkFee > 0 && !isInternal) {
        breakdown.push({ type: 'network', amount: networkFee, description: networkFeeLabel });
      }

      const totalFee = platformFee + networkFee;
      return { platformFee, networkFee, totalFee, feePercentage, breakdown, feeConfigId };

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
      // Determine fee percentage based on trading pair
      let feePercentage = 0.15; // Default for all other pairs
      
      const pair = `${fromCrypto}/${toCrypto}`;
      const reversePair = `${toCrypto}/${fromCrypto}`;
      
      // BTC/USDT or USDT/BTC gets 0.09%-0.15% (we'll use 0.12% as average)
      if (pair === 'BTC/USDT' || reversePair === 'BTC/USDT' ||
          pair === 'BTC/USDC' || reversePair === 'BTC/USDC') {
        feePercentage = 0.12;
      }
      // SOL, TRX, BNB pairs get 0.15%
      else if (
        fromCrypto === 'SOL' || toCrypto === 'SOL' ||
        fromCrypto === 'TRX' || toCrypto === 'TRX' ||
        fromCrypto === 'BNB' || toCrypto === 'BNB'
      ) {
        feePercentage = 0.15;
      }
      
      // Calculate platform fee
      const platformFee = amount * (feePercentage / 100);
      
      // No network fee for swaps (internal transaction)
      const networkFee = 0;
      
      return {
        platformFee,
        networkFee,
        totalFee: platformFee,
        feePercentage,
        breakdown: [{
          type: 'swap',
          amount: platformFee,
          description: `Swap fee ${fromCrypto}/${toCrypto} (${feePercentage}%)`
        }],
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
