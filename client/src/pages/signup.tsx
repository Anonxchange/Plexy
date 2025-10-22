import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Zap } from "lucide-react";
import { FaGoogle, FaApple, FaFacebook } from "react-icons/fa";
import { PhoneVerification } from "@/components/phone-verification";
import { createClient } from "@/lib/supabase";
import { CountryCodeSelector } from "@/components/country-code-selector";

export function SignUp() {
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "phone">("details");
  const [userId, setUserId] = useState<string | null>(null);
  const { signUp } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    // Validate based on signup method
    if (signupMethod === "email" && !email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    if (signupMethod === "phone" && !phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    if (signupMethod === "phone") {
      // For phone signup, we need to verify the phone first, then create account
      // Store the signup data and move to phone verification
      setUserId("pending"); // Temporary ID to indicate pending verification
      setLoading(false);
      setStep("phone");
    } else {
      // Email signup - create account with email/password
      const { error } = await signUp(email, password);
      setLoading(false);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setUserId(data.user.id);
          // Optional phone verification for email signups
          setStep("phone");
        }
      }
    }
  };

  const handlePhoneVerified = async (verifiedPhoneNumber: string) => {
    // For phone signups, create the account now that phone is verified
    if (signupMethod === "phone" && userId === "pending") {
      setLoading(true);
      
      // Create account with email/password (use phone as email identifier)
      const tempEmail = `${verifiedPhoneNumber.replace(/\+/g, '')}@pexly.phone`;
      const { error } = await signUp(tempEmail, password);
      
      if (error) {
        setLoading(false);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Get the new user and update their profile with verified phone
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from('user_profiles').update({
          phone_number: verifiedPhoneNumber,
          phone_verified: true,
          full_name: fullName,
        }).eq('id', data.user.id);

        toast({
          title: "Success!",
          description: "Phone verified! Account created successfully!",
        });
        setLocation("/dashboard");
      }
      setLoading(false);
    } else if (userId && userId !== "pending") {
      // For email signups, just update the phone number
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">Pexly</h1>
          </div>
          {step === "details" && (
            <h2 className="text-2xl font-semibold mb-2">
              Create your free Pexly account
            </h2>
          )}
          {step === "phone" && (
            <h2 className="text-2xl font-semibold mb-2">
              Phone Verification
            </h2>
          )}
        </div>

        <Card className="shadow-xl">
          <CardContent className="pt-6">
            {step === "details" ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 text-base"
                  onClick={() => setSignupMethod(signupMethod === "email" ? "phone" : "email")}
                >
                  Sign up using {signupMethod === "email" ? "Phone Number" : "Email"}
                </Button>

                <div className="flex items-center justify-center gap-4 my-6">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-12 h-12 rounded-full border-2"
                    onClick={() => toast({ title: "Coming soon", description: "Google sign-in will be available soon" })}
                  >
                    <FaGoogle className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-12 h-12 rounded-full border-2"
                    onClick={() => toast({ title: "Coming soon", description: "Facebook sign-in will be available soon" })}
                  >
                    <FaFacebook className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-12 h-12 rounded-full border-2"
                    onClick={() => toast({ title: "Coming soon", description: "Apple sign-in will be available soon" })}
                  >
                    <FaApple className="h-6 w-6" />
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mb-4">
                  or sign up with your {signupMethod === "email" ? "email" : "mobile number"}
                </p>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                {signupMethod === "email" ? (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Country</Label>
                      <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Referral code (optional)</Label>
                      <Input
                        type="text"
                        placeholder="Enter referral code (optional)"
                        className="h-12"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-4">
                  By continuing, you acknowledge that you have read and agree to Pexly's{" "}
                  <a href="#" className="text-primary hover:underline">Terms and conditions</a> and{" "}
                  <a href="#" className="text-primary hover:underline">Privacy policy</a>
                </div>

                <Button type="submit" className="w-full h-14 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base" size="lg" disabled={loading}>
                  {loading ? "Creating your account..." : "Create account"}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Have an account?{" "}
                  <a href="/signin" className="text-primary hover:underline font-medium">
                    Log in
                  </a>
                </p>
              </form>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Phone Verification</CardTitle>
                  <CardDescription>
                    {signupMethod === "phone" 
                      ? "Verify your phone number to complete signup"
                      : "Verify your phone number to unlock Level 1 trading (Optional)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhoneVerification
                    onVerified={handlePhoneVerified}
                    onSkip={signupMethod === "email" ? handleSkipPhone : undefined}
                    initialPhone={phoneNumber}
                    initialCountryCode={countryCode}
                  />
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}