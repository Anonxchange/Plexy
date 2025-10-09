import { useState } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  X
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
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nameDisplay, setNameDisplay] = useState("hide");
  const [phoneVerified, setPhoneVerified] = useState(true);

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
            <span className="text-muted-foreground">(curieswapo@gmail.com)</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              ID verified
            </Badge>
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
        <Select defaultValue="ngn">
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
          <AvatarFallback className="bg-muted">
            <User className="h-16 w-16 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Username */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Username</Label>
        <div className="flex gap-2">
          <Input defaultValue="OlamideBS" className="flex-1" />
          <Button className="bg-primary hover:bg-primary/90">Save</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          You can change your username <span className="font-semibold">only once</span>
        </p>
      </div>

      {/* Upload Image */}
      <Button variant="outline" className="w-full justify-between h-14">
        <span>Upload image</span>
        <Upload className="h-5 w-5" />
      </Button>
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
            defaultValue="+2348134478949" 
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
          placeholder="Your bio appears on your public profile"
          className="min-h-32 resize-none"
        />
        <p className="text-sm text-muted-foreground">
          Maximum 3 lines and 180 characters
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
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-muted-foreground">Use Google Authenticator or similar</p>
              </div>
              <Switch />
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
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" />
            </div>
            <Button className="w-full">Update Password</Button>
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
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Price Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified of price changes</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Offers</p>
              <p className="text-sm text-muted-foreground">Notifications about new trading offers</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Promotional content and updates</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PaymentSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button>Add Payment Method</Button>
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
