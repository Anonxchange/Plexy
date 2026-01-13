import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { SendCryptoDialog } from "@/components/send-crypto-dialog";
import { ReceiveCryptoDialog } from "@/components/receive-crypto-dialog";
import { type Wallet, getUserWallets } from "@/lib/wallet-api";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { AssetList } from "@/components/wallet/AssetList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Landmark, ChevronRight, Gift } from "lucide-react";

export default function WalletPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
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
      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">My assets</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-6">
              <Tabs defaultValue="wallet" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-xl h-auto gap-1">
                  <TabsTrigger value="wallet" className="rounded-lg px-6 py-2 data-[state=active]:bg-[#B4F22E] data-[state=active]:text-black font-semibold">
                    <WalletIcon className="h-4 w-4 mr-2" />
                    Wallet
                  </TabsTrigger>
                  <TabsTrigger value="visa" className="rounded-lg px-6 py-2 font-semibold">
                    <Landmark className="h-4 w-4 mr-2" />
                    Visa card
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <WalletHeader 
                      onSend={() => setSendDialogOpen(true)}
                      onReceive={() => setReceiveDialogOpen(true)}
                      onSwap={() => setLocation("/swap")}
                      onTopup={() => setLocation("/wallet/mobile-topup")}
                    />
                    
                    <div className="p-6">
                      <AssetList />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm bg-card overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between border-b cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Withdraw limits</span>
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none text-[10px] font-bold px-1.5 h-5 uppercase">Level 3</Badge>
                    <span className="text-primary text-[10px] font-bold hover:underline ml-1">Learn more</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <div className="relative rounded-2xl overflow-hidden bg-[#0A2E1F] aspect-[4/3] flex flex-col p-6 text-white group cursor-pointer shadow-lg">
               <div className="relative z-10 space-y-4">
                  <h3 className="text-2xl font-bold leading-tight max-w-[180px]">
                    Save up to 20% on gift cards
                  </h3>
                  <p className="text-sm text-gray-300 max-w-[200px]">
                    Exclusive discounts on the gift cards you love—shop now and save more!
                  </p>
                  <Button className="w-fit bg-white text-black hover:bg-gray-100 font-bold rounded-lg px-4 h-9">
                    <Gift className="h-4 w-4 mr-2" />
                    Buy a gift card
                  </Button>
               </div>
               
               {/* Visual elements representing gift cards */}
               <div className="absolute top-8 right-[-20px] w-48 h-64 transition-transform duration-500 group-hover:translate-x-[-10px]">
                 {/* This would be the stack of cards image from the screenshot */}
                 <div className="absolute top-0 right-0 w-32 h-20 bg-black rounded-lg shadow-xl transform rotate-[-5deg] flex items-center justify-center border border-white/10">
                   <span className="text-xs font-bold">amazon</span>
                 </div>
                 <div className="absolute top-10 right-4 w-32 h-20 bg-blue-500 rounded-lg shadow-xl transform rotate-[5deg] flex items-center justify-center border border-white/10">
                   <span className="text-xs font-bold">Steam</span>
                 </div>
                 <div className="absolute top-20 right-2 w-32 h-20 bg-orange-500 rounded-lg shadow-xl transform rotate-[-2deg] flex items-center justify-center border border-white/10">
                   <span className="text-xs font-bold">Razer</span>
                 </div>
               </div>
            </div>
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
