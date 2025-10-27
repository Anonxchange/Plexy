import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Sun, Moon, ShieldCheck, Zap } from "lucide-react";
import { FaGoogle, FaApple, FaFacebook } from "react-icons/fa";
import { CountryCodeSelector } from "@/components/country-code-selector";
import { createClient } from "@/lib/supabase";
import { authenticator } from "otplib";
import { useTheme } from "@/components/theme-provider";

export function SignIn() {
  const [inputValue, setInputValue] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [isPhoneNumber, setIsPhoneNumber] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FAInput, setShow2FAInput] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const { signIn, signOut, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }

    // Check if redirected due to timeout
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'timeout') {
      toast({
        title: "Session Expired",
        description: "You were logged out due to inactivity",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  useEffect(() => {
    const value = inputValue.trim();
    const isPhone = /^[\d\s\-\(\)]+$/.test(value) || value.startsWith('+');
    setIsPhoneNumber(isPhone && value.length > 0);
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isPhoneNumber) {
      const fullPhoneNumber = `${countryCode}${inputValue}`;
      toast({
        title: "Phone Sign-In Not Yet Implemented",
        description: "Please use email to sign in, or sign up with phone verification",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await signIn(inputValue, password);

    if (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to get user session",
        variant: "destructive",
      });
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('two_factor_enabled, two_factor_secret')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking 2FA status:', profileError);
    }

    if (profileData?.two_factor_enabled && profileData?.two_factor_secret) {
      setTempUserId(userId);
      setShow2FAInput(true);
      setLoading(false);
      await signOut();
    } else {
      toast({
        title: "Success!",
        description: "You have successfully signed in",
      });
      setTimeout(() => {
        setLoading(false);
        setLocation("/dashboard");
      }, 100);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!tempUserId) {
      toast({
        title: "Error",
        description: "Invalid session",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('two_factor_secret, two_factor_backup_codes')
        .eq('id', tempUserId)
        .single();

      if (profileError) throw profileError;

      const isValidToken = authenticator.verify({
        token: twoFactorCode,
        secret: profileData.two_factor_secret,
      });

      let isBackupCode = false;
      let updatedBackupCodes = profileData.two_factor_backup_codes;

      if (!isValidToken && profileData.two_factor_backup_codes) {
        const backupCodes = JSON.parse(profileData.two_factor_backup_codes);
        if (backupCodes.includes(twoFactorCode)) {
          isBackupCode = true;
          const newBackupCodes = backupCodes.filter((code: string) => code !== twoFactorCode);
          updatedBackupCodes = JSON.stringify(newBackupCodes);

          await supabase
            .from('user_profiles')
            .update({ two_factor_backup_codes: updatedBackupCodes })
            .eq('id', tempUserId);
        }
      }

      if (!isValidToken && !isBackupCode) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error: signInError } = await signIn(inputValue, password);

      if (signInError) {
        toast({
          title: "Error",
          description: signInError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Success!",
        description: "You have successfully signed in with 2FA",
      });

      setTimeout(() => {
        setLoading(false);
        setLocation("/dashboard");
      }, 100);
    } catch (error) {
      console.error('2FA verification error:', error);
      toast({
        title: "Error",
        description: "Failed to verify 2FA code",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>
            Pexly
          </span>
        </div>

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

      {/* Main Content */}
      <div className="px-6 pt-20 max-w-md mx-auto">
        {!show2FAInput ? (
          <>
            <h1 className={`text-4xl mb-8 ${isDark ? 'text-white' : 'text-black'}`} style={{ fontWeight: 200, letterSpacing: '-0.01em' }}>
              Welcome back!
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
                <FaGoogle className="w-5 h-5" />
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
                <FaFacebook className="w-5 h-5" />
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
                <FaApple className="w-5 h-5" />
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
                      ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                      : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                  } focus:outline-none transition-colors`}
                  placeholder="Enter your email or phone"
                />
              </div>

              {/* Password Input */}
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

              {/* Stay Logged In & Forgot Password */}
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

              {/* Sign In Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-lime-400 hover:bg-lime-500 text-black font-medium py-4 rounded-full text-lg transition-colors disabled:opacity-50" 
                style={{ fontWeight: 500 }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

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
                Enter the 6-digit code from your authenticator app
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
                setTempUserId(null);
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
    </div>
  );
}
