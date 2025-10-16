import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { FaGoogle, FaApple } from "react-icons/fa";
import { PhoneVerification } from "@/components/phone-verification";
import { createClient } from "@/lib/supabase";

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

    // Use email for signup (phone will be stored separately)
    const signupEmail = signupMethod === "email" ? email : `${countryCode}${phoneNumber}@phone.temp`;
    const { error } = await signUp(signupEmail, password, fullName);
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

        // Save phone number if signing up with phone (it will be verified in next step)
        if (signupMethod === "phone" && phoneNumber) {
          const fullPhoneNumber = countryCode + phoneNumber;
          await supabase.from('user_profiles').update({
            phone_number: fullPhoneNumber,
            phone_verified: false, // Not verified yet
          }).eq('id', data.user.id);
          setStep("phone"); // Go to phone verification step
        } else {
          // Email signup - skip phone verification or make it optional
          setStep("phone");
        }
      }
    }
  };

  const handlePhoneVerified = async (phoneNumber: string) => {
    if (!userId) return;

    await supabase.from('user_profiles').update({
      phone_number: phoneNumber,
      phone_verified: true,
    }).eq('id', userId);

    toast({
      title: "Success!",
      description: "Phone verified! Account created successfully!",
    });
    setLocation("/dashboard");
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
          <h1 className="text-4xl font-bold text-primary mb-8">
            Pexly
          </h1>
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
                    variant="ghost" 
                    size="icon" 
                    className="w-12 h-12 rounded-full"
                    onClick={() => toast({ title: "Coming soon", description: "Google sign-in will be available soon" })}
                  >
                    <FaGoogle className="h-8 w-8" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-12 h-12 rounded-full"
                    onClick={() => toast({ title: "Coming soon", description: "Apple sign-in will be available soon" })}
                  >
                    <FaApple className="h-8 w-8" />
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
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-full h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="+234">🇳🇬 Nigeria +234</SelectItem>
                          <SelectItem value="+1">🇺🇸 United States +1</SelectItem>
                          <SelectItem value="+44">🇬🇧 United Kingdom +44</SelectItem>
                          <SelectItem value="+93">🇦🇫 Afghanistan +93</SelectItem>
                          <SelectItem value="+355">🇦🇱 Albania +355</SelectItem>
                          <SelectItem value="+213">🇩🇿 Algeria +213</SelectItem>
                          <SelectItem value="+376">🇦🇩 +376</SelectItem>
                          <SelectItem value="+244">🇦🇴 +244</SelectItem>
                          <SelectItem value="+54">🇦🇷 +54</SelectItem>
                          <SelectItem value="+374">🇦🇲 +374</SelectItem>
                          <SelectItem value="+61">🇦🇺 +61</SelectItem>
                          <SelectItem value="+43">🇦🇹 +43</SelectItem>
                          <SelectItem value="+994">🇦🇿 +994</SelectItem>
                          <SelectItem value="+973">🇧🇭 +973</SelectItem>
                          <SelectItem value="+880">🇧🇩 +880</SelectItem>
                          <SelectItem value="+375">🇧🇾 +375</SelectItem>
                          <SelectItem value="+32">🇧🇪 +32</SelectItem>
                          <SelectItem value="+229">🇧🇯 +229</SelectItem>
                          <SelectItem value="+975">🇧🇹 +975</SelectItem>
                          <SelectItem value="+591">🇧🇴 +591</SelectItem>
                          <SelectItem value="+387">🇧🇦 +387</SelectItem>
                          <SelectItem value="+267">🇧🇼 +267</SelectItem>
                          <SelectItem value="+55">🇧🇷 +55</SelectItem>
                          <SelectItem value="+673">🇧🇳 +673</SelectItem>
                          <SelectItem value="+359">🇧🇬 +359</SelectItem>
                          <SelectItem value="+226">🇧🇫 +226</SelectItem>
                          <SelectItem value="+257">🇧🇮 +257</SelectItem>
                          <SelectItem value="+855">🇰🇭 +855</SelectItem>
                          <SelectItem value="+237">🇨🇲 Cameroon +237</SelectItem>
                          <SelectItem value="+238">🇨🇻 Cape Verde +238</SelectItem>
                          <SelectItem value="+236">🇨🇫 +236</SelectItem>
                          <SelectItem value="+235">🇹🇩 +235</SelectItem>
                          <SelectItem value="+56">🇨🇱 +56</SelectItem>
                          <SelectItem value="+86">🇨🇳 +86</SelectItem>
                          <SelectItem value="+57">🇨🇴 +57</SelectItem>
                          <SelectItem value="+243">🇨🇩 +243</SelectItem>
                          <SelectItem value="+506">🇨🇷 +506</SelectItem>
                          <SelectItem value="+385">🇭🇷 +385</SelectItem>
                          <SelectItem value="+53">🇨🇺 +53</SelectItem>
                          <SelectItem value="+357">🇨🇾 +357</SelectItem>
                          <SelectItem value="+420">🇨🇿 +420</SelectItem>
                          <SelectItem value="+45">🇩🇰 +45</SelectItem>
                          <SelectItem value="+253">🇩🇯 +253</SelectItem>
                          <SelectItem value="+593">🇪🇨 +593</SelectItem>
                          <SelectItem value="+20">🇪🇬 +20</SelectItem>
                          <SelectItem value="+503">🇸🇻 +503</SelectItem>
                          <SelectItem value="+372">🇪🇪 +372</SelectItem>
                          <SelectItem value="+251">🇪🇹 +251</SelectItem>
                          <SelectItem value="+358">🇫🇮 +358</SelectItem>
                          <SelectItem value="+33">🇫🇷 +33</SelectItem>
                          <SelectItem value="+241">🇬🇦 +241</SelectItem>
                          <SelectItem value="+220">🇬🇲 +220</SelectItem>
                          <SelectItem value="+995">🇬🇪 +995</SelectItem>
                          <SelectItem value="+49">🇩🇪 +49</SelectItem>
                          <SelectItem value="+233">🇬🇭 +233</SelectItem>
                          <SelectItem value="+30">🇬🇷 +30</SelectItem>
                          <SelectItem value="+502">🇬🇹 +502</SelectItem>
                          <SelectItem value="+224">🇬🇳 +224</SelectItem>
                          <SelectItem value="+509">🇭🇹 +509</SelectItem>
                          <SelectItem value="+504">🇭🇳 +504</SelectItem>
                          <SelectItem value="+852">🇭🇰 +852</SelectItem>
                          <SelectItem value="+36">🇭🇺 +36</SelectItem>
                          <SelectItem value="+354">🇮🇸 +354</SelectItem>
                          <SelectItem value="+91">🇮🇳 +91</SelectItem>
                          <SelectItem value="+62">🇮🇩 +62</SelectItem>
                          <SelectItem value="+98">🇮🇷 +98</SelectItem>
                          <SelectItem value="+964">🇮🇶 +964</SelectItem>
                          <SelectItem value="+353">🇮🇪 +353</SelectItem>
                          <SelectItem value="+972">🇮🇱 +972</SelectItem>
                          <SelectItem value="+39">🇮🇹 +39</SelectItem>
                          <SelectItem value="+225">🇨🇮 +225</SelectItem>
                          <SelectItem value="+81">🇯🇵 Japan +81</SelectItem>
                          <SelectItem value="+962">🇯🇴 Jordan +962</SelectItem>
                          <SelectItem value="+76">🇰🇿 Kazakhstan +76</SelectItem>
                          <SelectItem value="+254">🇰🇪 Kenya +254</SelectItem>
                          <SelectItem value="+965">🇰🇼 +965</SelectItem>
                          <SelectItem value="+996">🇰🇬 +996</SelectItem>
                          <SelectItem value="+856">🇱🇦 +856</SelectItem>
                          <SelectItem value="+371">🇱🇻 +371</SelectItem>
                          <SelectItem value="+961">🇱🇧 +961</SelectItem>
                          <SelectItem value="+266">🇱🇸 +266</SelectItem>
                          <SelectItem value="+231">🇱🇷 +231</SelectItem>
                          <SelectItem value="+218">🇱🇾 +218</SelectItem>
                          <SelectItem value="+370">🇱🇹 +370</SelectItem>
                          <SelectItem value="+352">🇱🇺 +352</SelectItem>
                          <SelectItem value="+389">🇲🇰 +389</SelectItem>
                          <SelectItem value="+261">🇲🇬 +261</SelectItem>
                          <SelectItem value="+265">🇲🇼 +265</SelectItem>
                          <SelectItem value="+60">🇲🇾 +60</SelectItem>
                          <SelectItem value="+960">🇲🇻 +960</SelectItem>
                          <SelectItem value="+223">🇲🇱 +223</SelectItem>
                          <SelectItem value="+356">🇲🇹 +356</SelectItem>
                          <SelectItem value="+222">🇲🇷 +222</SelectItem>
                          <SelectItem value="+230">🇲🇺 +230</SelectItem>
                          <SelectItem value="+52">🇲🇽 +52</SelectItem>
                          <SelectItem value="+373">🇲🇩 +373</SelectItem>
                          <SelectItem value="+377">🇲🇨 +377</SelectItem>
                          <SelectItem value="+976">🇲🇳 +976</SelectItem>
                          <SelectItem value="+382">🇲🇪 +382</SelectItem>
                          <SelectItem value="+212">🇲🇦 +212</SelectItem>
                          <SelectItem value="+258">🇲🇿 +258</SelectItem>
                          <SelectItem value="+95">🇲🇲 +95</SelectItem>
                          <SelectItem value="+264">🇳🇦 +264</SelectItem>
                          <SelectItem value="+977">🇳🇵 +977</SelectItem>
                          <SelectItem value="+31">🇳🇱 +31</SelectItem>
                          <SelectItem value="+64">🇳🇿 +64</SelectItem>
                          <SelectItem value="+505">🇳🇮 +505</SelectItem>
                          <SelectItem value="+227">🇳🇪 +227</SelectItem>
                          <SelectItem value="+850">🇰🇵 +850</SelectItem>
                          <SelectItem value="+47">🇳🇴 +47</SelectItem>
                          <SelectItem value="+968">🇴🇲 +968</SelectItem>
                          <SelectItem value="+92">🇵🇰 +92</SelectItem>
                          <SelectItem value="+970">🇵🇸 +970</SelectItem>
                          <SelectItem value="+507">🇵🇦 +507</SelectItem>
                          <SelectItem value="+595">🇵🇾 +595</SelectItem>
                          <SelectItem value="+51">🇵🇪 +51</SelectItem>
                          <SelectItem value="+63">🇵🇭 +63</SelectItem>
                          <SelectItem value="+48">🇵🇱 +48</SelectItem>
                          <SelectItem value="+351">🇵🇹 +351</SelectItem>
                          <SelectItem value="+974">🇶🇦 +974</SelectItem>
                          <SelectItem value="+40">🇷🇴 Romania +40</SelectItem>
                          <SelectItem value="+250">🇷🇼 Rwanda +250</SelectItem>
                          <SelectItem value="+966">🇸🇦 +966</SelectItem>
                          <SelectItem value="+221">🇸🇳 +221</SelectItem>
                          <SelectItem value="+381">🇷🇸 +381</SelectItem>
                          <SelectItem value="+65">🇸🇬 +65</SelectItem>
                          <SelectItem value="+421">🇸🇰 +421</SelectItem>
                          <SelectItem value="+386">🇸🇮 +386</SelectItem>
                          <SelectItem value="+252">🇸🇴 +252</SelectItem>
                          <SelectItem value="+27">🇿🇦 +27</SelectItem>
                          <SelectItem value="+82">🇰🇷 +82</SelectItem>
                          <SelectItem value="+211">🇸🇸 +211</SelectItem>
                          <SelectItem value="+34">🇪🇸 +34</SelectItem>
                          <SelectItem value="+94">🇱🇰 +94</SelectItem>
                          <SelectItem value="+249">🇸🇩 +249</SelectItem>
                          <SelectItem value="+46">🇸🇪 +46</SelectItem>
                          <SelectItem value="+41">🇨🇭 +41</SelectItem>
                          <SelectItem value="+963">🇸🇾 +963</SelectItem>
                          <SelectItem value="+886">🇹🇼 +886</SelectItem>
                          <SelectItem value="+992">🇹🇯 +992</SelectItem>
                          <SelectItem value="+255">🇹🇿 +255</SelectItem>
                          <SelectItem value="+66">🇹🇭 +66</SelectItem>
                          <SelectItem value="+228">🇹🇬 +228</SelectItem>
                          <SelectItem value="+216">🇹🇳 +216</SelectItem>
                          <SelectItem value="+90">🇹🇷 +90</SelectItem>
                          <SelectItem value="+993">🇹🇲 +993</SelectItem>
                          <SelectItem value="+256">🇺🇬 +256</SelectItem>
                          <SelectItem value="+380">🇺🇦 +380</SelectItem>
                          <SelectItem value="+971">🇦🇪 +971</SelectItem>
                          <SelectItem value="+598">🇺🇾 +598</SelectItem>
                          <SelectItem value="+998">🇺🇿 +998</SelectItem>
                          <SelectItem value="+58">🇻🇪 +58</SelectItem>
                          <SelectItem value="+84">🇻🇳 +84</SelectItem>
                          <SelectItem value="+967">🇾🇪 +967</SelectItem>
                          <SelectItem value="+260">🇿🇲 +260</SelectItem>
                          <SelectItem value="+263">🇿🇼 +263</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone number</Label>
                        <Button variant="link" className="text-primary text-sm p-0 h-auto">
                          Send code
                        </Button>
                      </div>
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