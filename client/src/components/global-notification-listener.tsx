import { useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { notificationSounds } from '@/lib/notification-sounds';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { sendCoinReceivedNotification } from '@/lib/notifications-api';
import { useWalletBalances, type Wallet } from '@/hooks/use-wallet-balances';

// Minimum increase treated as a real deposit (avoids floating-point noise)
const MIN_INCREASE_THRESHOLD = 0.000001;

export function GlobalNotificationListener() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lastProcessedIds = useRef<Set<string>>(new Set());
  const hasPlayedLoginSound = useRef(false);

  // ── Non-custodial deposit detection via balance polling ────────────────────
  // useWalletBalances already polls the monitor-deposits edge function every
  // 60 s. We piggyback on its React Query cache — no extra network calls.
  const { data: wallets } = useWalletBalances();
  const prevBalancesRef = useRef<Map<string, number>>(new Map());  // key: wallet.id
  const balanceBaselineSet = useRef(false);

  // Reset baseline when the user changes (login / logout)
  useEffect(() => {
    prevBalancesRef.current.clear();
    balanceBaselineSet.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!wallets || wallets.length === 0 || !user?.id) return;

    if (!balanceBaselineSet.current) {
      // First load — record current balances as baseline so we don't fire
      // notifications for coins the user already held before opening the app.
      wallets.forEach((w: Wallet) => prevBalancesRef.current.set(w.id, w.balance));
      balanceBaselineSet.current = true;
      return;
    }

    // Subsequent polls — compare each wallet's balance against the baseline
    wallets.forEach((w: Wallet) => {
      const prev = prevBalancesRef.current.get(w.id) ?? 0;
      const increase = w.balance - prev;

      if (increase > MIN_INCREASE_THRESHOLD) {
        // Deduplicate: key by wallet ID + rounded increase to avoid double-fire
        // on back-to-back renders with the same data
        const dedupeKey = `deposit-${w.id}-${increase.toFixed(8)}`;
        if (!lastProcessedIds.current.has(dedupeKey)) {
          lastProcessedIds.current.add(dedupeKey);
          sendCoinReceivedNotification(user.id, {
            id: dedupeKey,
            crypto_symbol: w.crypto_symbol,
            amount: increase,
            type: 'deposit',
            tx_hash: null,
            from_address: null,
          });
        }
      }

      // Always advance the baseline to the latest known balance
      prevBalancesRef.current.set(w.id, w.balance);
    });
  }, [wallets, user?.id]);

  // ── Supabase Realtime: notifications + announcements ──────────────────────
  useEffect(() => {
    if (!user?.id) return;

    let cleanupFn: (() => void) | undefined;

    getSupabase().then((supabase) => {
      // On mount: silent check for unread notifications
      const checkUnread = async () => {
        if (hasPlayedLoginSound.current) return;
        const { data } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('read', false)
          .limit(1);
        if (data && data.length > 0) {
          hasPlayedLoginSound.current = true;
        }
      };
      checkUnread();

      const unreadCheckInterval = setInterval(async () => {
        await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('read', false)
          .limit(1);
      }, 5 * 60 * 1000);

      // notifications table — show toast on INSERT
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
            const n = payload.new as {
              id: string;
              type: string;
              title?: string;
              message?: string;
            };

            if (lastProcessedIds.current.has(n.id)) return;
            lastProcessedIds.current.add(n.id);

            notificationSounds.play('message_received');

            if (n.type === 'payment') {
              toast({
                title: n.title ?? 'Coins Received',
                description: n.message ?? 'Your wallet has been credited.',
                duration: 6000,
              });
            }
          }
        )
        .subscribe();

      // blog_posts — toast for new announcements
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
            if (lastProcessedIds.current.has(key)) return;
            lastProcessedIds.current.add(key);

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
        clearInterval(unreadCheckInterval);
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(announcementsChannel);
      };
    });

    return () => cleanupFn?.();
  }, [user?.id, toast]);

  return null;
}
