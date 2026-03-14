import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, ChevronDown, ClipboardList, Loader2, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading, asterWallet } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const TRANSFER_ASSETS = ["USDT", "BTC", "ETH", "BNB", "SOL"];

const PerpetualAccountBar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "history">("deposit");
  const [asset, setAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [assetOpen, setAssetOpen] = useState(false);

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openSheet = (tab: "deposit" | "withdraw") => {
    if (!user) { navigate("/signin"); return; }
    setActiveTab(tab);
    setSheetOpen(true);
  };

  const { data: futuresBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["futures-balance"],
    queryFn: () => asterTrading.futuresBalance(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: futuresAccount, isLoading: accountLoading } = useQuery({
    queryKey: ["futures-account"],
    queryFn: () => asterTrading.futuresAccount(),
    enabled: !!user && sheetOpen,
    staleTime: 15_000,
  });

  const { data: spotAccount } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user && sheetOpen,
    staleTime: 15_000,
  });

  const usdtFutures = Array.isArray(futuresBalance)
    ? futuresBalance.find((b: any) => b.asset === "USDT")
    : null;

  const displayBalance = user
    ? balanceLoading
      ? "..."
      : `${parseFloat(usdtFutures?.availableBalance || "0").toFixed(2)} USDT`
    : "--";

  const spotAvailable = spotAccount?.balances
    ? parseFloat(spotAccount.balances.find((b: any) => b.asset === asset)?.free || "0")
    : 0;

  const futuresAvailable = Array.isArray(futuresBalance)
    ? parseFloat(futuresBalance.find((b: any) => b.asset === asset)?.availableBalance || "0")
    : 0;

  const marginBalance = parseFloat(futuresAccount?.totalMarginBalance || "0");
  const unrealizedPnl = parseFloat(futuresAccount?.totalUnrealizedProfit || "0");
  const availableMargin = parseFloat(futuresAccount?.availableBalance || "0");
  const marginRatio = futuresAccount?.totalMaintMargin && futuresAccount?.totalMarginBalance
    ? ((parseFloat(futuresAccount.totalMaintMargin) / parseFloat(futuresAccount.totalMarginBalance)) * 100).toFixed(2)
    : null;

  const transferMutation = useMutation({
    mutationFn: () => {
      const type = activeTab === "deposit" ? "SPOT_TO_FUTURES" : "FUTURES_TO_SPOT";
      return asterWallet.transfer(asset, amount, type);
    },
    onSuccess: () => {
      toast({
        title: "Transfer successful",
        description: `${amount} ${asset} transferred to ${activeTab === "deposit" ? "Perpetual" : "Spot"} account.`,
      });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["futures-balance"] });
      queryClient.invalidateQueries({ queryKey: ["futures-account"] });
      queryClient.invalidateQueries({ queryKey: ["spot-account"] });
    },
    onError: (err: Error) => {
      toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
    },
  });

  const handleMax = () => {
    const max = activeTab === "deposit" ? spotAvailable : futuresAvailable;
    setAmount(max.toString());
  };

  return (
    <>
      <div className="flex items-center justify-between h-12 px-4 border-y border-border bg-card">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Perpetual Acct.</span>
          <span className="text-foreground font-mono-num">{displayBalance}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openSheet("deposit")}
            className="px-4 py-1.5 rounded text-sm text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
          >
            Deposit
          </button>
          <button
            onClick={() => openSheet("withdraw")}
            className="px-4 py-1.5 rounded text-sm text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
          >
            Withdraw
          </button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-t border-border rounded-t-2xl px-5 pb-8 pt-5 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Perpetual Account</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Perpetual Account</h2>
            <button onClick={() => setSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1 text-sm">
              {(["deposit", "withdraw", "history"] as const).map((tab, i) => (
                <div key={tab} className="flex items-center">
                  {i > 0 && <span className="text-muted-foreground/40 mx-2">|</span>}
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`font-medium capitalize ${activeTab === tab ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </div>
              ))}
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          {activeTab === "history" ? (
            <div className="flex flex-col items-center py-10">
              <span className="text-sm text-muted-foreground">No transfer history</span>
            </div>
          ) : (
            <>
              {/* From / To accounts */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 border border-border rounded-lg px-4 py-3">
                  <div className="text-[10px] text-muted-foreground mb-0.5">
                    {activeTab === "deposit" ? "From" : "To"}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Spot account</span>
                  </div>
                </div>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 border border-border rounded-lg px-4 py-3">
                  <div className="text-[10px] text-muted-foreground mb-0.5">
                    {activeTab === "deposit" ? "To" : "From"}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Perpetual account</span>
                  </div>
                </div>
              </div>

              {/* Asset selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => setAssetOpen(!assetOpen)}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <span className="text-sm text-muted-foreground">Asset</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-[10px] font-bold text-foreground">{asset.slice(0, 2)}</span>
                    </div>
                    <span className="text-sm text-foreground">{asset}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                {assetOpen && (
                  <div className="absolute z-50 right-0 w-48 mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {TRANSFER_ASSETS.map(a => (
                      <button key={a} onClick={() => { setAsset(a); setAssetOpen(false); setAmount(""); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${a === asset ? "text-trading-amber" : "text-foreground"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount input */}
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button onClick={handleMax} className="text-xs text-trading-amber font-semibold ml-2 shrink-0">MAX</button>
              </div>

              {/* Balance row */}
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs text-muted-foreground">
                  Available ({activeTab === "deposit" ? "Spot" : "Perpetual"})
                </span>
                <span className="text-xs text-foreground font-mono-num">
                  {activeTab === "deposit"
                    ? `${spotAvailable.toFixed(4)} ${asset}`
                    : `${futuresAvailable.toFixed(4)} ${asset}`}
                </span>
              </div>

              {/* Futures account overview */}
              <div className="bg-secondary rounded-lg p-3 mb-5">
                <div className="text-xs text-muted-foreground font-medium mb-2">Perpetual overview</div>
                {accountLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading…</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <span className="text-muted-foreground">Margin Balance</span>
                    <span className="text-foreground font-mono-num text-right">{marginBalance.toFixed(2)} USDT</span>
                    <span className="text-muted-foreground">Unrealized PnL</span>
                    <span className={`font-mono-num text-right ${unrealizedPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                      {unrealizedPnl >= 0 ? "+" : ""}{unrealizedPnl.toFixed(2)} USDT
                    </span>
                    <span className="text-muted-foreground">Available Margin</span>
                    <span className="text-foreground font-mono-num text-right">{availableMargin.toFixed(2)} USDT</span>
                    <span className="text-muted-foreground">Margin Ratio</span>
                    <span className="text-foreground font-mono-num text-right">{marginRatio ? `${marginRatio}%` : "--%"}</span>
                  </div>
                )}
              </div>

              {/* CTA button */}
              <button
                onClick={() => transferMutation.mutate()}
                disabled={!amount || parseFloat(amount) <= 0 || transferMutation.isPending}
                className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {transferMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {activeTab === "deposit" ? "Transfer to Perpetual" : "Transfer to Spot"}
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PerpetualAccountBar;
