import { useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { notificationSounds } from '@/lib/notification-sounds';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

export function GlobalNotificationListener() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lastProcessedIds = useRef<Set<string>>(new Set());
  const hasPlayedLoginSound = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    // Supabase is loaded lazily — by the time the user is authenticated the
    // vendor-db chunk will already have been fetched by auth-context.
    let cleanupFn: (() => void) | undefined;

    getSupabase().then((supabase) => {
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
            
            if (notification.type === 'system' || notification.type === 'account_change') {
              notificationSounds.play('message_received');
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

      cleanupFn = () => {
        clearInterval(unreadCheckInterval);
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(announcementsChannel);
      };
    });

    return () => {
      cleanupFn?.();
    };
  }, [user?.id, toast]);

  return null;
}
