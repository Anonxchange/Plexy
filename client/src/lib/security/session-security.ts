import { createClient } from '../supabase';

const supabase = createClient();

export interface ActiveSession {
  id: string;
  user_id: string;
  session_token: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  is_current: boolean;
  created_at: string;
  last_active: string;
  expires_at: string;
}

export interface DeviceOTP {
  id: string;
  user_id: string;
  email: string;
  otp_code: string;
  device_fingerprint: string;
  device_info: {
    device_name: string;
    browser: string;
    os: string;
    ip_address: string;
  };
  expires_at: string;
  verified: boolean;
  created_at: string;
}

export interface LoginNotification {
  id: string;
  user_id: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  login_at: string;
  is_read: boolean;
  notification_type: 'new_login' | 'session_invalidated' | 'new_device';
  message?: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function getDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Session fingerprint', 2, 2);
    components.push(canvas.toDataURL());
  }
  
  const fingerprint = components.join('|||');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getDeviceInfo(): { deviceName: string; browser: string; os: string } {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceName = 'Desktop';

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  }

  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    deviceName = 'Mobile';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    deviceName = ua.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  return { browser, os, deviceName };
}

async function getIPAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unknown';
  }
}

class SessionSecurityManager {
  private currentSessionToken: string | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  async isDeviceTrusted(userId: string): Promise<boolean> {
    const fingerprint = await getDeviceFingerprint();
    
    const { data } = await supabase
      .from('trusted_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .eq('is_trusted', true)
      .maybeSingle();
    
    return !!data;
  }

  async checkDeviceAndGenerateOTP(userId: string, email: string): Promise<{
    requiresOTP: boolean;
    otpSent?: boolean;
    error?: string;
  }> {
    try {
      const fingerprint = await getDeviceFingerprint();
      const deviceInfo = getDeviceInfo();
      const ipAddress = await getIPAddress();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { requiresOTP: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-otp-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          device_fingerprint: fingerprint,
          device_info: {
            device_name: deviceInfo.deviceName,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip_address: ipAddress,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { requiresOTP: true, otpSent: false, error: errorData.error || 'Failed to generate OTP' };
      }

      const data = await response.json();
      
      if (data.device_trusted) {
        return { requiresOTP: false };
      }

      return { requiresOTP: true, otpSent: data.otp_sent || false };
    } catch (error) {
      console.error('Error checking device:', error);
      return { requiresOTP: false };
    }
  }

  async verifyOTP(userId: string, otp: string): Promise<{
    verified: boolean;
    error?: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { verified: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-otp-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          otp_code: otp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { verified: false, error: errorData.error || 'Verification failed' };
      }

      const data = await response.json();
      
      if (data.verified && data.session_token) {
        this.currentSessionToken = data.session_token;
        localStorage.setItem('session_token', data.session_token);
      }

      return { verified: data.verified || false, error: data.error };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { verified: false, error: 'Verification failed' };
    }
  }

  async resendOTP(userId: string, email: string): Promise<{
    sent: boolean;
    error?: string;
  }> {
    return this.checkDeviceAndGenerateOTP(userId, email)
      .then(result => ({
        sent: result.otpSent || false,
        error: result.error,
      }));
  }

  async createSession(userId: string): Promise<string | null> {
    try {
      const deviceInfo = getDeviceInfo();
      const ipAddress = await getIPAddress();
      const fingerprint = await getDeviceFingerprint();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active auth session');
        return null;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          device_fingerprint: fingerprint,
          device_info: {
            device_name: deviceInfo.deviceName,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ip_address: ipAddress,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating session:', errorData);
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.session_token) {
        console.error('Invalid session response:', data);
        return null;
      }

      this.currentSessionToken = data.session_token;
      localStorage.setItem('session_token', data.session_token);

      return data.session_token;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  async validateSession(userId: string): Promise<{
    valid: boolean;
    reason?: 'expired' | 'invalidated' | 'not_found';
  }> {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        return { valid: false, reason: 'not_found' };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { valid: false, reason: 'invalidated' };
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          session_token: sessionToken,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { valid: false, reason: 'invalidated' };
        }
        console.error('Error validating session');
        return { valid: false, reason: 'invalidated' };
      }

      const data = await response.json();
      
      if (!data.valid && data.reason) {
        return { valid: false, reason: data.reason };
      }

      return { valid: data.valid || false };
    } catch (error) {
      console.error('Error validating session:', error);
      return { valid: false, reason: 'invalidated' };
    }
  }

  async endSession(userId: string): Promise<void> {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (sessionToken) {
        await supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', userId)
          .eq('session_token', sessionToken);
      }

      localStorage.removeItem('session_token');
      this.currentSessionToken = null;
      this.stopSessionValidation();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  async endAllOtherSessions(userId: string): Promise<void> {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (sessionToken) {
        await supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', userId)
          .neq('session_token', sessionToken);
      }
    } catch (error) {
      console.error('Error ending other sessions:', error);
    }
  }

  startSessionValidation(userId: string, onInvalidated: (reason: string) => void): void {
    this.stopSessionValidation();

    this.sessionCheckInterval = setInterval(async () => {
      const result = await this.validateSession(userId);
      if (!result.valid && result.reason) {
        onInvalidated(result.reason);
      }
    }, 30000);
  }

  stopSessionValidation(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  subscribeToSessionInvalidation(
    userId: string,
    onInvalidated: (notification: LoginNotification) => void
  ): () => void {
    const channel = supabase
      .channel(`session-invalidation-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'login_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as LoginNotification;
          if (notification.notification_type === 'session_invalidated' || 
              notification.notification_type === 'new_login') {
            onInvalidated(notification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async getLoginNotifications(userId: string): Promise<LoginNotification[]> {
    const { data } = await supabase
      .from('login_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('login_at', { ascending: false })
      .limit(20);

    return data || [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('login_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await supabase
      .from('login_notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
  }

  async getTrustedDevices(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('is_trusted', true)
      .order('last_used_at', { ascending: false });

    return data || [];
  }

  async removeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    await supabase
      .from('trusted_devices')
      .update({ is_trusted: false })
      .eq('user_id', userId)
      .eq('id', deviceId);
  }

  async removeAllTrustedDevices(userId: string): Promise<void> {
    const fingerprint = await getDeviceFingerprint();
    
    await supabase
      .from('trusted_devices')
      .update({ is_trusted: false })
      .eq('user_id', userId)
      .neq('device_fingerprint', fingerprint);
  }
}

export const sessionSecurity = new SessionSecurityManager();
