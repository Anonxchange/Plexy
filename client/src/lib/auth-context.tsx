import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "./supabase";
import { presenceTracker } from './presence';
import { sessionSecurity } from './security/session-security';

interface PendingAuth {
  userId: string;
  email: string;
  deviceInfo: {
    deviceName: string;
    browser: string;
    os: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ 
    error: any; 
    data: any;
    requiresOTP?: boolean;
    pendingAuth?: PendingAuth;
  }>;
  signOut: () => Promise<void>;
  completeOTPVerification: () => Promise<void>;
  cancelOTPVerification: () => Promise<void>;
  loading: boolean;
  pendingOTPVerification: PendingAuth | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceName = 'Desktop';

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  }

  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    deviceName = 'Mobile';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    deviceName = ua.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  return { browser, os, deviceName, userAgent: ua };
}

async function trackDevice(supabase: any, userId: string) {
  try {
    const deviceInfo = getDeviceInfo();

    let ipAddress = 'Unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (ipError) {
      console.error('Error fetching IP:', ipError);
    }

    const { data: existingDevices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('user_agent', deviceInfo.userAgent)
      .eq('ip_address', ipAddress);

    if (existingDevices && existingDevices.length > 0) {
      const deviceId = existingDevices[0].id;
      await supabase.from('user_devices').update({ is_current: false }).eq('user_id', userId);
      await supabase.from('user_devices')
        .update({ is_current: true, last_active: new Date().toISOString() })
        .eq('id', deviceId);
    } else {
      await supabase.from('user_devices').update({ is_current: false }).eq('user_id', userId);
      await supabase.from('user_devices').insert({
        user_id: userId,
        device_name: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ip_address: ipAddress,
        user_agent: deviceInfo.userAgent,
        is_current: true,
        last_active: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in trackDevice:', error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOTPVerification, setPendingOTPVerification] = useState<PendingAuth | null>(null);
  const [pendingSession, setPendingSession] = useState<{ user: User; session: Session } | null>(null);
  // Track the current session token in state to trigger re-subscription
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(null);
  const supabase = createClient();
  const sessionChannelRef = useRef<any>(null);
  // Track when this device created the session (to ignore self-triggered deletions)
  const sessionCreatedAtRef = useRef<number | null>(null);

  // Real-time session invalidation listener - RE-SUBSCRIBES when token changes
  useEffect(() => {
    const isLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
    const isManualLogout = localStorage.getItem('manual_logout') === 'true';
    
    // Don't subscribe during login flow or manual logout
    if (!currentSessionToken || !user || isLoginInProgress || isManualLogout) {
      // Clean up any existing channel
      if (sessionChannelRef.current) {
        supabase.removeChannel(sessionChannelRef.current);
        sessionChannelRef.current = null;
      }
      return;
    }

    // Clean up existing channel before creating new one
    if (sessionChannelRef.current) {
      supabase.removeChannel(sessionChannelRef.current);
      sessionChannelRef.current = null;
    }

    console.log(`[SessionListener] Subscribing to token: ${currentSessionToken.substring(0, 8)}...`);

    const channel = supabase
      .channel(`session-invalidation-${user.id}-${currentSessionToken}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Check flags FIRST
          const nowManualLogout = localStorage.getItem('manual_logout') === 'true';
          const nowLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
          
          if (nowManualLogout || nowLoginInProgress) {
            console.log('[SessionListener] Ignoring DELETE - manual logout or login in progress');
            return;
          }

          // Check if this device just created its session (grace period)
          if (sessionCreatedAtRef.current && Date.now() - sessionCreatedAtRef.current < 5000) {
            console.log('[SessionListener] Ignoring DELETE - within grace period after session creation');
            return;
          }

          // Verify our specific session was deleted by checking if it still exists
          const nowCurrentToken = localStorage.getItem('session_token');
          
          if (!nowCurrentToken || nowCurrentToken !== currentSessionToken) {
            console.log('[SessionListener] Token mismatch, ignoring');
            return;
          }

          // Check if OUR session still exists
          const { data: sessionExists } = await supabase
            .from('active_sessions')
            .select('id')
            .eq('session_token', nowCurrentToken)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!sessionExists) {
            console.log('[SessionListener] Session was invalidated from another device');
            localStorage.removeItem('session_token');
            setCurrentSessionToken(null);
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          }
        }
      )
      .subscribe();

    sessionChannelRef.current = channel;

    return () => {
      if (sessionChannelRef.current) {
        supabase.removeChannel(sessionChannelRef.current);
        sessionChannelRef.current = null;
      }
    };
  }, [user?.id, currentSessionToken, supabase]);

  useEffect(() => {
    if (window.location.pathname === '/verify-email') {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const isLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
        
        if (isLoginInProgress) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          return;
        }
        
        const sessionToken = localStorage.getItem('session_token');
        
        if (sessionToken) {
          try {
            const { data: sessionData } = await supabase
              .from('active_sessions')
              .select('*')
              .eq('session_token', sessionToken)
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!sessionData) {
              localStorage.removeItem('session_token');
              setCurrentSessionToken(null);
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }

            await supabase
              .from('active_sessions')
              .update({ last_active: new Date().toISOString() })
              .eq('session_token', sessionToken)
              .eq('user_id', session.user.id);

            // Set token state AFTER validation passes
            setCurrentSessionToken(sessionToken);

          } catch (err) {
            console.error('Error validating session:', err);
          }
        } else {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        await trackDevice(supabase, session.user.id);
        presenceTracker.startTracking(session.user.id);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (window.location.pathname === '/verify-email') {
        setSession(null);
        setUser(null);
        return;
      }

      if (!pendingOTPVerification) {
        setSession(session);
        setUser(session?.user ?? null);
      }

      if (session?.user) {
        presenceTracker.startTracking(session.user.id);
      } else {
        presenceTracker.stopTracking();
        setCurrentSessionToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      presenceTracker.stopTracking();
    };
  }, [pendingOTPVerification]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const stayLoggedIn = localStorage.getItem('stayLoggedIn');
      if (!stayLoggedIn && user) {
        navigator.sendBeacon('/api/logout');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  const signUp = async (email: string, password: string) => {
    const baseUrl = window.location.hostname.includes('pexly.app') 
      ? 'https://pexly.app' 
      : window.location.origin;
    const redirectUrl = `${baseUrl}/verify-email`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // CRITICAL: Clear old token and set flags BEFORE auth
    localStorage.removeItem('session_token');
    setCurrentSessionToken(null); // Clear state too!
    localStorage.setItem('session_login_in_progress', 'true');
    
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      localStorage.removeItem('session_login_in_progress');
      return { error, data };
    }

    if (data.user && data.session) {
      await trackDevice(supabase, data.user.id);
      
      try {
        const deviceInfo = getDeviceInfo();
        let ipAddress = 'Unknown';
        
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip;
        } catch (ipError) {
          console.error('Error fetching IP:', ipError);
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            device_fingerprint: navigator.userAgent,
            device_info: {
              device_name: deviceInfo.deviceName,
              browser: deviceInfo.browser,
              os: deviceInfo.os,
              ip_address: ipAddress,
            },
          }),
        });

        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData.session_token) {
            // Mark when THIS device created its session
            sessionCreatedAtRef.current = Date.now();
            // Store token
            localStorage.setItem('session_token', sessionData.session_token);
            // Update state - this triggers re-subscription to NEW token
            setCurrentSessionToken(sessionData.session_token);
          }
        } else {
          await supabase.auth.signOut();
          localStorage.removeItem('session_login_in_progress');
          return { error: { message: 'Failed to create session' }, data: null };
        }
        
        // Clear flag AFTER token is set
        localStorage.removeItem('session_login_in_progress');
        
      } catch (err) {
        console.error('Error creating session:', err);
        localStorage.removeItem('session_login_in_progress');
        await supabase.auth.signOut();
        return { error: { message: 'Failed to create session' }, data: null };
      }
    }

    return { error, data };
  };

  const completeOTPVerification = useCallback(async () => {
    if (!pendingOTPVerification || !pendingSession) return;
    const { user: pendingUser } = pendingSession;
    await trackDevice(supabase, pendingUser.id);
    setPendingOTPVerification(null);
    setPendingSession(null);
    presenceTracker.startTracking(pendingUser.id);
  }, [pendingOTPVerification, pendingSession, supabase]);

  const cancelOTPVerification = useCallback(async () => {
    setPendingOTPVerification(null);
    setPendingSession(null);
  }, []);

  const signOut = async () => {
    localStorage.setItem('manual_logout', 'true');
    
    // Clean up realtime channel FIRST
    if (sessionChannelRef.current) {
      supabase.removeChannel(sessionChannelRef.current);
      sessionChannelRef.current = null;
    }
    
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken && user) {
      try {
        await supabase
          .from('active_sessions')
          .delete()
          .eq('session_token', sessionToken);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
    
    localStorage.removeItem('session_token');
    setCurrentSessionToken(null);
    await supabase.auth.signOut();
    
    setTimeout(() => localStorage.removeItem('manual_logout'), 2000);
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, signUp, signIn, signOut, 
      completeOTPVerification, cancelOTPVerification,
      loading, pendingOTPVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
