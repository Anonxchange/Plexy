
import { createClient } from '../supabase';

const supabase = createClient();

export interface ColdWallet {
  id: string;
  crypto_symbol: string;
  address: string;
  balance: number;
  last_audit: string | null;
  created_at: string;
}

export interface HotWalletThreshold {
  id: string;
  crypto_symbol: string;
  max_hot_balance: number;
  rebalance_threshold: number;
  target_hot_balance: number;
  updated_at: string;
}

export interface ColdHotTransfer {
  id: string;
  crypto_symbol: string;
  amount: number;
  from_cold_address: string;
  to_hot_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  security_delay_until: string;
  tx_hash: string | null;
  created_at: string;
}

class WalletManager {
  async getColdWallets(): Promise<ColdWallet[]> {
    const { data, error } = await supabase
      .from('cold_wallets')
      .select('*')
      .order('crypto_symbol');

    if (error) throw error;
    return data || [];
  }

  async getHotWalletThresholds(): Promise<HotWalletThreshold[]> {
    const { data, error } = await supabase
      .from('hot_wallet_thresholds')
      .select('*')
      .order('crypto_symbol');

    if (error) throw error;
    return data || [];
  }

  async requestColdToHotTransfer(
    crypto_symbol: string,
    amount: number,
    from_cold_address: string,
    to_hot_address: string
  ): Promise<ColdHotTransfer> {
    const security_delay_until = new Date();
    security_delay_until.setHours(security_delay_until.getHours() + 24); // 24-hour security delay

    const { data, error } = await supabase
      .from('cold_hot_transfers')
      .insert({
        crypto_symbol,
        amount,
        from_cold_address,
        to_hot_address,
        security_delay_until: security_delay_until.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPendingTransfers(): Promise<ColdHotTransfer[]> {
    const { data, error } = await supabase
      .from('cold_hot_transfers')
      .select('*')
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async approveTransfer(transferId: string): Promise<void> {
    const { error } = await supabase
      .from('cold_hot_transfers')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', transferId);

    if (error) throw error;
  }
}

export const walletManager = new WalletManager();
