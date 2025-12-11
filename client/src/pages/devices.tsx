import { useState, useEffect } from “react”;
import { Button } from “@/components/ui/button”;
import { Card, CardContent } from “@/components/ui/card”;
import { Badge } from “@/components/ui/badge”;
import { useAuth } from “@/lib/auth-context”;
import { createClient } from “@/lib/supabase”;
import { useToast } from “@/hooks/use-toast”;
import { useLocation } from “wouter”;
import {
Sheet,
SheetContent,
SheetHeader,
SheetTitle,
SheetTrigger,
} from “@/components/ui/sheet”;
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
Trash2,
Loader2,
Clock,
Fingerprint,
} from “lucide-react”;
import {
Pagination,
PaginationContent,
PaginationEllipsis,
PaginationItem,
PaginationLink,
PaginationNext,
PaginationPrevious,
} from “@/components/ui/pagination”;
import { PexlyFooter } from “@/components/pexly-footer”;
import { deviceFingerprint, DeviceFingerprint } from “@/lib/security/device-fingerprint”;
import { formatDistanceToNow } from “date-fns”;

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
{ id: “profile”, label: “Profile”, icon: User },
{ id: “localization”, label: “Localization”, icon: Globe },
{ id: “notifications”, label: “Notifications”, icon: Bell },
{ id: “security”, label: “Security”, icon: Shield },
{ id: “devices”, label: “Devices”, icon: Smartphone },
{ id: “payment”, label: “Payment Accounts”, icon: Building2 },
{ id: “developer”, label: “Developer”, icon: Code },
{ id: “verification”, label: “Verification”, icon: CheckCircle2 },
{ id: “connected”, label: “Connected Apps & Websites”, icon: Link2 },
{ id: “security-questions”, label: “Security Questions”, icon: Info },
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
const [currentPage, setCurrentPage] = useState(1);
const devicesPerPage = 60;

const [trustedDevices, setTrustedDevices] = useState<DeviceFingerprint[]>([]);
const [loadingTrustedDevices, setLoadingTrustedDevices] = useState(false);
const [currentFingerprint, setCurrentFingerprint] = useState<string>(””);
const [processingDeviceId, setProcessingDeviceId] = useState<string | null>(null);
const [registeringDevice, setRegisteringDevice] = useState(false);

useEffect(() => {
if (!loading && !user) {
setLocation(”/signin”);
} else if (user) {
fetchDevices();
fetchTrustedDevices();
loadCurrentFingerprint();
}
}, [user, loading]);

const loadCurrentFingerprint = async () => {
try {
const fingerprint = await deviceFingerprint.getCurrentFingerprint();
setCurrentFingerprint(fingerprint);
} catch (error) {
console.error(“Error getting current fingerprint:”, error);
}
};

const fetchTrustedDevices = async () => {
if (!user?.id) return;
setLoadingTrustedDevices(true);
try {
const data = await deviceFingerprint.getDevices(user.id);
setTrustedDevices(data);
} catch (error) {
console.error(“Error loading trusted devices:”, error);
} finally {
setLoadingTrustedDevices(false);
}
};

const handleRegisterCurrentDevice = async () => {
if (!user?.id) return;
setRegisteringDevice(true);
try {
await deviceFingerprint.registerDevice(user.id);
toast({
title: “Device Registered”,
description: “Your current device has been added to trusted devices.”,
});
fetchTrustedDevices();
} catch (error) {
console.error(“Error registering device:”, error);
toast({
title: “Error”,
description: “Failed to register current device”,
variant: “destructive”,
});
} finally {
setRegisteringDevice(false);
}
};

const handleTrustDevice = async (deviceId: string) => {
if (!user?.id) return;
setProcessingDeviceId(deviceId);
try {
await deviceFingerprint.trustDevice(user.id, deviceId);
toast({
title: “Device Trusted”,
description: “The device has been marked as trusted.”,
});
fetchTrustedDevices();
} catch (error) {
console.error(“Error trusting device:”, error);
toast({
title: “Error”,
description: “Failed to trust device”,
variant: “destructive”,
});
} finally {
setProcessingDeviceId(null);
}
};

const handleRevokeTrustedDevice = async (deviceId: string) => {
if (!user?.id) return;
setProcessingDeviceId(deviceId);
try {
await deviceFingerprint.revokeDevice(user.id, deviceId);
toast({
title: “Device Removed”,
description: “The device has been removed from your trusted devices.”,
});
fetchTrustedDevices();
} catch (error) {
console.error(“Error revoking device:”, error);
toast({
title: “Error”,
description: “Failed to revoke device”,
variant: “destructive”,
});
} finally {
setProcessingDeviceId(null);
}
};

const getTrustedDeviceIcon = (deviceInfo: DeviceFingerprint[‘device_info’]) => {
const platform = deviceInfo?.platform?.toLowerCase() || ‘’;
const userAgent = deviceInfo?.userAgent?.toLowerCase() || ‘’;

```
if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
  return Smartphone;
}
if (userAgent.includes('ipad') || userAgent.includes('tablet')) {
  return Tablet;
}
if (platform.includes('mac')) {
  return Laptop;
}
return Monitor;
```

};

const getTrustedDeviceName = (deviceInfo: DeviceFingerprint[‘device_info’]) => {
const platform = deviceInfo?.platform || ‘Unknown Platform’;
const userAgent = deviceInfo?.userAgent || ‘’;

```
let browser = 'Unknown Browser';
if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
else if (userAgent.includes('Firefox')) browser = 'Firefox';
else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
else if (userAgent.includes('Edg')) browser = 'Edge';

return `${browser} on ${platform}`;
```

};

