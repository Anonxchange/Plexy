import { useMarketDetail, useOrderbook, usePriceHistory, useBalance, useOpenOrders, usePlaceOrder, useCancelOrder } from "@/hooks/use-polymarket";
import { PolymarketImage } from "@/components/polymarket-image";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Share2, Bookmark, TrendingUp, TrendingDown,
  Clock, BarChart2, Droplets, Info, X, Loader2, AlertCircle,
  CheckCircle2, Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QUICK_AMOUNTS  = [1, 5, 10, 50, 100];
const CHART_INTERVALS = ["1H", "6H", "1D", "1W", "1M"] as const;
type Interval = (typeof CHART_INTERVALS)[number];

export default function PredictionDetailPage() {
  const [, params]    = useRoute("/prediction/:id");
  const [, setLocation] = useLocation();

  const { data: market, isLoading: marketLoading, error: marketError } =
    useMarketDetail(params?.id);

  const [chartInterval, setChartInterval] = useState<Interval>("1D");
  const [tradeTab,      setTradeTab]      = useState<"buy" | "sell">("buy");
  const [rulesTab,      setRulesTab]      = useState<"rules" | "context">("rules");
  const [amount,        setAmount]        = useState("");

  /* ── Outcomes ── */
  const outcomes = useMemo(() => {
    try {
      if (!market) return [];
      const prices = safeJsonParse<string[]>(market.outcomePrices, []);
      const ids    = safeJsonParse<string[]>(market.clobTokenIds, []);
      const names  = safeJsonParse<string[]>(market.outcomes, []);
      if (!names.length) return [];
      const mapped = names.map((name: string, i: number) => ({
        name,
        price: parseFloat(prices[i] || "0.5"),
        tokenId: ids[i],
      }));
      if (
        mapped.length === 2 &&
        mapped.every(o => ["yes", "no"].includes(o.name.toLowerCase())) &&
        mapped[0].name.toLowerCase() === "no"
      ) return [mapped[1], mapped[0]];
      return mapped;
    } catch { return []; }
  }, [market]);

  const isBinary = useMemo(
    () => outcomes.length === 2 && outcomes.every(o => ["yes", "no"].includes(o.name.toLowerCase())),
    [outcomes],
  );

  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0);
  const selectedOutcome = outcomes[selectedOutcomeIdx];

  const { data: orderbook } = useOrderbook(selectedOutcome?.tokenId);

  /* ── Price history ── */
  const { data: historyData, isLoading: historyLoading } =
    usePriceHistory(market?.conditionId, chartInterval);

  const chartPoints: { t: number; v: number }[] = useMemo(() => {
    const raw: { t: number; p: number }[] = historyData?.history ?? [];
    if (raw.length >= 2) {
      return raw.map((d, i) => ({ t: i, v: Math.round(d.p * 100) }));
    }
    return [];
  }, [historyData]);

  /* ── 24h change (always use 1D history price series) ── */
  const { data: dailyHistory } = usePriceHistory(market?.conditionId, "1D");
  const change24h = useMemo(() => {
    const pts: { t: number; p: number }[] = dailyHistory?.history ?? [];
    if (pts.length < 2) return null;
    const first = pts[0].p;
    const last  = pts[pts.length - 1].p;
    const diff  = (last - first) * 100;
    return { value: diff, pct: ((last - first) / (first || 1)) * 100 };
  }, [dailyHistory]);

  /* ── Balance & orders ── */
  const { data: balanceData } = useBalance();
  const { data: openOrders }  = useOpenOrders();
  const placeOrder    = usePlaceOrder();
  const cancelOrder   = useCancelOrder();

  const availableUsdc: number = useMemo(() => {
    if (!balanceData) return 0;
    return parseFloat(balanceData.balance ?? balanceData.allowance ?? "0");
  }, [balanceData]);

  /* ── Derived trade values ── */
  const isYesSelected   = selectedOutcome?.name?.toLowerCase() === "yes";
  const yesOutcome      = outcomes.find(o => o.name.toLowerCase() === "yes");
  const noOutcome       = outcomes.find(o => o.name.toLowerCase() === "no");
  const yesCents        = Math.round((yesOutcome?.price ?? 0.5) * 100);
  const noCents         = Math.round((noOutcome?.price  ?? 0.5) * 100);
  const selectedCents   = Math.round((selectedOutcome?.price ?? 0.5) * 100);
  const amountNum       = Number(amount) || 0;
  const estimatedShares = selectedOutcome?.price > 0 ? amountNum / selectedOutcome.price : 0;
  const potentialProfit = estimatedShares > amountNum ? (estimatedShares - amountNum).toFixed(2) : "0.00";
  const endDate         = market?.endDate ? format(new Date(market.endDate), "MMM d, yyyy") : null;

  const volume = market?.volumeNum ?? 0;
  const formattedVolume = volume >= 1_000_000
    ? `$${(volume / 1_000_000).toFixed(1)}M`
    : volume >= 1_000
    ? `$${(volume / 1_000).toFixed(0)}K`
    : `$${volume.toFixed(0)}`;

  const chartColor  = isYesSelected ? "#10b981" : "#f43f5e";
  const chartGradId = isYesSelected ? "grad-yes" : "grad-no";

  /* ── Place order handler ── */
  function handlePlaceOrder() {
    if (amountNum <= 0) {
      toast.error("Enter an amount to trade");
      return;
    }
    if (!selectedOutcome?.tokenId) {
      toast.error("No outcome selected");
      return;
    }

    const order = {
      tokenID:  selectedOutcome.tokenId,
      price:    selectedOutcome.price,
      size:     amountNum,
      side:     tradeTab === "buy" ? "BUY" : "SELL",
      type:     "MARKET",
      funderAddress: balanceData?.address ?? "",
    };

    placeOrder.mutate(order, {
      onSuccess: (data) => {
        if (data?.errorMsg) {
          toast.error(`Order failed: ${data.errorMsg}`);
        } else {
          toast.success(`Order placed! ${tradeTab === "buy" ? "Buying" : "Selling"} ${estimatedShares.toFixed(2)} shares of ${selectedOutcome.name}`);
          setAmount("");
        }
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to place order");
      },
    });
  }

  /* ── Open order rows filtered for this market ── */
  const marketOpenOrders = useMemo(() => {
    if (!Array.isArray(openOrders)) return [];
    return openOrders.filter((o: any) =>
      outcomes.some(outcome => outcome.tokenId === o.asset_id),
    );
  }, [openOrders, outcomes]);

  /* ── Loading / error ── */
  if (marketLoading) return <DetailSkeleton />;

  if (marketError || !market) return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12] flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold mb-2">
          {marketError ? "Error loading market" : "Market not found"}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {marketError ? (marketError as Error)?.message : "This market doesn't exist or has been removed."}
        </p>
        <Button onClick={() => setLocation("/prediction")}>← Back to Markets</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5">

        {/* ── Breadcrumb ── */}
        <button
          onClick={() => setLocation("/prediction")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Prediction Markets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* ════════════════ LEFT COLUMN ════════════════ */}
          <div className="space-y-4 min-w-0">

            {/* ── Market header ── */}
            <div className="bg-background border border-border rounded-2xl p-5 md:p-6">
              <div className="flex items-start gap-4">
                {market.image ? (
                  <PolymarketImage
                    src={market.image}
                    className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                    fallback={
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <BarChart2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    }
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <BarChart2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {market.tags?.[0] || "Market"}
                    </span>
                    {market.active && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                    {market.closed && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>
                  <h1 className="text-lg md:text-2xl font-bold leading-snug tracking-tight">
                    {market.question}
                  </h1>
                  {endDate && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Ends {endDate}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
                <Stat label="Volume"    value={formattedVolume} icon={<BarChart2 className="w-3.5 h-3.5" />} />
                <Stat
                  label="Liquidity"
                  value={market.liquidityNum ? `$${(market.liquidityNum / 1000).toFixed(0)}K` : "—"}
                  icon={<Droplets className="w-3.5 h-3.5" />}
                />
                <Stat label="Ends"  value={endDate ?? "—"} icon={<Clock className="w-3.5 h-3.5" />} />
              </div>
            </div>

            {/* ── Chart card ── */}
            <div className="bg-background border border-border rounded-2xl p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black tabular-nums tracking-tight">
                      {selectedCents}%
                    </span>
                    <span className="text-base text-muted-foreground font-medium mb-1">chance</span>
                  </div>
                  {/* Real 24h change */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {change24h === null ? (
                      <span className="text-xs text-muted-foreground">Loading 24h change…</span>
                    ) : (
                      <>
                        <span className={cn(
                          "flex items-center gap-1 text-xs font-semibold",
                          change24h.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
                        )}>
                          {change24h.value >= 0
                            ? <TrendingUp className="w-3.5 h-3.5" />
                            : <TrendingDown className="w-3.5 h-3.5" />
                          }
                          {change24h.value >= 0 ? "+" : ""}{change24h.pct.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">24h change</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Interval tabs */}
                <div className="flex items-center gap-1 rounded-lg border border-border p-1 w-fit">
                  {CHART_INTERVALS.map(iv => (
                    <button
                      key={iv}
                      onClick={() => setChartInterval(iv)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        chartInterval === iv
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {iv}
                    </button>
                  ))}
                </div>
              </div>

              {/* Binary Yes/No toggle */}
              {isBinary && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedOutcomeIdx(0)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      selectedOutcomeIdx === 0
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Yes · {yesCents}¢
                  </button>
                  <button
                    onClick={() => setSelectedOutcomeIdx(1)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      selectedOutcomeIdx === 1
                        ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    No · {noCents}¢
                  </button>
                </div>
              )}

              {/* Chart */}
              <div className="h-[260px] w-full">
                {historyLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : chartPoints.length < 2 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <BarChart2 className="w-8 h-8 opacity-30" />
                    <p className="text-xs">No price history available for this interval</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id={chartGradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={chartColor} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.06} />
                      <XAxis dataKey="t" hide />
                      <YAxis
                        domain={[0, 100]}
                        orientation="right"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}%`}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor:     "hsl(var(--border))",
                          borderRadius:    "12px",
                          boxShadow:       "0 4px 24px rgba(0,0,0,0.12)",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                        formatter={(v: any) => [`${Math.round(v)}%`, "Chance"]}
                        labelStyle={{ display: "none" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={chartColor}
                        strokeWidth={2.5}
                        fill={`url(#${chartGradId})`}
                        dot={false}
                        activeDot={{ r: 4, fill: chartColor, stroke: "white", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Order book ── */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <span className="text-sm font-semibold">Order Book</span>
                <span className="text-xs text-muted-foreground">
                  {selectedOutcome?.name} · {selectedCents}¢
                </span>
              </div>
              <div className="p-5">
                {orderbook ? (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Bids */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        <span>Bid price</span><span>Size</span>
                      </div>
                      <div className="space-y-2">
                        {(orderbook.bids || []).slice(0, 8).map((bid: any, i: number) => {
                          const pct = Number(bid.price) * 100;
                          return (
                            <div key={i} className="relative flex justify-between items-center text-sm">
                              <div className="absolute inset-0 rounded bg-emerald-500/6" style={{ width: `${pct}%` }} />
                              <span className="relative font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{pct.toFixed(1)}¢</span>
                              <span className="relative text-muted-foreground tabular-nums">{Number(bid.size).toLocaleString()}</span>
                            </div>
                          );
                        })}
                        {(!orderbook.bids || orderbook.bids.length === 0) && (
                          <p className="text-xs text-muted-foreground">No bids</p>
                        )}
                      </div>
                    </div>
                    {/* Asks */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        <span>Ask price</span><span>Size</span>
                      </div>
                      <div className="space-y-2">
                        {(orderbook.asks || []).slice(0, 8).map((ask: any, i: number) => {
                          const pct = Number(ask.price) * 100;
                          return (
                            <div key={i} className="relative flex justify-between items-center text-sm">
                              <div className="absolute inset-0 rounded bg-red-500/6" style={{ width: `${pct}%` }} />
                              <span className="relative font-semibold text-red-500 tabular-nums">{pct.toFixed(1)}¢</span>
                              <span className="relative text-muted-foreground tabular-nums">{Number(ask.size).toLocaleString()}</span>
                            </div>
                          );
                        })}
                        {(!orderbook.asks || orderbook.asks.length === 0) && (
                          <p className="text-xs text-muted-foreground">No asks</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {[0, 1].map(col => (
                      <div key={col} className="space-y-2">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full rounded" />)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── All outcomes (multi-outcome markets) ── */}
            {!isBinary && outcomes.length > 2 && (
              <div className="bg-background border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-4">All Outcomes</h3>
                <div className="space-y-2">
                  {[...outcomes]
                    .sort((a, b) => b.price - a.price)
                    .map((o, i) => {
                      const pct     = Math.round(o.price * 100);
                      const realIdx = outcomes.indexOf(o);
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedOutcomeIdx(realIdx)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                            realIdx === selectedOutcomeIdx
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-foreground/20",
                          )}
                        >
                          <span className="text-sm font-semibold">{o.name}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold tabular-nums w-8 text-right">{pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── Rules / Context ── */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border">
                {(["rules", "context"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRulesTab(tab)}
                    className={cn(
                      "px-5 py-3.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px",
                      rulesTab === tab
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab === "rules" ? "Rules" : "Context"}
                  </button>
                ))}
              </div>
              <div className="p-5 space-y-4">
                {rulesTab === "rules" ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {market.description || "No resolution rules specified for this market."}
                  </p>
                ) : (
                  <div className="space-y-3 text-sm">
                    <InfoRow label="Condition ID" value={
                      <span className="font-mono text-xs break-all">{market.conditionId}</span>
                    } />
                    <InfoRow label="Market ID"    value={market.id} />
                    <InfoRow label="Start date"   value={market.startDate ? format(new Date(market.startDate), "MMM d, yyyy") : "—"} />
                    <InfoRow label="End date"     value={endDate ?? "—"} />
                    <InfoRow label="Status"       value={
                      <span className={cn(
                        "font-semibold",
                        market.active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                      )}>
                        {market.closed ? "Closed" : market.active ? "Active" : "Inactive"}
                      </span>
                    } />
                    <InfoRow label="Tags"         value={market.tags?.join(", ") || "—"} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Open orders for this market ── */}
            {marketOpenOrders.length > 0 && (
              <div className="bg-background border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <span className="text-sm font-semibold">Your Open Orders</span>
                </div>
                <div className="divide-y divide-border">
                  {marketOpenOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <span className={cn(
                          "text-xs font-bold mr-2 px-2 py-0.5 rounded-full",
                          o.side === "BUY"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-500",
                        )}>
                          {o.side}
                        </span>
                        <span className="text-sm font-semibold">
                          {Number(o.size_matched || o.original_size).toFixed(2)} shares
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">@ {(Number(o.price) * 100).toFixed(1)}¢</span>
                      </div>
                      <button
                        onClick={() => cancelOrder.mutate(o.id, {
                          onSuccess: () => toast.success("Order cancelled"),
                          onError:   () => toast.error("Failed to cancel order"),
                        })}
                        disabled={cancelOrder.isPending}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {cancelOrder.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════ RIGHT COLUMN — Trade Panel ════════════════ */}
          <div>
            <div className="sticky top-20 bg-background border border-border rounded-2xl overflow-hidden shadow-sm">

              {/* Buy / Sell tabs */}
              <div className="flex border-b border-border">
                {(["buy", "sell"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTradeTab(tab)}
                    className={cn(
                      "flex-1 py-3.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px",
                      tradeTab === tab
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-4">

                {/* Balance row */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Available</span>
                  </div>
                  {balanceData ? (
                    <span className="font-bold tabular-nums">${availableUsdc.toFixed(2)} USDC</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not connected</span>
                  )}
                </div>

                {/* Outcome selector */}
                {isBinary && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedOutcomeIdx(0)}
                      className={cn(
                        "py-3 rounded-xl text-sm font-bold transition-all border",
                        selectedOutcomeIdx === 0
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20"
                          : "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15",
                      )}
                    >
                      Yes · {yesCents}¢
                    </button>
                    <button
                      onClick={() => setSelectedOutcomeIdx(1)}
                      className={cn(
                        "py-3 rounded-xl text-sm font-bold transition-all border",
                        selectedOutcomeIdx === 1
                          ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20"
                          : "bg-red-500/8 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/15",
                      )}
                    >
                      No · {noCents}¢
                    </button>
                  </div>
                )}

                {/* Amount input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Amount (USDC)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                    <Input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-7 h-12 text-base font-semibold"
                    />
                  </div>
                  {/* Quick amounts */}
                  <div className="flex gap-1.5 flex-wrap">
                    {QUICK_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setAmount(String((Number(amount) || 0) + amt))}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-foreground/30 hover:bg-muted transition-all text-muted-foreground"
                      >
                        +${amt}
                      </button>
                    ))}
                    {availableUsdc > 0 && (
                      <button
                        onClick={() => setAmount(availableUsdc.toFixed(2))}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-foreground/30 hover:bg-muted transition-all text-muted-foreground"
                      >
                        Max
                      </button>
                    )}
                  </div>
                </div>

                {/* Trade summary */}
                <div className="bg-muted/40 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg price</span>
                    <span className="font-semibold tabular-nums">{selectedCents}¢</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-semibold tabular-nums">
                      {estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Potential profit</span>
                    <span className={cn(
                      "font-semibold tabular-nums",
                      Number(potentialProfit) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                    )}>
                      +${potentialProfit}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Max return</span>
                    <span className="font-bold tabular-nums">
                      ${estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Insufficient balance warning */}
                {balanceData && amountNum > availableUsdc && amountNum > 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Insufficient balance. Available: ${availableUsdc.toFixed(2)}
                  </div>
                )}

                {/* Market closed warning */}
                {market.closed && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl p-3">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    This market is closed. No new orders can be placed.
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    placeOrder.isPending ||
                    market.closed ||
                    amountNum <= 0 ||
                    (balanceData != null && amountNum > availableUsdc)
                  }
                  className={cn(
                    "w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    isYesSelected
                      ? "bg-emerald-500 hover:bg-emerald-600 disabled:hover:bg-emerald-500 text-white"
                      : "bg-red-500 hover:bg-red-600 disabled:hover:bg-red-500 text-white",
                  )}
                >
                  {placeOrder.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Placing order…</>
                  ) : (
                    <>{tradeTab === "buy" ? "Buy" : "Sell"} {selectedOutcome?.name || "Yes"}{amountNum > 0 && ` · $${amountNum}`}</>
                  )}
                </button>

                {/* Order result feedback */}
                {placeOrder.isSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Order submitted successfully
                  </div>
                )}
                {placeOrder.isError && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {(placeOrder.error as Error)?.message || "Order failed"}
                  </div>
                )}

                <p className="text-center text-[10px] text-muted-foreground">
                  By trading you agree to the{" "}
                  <span className="underline cursor-pointer">Terms of Use</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function safeJsonParse<T>(str: string | undefined | null, fallback: T): T {
  try { const r = JSON.parse(str || ""); return Array.isArray(r) ? r as T : fallback; }
  catch { return fallback; }
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5">
        <Skeleton className="h-4 w-32 mb-5 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
