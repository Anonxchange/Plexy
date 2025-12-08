import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Monitor,
  Laptop,
  Tablet,
  Menu,
  RefreshCw,
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

interface Device {
  id: string;
  user_id: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
  created_at: string;
}

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

export default function DevicesPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    } else if (user) {
      fetchDevices();
    }
  }, [user, loading]);

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
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Device list updated",
    });
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

  const handleSectionClick = (sectionId: string) => {
    setSidebarOpen(false);
    if (sectionId === "devices") {
      return;
    } else if (sectionId === "developer") {
      setLocation("/developer");
    } else {
      setLocation(`/account-settings?section=${sectionId}`);
    }
  };

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

  const SidebarContent = () => (
    <div className="p-4 space-y-2">
      {settingsSections.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            onClick={() => handleSectionClick(section.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              section.id === "devices"
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <SidebarContent />
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Devices</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage devices that have access to your account
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Active Devices</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      If you see a device you don't recognize, revoke its access immediately.
                    </p>
                  </div>

                  {loadingDevices ? (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <p className="text-muted-foreground">Loading devices...</p>
                        </div>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
