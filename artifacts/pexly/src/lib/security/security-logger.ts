import { getSupabase } from '../supabase';
import { devLog } from '../dev-logger';

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'login_blocked'
  | 'logout'
  | 'password_change'
  | 'email_change'
  | 'phone_change'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'session_timeout'
  | 'new_device_login'
  | 'withdrawal_attempt'
  | 'large_transaction'
  | 'account_locked'
  | 'verification_submitted'
  | 'api_error'
  | 'brute_force_detected';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

interface SecurityEvent {
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface ThreatPattern {
  type: string;
  threshold: number;
  windowMs: number;
  severity: SecuritySeverity;
}

const THREAT_PATTERNS: ThreatPattern[] = [
  { type: 'login_failed', threshold: 5, windowMs: 300000, severity: 'critical' },
  { type: 'unauthorized_access', threshold: 3, windowMs: 60000, severity: 'critical' },
  { type: 'rate_limit_exceeded', threshold: 10, windowMs: 60000, severity: 'warning' },
  { type: 'api_error', threshold: 20, windowMs: 60000, severity: 'warning' },
];

class SecurityLogger {
  private listeners: ((event: SecurityEvent) => void)[] = [];

  async log(event: Omit<SecurityEvent, 'ip_address' | 'user_agent'>): Promise<void> {
    try {
      const fullEvent: SecurityEvent = {
        ...event,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      };

      const supabase = await getSupabase();
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: fullEvent.event_type,
          severity: fullEvent.severity,
          user_id: fullEvent.user_id,
          user_agent: fullEvent.user_agent,
          details: fullEvent.details,
          metadata: fullEvent.metadata,
          created_at: new Date().toISOString(),
        });

      if (error) {
        devLog.error('Failed to log security event:', error);
        this.logToLocalStorage(fullEvent);
        return;
      }

      await this.checkThreatPatternsFromDB(fullEvent);
      this.notifyListeners(fullEvent);

    } catch (error) {
      devLog.error('Security logger error:', error);
    }
  }

  private logToLocalStorage(event: SecurityEvent): void {
    try {
      const key = 'pexly_security_events_queue';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({ ...event, timestamp: Date.now() });
      if (existing.length > 100) existing.shift();
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {
      devLog.error('Failed to store event locally');
    }
  }

  private async checkThreatPatternsFromDB(event: SecurityEvent): Promise<void> {
    const pattern = THREAT_PATTERNS.find(p => p.type === event.event_type);
    if (!pattern) return;

    try {
      const supabase = await getSupabase();
      const windowStart = new Date(Date.now() - pattern.windowMs).toISOString();
      
      const { count, error } = await supabase
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', event.event_type)
        .eq('user_id', event.user_id || '')
        .gte('created_at', windowStart);

      if (error) {
        devLog.error('Failed to check threat patterns:', error);
        return;
      }

      if (count && count >= pattern.threshold) {
        await this.triggerThreatAlert(event, pattern, count);
      }
    } catch (error) {
      devLog.error('Error checking threat patterns:', error);
    }
  }

  private async triggerThreatAlert(
    event: SecurityEvent, 
    pattern: ThreatPattern,
    count: number
  ): Promise<void> {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          alert_type: 'threat_detected',
          severity: pattern.severity,
          user_id: event.user_id,
          details: {
            trigger_event: event.event_type,
            count,
            threshold: pattern.threshold,
            window_ms: pattern.windowMs,
          },
          status: 'open',
          created_at: new Date().toISOString(),
        });

      if (error) {
        devLog.error('Failed to create security alert:', error);
      }
    } catch (error) {
      devLog.error('Error triggering threat alert:', error);
    }
  }

  onEvent(callback: (event: SecurityEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(event: SecurityEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  async getRecentEvents(limit = 50): Promise<any[]> {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        devLog.error('Failed to fetch security events:', error);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  }

  async getActiveAlerts(): Promise<any[]> {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        devLog.error('Failed to fetch security alerts:', error);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  }

  async getSecurityStats(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    activeAlerts: number;
    blockedIPs: number;
  }> {
    try {
      const supabase = await getSupabase();
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [eventsResult, criticalResult, alertsResult] = await Promise.all([
        supabase
          .from('security_events')
          .select('id', { count: 'exact' })
          .gte('created_at', dayAgo.toISOString()),
        supabase
          .from('security_events')
          .select('id', { count: 'exact' })
          .eq('severity', 'critical')
          .gte('created_at', dayAgo.toISOString()),
        supabase
          .from('security_alerts')
          .select('id', { count: 'exact' })
          .eq('status', 'open'),
      ]);

      return {
        totalEvents: eventsResult.count || 0,
        criticalEvents: criticalResult.count || 0,
        activeAlerts: alertsResult.count || 0,
        blockedIPs: 0,
      };
    } catch {
      return { totalEvents: 0, criticalEvents: 0, activeAlerts: 0, blockedIPs: 0 };
    }
  }

  async resolveAlert(alertId: string, resolution: string): Promise<boolean> {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('security_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolution,
        })
        .eq('id', alertId);

      if (error) {
        devLog.error('Failed to resolve alert:', error);
        return false;
      }
      return true;
    } catch (error) {
      devLog.error('Error resolving alert:', error);
      return false;
    }
  }
}

export const securityLogger = new SecurityLogger();

export async function logLoginAttempt(success: boolean, userId?: string, reason?: string) {
  await securityLogger.log({
    event_type: success ? 'login_success' : 'login_failed',
    severity: success ? 'info' : 'warning',
    user_id: userId,
    details: { reason },
  });
}

export async function logSuspiciousActivity(
  activity: string, 
  userId?: string, 
  details?: Record<string, any>
) {
  await securityLogger.log({
    event_type: 'suspicious_activity',
    severity: 'warning',
    user_id: userId,
    details: { activity, ...details },
  });
}

export async function logSecurityChange(
  changeType: '2fa_enabled' | '2fa_disabled' | 'password_change' | 'email_change' | 'phone_change',
  userId: string
) {
  await securityLogger.log({
    event_type: changeType,
    severity: 'info',
    user_id: userId,
  });
}

export async function logLargeTransaction(
  userId: string,
  amount: number,
  currency: string,
  type: 'send' | 'receive' | 'trade'
) {
  await securityLogger.log({
    event_type: 'large_transaction',
    severity: 'warning',
    user_id: userId,
    details: { amount, currency, type },
  });
}
