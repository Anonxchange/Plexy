import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, TrendingUp, TrendingDown, ArrowRight, Check } from '@/lib/icons';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { asterMarket, type Ticker24h } from "@/lib/asterdex-service";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { Skeleton } from "@/components/ui/skeleton";

type Mode = "Spot" | "Perpetual";
type Tab  = "Hot" | "New" | "Gainers" | "Losers" | "Turnover";

const TABS: Tab[] = ["Hot", "New", "Gainers", "Losers", "Turnover"];

function parsePct(t: Ticker24h) { return parseFloat(t.priceChangePercent) || 0; }
function parseVol(t: Ticker24h) { return parseFloat(t.quoteVolume)        || 0; }

function filterByTab(tickers: Ticker24h[], tab: Tab): Ticker24h[] {
  const sorted = [...tickers];
  switch (tab) {
    case "Hot":
      return sorted.sort((a, b) => parseVol(b) - parseVol(a)).slice(0, 8);
    case "New":
      return sorted
        .sort((a, b) => Math.abs(parsePct(b)) - Math.abs(parsePct(a)))
        .slice(0, 8);
    case "Gainers":
      return sorted
        .filter(t => parsePct(t) > 0)
        .sort((a, b) => parsePct(b) - parsePct(a))
        .slice(0, 8);
    case "Losers":
      return sorted
        .filter(t => parsePct(t) < 0)
        .sort((a, b) => parsePct(a) - parsePct(b))
        .slice(0, 8);
    case "Turnover":
      return sorted.sort((a, b) => parseVol(b) - parseVol(a)).slice(0, 8);
  }
}

function toDisplayPair(symbol: string): { base: string; quote: string } {
  const quote = symbol.endsWith("USDT") ? "USDT"
    : symbol.endsWith("USDC") ? "USDC"
    : symbol.endsWith("BTC")  ? "BTC"
    : symbol.endsWith("ETH")  ? "ETH"
    : "USDT";
  const base = symbol.slice(0, symbol.length - quote.length);
  return { base, quote };
}

function formatPrice(price: string): string {
  const n = parseFloat(price);
  if (isNaN(n)) return price;
  if (n >= 10000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1)     return n.toFixed(4);
  return n.toPrecision(4);
}

function formatVolume(quoteVol: string): string {
  const n = parseFloat(quoteVol);
  if (isNaN(n)) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

interface MarketsSectionProps {
  className?: string;
}

export const MarketsSection = ({ className = "" }: MarketsSectionProps) => {
  const [mode, setMode]             = useState<Mode>("Spot");
  const [activeTab, setActiveTab]   = useState<Tab>("Hot");
  const [dropdownOpen, setDropdown] = useState(false);
  const dropdownRef                 = useRef<HTMLDivElement>(null);
  const [, setLocation]             = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: spotRaw,    isLoading: spotLoading }    = useQuery<Ticker24h[]>({
    queryKey: ["dashboard-spot-tickers"],
    queryFn:  () => asterMarket.spotTicker(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { data: futuresRaw, isLoading: futuresLoading } = useQuery<Ticker24h[]>({
    queryKey: ["dashboard-futures-tickers"],
    queryFn:  () => asterMarket.futuresTicker(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const isLoading = mode === "Spot" ? spotLoading : futuresLoading;

  const rows = useMemo(() => {
    const raw = mode === "Spot" ? spotRaw : futuresRaw;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const usdt = raw.filter(t => t.symbol.endsWith("USDT"));
    return filterByTab(usdt, activeTab);
  }, [mode, activeTab, spotRaw, futuresRaw]);

  const handleCoinClick = (ticker: Ticker24h) => {
    const { base, quote } = toDisplayPair(ticker.symbol);
    const pair = `${base}/${quote}`;
    sessionStorage.setItem("pexly_initial_pair", pair);
    setLocation(mode === "Spot" ? "/spot" : "/perpetual");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setDropdown(false);
    setActiveTab("Hot");
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Markets</h2>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdown(o => !o)}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            {mode}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[130px]">
              {(["Spot", "Perpetual"] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  {m}
                  {mode === m && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap relative ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 py-2">
          <span>Trading Pairs</span>
          <div className="flex">
            <span className="w-24 text-center">Price</span>
            <span className="w-20 text-right">
              {activeTab === "Turnover" ? "Volume" : "24H Change"}
            </span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))
            : rows.length === 0
            ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No data available
                </p>
              )
            : rows.map(ticker => {
                const { base, quote } = toDisplayPair(ticker.symbol);
                const pct     = parsePct(ticker);
                const isUp    = pct >= 0;
                const iconKey = base;

                return (
                  <button
                    key={ticker.symbol}
                    onClick={() => handleCoinClick(ticker)}
                    className="w-full flex items-center justify-between py-3.5 hover:bg-muted/30 transition-colors active:bg-muted/50 rounded-lg px-1"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          cryptoIconUrls[iconKey] ||
                          `https://ui-avatars.com/api/?name=${base}&background=random&size=36&bold=true`
                        }
                        alt={base}
                        className="w-9 h-9 rounded-full bg-muted object-cover"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            `https://ui-avatars.com/api/?name=${base}&background=random&size=36&bold=true`;
                        }}
                      />
                      <div className="text-left">
                        <span className="font-semibold text-foreground text-sm">{base}</span>
                        <span className="text-muted-foreground text-sm">/{quote}</span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="w-24 text-center font-medium text-foreground text-sm">
                        ${formatPrice(ticker.lastPrice)}
                      </span>
                      {activeTab === "Turnover" ? (
                        <span className="w-20 text-right text-sm font-medium text-muted-foreground">
                          {formatVolume(ticker.quoteVolume)}
                        </span>
                      ) : (
                        <div className={`w-20 text-right flex items-center justify-end gap-0.5 font-medium text-sm ${
                          isUp ? "text-primary" : "text-destructive"
                        }`}>
                          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(pct).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
        </div>

        <button
          onClick={() => setLocation("/markets")}
          className="flex items-center gap-1 text-primary font-medium text-sm mt-4 hover:gap-2 transition-all"
        >
          Market Overview
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

