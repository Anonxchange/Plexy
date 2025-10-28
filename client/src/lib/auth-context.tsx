import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // If on verify-email page, don't try to restore any session
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
      
      // Track device on session restore
      if (session?.user) {
        trackDevice(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't set session if we're on the verify-email page
      if (window.location.pathname === '/verify-email') {
        setSession(null);
        setUser(null);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Separate effect for inactivity timer
  useEffect(() => {
    if (!user) return;

    // Inactivity timeout (30 minutes)
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/signin?reason=timeout';
      }, INACTIVITY_TIMEOUT);
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Start inactivity timer
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      clearTimeout(inactivityTimer);
    };
  }, [user]);

  // Separate effect for browser close detection
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Check if user wants to stay logged in
      const stayLoggedIn = localStorage.getItem('stayLoggedIn');
      if (!stayLoggedIn && user) {
        // Use sendBeacon for reliability on page unload
        navigator.sendBeacon('/api/logout');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const signUp = async (email: string, password: string) => {
    // Use custom domain if available, otherwise fall back to current origin
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

  const trackDevice = async (userId: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      
      // Fetch IP address
      let ipAddress = 'Unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.error('Error fetching IP:', ipError);
      }
      
      // Check if this device already exists (match by user_agent and ip_address)
      const { data: existingDevices } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('user_agent', deviceInfo.userAgent)
        .eq('ip_address', ipAddress);

      if (existingDevices && existingDevices.length > 0) {
        // Update existing device
        const deviceId = existingDevices[0].id;
        
        // Mark all other devices as not current
        await supabase.from('user_devices').update({ is_current: false }).eq('user_id', userId);
        
        // Update this device
        await supabase.from('user_devices')
          .update({ 
            is_current: true, 
            last_active: new Date().toISOString() 
          })
          .eq('id', deviceId);
      } else {
        // New device - mark all others as not current and insert new one
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
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      await trackDevice(data.user.id);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
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
