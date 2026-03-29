import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/trading/CoinIcon";
import CandlestickChart from "@/components/trading/CandlestickChart";
import { asterMarket, Ticker24h } from "@/lib/asterdex-service";
import {
  TrendingUp, TrendingDown, ArrowLeft,
  BarChart2, Star, Share2, ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (v >= 1)    return v.toFixed(4);
  return v.toFixed(6);
}

function fmtVol(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// Normalise URL slug → pair string and API symbol
// URL slug: BTC-USDT  →  pair: BTC/USDT  →  apiSymbol: BTCUSDT
function slugToPair(slug: string) {
  const pair = slug.replace("-", "/");
  const apiSymbol = pair.replace("/", "");
  const base = pair.split("/")[0] ?? pair;
  return { pair, apiSymbol, base };
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function Stat({ label, value, sub, up }: { label: string; value: string; sub?: string; up?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-bold ${up === true ? "text-green-600" : up === false ? "text-red-500" : "text-slate-900"}`}>
        {value}
      </span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CoinDetailPage() {
  const [, params] = useRoute("/markets/:symbol");
  const [location, navigate] = useLocation();
  const [faved, setFaved] = useState(false);

  // parse ?type=spot|futures from query string
  const search = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const type = (search.get("type") ?? "spot") as "spot" | "futures";

  const slug = params?.symbol ?? "BTC-USDT";
  const { pair, apiSymbol, base } = slugToPair(slug);

  // fetch ticker (single symbol is faster)
  const { data: tickerRaw, isLoading } = useQuery<Ticker24h | Ticker24h[]>({
    queryKey: [`ticker-${type}`, apiSymbol],
    queryFn: () =>
      type === "futures"
        ? asterMarket.futuresTicker(apiSymbol)
        : asterMarket.spotTicker(apiSymbol),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // API returns array when no symbol given, object when symbol given
  const ticker: Ticker24h | null = Array.isArray(tickerRaw)
    ? tickerRaw[0] ?? null
    : tickerRaw ?? null;

  const price   = ticker ? parseFloat(ticker.lastPrice) : null;
  const change  = ticker ? parseFloat(ticker.priceChangePercent) : null;
  const high    = ticker ? parseFloat(ticker.highPrice) : null;
  const low     = ticker ? parseFloat(ticker.lowPrice) : null;
  const volume  = ticker ? parseFloat(ticker.quoteVolume) : null;
  const absChange = ticker ? parseFloat(ticker.priceChange) : null;

  const isUp = change !== null ? change >= 0 : true;

  // Exchange info to get token address (for coin icon)
  const { data: exInfo } = useQuery({
    queryKey: type === "futures" ? ["futures-exchange-info"] : ["spot-exchange-info"],
    queryFn: type === "futures" ? asterMarket.futuresExchangeInfo : asterMarket.spotExchangeInfo,
    staleTime: 300_000,
  });

  const address = useMemo(() => {
    const syms: any[] = exInfo?.symbols ?? [];
    return syms.find((s: any) => s.baseAsset === base)?.baseAssetAddress ?? undefined;
  }, [exInfo, base]);

  function goBack() { navigate("/markets"); }

  function goTrade() {
    const path = type === "futures" ? "/perpetual" : "/spot";
    // store the pair in sessionStorage so the trading page can pick it up
    sessionStorage.setItem("pexly_initial_pair", pair);
    navigate(path);
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl pt-4 space-y-3">

        {/* ── Breadcrumb / back ─────────────────────────────────────────── */}
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Market
        </button>

        {/* ── Hero header ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl px-5 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: icon + name + price */}
            <div className="flex items-start gap-4">
              <CoinIcon symbol={base} address={address} className="w-14 h-14 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-slate-900">{pair}</h1>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    type === "futures"
                      ? "bg-orange-50 text-orange-500 border border-orange-100"
                      : "bg-blue-50 text-blue-500 border border-blue-100"
                  }`}>
                    {type === "futures" ? "Perpetual" : "Spot"}
                  </span>
                </div>
                <div className="flex items-end gap-2.5 mt-1.5 flex-wrap">
                  {isLoading || price === null ? (
                    <div className="h-8 w-40 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                        ${fmtPrice(price)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${isUp ? "text-green-600" : "text-red-500"}`}>
                        {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {change !== null ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—"}
                        {absChange !== null && (
                          <span className="text-xs font-semibold opacity-70">
                            ({absChange >= 0 ? "+" : ""}{fmtPrice(absChange)})
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <Button
                onClick={goTrade}
                className="bg-primary hover:bg-primary/90 text-black font-extrabold h-11 px-8 rounded-xl text-sm flex items-center gap-2"
              >
                <BarChart2 className="w-4 h-4" />
                Trade {type === "futures" ? "Perpetual" : "Spot"}
              </Button>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFaved(f => !f)}
                  className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${
                    faved ? "bg-primary/10 border-primary text-primary" : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                  }`}
                >
                  <Star className={`w-4 h-4 ${faved ? "fill-primary" : ""}`} />
                </button>
                <button className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
            <Stat
              label="24h Change"
              value={change !== null ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—"}
              up={change !== null ? change >= 0 : undefined}
            />
            <Stat
              label="24h High"
              value={high !== null ? `$${fmtPrice(high)}` : "—"}
            />
            <Stat
              label="24h Low"
              value={low !== null ? `$${fmtPrice(low)}` : "—"}
            />
            <Stat
              label="24h Volume"
              value={volume !== null ? fmtVol(volume) : "—"}
            />
          </div>
        </div>

        {/* ── Spot / Futures toggle ─────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {(["spot", "futures"] as const).map(t => (
            <button
              key={t}
              onClick={() => navigate(`/markets/${slug}?type=${t}`)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors capitalize ${
                type === t ? "bg-primary text-black" : "bg-white text-muted-foreground hover:bg-slate-100"
              }`}
            >
              {t === "futures" ? "Perpetual" : "Spot"}
            </button>
          ))}
        </div>

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3">

          {/* Chart */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ minHeight: 500 }}>
            <CandlestickChart
              pair={pair}
              mode={type}
              className="w-full h-full"
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-3">

            {/* Market info card */}
            <div className="bg-white rounded-xl px-5 py-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Market Info</h3>
              <div className="space-y-3">
                {[
                  { label: "Symbol",    value: apiSymbol },
                  { label: "Type",      value: type === "futures" ? "Perpetual Futures" : "Spot" },
                  { label: "Quote Asset", value: pair.split("/")[1] ?? "USDT" },
                  { label: "24h High",  value: high !== null ? `$${fmtPrice(high)}` : "—" },
                  { label: "24h Low",   value: low  !== null ? `$${fmtPrice(low)}`  : "—" },
                  { label: "Volume",    value: volume !== null ? fmtVol(volume) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold text-slate-800 tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white rounded-xl px-5 py-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Ready to trade?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {type === "futures"
                  ? "Trade this pair with leverage on the perpetual futures market."
                  : "Buy and sell this pair instantly on the spot market."}
              </p>
              <Button
                onClick={goTrade}
                className="w-full bg-primary hover:bg-primary/90 text-black font-extrabold h-11 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open {type === "futures" ? "Perpetual" : "Spot"} Trading
              </Button>
              {type === "spot" && (
                <Button
                  onClick={() => {
                    sessionStorage.setItem("pexly_initial_pair", pair);
                    navigate("/perpetual");
                  }}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-sm font-bold border-slate-200 text-slate-700"
                >
                  Switch to Perpetual
                </Button>
              )}
              {type === "futures" && (
                <Button
                  onClick={() => {
                    sessionStorage.setItem("pexly_initial_pair", pair);
                    navigate("/spot");
                  }}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-sm font-bold border-slate-200 text-slate-700"
                >
                  Switch to Spot
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

