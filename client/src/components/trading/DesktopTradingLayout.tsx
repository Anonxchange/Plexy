import { useState } from "react";
import { ListFilter, ChevronDown, ClipboardList, Copy, Check, Loader2 } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import DesktopOrderBook from "./DesktopOrderBook";
import TradePanel from "./TradePanel";
import PairInfo from "./PairInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP", "Order history", "Position History", "Trade history", "Transaction history"];

interface DesktopTradingLayoutProps {
  chartVisible: boolean;
  pair: string;
  onPairChange: (pair: string) => void;
  onToggleChart: () => void;
}

const DesktopTradingLayout = ({
  chartVisible,
  pair,
  onPairChange,
  onToggleChart,
}: DesktopTradingLayoutProps) => {
  const [activeTab, setActiveTab] = useState("Open orders");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");
  const [coin, setCoin] = useState("USDT");
  const [network, setNetwork] = useState("ETH");
  const [coinOpen, setCoinOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const openSheet = (tab: "deposit" | "withdraw") => {
    if (!user) { navigate("/signin"); return; }
    setSheetTab(tab);
    setSheetOpen(true);
  };

  const { data: spotAccount, isLoading: balanceLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const usdtFree = spotAccount?.balances?.find((b: any) => b.asset === "USDT")?.free ?? "0.00";
  const asterFree = spotAccount?.balances?.find((b: any) => b.asset === "ASTER")?.free ?? "0.00000000";

  const { data: depositData, isLoading: depositLoading } = useQuery({
    queryKey: ["deposit-address", coin, network],
    queryFn: () => asterWallet.depositAddress(coin, network),
    enabled: !!user && sheetOpen && sheetTab === "deposit",
    staleTime: 60_000,
  });
  const depositAddress = depositData?.address ?? "";

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

  return (
    <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr] grid-rows-[auto_1fr_auto_minmax(120px,auto)] h-full min-h-0 overflow-hidden border-t border-border">
      {/* Pair Info */}
      <div className="col-start-1 row-start-1 border-b border-border min-w-0">
        <PairInfo
          pair={pair}
          onPairChange={onPairChange}
          chartVisible={chartVisible}
          onToggleChart={onToggleChart}
        />
      </div>

      {/* Chart */}
      {chartVisible && (
        <div className="col-start-1 row-start-2 min-h-0 min-w-0 h-full">
          <CandlestickChart pair={pair} className="h-full w-full" />
        </div>
      )}

      {/* OrderBook — spans rows 1-2 */}
      <div className="col-start-2 row-start-1 row-end-3 border-l border-border overflow-y-auto min-h-0">
        <DesktopOrderBook symbol={pair} />
      </div>

      {/* TradePanel — spans rows 1-2 */}
      <div className="col-start-3 row-start-1 row-end-3 border-l border-border overflow-y-auto min-h-0">
        <TradePanel symbol={pair} />
      </div>

      {/* Full-width border line */}
      <div className="col-start-1 col-end-4 row-start-3 border-t border-border" />

      {/* Tabs header + Account — spans all 3 columns */}
      <div className="col-start-1 col-end-4 row-start-3">
        <div className="flex items-center px-4 h-9">
          <div className="flex items-center gap-4 flex-1 h-full overflow-x-auto">
            {orderTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-full text-sm transition-colors border-b-2 px-1 whitespace-nowrap ${
                  activeTab === tab
                    ? "text-foreground font-semibold border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="p-1 text-muted-foreground ml-2">
            <ListFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab content + Account row */}
      <div className="col-start-1 col-end-3 row-start-4">
        <div className="flex flex-col items-center py-4">
          <span className="text-sm text-muted-foreground">
            Please connect a wallet first
          </span>
        </div>
      </div>

      {/* Account section — bottom right */}
      <div className="col-start-3 row-start-4 border-l border-border">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
          {user ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => openSheet("deposit")}
                  className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
                >
                  Deposit
                </button>
                <button
                  onClick={() => openSheet("withdraw")}
                  className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
                >
                  Withdraw
                </button>
              </div>
              <div className="text-xs text-muted-foreground mb-2 font-medium">Spot overview</div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">ASTER Available</span>
                <span className="text-foreground font-mono-num">
                  {balanceLoading ? "..." : parseFloat(asterFree).toFixed(8)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">USDT Available</span>
                <span className="text-foreground font-mono-num">
                  {balanceLoading ? "..." : parseFloat(usdtFree).toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate("/signin")}
              className="w-full py-2.5 rounded-lg text-xs font-medium bg-trading-amber text-background hover:bg-trading-amber/90"
            >
              Sign In to Trade
            </button>
          )}
        </div>
      </div>

      {/* Spot account modal */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="bg-card border border-border rounded-2xl px-5 pb-8 pt-5 max-w-md w-full">
          <DialogHeader className="sr-only">
            <DialogTitle>Spot Account</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1 text-sm">
              {(["deposit", "withdraw", "transfer"] as const).map((tab, i) => (
                <div key={tab} className="flex items-center">
                  {i > 0 && <span className="text-muted-foreground/40 mx-2">|</span>}
                  <button
                    onClick={() => setSheetTab(tab)}
                    className={`capitalize font-medium ${sheetTab === tab ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </div>
              ))}
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          {sheetTab === "deposit" && (
            <>
              <div className="relative mb-4">
                <button onClick={() => setCoinOpen(!coinOpen)} className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">{coin.slice(0,3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {COINS.map(c => (
                      <button key={c} onClick={() => { setCoin(c); setNetwork(NETWORKS[c][0]); setCoinOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c === coin ? "text-trading-amber" : "text-foreground"}`}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative mb-4">
                <button onClick={() => setNetworkOpen(!networkOpen)} className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full">
                  <span className="text-sm text-foreground">{network}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {networkOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {(NETWORKS[coin] || []).map(n => (
                      <button key={n} onClick={() => { setNetwork(n); setNetworkOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${n === network ? "text-trading-amber" : "text-foreground"}`}>{n}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="border border-border rounded-lg px-4 py-3 mb-4">
                <div className="text-xs text-muted-foreground mb-1">Deposit Address ({network})</div>
                {depositLoading ? (
                  <div className="flex items-center gap-2 py-1"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Fetching address…</span></div>
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
              <p className="text-xs text-muted-foreground mb-6">Only send {coin} on the {network} network to this address. Sending any other asset may result in permanent loss.</p>
              <button onClick={handleCopy} disabled={!depositAddress} className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50">
                {copied ? "Copied!" : "Copy Address"}
              </button>
            </>
          )}

          {sheetTab === "withdraw" && (
            <>
              <div className="relative mb-4">
                <button onClick={() => setCoinOpen(!coinOpen)} className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-foreground">{coin.slice(0,3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {COINS.map(c => (
                      <button key={c} onClick={() => { setCoin(c); setNetwork(NETWORKS[c][0]); setCoinOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c === coin ? "text-trading-amber" : "text-foreground"}`}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative mb-4">
                <button onClick={() => setNetworkOpen(!networkOpen)} className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full">
                  <span className="text-sm text-foreground">{network}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {networkOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {(NETWORKS[coin] || []).map(n => (
                      <button key={n} onClick={() => { setNetwork(n); setNetworkOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${n === network ? "text-trading-amber" : "text-foreground"}`}>{n}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="border border-border rounded-lg px-4 py-3 mb-4">
                <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder="Withdrawal address" className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
              </div>
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-2">
                <input type="text" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount" className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                <span className="text-sm text-foreground ml-2">{coin}</span>
              </div>
              <div className="flex items-center justify-between mb-6 px-1">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="text-sm text-foreground font-mono-num">{balanceLoading ? "..." : `${parseFloat(usdtFree).toFixed(2)} USDT`}</span>
              </div>
              <button onClick={() => withdrawMutation.mutate()} disabled={!withdrawAddress || !withdrawAmount || withdrawMutation.isPending} className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {withdrawMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Withdraw {coin}
              </button>
            </>
          )}

          {sheetTab === "transfer" && (
            <div className="flex flex-col items-center py-10">
              <span className="text-sm text-muted-foreground">Use the Perpetual account bar to transfer between Spot and Futures.</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopTradingLayout;
