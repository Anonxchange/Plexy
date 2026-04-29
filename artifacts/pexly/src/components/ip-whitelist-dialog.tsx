import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, CheckCircle2, Globe, Loader2, AlertCircle, MapPin } from "lucide-react";
import { ipWhitelist, IPWhitelistEntry } from "@/lib/security/ip-whitelist";

const formatDistanceToNow = (date: Date | number | string, _options?: any) => {
  const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

interface IPWhitelistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IPWhitelistDialog({
  open,
  onOpenChange,
}: IPWhitelistDialogProps) {
  const [entries, setEntries] = useState<IPWhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIP, setNewIP] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [currentIP, setCurrentIP] = useState<string>("");
  const [loadingCurrentIP, setLoadingCurrentIP] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadEntries();
      fetchCurrentIP();
    }
  }, [open]);

  const fetchCurrentIP = async () => {
    setLoadingCurrentIP(true);
    try {
      const ip = await ipWhitelist.getCurrentIP();
      setCurrentIP(ip);
    } catch (error) {
      console.error("Error fetching current IP:", error);
    } finally {
      setLoadingCurrentIP(false);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await ipWhitelist.getWhitelistedIPs();
      setEntries(data);
    } catch (error) {
      console.error("Error loading IP entries:", error);
      toast({
        title: "Error",
        description: "Failed to load whitelisted IP addresses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateIP = (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.').map(Number);
      return parts.every(part => part >= 0 && part <= 255);
    }
    
    return ipv6Regex.test(ip);
  };

  const handleAddIP = async () => {
    if (!newIP.trim() || !newLabel.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both an IP address and a label",
        variant: "destructive",
      });
      return;
    }

    if (!validateIP(newIP.trim())) {
      toast({
        title: "Invalid IP Address",
        description: "Please enter a valid IPv4 or IPv6 address",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      await ipWhitelist.addIP(newIP.trim(), newLabel.trim());
      toast({
        title: "IP Address Added",
        description: "The IP address has been added to your whitelist.",
      });
      setNewIP("");
      setNewLabel("");
      setShowAddForm(false);
      loadEntries();
    } catch (error) {
      console.error("Error adding IP:", error);
      toast({
        title: "Error",
        description: "Failed to add IP address. It may already exist.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleAddCurrentIP = () => {
    if (currentIP && currentIP !== "unknown") {
      setNewIP(currentIP);
      setNewLabel("My Current Device");
      setShowAddForm(true);
    }
  };

  const handleRemoveIP = async (entryId: string) => {
    setDeletingId(entryId);
    try {
      await ipWhitelist.deleteIP(entryId);
      toast({
        title: "IP Address Removed",
        description: "The IP address has been removed from your whitelist.",
      });
      loadEntries();
    } catch (error) {
      console.error("Error removing IP:", error);
      toast({
        title: "Error",
        description: "Failed to remove IP address",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const isCurrentIPWhitelisted = entries.some(
    (entry) => entry.ip_address === currentIP && entry.status === "active"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage IP Whitelist</DialogTitle>
          <DialogDescription>
            Add trusted IP addresses. Only these IPs will be allowed for sensitive operations when enabled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Your Current IP</p>
                  {loadingCurrentIP ? (
                    <p className="text-xs text-muted-foreground">Detecting...</p>
                  ) : (
                    <p className="text-xs font-mono text-muted-foreground">{currentIP || "Unknown"}</p>
                  )}
                </div>
              </div>
              {!isCurrentIPWhitelisted && currentIP && currentIP !== "unknown" && (
                <Button variant="outline" size="sm" onClick={handleAddCurrentIP}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add This IP
                </Button>
              )}
              {isCurrentIPWhitelisted && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Whitelisted
                </Badge>
              )}
            </div>
          </div>

          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add IP Address Manually
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input
                  placeholder="e.g., 192.168.1.1"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Label (for your reference)</Label>
                <Input
                  placeholder="e.g., Home, Office, VPN"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowAddForm(false); setNewIP(""); setNewLabel(""); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddIP} disabled={adding} className="flex-1">
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add IP Address"
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Whitelisted IP Addresses</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No IP addresses whitelisted yet</p>
                <p className="text-sm">Add your current IP to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{entry.label}</span>
                        {entry.ip_address === currentIP && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                        {entry.status === "active" ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 text-xs">
                            Revoked
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {entry.ip_address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        {entry.last_used_at && ` · Last used ${formatDistanceToNow(new Date(entry.last_used_at), { addSuffix: true })}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveIP(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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
