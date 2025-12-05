import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { sessionSecurity, LoginNotification } from '@/lib/security/session-security';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Smartphone, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export function SessionInvalidationListener() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const hasShownNotificationRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      hasShownNotificationRef.current.clear();
      return;
    }

    sessionSecurity.startSessionValidation(user.id, async (reason) => {
      if (reason === 'invalidated') {
        toast({
          title: 'Session Ended',
          description: 'Your session was ended because you logged in from another device.',
          variant: 'destructive',
        });
        await signOut();
        setLocation('/signin?reason=session_ended');
      } else if (reason === 'expired') {
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        await signOut();
        setLocation('/signin?reason=session_expired');
      }
    });

    unsubscribeRef.current = sessionSecurity.subscribeToSessionInvalidation(
      user.id,
      (notification: LoginNotification) => {
        if (hasShownNotificationRef.current.has(notification.id)) {
          return;
        }
        hasShownNotificationRef.current.add(notification.id);

        const currentDeviceFingerprint = localStorage.getItem('device_fingerprint');

        if (notification.notification_type === 'session_invalidated') {
          // Only show session invalidation notification if this is NOT the device that triggered it
          // The notification contains info about the NEW device that logged in
          // We should only show this on OLD devices being kicked out
          const { data: currentSession } = await supabase
            .from('active_sessions')
            .select('device_fingerprint')
            .eq('user_id', user.id)
            .eq('device_fingerprint', currentDeviceFingerprint)
            .single();

          // If we don't have an active session, we're being logged out
          if (!currentSession) {
            toast({
              title: 'Session Ended',
              description: notification.message || 'Your session was ended because you logged in from another device.',
              variant: 'destructive',
            });

            setTimeout(async () => {
              await signOut();
              setLocation('/signin?reason=session_ended');
            }, 2000);
          }
        } else if (notification.notification_type === 'new_login') {
          // Only show new login notification if this is NOT the device that just logged in
          const isCurrentDevice = currentDeviceFingerprint && 
            notification.metadata?.device_fingerprint === currentDeviceFingerprint;
          
          if (!isCurrentDevice) {
            toast({
              title: 'New Login Detected',
              description: `Your account was logged into from ${notification.device_name} (${notification.browser} on ${notification.os})`,
            });
          }
        }
      }
    );

    return () => {
      sessionSecurity.stopSessionValidation();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, signOut, setLocation]);

  return null;
}

export function LoginNotificationBanner({
  notification,
  onDismiss,
}: {
  notification: LoginNotification;
  onDismiss: () => void;
}) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
        {notification.notification_type === 'session_invalidated' ? (
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        ) : (
          <Smartphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-orange-800 dark:text-orange-200">
          {notification.notification_type === 'new_login'
            ? 'New Login Detected'
            : notification.notification_type === 'session_invalidated'
            ? 'Session Ended Elsewhere'
            : 'New Device Added'}
        </h4>
        <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
          {notification.message || `${notification.device_name} (${notification.browser} on ${notification.os})`}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <span className="text-xs text-orange-600 dark:text-orange-400">
            {notification.ip_address} - {formatTime(notification.login_at)}
          </span>
          <button
            onClick={onDismiss}
            className="text-xs font-medium text-orange-700 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
