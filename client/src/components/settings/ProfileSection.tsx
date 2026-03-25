import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  getCountryInfo,
  getCountryPhoneCode,
  countries,
} from "@/lib/localization";
import { PhoneLinkingDialog } from "@/components/phone-linking-dialog";
import { EmailLinkingDialog } from "@/components/email-linking-dialog";
import {
  User,
  Upload,
  HelpCircle,
  Check,
  ChevronsUpDown,
  Copy,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfileSection() {
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("");
  const [countryCodeForPhone, setCountryCodeForPhone] = useState("");
  const [nameDisplay, setNameDisplay] = useState("hide");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPhoneVerificationDialog, setShowPhoneVerificationDialog] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");
  const [pendingCountryCode, setPendingCountryCode] = useState("");
  const [showEmailChangeDialog, setShowEmailChangeDialog] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [country, setCountry] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfileData(data);
        if (!isEditingUsername) setUsername(data.username || "");
        if (!isEditingBio) setBio(data.bio || "");

        if (data.country) {
          const countryInfo = getCountryInfo(data.country);
          setCountry(data.country);
          if (!isEditingPhone) setCountryCodeForPhone(countryInfo.phoneCode);
        }

        if (!isEditingPhone) {
          const fullPhone = authUser?.phone || data.phone_number || data.phone || "";
          if (fullPhone) {
            const userCountryCode = getCountryPhoneCode(data.country);
            const codes = [userCountryCode, "+234", "+1", "+44", "+91", "+254", "+233", "+27"];
            const matchedCode = codes.find((code) => fullPhone.startsWith(code));
            if (matchedCode) {
              setCountryCodeForPhone(matchedCode);
              setPhone(fullPhone.replace(matchedCode, ""));
            } else {
              setPhone(fullPhone);
            }
          }
        }

        const isVerified = authUser?.phone_confirmed_at ? true : data.phone_verified || false;
        setPhoneVerified(isVerified);
        setCurrency(data.preferred_currency?.toUpperCase() || "USD");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      const authPhone = authUser?.phone || "";
      const currentPhone = authPhone || profileData?.phone_number || "";
      const newPhone = phone.trim();
      const newFullPhoneNumber = countryCodeForPhone + newPhone;

      if (newFullPhoneNumber !== currentPhone && newPhone) {
        setPendingPhoneNumber(newPhone);
        setPendingCountryCode(countryCodeForPhone);
        setShowPhoneVerificationDialog(true);
        return;
      }

      const updateData: any = {
        username: username.trim(),
        bio,
        preferred_currency: currency,
        country,
      };

      if (authPhone) {
        updateData.phone_number = authPhone;
        updateData.phone_verified = authUser?.phone_confirmed_at ? true : false;
      } else if (newFullPhoneNumber === currentPhone) {
        updateData.phone_number = newFullPhoneNumber;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", user?.id);

      if (error) throw error;

      toast({ title: "Success!", description: "Profile updated successfully" });
      fetchProfileData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user?.id);
      if (updateError) throw updateError;

      toast({ title: "Success!", description: "Avatar uploaded successfully" });
      fetchProfileData();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ title: "Error", description: "Failed to upload avatar", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveCurrency = async () => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ preferred_currency: currency })
        .eq("id", user?.id);
      if (error) throw error;
      toast({ title: "Success!", description: "Preferred currency updated" });
    } catch (error) {
      console.error("Error updating currency:", error);
      toast({ title: "Error", description: "Failed to update currency", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {profileData?.pexly_pay_id && (
        <div className="space-y-3">
          <Label className="text-lg font-semibold">UIID</Label>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-3 py-1.5 rounded font-mono text-sm font-semibold flex-1">
              {profileData.pexly_pay_id}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                navigator.clipboard.writeText(profileData.pexly_pay_id || "");
                toast({ title: "Copied!", description: "UIID copied to clipboard" });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Your unique identifier for Pexly Pay</p>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-lg font-semibold">Email Address</Label>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user?.email}</span>
            {profileData?.is_verified && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                ID verified
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEmailChangeDialog(true)}>
            Change Email
          </Button>
        </div>
      </div>

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
          <p className="font-semibold">
            {profileData?.country ? (
              <span className="flex items-center gap-2">
                <span>{getCountryInfo(profileData.country).flag}</span>
                <span>{getCountryInfo(profileData.country).name}</span>
              </span>
            ) : (
              "Not set"
            )}
          </p>
        </div>
      </div>

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
                  const names = profileData.full_name.split(" ");
                  return names.length >= 2
                    ? `${names[0]} ${names[names.length - 1].charAt(0)}.`
                    : profileData.full_name;
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

      <div className="space-y-3">
        <Label className="text-lg font-semibold">Preferred currency</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="flex-1 justify-between">
                {currency ? (
                  <>
                    {countries.find((c) => c.currencyCode === currency)?.flag}{" "}
                    {countries.find((c) => c.currencyCode === currency)?.name} - {currency}
                  </>
                ) : (
                  "Select currency..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search currency or country..." />
                <CommandEmpty>No currency found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {countries.map((country) => (
                    <CommandItem
                      key={`${country.code}-${country.currencyCode}`}
                      value={`${country.name} ${country.currency} ${country.currencyCode}`}
                      onSelect={() => setCurrency(country.currencyCode)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currency === country.currencyCode ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="mr-2">{country.flag}</span>
                      <span>
                        {country.name} - {country.currency} ({country.currencyCode})
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveCurrency}>
            Save
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Select which currency your wallet will use</p>
      </div>

      <div className="flex justify-center py-6">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profileData?.avatar_url} alt="Profile" />
          <AvatarFallback className="bg-muted">
            <User className="h-16 w-16 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-3">
        <Label className="text-lg font-semibold">Username</Label>
        <div className="flex gap-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setIsEditingUsername(true)}
            onBlur={() => setIsEditingUsername(false)}
            className="flex-1"
          />
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveProfile}>
            Save
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          You can change your username <span className="font-semibold">only once</span>
        </p>
      </div>

      <Label htmlFor="avatar-upload" className="cursor-pointer">
        <Button
          variant="outline"
          className="w-full justify-between h-14"
          disabled={uploadingAvatar}
          asChild={false}
        >
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

      <div className="space-y-3">
        <Label className="text-lg font-semibold">Phone</Label>
        <div className="space-y-2">
          <div className="space-y-2">
            <Label>Country Code</Label>
            <Select value={countryCodeForPhone} onValueChange={setCountryCodeForPhone}>
              <SelectTrigger className="w-full h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countries.map((country) => (
                  <SelectItem key={country.phoneCode} value={country.phoneCode}>
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>
                        {country.name} ({country.phoneCode})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center px-3 py-2 border rounded-md bg-muted h-12">
              <span className="text-sm font-medium">{countryCodeForPhone}</span>
            </div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setIsEditingPhone(true)}
              onBlur={() => setIsEditingPhone(false)}
              placeholder="1234567890"
              className="flex-1 h-12"
            />
            {phoneVerified && phone && (
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (phone.trim()) {
                  setPendingPhoneNumber(phone.trim());
                  setPendingCountryCode(countryCodeForPhone);
                  setShowPhoneVerificationDialog(true);
                } else {
                  toast({
                    title: "Error",
                    description: "Please enter a phone number",
                    variant: "destructive",
                  });
                }
              }}
            >
              {phoneVerified && phone ? "Change" : "Verify"}
            </Button>
          </div>
        </div>
        {phoneVerified && phone && (
          <p className="text-sm text-muted-foreground">✓ Phone number verified</p>
        )}
        {!phoneVerified && phone && (
          <p className="text-sm text-orange-600 dark:text-orange-400">
            ⚠ Phone number needs verification
          </p>
        )}
      </div>

      <div>
        <button className="text-primary hover:underline text-sm mb-3">Reset phone</button>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm">
                  You need to set answers to your security questions in case you have to reset or
                  change the phone number.
                </p>
                <button className="text-primary hover:underline text-sm">Set answers</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Label className="text-lg font-semibold">Bio</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onFocus={() => setIsEditingBio(true)}
          onBlur={() => setIsEditingBio(false)}
          placeholder="Your bio appears on your public profile"
          className="min-h-32 resize-none"
          maxLength={180}
        />
        <p className="text-sm text-muted-foreground">
          Maximum 3 lines and 180 characters ({bio.length}/180)
        </p>
      </div>

      <PhoneLinkingDialog
        open={showPhoneVerificationDialog}
        onOpenChange={setShowPhoneVerificationDialog}
        phoneNumber={pendingPhoneNumber}
        countryCode={pendingCountryCode}
        userId={user?.id || ""}
        onSuccess={async () => {
          setPhoneVerified(true);
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();
          if (authUser?.phone) {
            await supabase
              .from("user_profiles")
              .update({
                phone_number: authUser.phone,
                phone_verified: true,
              })
              .eq("id", user?.id);
          }
          fetchProfileData();
        }}
      />

      <EmailLinkingDialog
        open={showEmailChangeDialog}
        onOpenChange={setShowEmailChangeDialog}
        currentEmail={user?.email}
        userId={user?.id || ""}
        onSuccess={() => fetchProfileData()}
      />
    </div>
  );
}
