import { useState, useMemo } from "react";
import { ListFilter, ChevronDown, ClipboardList, Copy, Check, Loader2, XCircle, AlertCircle } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import DesktopOrderBook from "./DesktopOrderBook";
import TradePanel from "./TradePanel";
import PairInfo from "./PairInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const { data: coinInfoData } = useQuery({
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

  const selectedNetworkInfo = useMemo(() =>
    selectedCoinInfo?.networkList.find(n => n.network === network),
    [selectedCoinInfo, network]
  );

  const handleCoinChange = (c: string) => {
    const info = coins.find(ci => ci.coin === c);
    const nets = sheetTab === "withdraw"
      ? info?.networkList.filter(n => n.withdrawEnable).map(n => n.network)
      : info?.networkList.filter(n => n.depositEnable).map(n => n.network);
    setCoin(c);
    setNetwork(nets?.[0] ?? "ETH");
    setCoinOpen(false);
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

  const queryClient = useQueryClient();
  const apiSymbol = pair.replace("/", "");

  const { data: openOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["spot-open-orders", apiSymbol],
    queryFn: () => asterTrading.spotOpenOrders(apiSymbol),
    enabled: !!user && activeTab === "Open orders",
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const { data: allOrders, isLoading: allOrdersLoading } = useQuery({
    queryKey: ["spot-all-orders", apiSymbol],
    queryFn: () => asterTrading.spotAllOrders(apiSymbol),
    enabled: !!user && activeTab === "Order history",
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ symbol, orderId }: { symbol: string; orderId: string }) =>
      asterTrading.spotCancelOrder(symbol, orderId),
    onSuccess: () => {
      toast({ title: "Order cancelled" });
      queryClient.invalidateQueries({ queryKey: ["spot-open-orders"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    },
  });

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
      <div className="col-start-1 col-end-3 row-start-4 overflow-auto">
        {!user ? (
          <div className="flex items-center justify-center py-4">
            <button onClick={() => navigate("/signin")} className="text-sm text-trading-amber hover:underline">
              Sign in to view orders
            </button>
          </div>
        ) : activeTab === "Open orders" ? (
          ordersLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-2 font-normal">Symbol</th>
                  <th className="text-left px-4 py-2 font-normal">Side</th>
                  <th className="text-left px-4 py-2 font-normal">Type</th>
                  <th className="text-right px-4 py-2 font-normal">Price</th>
                  <th className="text-right px-4 py-2 font-normal">Amount</th>
                  <th className="text-right px-4 py-2 font-normal">Filled</th>
                  <th className="text-right px-4 py-2 font-normal">Cancel</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(openOrders) && openOrders.length > 0 ? openOrders.map((o: any) => (
                  <tr key={o.orderId} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-2 text-foreground">{o.symbol}</td>
                    <td className={`px-4 py-2 font-medium ${o.side === "BUY" ? "text-trading-green" : "text-trading-red"}`}>{o.side}</td>
                    <td className="px-4 py-2 text-muted-foreground">{o.type}</td>
                    <td className="px-4 py-2 text-right font-mono-num">{parseFloat(o.price).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-mono-num">{parseFloat(o.origQty).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-mono-num text-muted-foreground">{parseFloat(o.executedQty).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => cancelMutation.mutate({ symbol: o.symbol, orderId: String(o.orderId) })} disabled={cancelMutation.isPending} className="text-trading-red hover:opacity-70">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No open orders</td></tr>
                )}
              </tbody>
            </table>
          )
        ) : activeTab === "Assets" ? (
          balanceLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-2 font-normal">Asset</th>
                  <th className="text-right px-4 py-2 font-normal">Available</th>
                  <th className="text-right px-4 py-2 font-normal">In Order</th>
                </tr>
              </thead>
              <tbody>
                {(spotAccount?.balances ?? []).filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0).map((b: any) => (
                  <tr key={b.asset} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-2 font-medium text-foreground">{b.asset}</td>
                    <td className="px-4 py-2 text-right font-mono-num">{parseFloat(b.free).toFixed(6)}</td>
                    <td className="px-4 py-2 text-right font-mono-num text-muted-foreground">{parseFloat(b.locked).toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === "Order history" ? (
          allOrdersLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-2 font-normal">Symbol</th>
                  <th className="text-left px-4 py-2 font-normal">Side</th>
                  <th className="text-left px-4 py-2 font-normal">Type</th>
                  <th className="text-right px-4 py-2 font-normal">Price</th>
                  <th className="text-right px-4 py-2 font-normal">Amount</th>
                  <th className="text-right px-4 py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(allOrders) && allOrders.length > 0 ? allOrders.slice(0, 50).map((o: any) => (
                  <tr key={o.orderId} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-2 text-foreground">{o.symbol}</td>
                    <td className={`px-4 py-2 font-medium ${o.side === "BUY" ? "text-trading-green" : "text-trading-red"}`}>{o.side}</td>
                    <td className="px-4 py-2 text-muted-foreground">{o.type}</td>
                    <td className="px-4 py-2 text-right font-mono-num">{parseFloat(o.price).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-mono-num">{parseFloat(o.origQty).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{o.status}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No order history</td></tr>
                )}
              </tbody>
            </table>
          )
        ) : (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">Coming soon</div>
        )}
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
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">{coin.slice(0, 3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {coins.map(c => (
                      <button key={c.coin} onClick={() => handleCoinChange(c.coin)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-trading-amber" : "text-foreground"}`}>
                        {c.coin} <span className="text-muted-foreground text-xs ml-1">{c.name}</span>
                      </button>
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
                    {depositNetworks.map(n => (
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
                  <div className="flex items-center gap-2 py-1">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">No address available</span>
                  </div>
                )}
              </div>
              {selectedNetworkInfo?.depositMin && (
                <div className="text-xs text-muted-foreground mb-2">Minimum deposit: {selectedNetworkInfo.depositMin} {coin}</div>
              )}
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
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-foreground">{coin.slice(0, 3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {coins.map(c => (
                      <button key={c.coin} onClick={() => handleCoinChange(c.coin)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-trading-amber" : "text-foreground"}`}>
                        {c.coin} <span className="text-muted-foreground text-xs ml-1">{c.name}</span>
                      </button>
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
                    {withdrawNetworks.map(n => (
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
              {selectedNetworkInfo && (
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-xs text-muted-foreground">Fee</span>
                  <span className="text-xs text-foreground font-mono-num">{selectedNetworkInfo.withdrawFee} {coin}</span>
                </div>
              )}
              {selectedNetworkInfo && (
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs text-muted-foreground">Min withdrawal</span>
                  <span className="text-xs text-foreground font-mono-num">{selectedNetworkInfo.withdrawMin} {coin}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-6 px-1">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="text-sm text-foreground font-mono-num">
                  {balanceLoading ? "..." : `${parseFloat(spotAccount?.balances?.find((b: any) => b.asset === coin)?.free ?? "0").toFixed(coin === "BTC" ? 8 : 4)} ${coin}`}
                </span>
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
