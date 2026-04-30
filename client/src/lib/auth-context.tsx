import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { useLocation } from "wouter";
import { getSupabase } from "./supabase";
import { getClientIP } from "./get-client-ip";
import { devLog } from "./dev-logger";
import { sendLoginNotificationIfEnabled } from "./notifications-api";

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

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, captchaToken?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ 
    error: any; 
    data: any;
    requiresOTP?: boolean;
    pendingAuth?: PendingAuth;
    requiresTOTP?: boolean;
    totpFactorId?: string;
    totpChallengeId?: string;
  }>;
  signOut: () => Promise<void>;
  completeOTPVerification: () => Promise<void>;
  cancelOTPVerification: () => Promise<void>;
  loading: boolean;
  isLoading: boolean;
  pendingOTPVerification: PendingAuth | null;
  walletImportState: WalletImportState;
  setWalletImportState: (state: WalletImportState) => void;
  isWalletUnlocked: boolean;
  unlockWallet: (password: string) => void;
  lockWallet: () => void;
  /**
   * Returns the current vault password from module scope — NOT stored in
   * the context value object so React DevTools cannot passively read it.
   * Call this only inside event handlers / async functions, never during
   * render so the return value never enters the component tree.
   */
  getSessionPassword: () => string | null;
  setSessionPassword: (password: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    const supabase = await getSupabase();
    const deviceInfo = getDeviceInfo();
    const ipAddress = await getClientIP();

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

// Returns true only if there is a non-expired pending OTP challenge for this
// specific user. If the stored OTP belongs to a different user (stale from a
// previous flow), it is cleared and false is returned so the new session can
// proceed normally. This prevents a stale OTP from blocking a valid login.
function isOTPBlockingUser(userId: string): boolean {
  try {
    const raw = sessionStorage.getItem('pendingOTP_data');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    // Expired — always discard
    if (Date.now() - (parsed.createdAt || 0) > 10 * 60 * 1000) {
      sessionStorage.removeItem('pendingOTP_data');
      sessionStorage.removeItem('pendingOTP_session');
      return false;
    }
    // Different user's OTP — discard; let this user's session through
    if (parsed.userId && parsed.userId !== userId) {
      sessionStorage.removeItem('pendingOTP_data');
      sessionStorage.removeItem('pendingOTP_session');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Vault password — module-level store, intentionally outside React state ──
// Keeping the wallet decryption password in useState exposes it in React
// DevTools (browser extensions can read all component state). Storing it at
// module scope instead means it is never visible in the component tree while
// still being accessible through the AuthContext API. The boolean
// isWalletUnlocked (useState) continues to drive re-renders when the lock
// state changes, so all consumers stay correctly in sync.
let _vaultPassword: string | null = null;
// ────────────────────────────────────────────────────────────────────────────

// ─── Custom inactivity-based session expiry (no Supabase premium required) ──
// Supabase silently refreshes the access token, so the JWT timeout setting
// alone never logs users out. Instead we track the last moment the user was
// active and expire the session if they've been idle too long. The check runs
// every time Supabase refreshes the token — no polling needed.
const SESSION_INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const ACTIVITY_THROTTLE_MS  = 60 * 1000;       // write to localStorage at most once per minute

let _lastActivityWrite = 0; // module-level throttle — no React state needed

function getLastActivity(userId: string): number {
  try {
    const val = localStorage.getItem(`pexly_last_activity_${userId}`);
    return val ? parseInt(val, 10) : 0;
  } catch { return 0; }
}

function touchLastActivity(userId: string, force = false): void {
  const now = Date.now();
  if (!force && now - _lastActivityWrite < ACTIVITY_THROTTLE_MS) return;
  _lastActivityWrite = now;
  try {
    localStorage.setItem(`pexly_last_activity_${userId}`, String(now));
  } catch { /* silent */ }
}

function clearLastActivity(userId: string): void {
  try {
    localStorage.removeItem(`pexly_last_activity_${userId}`);
  } catch { /* silent */ }
}

function isSessionExpired(userId: string): boolean {
  const last = getLastActivity(userId);
  if (!last) return false; // no recorded activity → don't expire (backwards-compat)
  return Date.now() - last > SESSION_INACTIVITY_MS;
}
// ────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [pendingOTPVerification, setPendingOTPVerification] = useState<PendingAuth | null>(() => {
    try {
      const saved = sessionStorage.getItem('pendingOTP_data');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const createdAt = parsed.createdAt || 0;
      if (Date.now() - createdAt > 10 * 60 * 1000) {
        sessionStorage.removeItem('pendingOTP_data');
        sessionStorage.removeItem('pendingOTP_session');
        return null;
      }
      return parsed;
    } catch { return null; }
  });

  const setPendingOTPWithTimestamp = useCallback((data: PendingAuth | null) => {
    setPendingOTPVerification(data);
    try {
      if (data) {
        const dataWithTimestamp = { ...data, createdAt: Date.now() };
        sessionStorage.setItem('pendingOTP_data', JSON.stringify(dataWithTimestamp));
      } else {
        sessionStorage.removeItem('pendingOTP_data');
      }
    } catch { /* silent */ }
  }, []);
  
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

  // sessionPassword is stored in _vaultPassword (module scope), not useState.
  const [isWalletUnlocked, setIsWalletUnlocked] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lockWallet = useCallback(() => {
    _vaultPassword = null;
    setIsWalletUnlocked(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, []);

  const lockWalletDueToInactivity = useCallback(() => {
    _vaultPassword = null;
    setIsWalletUnlocked(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    navigate('/signin?reason=timeout');
  }, [navigate]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // 15 minutes of inactivity triggers auto-lock
    inactivityTimerRef.current = setTimeout(lockWalletDueToInactivity, 15 * 60 * 1000);
  }, [lockWalletDueToInactivity]);

  const unlockWallet = useCallback((password: string) => {
    _vaultPassword = password;
    setIsWalletUnlocked(true);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const hiddenAtRef = useRef<number | null>(null);
  const BACKGROUND_LOCK_MS = 5 * 60 * 1000; // lock wallet if tab is hidden for 5+ minutes

  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    const handleActivity = () => {
      if (isWalletUnlocked) resetInactivityTimer();
      if (activeUserIdRef.current) touchLastActivity(activeUserIdRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else {
        const hiddenAt = hiddenAtRef.current;
        hiddenAtRef.current = null;
        if (hiddenAt && isWalletUnlockedRef.current && Date.now() - hiddenAt >= BACKGROUND_LOCK_MS) {
          lockWalletDueToInactivity();
        } else if (!document.hidden && isWalletUnlockedRef.current) {
          resetInactivityTimer();
        }
        if (activeUserIdRef.current) touchLastActivity(activeUserIdRef.current);
      }
    };

    activityEvents.forEach(event => window.addEventListener(event, handleActivity));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isWalletUnlocked, resetInactivityTimer, lockWalletDueToInactivity]);
  
  const checkedUsersRef = useRef<Set<string>>(new Set());
  const lastForceCheckRef = useRef<number>(0);
  const sessionTokenRef = useRef<string | null>(null);
  const isSigningOutRef = useRef(false);
  const activeUserIdRef = useRef<string | null>(null);
  // Ref mirrors for values used inside long-lived callbacks to avoid stale closures
  const isWalletUnlockedRef = useRef(false);

  // Keep refs in sync with state so callbacks always see current values
  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    isWalletUnlockedRef.current = isWalletUnlocked;
  }, [isWalletUnlocked]);

  const checkWalletOnAuth = useCallback(async (userId: string, force: boolean = false) => {
    if (!userId) return;
    
    if (!force && checkedUsersRef.current.has(userId)) {
      return;
    }
    
    try {
      const supabase = await getSupabase();
      checkedUsersRef.current.add(userId);
      
      // DECISION FLOW:
      // 1. Fetch authoritative encrypted blobs from Supabase (source of truth).
      //    Cache them in IndexedDB for offline fallback. Never store decrypted keys.
      // 2. If wallet is already unlocked in memory -> Wallet Ready
      // 3. If encrypted blobs exist (Supabase or IDB cache) -> Password Required
      // 4. If wallet address exists in profile but no blob -> Import Required
      // 5. No address at all -> Create Required

      // 1. Always sync encrypted blobs from Supabase first.
      //    This ensures we never rely solely on potentially stale IDB data.
      let wallets: any[] = [];
      try {
        const { nonCustodialWalletManager } = await import("./non-custodial-wallet");
        const supabaseWallets = await nonCustodialWalletManager.loadWalletsFromSupabase(supabase, userId);
        if (supabaseWallets && supabaseWallets.length > 0) {
          wallets = supabaseWallets;
        }
      } catch {
        devLog.error("Supabase wallet sync failed, falling back to IDB cache");
        const { nonCustodialWalletManager } = await import("./non-custodial-wallet");
        wallets = await nonCustodialWalletManager.getWalletsFromStorage(userId);
      }

      // 2. If wallet is already unlocked in memory -> Wallet Ready
      // Use ref to avoid stale closure (useCallback has [] deps)
      if (wallets.length > 0 && isWalletUnlockedRef.current) {
        setWalletImportState({ required: false, expectedAddress: null });
        return;
      }

      // 3. Encrypted blobs exist -> password required to use them
      if (wallets.length > 0) {
        setWalletImportState({ required: false, expectedAddress: null });
        return;
      }

      // 4. Check Wallet Address (Ownership check)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('id', userId)
        .maybeSingle();
        
      // Use profile data only — avoids stale `user` closure from useCallback([])
      const walletAddress = profile?.wallet_address;

      if (walletAddress) {
        // IMPORT REQUIRED: User owns a wallet (address exists) but we have no encrypted blob.
        // This is a security gap or device loss scenario.
        setWalletImportState({ 
          required: true, 
          expectedAddress: walletAddress 
        });
        return;
      }

      // 5. CREATE REQUIRED: No trace of a wallet anywhere
      setWalletImportState({ 
        required: true, 
        expectedAddress: null 
      });

    } catch {
      devLog.error("Wallet detection error");
      checkedUsersRef.current.delete(userId);
    }
  }, []);

  const checkWalletOnAuthRef = useRef<(userId: string, force?: boolean) => Promise<void>>(
    async () => {} // dummy function, will be updated by useEffect
  );

  useEffect(() => {
    checkWalletOnAuthRef.current = checkWalletOnAuth;
  }, [checkWalletOnAuth]);

  // Clear checkedUsersRef when user logs out
  useEffect(() => {
    if (!user?.id) {
      checkedUsersRef.current.clear();
    }
  }, [user?.id]);

  // Check wallet whenever user becomes available after loading
  useEffect(() => {
    if (user?.id && !loading && !hasPendingOTP()) {
      checkWalletOnAuthRef.current(user.id);
    }
  }, [user?.id, loading]);

  // Update sessionTokenRef when session changes
  useEffect(() => {
    sessionTokenRef.current = session?.access_token ?? null;
  }, [session?.access_token]);

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
    _vaultPassword = password;
    if (password) {
      setIsWalletUnlocked(true);
      resetInactivityTimer();
    } else {
      setIsWalletUnlocked(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    }
  }, [resetInactivityTimer]);

  // Main auth effect
  useEffect(() => {
    // Guard against the effect running after the component unmounts. Because
    // getSupabase() is async, the cleanup function below may fire before the
    // Promise resolves. Without this flag, the async callback would continue
    // running (setting up subscriptions, updating state) on an unmounted tree.
    let aborted = false;

    // Helper: clear stale OTP React state when sessionStorage was wiped
    const clearOTPState = () => {
      setPendingOTPVerification(null);
      setPendingSession(null);
    };

    // Clean up stale OTP data older than 10 minutes
    try {
      const otpData = sessionStorage.getItem('pendingOTP_data');
      if (otpData) {
        const parsed = JSON.parse(otpData);
        const createdAt = parsed.createdAt || 0;
        if (Date.now() - createdAt > 10 * 60 * 1000) {
          sessionStorage.removeItem('pendingOTP_data');
          sessionStorage.removeItem('pendingOTP_session');
          clearOTPState();
        }
      }
    } catch { /* silent */ }

    if (window.location.pathname === '/verify-email') {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Refs so the cleanup function can reach these even though they are
    // assigned asynchronously inside the getSupabase().then() callback.
    let subscription: { unsubscribe(): void } | undefined;
    let healthCheckInterval: ReturnType<typeof setInterval> | undefined;

    // Load Supabase asynchronously — vendor-db chunk is NOT part of the
    // initial bundle; it downloads in the background after first render.
    getSupabase().then((supabase) => {
      if (aborted) return; // component unmounted before client resolved

      // Set up auth state listener FIRST
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (aborted) return;
        if (window.location.pathname === '/verify-email') {
          setSession(null);
          setUser(null);
          return;
        }

        // ALWAYS update session for token refresh — but check custom expiry first
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (
            currentSession?.user &&
            !isSigningOutRef.current &&
            isSessionExpired(currentSession.user.id)
          ) {
            // Session exceeded our custom max age — force sign out once
            isSigningOutRef.current = true;
            supabase.auth.signOut().finally(() => { isSigningOutRef.current = false; });
            return;
          }
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          return;
        }

        // Handle logout/session clear
        if (event === 'SIGNED_OUT' || !currentSession) {
          setSession(null);
          setUser(null);
          setWalletImportState({ required: false, expectedAddress: null });
          checkedUsersRef.current.clear();
          return;
        }

        // Use user-aware OTP check: stale OTP for a different user is cleared
        // automatically inside isOTPBlockingUser so the real session gets through.
        if (!isOTPBlockingUser(currentSession.user.id)) {
          setSession(currentSession);
          setUser(currentSession.user);

          if (event === 'SIGNED_IN') {
            // Stamp activity at login so the 30-min inactivity clock starts now
            touchLastActivity(currentSession.user.id, true);
            // Defer async work to avoid blocking the callback
            setTimeout(async () => {
              if (aborted) return;
              const userId = currentSession.user.id;
              const deviceInfo = getDeviceInfo();
              await trackDevice(userId);
              checkWalletOnAuthRef.current(userId);
              // Fire login notification if the user has it enabled
              const ip = await getClientIP().catch(() => '');
              sendLoginNotificationIfEnabled(userId, deviceInfo, ip);
            }, 0);
          }
        }

      });
      subscription = sub;

      // Add periodic session health check
      healthCheckInterval = setInterval(async () => {
        if (aborted) return;
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession && sessionTokenRef.current !== currentSession.access_token && !isOTPBlockingUser(currentSession.user.id)) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      }, 60000);

      // Then get initial session
      supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
        if (aborted) return;
        // isOTPBlockingUser is user-aware: if pendingOTP_data belongs to a
        // different user (stale from a prior flow), it clears it and returns
        // false so this session is allowed through. Also sync React state.
        const blocked = initialSession?.user
          ? isOTPBlockingUser(initialSession.user.id)
          : hasPendingOTP();
        if (!blocked) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
        setLoading(false);
      }).catch(() => {
        if (!aborted) setLoading(false);
      });
    }).catch(() => {
      if (!aborted) setLoading(false);
    });

    // Force wallet check handler (no supabase needed — delegates to ref)
    const handleForceCheck = (e: CustomEvent<{ userId: string }>) => {
      if (e.detail?.userId) {
        const userId = e.detail.userId;
        const now = Date.now();
        if (now - lastForceCheckRef.current < 2000) return;
        lastForceCheckRef.current = now;
        checkWalletOnAuthRef.current(userId, true);
      }
    };
    
    window.addEventListener('force-wallet-check', handleForceCheck as EventListener);

    return () => {
      aborted = true;
      subscription?.unsubscribe();
      if (healthCheckInterval !== undefined) clearInterval(healthCheckInterval);
      window.removeEventListener('force-wallet-check', handleForceCheck as EventListener);
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const supabase = await getSupabase();
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
    }

    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const supabase = await getSupabase();
    const { error, data } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: { captchaToken },
    });

    if (error) return { error, data };

    if (data.user && data.session) {
      await trackDevice(data.user.id);

      // ── Supabase native MFA (TOTP authenticator app) ──────────────────
      // getAuthenticatorAssuranceLevel() is the correct API: it tells us whether
      // the current session needs to be stepped up to AAL2 (i.e. user has an
      // enrolled and verified TOTP factor that hasn't been verified this session).
      try {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel) {
          const { data: factorsData } = await supabase.auth.mfa.listFactors();
          const verifiedTotp = factorsData?.totp?.find((f: any) => f.status === 'verified');
          if (verifiedTotp) {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
              factorId: verifiedTotp.id,
            });
            if (challengeError || !challengeData) {
              return { error: challengeError ?? new Error('Failed to start MFA challenge'), data };
            }
            return {
              error: null,
              data,
              requiresTOTP: true,
              totpFactorId: verifiedTotp.id,
              totpChallengeId: challengeData.id,
            };
          }
        }
      } catch (e) {
        console.error('[MFA] TOTP check threw:', e);
      }
    }

    return { error, data };
  }, []);

  const completeOTPVerification = useCallback(async () => {
    if (!pendingSession) return;
    
    const { user: pendingUser, session: pendingSessionData } = pendingSession;
    
    // Stamp activity at login so the 30-min inactivity clock starts now
    touchLastActivity(pendingUser.id, true);

    // Actually set the session and user state now
    setSession(pendingSessionData);
    setUser(pendingUser);
    
    await trackDevice(pendingUser.id);

    // Fire login notification if the user has it enabled
    const deviceInfo = getDeviceInfo();
    const ip = await getClientIP().catch(() => '');
    sendLoginNotificationIfEnabled(pendingUser.id, deviceInfo, ip);
    
    // Clear pending state
    setPendingOTPWithTimestamp(null);
    setPendingSession(null);
    
    try {
      sessionStorage.removeItem('pendingOTP_data');
      sessionStorage.removeItem('pendingOTP_session');
    } catch { /* silent */ }
  }, [pendingSession, setPendingOTPWithTimestamp]);

  const cancelOTPVerification = useCallback(async () => {
    // Sign out from Supabase to clear the pending session
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    
    setPendingOTPWithTimestamp(null);
    setPendingSession(null);
    
    try {
      sessionStorage.removeItem('pendingOTP_data');
      sessionStorage.removeItem('pendingOTP_session');
    } catch { /* silent */ }
  }, [setPendingOTPWithTimestamp]);

  const signOut = useCallback(async () => {
    // Clear sensitive in-memory state immediately
    setSessionPassword(null);
    setWalletImportState({ required: false, expectedAddress: null });
    checkedUsersRef.current.clear();
    setPendingOTPWithTimestamp(null);
    setPendingSession(null);

    // Sign out from Supabase first so the server-side session is revoked
    const supabase = await getSupabase();
    await supabase.auth.signOut();

    // Wipe all browser storage: localStorage, sessionStorage, and IndexedDB.
    // This ensures no decrypted wallet data, cached keys, or session tokens remain.
    const { wipeSecureStorage } = await import("./secure-storage-wiper");
    await wipeSecureStorage();
  }, [setSessionPassword, setPendingOTPWithTimestamp]);

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    completeOTPVerification,
    cancelOTPVerification,
    loading,
    isLoading: loading,
    pendingOTPVerification,
    walletImportState,
    setWalletImportState,
    isWalletUnlocked,
    unlockWallet,
    lockWallet,
    // Returns the vault password from module scope on demand.
    // NEVER place _vaultPassword directly in the value object — the context
    // value is inspectable via React DevTools and would expose the plaintext
    // password to anyone with DevTools open. A function reference is visible
    // in DevTools; its return value is not.
    getSessionPassword: () => _vaultPassword,
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
