import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Smartphone, AlertTriangle } from 'lucide-react';

const supabase = createClient();

export interface LoginNotification {
  id: string;
  user_id: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  login_at: string;
  is_read: boolean;
  notification_type: 'new_login' | 'session_invalidated' | 'new_device';
  message?: string;
  metadata?: {
    device_fingerprint?: string;
  };
}

export function SessionInvalidationListener(): null {
  const auth = useAuth();
  const [, setLocation] = useLocation();
  const isLoggingOutRef = useRef(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    
    isLoggingOutRef.current = true;
    
    toast({
      title: 'Logged Out',
      description: 'You were logged in from another device/browser.',
      variant: 'destructive',
    });
    
    await supabase.auth.signOut();
    setLocation('/signin?reason=logged_out_elsewhere');
  }, [setLocation]);

  // Initialize session token once login is complete
  useEffect(() => {
    if (!auth?.user?.id) {
      isLoggingOutRef.current = false;
      setSessionToken(null);
      return;
    }

    // Poll for session token until login flow completes
    const checkInterval = setInterval(() => {
      const isLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
      if (isLoginInProgress) {
        return; // Keep waiting
      }
      
      const token = localStorage.getItem('session_token');
      if (token && token !== sessionToken) {
        setSessionToken(token);
        clearInterval(checkInterval);
      } else if (!token && sessionToken) {
        setSessionToken(null);
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [auth?.user?.id, sessionToken]);

  // Listen for session deletions
  useEffect(() => {
    if (!auth?.user?.id || !sessionToken) {
      return;
    }

    const channelName = `session-invalidation-${auth.user.id}-${sessionToken.slice(-8)}`;
    
    const sessionChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${auth.user.id}`,
        },
        async (payload) => {
          // REPLICA IDENTITY FULL ensures payload.old has full row data
          if (!payload.old?.session_token) {
            return;
          }
          
          const currentToken = localStorage.getItem('session_token');
          
          // Ignore if deleted token is NOT our current token
          if (payload.old.session_token !== currentToken) {
            return;
          }
          
          // Ignore during manual logout
          if (localStorage.getItem('manual_logout') === 'true') {
            isLoggingOutRef.current = true;
            return;
          }
          
          // Ignore during login flow
          if (localStorage.getItem('session_login_in_progress') === 'true') {
            return;
          }
          
          // Ignore deletions within 5 seconds of session creation (race condition protection)
          const createdAt = parseInt(localStorage.getItem('session_created_at') || '0', 10);
          if (Date.now() - createdAt < 5000) {
            return;
          }

          // Verify session no longer exists in database
          try {
            const { data: sessionExists } = await supabase
              .from('active_sessions')
              .select('session_token')
              .eq('session_token', currentToken)
              .eq('user_id', auth.user.id)
              .maybeSingle();

            if (sessionExists) {
              return; // Session still exists, false alarm
            }
          } catch (err) {
            console.error('Error verifying session deletion:', err);
          }

          // Legitimate forced logout from another device
          await handleLogout();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [auth?.user?.id, sessionToken, handleLogout]);

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
