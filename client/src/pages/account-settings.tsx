import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronsUpDown
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
  
  // Profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("ngn");
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updateData: any = {
        username: username.trim(),
        bio: bio,
        phone: phone,
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;

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
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Oluwaseyi Ezekiel O.
            </Badge>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="font-normal cursor-pointer">
                Full name
              </Label>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Oluwaseyi Ezekiel Oluwole
            </Badge>
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
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ngn">Nigerian Naira (NGN)</SelectItem>
            <SelectItem value="usd">US Dollar (USD)</SelectItem>
            <SelectItem value="eur">Euro (EUR)</SelectItem>
            <SelectItem value="gbp">British Pound (GBP)</SelectItem>
          </SelectContent>
        </Select>
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
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment methods added yet</p>
            <p className="text-sm mt-2">Add a payment method to start trading</p>
          </div>
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

  const VerificationSection = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Email Verified</p>
                <p className="text-sm text-muted-foreground">curieswapo@gmail.com</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Verified
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Phone Verified</p>
                <p className="text-sm text-muted-foreground">+234 813 447 8949</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Verified
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Identity Verification</p>
                <p className="text-sm text-muted-foreground">Verify your identity</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Verify</Button>
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
