
import { createClient } from '../supabase';
import { devLog } from '../dev-logger';

const supabase = createClient();

// In-memory fallback counters — used only when the DB is unreachable.
// Key: `${identifier}:${endpoint}`, value: { count, windowStart }
const localCounters = new Map<string, { count: number; windowStart: number }>();

export class RateLimiter {
  async checkLimit(
    identifier: string,
    endpoint: string,
    maxRequests: number = 60,
    windowMinutes: number = 1
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_endpoint: endpoint,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes
      });

      if (error) {
        devLog.error('Rate limit check failed — using local fallback:', error);
        return this._checkLocalLimit(identifier, endpoint, maxRequests, windowMinutes);
      }

      return data as boolean;
    } catch (error) {
      devLog.error('Rate limit error — using local fallback:', error);
      return this._checkLocalLimit(identifier, endpoint, maxRequests, windowMinutes);
    }
  }

  private _checkLocalLimit(
    identifier: string,
    endpoint: string,
    maxRequests: number,
    windowMinutes: number
  ): boolean {
    const key = `${identifier}:${endpoint}`;
    const windowMs = windowMinutes * 60_000;
    const now = Date.now();
    const entry = localCounters.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      localCounters.set(key, { count: 1, windowStart: now });
      return true;
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      devLog.warn(`Local rate limit exceeded for ${identifier} on ${endpoint}`);
      return false;
    }
    return true;
  }

  async checkAPILimit(apiKey: string, endpoint: string): Promise<boolean> {
    return this.checkLimit(`api:${apiKey}`, endpoint, 60, 1);
  }

  async checkUserLimit(userId: string, endpoint: string): Promise<boolean> {
    return this.checkLimit(`user:${userId}`, endpoint, 100, 1);
  }

  async checkIPLimit(ipAddress: string, endpoint: string): Promise<boolean> {
    return this.checkLimit(`ip:${ipAddress}`, endpoint, 200, 1);
  }
}

export const rateLimiter = new RateLimiter();
