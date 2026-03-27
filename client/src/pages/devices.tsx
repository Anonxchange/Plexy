import { useHead } from "@unhead/react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Shield,
  Menu,
  Trash2,
  Loader2,
  ChevronRight,
  X,
  MapPin,
  Wifi,
  ChevronLeft,
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { deviceFingerprint, DeviceFingerprint } from "@/lib/security/device-fingerprint";

const format = (date: Date, _formatStr: string) => {
  return date.toLocaleString();
};

interface DeviceLocationInfo {
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
}


export default function DevicesPage() {
  useHead({ title: "Trusted Devices | Pexly", meta: [{ name: "description", content: "Review and manage trusted devices that have access to your Pexly account." }] });
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"trusted" | "active" | "untrusted">("trusted");
  const [trustedDevices, setTrustedDevices] = useState<DeviceFingerprint[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [currentFingerprint, setCurrentFingerprint] = useState<string>("");
  const [processingDeviceId, setProcessingDeviceId] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [selectedDevice, setSelectedDevice] = useState<DeviceFingerprint | null>(null);
  const [deviceDetailsOpen, setDeviceDetailsOpen] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocationInfo | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    } else if (user) {
      fetchDevices();
      loadCurrentFingerprint();
    }
  }, [user, loading]);

  const loadCurrentFingerprint = async () => {
    try {
      const fingerprint = await deviceFingerprint.getCurrentFingerprint();
      setCurrentFingerprint(fingerprint);
    } catch (error) {
      console.error("Error getting current fingerprint:", error);
    }
  };

  const fetchDevices = async () => {
    if (!user?.id) return;
    setLoadingDevices(true);
    try {
      const data = await deviceFingerprint.getDevices(user.id);
      setTrustedDevices(data);
    } catch (error) {
      console.error("Error loading devices:", error);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchDeviceLocation = async (ipAddress: string | null) => {
    if (!ipAddress) {
      setDeviceLocation(null);
      return;
    }
    setLoadingLocation(true);
    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      if (response.ok) {
        const data = await response.json();
        setDeviceLocation({
          city: data.city,
          region: data.region,
          country: data.country_name,
          isp: data.org,
        });
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setDeviceLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleDeviceClick = async (device: DeviceFingerprint) => {
    setSelectedDevice(device);
    setDeviceDetailsOpen(true);
    setDeviceLocation(null);
    await fetchDeviceLocation(device.ip_address);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!user?.id) return;
    setProcessingDeviceId(deviceId);
    try {
      await deviceFingerprint.revokeDevice(user.id, deviceId);
      toast({
        title: "Device Removed",
        description: "The device has been removed from your account.",
      });
      setDeviceDetailsOpen(false);
      setSelectedDevice(null);
      fetchDevices();
    } catch (error) {
      console.error("Error removing device:", error);
      toast({
        title: "Error",
        description: "Failed to remove device",
        variant: "destructive",
      });
    } finally {
      setProcessingDeviceId(null);
    }
  };

  const handleRemoveAllDevices = async () => {
    if (!user?.id) return;
    setRemovingAll(true);
    try {
      const devicesToRemove = activeTab === "trusted"
        ? trustedDevices.filter(d => d.trusted && d.fingerprint_hash !== currentFingerprint)
        : trustedDevices.filter(d => !d.trusted);

      for (const device of devicesToRemove) {
        await deviceFingerprint.revokeDevice(user.id, device.id);
      }

      toast({
        title: "Devices Removed",
        description: `All ${activeTab} devices have been removed${activeTab !== "untrusted" ? " (except current device)" : ""}.`,
      });
      fetchDevices();
    } catch (error) {
      console.error("Error removing all devices:", error);
      toast({
        title: "Error",
        description: "Failed to remove all devices",
        variant: "destructive",
      });
    } finally {
      setRemovingAll(false);
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    if (!user?.id) return;
    setProcessingDeviceId(deviceId);
    try {
      await deviceFingerprint.trustDevice(user.id, deviceId);
      toast({
        title: "Device Trusted",
        description: "The device has been marked as trusted.",
      });
      fetchDevices();
    } catch (error) {
      console.error("Error trusting device:", error);
      toast({
        title: "Error",
        description: "Failed to trust device",
        variant: "destructive",
      });
    } finally {
      setProcessingDeviceId(null);
    }
  };

  const handleUntrustDevice = async (deviceId: string) => {
    if (!user?.id) return;
    setProcessingDeviceId(deviceId);
    try {
      const { error } = await supabase
        .from('device_fingerprints')
        .update({ trusted: false })
        .eq('id', deviceId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Device Untrusted",
        description: "The device has been marked as untrusted.",
      });
      fetchDevices();
    } catch (error) {
      console.error("Error untrusting device:", error);
      toast({
        title: "Error",
        description: "Failed to untrust device",
        variant: "destructive",
      });
    } finally {
      setProcessingDeviceId(null);
    }
  };

  const getDeviceIcon = (deviceInfo: DeviceFingerprint['device_info']) => {
    const platform = deviceInfo?.platform?.toLowerCase() || '';
    const userAgent = deviceInfo?.userAgent?.toLowerCase() || '';
    
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
  };

  const getDeviceName = (deviceInfo: DeviceFingerprint['device_info']) => {
    const userAgent = deviceInfo?.userAgent || '';
    
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Linux')) return 'Linux';
    
    return 'Unknown Device';
  };

  const getOSName = (deviceInfo: DeviceFingerprint['device_info']) => {
    const userAgent = deviceInfo?.userAgent || '';
    
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Mac OS') || userAgent.includes('Macintosh')) return 'macOS';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Linux')) return 'Linux';
    
    return 'Unknown OS';
  };

  const isCurrentDevice = (device: DeviceFingerprint) => {
    return device.fingerprint_hash === currentFingerprint;
  };

  const currentDevice = trustedDevices.find(d => d.fingerprint_hash === currentFingerprint) ?? null;

  const filteredDevices = trustedDevices.filter(device =>
    activeTab === "trusted" ? device.trusted : !device.trusted
  );

  const totalPages = Math.ceil(filteredDevices.length / ITEMS_PER_PAGE);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (tab: "trusted" | "active" | "untrusted") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSectionClick = (sectionId: string) => {
    setSidebarOpen(false);
    if (sectionId === "devices") {
      return;
    } else {
      setLocation(`/account-settings?section=${sectionId}`);
    }
  };

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
              <SettingsSidebar activeSection="devices" onSectionChange={handleSectionClick} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <SettingsSidebar activeSection="devices" onSectionChange={handleSectionClick} />
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Devices</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your trusted and untrusted devices list
                  </p>
                </div>

                <div className="flex gap-3 mb-6">
                  <Button
                    variant={activeTab === "trusted" ? "default" : "outline"}
                    onClick={() => handleTabChange("trusted")}
                    className={`flex-1 ${activeTab === "trusted" ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    Trusted
                  </Button>
                  <Button
                    variant={activeTab === "active" ? "default" : "outline"}
                    onClick={() => handleTabChange("active")}
                    className={`flex-1 ${activeTab === "active" ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    Active
                  </Button>
                  <Button
                    variant={activeTab === "untrusted" ? "secondary" : "outline"}
                    onClick={() => handleTabChange("untrusted")}
                    className="flex-1"
                  >
                    Untrusted
                  </Button>
                </div>

                {loadingDevices ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : activeTab === "active" ? (
                  currentDevice ? (() => {
                    const DeviceIcon = getDeviceIcon(currentDevice.device_info);
                    const deviceName = getDeviceName(currentDevice.device_info);
                    const osName = getOSName(currentDevice.device_info);
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-5 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <DeviceIcon className="h-7 w-7 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-base">{deviceName}</p>
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                                This device
                              </Badge>
                              {currentDevice.trusted ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                                  Trusted
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 text-xs">
                                  Untrusted
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{osName}</p>
                          </div>
                        </div>

                        <div className="divide-y divide-border rounded-lg border">
                          <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-sm text-muted-foreground">IP Address</span>
                            <span className="text-sm font-medium">{currentDevice.ip_address || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-sm text-muted-foreground">Timezone</span>
                            <span className="text-sm font-medium">{currentDevice.device_info?.timezone || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-sm text-muted-foreground">Language</span>
                            <span className="text-sm font-medium">{currentDevice.device_info?.language || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-sm text-muted-foreground">Screen</span>
                            <span className="text-sm font-medium">{currentDevice.device_info?.screen || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-sm text-muted-foreground">First seen</span>
                            <span className="text-sm font-medium">{format(new Date(currentDevice.created_at), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-sm text-muted-foreground">Last active</span>
                            <span className="text-sm font-medium">{format(new Date(currentDevice.last_seen_at), "MMM d, yyyy • h:mm a")}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          {currentDevice.trusted ? (
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleUntrustDevice(currentDevice.id)}
                              disabled={processingDeviceId === currentDevice.id}
                            >
                              {processingDeviceId === currentDevice.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Mark as untrusted
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleTrustDevice(currentDevice.id)}
                              disabled={processingDeviceId === currentDevice.id}
                            >
                              {processingDeviceId === currentDevice.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Mark as trusted
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Current device not recognized</p>
                    </div>
                  )
                ) : filteredDevices.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No {activeTab} devices found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedDevices.map((device) => {
                      const DeviceIcon = getDeviceIcon(device.device_info);
                      const isCurrent = isCurrentDevice(device);
                      const deviceName = getDeviceName(device.device_info);
                      const loginDate = new Date(device.created_at);

                      return (
                        <button
                          key={device.id}
                          onClick={() => handleDeviceClick(device)}
                          className={`w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors text-left ${
                            isCurrent ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {deviceName}
                                {isCurrent && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Current
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(loginDate, "M/d/yyyy")} • {format(loginDate, "h:mm:ss a")} ({device.device_info?.timezone || 'UTC'})
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeTab !== "active" && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} &middot; {filteredDevices.length} devices
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab !== "active" && filteredDevices.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mt-6"
                        disabled={removingAll}
                      >
                        {removingAll ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          `Remove all ${activeTab} devices`
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove all {activeTab} devices?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all {activeTab} devices from your account
                          {activeTab === "trusted" && " (except your current device)"}.
                          {" "}This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveAllDevices}>
                          Remove All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={deviceDetailsOpen} onOpenChange={setDeviceDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Device details
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeviceDetailsOpen(false)}
                className="h-6 w-6 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedDevice && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Logged in</span>
                <div className="text-right">
                  <p className="font-medium">{format(new Date(selectedDevice.created_at), "M/d/yyyy")}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedDevice.created_at), "h:mm:ss a")} ({selectedDevice.device_info?.timezone || 'UTC'})
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Device</span>
                <span className="font-medium">{getDeviceName(selectedDevice.device_info)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">OS</span>
                <span className="font-medium">{getOSName(selectedDevice.device_info)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-medium">{selectedDevice.ip_address || 'Unknown'}</span>
              </div>

              {loadingLocation ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : deviceLocation && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </span>
                    <span className="font-medium">
                      {[deviceLocation.country, deviceLocation.city].filter(Boolean).join(', ')}
                    </span>
                  </div>

                  {deviceLocation.isp && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        ISP
                      </span>
                      <span className="font-medium">{deviceLocation.isp}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                {selectedDevice.trusted ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    Trusted
                  </Badge>
                ) : (
                  <Badge variant="outline">Untrusted</Badge>
                )}
              </div>

              <div className="pt-4 space-y-2">
                {selectedDevice.trusted ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUntrustDevice(selectedDevice.id)}
                    disabled={processingDeviceId === selectedDevice.id}
                  >
                    {processingDeviceId === selectedDevice.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Mark as untrusted
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleTrustDevice(selectedDevice.id)}
                    disabled={processingDeviceId === selectedDevice.id}
                  >
                    {processingDeviceId === selectedDevice.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Mark as trusted
                  </Button>
                )}

                {!isCurrentDevice(selectedDevice) && (
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveDevice(selectedDevice.id)}
                    disabled={processingDeviceId === selectedDevice.id}
                  >
                    {processingDeviceId === selectedDevice.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remove this device
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PexlyFooter />
    </div>
  );
}
