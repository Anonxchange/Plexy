import { useMarketDetail, useOrderbook } from "@/hooks/use-polymarket";
import { PolymarketImage } from "@/components/polymarket-image";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Share2, Bookmark, TrendingUp, TrendingDown,
  Clock, BarChart2, Droplets, ArrowUpRight, Info
} from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [1, 5, 10, 50, 100];
const CHART_INTERVALS = ["1H", "6H", "1D", "1W", "1M"];

export default function PredictionDetailPage() {
  const [, params] = useRoute("/prediction/:id");
  const [, setLocation] = useLocation();

  const { data: market, isLoading: marketLoading, error: marketError } =
    useMarketDetail(params?.id);

  const [chartInterval, setChartInterval] = useState("1D");
  const [tradeTab, setTradeTab] = useState<"buy" | "sell">("buy");
  const [rulesTab, setRulesTab] = useState<"rules" | "context">("rules");
  const [amount, setAmount] = useState("");

  /* ── Parse outcomes ── */
  const outcomes = useMemo(() => {
    try {
      if (!market) return [];
      const prices = safeJsonParse<string[]>(market.outcomePrices, []);
      const ids = safeJsonParse<string[]>(market.clobTokenIds, []);
      const names = safeJsonParse<string[]>(market.outcomes, []);
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
    [outcomes]
  );

  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0);
  const selectedOutcome = outcomes[selectedOutcomeIdx];
  const { data: orderbook } = useOrderbook(selectedOutcome?.tokenId);

  const isYesSelected = selectedOutcome?.name?.toLowerCase() === "yes";

  const yesOutcome = outcomes.find(o => o.name.toLowerCase() === "yes");
  const noOutcome  = outcomes.find(o => o.name.toLowerCase() === "no");
  const yesCents   = Math.round((yesOutcome?.price ?? 0.5) * 100);
  const noCents    = Math.round((noOutcome?.price ?? 0.5) * 100);

  const selectedCents = Math.round((selectedOutcome?.price ?? 0.5) * 100);
  const amountNum     = Number(amount) || 0;
  const estimatedShares = selectedOutcome?.price > 0 ? amountNum / selectedOutcome.price : 0;
  const potentialProfit = estimatedShares > amountNum ? (estimatedShares - amountNum).toFixed(2) : "0.00";

  const endDate = market?.endDate ? format(new Date(market.endDate), "MMM d, yyyy") : null;

  const volume = market?.volumeNum ?? 0;
  const formattedVolume = volume >= 1_000_000
    ? `$${(volume / 1_000_000).toFixed(1)}M`
    : volume >= 1_000
    ? `$${(volume / 1_000).toFixed(0)}K`
    : `$${volume.toFixed(0)}`;

  /* ── Chart data ── */
  const chartData = useMemo(() => {
    const history = orderbook?.history || [];
    if (history.length < 10) {
      const base = selectedCents;
      return Array.from({ length: 60 }, (_, i) => ({
        t: i,
        v: Math.max(2, Math.min(98, base + Math.sin(i / 6) * 4 + (Math.random() - 0.5) * 2.5)),
      }));
    }
    return history.map((h: any, i: number) => ({ t: i, v: h.price * 100 }));
  }, [orderbook, selectedCents]);

  const chartColor = isYesSelected ? "#10b981" : "#f43f5e";
  const chartGradId = isYesSelected ? "grad-yes" : "grad-no";

  /* ── Loading / error states ── */
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

          {/* ════════════════════════════
              LEFT COLUMN
          ════════════════════════════ */}
          <div className="space-y-4 min-w-0">

            {/* ── Market header ── */}
            <div className="bg-background border border-border rounded-2xl p-5 md:p-6">
              <div className="flex items-start gap-4">
                {/* Image */}
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
                <Stat label="Volume" value={formattedVolume} icon={<BarChart2 className="w-3.5 h-3.5" />} />
                <Stat
                  label="Liquidity"
                  value={market.liquidityNum ? `$${(market.liquidityNum / 1000).toFixed(0)}K` : "—"}
                  icon={<Droplets className="w-3.5 h-3.5" />}
                />
                <Stat
                  label="Ends"
                  value={endDate ?? "—"}
                  icon={<Clock className="w-3.5 h-3.5" />}
                />
              </div>
            </div>

            {/* ── Chart card ── */}
            <div className="bg-background border border-border rounded-2xl p-5 md:p-6">
              {/* Chart header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black tabular-nums tracking-tight">
                      {selectedCents}%
                    </span>
                    <span className="text-base text-muted-foreground font-medium mb-1">chance</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +2.4%
                    </span>
                    <span className="text-xs text-muted-foreground">24h change</span>
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
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {iv}
                    </button>
                  ))}
                </div>
              </div>

              {/* Binary Yes/No toggle on chart */}
              {isBinary && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedOutcomeIdx(0)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      selectedOutcomeIdx === 0
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border text-muted-foreground hover:text-foreground"
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
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    No · {noCents}¢
                  </button>
                </div>
              )}

              {/* Chart */}
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={chartGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartColor} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="currentColor"
                      opacity={0.06}
                    />
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
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
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
                        <span>Bid price</span>
                        <span>Size</span>
                      </div>
                      <div className="space-y-2">
                        {(orderbook.bids || []).slice(0, 8).map((bid: any, i: number) => {
                          const pct = Number(bid.price) * 100;
                          return (
                            <div key={i} className="relative flex justify-between items-center text-sm">
                              <div
                                className="absolute inset-0 rounded bg-emerald-500/6"
                                style={{ width: `${pct}%` }}
                              />
                              <span className="relative font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {pct.toFixed(1)}¢
                              </span>
                              <span className="relative text-muted-foreground tabular-nums">
                                {Number(bid.size).toLocaleString()}
                              </span>
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
                        <span>Ask price</span>
                        <span>Size</span>
                      </div>
                      <div className="space-y-2">
                        {(orderbook.asks || []).slice(0, 8).map((ask: any, i: number) => {
                          const pct = Number(ask.price) * 100;
                          return (
                            <div key={i} className="relative flex justify-between items-center text-sm">
                              <div
                                className="absolute inset-0 rounded bg-red-500/6"
                                style={{ width: `${pct}%` }}
                              />
                              <span className="relative font-semibold text-red-500 tabular-nums">
                                {pct.toFixed(1)}¢
                              </span>
                              <span className="relative text-muted-foreground tabular-nums">
                                {Number(ask.size).toLocaleString()}
                              </span>
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
                        {[...Array(6)].map((_, i) => (
                          <Skeleton key={i} className="h-5 w-full rounded" />
                        ))}
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
                      const pct = Math.round(o.price * 100);
                      const realIdx = outcomes.indexOf(o);
                      const isSelected = realIdx === selectedOutcomeIdx;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedOutcomeIdx(realIdx)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-foreground/20"
                          )}
                        >
                          <span className="text-sm font-semibold">{o.name}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
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
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === "rules" ? "Rules" : "Context"}
                  </button>
                ))}
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {rulesTab === "rules"
                    ? market.description || "No resolution rules specified for this market."
                    : "This market tracks the probability of the stated outcome based on community trading. Prices reflect aggregate market sentiment."}
                </p>
              </div>
            </div>
          </div>

          {/* ════════════════════════════
              RIGHT COLUMN — Trade Panel
          ════════════════════════════ */}
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
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-4">

                {/* Outcome selector */}
                {isBinary && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedOutcomeIdx(0)}
                      className={cn(
                        "py-3 rounded-xl text-sm font-bold transition-all border",
                        selectedOutcomeIdx === 0
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20"
                          : "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
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
                          : "bg-red-500/8 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/15"
                      )}
                    >
                      No · {noCents}¢
                    </button>
                  </div>
                )}

                {/* Amount input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Amount (USD)</label>
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
                    <button
                      onClick={() => setAmount("1000")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-foreground/30 hover:bg-muted transition-all text-muted-foreground"
                    >
                      Max
                    </button>
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
                      Number(potentialProfit) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
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

                {/* CTA */}
                <button
                  onClick={() => {}}
                  className={cn(
                    "w-full h-12 rounded-xl font-bold text-sm transition-all",
                    isYesSelected
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  )}
                >
                  {tradeTab === "buy" ? "Buy" : "Sell"} {selectedOutcome?.name || "Yes"}
                  {amountNum > 0 && ` · $${amountNum}`}
                </button>

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
        {icon}
        {label}
      </div>
      <span className="text-sm font-bold tabular-nums">{value}</span>
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
