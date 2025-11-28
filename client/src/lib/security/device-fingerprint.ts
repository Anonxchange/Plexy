
import { createClient } from '../supabase';

const supabase = createClient();

export interface DeviceFingerprint {
  id: string;
  user_id: string;
  fingerprint_hash: string;
  device_info: {
    platform?: string;
    userAgent?: string;
    screen?: string;
    language?: string;
    timezone?: string;
    plugins?: string[];
  };
  ip_address: string | null;
  trusted: boolean;
  last_seen_at: string;
  created_at: string;
}

class DeviceFingerprintManager {
  private async generateFingerprint(): Promise<string> {
    const components = [];

    // Browser/Platform info
    components.push(navigator.userAgent);
    components.push(navigator.platform);
    components.push(navigator.language);
    
    // Screen info
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    
    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Canvas fingerprint (more advanced)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      components.push(canvas.toDataURL());
    }

    // Generate hash from components
    const fingerprint = components.join('|||');
    return await this.hashString(fingerprint);
  }

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async getCurrentFingerprint(): Promise<string> {
    return await this.generateFingerprint();
  }

  async registerDevice(): Promise<DeviceFingerprint> {
    const fingerprint = await this.generateFingerprint();
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipResponse.json();

    const deviceInfo = {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const { data, error } = await supabase
      .from('device_fingerprints')
      .upsert({
        fingerprint_hash: fingerprint,
        device_info: deviceInfo,
        ip_address: ip,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,fingerprint_hash'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDevices(): Promise<DeviceFingerprint[]> {
    const { data, error } = await supabase
      .from('device_fingerprints')
      .select('*')
      .order('last_seen_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async trustDevice(deviceId: string): Promise<void> {
    const { error } = await supabase
      .from('device_fingerprints')
      .update({ trusted: true })
      .eq('id', deviceId);

    if (error) throw error;
  }

  async revokeDevice(deviceId: string): Promise<void> {
    const { error } = await supabase
      .from('device_fingerprints')
      .delete()
      .eq('id', deviceId);

    if (error) throw error;
  }

  async isDeviceTrusted(): Promise<boolean> {
    const fingerprint = await this.generateFingerprint();

    const { data, error } = await supabase
      .from('device_fingerprints')
      .select('trusted')
      .eq('fingerprint_hash', fingerprint)
      .single();

    if (error || !data) return false;
    return data.trusted;
  }
}

export const deviceFingerprint = new DeviceFingerprintManager();
