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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { withdrawalWhitelist, WhitelistAddress } from "@/lib/security/withdrawal-whitelist";
import { formatDistanceToNow } from "date-fns";

interface WithdrawalWhitelistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORTED_CRYPTOS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "DOGE", name: "Dogecoin" },
];

export function WithdrawalWhitelistDialog({
  open,
  onOpenChange,
}: WithdrawalWhitelistDialogProps) {
  const [addresses, setAddresses] = useState<WhitelistAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAddresses();
    }
  }, [open]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await withdrawalWhitelist.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Error loading addresses:", error);
      toast({
        title: "Error",
        description: "Failed to load whitelisted addresses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim() || !newLabel.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both an address and a label",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      await withdrawalWhitelist.addAddress(selectedCrypto, newAddress.trim(), newLabel.trim());
      toast({
        title: "Address Added",
        description: "The address has been added. It will be active in 24 hours.",
      });
      setNewAddress("");
      setNewLabel("");
      setShowAddForm(false);
      loadAddresses();
    } catch (error) {
      console.error("Error adding address:", error);
      toast({
        title: "Error",
        description: "Failed to add address. It may already exist.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAddress = async (addressId: string) => {
    setDeletingId(addressId);
    try {
      await withdrawalWhitelist.removeAddress(addressId);
      toast({
        title: "Address Removed",
        description: "The address has been removed from your whitelist.",
      });
      loadAddresses();
    } catch (error) {
      console.error("Error removing address:", error);
      toast({
        title: "Error",
        description: "Failed to remove address",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (address: WhitelistAddress) => {
    if (address.status === "active") {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    } else if (address.status === "pending") {
      const activationTime = address.activation_time ? new Date(address.activation_time) : null;
      const timeLeft = activationTime ? formatDistanceToNow(activationTime, { addSuffix: true }) : "24 hours";
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending - activates {timeLeft}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Withdrawal Whitelist</DialogTitle>
          <DialogDescription>
            Add trusted addresses for withdrawals. New addresses require a 24-hour waiting period before activation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="space-y-2">
                <Label>Cryptocurrency</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CRYPTOS.map((crypto) => (
                      <SelectItem key={crypto.symbol} value={crypto.symbol}>
                        {crypto.symbol} - {crypto.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <Input
                  placeholder="Enter wallet address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Label (for your reference)</Label>
                <Input
                  placeholder="e.g., My Ledger, Exchange Wallet"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddAddress} disabled={adding} className="flex-1">
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Address"
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Whitelisted Addresses</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No addresses whitelisted yet</p>
                <p className="text-sm">Add an address to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{address.crypto_symbol}</Badge>
                          <span className="font-medium text-sm">{address.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {address.address}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveAddress(address.id)}
                        disabled={deletingId === address.id}
                      >
                        {deletingId === address.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(address)}
                      <span className="text-xs text-muted-foreground">
                        Added {formatDistanceToNow(new Date(address.created_at), { addSuffix: true })}
                      </span>
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
