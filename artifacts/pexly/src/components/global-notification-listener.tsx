import { useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { notificationSounds } from '@/lib/notification-sounds';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// CROSS-DEVICE NOTIFICATION ALERT DEDUP
// ----------------------------------------------------------------------------
// Source of truth: `notifications.alerted_at` (TIMESTAMPTZ) in Supabase.
//
// Race-free flow:
//   1) Realtime INSERT arrives on any device.
//   2) Device tries to "claim" the alert with a conditional UPDATE:
//        UPDATE notifications SET alerted_at = NOW()
//        WHERE id = $1 AND alerted_at IS NULL
//        RETURNING id
//      Postgres guarantees only ONE concurrent updater wins (returns a row).
//   3) The winner plays the sound + shows the toast.
//      Losers (no row returned) stay silent.
//   4) Other devices also receive a realtime UPDATE event and treat the
//      notification as already-alerted going forward.
//
// Backlog handling (offline → online catch-up):
//   On mount we fetch any notifications still alerted_at IS NULL and process
//   them through the same claim path. Whichever device comes online first
//   alerts the user once; later devices see them already claimed and stay
//   silent.
//
// Local cache (defense-in-depth):
//   We also keep an in-memory Set of IDs we've already processed this session
//   to avoid double-handling within a single tab (e.g. INSERT + UPDATE arriving
//   close together).
// ============================================================================

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title?: string | null;
  message?: string | null;
  read?: boolean | null;
  alerted_at?: string | null;
  created_at?: string | null;
}

export function GlobalNotificationListener() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Per-session in-memory dedup so the same id never gets processed twice
  // even if INSERT and a quick UPDATE both fire.
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    seenIdsRef.current = new Set();
    let cleanupFn: (() => void) | undefined;
    let cancelled = false;

    /**
     * Atomically claim the right to alert for a notification.
     * Returns true only if THIS call won the race (alerted_at was NULL and
     * we just set it). Returns false if another device already alerted, the
     * row doesn't exist, or anything went wrong.
     */
    const claimAlert = async (notificationId: string): Promise<boolean> => {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from('notifications')
          .update({ alerted_at: new Date().toISOString() })
          .eq('id', notificationId)
          .is('alerted_at', null)
          .select('id')
          .maybeSingle();
        if (error) return false;
        return !!data;
      } catch {
        return false;
      }
    };

    const fireAlert = (n: NotificationRow) => {
      notificationSounds.play('message_received');
      if (n.type === 'payment') {
        toast({
          title: n.title ?? 'Coins Received',
          description: n.message ?? 'Your wallet has been credited.',
          duration: 6000,
        });
      }
    };

    const handleNotification = async (n: NotificationRow) => {
      // Local dedup: never process the same id twice within this tab
      if (seenIdsRef.current.has(n.id)) return;
      seenIdsRef.current.add(n.id);

      // Server-side claimed already → silent
      if (n.alerted_at) return;

      // Race-free server claim
      const won = await claimAlert(n.id);
      if (won) fireAlert(n);
    };

    getSupabase().then(async (supabase) => {
      if (cancelled) return;

      // ── 1) Catch up on any backlog the user missed while offline ─────────
      try {
        const { data: backlog } = await supabase
          .from('notifications')
          .select('id, user_id, type, title, message, read, alerted_at, created_at')
          .eq('user_id', user.id)
          .is('alerted_at', null)
          .order('created_at', { ascending: true })
          .limit(50);
        if (backlog && !cancelled) {
          for (const n of backlog as NotificationRow[]) {
            await handleNotification(n);
          }
        }
      } catch {
        // Non-critical — realtime will still cover live events
      }

      if (cancelled) return;

      // ── 2) Realtime: live INSERT events ──────────────────────────────────
      const notificationsChannel = supabase
        .channel('global-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            void handleNotification(payload.new as NotificationRow);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Another device claimed the alert — record it so we never
            // accidentally re-fire if INSERT arrives later in this tab.
            const n = payload.new as NotificationRow;
            if (n.alerted_at) seenIdsRef.current.add(n.id);
          }
        )
        .subscribe();

      // ── 3) Announcements (no per-user state — keep simple session dedup) ─
      const announcementsChannel = supabase
        .channel('global-announcements')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'blog_posts',
            filter: 'category=eq.Announcement',
          },
          (payload) => {
            const a = payload.new as { id: string; title?: string };
            const key = `announcement-${a.id}`;
            if (seenIdsRef.current.has(key)) return;
            seenIdsRef.current.add(key);

            notificationSounds.play('message_received');
            toast({
              title: 'New Announcement',
              description: a.title,
              duration: 5000,
            });
          }
        )
        .subscribe();

      cleanupFn = () => {
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(announcementsChannel);
      };
    });

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, [user?.id, toast]);

  return null;
}
