import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, ChevronDown, ClipboardList, Copy, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { asterTrading, asterWallet } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const NETWORKS: Record<string, string[]> = {
  USDT: ["ETH", "TRX", "BNB", "SOL"],
  BTC:  ["BTC"],
  ETH:  ["ETH"],
  BNB:  ["BNB"],
  SOL:  ["SOL"],
};

const COINS = ["USDT", "BTC", "ETH", "BNB", "SOL"];

const AccountBar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");
  const [coin, setCoin] = useState("USDT");
  const [network, setNetwork] = useState("ETH");
  const [coinOpen, setCoinOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Withdraw fields
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const openSheet = (tab: "deposit" | "withdraw") => {
    if (!user) { navigate("/signin"); return; }
    setActiveTab(tab);
    setSheetOpen(true);
  };

  // Fetch spot account balance
  const { data: spotAccount, isLoading: balanceLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const usdtBalance = spotAccount?.balances
    ? spotAccount.balances.find((b: any) => b.asset === "USDT")?.free ?? "0.00"
    : null;

  const selectedCoinBalance = spotAccount?.balances
    ? parseFloat(spotAccount.balances.find((b: any) => b.asset === coin)?.free ?? "0")
    : 0;

  // Fetch deposit address when on deposit tab
  const { data: depositData, isLoading: depositLoading } = useQuery({
    queryKey: ["deposit-address", coin, network],
    queryFn: () => asterWallet.depositAddress(coin, network),
    enabled: !!user && sheetOpen && activeTab === "deposit",
    staleTime: 60_000,
  });

  const depositAddress = depositData?.address ?? "";

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: () => asterWallet.withdraw(coin, withdrawAddress, withdrawAmount, network),
    onSuccess: () => {
      toast({ title: "Withdrawal submitted", description: `${withdrawAmount} ${coin} withdrawal is being processed.` });
      setWithdrawAddress("");
      setWithdrawAmount("");
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    },
  });

  const handleCopy = () => {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayBalance = user
    ? balanceLoading ? "..." : `${parseFloat(usdtBalance || "0").toFixed(2)} USDT`
    : "--";

  return (
    <>
      <div className="flex items-center justify-between h-12 px-4 border-y border-border bg-card">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Spot Acct.</span>
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
        <SheetContent side="bottom" className="bg-card border-t border-border rounded-t-2xl px-5 pb-8 pt-5 max-h-[85vh]">
          <SheetHeader className="sr-only">
            <SheetTitle>Spot Account</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
            <button onClick={() => setSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1 text-sm">
              {(["deposit", "withdraw", "transfer"] as const).map((tab, i) => (
                <div key={tab} className="flex items-center">
                  {i > 0 && <span className="text-muted-foreground/40 mx-2">|</span>}
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`capitalize font-medium ${activeTab === tab ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </div>
              ))}
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* ── DEPOSIT ── */}
          {activeTab === "deposit" && (
            <>
              {/* Coin selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => setCoinOpen(!coinOpen)}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">{coin.slice(0,3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {COINS.map(c => (
                      <button key={c} onClick={() => { setCoin(c); setNetwork(NETWORKS[c][0]); setCoinOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c === coin ? "text-trading-amber" : "text-foreground"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Network selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => setNetworkOpen(!networkOpen)}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <span className="text-sm text-foreground">{network}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {networkOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {(NETWORKS[coin] || []).map(n => (
                      <button key={n} onClick={() => { setNetwork(n); setNetworkOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${n === network ? "text-trading-amber" : "text-foreground"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Deposit address */}
              <div className="border border-border rounded-lg px-4 py-3 mb-4">
                <div className="text-xs text-muted-foreground mb-1">Deposit Address ({network})</div>
                {depositLoading ? (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Fetching address…</span>
                  </div>
                ) : depositAddress ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground font-mono break-all">{depositAddress}</span>
                    <button onClick={handleCopy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                      {copied ? <Check className="h-4 w-4 text-trading-green" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No address available</span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-6">
                Only send {coin} on the {network} network to this address. Sending any other asset may result in permanent loss.
              </p>

              <button
                onClick={handleCopy}
                disabled={!depositAddress}
                className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50"
              >
                {copied ? "Copied!" : "Copy Address"}
              </button>
            </>
          )}

          {/* ── WITHDRAW ── */}
          {activeTab === "withdraw" && (
            <>
              {/* Coin selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => setCoinOpen(!coinOpen)}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-foreground">{coin.slice(0,3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {COINS.map(c => (
                      <button key={c} onClick={() => { setCoin(c); setNetwork(NETWORKS[c][0]); setCoinOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c === coin ? "text-trading-amber" : "text-foreground"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Network selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => setNetworkOpen(!networkOpen)}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <span className="text-sm text-foreground">{network}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {networkOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {(NETWORKS[coin] || []).map(n => (
                      <button key={n} onClick={() => { setNetwork(n); setNetworkOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${n === network ? "text-trading-amber" : "text-foreground"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Address input */}
              <div className="border border-border rounded-lg px-4 py-3 mb-4">
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={e => setWithdrawAddress(e.target.value)}
                  placeholder="Withdrawal address"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              {/* Amount input */}
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <span className="text-sm text-foreground ml-2">{coin}</span>
              </div>

              <div className="flex items-center justify-between mb-6 px-1">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="text-sm text-foreground font-mono-num">
                  {balanceLoading ? "..." : `${selectedCoinBalance.toFixed(coin === "BTC" ? 8 : 4)} ${coin}`}
                </span>
              </div>

              <button
                onClick={() => withdrawMutation.mutate()}
                disabled={!withdrawAddress || !withdrawAmount || withdrawMutation.isPending}
                className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {withdrawMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Withdraw {coin}
              </button>
            </>
          )}

          {/* ── TRANSFER ── */}
          {activeTab === "transfer" && (
            <div className="flex flex-col items-center py-10">
              <span className="text-sm text-muted-foreground">
                Use the Perpetual account bar to transfer between Spot and Futures.
              </span>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AccountBar;
