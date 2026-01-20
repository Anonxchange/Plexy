import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "./supabase";
import { presenceTracker } from './presence';
import { nonCustodialWalletManager } from "./non-custodial-wallet";

interface PendingAuth {
  userId: string;
  email: string;
  deviceInfo: {
    deviceName: string;
    browser: string;
    os: string;
  };
}

interface WalletImportState {
  required: boolean;
  expectedAddress: string | null;
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
  walletImportState: WalletImportState;
  setWalletImportState: (state: WalletImportState) => void;
  sessionPassword: string | null;
  setSessionPassword: (password: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Move supabase client outside component to prevent recreation
const supabase = createClient();

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let browserVersion = '';
  let os = 'Unknown OS';
  let osVersion = '';
  let deviceName = 'Desktop';
  let deviceModel = '';

  const hasTouchScreen = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const minDimension = Math.min(screenWidth, screenHeight);

  // Detect browser and version
  if (ua.includes('CriOS')) {
    browser = 'Chrome';
    const match = ua.match(/CriOS\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('FxiOS')) {
    browser = 'Firefox';
    const match = ua.match(/FxiOS\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('EdgiOS')) {
    browser = 'Edge';
    const match = ua.match(/EdgiOS\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('OPR') || ua.includes('Opera')) {
    browser = 'Opera';
  } else if (ua.includes('SamsungBrowser')) {
    browser = 'Samsung Internet';
    const match = ua.match(/SamsungBrowser\/(\d+)/);
    if (match) browserVersion = match[1];
  }

  // Detect OS and device
  if (ua.includes('iPhone')) {
    os = 'iOS';
    deviceName = 'iPhone';
    const match = ua.match(/iPhone OS (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  } else if (ua.includes('iPad')) {
    os = 'iPadOS';
    deviceName = 'iPad';
    const match = ua.match(/CPU OS (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  } else if (ua.includes('Android')) {
    os = 'Android';
    const match = ua.match(/Android (\d+\.?\d*)/);
    if (match) osVersion = match[1];
    
    const modelMatch = ua.match(/;\s*([^;)]+)\s*Build\//);
    if (modelMatch) {
      deviceModel = modelMatch[1].trim();
      deviceModel = deviceModel.replace(/^(SM-|LG-|SAMSUNG|Xiaomi|HUAWEI|OPPO|vivo|OnePlus|Pixel)\s*/i, '');
    }
    
    const isTablet = minDimension >= 600 || 
      (deviceModel && (
        deviceModel.toLowerCase().includes('tablet') || 
        deviceModel.toLowerCase().includes('tab') ||
        deviceModel.toLowerCase().includes('pad')
      ));
    
    deviceName = isTablet ? 'Android Tablet' : 'Android Phone';
  } else if (ua.includes('Windows Phone') || ua.includes('Windows Mobile')) {
    os = 'Windows Phone';
    deviceName = 'Windows Phone';
  } else if (ua.includes('Windows NT 10.0')) {
    os = 'Windows';
    osVersion = ua.includes('Windows NT 10.0; Win64') ? '10/11' : '10';
  } else if (ua.includes('Windows NT 6.3')) {
    os = 'Windows';
    osVersion = '8.1';
  } else if (ua.includes('Windows NT 6.1')) {
    os = 'Windows';
    osVersion = '7';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
    const isLikelyIPad = hasTouchScreen && 
      ua.includes('Safari') && 
      !ua.includes('Chrome') &&
      navigator.maxTouchPoints >= 2 &&
      (navigator.platform === 'MacIntel' || navigator.platform === 'iPad');
    
    if (isLikelyIPad && minDimension <= 1024) {
      os = 'iPadOS';
      deviceName = 'iPad';
      const match = ua.match(/Mac OS X (\d+[._]\d+)/);
      if (match) osVersion = match[1].replace('_', '.');
    } else {
      os = 'macOS';
      const match = ua.match(/Mac OS X (\d+[._]\d+)/);
      if (match) osVersion = match[1].replace('_', '.');
    }
  } else if (ua.includes('CrOS')) {
    os = 'Chrome OS';
    deviceName = 'Chromebook';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
    if (ua.includes('Ubuntu')) os = 'Ubuntu';
    
    if (hasTouchScreen && minDimension < 800) {
      os = 'Android';
      deviceName = 'Android Phone';
    }
  }

  let fullDeviceName = deviceName;
  
  if (deviceModel && deviceModel.length > 0 && deviceModel.length < 30) {
    fullDeviceName = deviceModel;
  } else if (deviceName === 'Desktop') {
    if (os === 'macOS') {
      fullDeviceName = 'Mac';
    } else if (os === 'Windows') {
      fullDeviceName = 'Windows PC';
    } else if (os === 'Linux' || os === 'Ubuntu') {
      fullDeviceName = 'Linux PC';
    } else if (os === 'Chrome OS') {
      fullDeviceName = 'Chromebook';
    }
  }

  const fullOs = osVersion ? `${os} ${osVersion}` : os;
  const fullBrowser = browserVersion ? `${browser} ${browserVersion}` : browser;

  return { 
    browser: fullBrowser, 
    os: fullOs, 
    deviceName: fullDeviceName, 
    userAgent: ua 
  };
}

async function trackDevice(userId: string) {
  try {
    const deviceInfo = getDeviceInfo();
    let ipAddress = 'Unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch {
      // IP fetch failed, proceeding with Unknown
    }

    const { data: existingDevices } = await supabase
      .from('user_devices')
      .select('id, ip_address')
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
  } catch {
    // Silent fail for tracking
  }
}

// Helper to check pending OTP from sessionStorage (avoids stale closure)
function hasPendingOTP(): boolean {
  try {
    return !!sessionStorage.getItem('pendingOTP_data');
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [pendingOTPVerification, setPendingOTPVerification] = useState<PendingAuth | null>(() => {
    try {
      const saved = sessionStorage.getItem('pendingOTP_data');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  const [pendingSession, setPendingSession] = useState<{ user: User; session: Session } | null>(() => {
    try {
      const saved = sessionStorage.getItem('pendingOTP_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [walletImportState, setWalletImportState] = useState<WalletImportState>({ 
    required: false, 
    expectedAddress: null 
  });
  
  const [sessionPassword, setSessionPasswordState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('walletPassword');
    } catch {
      return null;
    }
  });
  
  const checkedUsersRef = useRef<Set<string>>(new Set());
  const isTrackingRef = useRef<boolean>(false);
  const lastForceCheckRef = useRef<number>(0);

  // Sync OTP state to sessionStorage
  useEffect(() => {
    try {
      if (pendingOTPVerification) {
        sessionStorage.setItem('pendingOTP_data', JSON.stringify(pendingOTPVerification));
      } else {
        sessionStorage.removeItem('pendingOTP_data');
      }
      
      if (pendingSession) {
        sessionStorage.setItem('pendingOTP_session', JSON.stringify(pendingSession));
      } else {
        sessionStorage.removeItem('pendingOTP_session');
      }
    } catch { /* silent */ }
  }, [pendingOTPVerification, pendingSession]);

  const setSessionPassword = useCallback((password: string | null) => {
    setSessionPasswordState(password);
    try {
      if (password === null) {
        sessionStorage.removeItem('walletPassword');
      } else {
        sessionStorage.setItem('walletPassword', password);
      }
    } catch { /* silent */ }
  }, []);

  const checkWalletOnAuth = useCallback(async (userId: string, force: boolean = false) => {
    if (!userId) return;
    
    const storageKey = `wallet_checked_${userId}`;
    if (!force && (checkedUsersRef.current.has(userId) || sessionStorage.getItem(storageKey))) {
      return;
    }
    
    try {
      checkedUsersRef.current.add(userId);
      sessionStorage.setItem(storageKey, 'true');
      
      const persistedWallets = await nonCustodialWalletManager.loadWalletsFromSupabase(supabase, userId);
      
      if (persistedWallets.length > 0) {
        setWalletImportState({ required: false, expectedAddress: null });
        return;
      }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('id', userId)
        .maybeSingle();
        
      let walletAddress = profile?.wallet_address;

      if (!walletAddress) {
        const { data: { user } } = await supabase.auth.getUser();
        walletAddress = user?.user_metadata?.wallet_address;
      }

      if (walletAddress) {
        const hasLocal = nonCustodialWalletManager.hasLocalWallet(walletAddress, userId);
        setWalletImportState({ 
          required: !hasLocal, 
          expectedAddress: !hasLocal ? walletAddress : null 
        });
      }
    } catch {
      checkedUsersRef.current.delete(userId);
      setWalletImportState({ required: false, expectedAddress: null });
    }
  }, []);

  // Main auth effect - subscribe once with empty deps
  useEffect(() => {
    if (window.location.pathname === '/verify-email') {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (window.location.pathname === '/verify-email') {
        setSession(null);
        setUser(null);
        return;
      }

      // Handle logout/session clear
      if (event === 'SIGNED_OUT' || !currentSession) {
        setSession(null);
        setUser(null);
        setWalletImportState({ required: false, expectedAddress: null });
        checkedUsersRef.current.clear();
        isTrackingRef.current = false;
        presenceTracker.stopTracking();
        return;
      }

      // Check sessionStorage directly to avoid stale closure
      if (!hasPendingOTP()) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await trackDevice(currentSession.user.id);
          await checkWalletOnAuth(currentSession.user.id);
        }
      }

      if (currentSession.user && !isTrackingRef.current) {
        isTrackingRef.current = true;
        presenceTracker.startTracking(currentSession.user.id);
      }
    });

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!hasPendingOTP()) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      }
      setLoading(false);
    });

    // Force wallet check handler
    const handleForceCheck = (e: CustomEvent<{ userId: string }>) => {
      if (e.detail?.userId) {
        const userId = e.detail.userId;
        const now = Date.now();
        if (now - lastForceCheckRef.current < 2000) return;
        lastForceCheckRef.current = now;
        checkWalletOnAuth(userId, true);
      }
    };
    
    window.addEventListener('force-wallet-check', handleForceCheck as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('force-wallet-check', handleForceCheck as EventListener);
    };
  }, [checkWalletOnAuth]);

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const baseUrl = window.location.hostname.includes('pexly.app') 
      ? 'https://pexly.app' 
      : window.location.origin;
    const redirectUrl = `${baseUrl}/verify-email`;
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: redirectUrl,
        captchaToken,
      },
    });

    if (!error && data.user) {
      await trackDevice(data.user.id);
      await checkWalletOnAuth(data.user.id);
    }

    return { error };
  }, [checkWalletOnAuth]);

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: { captchaToken },
    });

    if (error) return { error, data };

    if (data.user && data.session) {
      await trackDevice(data.user.id);
      await checkWalletOnAuth(data.user.id);
      
      if (!isTrackingRef.current) {
        isTrackingRef.current = true;
        presenceTracker.startTracking(data.user.id);
      }
    }

    return { error, data };
  }, [checkWalletOnAuth]);

  const completeOTPVerification = useCallback(async () => {
    if (!pendingSession) return;
    
    const { user: pendingUser, session: pendingSessionData } = pendingSession;
    
    // Actually set the session and user state now
    setSession(pendingSessionData);
    setUser(pendingUser);
    
    await trackDevice(pendingUser.id);
    await checkWalletOnAuth(pendingUser.id);
    
    // Clear pending state
    setPendingOTPVerification(null);
    setPendingSession(null);
    
    if (!isTrackingRef.current) {
      isTrackingRef.current = true;
      presenceTracker.startTracking(pendingUser.id);
    }
    
    try {
      sessionStorage.removeItem('pendingOTP_data');
      sessionStorage.removeItem('pendingOTP_session');
    } catch { /* silent */ }
  }, [pendingSession, checkWalletOnAuth]);

  const cancelOTPVerification = useCallback(async () => {
    // Sign out from Supabase to clear the pending session
    await supabase.auth.signOut();
    
    setPendingOTPVerification(null);
    setPendingSession(null);
    
    try {
      sessionStorage.removeItem('pendingOTP_data');
      sessionStorage.removeItem('pendingOTP_session');
    } catch { /* silent */ }
  }, []);

  const signOut = useCallback(async () => {
    presenceTracker.stopTracking();
    setSessionPassword(null);
    setWalletImportState({ required: false, expectedAddress: null });
    checkedUsersRef.current.clear();
    isTrackingRef.current = false;
    setPendingOTPVerification(null);
    setPendingSession(null);
    
    try {
      sessionStorage.removeItem('walletPassword');
      sessionStorage.removeItem('pendingOTP_data');
      sessionStorage.removeItem('pendingOTP_session');
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('wallet_checked_')) sessionStorage.removeItem(key);
      });
    } catch { /* silent */ }
    
    await supabase.auth.signOut();
  }, [setSessionPassword]);

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    completeOTPVerification,
    cancelOTPVerification,
    loading,
    pendingOTPVerification,
    walletImportState,
    setWalletImportState,
    sessionPassword,
    setSessionPassword,
  };

  return (
    <AuthContext.Provider value={value}>
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
