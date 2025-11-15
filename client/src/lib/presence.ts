
import { createClient } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  user_id: string;
  online_at: string;
}

class PresenceTracker {
  private channel: RealtimeChannel | null = null;
  private supabase = createClient();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  async startTracking(userId: string) {
    if (this.channel) {
      await this.stopTracking();
    }

    // Update presence in database
    await this.updatePresence(userId, true);

    // Set up heartbeat to keep presence alive
    this.heartbeatInterval = setInterval(() => {
      this.updatePresence(userId, true);
    }, 30000); // Every 30 seconds

    // Set up channel for real-time updates
    this.channel = this.supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        // Presence sync event
      })
      .subscribe();

    // Update presence on page unload
    window.addEventListener('beforeunload', () => {
      this.updatePresence(userId, false);
    });
  }

  async stopTracking() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private async updatePresence(userId: string, isOnline: boolean) {
    try {
      await this.supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  async getUserPresence(userId: string): Promise<{ isOnline: boolean; lastSeen: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_presence')
        .select('is_online, last_seen')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return { isOnline: false, lastSeen: null };
      }

      // Consider user offline if last seen was more than 2 minutes ago
      const lastSeenDate = new Date(data.last_seen);
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const isOnline = data.is_online && lastSeenDate > twoMinutesAgo;

      return {
        isOnline,
        lastSeen: data.last_seen,
      };
    } catch (error) {
      console.error('Error fetching user presence:', error);
      return { isOnline: false, lastSeen: null };
    }
  }

  subscribeToUserPresence(userId: string, callback: (presence: { isOnline: boolean; lastSeen: string | null }) => void) {
    const channel = this.supabase
      .channel(`user-presence-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const presence = await this.getUserPresence(userId);
          callback(presence);
        }
      )
      .subscribe();

    return channel;
  }
}

export const presenceTracker = new PresenceTracker();

export function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Offline';

  try {
    const lastSeenDate = new Date(lastSeen);
    
    // Check if date is valid
    if (isNaN(lastSeenDate.getTime())) {
      return 'Offline';
    }

    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return 'Seen 1 min ago';
    if (diffMins < 60) return `Seen ${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Seen 1 hour ago';
    if (diffHours < 24) return `Seen ${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Seen 1 day ago';
    return `Seen ${diffDays} days ago`;
  } catch (error) {
    console.error('Error formatting last seen:', error);
    return 'Offline';
  }
}
