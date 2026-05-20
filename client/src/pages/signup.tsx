import { useHead } from "@unhead/react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import portraitImage from "@assets/young-woman-portrait-close-up_1_3_optimized.webp";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Sun, Moon, MapPin, Check, X } from "lucide-react";
import { PexlyIcon } from "@/components/pexly-icon";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaFacebook } from "react-icons/fa";
import { PhoneVerification } from "@/components/phone-verification";
import { supabase } from "@/lib/supabase";
import { CountryCodeSelector } from "@/components/country-code-selector";
import { useTheme } from "@/components/theme-provider";
import { amlScreening } from "@/lib/security/aml-screening";
import { deviceFingerprint } from "@/lib/security/device-fingerprint";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PasswordRequirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

const COMMON_PASSWORDS = [
  "password","password1","password123","12345678","123456789","1234567890",
  "qwerty123","iloveyou","admin123","letmein","welcome1","monkey123",
  "dragon123","master123","abc12345","passw0rd","p@ssword","p@ssw0rd",
];

function hasRepeatedChars(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}

function validatePassword(password: string): { isValid: boolean; score: number; requirements: PasswordRequirement[] } {
  const requirements: PasswordRequirement[] = [
    { label: "At least 8 characters", regex: /.{8,}/, met: false },
    { label: "One uppercase letter (A-Z)", regex: /[A-Z]/, met: false },
    { label: "One lowercase letter (a-z)", regex: /[a-z]/, met: false },
    { label: "One number (0-9)", regex: /[0-9]/, met: false },
    { label: "One special character (!@#$%^&*)", regex: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/, met: false },
  ];

  requirements.forEach((req) => {
    req.met = req.regex.test(password);
  });

  const commonFail = isCommonPassword(password);
  if (commonFail) {
    requirements.forEach((req) => { req.met = false; });
  }

  const metCount = requirements.filter((r) => r.met).length;
  const score = commonFail ? 0 : Math.round((metCount / requirements.length) * 100);
  const isValid = !commonFail && requirements.every((req) => req.met);
  return { isValid, score, requirements };
}

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
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹" },
].sort((a, b) => a.name.localeCompare(b.name));

