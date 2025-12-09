import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "./supabase";
import { presenceTracker } from './presence';

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
  signUp: (email: string, password: string, captchaToken?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ 
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

  const signUp = async (email: string, password: string, captchaToken?: string) => {
    const baseUrl = window.location.hostname.includes('pexly.app') 
      ? 'https://pexly.app' 
      : window.location.origin;
    const redirectUrl = `${baseUrl}/verify-email`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: redirectUrl,
        captchaToken,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: { captchaToken },
    });

    if (error) {
      return { error, data };
    }

    if (data.user && data.session) {
      await trackDevice(supabase, data.user.id);
      presenceTracker.startTracking(data.user.id);
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
    presenceTracker.stopTracking();
    await supabase.auth.signOut();
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
