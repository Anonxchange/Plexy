import { useState } from "react";
import { LayoutList, SlidersVertical, ClipboardList, Loader2, XCircle } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
import TradePanel from "./TradePanel";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading, asterMarket } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP"];
const chartTabs = ["Chart", "Order book", "Trades", "Depth", "Info"];

const OrderBookTwoCol = ({ symbol, mode }: { symbol: string; mode: "spot" | "futures" }) => {
  const apiSymbol = symbol.replace("/", "");
  const { data, isLoading } = useQuery({
    queryKey: ["ob-2col-spot", apiSymbol],
    queryFn: () => asterMarket.spotOrderBook(apiSymbol, "20"),
    staleTime: 2_000,
    refetchInterval: 3_000,
  });
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const rawAsks: [string, string][] = data?.asks ?? [];
  const rawBids: [string, string][] = data?.bids ?? [];
  const asks = rawAsks.slice(0, 15).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));
  const bids = rawBids.slice(0, 15).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));
  const maxQty = Math.max(...asks.map(r => r.qty), ...bids.map(r => r.qty)) || 1;
  const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(2) + "K" : n.toFixed(2);
  const fmtP = (n: number) => n.toLocaleString("en-US", { maximumSignificantDigits: 6 });
  return (
    <div className="overflow-y-auto max-h-[300px]">
      <div className="grid grid-cols-2 divide-x divide-border">
        <div>
          <div className="grid grid-cols-2 px-1.5 py-0.5 border-b border-border text-[10px] text-muted-foreground">
            <span>Price</span><span className="text-right">Size</span>
          </div>
          {asks.map((r, i) => (
            <div key={i} className="relative grid grid-cols-2 px-1.5 py-[2px]">
              <div className="absolute left-0 top-0 bottom-0 bg-trading-red/10" style={{ width: `${(r.qty / maxQty) * 100}%` }} />
              <span className="relative font-mono-num text-[11px] text-trading-red leading-tight">{fmtP(r.price)}</span>
              <span className="relative font-mono-num text-[11px] text-muted-foreground text-right leading-tight">{fmt(r.qty)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-2 px-1.5 py-0.5 border-b border-border text-[10px] text-muted-foreground">
            <span>Price</span><span className="text-right">Size</span>
          </div>
          {bids.map((r, i) => (
            <div key={i} className="relative grid grid-cols-2 px-1.5 py-[2px]">
              <div className="absolute right-0 top-0 bottom-0 bg-trading-green/10" style={{ width: `${(r.qty / maxQty) * 100}%` }} />
              <span className="relative font-mono-num text-[11px] text-trading-green leading-tight">{fmtP(r.price)}</span>
              <span className="relative font-mono-num text-[11px] text-muted-foreground text-right leading-tight">{fmt(r.qty)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DepthPanel = ({ symbol }: { symbol: string }) => {
  const apiSymbol = symbol.replace("/", "");
  const { data, isLoading } = useQuery({
    queryKey: ["spot-depth", apiSymbol],
    queryFn: () => asterMarket.spotOrderBook(apiSymbol, "50"),
    staleTime: 3_000,
    refetchInterval: 5_000,
  });
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const rawBids: [string, string][] = data?.bids ?? [];
  const rawAsks: [string, string][] = data?.asks ?? [];
  const bids = rawBids.slice(0, 20).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));
  const asks = rawAsks.slice(0, 20).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));
  let bidCum = 0;
  const bidRows = bids.map(r => { bidCum += r.qty; return { ...r, cum: bidCum }; });
  let askCum = 0;
  const askRows = [...asks].reverse().map(r => { askCum += r.qty; return { ...r, cum: askCum }; }).reverse();
  const maxCum = Math.max(bidCum, askCum) || 1;
  const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(2) + "K" : n.toFixed(2);
  const fmtP = (n: number) => n.toLocaleString("en-US", { maximumSignificantDigits: 6 });
  return (
    <div className="overflow-y-auto max-h-[300px]">
      <div className="grid grid-cols-2 divide-x divide-border">
        <div>
          <div className="grid grid-cols-2 px-1.5 py-0.5 border-b border-border text-[10px] text-muted-foreground">
            <span>Price</span><span className="text-right">Cumulative</span>
          </div>
          {askRows.map((r, i) => (
            <div key={i} className="relative grid grid-cols-2 px-1.5 py-[2px]">
              <div className="absolute left-0 top-0 bottom-0 bg-trading-red/10" style={{ width: `${(r.cum / maxCum) * 100}%` }} />
              <span className="relative font-mono-num text-[11px] text-trading-red leading-tight">{fmtP(r.price)}</span>
              <span className="relative font-mono-num text-[11px] text-muted-foreground text-right leading-tight">{fmt(r.cum)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-2 px-1.5 py-0.5 border-b border-border text-[10px] text-muted-foreground">
            <span>Price</span><span className="text-right">Cumulative</span>
          </div>
          {bidRows.map((r, i) => (
            <div key={i} className="relative grid grid-cols-2 px-1.5 py-[2px]">
              <div className="absolute right-0 top-0 bottom-0 bg-trading-green/10" style={{ width: `${(r.cum / maxCum) * 100}%` }} />
              <span className="relative font-mono-num text-[11px] text-trading-green leading-tight">{fmtP(r.price)}</span>
              <span className="relative font-mono-num text-[11px] text-muted-foreground text-right leading-tight">{fmt(r.cum)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const InfoPanel = ({ symbol }: { symbol: string }) => {
  const apiSymbol = symbol.replace("/", "");
  const base = symbol.split("/")[0];
  const quote = symbol.split("/")[1] || "USDT";
  const { data: ticker } = useQuery({
    queryKey: ["spot-ticker-info", apiSymbol],
    queryFn: () => asterMarket.spotTicker(apiSymbol),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
  const { data: exInfo } = useQuery({
    queryKey: ["spot-exchange-info"],
    queryFn: () => asterMarket.spotExchangeInfo(),
    staleTime: 300_000,
  });
  const t = Array.isArray(ticker) ? ticker[0] : ticker;
  const sym = (exInfo?.symbols ?? []).find((s: any) => s.symbol === apiSymbol);
  const priceFilter = sym?.filters?.find((f: any) => f.filterType === "PRICE_FILTER");
  const lotSize = sym?.filters?.find((f: any) => f.filterType === "LOT_SIZE");
  const minNotional = sym?.filters?.find((f: any) => f.filterType === "MIN_NOTIONAL");
  const pct = t?.priceChangePercent ? parseFloat(t.priceChangePercent) : null;
  const isPos = pct !== null && pct >= 0;
  const rows = [
    { label: "Last Price", value: t?.lastPrice ? parseFloat(t.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) + ` ${quote}` : "—" },
    { label: "24h Change", value: pct !== null ? `${isPos ? "+" : ""}${pct.toFixed(2)}%` : "—", color: pct === null ? "" : isPos ? "text-trading-green" : "text-trading-red" },
    { label: "24h High", value: t?.highPrice ? parseFloat(t.highPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: "24h Low", value: t?.lowPrice ? parseFloat(t.lowPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: `24h Vol (${base})`, value: t?.volume ? (parseFloat(t.volume) >= 1e6 ? (parseFloat(t.volume) / 1e6).toFixed(2) + "M" : parseFloat(t.volume) >= 1e3 ? (parseFloat(t.volume) / 1e3).toFixed(2) + "K" : parseFloat(t.volume).toFixed(2)) : "—" },
    { label: `24h Vol (${quote})`, value: t?.quoteVolume ? (parseFloat(t.quoteVolume) >= 1e6 ? (parseFloat(t.quoteVolume) / 1e6).toFixed(2) + "M" : parseFloat(t.quoteVolume) >= 1e3 ? (parseFloat(t.quoteVolume) / 1e3).toFixed(2) + "K" : parseFloat(t.quoteVolume).toFixed(2)) : "—" },
    { label: "Tick Size", value: priceFilter?.tickSize ?? "—" },
    { label: "Min Qty", value: lotSize?.minQty ?? "—" },
    { label: "Min Order", value: minNotional?.minNotional ? minNotional.minNotional + ` ${quote}` : "—" },
    { label: "Base Asset", value: sym?.baseAsset ?? base },
    { label: "Quote Asset", value: sym?.quoteAsset ?? quote },
    { label: "Status", value: sym?.status ?? "—" },
  ];
  return (
    <div className="px-2 py-1 space-y-0">
      {rows.map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <span className={`text-[11px] font-mono-num font-medium text-foreground ${color ?? ""}`}>{value}</span>
        </div>
      ))}
    </div>
  );
};

const RecentTradesPanel = ({ symbol }: { symbol: string }) => {
  const apiSymbol = symbol.replace("/", "");
  const { data: trades, isLoading } = useQuery({
    queryKey: ["spot-recent-trades", apiSymbol],
    queryFn: () => asterMarket.spotTrades(apiSymbol),
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const list = Array.isArray(trades) ? trades.slice(0, 30) : [];
  if (!list.length) return <div className="flex justify-center py-8 text-sm text-muted-foreground">No trades</div>;
  return (
    <div className="overflow-y-auto max-h-[300px]">
      <table className="w-full">
        <thead className="sticky top-0 bg-background">
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left px-2 py-0.5 font-normal text-[10px]">Price (USDT)</th>
            <th className="text-right px-2 py-0.5 font-normal text-[10px]">Amount</th>
            <th className="text-right px-2 py-0.5 font-normal text-[10px]">Time</th>
          </tr>
        </thead>
        <tbody>
          {list.map((t: any, i: number) => {
            const isBuy = t.isBuyerMaker === false;
            const price = parseFloat(t.price);
            const qty = parseFloat(t.qty);
            const time = new Date(t.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
            return (
              <tr key={t.id ?? i} className="border-b border-border/30">
                <td className={`px-2 py-[2px] font-mono-num text-[11px] font-medium leading-tight ${isBuy ? "text-trading-green" : "text-trading-red"}`}>
                  {price.toLocaleString("en-US", { maximumSignificantDigits: 6 })}
                </td>
                <td className="px-2 py-[2px] text-right font-mono-num text-[11px] text-foreground leading-tight">{qty.toFixed(4)}</td>
                <td className="px-2 py-[2px] text-right font-mono-num text-[11px] text-muted-foreground leading-tight">{time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface BottomTabsProps {
  chartVisible: boolean;
  pair: string;
  viewMode: "list" | "chart";
  onViewModeChange: (mode: "list" | "chart") => void;
}

const BottomTabs = ({ chartVisible, pair, viewMode, onViewModeChange: setViewMode }: BottomTabsProps) => {
  const [activeOrderTab, setActiveOrderTab] = useState("Open orders");
  const [activeChartTab, setActiveChartTab] = useState("Chart");


  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const apiSymbol = pair.replace("/", "");

  const { data: openOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["spot-open-orders", apiSymbol],
    queryFn: () => asterTrading.spotOpenOrders(apiSymbol),
    enabled: !!user && activeOrderTab === "Open orders",
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const { data: spotAccount, isLoading: accountLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user && activeOrderTab === "Assets",
    staleTime: 15_000,
    refetchInterval: 30_000,
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

  const { data: ticker } = useQuery({
    queryKey: ["spot-ticker", apiSymbol],
    queryFn: () => asterTrading.spotTicker ? undefined : undefined,
    enabled: false,
  });

  const renderTabContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center py-10 gap-3">
          <span className="text-sm text-muted-foreground">Sign in to view your orders</span>
          <button
            onClick={() => navigate("/signin")}
            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </div>
      );
    }

    if (activeOrderTab === "Open orders") {
      if (ordersLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
      const orders = Array.isArray(openOrders) ? openOrders : [];
      if (!orders.length) return <div className="flex justify-center py-8 text-sm text-muted-foreground">No open orders</div>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left px-2 py-0.5 font-normal text-[10px]">Symbol</th>
                <th className="text-left px-2 py-0.5 font-normal text-[10px]">Side</th>
                <th className="text-left px-2 py-0.5 font-normal text-[10px]">Type</th>
                <th className="text-right px-2 py-0.5 font-normal text-[10px]">Price</th>
                <th className="text-right px-2 py-0.5 font-normal text-[10px]">Amount</th>
                <th className="text-right px-2 py-0.5 font-normal text-[10px]">Filled</th>
                <th className="text-right px-2 py-0.5 font-normal text-[10px]">Cancel</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.orderId} className="border-b border-border/50">
                  <td className="px-2 py-[2px] text-[11px] text-foreground leading-tight">{o.symbol}</td>
                  <td className={`px-2 py-[2px] text-[11px] font-medium leading-tight ${o.side === "BUY" ? "text-trading-green" : "text-trading-red"}`}>{o.side}</td>
                  <td className="px-2 py-[2px] text-[11px] text-muted-foreground leading-tight">{o.type}</td>
                  <td className="px-2 py-[2px] text-right font-mono-num text-[11px] text-foreground leading-tight">{parseFloat(o.price).toFixed(4)}</td>
                  <td className="px-2 py-[2px] text-right font-mono-num text-[11px] text-foreground leading-tight">{parseFloat(o.origQty).toFixed(4)}</td>
                  <td className="px-2 py-[2px] text-right font-mono-num text-[11px] text-muted-foreground leading-tight">{parseFloat(o.executedQty).toFixed(4)}</td>
                  <td className="px-2 py-[2px] text-right">
                    <button
                      onClick={() => cancelMutation.mutate({ symbol: o.symbol, orderId: String(o.orderId) })}
                      disabled={cancelMutation.isPending}
                      className="text-trading-red hover:opacity-70"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeOrderTab === "Positions") {
      return <div className="flex justify-center py-8 text-sm text-muted-foreground">Positions are available in Futures trading</div>;
    }

    if (activeOrderTab === "Assets") {
      if (accountLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
      const balances = (spotAccount?.balances ?? []).filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
      if (!balances.length) return <div className="flex justify-center py-8 text-sm text-muted-foreground">No assets</div>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left px-2 py-0.5 font-normal text-[10px]">Asset</th>
                <th className="text-right px-2 py-0.5 font-normal text-[10px]">Available</th>
                <th className="text-right px-2 py-0.5 font-normal text-[10px]">In Order</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b: any) => (
                <tr key={b.asset} className="border-b border-border/50">
                  <td className="px-2 py-[2px] font-medium text-[11px] text-foreground leading-tight">{b.asset}</td>
                  <td className="px-2 py-[2px] text-right font-mono-num text-[11px] text-foreground leading-tight">{parseFloat(b.free).toFixed(6)}</td>
                  <td className="px-2 py-[2px] text-right font-mono-num text-[11px] text-muted-foreground leading-tight">{parseFloat(b.locked).toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <div className="flex justify-center py-8 text-sm text-muted-foreground">Coming soon</div>;
  };

  return (
    <div className="flex flex-col border-t border-border bg-background flex-1">
      {viewMode === "list" && (
        <>
          {chartVisible && (
            <div className="h-[350px] flex-shrink-0">
              <CandlestickChart pair={pair} />
            </div>
          )}
          <div className="flex border-t border-border w-full min-w-0">
            <div className="w-[40%] relative border-r border-border self-stretch">
              <div className="absolute inset-0 overflow-hidden">
                <OrderBook symbol={pair} count={9} />
              </div>
            </div>
            <div className="w-[60%] min-w-0">
              <TradePanel symbol={pair} />
            </div>
          </div>
        </>
      )}

      {viewMode === "chart" && (() => {
        switch (activeChartTab) {
          case "Chart":
            return <div className="h-[400px] flex-shrink-0"><CandlestickChart pair={pair} /></div>;
          case "Order book":
            return <OrderBookTwoCol symbol={pair} mode="spot" />;
          case "Trades":
            return <RecentTradesPanel symbol={pair} />;
          case "Depth":
            return <DepthPanel symbol={pair} />;
          case "Info":
            return <InfoPanel symbol={pair} />;
          default:
            return <div className="flex justify-center py-10 text-sm text-muted-foreground">Coming soon</div>;
        }
      })()}

      {/* Chart tabs row — only visible in chart viewMode */}
      {viewMode === "chart" && (
        <div className="flex items-center px-3 py-1 gap-0.5 border-t-2 border-border overflow-x-auto scrollbar-none flex-shrink-0">
          {chartTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveChartTab(tab)}
              className={`py-1 px-2 text-[11px] transition-colors whitespace-nowrap flex-shrink-0 rounded ${
                activeChartTab === tab
                  ? "text-foreground font-semibold border border-border bg-accent"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Order tabs row — always visible, with separator */}
      <div className="flex items-center px-3 py-1 border-t-2 border-border flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          {orderTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveOrderTab(tab)}
              className={`py-1 text-[11px] transition-colors ${
                activeOrderTab === tab ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="p-1 text-muted-foreground flex-shrink-0">
          <ClipboardList className="w-4 h-4" />
        </button>
      </div>

      {renderTabContent()}

      <div className="flex justify-center py-4">
        <div className="flex items-center bg-secondary rounded-full p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-full transition-colors ${viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`p-2 rounded-full transition-colors ${viewMode === "chart" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
          >
            <SlidersVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomTabs;