const isCurrentTrustedDevice = (device: DeviceFingerprint) => {
return device.fingerprint_hash === currentFingerprint;
};

const currentDeviceRegistered = trustedDevices.some(d => d.fingerprint_hash === currentFingerprint);

const fetchDevices = async () => {
setLoadingDevices(true);
try {
const { data, error } = await supabase
.from(‘user_devices’)
.select(’*’)
.eq(‘user_id’, user?.id)
.order(‘last_active’, { ascending: false });

```
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
```

};

const handleRefresh = async () => {
setRefreshing(true);
await fetchDevices();
setRefreshing(false);
setCurrentPage(1);
toast({
title: “Refreshed”,
description: “Device list updated”,
});
};

// Pagination calculations
const totalPages = Math.ceil(devices.length / devicesPerPage);
const startIndex = (currentPage - 1) * devicesPerPage;
const endIndex = startIndex + devicesPerPage;
const currentDevices = devices.slice(startIndex, endIndex);

const handlePageChange = (page: number) => {
setCurrentPage(page);
window.scrollTo({ top: 0, behavior: ‘smooth’ });
};

const handleRevokeDevice = async (deviceId: string) => {
try {
const { error } = await supabase
.from(‘user_devices’)
.delete()
.eq(‘id’, deviceId);

```
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
```

};

const handleSectionClick = (sectionId: string) => {
setSidebarOpen(false);
if (sectionId === “devices”) {
return;
} else if (sectionId === “developer”) {
setLocation(”/developer”);
} else {
setLocation(`/account-settings?section=${sectionId}`);
}
};

const getDeviceIcon = (deviceName: string, browser: string) => {
const name = deviceName?.toLowerCase() || ‘’;
const browserLower = browser?.toLowerCase() || ‘’;

```
if (name.includes('mobile') || name.includes('phone') || browserLower.includes('mobile')) {
  return Smartphone;
} else if (name.includes('tablet') || name.includes('ipad')) {
  return Tablet;
} else if (name.includes('laptop') || name.includes('macbook')) {
  return Laptop;
} else {
  return Monitor;
}
```

};

const formatLastActive = (date: string) => {
const now = new Date();
const lastActive = new Date(date);
const diff = now.getTime() - lastActive.getTime();
const minutes = Math.floor(diff / 60000);
const hours = Math.floor(diff / 3600000);
const days = Math.floor(diff / 86400000);

```
if (minutes < 1) return 'Just now';
if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
return `${days} day${days > 1 ? 's' : ''} ago`;
```

};

const SidebarContent = () => (
<div className="p-4 space-y-2">
{settingsSections.map((section) => {
const Icon = section.icon;
return (
<button
key={section.id}
onClick={() => handleSectionClick(section.id)}
className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${ section.id === "devices" ? "bg-primary text-primary-foreground" : "hover:bg-muted" }`}
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

```
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
                  {devices.length > 0 && ` (${devices.length} total, showing ${startIndex + 1}-${Math.min(endIndex, devices.length)})`}
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
              {/* Trusted Devices Section - Moved to top */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Trusted Devices</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Devices you've marked as trusted for enhanced security. Trusted devices may bypass additional verification steps.
                </p>

                {!currentDeviceRegistered && (
                  <Card className="border-dashed mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Monitor className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Current Device</p>
                            <p className="text-sm text-muted-foreground">This device is not yet registered</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRegisterCurrentDevice}
                          disabled={registeringDevice}
                        >
                          {registeringDevice ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add This Device"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {loadingTrustedDevices ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-muted-foreground">Loading trusted devices...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : trustedDevices.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No trusted devices registered</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Register your current device to get started
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {trustedDevices.map((device) => {
                      const DeviceIcon = getTrustedDeviceIcon(device.device_info);
                      const isCurrent = isCurrentTrustedDevice(device);
                      return (
                        <Card key={device.id} className={isCurrent ? "border-primary/50" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isCurrent ? 'bg-primary/10' : 'bg-muted'
                                }`}>
                                  <DeviceIcon className={`h-5 w-5 ${
                                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-medium text-sm">
                                      {getTrustedDeviceName(device.device_info)}
                                    </span>
                                    {isCurrent && (
                                      <Badge variant="secondary" className="text-xs">Current</Badge>
                                    )}
                                    {device.trusted ? (
                                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Trusted
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">Untrusted</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-0.5">
                                    {device.ip_address && (
                                      <p className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {device.ip_address}
                                      </p>
                                    )}
                                    <p className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Last seen {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                                    </p>
                                    {device.device_info?.screen && (
                                      <p>Screen: {device.device_info.screen}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {!device.trusted && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTrustDevice(device.id)}
                                    disabled={processingDeviceId === device.id}
                                  >
                                    {processingDeviceId === device.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Trust"
                                    )}
                                  </Button>
                                )}
                                {!isCurrent && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRevokeTrustedDevice(device.id)}
                                    disabled={processingDeviceId === device.id}
                                  >
                                    {processingDeviceId === device.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Devices Section */}
              <div className="pt-6 border-t">
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
                  {currentDevices.map((device) => {
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

              {devices.length > devicesPerPage && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNumber)}
                              isActive={currentPage === pageNumber}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Security Warning Card */}
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
```

);
}