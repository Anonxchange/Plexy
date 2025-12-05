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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        trackDevice(supabase, session.user.id);
        presenceTracker.startTracking(session.user.id);
      }
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

  useEffect(() => {
    if (!user) return;

    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        await sessionSecurity.endSession(user.id);
        await supabase.auth.signOut();
        window.location.href = '/signin?reason=timeout';
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      clearTimeout(inactivityTimer);
    };
  }, [user]);

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
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error, data };
    }

    if (data.user && data.session) {
      const deviceInfo = getDeviceInfo();
      
      const otpCheck = await sessionSecurity.checkDeviceAndGenerateOTP(
        data.user.id,
        data.user.email || email
      );

      if (otpCheck.requiresOTP) {
        setPendingSession({ user: data.user, session: data.session });
        setPendingOTPVerification({
          userId: data.user.id,
          email: data.user.email || email,
          deviceInfo: {
            deviceName: deviceInfo.deviceName,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
          },
        });

        await supabase.auth.signOut();
        setUser(null);
        setSession(null);

        return { 
          error: null, 
          data,
          requiresOTP: true,
          pendingAuth: {
            userId: data.user.id,
            email: data.user.email || email,
            deviceInfo: {
              deviceName: deviceInfo.deviceName,
              browser: deviceInfo.browser,
              os: deviceInfo.os,
            },
          },
        };
      }

      await sessionSecurity.createSession(data.user.id);
      await trackDevice(supabase, data.user.id);
    }

    return { error, data };
  };

  const completeOTPVerification = useCallback(async () => {
    if (!pendingOTPVerification || !pendingSession) {
      return;
    }

    const { user: pendingUser, session: pendingSessionData } = pendingSession;

    await sessionSecurity.createSession(pendingUser.id);
    await trackDevice(supabase, pendingUser.id);

    setUser(pendingUser);
    setSession(pendingSessionData);
    
    setPendingOTPVerification(null);
    setPendingSession(null);

    presenceTracker.startTracking(pendingUser.id);
  }, [pendingOTPVerification, pendingSession, supabase]);

  const cancelOTPVerification = useCallback(async () => {
    setPendingOTPVerification(null);
    setPendingSession(null);
  }, []);

  const signOut = async () => {
    if (user) {
      await sessionSecurity.endSession(user.id);
    }
    await supabase.auth.signOut();
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
