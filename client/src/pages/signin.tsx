import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FaGoogle, FaApple, FaFacebook } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";
import { CountryCodeSelector } from "@/components/country-code-selector";

export function SignIn() {
  const [inputValue, setInputValue] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [isPhoneNumber, setIsPhoneNumber] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Detect if input is a phone number (starts with + or contains only numbers)
  useEffect(() => {
    const value = inputValue.trim();
    const isPhone = /^[\d\s\-\(\)]+$/.test(value) || value.startsWith('+');
    setIsPhoneNumber(isPhone && value.length > 0);
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // For phone numbers, use phone authentication
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

    // Email sign-in
    const { error } = await signIn(inputValue, password);

    if (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "You have successfully signed in",
      });
      // Small delay to ensure auth state updates
      setTimeout(() => {
        setLoading(false);
        setLocation("/dashboard");
      }, 100);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-8">
            Pexly
          </h1>
          <h2 className="text-2xl font-semibold mb-6">
            Welcome to Pexly
          </h2>
        </div>

        <Card className="shadow-xl">
          <CardContent className="pt-6 space-y-6">
            {/* Social Login Buttons */}
            <div className="flex justify-center gap-4">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {isPhoneNumber && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Country Code</Label>
                  <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {isPhoneNumber ? "Phone number" : "Email/Phone number"}
                </Label>
                <div className="relative">
                  {isPhoneNumber && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {countryCode}
                    </span>
                  )}
                  <Input
                    id="email"
                    type={isPhoneNumber ? "tel" : "email"}
                    placeholder={isPhoneNumber ? "123456789" : "Email or Phone"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    required
                    className={`h-12 ${isPhoneNumber ? 'pl-16' : ''}`}
                  />
                </div>
                {isPhoneNumber && (
                  <p className="text-xs text-muted-foreground">
                    Phone number detected - Country code: {countryCode}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
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
                <div className="text-right">
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
              </div>
              <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-semibold text-base" size="lg" disabled={loading}>
                {loading ? "Signing in..." : "Log in"}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                No account yet?{" "}
                <a href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
