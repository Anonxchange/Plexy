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
  const sessionTokenRef = useRef<string | null>(null);

  const handleLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    
    isLoggingOutRef.current = true;
    localStorage.removeItem('session_token');
    
    toast({
      title: 'Logged Out',
      description: 'You were logged in from another device/browser.',
      variant: 'destructive',
    });
    
    await supabase.auth.signOut();
    setLocation('/signin?reason=logged_out_elsewhere');
  }, [setLocation]);

  useEffect(() => {
    if (!auth?.user?.id) {
      isLoggingOutRef.current = false;
      setSessionToken(null);
      sessionTokenRef.current = null;
      return;
    }

    const checkSessionToken = () => {
      const token = localStorage.getItem('session_token');
      const isLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
      
      if (isLoginInProgress) {
        return null;
      }
      
      return token;
    };

    const initialToken = checkSessionToken();
    setSessionToken(initialToken);
    sessionTokenRef.current = initialToken;

    const intervalId = setInterval(() => {
      const currentToken = checkSessionToken();
      if (currentToken !== sessionTokenRef.current) {
        sessionTokenRef.current = currentToken;
        setSessionToken(currentToken);
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [auth?.user?.id]);

  useEffect(() => {
    if (!auth?.user?.id || !sessionToken) {
      return;
    }

    const channelName = `session-invalidation-${auth.user.id}-${sessionToken.substring(0, 8)}`;
    
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
          const currentStoredToken = localStorage.getItem('session_token');
          
          if (!currentStoredToken) {
            return;
          }

          const isManualLogout = localStorage.getItem('manual_logout') === 'true';
          if (isManualLogout) {
            isLoggingOutRef.current = true;
            localStorage.removeItem('session_token');
            localStorage.removeItem('manual_logout');
            return;
          }

          const isLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
          if (isLoginInProgress) {
            return;
          }

          const deletedToken = payload.old?.session_token;
          
          if (deletedToken && deletedToken === currentStoredToken) {
            await handleLogout();
            return;
          }
          
          if (!deletedToken) {
            try {
              const { data: sessionExists } = await supabase
                .from('active_sessions')
                .select('id')
                .eq('session_token', currentStoredToken)
                .maybeSingle();
              
              if (!sessionExists) {
                await handleLogout();
              }
            } catch (error) {
              console.error('Error checking session:', error);
            }
          }
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
