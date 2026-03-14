import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, ChevronDown, ClipboardList, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { asterTrading, asterWallet, CoinInfo } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const CHAIN_ID_MAP: Record<string, string> = {
  ETH: "1",
  BSC: "56",
  BNB: "56",
  ARB: "42161",
  ARBI: "42161",
  ARBITRUM: "42161",
};

const FALLBACK_COINS: CoinInfo[] = [
  { coin: "USDT", name: "Tether", free: "0", locked: "0", networkList: [
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "1", withdrawMin: "10", depositMin: "10" },
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5", withdrawMin: "5", depositMin: "5" },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5", withdrawMin: "5", depositMin: "5" },
  ]},
  { coin: "BTC", name: "Bitcoin", free: "0", locked: "0", networkList: [
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "0.0001", withdrawMin: "0.001", depositMin: "0.001" },
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.0001", withdrawMin: "0.001", depositMin: "0.001" },
  ]},
  { coin: "ETH", name: "Ethereum", free: "0", locked: "0", networkList: [
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001", withdrawMin: "0.01", depositMin: "0.01" },
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001", withdrawMin: "0.01", depositMin: "0.01" },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.0005", withdrawMin: "0.005", depositMin: "0.005" },
  ]},
  { coin: "BNB", name: "BNB", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001", withdrawMin: "0.01", depositMin: "0.01" },
  ]},
];

const AccountBar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");
  const [coin, setCoin] = useState("USDT");
  const [network, setNetwork] = useState("ETH");
  const [coinOpen, setCoinOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const { data: spotAccount, isLoading: balanceLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: coinInfoData, isLoading: coinInfoLoading } = useQuery({
    queryKey: ["coin-info"],
    queryFn: () => asterWallet.coinInfo(),
    enabled: !!user && sheetOpen,
    staleTime: 60_000,
    retry: 1,
  });

  const coins: CoinInfo[] = useMemo(() => {
    if (Array.isArray(coinInfoData) && coinInfoData.length > 0) return coinInfoData;
    return FALLBACK_COINS;
  }, [coinInfoData]);

  const selectedCoinInfo = useMemo(() =>
    coins.find(c => c.coin === coin) ?? coins[0],
    [coins, coin]
  );

  const depositNetworks = useMemo(() =>
    selectedCoinInfo?.networkList.filter(n => n.depositEnable).map(n => n.network) ?? ["ETH"],
    [selectedCoinInfo]
  );

  const withdrawNetworks = useMemo(() =>
    selectedCoinInfo?.networkList.filter(n => n.withdrawEnable).map(n => n.network) ?? ["ETH"],
    [selectedCoinInfo]
  );

  const currentNetworks = activeTab === "withdraw" ? withdrawNetworks : depositNetworks;

  const selectedNetworkInfo = useMemo(() =>
    selectedCoinInfo?.networkList.find(n => n.network === network),
    [selectedCoinInfo, network]
  );

  const handleCoinChange = (c: string, newCoins: CoinInfo[]) => {
    const info = newCoins.find(ci => ci.coin === c);
    const nets = activeTab === "withdraw"
      ? info?.networkList.filter(n => n.withdrawEnable).map(n => n.network)
      : info?.networkList.filter(n => n.depositEnable).map(n => n.network);
    setCoin(c);
    setNetwork(nets?.[0] ?? "ETH");
    setCoinOpen(false);
  };

  const usdtBalance = spotAccount?.balances
    ? spotAccount.balances.find((b: any) => b.asset === "USDT")?.free ?? "0.00"
    : null;

  const selectedCoinBalance = spotAccount?.balances
    ? parseFloat(spotAccount.balances.find((b: any) => b.asset === coin)?.free ?? "0")
    : 0;

  const { data: depositData, isLoading: depositLoading, error: depositError } = useQuery({
    queryKey: ["deposit-address", coin, network],
    queryFn: () => asterWallet.depositAddress(coin, network),
    enabled: !!user && sheetOpen && activeTab === "deposit",
    staleTime: 60_000,
    retry: 1,
  });

  const depositAddress = depositData?.address ?? "";

  const withdrawMutation = useMutation({
    mutationFn: () => {
      const chainId = CHAIN_ID_MAP[network.toUpperCase()];
      return asterWallet.withdraw(coin, withdrawAddress, withdrawAmount, chainId ?? network);
    },
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
        <SheetContent side="bottom" className="bg-card border-t border-border rounded-t-2xl px-5 pb-8 pt-5 max-h-[85vh] overflow-y-auto">
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

          {/* Loading coin info */}
          {coinInfoLoading && (
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Fetching available coins…</span>
            </div>
          )}

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
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">{coin.slice(0, 3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {coins.map(c => (
                      <button key={c.coin} onClick={() => handleCoinChange(c.coin, coins)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-trading-amber" : "text-foreground"}`}>
                        {c.coin} <span className="text-muted-foreground text-xs ml-1">{c.name}</span>
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
                    {depositNetworks.map(n => (
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
                ) : depositError ? (
                  <div className="flex items-center gap-2 py-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">Unable to fetch address. Try again.</span>
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

              {selectedNetworkInfo?.depositMin && (
                <div className="text-xs text-muted-foreground mb-2">
                  Minimum deposit: {selectedNetworkInfo.depositMin} {coin}
                </div>
              )}

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
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-foreground">{coin.slice(0, 3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {coins.map(c => (
                      <button key={c.coin} onClick={() => handleCoinChange(c.coin, coins)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-trading-amber" : "text-foreground"}`}>
                        {c.coin} <span className="text-muted-foreground text-xs ml-1">{c.name}</span>
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
                    {withdrawNetworks.map(n => (
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

              {selectedNetworkInfo && (
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-xs text-muted-foreground">Fee</span>
                  <span className="text-xs text-foreground font-mono-num">
                    {selectedNetworkInfo.withdrawFee} {coin}
                  </span>
                </div>
              )}
              {selectedNetworkInfo && (
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-xs text-muted-foreground">Min withdrawal</span>
                  <span className="text-xs text-foreground font-mono-num">
                    {selectedNetworkInfo.withdrawMin} {coin}
                  </span>
                </div>
              )}

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
