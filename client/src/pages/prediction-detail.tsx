import {
  useMarketDetail, useOrderbook, usePriceHistory,
  useBalance, useOpenOrders, usePlaceOrder, useCancelOrder,
} from "@/hooks/use-polymarket";
import { PolymarketImage } from "@/components/polymarket-image";
import { useRoute, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, Share2, Bookmark, TrendingUp, TrendingDown,
  Clock, BarChart2, Droplets, Info, X, Loader2, AlertCircle,
  CheckCircle2, Wallet, ChevronDown, ChevronUp, Users,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ───────────────────────────── constants */
const QUICK_AMOUNTS   = [1, 5, 10, 50, 100];
const CHART_INTERVALS = ["1H", "6H", "1D", "1W", "1M"] as const;
type Interval = (typeof CHART_INTERVALS)[number];

/* ───────────────────────────── helpers */
function safeJsonParse<T>(str: unknown, fallback: T): T {
  if (Array.isArray(str)) return str as T;
  if (typeof str !== 'string' || !str) return fallback;
  try { const r = JSON.parse(str); return Array.isArray(r) ? r as T : fallback; }
  catch { return fallback; }
}
function tagLabel(t: unknown): string {
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object') {
    const o = t as Record<string, unknown>;
    return String(o.label ?? o.name ?? o.slug ?? '');
  }
  return '';
}
function fmtVol(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/* ───────────────────────────── skeleton */
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5">
        <Skeleton className="h-4 w-32 mb-5 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-4">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── trade panel (shared mobile + desktop) */
interface TradePanelProps {
  market: any;
  outcomes: { name: string; price: number; tokenId: string }[];
  isBinary: boolean;
  selectedOutcomeIdx: number;
  setSelectedOutcomeIdx: (i: number) => void;
  tradeTab: "buy" | "sell";
  setTradeTab: (t: "buy" | "sell") => void;
  amount: string;
  setAmount: (v: string) => void;
  yesCents: number;
  noCents: number;
  selectedCents: number;
  isYesSelected: boolean;
  availableUsdc: number;
  balanceData: any;
  estimatedShares: number;
  potentialProfit: string;
  amountNum: number;
  placeOrder: any;
  handlePlaceOrder: () => void;
}

function TradePanel({
  market, outcomes, isBinary,
  selectedOutcomeIdx, setSelectedOutcomeIdx,
  tradeTab, setTradeTab,
  amount, setAmount,
  yesCents, noCents, selectedCents,
  isYesSelected, availableUsdc, balanceData,
  estimatedShares, potentialProfit, amountNum,
  placeOrder, handlePlaceOrder,
}: TradePanelProps) {
  return (
    <div className="flex flex-col">
      {/* Buy / Sell tabs */}
      <div className="flex border-b border-border">
        {(["buy", "sell"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setTradeTab(tab)}
            className={cn(
              "flex-1 py-4 text-sm font-bold capitalize transition-colors border-b-2 -mb-px",
              tradeTab === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Balance</span>
          </div>
          {balanceData
            ? <span className="text-sm font-bold tabular-nums">${availableUsdc.toFixed(2)} USDC</span>
            : <span className="text-xs text-muted-foreground italic">Not connected</span>}
        </div>

        {/* Binary Yes/No picker */}
        {isBinary && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedOutcomeIdx(0)}
              className={cn(
                "py-3 rounded-xl text-sm font-bold transition-all border",
                selectedOutcomeIdx === 0
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/25"
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
                  ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/25"
                  : "bg-red-500/8 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/15",
              )}
            >
              No · {noCents}¢
            </button>
          </div>
        )}

        {/* Multi-outcome picker */}
        {!isBinary && outcomes.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Select outcome</label>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {outcomes.map((o, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOutcomeIdx(i)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                    selectedOutcomeIdx === i
                      ? "border-primary/50 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                  )}
                >
                  <span className="truncate mr-2">{o.name}</span>
                  <span className="tabular-nums shrink-0">{Math.round(o.price * 100)}¢</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Amount (USDC)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm select-none">$</span>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-7 h-12 text-base font-semibold"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(String((Number(amount) || 0) + amt))}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-foreground/30 hover:bg-muted transition-all text-muted-foreground"
              >
                +${amt}
              </button>
            ))}
            {availableUsdc > 0 && (
              <button
                onClick={() => setAmount(availableUsdc.toFixed(2))}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-foreground/30 hover:bg-muted transition-all text-muted-foreground"
              >
                Max
              </button>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-muted/50 rounded-xl p-3.5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg price</span>
            <span className="font-semibold tabular-nums">{selectedCents}¢</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shares</span>
            <span className="font-semibold tabular-nums">
              {estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Potential profit</span>
            <span className={cn(
              "font-semibold tabular-nums",
              Number(potentialProfit) > 0 ? "text-emerald-600 dark:text-emerald-400" : "",
            )}>
              +${potentialProfit}
            </span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span className="text-muted-foreground font-medium">Max return</span>
            <span className="tabular-nums">
              ${estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Warnings */}
        {balanceData && amountNum > availableUsdc && amountNum > 0 && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Insufficient balance. Available: ${availableUsdc.toFixed(2)}
          </div>
        )}
        {market.closed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl p-3">
            <Info className="w-3.5 h-3.5 shrink-0" />
            This market is resolved. No new orders can be placed.
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handlePlaceOrder}
          disabled={
            placeOrder.isPending || market.closed || amountNum <= 0 ||
            (balanceData != null && amountNum > availableUsdc)
          }
          className={cn(
            "w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isYesSelected || !isBinary
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-red-500 hover:bg-red-600 text-white",
          )}
        >
          {placeOrder.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" />Placing order…</>
            : <>{tradeTab === "buy" ? "Buy" : "Sell"} {outcomes[selectedOutcomeIdx]?.name || "Yes"}{amountNum > 0 ? ` · $${amountNum}` : ""}</>}
        </button>

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
          By trading you agree to the <span className="underline cursor-pointer">Terms of Use</span>
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────── main page */
export default function PredictionDetailPage() {
  const [, params]      = useRoute("/prediction/:id");
  const [, setLocation] = useLocation();

  const { data: market, isLoading: marketLoading, error: marketError } =
    useMarketDetail(params?.id);

  const [chartInterval,      setChartInterval]      = useState<Interval>("1D");
  const [tradeTab,           setTradeTab]           = useState<"buy" | "sell">("buy");
  const [rulesTab,           setRulesTab]           = useState<"rules" | "context">("rules");
  const [amount,             setAmount]             = useState("");
  const [orderBookOpen,      setOrderBookOpen]      = useState(true);
  const [mobileSheetOpen,    setMobileSheetOpen]    = useState(false);
  const [mobileBuyIntent,    setMobileBuyIntent]    = useState<0 | 1>(0);

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
        price:   parseFloat(prices[i] || "0.5"),
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

  /* ── Data hooks ── */
  const { data: orderbook }                          = useOrderbook(selectedOutcome?.tokenId);
  const { data: historyData, isLoading: histLoading} = usePriceHistory(selectedOutcome?.tokenId, chartInterval);
  const yesOutcome                                   = outcomes.find(o => o.name.toLowerCase() === "yes");
  const { data: dailyHistory }                       = usePriceHistory(yesOutcome?.tokenId ?? selectedOutcome?.tokenId, "1D");
  const { data: balanceData }                        = useBalance();
  const { data: openOrders }                         = useOpenOrders();
  const placeOrder  = usePlaceOrder();
  const cancelOrder = useCancelOrder();

  /* ── Derived ── */
  const noOutcome       = outcomes.find(o => o.name.toLowerCase() === "no");
  const yesCents        = Math.round((yesOutcome?.price  ?? 0.5) * 100);
  const noCents         = Math.round((noOutcome?.price   ?? 0.5) * 100);
  const selectedCents   = Math.round((selectedOutcome?.price ?? 0.5) * 100);
  const isYesSelected   = selectedOutcome?.name?.toLowerCase() === "yes";
  const amountNum       = Number(amount) || 0;
  const estimatedShares = selectedOutcome?.price > 0 ? amountNum / selectedOutcome.price : 0;
  const potentialProfit = estimatedShares > amountNum ? (estimatedShares - amountNum).toFixed(2) : "0.00";
  const endDate         = market?.endDate ? format(new Date(market.endDate), "MMM d, yyyy") : null;

  const availableUsdc = useMemo(() => {
    if (!balanceData) return 0;
    return parseFloat(balanceData.balance ?? balanceData.allowance ?? "0");
  }, [balanceData]);

  const chartPoints: { t: number; v: number }[] = useMemo(() => {
    const raw: { t: number; p: number }[] = historyData?.history ?? [];
    return raw.length >= 2 ? raw.map((d, i) => ({ t: i, v: Math.round(d.p * 100) })) : [];
  }, [historyData]);

  const change24h = useMemo(() => {
    const pts: { t: number; p: number }[] = dailyHistory?.history ?? [];
    if (pts.length < 2) return null;
    const first = pts[0].p, last = pts[pts.length - 1].p;
    return { value: (last - first) * 100, pct: ((last - first) / (first || 1)) * 100 };
  }, [dailyHistory]);

  const marketOpenOrders = useMemo(() => {
    if (!Array.isArray(openOrders)) return [];
    return openOrders.filter((o: any) => outcomes.some(oc => oc.tokenId === o.asset_id));
  }, [openOrders, outcomes]);

  /* ── Place order ── */
  function handlePlaceOrder() {
    if (amountNum <= 0)           { toast.error("Enter an amount to trade"); return; }
    if (!selectedOutcome?.tokenId){ toast.error("No outcome selected"); return; }
    placeOrder.mutate({
      tokenID: selectedOutcome.tokenId,
      price:   selectedOutcome.price,
      size:    amountNum,
      side:    tradeTab === "buy" ? "BUY" : "SELL",
      type:    "MARKET",
      funderAddress: balanceData?.address ?? "",
    }, {
      onSuccess: (data: any) => {
        if (data?.errorMsg) { toast.error(`Order failed: ${data.errorMsg}`); }
        else { toast.success(`${tradeTab === "buy" ? "Bought" : "Sold"} ${estimatedShares.toFixed(2)} shares of ${selectedOutcome.name}`); setAmount(""); }
      },
      onError: (err: Error) => toast.error(err.message || "Failed to place order"),
    });
  }

  /* ── Open mobile sheet ── */
  function openMobileBuy(idx: 0 | 1) {
    setMobileBuyIntent(idx);
    setSelectedOutcomeIdx(idx);
    setMobileSheetOpen(true);
  }

  /* ── Guards ── */
  if (marketLoading) return <DetailSkeleton />;
  if (marketError || !market) return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12] flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <BarChart2 className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-bold mb-2">{marketError ? "Error loading market" : "Market not found"}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {marketError ? (marketError as Error)?.message : "This market doesn't exist or has been removed."}
        </p>
        <Button onClick={() => setLocation("/prediction")}>← Back to Markets</Button>
      </div>
    </div>
  );

  const tradePanelProps: TradePanelProps = {
    market, outcomes, isBinary,
    selectedOutcomeIdx, setSelectedOutcomeIdx,
    tradeTab, setTradeTab,
    amount, setAmount,
    yesCents, noCents, selectedCents,
    isYesSelected, availableUsdc, balanceData,
    estimatedShares, potentialProfit, amountNum,
    placeOrder, handlePlaceOrder,
  };

  /* ══════════════════════════════════════════════════════ RENDER */
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12] pb-24 lg:pb-0">

      {/* ── Mobile slide-up trade sheet ── */}
      {mobileSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSheetOpen(false)}
          />
          <div className="relative bg-background rounded-t-3xl max-h-[88vh] overflow-y-auto shadow-2xl">
            {/* drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <button
              onClick={() => setMobileSheetOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <TradePanel {...tradePanelProps} />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5">

        {/* Breadcrumb */}
        <button
          onClick={() => setLocation("/prediction")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Prediction Markets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ════════════ LEFT COLUMN ════════════ */}
          <div className="space-y-4 min-w-0">

            {/* ── Hero header ── */}
            <div className="relative rounded-2xl overflow-hidden">
              {/* Background image or gradient */}
              {market.image ? (
                <div className="absolute inset-0">
                  <PolymarketImage
                    src={market.image}
                    className="w-full h-full object-cover"
                    fallback={<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-muted" />
              )}

              {/* Content overlay */}
              <div className={cn(
                "relative px-5 pt-5 pb-5 md:px-7 md:pt-7",
                market.image ? "text-white" : "text-foreground",
              )}>
                {/* Top row: tags + actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {market.tags?.[0] && tagLabel(market.tags[0]) && (
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
                        market.image ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                      )}>
                        {tagLabel(market.tags[0])}
                      </span>
                    )}
                    {market.active && !market.closed && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    )}
                    {market.closed && (
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full",
                        market.image ? "bg-white/20 text-white/70" : "bg-muted text-muted-foreground",
                      )}>
                        Resolved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button className={cn(
                      "p-2 rounded-xl transition-colors",
                      market.image ? "bg-white/10 hover:bg-white/20 text-white" : "border border-border hover:bg-muted text-muted-foreground",
                    )}>
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className={cn(
                      "p-2 rounded-xl transition-colors",
                      market.image ? "bg-white/10 hover:bg-white/20 text-white" : "border border-border hover:bg-muted text-muted-foreground",
                    )}>
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h1 className={cn(
                  "text-xl md:text-2xl font-bold leading-snug tracking-tight mb-4",
                  market.image ? "text-white drop-shadow" : "text-foreground",
                )}>
                  {market.question}
                </h1>

                {/* Stats row */}
                <div className={cn(
                  "flex items-center gap-4 flex-wrap text-xs font-medium",
                  market.image ? "text-white/70" : "text-muted-foreground",
                )}>
                  <span className="flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" />
                    {fmtVol(market.volumeNum ?? 0)} vol.
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" />
                    {market.liquidityNum ? fmtVol(market.liquidityNum) : "—"} liq.
                  </span>
                  {endDate && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {market.closed ? "Ended" : "Ends"} {endDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Probability + Chart ── */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">

              {/* Probability header */}
              <div className="px-5 pt-5 md:px-6 md:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      {isBinary
                        ? (selectedOutcomeIdx === 0 ? "Yes probability" : "No probability")
                        : `${selectedOutcome?.name ?? "—"} probability`}
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black tabular-nums tracking-tight leading-none">
                        {selectedCents}%
                      </span>
                      <span className="text-base text-muted-foreground font-medium mb-0.5">chance</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {change24h === null ? (
                        <span className="text-xs text-muted-foreground">Loading 24h…</span>
                      ) : (
                        <>
                          <span className={cn(
                            "flex items-center gap-1 text-xs font-semibold",
                            change24h.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
                          )}>
                            {change24h.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {change24h.value >= 0 ? "+" : ""}{change24h.pct.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">24h change</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Time interval + binary toggle on right */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Binary Yes/No chart toggle */}
                    {isBinary && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedOutcomeIdx(0)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
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
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
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
                    {/* Time interval */}
                    <div className="flex items-center gap-0.5 rounded-lg border border-border p-1">
                      {CHART_INTERVALS.map(iv => (
                        <button
                          key={iv}
                          onClick={() => setChartInterval(iv)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all",
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
                </div>

                {/* Binary probability bar */}
                {isBinary && (
                  <div className="mb-5">
                    <div className="h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 transition-all duration-500"
                        style={{ width: `${yesCents}%` }}
                      />
                      <div className="flex-1 bg-red-400" />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold mt-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400">Yes {yesCents}%</span>
                      <span className="text-red-500">No {noCents}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Area chart — edge-to-edge, no side padding */}
              <div className="h-[300px] md:h-[360px] w-full">
                {histLoading ? (
                  <div className="h-full flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading chart…</span>
                  </div>
                ) : chartPoints.length < 2 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <BarChart2 className="w-8 h-8 opacity-25" />
                    <p className="text-xs">No price history for this interval</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#B4F22E" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#B4F22E" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                      <XAxis dataKey="t" hide />
                      <YAxis
                        domain={[0, 100]}
                        orientation="right"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}%`}
                        width={38}
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
                        formatter={(v: any) => [`${Math.round(v)}%`, "Probability"]}
                        labelStyle={{ display: "none" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#B4F22E"
                        strokeWidth={2.5}
                        fill="url(#chartGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#B4F22E", stroke: "white", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bottom padding */}
              <div className="h-4" />
            </div>

            {/* ── Multi-outcome list ── */}
            {!isBinary && outcomes.length > 0 && (
              <div className="bg-background border border-border rounded-2xl p-5 md:p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">All Outcomes</h3>
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
                              ? "border-primary/40 bg-primary/5"
                              : "border-border hover:border-foreground/20 hover:bg-muted/40",
                          )}
                        >
                          <span className="text-sm font-semibold">{o.name}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold tabular-nums w-10 text-right">{pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── Order book (collapsible) ── */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOrderBookOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-semibold">Order Book</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-medium">{outcomes[selectedOutcomeIdx]?.name ?? "—"} · {selectedCents}¢</span>
                  {orderBookOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {orderBookOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  {orderbook ? (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                          <span>Bid</span><span>Size</span>
                        </div>
                        <div className="space-y-2">
                          {(orderbook.bids || []).slice(0, 8).map((bid: any, i: number) => {
                            const pct = Number(bid.price) * 100;
                            return (
                              <div key={i} className="relative flex justify-between items-center text-sm">
                                <div className="absolute inset-0 rounded bg-emerald-500/6" style={{ width: `${pct}%` }} />
                                <span className="relative font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{pct.toFixed(1)}¢</span>
                                <span className="relative text-muted-foreground tabular-nums text-xs">{Number(bid.size).toLocaleString()}</span>
                              </div>
                            );
                          })}
                          {(!orderbook.bids || orderbook.bids.length === 0) && (
                            <p className="text-xs text-muted-foreground">No bids</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                          <span>Ask</span><span>Size</span>
                        </div>
                        <div className="space-y-2">
                          {(orderbook.asks || []).slice(0, 8).map((ask: any, i: number) => {
                            const pct = Number(ask.price) * 100;
                            return (
                              <div key={i} className="relative flex justify-between items-center text-sm">
                                <div className="absolute inset-0 rounded bg-red-500/6" style={{ width: `${pct}%` }} />
                                <span className="relative font-semibold text-red-500 tabular-nums">{pct.toFixed(1)}¢</span>
                                <span className="relative text-muted-foreground tabular-nums text-xs">{Number(ask.size).toLocaleString()}</span>
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
              )}
            </div>

            {/* ── About / Details tabs ── */}
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
                    {tab === "rules" ? "About" : "Details"}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {rulesTab === "rules" ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {market.description || "No description specified for this market."}
                  </p>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Condition ID</span>
                      <span className="font-mono text-xs break-all text-right">{market.conditionId}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Market ID</span>
                      <span className="font-mono text-xs break-all text-right">{market.id}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Start date</span>
                      <span className="font-medium">{market.startDate ? format(new Date(market.startDate), "MMM d, yyyy") : "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">End date</span>
                      <span className="font-medium">{endDate ?? "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Status</span>
                      <span className={cn("font-semibold", market.active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                        {market.closed ? "Resolved" : market.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {market.tags?.length > 0 && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">Tags</span>
                        <div className="flex flex-wrap justify-end gap-1">
                          {market.tags.map((tag: unknown, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">{tagLabel(tag)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Open orders ── */}
            {marketOpenOrders.length > 0 && (
              <div className="bg-background border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Your Open Orders</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{marketOpenOrders.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {marketOpenOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          o.side === "BUY"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-500",
                        )}>
                          {o.side}
                        </span>
                        <span className="text-sm font-semibold">
                          {Number(o.size_matched || o.original_size).toFixed(2)} shares
                        </span>
                        <span className="text-xs text-muted-foreground">@ {(Number(o.price) * 100).toFixed(1)}¢</span>
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

          {/* ════════════ RIGHT COLUMN — desktop trade panel ════════════ */}
          <div className="hidden lg:block lg:sticky lg:top-20">
            <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
              <TradePanel {...tradePanelProps} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky bottom Buy bar ── */}
      {!market.closed && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 safe-area-pb">
          <div className="flex gap-2 max-w-lg mx-auto">
            <button
              onClick={() => openMobileBuy(0)}
              className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
            >
              Buy Yes
              <span className="opacity-80 font-medium">· {yesCents}¢</span>
            </button>
            <button
              onClick={() => openMobileBuy(1)}
              className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/25"
            >
              Buy No
              <span className="opacity-80 font-medium">· {noCents}¢</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
