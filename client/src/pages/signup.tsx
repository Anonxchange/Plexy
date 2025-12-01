import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Sun, Moon, Zap, MapPin } from "lucide-react";
import { FaGoogle, FaApple, FaFacebook } from "react-icons/fa";
import { PhoneVerification } from "@/components/phone-verification";
import { createClient } from "@/lib/supabase";
import { CountryCodeSelector } from "@/components/country-code-selector";
import { useTheme } from "@/components/theme-provider";
import { amlScreening } from "@/lib/security/aml-screening";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const countries = [
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
];

export function SignUp() {
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [country, setCountry] = useState("");
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "email_verify" | "phone">("details");
  const [userId, setUserId] = useState<string | null>(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { signUp, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  // Auto-detect country on mount
  useEffect(() => {
    detectCountry();
  }, []);

  const detectCountry = async () => {
    setDetectingCountry(true);
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.country_code) {
        const detectedCountry = countries.find(c => c.code === data.country_code);
        if (detectedCountry) {
          setCountry(data.country_code);
          
          // Also update phone country code based on detected country
          const countryToPhoneCode: { [key: string]: string } = {
            'NG': '+234',
            'US': '+1',
            'GB': '+44',
            'GH': '+233',
            'KE': '+254',
            'ZA': '+27',
            'EG': '+20',
            'MA': '+212',
            'CA': '+1',
            'AU': '+61',
            'IN': '+91',
            'PH': '+63',
            'ID': '+62',
            'MY': '+60',
            'SG': '+65',
            'TH': '+66',
            'VN': '+84',
            'AE': '+971',
            'SA': '+966',
            'BR': '+55',
            'MX': '+52',
            'AR': '+54',
            'CL': '+56',
            'CO': '+57',
            'FR': '+33',
            'DE': '+49',
            'IT': '+39',
            'ES': '+34',
            'NL': '+31',
            'BE': '+32',
            'CH': '+41',
            'SE': '+46',
            'NO': '+47',
            'DK': '+45',
            'PL': '+48',
            'CN': '+86',
            'JP': '+81',
            'KR': '+82',
            'PK': '+92',
            'BD': '+880',
          };
          
          if (countryToPhoneCode[data.country_code]) {
            setCountryCode(countryToPhoneCode[data.country_code]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to detect country:', error);
      // IP detection failed - user will need to select manually
    } finally {
      setDetectingCountry(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Email signup → requires password validation
    if (signupMethod === "email") {
      if (!email) {
        toast({
          title: "Error",
          description: "Email is required",
          variant: "destructive",
        });
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (password.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      
      // Basic AML screening before account creation
      try {
        const sanctions = await amlScreening.screenUser(
          "pending",
          fullName,
          country
        );

        if (sanctions.length > 0) {
          setLoading(false);
          toast({
            title: "Account Registration Blocked",
            description: "We cannot create an account at this time. Please contact support if you believe this is an error.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("AML screening error:", error);
      }

      // Send OTP email
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, type: 'signup' }),
      });

      setLoading(false);

      if (!response.ok) {
        toast({
          title: "Error",
          description: "Failed to send verification code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Check your email!",
        description: "We've sent a 6-digit verification code to your email.",
      });
      
      setOtpSent(true);
      setStep("email_verify");
    } else {
      // Phone signup → OTP only, no password required
      if (!phoneNumber) {
        toast({
          title: "Error",
          description: "Phone number is required",
          variant: "destructive",
        });
        return;
      }

      setUserId("pending");
      setLoading(false);
      setStep("phone");
    }
  };

  const handleEmailOtpVerify = async () => {
    setLoading(true);
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-email-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email,
        otp: emailOtp,
        password,
        fullName,
        country,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast({
        title: "Verification Failed",
        description: data.error || "Invalid verification code",
        variant: "destructive",
      });
      return;
    }

    // Sign in the user
    await signIn(email, password);
    
    toast({
      title: "Success!",
      description: "Email verified! Account created successfully!",
    });
    
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      setUserId(userData.user.id);
      setStep("phone");
    }
  };

  const handlePhoneVerified = async (verifiedPhoneNumber: string) => {
    if (signupMethod === "phone" && userId === "pending") {
      // Phone signup → User is already authenticated via OTP in PhoneVerification component
      // Just update the profile with additional info
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          phone_number: verifiedPhoneNumber,
          phone_verified: true,
          full_name: fullName,
          country: country,
        }, {
          onConflict: 'id'
        });

        toast({
          title: "Success!",
          description: "Phone verified! Account created successfully!",
        });
        setLocation("/dashboard");
      }
    } else if (userId && userId !== "pending") {
      // Email signup → Adding phone to existing email account
      await supabase.from('user_profiles').update({
        phone_number: verifiedPhoneNumber,
        phone_verified: true,
      }).eq('id', userId);

      toast({
        title: "Success!",
        description: "Phone verified successfully!",
      });
      setLocation("/dashboard");
    }
  };

  const handleSkipPhone = () => {
    toast({
      title: "Skipped",
      description: "You can verify your phone later in settings",
    });
    setLocation("/dashboard");
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>
      {/* Header */}
      <div className="p-6 flex justify-between items-center lg:absolute lg:top-0 lg:left-0 lg:right-0 lg:z-10">
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

      {/* Desktop 2-Column Layout */}
      <div className="lg:grid lg:grid-cols-2 lg:min-h-screen">
        {/* Left Column: Image (Desktop only) */}
        <div className="hidden lg:flex lg:items-center lg:justify-center lg:p-12 bg-gradient-to-br from-primary/10 to-primary/5">
          <img 
            src="/attached_assets/generated_images/Crypto_success_and_growth_d90b6aec.png"
            alt="Crypto Success and Growth"
            className="max-w-full max-h-[80vh] object-contain rounded-2xl"
          />
        </div>

        {/* Right Column: Form */}
        <div className="px-6 pt-12 lg:pt-32 max-w-md mx-auto pb-12 lg:flex lg:flex-col lg:justify-center">
        {step === "email_verify" ? (
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
            <h2 className={`text-2xl mb-2 ${isDark ? 'text-white' : 'text-black'}`} style={{ fontWeight: 200 }}>
              Verify Your Email
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              We've sent a 6-digit code to {email}
            </p>
            
            <div className="mb-6">
              <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                className={`w-full px-4 py-4 rounded-xl text-center text-2xl tracking-widest font-mono ${
                  isDark 
                    ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                    : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                } focus:outline-none transition-colors`}
                autoFocus
              />
            </div>

            <button
              onClick={handleEmailOtpVerify}
              disabled={loading || emailOtp.length !== 6}
              className="w-full bg-lime-400 hover:bg-lime-500 text-black font-medium py-4 rounded-full text-lg transition-colors disabled:opacity-50 mb-4"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <button
              onClick={() => {
                setStep("details");
                setEmailOtp("");
              }}
              className={`w-full py-3 rounded-xl text-sm transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              Back
            </button>
          </div>
        ) : step === "details" ? (
          <>
            <h1 className={`text-4xl mb-8 ${isDark ? 'text-white' : 'text-black'}`} style={{ fontWeight: 200, letterSpacing: '-0.01em' }}>
              Create your account
            </h1>

            {/* Social Login Buttons */}
            <div className="flex justify-center gap-4 mb-6">
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

            <div className={`flex items-center gap-4 mb-6`}>
              <div className={`flex-1 h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
              <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>or</span>
              <div className={`flex-1 h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Toggle Signup Method */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setSignupMethod(signupMethod === "email" ? "phone" : "email")}
                  className={`w-full py-3 px-4 rounded-xl text-sm ${
                    isDark 
                      ? 'bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-700' 
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300'
                  } transition-colors`}
                >
                  Sign up using {signupMethod === "email" ? "Phone Number" : "Email"}
                </button>
              </div>

              {/* Full Name */}
              <div className="mb-6">
                <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Full Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={`w-full px-4 py-4 rounded-xl text-base ${
                    isDark 
                      ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                      : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                  } focus:outline-none transition-colors`}
                />
              </div>

              {/* Country Selection */}
              <div className="mb-6">
                <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Country<span className="text-red-500">*</span>
                  {detectingCountry && (
                    <span className="ml-2 text-xs text-lime-400">Detecting...</span>
                  )}
                </label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className={`w-full h-12 ${
                    isDark 
                      ? 'bg-gray-900 text-white border border-gray-800' 
                      : 'bg-gray-50 text-black border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email or Phone */}
              {signupMethod === "email" ? (
                <div className="mb-6">
                  <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email Address<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full px-4 py-4 rounded-xl text-base ${
                      isDark 
                        ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                        : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                    } focus:outline-none transition-colors`}
                  />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Country
                    </label>
                    <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
                  </div>
                  <div className="mb-6">
                    <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Phone Number<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className={`w-full px-4 py-4 rounded-xl text-base ${
                        isDark 
                          ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                          : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                      } focus:outline-none transition-colors`}
                    />
                  </div>
                </>
              )}

              {/* Password - Only shown for email signup */}
              {signupMethod === "email" && (
                <>
                  <div className="mb-6">
                    <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={`w-full px-4 py-4 rounded-xl text-base pr-12 ${
                          isDark 
                            ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                            : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                        } focus:outline-none transition-colors`}
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

                  {/* Confirm Password */}
                  <div className="mb-6">
                    <label className={`block mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Confirm Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`w-full px-4 py-4 rounded-xl text-base pr-12 ${
                          isDark 
                            ? 'bg-gray-900 text-white border border-gray-800 focus:border-lime-400' 
                            : 'bg-gray-50 text-black border border-gray-200 focus:border-lime-500'
                        } focus:outline-none transition-colors`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Terms and Conditions */}
              <div className={`text-xs mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                By continuing, you acknowledge that you have read and agree to Pexly's{" "}
                <a href="#" className={`${isDark ? 'text-lime-400' : 'text-lime-600'} hover:underline`}>
                  Terms and conditions
                </a>{" "}
                and{" "}
                <a href="#" className={`${isDark ? 'text-lime-400' : 'text-lime-600'} hover:underline`}>
                  Privacy policy
                </a>
              </div>

              {/* Create Account Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-lime-400 hover:bg-lime-500 text-black font-medium py-4 rounded-full text-lg transition-colors disabled:opacity-50" 
                style={{ fontWeight: 500 }}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              {/* Sign In Link */}
              <div className={`text-center mt-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Have an account?{' '}
                <a href="/signin" className={`${isDark ? 'text-lime-400' : 'text-lime-600'} hover:underline font-medium`}>
                  Log in
                </a>
              </div>
            </form>
          </>
        ) : (
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
            <h2 className={`text-2xl mb-2 ${isDark ? 'text-white' : 'text-black'}`} style={{ fontWeight: 200 }}>
              Phone Verification
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {signupMethod === "phone" 
                ? "Verify your phone number to complete signup"
                : "Verify your phone number to unlock Level 1 trading (Optional)"}
            </p>
            <PhoneVerification
              onVerified={handlePhoneVerified}
              onSkip={signupMethod === "email" ? handleSkipPhone : undefined}
              initialPhone={phoneNumber}
              initialCountryCode={countryCode}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
