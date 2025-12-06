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
    
    toast({
      title: 'Logged Out',
      description: 'You were logged in from another device/browser.',
      variant: 'destructive',
    });
    
    // Don't remove session_token here - let auth-context handle it
    await supabase.auth.signOut();
    setLocation('/signin?reason=logged_out_elsewhere');
  }, [setLocation]);

  // Store current session token in ref to avoid race conditions
  const currentSessionTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!auth?.user?.id) {
      isLoggingOutRef.current = false;
      setSessionToken(null);
      sessionTokenRef.current = null;
      return;
    }

    // Poll for session token until it's available (during login flow)
    // This ensures we don't subscribe to stale/missing tokens
    const checkInterval = setInterval(() => {
      const isLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
      if (isLoginInProgress) {
        return; // Keep waiting
      }
      
      const token = localStorage.getItem('session_token');
      if (token && token !== sessionTokenRef.current) {
        // New stable token found - update state and ref
        setSessionToken(token);
        sessionTokenRef.current = token;
        currentSessionTokenRef.current = token;
        clearInterval(checkInterval);
      } else if (!token && sessionTokenRef.current) {
        // Token was removed - clear state
        setSessionToken(null);
        sessionTokenRef.current = null;
        currentSessionTokenRef.current = null;
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [auth?.user?.id]);

  useEffect(() => {
    if (!auth?.user?.id || !sessionToken) {
      return;
    }

    // Use user_id for channel name - filter handles session isolation
    const channelName = `session-invalidation-${auth.user.id}`;
    
    const sessionChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${auth.user.id},session_token=eq.${sessionToken}`,
        },
        async (payload) => {
          // Safety check: if payload is missing session_token, ignore it
          // This prevents false logouts from bulk deletes or cascading operations
          if (!payload.old || !payload.old.session_token) {
            return;
          }

          // Use ref for most current token to prevent race conditions
          const activeToken = currentSessionTokenRef.current;
          
          // Verify the deleted session matches our current session token
          if (payload.old.session_token !== activeToken) {
            return;
          }
          
          // Triple-check with localStorage as final validation
          const storageToken = localStorage.getItem('session_token');
          if (storageToken !== activeToken) {
            return;
          }

          // Check if this is a manual logout initiated by this device
          const isManualLogout = localStorage.getItem('manual_logout') === 'true';
          if (isManualLogout) {
            isLoggingOutRef.current = true;
            return;
          }

          // Check if login is in progress (shouldn't happen with new flow, but safeguard)
          const isLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
          if (isLoginInProgress) {
            return;
          }

          // This is a forced logout from another device or admin action
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
