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
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
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
