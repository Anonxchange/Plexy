import { useHead } from "@unhead/react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import portraitImage from "@assets/young-woman-portrait-close-up_1_3_optimized.webp";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Sun, Moon, ShieldCheck, Zap, Fingerprint } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaFacebook } from "react-icons/fa";
import { CountryCodeSelector } from "@/components/country-code-selector";
import { PhoneVerification } from "@/components/phone-verification";
import { DeviceOTPVerification } from "@/components/device-otp-verification";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/theme-provider";
import { Turnstile } from "@marsidev/react-turnstile";
import { deviceFingerprint } from "@/lib/security/device-fingerprint";
import { webAuthnService } from "@/lib/webauthn";

export function SignIn() {
  useHead({ title: "Sign In | Pexly", meta: [{ name: "description", content: "Sign in to access your Pexly wallet, swaps, staking, gift cards, and account features." }] });
  const [inputValue, setInputValue] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [isPhoneNumber, setIsPhoneNumber] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FAInput, setShow2FAInput] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showDeviceVerification, setShowDeviceVerification] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpChallengeId, setTotpChallengeId] = useState<string | null>(null);
  const [checking2FA, setChecking2FA] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [passkeySupported, setPasskeySupported] = useState(false);
  const { signIn, signOut, user, session, pendingOTPVerification, completeOTPVerification, cancelOTPVerification } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";
  const welcomeText = "Welcome back!";

  // Auto-detect country from IP on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_calling_code) {
          setCountryCode(data.country_calling_code);
        }
      } catch (error) {
        console.error('Failed to detect country:', error);
      }
    };
    detectCountry();
  }, []);

  // Check passkey support on mount
  useEffect(() => {
    webAuthnService.isPlatformAuthenticatorAvailable().then(setPasskeySupported).catch(() => setPasskeySupported(false));
  }, []);

  // Typewriter effect for welcome message
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= welcomeText.length) {
        setDisplayedText(welcomeText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && !checking2FA && !show2FAInput) {
      setLocation("/dashboard");
    }

    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    if (reason === 'timeout') {
      toast({
        title: "Session Expired",
        description: "You were logged out due to inactivity",
        variant: "destructive",
      });
    } else if (reason === 'session_ended') {
      toast({
        title: "Session Ended",
        description: "Your session was ended because you logged in from another device",
        variant: "destructive",
      });
    } else if (reason === 'session_expired') {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    }
  }, [user, setLocation, checking2FA, show2FAInput]);

  useEffect(() => {
    const value = inputValue.trim();
    const isPhone = /^[\d\s\-\(\)]+$/.test(value) || value.startsWith('+');
    setIsPhoneNumber(isPhone && value.length > 0);
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Phone number → OTP only (no password)
    if (isPhoneNumber) {
      const fullPhoneNumber = `${countryCode}${inputValue}`;
      
      // Check if phone number exists in database
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone_number', fullPhoneNumber)
        .eq('phone_verified', true)
        .single();

      if (checkError || !existingUser) {
        toast({
          title: "Phone Number Not Found",
          description: "This phone number is not registered. Please sign up first.",
          variant: "destructive",
        });
        return;
      }

      setUserPhoneNumber(fullPhoneNumber);
      setShowPhoneVerification(true);
      return;
    }

    // Email → Password authentication
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setChecking2FA(true);

    const authResult = await signIn(inputValue, password, captchaToken ?? undefined);

    if (authResult.error) {
      setLoading(false);
      setChecking2FA(false);
      toast({
        title: "Error",
        description: authResult.error.message,
        variant: "destructive",
      });
      return;
    }

    if (authResult.requiresOTP) {
      setLoading(false);
      setChecking2FA(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      setLoading(false);
      setChecking2FA(false);
      toast({
        title: "Error",
        description: "Failed to get user session",
        variant: "destructive",
      });
      return;
    }

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalData?.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel) {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.[0];

      if (totpFactor) {
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
        if (challengeError) {
          toast({ title: "Error", description: challengeError.message, variant: "destructive" });
          setLoading(false);
          setChecking2FA(false);
          return;
        }
        setTotpFactorId(totpFactor.id);
        setTotpChallengeId(challengeData.id);
        setShow2FAInput(true);
        setLoading(false);
        setChecking2FA(false);
        return;
      }
    }

    const deviceStatus = await deviceFingerprint.checkDeviceStatus(userId);
    if (!deviceStatus.exists || !deviceStatus.trusted) {
      const userEmail = sessionData?.session?.user?.email;
      if (userEmail) {
        setShowDeviceVerification(true);
        setLoading(false);
        setChecking2FA(false);
        return;
      }
    }

    try {
      await deviceFingerprint.registerDeviceAsTrusted(userId);
    } catch (error) {
      console.error('Error registering device during signin:', error);
    }
    setChecking2FA(false);
    toast({
      title: "Success!",
      description: "You have successfully signed in",
    });
    setTimeout(() => {
      setLoading(false);
      setLocation("/dashboard");
    }, 100);
  };

  const handlePhoneVerified = async (verifiedPhoneNumber: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) {
      try {
        await deviceFingerprint.registerDeviceAsTrusted(sessionData.session.user.id);
      } catch (error) {
        console.error('Error registering device during phone signin:', error);
      }
    }
    toast({
      title: "Success!",
      description: "Phone verified! Signing you in...",
    });
    setLocation("/dashboard");
  };

  const handleDeviceVerified = async () => {
    setLoading(true);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (userId) {
      try {
        await deviceFingerprint.registerDeviceAsTrusted(userId);
      } catch (error) {
        console.error('Error registering trusted device:', error);
      }
    }
    
    setShowDeviceVerification(false);
    setLoading(false);

    toast({
      title: "Device Verified!",
      description: "This device is now trusted. Welcome back!",
    });
    setLocation("/dashboard");
  };

  const handleDeviceVerificationCancel = async () => {
    await signOut();
    setShowDeviceVerification(false);
  };

  const handlePasskeySignIn = async () => {
    setLoading(true);
    try {
      const credentialIdHex = await webAuthnService.authenticateDiscoverable();
      if (!credentialIdHex) {
        toast({ title: "Cancelled", description: "Passkey sign-in was cancelled" });
        return;
      }

      const { data: credData, error: credError } = await supabase
        .from('webauthn_credentials')
        .select('user_id')
        .eq('credential_id', credentialIdHex)
        .eq('credential_type', 'passkey')
        .single();

      if (credError || !credData) {
        throw new Error("No passkey registered for this account. Please sign in with your password.");
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: inputValue.trim(),
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;

      toast({
        title: "Check your email",
        description: `Passkey verified! We sent a sign-in link to ${inputValue.trim()}.`,
      });
    } catch (error) {
      toast({
        title: "Passkey sign-in failed",
        description: error instanceof Error ? error.message : "Could not sign in with passkey",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!totpFactorId || !totpChallengeId) {
      toast({ title: "Error", description: "Invalid session. Please sign in again.", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactorId,
        challengeId: totpChallengeId,
        code: twoFactorCode,
      });

      if (verifyError) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Session is now AAL2 — Supabase enforces this server-side.
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (userId) {
        try {
          await deviceFingerprint.registerDeviceAsTrusted(userId);
        } catch (error) {
          console.error('Error registering device during 2FA signin:', error);
        }
      }

      setShow2FAInput(false);
      setChecking2FA(false);
      toast({ title: "Success!", description: "You have successfully signed in with 2FA" });

      setTimeout(() => {
        setLoading(false);
        setLocation("/dashboard");
      }, 100);
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast({ title: "Error", description: error?.message || "Failed to verify 2FA code", variant: "destructive" });
      setLoading(false);
    }
  };

  const handlePhonePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setChecking2FA(true);

    const fullPhoneNumber = `${countryCode}${inputValue}`;
    const tempEmail = `${fullPhoneNumber.replace(/\+/g, '')}@pexly.phone`;

    // Sign in with password
    const { error, data } = await signIn(tempEmail, password);

    if (error) {
      setLoading(false);
      setChecking2FA(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Check for 2FA after successful password authentication
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('two_factor_enabled, two_factor_secret')
        .eq('id', userData.user.id)
        .single();

      setChecking2FA(false);

      if (profile?.two_factor_enabled) {
        setShow2FAInput(true);
        setLoading(false);
      } else {
        try {
          await deviceFingerprint.registerDeviceAsTrusted(userData.user.id);
        } catch (error) {
          console.error('Error registering device during phone signin:', error);
        }
        toast({
          title: "Welcome back!",
          description: "Successfully signed in",
        });
        setTimeout(() => {
          setLocation("/dashboard");
        }, 100);
      }
    }
  };


  return (
    <div className={`min-h-screen ${isDark ? 'bg-background' : 'bg-white'} transition-colors duration-300`}>
      {/* Header */}
      <div className="p-6 flex justify-between items-center lg:absolute lg:top-0 lg:left-0 lg:right-0 lg:z-10">
        <a href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>
            Pexly
          </span>
        </a>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`p-2 rounded-full ${
            isDark ? 'bg-gray-800 text-lime-400' : 'bg-gray-100 text-gray-700'
          } transition-colors`}
        >
          {isDark ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Desktop 2-Column Layout */}
      <div className="lg:grid lg:grid-cols-2 lg:min-h-screen">
        {/* Left Column: Form */}
        <div className="px-6 pt-12 lg:pt-20 max-w-md mx-auto lg:flex lg:flex-col lg:justify-center w-full">
        {showPhoneVerification ? (
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-card border border-card-border' : 'bg-gray-50 border border-gray-200'}`}>
            <h2 className={`text-2xl mb-2 ${isDark ? 'text-white' : 'text-black'}`} style={{ fontWeight: 200 }}>
              Phone Verification
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Verify your phone number to sign in
            </p>
            <PhoneVerification
              onVerified={handlePhoneVerified}
              initialPhone={inputValue}
              initialCountryCode={countryCode}
            />
            <button
              type="button"
              onClick={() => setShowPhoneVerification(false)}
              className={`w-full mt-4 py-3 rounded-xl text-sm transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              Back to Sign In
            </button>
          </div>
        ) : !show2FAInput ? (
          <>
            <h1 className={`text-4xl mb-8 ${isDark ? 'text-white' : 'text-black'}`} style={{ fontWeight: 200, letterSpacing: '-0.01em' }}>
              {displayedText}
              <span className="animate-pulse">|</span>
            </h1>

            {/* Social Login Buttons */}
            <div className="flex justify-center gap-4 mb-8">
              <button 
                type="button"
                onClick={() => toast({ title: "Coming soon", description: "Google sign-in will be available soon" })}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isDark 
                    ? 'border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-black'
                }`}
              >
                <FcGoogle className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => toast({ title: "Coming soon", description: "Facebook sign-in will be available soon" })}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isDark 
                    ? 'border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-black'
                }`}
              >
                <FaFacebook className="w-5 h-5 text-[#1877F2]" />
              </button>
              <button 
                type="button"
                onClick={() => toast({ title: "Coming soon", description: "Apple sign-in will be available soon" })}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isDark 
                    ? 'border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-black'
                }`}
              >
                <FaApple className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
              </button>
            </div>

            <div className={`flex items-center gap-4 mb-8`}>
              <div className={`flex-1 h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
              <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>or</span>
              <div className={`flex-1 h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email/Phone Input */}
              <div className="mb-6">
                <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Email / Phone Number<span className="text-red-500">*</span>
                </label>
                {isPhoneNumber && (
                  <div className="mb-3">
                    <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
                  </div>
                )}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className={`w-full px-4 py-4 rounded-xl text-base ${
                    isDark 
                      ? 'bg-muted text-foreground border border-border focus:border-lime-400' 
                      : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                  } focus:outline-none transition-colors`}
                  placeholder="Enter your email or phone"
                />
              </div>

              {/* Password Input - Only shown for email */}
              {!isPhoneNumber && (
                <div className="mb-4">
                  <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-4 rounded-xl text-base pr-12 ${
                        isDark 
                          ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                          : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                      } focus:outline-none transition-colors`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Stay Logged In & Forgot Password - Only shown for email */}
              {!isPhoneNumber && (
                <div className="flex items-center justify-between mb-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          localStorage.setItem('stayLoggedIn', 'true');
                        } else {
                          localStorage.removeItem('stayLoggedIn');
                        }
                      }}
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Stay logged in
                    </span>
                  </label>
                  <a href="#" className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'} hover:underline`}>
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Cloudflare Turnstile CAPTCHA */}
              {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                <div className="mb-6 flex flex-col items-center gap-2">
                  {captchaError !== null ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                        Captcha error: {captchaError}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCaptchaError(null);
                          setCaptchaToken(null);
                          setCaptchaKey(k => k + 1);
                        }}
                        className={`text-sm underline ${isDark ? 'text-lime-400' : 'text-lime-600'}`}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
      <Turnstile key={captchaKey} siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
  scriptOptions={{
    async: true,
    defer: true,
    appendTo: "head"
  }}
  onSuccess={(token) => {
    setCaptchaToken(token);
    setCaptchaError(null);
  }}
  onError={(code) => {
    setCaptchaToken(null);
    setCaptchaError(code ?? "unknown error");
  }}
  onExpire={() => {
    setCaptchaToken(null);
    setCaptchaError(null);
  }}
  options={{
    theme: isDark ? "dark" : "light"
  }}
/>
                  )}
                </div>
              )}

              {/* Sign In Button */}
              <button 
                type="submit"
                disabled={loading || (!!import.meta.env.VITE_TURNSTILE_SITE_KEY && !captchaToken && !captchaError)}
                className="w-full bg-lime-400 hover:bg-lime-500 text-black font-medium py-4 rounded-full text-lg transition-colors disabled:opacity-50" 
                style={{ fontWeight: 500 }}
              >
                {loading ? "Signing in..." : isPhoneNumber ? "Continue with SMS" : "Sign in"}
              </button>

              {/* Passkey Sign In — only for users who have passkeys on a supporting device */}
              {!isPhoneNumber && passkeySupported && inputValue.includes('@') && (
                <button
                  type="button"
                  onClick={handlePasskeySignIn}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium transition-colors mt-3 disabled:opacity-50 ${
                    isDark
                      ? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Fingerprint size={18} />
                  Sign in with Passkey
                </button>
              )}

              {/* Sign Up Link */}
              <div className={`text-center mt-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Don't have an account?{' '}
                <a href="/signup" className={`${isDark ? 'text-lime-400' : 'text-lime-600'} hover:underline font-medium`}>
                  Sign up
                </a>
              </div>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerify2FA}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lime-400/10 mb-4">
                <ShieldCheck className="h-8 w-8 text-lime-400" />
              </div>
              <h1 className={`text-3xl mb-3 ${isDark ? 'text-white' : 'text-black'}`} style={{ fontWeight: 200, letterSpacing: '-0.01em' }}>
                Two-Factor Authentication
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter the 6-digit code from your authenticator app or SMS.
                {userPhoneNumber && ` We've sent a code to ${userPhoneNumber}.`}
              </p>
            </div>

            <div className="mb-6">
              <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Verification Code<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={8}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                className={`w-full px-4 py-4 rounded-xl text-center text-2xl tracking-widest font-mono ${
                  isDark 
                    ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                    : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                } focus:outline-none transition-colors`}
                autoFocus
              />
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} text-center mt-2`}>
                You can also use a backup code
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading || twoFactorCode.length < 6}
              className="w-full bg-lime-400 hover:bg-lime-500 text-black font-medium py-4 rounded-full text-lg transition-colors disabled:opacity-50 mb-4" 
              style={{ fontWeight: 500 }}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShow2FAInput(false);
                setTwoFactorCode("");
                setTotpFactorId(null);
                setTotpChallengeId(null);
                setChecking2FA(false);
              }}
              className={`w-full py-4 rounded-full text-base transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-900' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
            >
              Back to Login
            </button>
          </form>
        )}
        </div>

        {/* Right Column: Portrait Image (Desktop only) */}
        <div className="hidden lg:block relative overflow-hidden">
          <img
            src={portraitImage}
            alt="Pexly"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Center tagline overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-8">
            <p className="text-white text-3xl font-semibold leading-snug drop-shadow-lg text-center">
              Decentralized all&#8209;in&#8209;one
            </p>
            <p className="text-white/70 text-sm mt-2 drop-shadow text-center">
              Buy, sell & trade crypto across 500+ payment methods
            </p>
          </div>
        </div>
      </div>

      {pendingOTPVerification && (
        <DeviceOTPVerification
          isOpen={!!pendingOTPVerification}
          onClose={() => {
            cancelOTPVerification();
          }}
          onVerified={async () => {
            await completeOTPVerification();
            toast({
              title: "Device Verified!",
              description: "Your device has been verified and trusted.",
            });
            setLocation("/dashboard");
          }}
          userId={pendingOTPVerification.userId}
          email={pendingOTPVerification.email}
          accessToken={session?.access_token || ''}
          deviceInfo={pendingOTPVerification.deviceInfo}
        />
      )}

      {showDeviceVerification && session?.user?.id && session?.user?.email && session?.access_token && (
        <DeviceOTPVerification
          isOpen={showDeviceVerification}
          onClose={handleDeviceVerificationCancel}
          onVerified={handleDeviceVerified}
          userId={session.user.id}
          email={session.user.email}
          accessToken={session.access_token}
        />
      )}
    </div>
  );
}
