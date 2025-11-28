
import { createClient } from '../supabase';

const supabase = createClient();

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
        console.error('Rate limit check failed:', error);
        return true; // Allow on error to prevent blocking legitimate users
      }

      return data as boolean;
    } catch (error) {
      console.error('Rate limit error:', error);
      return true;
    }
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
