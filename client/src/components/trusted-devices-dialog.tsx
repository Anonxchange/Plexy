import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Monitor, 
  Laptop, 
  Smartphone, 
  Tablet, 
  CheckCircle2, 
  Loader2, 
  Shield,
  Globe,
  Clock
} from "lucide-react";
import { deviceFingerprint, DeviceFingerprint } from "@/lib/security/device-fingerprint";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth-context";

interface TrustedDevicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrustedDevicesDialog({
  open,
  onOpenChange,
}: TrustedDevicesDialogProps) {
  const [devices, setDevices] = useState<DeviceFingerprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFingerprint, setCurrentFingerprint] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user?.id) {
      loadDevices();
      loadCurrentFingerprint();
    }
  }, [open, user?.id]);

  const loadCurrentFingerprint = async () => {
    try {
      const fingerprint = await deviceFingerprint.getCurrentFingerprint();
      setCurrentFingerprint(fingerprint);
    } catch (error) {
      console.error("Error getting current fingerprint:", error);
    }
  };

  const loadDevices = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await deviceFingerprint.getDevices(user.id);
      setDevices(data);
    } catch (error) {
      console.error("Error loading devices:", error);
      toast({
        title: "Error",
        description: "Failed to load trusted devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCurrentDevice = async () => {
    if (!user?.id) return;
    
    setRegistering(true);
    try {
      await deviceFingerprint.registerDevice(user.id);
      toast({
        title: "Device Registered",
        description: "Your current device has been added to trusted devices.",
      });
      loadDevices();
    } catch (error) {
      console.error("Error registering device:", error);
      toast({
        title: "Error",
        description: "Failed to register current device",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    if (!user?.id) return;
    
    setProcessingId(deviceId);
    try {
      await deviceFingerprint.trustDevice(user.id, deviceId);
      toast({
        title: "Device Trusted",
        description: "The device has been marked as trusted.",
      });
      loadDevices();
    } catch (error) {
      console.error("Error trusting device:", error);
      toast({
        title: "Error",
        description: "Failed to trust device",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!user?.id) return;
    
    setProcessingId(deviceId);
    try {
      await deviceFingerprint.revokeDevice(user.id, deviceId);
      toast({
        title: "Device Removed",
        description: "The device has been removed from your trusted devices.",
      });
      loadDevices();
    } catch (error) {
      console.error("Error revoking device:", error);
      toast({
        title: "Error",
        description: "Failed to revoke device",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getDeviceIcon = (deviceInfo: DeviceFingerprint['device_info']) => {
    const platform = deviceInfo?.platform?.toLowerCase() || '';
    const userAgent = deviceInfo?.userAgent?.toLowerCase() || '';
    
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (userAgent.includes('ipad') || userAgent.includes('tablet')) {
      return <Tablet className="h-5 w-5" />;
    }
    if (platform.includes('mac')) {
      return <Laptop className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceName = (deviceInfo: DeviceFingerprint['device_info']) => {
    const platform = deviceInfo?.platform || 'Unknown Platform';
    const userAgent = deviceInfo?.userAgent || '';
    
    let browser = 'Unknown Browser';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    return `${browser} on ${platform}`;
  };

  const isCurrentDevice = (device: DeviceFingerprint) => {
    return device.fingerprint_hash === currentFingerprint;
  };

  const currentDeviceRegistered = devices.some(d => d.fingerprint_hash === currentFingerprint);

  if (!user?.id) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Trusted Devices</DialogTitle>
          <DialogDescription>
            View and manage devices that have accessed your account. Trust devices for enhanced security.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!currentDeviceRegistered && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Current Device</p>
                    <p className="text-xs text-muted-foreground">This device is not yet registered</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRegisterCurrentDevice}
                  disabled={registering}
                >
                  {registering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add This Device"
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Registered Devices</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No devices registered yet</p>
                <p className="text-sm">Register your current device to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {getDeviceIcon(device.device_info)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {getDeviceName(device.device_info)}
                            </span>
                            {isCurrentDevice(device) && (
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
                            disabled={processingId === device.id}
                          >
                            {processingId === device.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Trust"
                            )}
                          </Button>
                        )}
                        {!isCurrentDevice(device) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevokeDevice(device.id)}
                            disabled={processingId === device.id}
                          >
                            {processingId === device.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
