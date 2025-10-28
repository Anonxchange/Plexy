import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { notificationSounds } from '@/lib/notification-sounds';
import { useAuth } from '@/lib/auth-context';

export function GlobalNotificationListener() {
  const { user } = useAuth();
  const supabase = createClient();
  const lastProcessedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

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
          const notification = payload.new as any;
          
          if (lastProcessedIds.current.has(notification.id)) return;
          lastProcessedIds.current.add(notification.id);
          
          if (notification.type === 'trade' && notification.metadata?.messageType === 'chat') {
            notificationSounds.play('message_received');
          }
        }
      )
      .subscribe();

    const tradesChannel = supabase
      .channel('global-trades')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'p2p_trades',
        },
        (payload) => {
          const oldTrade = payload.old as any;
          const newTrade = payload.new as any;
          const tradeId = newTrade.id;

          if (!oldTrade.buyer_paid_at && newTrade.buyer_paid_at) {
            const paymentKey = `payment-${tradeId}-${newTrade.buyer_paid_at}`;
            if (!lastProcessedIds.current.has(paymentKey)) {
              lastProcessedIds.current.add(paymentKey);
              
              if (newTrade.seller_id === user.id) {
                notificationSounds.play('payment_marked');
              }
            }
          }

          if (!oldTrade.seller_released_at && newTrade.seller_released_at) {
            const releaseKey = `release-${tradeId}-${newTrade.seller_released_at}`;
            if (!lastProcessedIds.current.has(releaseKey)) {
              lastProcessedIds.current.add(releaseKey);
              
              if (newTrade.buyer_id === user.id) {
                notificationSounds.play('escrow_released');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(tradesChannel);
    };
  }, [user?.id]);

  return null;
}
