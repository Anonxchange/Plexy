import { useState } from "react";
import { LayoutList, SlidersVertical, ClipboardList, Loader2, XCircle } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
import FuturesTradePanel from "./FuturesTradePanel";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading, asterMarket } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP"];
const chartTabs = ["Chart", "Order book", "Trades", "Depth", "Info"];

const OrderBookTwoCol = ({ symbol }: { symbol: string }) => {
  const apiSymbol = symbol.replace("/", "");
  const { data, isLoading } = useQuery({
    queryKey: ["ob-2col-futures", apiSymbol],
    queryFn: () => asterMarket.futuresOrderBook(apiSymbol, "20"),
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
          <div className="grid grid-cols-2 px-2 py-1 border-b border-border text-[10px] text-muted-foreground">
            <span>Price</span><span className="text-right">Size</span>
          </div>
          {asks.map((r, i) => (
            <div key={i} className="relative grid grid-cols-2 px-2 py-[3px]">
              <div className="absolute left-0 top-0 bottom-0 bg-trading-red/10" style={{ width: `${(r.qty / maxQty) * 100}%` }} />
              <span className="relative font-mono-num text-[11px] text-trading-red">{fmtP(r.price)}</span>
              <span className="relative font-mono-num text-[11px] text-muted-foreground text-right">{fmt(r.qty)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-2 px-2 py-1 border-b border-border text-[10px] text-muted-foreground">
            <span>Price</span><span className="text-right">Size</span>
          </div>
          {bids.map((r, i) => (
            <div key={i} className="relative grid grid-cols-2 px-2 py-[3px]">
              <div className="absolute right-0 top-0 bottom-0 bg-trading-green/10" style={{ width: `${(r.qty / maxQty) * 100}%` }} />
              <span className="relative font-mono-num text-[11px] text-trading-green">{fmtP(r.price)}</span>
              <span className="relative font-mono-num text-[11px] text-muted-foreground text-right">{fmt(r.qty)}</span>
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
    queryKey: ["futures-depth", apiSymbol],
    queryFn: () => asterMarket.futuresOrderBook(apiSymbol, "50"),
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
          <div className="grid grid-cols-2 px-2 py-1 border-b border-border text-[10px] text-muted-foreground">
            <span>Price</span><span className="text-right">Cumulative</span>
          </div>
          {askRows.map((r, i) => (
            <div key={i} className="relative grid grid-cols-2 px-2 py-[3px]">
              <div className="absolute left-0 top-0 bottom-0 bg-trading-red/10" style={{ width: `${(r.cum / maxCum) * 100}%` }} />
              <span className="relative font-mono-num text-[11px] text-trading-red">{fmtP(r.price)}</span>
              <span className="relative font-mono-num text-[11px] text-muted-foreground text-right">{fmt(r.cum)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-2 px-2 py-1 border-b border-border text-[10px] text-muted-foreground">
            <span>Price</span><span className="text-right">Cumulative</span>
          </div>
          {bidRows.map((r, i) => (
            <div key={i} className="relative grid grid-cols-2 px-2 py-[3px]">
              <div className="absolute right-0 top-0 bottom-0 bg-trading-green/10" style={{ width: `${(r.cum / maxCum) * 100}%` }} />
              <span className="relative font-mono-num text-[11px] text-trading-green">{fmtP(r.price)}</span>
              <span className="relative font-mono-num text-[11px] text-muted-foreground text-right">{fmt(r.cum)}</span>
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
    queryKey: ["futures-ticker-info", apiSymbol],
    queryFn: () => asterMarket.futuresTicker(apiSymbol),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
  const { data: exInfo } = useQuery({
    queryKey: ["futures-exchange-info"],
    queryFn: () => asterMarket.futuresExchangeInfo(),
    staleTime: 300_000,
  });
  const { data: markData } = useQuery({
    queryKey: ["futures-mark-price", apiSymbol],
    queryFn: () => asterMarket.futuresMarkPrice(apiSymbol),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
  const { data: fundingData } = useQuery({
    queryKey: ["futures-funding-info", apiSymbol],
    queryFn: () => asterMarket.futuresFundingRate(apiSymbol),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const t = Array.isArray(ticker) ? ticker[0] : ticker;
  const sym = (exInfo?.symbols ?? []).find((s: any) => s.symbol === apiSymbol);
  const mark = Array.isArray(markData) ? markData[0] : markData;
  const funding = Array.isArray(fundingData) ? fundingData[0] : fundingData;
  const priceFilter = sym?.filters?.find((f: any) => f.filterType === "PRICE_FILTER");
  const lotSize = sym?.filters?.find((f: any) => f.filterType === "LOT_SIZE");
  const pct = t?.priceChangePercent ? parseFloat(t.priceChangePercent) : null;
  const isPos = pct !== null && pct >= 0;
  const fmtVol = (v: string | undefined) => {
    if (!v) return "—";
    const n = parseFloat(v);
    return n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(2) + "K" : n.toFixed(2);
  };
  const rows = [
    { label: "Last Price", value: t?.lastPrice ? parseFloat(t.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) + ` ${quote}` : "—" },
    { label: "Mark Price", value: mark?.markPrice ? parseFloat(mark.markPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: "Index Price", value: mark?.indexPrice ? parseFloat(mark.indexPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: "24h Change", value: pct !== null ? `${isPos ? "+" : ""}${pct.toFixed(2)}%` : "—", color: pct === null ? "" : isPos ? "text-trading-green" : "text-trading-red" },
    { label: "24h High", value: t?.highPrice ? parseFloat(t.highPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: "24h Low", value: t?.lowPrice ? parseFloat(t.lowPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: `24h Vol (${quote})`, value: fmtVol(t?.quoteVolume) },
    { label: "Open Interest", value: fmtVol(t?.openInterest) },
    { label: "Funding Rate (8h)", value: funding?.fundingRate ? (parseFloat(funding.fundingRate) * 100).toFixed(4) + "%" : "—" },
    { label: "Tick Size", value: priceFilter?.tickSize ?? "—" },
    { label: "Min Qty", value: lotSize?.minQty ?? "—" },
    { label: "Contract Type", value: sym?.contractType ?? "PERPETUAL" },
  ];
  return (
    <div className="px-3 py-2 space-y-0">
      {rows.map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`text-xs font-mono-num font-medium text-foreground ${color ?? ""}`}>{value}</span>
        </div>
      ))}
    </div>
  );
};

const RecentTradesPanel = ({ symbol }: { symbol: string }) => {
  const apiSymbol = symbol.replace("/", "");
  const { data: trades, isLoading } = useQuery({
    queryKey: ["futures-recent-trades", apiSymbol],
    queryFn: () => asterMarket.futuresTrades(apiSymbol),
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const list = Array.isArray(trades) ? trades.slice(0, 30) : [];
  if (!list.length) return <div className="flex justify-center py-8 text-sm text-muted-foreground">No trades</div>;
  return (
    <div className="overflow-y-auto max-h-[300px]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-background">
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left px-3 py-2 font-normal">Price (USDT)</th>
            <th className="text-right px-3 py-2 font-normal">Amount</th>
            <th className="text-right px-3 py-2 font-normal">Time</th>
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
                <td className={`px-3 py-1.5 font-mono-num font-medium ${isBuy ? "text-trading-green" : "text-trading-red"}`}>
                  {price.toLocaleString("en-US", { maximumSignificantDigits: 6 })}
                </td>
                <td className="px-3 py-1.5 text-right font-mono-num text-foreground">{qty.toFixed(4)}</td>
                <td className="px-3 py-1.5 text-right font-mono-num text-muted-foreground">{time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface MobilePerpetualTabsProps {
  chartVisible: boolean;
  pair: string;
  viewMode: "list" | "chart";
  onViewModeChange: (mode: "list" | "chart") => void;
}

const MobilePerpetualTabs = ({ chartVisible, pair, viewMode, onViewModeChange: setViewMode }: MobilePerpetualTabsProps) => {
  const [activeOrderTab, setActiveOrderTab] = useState("Open orders");
  const [activeChartTab, setActiveChartTab] = useState("Chart");

  const tabs = viewMode === "list" ? orderTabs : chartTabs;
  const activeTab = viewMode === "list" ? activeOrderTab : activeChartTab;
  const setActiveTab = viewMode === "list" ? setActiveOrderTab : setActiveChartTab;

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const apiSymbol = pair.replace("/", "");

  const { data: openOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["futures-open-orders", apiSymbol],
    queryFn: () => asterTrading.futuresOpenOrders(apiSymbol),
    enabled: !!user && activeOrderTab === "Open orders",
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["futures-positions"],
    queryFn: () => asterTrading.futuresPositions(),
    enabled: !!user && activeOrderTab === "Positions",
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const { data: futuresBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["futures-balance"],
    queryFn: () => asterTrading.futuresBalance(),
    enabled: !!user && activeOrderTab === "Assets",
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ symbol, orderId }: { symbol: string; orderId: string }) =>
      asterTrading.futuresCancelOrder(symbol, orderId),
    onSuccess: () => {
      toast({ title: "Order cancelled" });
      queryClient.invalidateQueries({ queryKey: ["futures-open-orders"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    },
  });

  const renderTabContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center py-10 gap-3">
          <span className="text-sm text-muted-foreground">Sign in to view your orders</span>
          <button
            onClick={() => navigate("/signin")}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-trading-amber text-background"
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
                <th className="text-left px-3 py-2 font-normal">Symbol</th>
                <th className="text-left px-3 py-2 font-normal">Side</th>
                <th className="text-right px-3 py-2 font-normal">Price</th>
                <th className="text-right px-3 py-2 font-normal">Size</th>
                <th className="text-right px-3 py-2 font-normal">Filled</th>
                <th className="text-right px-3 py-2 font-normal">Cancel</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.orderId} className="border-b border-border/50">
                  <td className="px-3 py-2 text-foreground">{o.symbol}</td>
                  <td className={`px-3 py-2 font-medium ${o.side === "BUY" ? "text-trading-green" : "text-trading-red"}`}>{o.side}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(o.price).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(o.origQty).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-muted-foreground">{parseFloat(o.executedQty).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right">
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
      if (positionsLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
      const pos = Array.isArray(positions)
        ? positions.filter((p: any) => parseFloat(p.positionAmt) !== 0)
        : [];
      if (!pos.length) return <div className="flex justify-center py-8 text-sm text-muted-foreground">No open positions</div>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left px-3 py-2 font-normal">Symbol</th>
                <th className="text-left px-3 py-2 font-normal">Side</th>
                <th className="text-right px-3 py-2 font-normal">Size</th>
                <th className="text-right px-3 py-2 font-normal">Entry</th>
                <th className="text-right px-3 py-2 font-normal">Mark</th>
                <th className="text-right px-3 py-2 font-normal">PnL</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((p: any) => {
                const pnl = parseFloat(p.unRealizedProfit);
                return (
                  <tr key={p.symbol + p.positionSide} className="border-b border-border/50">
                    <td className="px-3 py-2 text-foreground">{p.symbol}</td>
                    <td className={`px-3 py-2 font-medium ${parseFloat(p.positionAmt) > 0 ? "text-trading-green" : "text-trading-red"}`}>
                      {parseFloat(p.positionAmt) > 0 ? "Long" : "Short"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono-num text-foreground">{Math.abs(parseFloat(p.positionAmt)).toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(p.entryPrice).toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(p.markPrice).toFixed(4)}</td>
                    <td className={`px-3 py-2 text-right font-mono-num ${pnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                      {pnl >= 0 ? "+" : ""}{pnl.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeOrderTab === "Assets") {
      if (balanceLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
      const balances = Array.isArray(futuresBalance)
        ? futuresBalance.filter((b: any) => parseFloat(b.balance) > 0)
        : [];
      if (!balances.length) return <div className="flex justify-center py-8 text-sm text-muted-foreground">No assets</div>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left px-3 py-2 font-normal">Asset</th>
                <th className="text-right px-3 py-2 font-normal">Balance</th>
                <th className="text-right px-3 py-2 font-normal">Available</th>
                <th className="text-right px-3 py-2 font-normal">Unrealized PnL</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b: any) => (
                <tr key={b.asset} className="border-b border-border/50">
                  <td className="px-3 py-2 font-medium text-foreground">{b.asset}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(b.balance).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(b.availableBalance).toFixed(4)}</td>
                  <td className={`px-3 py-2 text-right font-mono-num ${parseFloat(b.crossUnPnl) >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                    {parseFloat(b.crossUnPnl) >= 0 ? "+" : ""}{parseFloat(b.crossUnPnl).toFixed(4)}
                  </td>
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
          <div className="flex border-t border-border flex-shrink-0 w-full min-w-0">
            <div className="w-[40%] min-w-0 border-r border-border overflow-hidden">
              <OrderBook symbol={pair} mode="futures" count={7} />
            </div>
            <div className="w-[60%] min-w-0">
              <FuturesTradePanel symbol={pair} compact />
            </div>
          </div>
        </>
      )}

      {viewMode === "chart" && (() => {
        switch (activeChartTab) {
          case "Chart":
            return <div className="h-[400px] flex-shrink-0"><CandlestickChart pair={pair} /></div>;
          case "Order book":
            return <OrderBookTwoCol symbol={pair} />;
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
        <div className="flex items-center px-4 py-2 gap-1 border-t-2 border-border overflow-x-auto scrollbar-none flex-shrink-0">
          {chartTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveChartTab(tab)}
              className={`py-1.5 px-2.5 text-sm transition-colors whitespace-nowrap flex-shrink-0 rounded ${
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
      <div className="flex items-center px-4 py-2 border-t-2 border-border flex-shrink-0">
        <div className="flex items-center gap-4 flex-1">
          {orderTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveOrderTab(tab)}
              className={`py-2 text-sm transition-colors ${
                activeOrderTab === tab ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="p-1 text-muted-foreground flex-shrink-0">
          <ClipboardList className="w-5 h-5" />
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

export default MobilePerpetualTabs;
