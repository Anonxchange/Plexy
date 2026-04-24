import { useHead } from "@unhead/react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { SendCryptoDialog } from "@/components/send-crypto-dialog";
import { ReceiveCryptoDialog } from "@/components/receive-crypto-dialog";
import { ReceiveMethodDialog } from "@/components/receive-method-dialog";
import { type Wallet, getUserWallets } from "@/lib/wallet-api";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import { getSupabase } from "@/lib/supabase";
import { useWalletData } from "@/hooks/use-wallet-data";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { AssetList } from "@/components/wallet/AssetList";
import { WalletSetupDialog } from "@/components/wallet/WalletSetupDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Landmark, ChevronRight, Gift } from "lucide-react";

export default function WalletPage() {
  useHead({ title: "My Wallet | Pexly", meta: [{ name: "description", content: "Send, receive, swap, stake, pay bills, and manage all your crypto assets in one place." }] });
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receiveMethodDialogOpen, setReceiveMethodDialogOpen] = useState(false);
  const { data: wallet, isLoading: isWalletLoading, isError: isWalletError, isRefetching } = useWalletData();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  // Address of an existing server-side wallet — when set, the dialog opens in
  // "import / sync" mode instead of "create new" mode. Prevents the dangerous
  // race condition of creating a duplicate wallet over an existing one.
  const [importExpectedAddress, setImportExpectedAddress] = useState<string | null>(null);

  // showSkeleton is true while loading (includes live balance fetch) or fetching without existing data.
  // Only show skeleton on error when there's no cached data to fall back to.
  const showSkeleton = isWalletLoading || (isRefetching && !wallet) || (isWalletError && !wallet);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    }
  }, [user, loading, setLocation]);

  // ────────────────────────────────────────────────────────────────────────
  // Wallet existence check — race-condition safe
  // ----------------------------------------------------------------------
  // Old logic only checked the LOCAL browser cache, which was wrong:
  //   • New device / cleared cache → opens "create new" → would overwrite
  //     the user's existing server wallet, locking them out of their funds.
  //   • Slow network / transient API error → wallet feed momentarily empty
  //     → opens "create new" prematurely.
  //
  // New logic: server (Supabase user_wallets) is the source of truth.
  //   1) Wait for the wallet feed to either succeed or stop loading entirely
  //      (no opening the dialog while still in flight or while errored).
  //   2) Query Supabase directly for any user_wallets row. Retry up to
  //      3 times with backoff to absorb transient network failures.
  //   3) If the server has wallets but local doesn't → open dialog in
  //      IMPORT mode with the existing address as expectedAddress.
  //   4) If neither has wallets → open dialog in CREATE mode.
  //   5) If server check itself fails after retries → do nothing
  //      (better to show empty wallet than to risk overwriting funds).
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    // Don't even consider opening the dialog while data is in flight or errored
    if (isWalletLoading || isRefetching || isWalletError) return;
    // Only proceed when wallet feed says definitively "no assets"
    if (!wallet || wallet.assets.length > 0) return;
    // Don't re-open if it's already open / dismissed
    if (setupDialogOpen) return;

    let cancelled = false;

    const checkWalletsRaceSafe = async () => {
      // Step 1: ask local cache (fast, offline-capable)
      const localWallets = await (nonCustodialWalletManager as any).getWalletsFromStorage(user.id);
      if (cancelled) return;

      if (localWallets.length > 0) {
        // Local wallet exists — nothing to do, no dialog needed
        return;
      }

      // Step 2: ask Supabase as the source of truth, with retry
      const fetchServerWallets = async (): Promise<{ ok: boolean; address: string | null }> => {
        try {
          const supabase = await getSupabase();
          const { data, error } = await supabase
            .from('user_wallets')
            .select('address, chain_id, is_active')
            .eq('user_id', user.id)
            .eq('is_active', 'true')
            .limit(1);
          if (error) return { ok: false, address: null };
          // Prefer the ETH wallet's address as the canonical "expected" address
          // since that's what loadWalletsFromSupabase uses for verification.
          const eth = (data ?? []).find((r: any) =>
            (r.chain_id || '').toLowerCase().includes('ethereum')
          );
          const first = (data ?? [])[0];
          return { ok: true, address: eth?.address ?? first?.address ?? null };
        } catch {
          return { ok: false, address: null };
        }
      };

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let attempt = 0;
      let serverResult: { ok: boolean; address: string | null } = { ok: false, address: null };
      while (attempt < 3) {
        if (cancelled) return;
        serverResult = await fetchServerWallets();
        if (serverResult.ok) break;
        attempt += 1;
        await sleep(500 * attempt); // 500ms, 1000ms, 1500ms backoff
      }
      if (cancelled) return;

      if (!serverResult.ok) {
        // Could not confirm server state after retries — refuse to open
        // the create dialog. Safer to leave the wallet appearing empty
        // than to risk creating a duplicate over real funds.
        return;
      }

      if (serverResult.address) {
        // Server has a wallet but this device doesn't — sync flow
        setImportExpectedAddress(serverResult.address);
      } else {
        // Genuinely no wallet anywhere — fresh creation flow
        setImportExpectedAddress(null);
      }
      setSetupDialogOpen(true);
    };

    checkWalletsRaceSafe();
    return () => {
      cancelled = true;
    };
  }, [user, isWalletLoading, isRefetching, isWalletError, wallet, setupDialogOpen]);

  if (!loading && !user) {
    setLocation("/signin");
    return null;
  }

  const walletsForDialog = (wallet?.assets || []).map(asset => ({
    symbol: asset.symbol,
    balance: asset.balance,
    name: asset.name,
    icon: asset.symbol
  }));

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
      <div className="flex-1 w-full mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6 sm:mb-8 px-4 sm:px-0 text-foreground">My assets</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="px-4 sm:px-0">
                <Tabs defaultValue="wallet" className="w-full">
                  <TabsList className="bg-transparent p-0 h-auto gap-1">
                    <TabsTrigger
                      value="wallet"
                      className="rounded-lg px-6 py-2 font-semibold border border-border bg-white text-foreground transition-colors dark:bg-muted data-[state=active]:bg-[#B4F22E] data-[state=active]:text-black data-[state=active]:border-[#B4F22E] dark:data-[state=active]:bg-[#B4F22E] dark:data-[state=active]:text-black dark:data-[state=active]:border-[#B4F22E]"
                    >
                      <WalletIcon className="h-4 w-4 mr-2" />
                      Wallet
                    </TabsTrigger>
                    <TabsTrigger
                      value="visa"
                      onClick={() => setLocation("/wallet/visa-card")}
                      className="rounded-lg px-6 py-2 font-semibold border border-border bg-white dark:bg-muted text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors"
                    >
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
                      {showSkeleton ? (
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
                    <span className="font-bold text-sm">Trading limits</span>
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
        onSuccess={() => {}}
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

      {user && (
        <WalletSetupDialog
          open={setupDialogOpen}
          onOpenChange={setSetupDialogOpen}
          userId={user.id}
          expectedAddress={importExpectedAddress}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
