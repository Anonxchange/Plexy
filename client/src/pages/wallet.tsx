import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { SendCryptoDialog } from "@/components/send-crypto-dialog";
import { ReceiveCryptoDialog } from "@/components/receive-crypto-dialog";
import { ReceiveMethodDialog } from "@/components/receive-method-dialog";
import { type Wallet, getUserWallets } from "@/lib/wallet-api";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { AssetList } from "@/components/wallet/AssetList";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Landmark, ChevronRight, Gift } from "lucide-react";
import { Helmet } from "react-helmet";

export default function WalletPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receiveMethodDialogOpen, setReceiveMethodDialogOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isWalletLoading, setIsWalletLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    }
  }, [user, loading, setLocation]);

  const loadWalletData = async (useCache = true) => {
    if (!user) return;

    // 1. Try to load from cache first for "instant" feel
    if (useCache) {
      const cached = localStorage.getItem(`pexly_wallet_cache_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setWallets(parsed);
          setIsWalletLoading(false); // Hide skeleton immediately if we have cache
        } catch (e) {
          console.error("Cache parse error", e);
        }
      }
    }

    // 2. Fetch fresh data in the background
    try {
      const userWallets = await getUserWallets(user.id);
      if (userWallets && Array.isArray(userWallets)) {
        setWallets(userWallets);
        // Save to cache for next time
        localStorage.setItem(`pexly_wallet_cache_${user.id}`, JSON.stringify(userWallets));
      }
    } catch (error) {
      console.error("Wallet Page: Sync failed:", error);
      if (!localStorage.getItem(`pexly_wallet_cache_${user.id}`)) {
        setWallets([]);
      }
    } finally {
      setIsWalletLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWalletData(true); // Enable cache on initial load
    } else {
      setWallets([]);
    }
  }, [user]);

  if (!loading && !user) {
    return null;
  }

  const walletsForDialog = (wallets || []).map(wallet => {
    if (!wallet) return null;
    try {
      const symbol = wallet.crypto_symbol || "";
      return {
        symbol: symbol,
        balance: wallet.balance || 0,
        name: symbol === "BTC" ? "Bitcoin" : 
              symbol === "ETH" ? "Ethereum" :
              symbol === "SOL" ? "Solana" :
              symbol === "USDT" ? "Tether" :
              symbol === "USDC" ? "USD Coin" : 
              symbol === "BNB" ? "BNB" :
              symbol === "XRP" ? "XRP" :
              symbol === "MATIC" ? "Polygon" :
              symbol === "ARB" ? "Arbitrum" :
              symbol === "OP" ? "Optimism" :
              symbol,
        icon: symbol
      };
    } catch (e) {
      console.error("Wallet Page: Error mapping wallet for dialog:", e);
      return null;
    }
  }).filter((w): w is NonNullable<typeof w> => w !== null);

  const [selectedAsset, setSelectedAsset] = useState<string | undefined>();

  const handleSend = (symbol?: string) => {
    setSelectedAsset(symbol);
    setSendDialogOpen(true);
  };

  const handleReceive = (symbol?: string) => {
    setSelectedAsset(symbol);
    if (symbol) {
      setReceiveDialogOpen(true);
    } else {
      setReceiveMethodDialogOpen(true);
    }
  };

  const handleSelectReceiveMethod = (method: "crypto" | "fiat" | "p2p") => {
    setReceiveMethodDialogOpen(false);
    if (method === "crypto") {
      setReceiveDialogOpen(true);
    } else if (method === "fiat") {
      setLocation("/buy-crypto");
    } else if (method === "p2p") {
      setLocation("/p2p");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-background transition-colors">
      <Helmet>
        <title>My Wallet | Manage Assets | Pexly</title>
        <meta name="description" content="View and manage your cryptocurrency assets. Securely send, receive, and swap Bitcoin, Ethereum, and more." />
      </Helmet>
      <div className="flex-1 w-full mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6 sm:mb-8 px-4 sm:px-0 text-foreground">My assets</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="px-4 sm:px-0">
                <Tabs defaultValue="wallet" className="w-full">
                  <TabsList className="bg-transparent p-0 h-auto gap-1">
                    <TabsTrigger value="wallet" className="rounded-lg px-6 py-2 data-[state=active]:bg-[#B4F22E] data-[state=active]:text-black font-semibold border bg-white dark:bg-card text-foreground transition-colors">
                      <WalletIcon className="h-4 w-4 mr-2" />
                      Wallet
                    </TabsTrigger>
                    <TabsTrigger value="visa" className="rounded-lg px-6 py-2 font-semibold border bg-white dark:bg-card text-foreground opacity-60 transition-colors">
                      <Landmark className="h-4 w-4 mr-2" />
                      Visa card
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Card className="border-none sm:border shadow-sm bg-white dark:bg-card overflow-hidden sm:rounded-2xl rounded-none transition-colors">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <WalletHeader 
                      onSend={() => handleSend()}
                      onReceive={() => handleReceive()}
                      onSwap={() => setLocation("/swap")}
                      onTopup={() => setLocation("/wallet/mobile-topup")}
                    />
                    
                    <div className="p-6">
                      {isWalletLoading && wallets.length === 0 ? (
                        <div className="space-y-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between py-4">
                              <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-5 w-32" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <Skeleton className="h-5 w-24 ml-auto" />
                                <Skeleton className="h-3 w-16 ml-auto" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <AssetList 
                          onSend={handleSend}
                          onReceive={handleReceive}
                          onSwap={(symbol) => setLocation(symbol ? `/swap?symbol=${symbol}` : "/swap")}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6 px-4 sm:px-0">
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
        initialSymbol={selectedAsset}
        onSuccess={loadWalletData}
      />

      <ReceiveCryptoDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        wallets={walletsForDialog}
        initialSymbol={selectedAsset}
      />

      <ReceiveMethodDialog
        open={receiveMethodDialogOpen}
        onOpenChange={setReceiveMethodDialogOpen}
        onSelectMethod={handleSelectReceiveMethod}
      />
    </div>
  );
}