export function SignUp() {
  useHead({ title: "Create Account | Pexly", meta: [{ name: "description", content: "Create a free Pexly account and get access to crypto swaps, staking, gift cards, and more." }] });
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  // Auto-detect country on mount
  useEffect(() => {
    detectCountry();
  }, []);

  const detectCountry = async () => {
    setDetectingCountry(true);
    try {
      const { getCountryCode, getCallingCode } = await import("@/lib/geo");
      const iso = await getCountryCode();
      const detectedCountry = countries.find(c => c.code === iso);
      if (detectedCountry) {
        setCountry(iso);
        const calling = await getCallingCode();
        setCountryCode(calling);
      }
    } catch (error) {
      console.error('Failed to detect country:', error);
    } finally {
      setDetectingCountry(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  // Countdown timer for OTP expiry and resend cooldown
  useEffect(() => {
    if (step !== "email_verify") return;

    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

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

      if (!passwordValidation.isValid) {
        const missingReqs = passwordValidation.requirements
          .filter((r) => !r.met)
          .map((r) => r.label)
          .join(", ");
        toast({
          title: "Weak Password",
          description: `Password must have: ${missingReqs}`,
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
        const errorData = await response.json().catch(() => ({}));
        console.error("Send verification error:", response.status, errorData);
        toast({
          title: "Error",
          description: errorData.error || "Failed to send verification code. Please try again.",
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
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-email`, {
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

      const data = await response.json().catch(() => ({}));

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
        try {
          await deviceFingerprint.registerDeviceAsTrusted(userData.user.id);
        } catch (error) {
          console.error('Error auto-trusting device during signup:', error);
        }
        setUserId(userData.user.id);
        setStep("phone");
      }
    } catch (error) {
      console.error("Email OTP verify error:", error);
      toast({
        title: "Verification Failed",
        description: "Something went wrong. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          // Always start new accounts in USD. Country is stored above for
          // localisation, but the displayed currency stays USD until the
          // user explicitly picks a different one in settings/header.
          preferred_currency: 'usd',
        }, {
          onConflict: 'id'
        });

        try {
          await deviceFingerprint.registerDeviceAsTrusted(data.user.id);
        } catch (error) {
          console.error('Error auto-trusting device during phone signup:', error);
        }

        // Sign out the user after successful signup
        await supabase.auth.signOut();

        toast({
          title: "Success!",
          description: "Account created successfully! Please sign in to continue.",
        });
        setLocation("/signin");
      }
    } else if (userId && userId !== "pending") {
      // Email signup → Adding phone to existing email account
      await supabase.from('user_profiles').update({
        phone_number: verifiedPhoneNumber,
        phone_verified: true,
      }).eq('id', userId);

      // Sign out the user after successful signup
      await supabase.auth.signOut();

      toast({
        title: "Success!",
        description: "Account created successfully! Please sign in to continue.",
      });
      setLocation("/signin");
    }
  };

  const handleSkipPhone = async () => {
    // Sign out the user after successful signup
    await supabase.auth.signOut();

    toast({
      title: "Account Created!",
      description: "Please sign in to continue. You can verify your phone later in settings.",
    });
    setLocation("/signin");
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: errorData.error || "Failed to resend verification code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setOtpCountdown(300);
      setResendCooldown(60);
      setEmailOtp("");
      toast({
        title: "Code resent!",
        description: "We've sent a new 6-digit verification code to your email.",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <div className="p-6 flex justify-between items-center lg:absolute lg:top-0 lg:left-0 lg:right-0 lg:z-10">
        <a href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <PexlyIcon className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-foreground">
            Pexly
          </span>
        </a>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full bg-muted text-foreground transition-colors"
        >
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Desktop 2-Column Layout */}
      <div className="lg:grid lg:grid-cols-2 lg:min-h-screen">
        {/* Left Column: Form */}
        <div className="px-6 pt-8 lg:pt-20 max-w-md mx-auto pb-12 lg:flex lg:flex-col lg:justify-center w-full">
        {step === "email_verify" ? (
          <div className="rounded-2xl p-6 bg-card border border-border">
            <h2 className="text-2xl mb-2 text-foreground" style={{ fontWeight: 200 }}>
              Verify Your Email
            </h2>
            <p className="text-sm mb-6 text-muted-foreground">
              We've sent a 6-digit code to {email}
            </p>
            
            <div className="mb-6">
              <label className="block mb-2 text-sm text-muted-foreground">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-4 rounded-xl text-center text-2xl tracking-widest font-mono bg-background text-foreground border border-input focus:border-primary focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* Countdown Timer */}
            <div className="mb-4 text-center">
              <p className={`text-sm ${otpCountdown > 30 ? 'text-muted-foreground' : 'text-red-500 font-medium'}`}>
                Code expires in: <span className="font-mono font-bold">{Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}</span>
              </p>
            </div>

            <button
              onClick={handleEmailOtpVerify}
              disabled={loading || emailOtp.length !== 6}
              className="w-full bg-lime-400 hover:bg-lime-500 text-black font-medium py-4 rounded-full text-lg transition-colors disabled:opacity-50 mb-3"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            {/* Resend Button */}
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isResending}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors mb-4 ${
                resendCooldown > 0 || isResending
                  ? 'text-muted-foreground bg-muted cursor-not-allowed'
                  : 'text-primary hover:text-primary/80 hover:bg-muted'
              }`}
            >
              {isResending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>

            <button
              onClick={() => {
                setStep("details");
                setEmailOtp("");
                setOtpCountdown(60);
              }}
              className="w-full py-3 rounded-xl text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Back
            </button>
          </div>
        ) : step === "details" ? (
          <>
            <h1 className="text-4xl mb-8 text-foreground" style={{ fontWeight: 200, letterSpacing: '-0.01em' }}>
              Create your account
            </h1>

            {/* Social Login Buttons */}
            <div className="flex justify-center gap-4 mb-6">
              <button 
                type="button"
                onClick={() => toast({ title: "Coming soon", description: "Google sign-in will be available soon" })}
                className="w-12 h-12 rounded-full border-2 border-border hover:border-border/60 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              >
                <FcGoogle className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => toast({ title: "Coming soon", description: "Facebook sign-in will be available soon" })}
                className="w-12 h-12 rounded-full border-2 border-border hover:border-border/60 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              >
                <FaFacebook className="w-5 h-5 text-[#1877F2]" />
              </button>
              <button 
                type="button"
                onClick={() => toast({ title: "Coming soon", description: "Apple sign-in will be available soon" })}
                className="w-12 h-12 rounded-full border-2 border-border hover:border-border/60 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              >
                <FaApple className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Toggle Signup Method */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setSignupMethod(signupMethod === "email" ? "phone" : "email")}
                  className="w-full py-3 px-4 rounded-xl text-sm bg-card text-muted-foreground border border-border hover:border-border/60 transition-colors"
                >
                  Sign up using {signupMethod === "email" ? "Phone Number" : "Email"}
                </button>
              </div>

              {/* Full Name */}
              <div className="mb-6">
                <label className="block mb-2 text-sm text-muted-foreground">
                  Full Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-4 rounded-xl text-base bg-background text-foreground border border-input focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Country Selection */}
              <div className="mb-6">
                <label className="block mb-2 text-sm text-muted-foreground">
                  Country<span className="text-red-500">*</span>
                  {detectingCountry && (
                    <span className="ml-2 text-xs text-lime-400">Detecting...</span>
                  )}
                </label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-full h-12 bg-background text-foreground border border-input">
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
                  <label className="block mb-2 text-sm text-muted-foreground">
                    Email Address<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-4 rounded-xl text-base bg-background text-foreground border border-input focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block mb-2 text-sm text-muted-foreground">
                      Phone Number<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="flex-1 px-4 py-4 rounded-xl text-base bg-background text-foreground border border-input focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password - Only shown for email signup */}
              {signupMethod === "email" && (
                <>
                  <div className="mb-6">
                    <label className="block mb-2 text-sm text-muted-foreground">
                      Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-4 rounded-xl text-base pr-12 bg-background text-foreground border border-input focus:border-primary focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {/* Password Strength + Requirements */}
                    {password.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-muted">
                        {/* Strength bar */}
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Strength</span>
                          <span className={
                            passwordValidation.score >= 100 ? 'text-green-500 font-semibold' :
                            passwordValidation.score >= 60  ? 'text-yellow-500 font-semibold' :
                            'text-red-500 font-semibold'
                          }>
                            {passwordValidation.score >= 100 ? 'Strong' :
                             passwordValidation.score >= 60  ? 'Fair' : 'Weak'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full mb-3 overflow-hidden bg-muted-foreground/20">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              passwordValidation.score >= 100 ? 'bg-green-500' :
                              passwordValidation.score >= 60  ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`}
                            style={{ width: `${passwordValidation.score}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium mb-2 text-foreground">
                          Requirements:
                        </p>
                        <ul className="space-y-1">
                          {passwordValidation.requirements.map((req, index) => (
                            <li key={index} className="flex items-center gap-2 text-xs">
                              {req.met ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <X className="w-3 h-3 text-red-400" />
                              )}
                              <span className={req.met ? 'text-green-500' : 'text-muted-foreground'}>
                                {req.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-6">
                    <label className="block mb-2 text-sm text-muted-foreground">
                      Confirm Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-4 rounded-xl text-base pr-12 bg-background text-foreground border border-input focus:border-primary focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Terms and Conditions */}
              <div className="text-xs mb-6 text-muted-foreground">
                By continuing, you acknowledge that you have read and agree to Pexly's{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms and conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy policy
                </a>
              </div>

              {/* Cloudflare Turnstile CAPTCHA */}
              {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                <div className="mb-6 flex flex-col items-center gap-2">
                  {captchaError ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-destructive">
                        Captcha failed to load.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCaptchaError(false);
                          setCaptchaToken(null);
                          setCaptchaKey(k => k + 1);
                        }}
                        className="text-sm underline text-primary"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <Turnstile
                      key={captchaKey}
                      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                      onSuccess={(token) => { setCaptchaToken(token); setCaptchaError(false); }}
                      onError={() => { setCaptchaToken(null); setCaptchaError(true); }}
                      onExpire={() => { setCaptchaToken(null); setCaptchaError(false); }}
                      options={{
                        theme: theme === 'dark' ? 'dark' : 'light',
                      }}
                    />
                  )}
                </div>
              )}

              {/* Create Account Button */}
              <button 
                type="submit"
                disabled={loading || (!!import.meta.env.VITE_TURNSTILE_SITE_KEY && !captchaToken && !captchaError)}
                className="w-full bg-lime-400 hover:bg-lime-500 text-black font-medium py-4 rounded-full text-lg transition-colors disabled:opacity-50" 
                style={{ fontWeight: 500 }}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              {/* Sign In Link */}
              <div className="text-center mt-8 text-sm text-muted-foreground">
                Have an account?{' '}
                <a href="/signin" className="text-primary hover:underline font-medium">
                  Log in
                </a>
              </div>
            </form>
          </>
        ) : (
          <div className="rounded-2xl p-6 bg-card border border-border">
            <h2 className="text-2xl mb-2 text-foreground" style={{ fontWeight: 200 }}>
              Phone Verification
            </h2>
            <p className="text-sm mb-6 text-muted-foreground">
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
    </div>
  );
}
