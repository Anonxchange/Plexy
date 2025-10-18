import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Globe,
  Bell,
  Shield,
  Smartphone,
  Building2,
  Code,
  CheckCircle2,
  Link2,
  Info,
  Upload,
  Check,
  HelpCircle,
  Menu,
  X,
  ChevronsUpDown,
  Monitor,
  Laptop,
  Tablet
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "localization", label: "Localization", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "payment", label: "Payment Accounts", icon: Building2 },
  { id: "developer", label: "Developer", icon: Code },
  { id: "verification", label: "Verification", icon: CheckCircle2 },
  { id: "connected", label: "Connected Apps & Websites", icon: Link2 },
  { id: "security-questions", label: "Security Questions", icon: Info },
];

export function AccountSettings() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();

  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nameDisplay, setNameDisplay] = useState("hide");
  const [phoneVerified, setPhoneVerified] = useState(true);

  // Verification Data
  const [verificationLevel, setVerificationLevel] = useState(0);
  const [loadingVerification, setLoadingVerification] = useState(true);

  // Profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Security settings
  const [smsAuth, setSmsAuth] = useState(false);
  const [appAuth, setAppAuth] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification settings
  const [tradeUpdates, setTradeUpdates] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newOffers, setNewOffers] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Payment method dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentBankName, setPaymentBankName] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentAccountName, setPaymentAccountName] = useState("");
  const [paymentBankCode, setPaymentBankCode] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [openBankSelect, setOpenBankSelect] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Devices state
  const [devices, setDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // Nigerian Banks List
  const nigerianBanks = [
    { name: "Access Bank", code: "044" },
    { name: "Guaranty Trust Bank (GTBank)", code: "058" },
    { name: "First Bank of Nigeria", code: "011" },
    { name: "United Bank for Africa (UBA)", code: "033" },
    { name: "Zenith Bank", code: "057" },
    { name: "Fidelity Bank", code: "070" },
    { name: "Union Bank of Nigeria", code: "032" },
    { name: "Sterling Bank", code: "232" },
    { name: "Stanbic IBTC Bank", code: "221" },
    { name: "Polaris Bank", code: "076" },
    { name: "Wema Bank", code: "035" },
    { name: "Ecobank Nigeria", code: "050" },
    { name: "Keystone Bank", code: "082" },
    { name: "FCMB (First City Monument Bank)", code: "214" },
    { name: "Providus Bank", code: "101" },
    { name: "Jaiz Bank", code: "301" },
    { name: "Citibank Nigeria", code: "023" },
    { name: "Heritage Bank", code: "030" },
    { name: "Kuda Bank", code: "090267" },
    { name: "ALAT by Wema", code: "035A" },
    { name: "Opay", code: "999992" },
    { name: "Palmpay", code: "999991" },
    { name: "Moniepoint", code: "50515" },
    { name: "VFD Microfinance Bank", code: "566" },
    { name: "Standard Chartered Bank", code: "068" },
    { name: "Titan Trust Bank", code: "102" },
    { name: "Unity Bank", code: "215" },
    { name: "Suntrust Bank", code: "100" },
    { name: "Globus Bank", code: "103" },
    { name: "Rubies Bank", code: "125" },
    { name: "Custom Bank (Enter manually)", code: "CUSTOM" },
  ];

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    } else if (user) {
      fetchProfileData();
      fetchPaymentMethods();
      fetchVerificationLevel();
      fetchDevices();
    }
  }, [user, loading]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfileData(data);
        setUsername(data.username || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setCurrency(data.preferred_currency || 'usd');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchVerificationLevel = async () => {
    setLoadingVerification(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('verification_level')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.verification_level !== undefined) {
        setVerificationLevel(Number(data.verification_level));
      } else {
        setVerificationLevel(0); // Default to Level 0 if no record found
      }
    } catch (error) {
      console.error('Error fetching verification level:', error);
      setVerificationLevel(0); // Default to Level 0 on error
    } finally {
      setLoadingVerification(false);
    }
  };


  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_active', { ascending: false });

      if (error) throw error;

      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Device access revoked successfully"
      });

      fetchDevices();
    } catch (error) {
      console.error('Error revoking device:', error);
      toast({
        title: "Error",
        description: "Failed to revoke device access",
        variant: "destructive"
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updateData: any = {
        username: username.trim(),
        bio: bio,
        phone: phone,
        preferred_currency: currency,
      };

      console.log("Saving profile with currency:", currency, "updateData:", updateData);

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) {
        console.error("Error saving profile:", error);
        throw error;
      }

      console.log("Profile saved successfully with currency:", currency);

      toast({
        title: "Success!",
        description: "Profile updated successfully"
      });

      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Avatar uploaded successfully"
      });

      fetchProfileData();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Password updated successfully"
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      });
    }
  };

  const handleSavePaymentMethod = async () => {
    const finalBankName = paymentBankName === "Custom Bank (Enter manually)" ? customBankName : paymentBankName;

    if (!finalBankName || !paymentAccountNumber || !paymentAccountName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          payment_type: 'Bank Transfer',
          bank_name: finalBankName,
          account_number: paymentAccountNumber,
          account_name: paymentAccountName,
          bank_code: paymentBankCode || null,
          bank_address: bankAddress || null,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Payment method added successfully"
      });

      setShowPaymentDialog(false);
      setPaymentBankName("");
      setPaymentAccountNumber("");
      setPaymentAccountName("");
      setPaymentBankCode("");
      setCustomBankName("");
      setBankAddress("");
      fetchPaymentMethods(); // Refresh the list
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive"
      });
    }
  };

  const SidebarContent = () => (
    <div className="p-4 space-y-2">
      {settingsSections.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === section.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </div>
  );

  const ProfileSection = () => (
    <div className="space-y-6">
      {/* Email and Verification */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">({user?.email})</span>
            {profileData?.is_verified && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                ID verified
              </Badge>
            )}
          </div>
          <button className="text-primary hover:underline text-sm">
            Change Email
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Full Name</p>
          <p className="font-semibold">{profileData?.full_name || "Not set"}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
          <p className="font-semibold">{profileData?.date_of_birth || "Not set"}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Country</p>
          <p className="font-semibold">{profileData?.country || "Not set"}</p>
        </div>
      </div>

      {/* Your Name */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-lg font-semibold">Your name</Label>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          How would you like others to see your name during trades?
        </p>

        <RadioGroup value={nameDisplay} onValueChange={setNameDisplay}>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="initial" id="initial" />
              <Label htmlFor="initial" className="font-normal cursor-pointer">
                First name and initial
              </Label>
            </div>
            {profileData?.full_name && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {(() => {
                  const names = profileData.full_name.split(' ');
                  if (names.length >= 2) {
                    return `${names[0]} ${names[names.length - 1].charAt(0)}.`;
                  }
                  return profileData.full_name;
                })()}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="font-normal cursor-pointer">
                Full name
              </Label>
            </div>
            {profileData?.full_name && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {profileData.full_name}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hide" id="hide" />
              <Label htmlFor="hide" className="font-normal cursor-pointer">
                Hide fullname
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Preferred Currency */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Preferred currency</Label>
        <div className="flex gap-2">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">🇺🇸 US Dollar (USD)</SelectItem>
              <SelectItem value="eur">🇪🇺 Euro (EUR)</SelectItem>
              <SelectItem value="gbp">🇬🇧 British Pound (GBP)</SelectItem>
              <SelectItem value="ngn">🇳🇬 Nigerian Naira (NGN)</SelectItem>
              <SelectItem value="cad">🇨🇦 Canadian Dollar (CAD)</SelectItem>
              <SelectItem value="aud">🇦🇺 Australian Dollar (AUD)</SelectItem>
              <SelectItem value="jpy">🇯🇵 Japanese Yen (JPY)</SelectItem>
              <SelectItem value="chf">🇨🇭 Swiss Franc (CHF)</SelectItem>
              <SelectItem value="cny">🇨🇳 Chinese Yuan (CNY)</SelectItem>
              <SelectItem value="inr">🇮🇳 Indian Rupee (INR)</SelectItem>
              <SelectItem value="kes">🇰🇪 Kenyan Shilling (KES)</SelectItem>
              <SelectItem value="ghs">🇬🇭 Ghanaian Cedi (GHS)</SelectItem>
              <SelectItem value="zar">🇿🇦 South African Rand (ZAR)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleSaveProfile}
          >
            Save
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Select which currency your wallet will use
        </p>
      </div>

      {/* Profile Avatar */}
      <div className="flex justify-center py-6">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profileData?.avatar_url} alt="Profile" />
          <AvatarFallback className="bg-muted">
            <User className="h-16 w-16 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Username */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Username</Label>
        <div className="flex gap-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1"
          />
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleSaveProfile}
          >
            Save
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          You can change your username <span className="font-semibold">only once</span>
        </p>
      </div>

      {/* Upload Image */}
      <Label htmlFor="avatar-upload" className="cursor-pointer">
        <Button variant="outline" className="w-full justify-between h-14" disabled={uploadingAvatar}>
          <span>{uploadingAvatar ? "Uploading..." : "Upload image"}</span>
          <Upload className="h-5 w-5" />
        </Button>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
          disabled={uploadingAvatar}
        />
      </Label>
      <p className="text-sm text-muted-foreground">
        Upload a nice picture, preferably of yourself. If you upload any explicit or otherwise
        inappropriate image, we'll remove it immediately.
      </p>

      {/* Phone */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Phone</Label>
        <div className="flex gap-2 items-center">
          <Select defaultValue="ng">
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ng">🇳🇬</SelectItem>
              <SelectItem value="us">🇺🇸</SelectItem>
              <SelectItem value="gb">🇬🇧</SelectItem>
              <SelectItem value="ca">🇨🇦</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
            disabled={phoneVerified}
          />
          {phoneVerified && (
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <Check className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Reset Phone */}
      <div>
        <button className="text-primary hover:underline text-sm mb-3">
          Reset phone
        </button>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm">
                  You need to set answers to your security questions in case you have to reset or
                  change the phone number.
                </p>
                <button className="text-primary hover:underline text-sm">
                  Set answers
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bio */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Bio</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Your bio appears on your public profile"
          className="min-h-32 resize-none"
          maxLength={180}
        />
        <p className="text-sm text-muted-foreground">
          Maximum 3 lines and 180 characters ({bio.length}/180)
        </p>
      </div>
    </div>
  );

  const SecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Authentication</p>
                <p className="text-sm text-muted-foreground">Receive codes via SMS</p>
              </div>
              <Switch checked={smsAuth} onCheckedChange={setSmsAuth} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-muted-foreground">Use Google Authenticator or similar</p>
              </div>
              <Switch checked={appAuth} onCheckedChange={setAppAuth} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Password</h3>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleUpdatePassword}>Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const NotificationsSection = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Trade Updates</p>
              <p className="text-sm text-muted-foreground">Notifications about your trades</p>
            </div>
            <Switch checked={tradeUpdates} onCheckedChange={setTradeUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Price Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified of price changes</p>
            </div>
            <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Offers</p>
              <p className="text-sm text-muted-foreground">Notifications about new trading offers</p>
            </div>
            <Switch checked={newOffers} onCheckedChange={setNewOffers} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Promotional content and updates</p>
            </div>
            <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PaymentSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button onClick={() => setShowPaymentDialog(true)}>Add Payment Method</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment methods added yet</p>
              <p className="text-sm mt-2">Add a payment method to start trading</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{method.bank_name}</p>
                      <p className="text-sm text-muted-foreground">{method.account_name}</p>
                      <p className="text-sm text-muted-foreground">{method.account_number}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('payment_methods')
                          .delete()
                          .eq('id', method.id);

                        if (error) throw error;

                        toast({
                          title: "Success!",
                          description: "Payment method removed"
                        });

                        fetchPaymentMethods();
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to remove payment method",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Bank Payment Method</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Popover open={openBankSelect} onOpenChange={setOpenBankSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBankSelect}
                      className="w-full justify-between"
                    >
                      {paymentBankName || "Select bank..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search bank..." />
                      <CommandEmpty>
                        <div className="py-6 text-center text-sm">
                          <p className="text-muted-foreground mb-2">No bank found.</p>
                          <p className="text-xs text-muted-foreground">
                            Try selecting "Custom Bank (Enter manually)" to add your bank
                          </p>
                        </div>
                      </CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {nigerianBanks.map((bank) => (
                          <CommandItem
                            key={bank.code}
                            value={bank.name}
                            onSelect={(currentValue) => {
                              setPaymentBankName(currentValue === paymentBankName ? "" : currentValue);
                              const selectedBank = nigerianBanks.find(b => b.name.toLowerCase() === currentValue.toLowerCase());
                              if (selectedBank && selectedBank.code !== "CUSTOM") {
                                setPaymentBankCode(selectedBank.code);
                              } else {
                                setPaymentBankCode("");
                              }
                              setOpenBankSelect(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                paymentBankName === bank.name ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {bank.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Can't find your bank? Select "Custom Bank (Enter manually)" from the list
                </p>
              </div>

              {paymentBankName === "Custom Bank (Enter manually)" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-bank-name">Custom Bank Name *</Label>
                  <Input
                    id="custom-bank-name"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Enter your bank name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number *</Label>
                <Input
                  id="account-number"
                  value={paymentAccountNumber}
                  onChange={(e) => setPaymentAccountNumber(e.target.value)}
                  placeholder="e.g., 1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-name">Account Name *</Label>
                <Input
                  id="account-name"
                  value={paymentAccountName}
                  onChange={(e) => setPaymentAccountName(e.target.value)}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-code">
                  Bank Code {paymentBankName !== "Custom Bank (Enter manually)" && paymentBankName && "(Auto-filled)"}
                </Label>
                <Input
                  id="bank-code"
                  value={paymentBankCode}
                  onChange={(e) => setPaymentBankCode(e.target.value)}
                  placeholder="e.g., 011"
                  disabled={paymentBankName !== "Custom Bank (Enter manually)" && paymentBankName !== ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-address">Bank Address (Optional)</Label>
                <Input
                  id="bank-address"
                  value={bankAddress}
                  onChange={(e) => setBankAddress(e.target.value)}
                  placeholder="e.g., 123 Main Street, Lagos"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePaymentMethod}>
              Save Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const DevicesSection = () => {
    const getDeviceIcon = (deviceName: string, browser: string) => {
      const name = deviceName?.toLowerCase() || '';
      const browserLower = browser?.toLowerCase() || '';
      
      if (name.includes('mobile') || name.includes('phone') || browserLower.includes('mobile')) {
        return Smartphone;
      } else if (name.includes('tablet') || name.includes('ipad')) {
        return Tablet;
      } else if (name.includes('laptop') || name.includes('macbook')) {
        return Laptop;
      } else {
        return Monitor;
      }
    };

    const formatLastActive = (date: string) => {
      const now = new Date();
      const lastActive = new Date(date);
      const diff = now.getTime() - lastActive.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Active Devices</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage devices that have access to your account. If you see a device you don't recognize, revoke its access immediately.
          </p>
        </div>

        {loadingDevices ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading devices...</p>
            </CardContent>
          </Card>
        ) : devices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No active devices found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Devices will appear here when you sign in
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.device_name, device.browser);
              return (
                <Card key={device.id} className={device.is_current ? "border-primary/50" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          device.is_current ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <DeviceIcon className={`h-6 w-6 ${
                            device.is_current ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold truncate">
                              {device.device_name || 'Unknown Device'}
                            </p>
                            {device.is_current && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {device.browser && (
                              <p className="truncate">{device.browser}</p>
                            )}
                            {device.os && (
                              <p className="truncate">{device.os}</p>
                            )}
                            {device.ip_address && (
                              <p className="truncate">IP: {device.ip_address}</p>
                            )}
                            <p>Last active: {formatLastActive(device.last_active)}</p>
                          </div>
                        </div>
                      </div>
                      {!device.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeDevice(device.id)}
                          className="shrink-0"
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm">
                  For security, you'll be automatically logged out on devices that haven't been active for 30 days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const VerificationSection = () => (
    <div className="space-y-6">
      {/* Verification Status Card */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Account Verification</CardTitle>
            </div>
            <Badge variant={verificationLevel >= 2 ? "default" : "secondary"} className="text-xs">
              Level {verificationLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingVerification ? (
            <p className="text-sm text-muted-foreground">Loading verification status...</p>
          ) : (
            <div className="space-y-3">
              {verificationLevel === 0 && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                    Limited Access - Level 0
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                    You can invite friends and earn rewards, but cannot trade yet. Complete age verification to start trading.
                  </p>
                </div>
              )}

              {verificationLevel === 1 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Basic Trading - Level 1
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    Daily limit: $1,000 | Lifetime: $10,000 | Cannot create offers
                  </p>
                </div>
              )}

              {verificationLevel === 2 && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                    Unlimited Trading - Level 2
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                    No daily/lifetime limits | Per-trade: $100,000
                  </p>
                </div>
              )}

              {verificationLevel === 3 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    VIP Status - Level 3
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                    Maximum per-trade: $1,000,000 | Priority support
                  </p>
                </div>
              )}

              <Button
                onClick={() => setLocation("/verification")}
                className="w-full"
                variant={verificationLevel >= 3 ? "outline" : "default"}
              >
                {verificationLevel >= 3 ? "View Verification Details" : "Upgrade Verification Level"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm">
                Increase your verification level to unlock higher trading limits and additional features.
              </p>
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => setLocation('/verification')}
              >
                View Verification Levels →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection />;
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationsSection />;
      case "payment":
        return <PaymentSection />;
      case "devices":
        return <DevicesSection />;
      case "verification":
        return <VerificationSection />;
      default:
        return (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">This section is coming soon</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Account</h1>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <SidebarContent />
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Account settings</h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    ID verified
                  </Badge>
                </div>
                {renderSection()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}