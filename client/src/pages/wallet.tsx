import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { SendCryptoDialog } from "@/components/send-crypto-dialog";
import { ReceiveCryptoDialog } from "@/components/receive-crypto-dialog";
import { type Wallet, getUserWallets } from "@/lib/wallet-api";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { AssetList } from "@/components/wallet/AssetList";
import { WalletActions } from "@/components/wallet/WalletActions";

export default function Wallet() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    }
  }, [user, loading, setLocation]);

  const loadWalletData = async () => {
    if (!user) return;
    try {
      const userWallets = await getUserWallets(user.id);
      if (userWallets && Array.isArray(userWallets)) {
        setWallets(userWallets);
      }
    } catch (error) {
      console.error("Wallet Page: Sync failed:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  if (!loading && !user) {
    return null;
  }

  const walletsForDialog = wallets.map(wallet => ({
    symbol: wallet.crypto_symbol,
    name: wallet.crypto_symbol,
    icon: wallet.crypto_symbol,
    balance: wallet.balance
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
        <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

        <div className="space-y-6">
          <WalletHeader />
          <WalletActions 
            onSend={() => setSendDialogOpen(true)}
            onReceive={() => setReceiveDialogOpen(true)}
            onSwap={() => setLocation("/swap")}
            onTopup={() => setLocation("/wallet/mobile-topup")}
          />
          
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assets</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Hide zero balance</span>
                <Switch 
                  checked={hideZeroBalance}
                  onCheckedChange={setHideZeroBalance}
                />
              </div>
            </div>
            <AssetList />
          </div>
        </div>
      </div>

      <PexlyFooter />

      <SendCryptoDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        wallets={walletsForDialog}
        onSuccess={loadWalletData}
      />

      <ReceiveCryptoDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        wallets={walletsForDialog}
      />
    </div>
  );
}
