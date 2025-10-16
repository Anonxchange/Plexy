import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FaGoogle, FaApple } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

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
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-8">
            Pexly
          </h1>
          <h2 className="text-2xl font-semibold text-white mb-6">
            Welcome to Pexly
          </h2>
        </div>

        <Card className="bg-[#2a2a2a] border-0 shadow-xl">
          <CardContent className="pt-6 space-y-6">
            {/* Social Login Buttons */}
            <div className="flex justify-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-12 h-12 rounded-full bg-transparent hover:bg-[#3a3a3a]"
                onClick={() => toast({ title: "Coming soon", description: "Google sign-in will be available soon" })}
              >
                <FaGoogle className="h-6 w-6 text-white" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-12 h-12 rounded-full bg-transparent hover:bg-[#3a3a3a]"
                onClick={() => toast({ title: "Coming soon", description: "Apple sign-in will be available soon" })}
              >
                <FaApple className="h-6 w-6 text-white" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email/Phone number</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email/Phone"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-[#3a3a3a] border-[#4a4a4a] text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-[#3a3a3a] border-[#4a4a4a] text-white placeholder:text-gray-500 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
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

              <p className="text-center text-sm text-gray-400 mt-4">
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
