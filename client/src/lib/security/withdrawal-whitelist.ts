
import { createClient } from '../supabase';

const supabase = createClient();

export interface WhitelistAddress {
  id: string;
  user_id: string;
  crypto_symbol: string;
  address: string;
  label: string;
  status: 'pending' | 'active' | 'rejected';
  activation_time: string | null;
  created_at: string;
  activated_at: string | null;
}

export interface SecuritySettings {
  user_id: string;
  whitelist_enabled: boolean;
  created_at: string;
  updated_at: string;
}

class WithdrawalWhitelist {
  // Security Settings Management
  async getSettings(): Promise<SecuritySettings | null> {
    const { data, error } = await supabase
      .from('user_security_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async initializeSettings(): Promise<SecuritySettings> {
    const { data, error } = await supabase
      .from('user_security_settings')
      .insert({})
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWhitelistEnabled(enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_security_settings')
      .upsert({
        whitelist_enabled: enabled,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }

  async isWhitelistEnabled(): Promise<boolean> {
    let settings = await this.getSettings();
    
    if (!settings) {
      settings = await this.initializeSettings();
    }

    return settings.whitelist_enabled;
  }

  // Whitelist Address Management
  async addAddress(
    crypto_symbol: string,
    address: string,
    label: string
  ): Promise<WhitelistAddress> {
    const activation_time = new Date();
    activation_time.setHours(activation_time.getHours() + 24); // 24-hour delay

    const { data, error } = await supabase
      .from('withdrawal_whitelist')
      .insert({
        crypto_symbol,
        address,
        label,
        activation_time: activation_time.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAddresses(crypto_symbol?: string): Promise<WhitelistAddress[]> {
    let query = supabase
      .from('withdrawal_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (crypto_symbol) {
      query = query.eq('crypto_symbol', crypto_symbol);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async removeAddress(addressId: string): Promise<void> {
    const { error } = await supabase
      .from('withdrawal_whitelist')
      .delete()
      .eq('id', addressId);

    if (error) throw error;
  }

  async isAddressWhitelisted(
    crypto_symbol: string,
    address: string
  ): Promise<boolean> {
    const { count, error } = await supabase
      .from('withdrawal_whitelist')
      .select('id', { count: 'exact', head: true })
      .eq('crypto_symbol', crypto_symbol)
      .eq('address', address)
      .eq('status', 'active');

    if (error) throw error;
    return (count || 0) > 0;
  }

  async checkWithdrawalAllowed(
    crypto_symbol: string,
    address: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const whitelistEnabled = await this.isWhitelistEnabled();

    // If whitelist is disabled, allow all withdrawals
    if (!whitelistEnabled) {
      return { allowed: true };
    }

    // If whitelist is enabled, check if address is whitelisted
    const isWhitelisted = await this.isAddressWhitelisted(crypto_symbol, address);
    
    if (!isWhitelisted) {
      return { 
        allowed: false, 
        reason: 'Address must be whitelisted. Please add it in Security Settings and wait 24 hours for activation.' 
      };
    }

    return { allowed: true };
  }
}

export const withdrawalWhitelist = new WithdrawalWhitelist();
