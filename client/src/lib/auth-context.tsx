import { createContext, useContext, useEffect, useState, useCallback } from "react";
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
        .update({ 
          is_current: true, 
          last_active: new Date().toISOString() 
        })
        .eq('id', deviceId);
    } else {
      await supabase.from('user_devices').update({ is_current: false }).eq('user_id', userId);

      const { error } = await supabase.from('user_devices').insert({
        user_id: userId,
        device_name: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ip_address: ipAddress,
        user_agent: deviceInfo.userAgent,
        is_current: true,
        last_active: new Date().toISOString(),
      });

      if (error) {
        console.error('Error tracking device:', error);
      }
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
  const supabase = createClient();

  useEffect(() => {
    if (window.location.pathname === '/verify-email') {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Check if login is in progress - skip validation during login flow
        const isLoginInProgress = localStorage.getItem('session_login_in_progress') === 'true';
        
        if (isLoginInProgress) {
          // During login, don't validate session token - it's being created
          setSession(session);
          setUser(session.user);
          setLoading(false);
          return;
        }
        
        // Validate session token exists and is valid
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
              // Session token doesn't exist - user was logged out elsewhere
              localStorage.removeItem('session_token');
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }

            // Update last_active timestamp on valid session (refresh case)
            // This keeps the session alive without generating a new token
            await supabase
              .from('active_sessions')
              .update({ last_active: new Date().toISOString() })
              .eq('session_token', sessionToken)
              .eq('user_id', session.user.id);

          } catch (err) {
            console.error('Error validating session:', err);
          }
        } else {
          // No session token and not logging in - sign out
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      }
    });

    return () => {
      subscription.unsubscribe();
      presenceTracker.stopTracking();
    };
  }, [pendingOTPVerification]);

  // Supabase handles session refresh automatically

  useEffect(() => {
    const handleBeforeUnload = () => {
      const stayLoggedIn = localStorage.getItem('stayLoggedIn');
      if (!stayLoggedIn && user) {
        navigator.sendBeacon('/api/logout');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const signUp = async (email: string, password: string) => {
    const baseUrl = window.location.hostname.includes('pexly.app') 
      ? 'https://pexly.app' 
      : window.location.origin;
    const redirectUrl = `${baseUrl}/verify-email`;

    console.log("Signup redirect URL:", redirectUrl);

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // CRITICAL: Set these flags BEFORE signInWithPassword so the SessionInvalidationListener
    // won't subscribe to old token deletions when auth.user becomes available
    localStorage.removeItem('session_token');
    localStorage.setItem('session_login_in_progress', 'true');
    
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Clear the flag on error
      localStorage.removeItem('session_login_in_progress');
      return { error, data };
    }

    if (data.user && data.session) {
      await trackDevice(supabase, data.user.id);
      
      // Create new session and invalidate all others (single-session enforcement)
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

        // Clear the login in progress flag
        localStorage.removeItem('session_login_in_progress');

        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData.session_token) {
            // Set the new token - the listener will automatically re-subscribe
            localStorage.setItem('session_token', sessionData.session_token);
          }
        } else {
          // If session creation fails, sign out
          await supabase.auth.signOut();
          return { error: { message: 'Failed to create session' }, data: null };
        }
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
    if (!pendingOTPVerification || !pendingSession) {
      return;
    }

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
    // Set flag BEFORE deleting to prevent listener from triggering
    localStorage.setItem('manual_logout', 'true');
    
    // Clean up session token
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken && user) {
      try {
        // Delete the session from database - this will trigger DELETE event
        await supabase
          .from('active_sessions')
          .delete()
          .eq('session_token', sessionToken);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
    
    // Remove session token
    localStorage.removeItem('session_token');
    
    // Sign out from Supabase auth
    await supabase.auth.signOut();
    
    // Clean up the flag after auth state settles
    setTimeout(() => {
      localStorage.removeItem('manual_logout');
    }, 2000);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      completeOTPVerification,
      cancelOTPVerification,
      loading,
      pendingOTPVerification,
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
