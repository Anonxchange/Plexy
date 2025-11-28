
import { createClient } from '../supabase';

const supabase = createClient();

export interface IPWhitelistEntry {
  id: string;
  user_id: string;
  ip_address: string;
  label: string;
  status: 'active' | 'revoked';
  last_used_at: string | null;
  created_at: string;
}

export interface IPWhitelistSettings {
  user_id: string;
  enabled: boolean;
  require_for_withdrawals: boolean;
  require_for_trades: boolean;
  require_for_api: boolean;
  created_at: string;
  updated_at: string;
}

class IPWhitelist {
  // Get user's current IP address (you may want to use a proper IP detection service)
  async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get current IP:', error);
      return 'unknown';
    }
  }

  // Get whitelist settings
  async getSettings(): Promise<IPWhitelistSettings | null> {
    const { data, error } = await supabase
      .from('ip_whitelist_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Initialize settings
  async initializeSettings(): Promise<IPWhitelistSettings> {
    const { data, error } = await supabase
      .from('ip_whitelist_settings')
      .insert({})
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update settings
  async updateSettings(settings: Partial<IPWhitelistSettings>): Promise<void> {
    const { error } = await supabase
      .from('ip_whitelist_settings')
      .upsert({
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }

  // Check if IP whitelist is enabled
  async isEnabled(): Promise<boolean> {
    let settings = await this.getSettings();
    
    if (!settings) {
      settings = await this.initializeSettings();
    }

    return settings.enabled;
  }

  // Add IP to whitelist
  async addIP(ip_address: string, label: string): Promise<IPWhitelistEntry> {
    const { data, error } = await supabase
      .from('ip_whitelist')
      .insert({
        ip_address,
        label,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all whitelisted IPs
  async getWhitelistedIPs(): Promise<IPWhitelistEntry[]> {
    const { data, error } = await supabase
      .from('ip_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Revoke IP from whitelist
  async revokeIP(ipId: string): Promise<void> {
    const { error } = await supabase
      .from('ip_whitelist')
      .update({ status: 'revoked' })
      .eq('id', ipId);

    if (error) throw error;
  }

  // Delete IP from whitelist
  async deleteIP(ipId: string): Promise<void> {
    const { error } = await supabase
      .from('ip_whitelist')
      .delete()
      .eq('id', ipId);

    if (error) throw error;
  }

  // Check if current IP is whitelisted
  async checkCurrentIP(): Promise<{ allowed: boolean; reason?: string }> {
    const currentIP = await this.getCurrentIP();
    const enabled = await this.isEnabled();

    if (!enabled) {
      return { allowed: true };
    }

    const { data, error } = await supabase.rpc('is_ip_whitelisted', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_ip_address: currentIP
    });

    if (error) throw error;

    if (!data) {
      return {
        allowed: false,
        reason: 'Your IP address is not whitelisted. Please add it in Security Settings.'
      };
    }

    return { allowed: true };
  }

  // Check if IP is allowed for specific operation
  async checkIPForOperation(operation: 'withdrawal' | 'trade' | 'api'): Promise<{ allowed: boolean; reason?: string }> {
    const settings = await this.getSettings();
    
    if (!settings || !settings.enabled) {
      return { allowed: true };
    }

    const requireCheck = {
      withdrawal: settings.require_for_withdrawals,
      trade: settings.require_for_trades,
      api: settings.require_for_api,
    }[operation];

    if (!requireCheck) {
      return { allowed: true };
    }

    return await this.checkCurrentIP();
  }
}

export const ipWhitelist = new IPWhitelist();
