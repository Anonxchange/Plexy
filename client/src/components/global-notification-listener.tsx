import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { notificationSounds } from '@/lib/notification-sounds';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

export function GlobalNotificationListener() {
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const lastProcessedIds = useRef<Set<string>>(new Set());
  const hasPlayedLoginSound = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    // Check for unread notifications on mount (when user logs in or refreshes)
    const checkUnreadNotifications = async () => {
      if (hasPlayedLoginSound.current) return;
      
      const { data: unreadNotifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false)
        .limit(1);

      if (unreadNotifications && unreadNotifications.length > 0) {
        // Sound removed as per user request
        hasPlayedLoginSound.current = true;
      }
    };

    checkUnreadNotifications();

    // Periodic check for unread notifications (every 5 minutes)
    const unreadCheckInterval = setInterval(async () => {
      const { data: unreadNotifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false)
        .limit(1);

      if (unreadNotifications && unreadNotifications.length > 0) {
        // Sound removed as per user request
      }
    }, 5 * 60 * 1000); // 5 minutes

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

    const announcementsChannel = supabase
      .channel('global-announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_posts',
          filter: 'category=eq.Announcement'
        },
        (payload) => {
          const announcement = payload.new as any;
          const announcementKey = `announcement-${announcement.id}`;
          
          if (!lastProcessedIds.current.has(announcementKey)) {
            lastProcessedIds.current.add(announcementKey);
            notificationSounds.play('message_received');
            
            toast({
              title: "New Announcement",
              description: announcement.title,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(unreadCheckInterval);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(announcementsChannel);
    };
  }, [user?.id, toast]);

  return null;
}
