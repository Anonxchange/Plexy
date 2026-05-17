import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useMarkets } from "@/hooks/use-polymarket";
import { shopifyService } from "@/lib/shopify-service";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DOMPurify from "dompurify";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ShopProduct {
  id: string;
  title: string;
  images: string[];
  price: number;
  currency: string;
  productType?: string;
  inStock: boolean;
}

export interface SpotTrade {
  id: string;
  symbol: string;
  side: string;
  price: string;
  qty: string;
  status: string;
  time: number;
}

export interface PerpTrade {
  id: string;
  symbol: string;
  side: string;
  positionAmt: string;
  entryPrice: string;
  unrealizedProfit: string;
  leverage?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconTrending({ size = 16, up = true }: { size?: number; up?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="tg2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={up ? "#34d399" : "#f87171"} />
          <stop offset="100%" stopColor={up ? "#10b981" : "#ef4444"} />
        </linearGradient>
      </defs>
      {up ? (
        <>
          <polyline points="3,17 8,11 13,14 21,5" stroke="url(#tg2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="16,5 21,5 21,10" stroke="url(#tg2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      ) : (
        <>
          <polyline points="3,7 8,13 13,10 21,19" stroke="url(#tg2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="16,19 21,19 21,14" stroke="url(#tg2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
    </svg>
  );
}

function IconChevronRight({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExternalLink({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconShoppingBag({ size = 14, gradient = false }: { size?: number; gradient?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="sbg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill={gradient ? "url(#sbg2)" : "none"} stroke={gradient ? "none" : "#6366f1"} strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 6h18" stroke={gradient ? "#c7d2fe" : "#6366f1"} strokeWidth="1.5" />
      <path d="M16 10a4 4 0 01-8 0" stroke={gradient ? "#e0e7ff" : "#6366f1"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconClock({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function parsePrices(raw: string): string[] {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

function useShopProducts(count: number) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  useEffect(() => {
    shopifyService.getProducts(count * 3).then((result: any) => {
      const all: ShopProduct[] = result.products.map((edge: any) => {
        const p = edge.node;
        const firstVariant = p.variants?.edges?.[0]?.node;
        return {
          id: p.id, title: p.title,
          images: p.images.edges.map((e: any) => e.node.url),
          price: parseFloat(p.priceRange.minVariantPrice.amount),
          currency: p.priceRange.minVariantPrice.currencyCode,
          productType: p.productType || "",
          inStock: firstVariant ? firstVariant.availableForSale : true,
        };
      });
      setProducts(randomPick(all, count));
    }).catch(() => {});
  }, [count]);
  return products;
}

// ─── ProfileOverviewCards ─────────────────────────────────────────────────────

interface OverviewProps {
  onViewPredictions: () => void;
  onViewShop: () => void;
}

export function ProfileOverviewCards({ onViewPredictions, onViewShop }: OverviewProps) {
  const [, setLocation] = useLocation();
  const { data: predictionMarkets } = useMarkets({ limit: 50 });
  const shopProducts = useShopProducts(4);

  const displayedMarkets = useMemo(() => {
    if (!predictionMarkets || predictionMarkets.length === 0) return [];
    const active = predictionMarkets.filter((m: any) => m.active && !m.closed);
    const pool = active.length >= 3 ? active : predictionMarkets;
    return randomPick(pool, 3);
  }, [predictionMarkets]);

  return (
    <div className="space-y-4">

      {/* ══ ACTIVE PREDICTIONS ══ */}
      <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-border shadow-sm bg-white dark:bg-card">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-lime-400 to-emerald-500 inline-block" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Active Predictions</span>
          </div>
          <button
            onClick={onViewPredictions}
            className="text-[11px] font-semibold text-primary hover:opacity-70 transition-opacity flex items-center gap-1 bg-primary/8 px-2.5 py-1 rounded-full"
          >
            View all
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {displayedMarkets.length === 0 ? (
          <div className="px-4 pb-5">
            {[0, 1, 2].map(i => (
              <div key={i} className={cn("flex items-center gap-3 py-3", i < 2 && "border-b border-slate-100 dark:border-border")}>
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-slate-100 dark:bg-muted rounded-full animate-pulse w-3/4" />
                  <div className="h-2 bg-slate-100 dark:bg-muted rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 pb-4">
            {displayedMarkets.map((m: any, i: number) => {
              const prices = parsePrices(m.outcomePrices);
              const yesOdds = prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 0;
              const isHigh = yesOdds >= 50;
              const isLast = i === displayedMarkets.length - 1;
              const imgSrc = m.image || m.icon || null;
              return (
                <button
                  key={m.id}
                  onClick={() => setLocation(`/prediction/${m.id}`)}
                  className={cn("w-full flex items-center gap-3 py-3 text-left group transition-colors rounded-xl px-1 -mx-1 hover:bg-slate-50 dark:hover:bg-muted/40", !isLast && "border-b border-slate-100 dark:border-border")}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-muted">
                      {imgSrc ? (
                        <img src={imgSrc} alt={m.question} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className={cn("w-full h-full flex items-center justify-center text-lg font-bold", isHigh ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600" : "bg-red-50 dark:bg-red-950/50 text-red-500")}>
                          {m.question.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className={cn("absolute -bottom-1 -right-1 text-[9px] font-bold px-1 py-0.5 rounded-md leading-none shadow-sm border", isHigh ? "bg-emerald-500 text-white border-emerald-400" : "bg-red-500 text-white border-red-400")}>
                      {yesOdds}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-foreground line-clamp-2 leading-snug">{m.question}</p>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5 truncate">Vol: {m.volume || "—"}</p>
                  </div>
                  <svg className="flex-shrink-0 text-slate-300 dark:text-muted-foreground group-hover:text-primary transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ TRENDING PRODUCTS (6 items) ══ */}
      <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-border shadow-sm bg-white dark:bg-card">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-violet-400 to-indigo-500 inline-block" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Trending Products</span>
          </div>
          <button
            onClick={onViewShop}
            className="text-[11px] font-semibold text-primary hover:opacity-70 transition-opacity flex items-center gap-1 bg-primary/8 px-2.5 py-1 rounded-full"
          >
            Shop
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {shopProducts.length === 0 ? (
          <div className="px-4 pb-5">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className={cn("flex items-center gap-3 py-3", i < 5 && "border-b border-slate-100 dark:border-border")}>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-slate-100 dark:bg-muted rounded-full animate-pulse w-2/3" />
                  <div className="h-2 bg-slate-100 dark:bg-muted rounded-full animate-pulse w-1/3" />
                </div>
                <div className="w-12 h-2.5 bg-slate-100 dark:bg-muted rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 pb-4">
            {shopProducts.map((p, i) => {
              const isLast = i === shopProducts.length - 1;
              return (
                <button
                  key={p.id}
                  onClick={() => setLocation(`/shop/product/${encodeURIComponent(p.id)}`)}
                  className={cn("w-full flex items-center gap-3 py-3 text-left group transition-colors rounded-xl px-1 -mx-1 hover:bg-slate-50 dark:hover:bg-muted/40", !isLast && "border-b border-slate-100 dark:border-border")}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex-shrink-0">
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-indigo-300 text-lg">🛍</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-foreground truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5">{p.currency}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-foreground tabular-nums">${p.price.toFixed(2)}</span>
                    <svg className="text-slate-300 dark:text-muted-foreground group-hover:text-primary transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ─── ProfilePredictionsTab ─────────────────────────────────────────────────────

export function ProfilePredictionsTab() {
  const [, setLocation] = useLocation();
  const { data: predictionMarkets } = useMarkets({ limit: 10 });

  const activeMarkets = useMemo(() => {
    if (!predictionMarkets) return [];
    return [...predictionMarkets].sort((a: any, b: any) => (b.volumeNum || 0) - (a.volumeNum || 0));
  }, [predictionMarkets]);

  return (
    <div className="space-y-3 animate-in fade-in-0 duration-200">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-lime-400 to-emerald-500 inline-block" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-foreground">Prediction Markets</h2>
        </div>
        <Link href="/prediction" className="text-[11px] font-semibold text-primary flex items-center gap-1 bg-primary/8 px-2.5 py-1 rounded-full hover:opacity-70 transition-opacity">
          Browse all <IconExternalLink size={10} />
        </Link>
      </div>

      {activeMarkets.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 dark:border-border bg-white dark:bg-card p-10 text-center">
          <p className="text-sm text-slate-400">No prediction markets available</p>
        </div>
      ) : (
        activeMarkets.map((m: any) => {
          const prices = (() => { try { return JSON.parse(m.outcomePrices || "[]"); } catch { return []; } })();
          const yesOdds = prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 0;
          const noOdds = 100 - yesOdds;
          const isHigh = yesOdds >= 50;
          const imgSrc = m.image || m.icon || null;
          const isTrending = (m.volumeNum || 0) > 500000;
          return (
            <div key={m.id} className="rounded-2xl border border-slate-100 dark:border-border bg-white dark:bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-border/80 transition-all duration-200 group">
              <div className="relative h-28 bg-slate-100 dark:bg-muted overflow-hidden cursor-pointer" onClick={() => setLocation(`/prediction/${m.id}`)}>
                {imgSrc
                  ? <img src={DOMPurify.sanitize(imgSrc)} alt={m.question} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-muted dark:to-muted/50 flex items-center justify-center"><span className="text-4xl opacity-20 select-none">{m.question.charAt(0)}</span></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-lg shadow", isHigh ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                    {yesOdds}% YES
                  </span>
                  {isTrending && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-lime-400 text-lime-900 flex items-center gap-1">
                      <IconTrending size={9} up /> Hot
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3
                  className="text-sm font-semibold text-slate-800 dark:text-foreground leading-snug mb-3 cursor-pointer hover:text-primary transition-colors line-clamp-2"
                  onClick={() => setLocation(`/prediction/${m.id}`)}
                >
                  {m.question}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold w-8 shrink-0">YES {yesOdds}%</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700" style={{ width: `${yesOdds}%` }} />
                  </div>
                  <span className="text-[10px] text-red-500 font-semibold w-8 shrink-0 text-right">NO {noOdds}%</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-muted-foreground mb-3">Vol: {m.volume || "—"}</p>
                <div className="flex gap-2">
                  <button className="flex-1 h-8 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors" onClick={() => setLocation(`/prediction/${m.id}`)}>Buy YES</button>
                  <button className="flex-1 h-8 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-colors" onClick={() => setLocation(`/prediction/${m.id}`)}>Buy NO</button>
                  <button className="h-8 w-8 rounded-xl border border-slate-200 dark:border-border flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 transition-colors" onClick={() => setLocation(`/prediction/${m.id}`)}>
                    <IconChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── ProfileShopTab ───────────────────────────────────────────────────────────

export function ProfileShopTab() {
  const [, setLocation] = useLocation();
  const shopProducts = useShopProducts(4);

  return (
    <div className="animate-in fade-in-0 duration-200 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-violet-400 to-indigo-500 inline-block" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-foreground">Pexly Store</h2>
        </div>
        <Link href="/shop" className="text-[11px] font-semibold text-primary flex items-center gap-1 bg-primary/8 px-2.5 py-1 rounded-full hover:opacity-70 transition-opacity">
          Full store <IconExternalLink size={10} />
        </Link>
      </div>

      {shopProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 dark:border-border bg-white dark:bg-card p-10 text-center">
          <p className="text-sm text-slate-400">Loading products…</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shopProducts.map(p => (
            <div
              key={p.id}
              className={cn("rounded-2xl border border-slate-100 dark:border-border bg-white dark:bg-card overflow-hidden shadow-sm group transition-all duration-200", p.inStock ? "cursor-pointer hover:shadow-md hover:border-slate-200 dark:hover:border-border/80" : "opacity-70")}
              onClick={() => p.inStock && setLocation(`/shop/product/${encodeURIComponent(p.id)}`)}
            >
              <div className="relative aspect-square bg-slate-100 dark:bg-muted overflow-hidden">
                {p.images[0]
                  ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><IconShoppingBag size={36} gradient /></div>}
                {!p.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-lg">Sold Out</span>
                  </div>
                )}
                {p.inStock && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500 text-white shadow">In Stock</span>
                )}
              </div>
              <div className="p-3">
                {p.productType && (
                  <p className="text-[9px] text-slate-400 dark:text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">{p.productType}</p>
                )}
                <h3 className="text-xs font-semibold text-slate-800 dark:text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-foreground">${p.price.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 dark:text-muted-foreground font-medium">{p.currency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ProfileActivityTab ───────────────────────────────────────────────────────

export function ProfileActivityTab({ userId }: { userId: string | undefined }) {
  const supabase = createClient();
  const [tradeTypeFilter, setTradeTypeFilter] = useState<"spot" | "perp">("spot");
  const [spotTrades, setSpotTrades] = useState<SpotTrade[]>([]);
  const [perpTrades, setPerpTrades] = useState<PerpTrade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoadingTrades(true);
    Promise.all([
      supabase.from("spot_orders").select("*").eq("user_id", userId).order("time", { ascending: false }).limit(20)
        .then(({ data }) => setSpotTrades(data || [])).catch(() => setSpotTrades([])),
      supabase.from("perp_positions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)
        .then(({ data }) => setPerpTrades(data || [])).catch(() => setPerpTrades([])),
    ]).finally(() => setLoadingTrades(false));
  }, [userId]);

  return (
    <div className="animate-in fade-in-0 duration-200 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-orange-400 to-rose-500 inline-block" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-foreground">Trade History</h2>
        </div>
        <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-muted rounded-xl">
          {(["spot", "perp"] as const).map(t => (
            <button key={t} onClick={() => setTradeTypeFilter(t)}
              className={cn("px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all",
                tradeTypeFilter === t
                  ? "bg-white dark:bg-card text-slate-800 dark:text-foreground shadow-sm"
                  : "text-slate-400 dark:text-muted-foreground hover:text-slate-600 dark:hover:text-foreground")}>
              {t === "spot" ? "Spot" : "Perp"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-border bg-white dark:bg-card overflow-hidden shadow-sm">
        {loadingTrades ? (
          <div className="px-5 py-8 flex items-center gap-3 text-slate-400 dark:text-muted-foreground">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Loading trades…</span>
          </div>
        ) : tradeTypeFilter === "spot" ? (
          spotTrades.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">No spot trade history yet</p>
              <p className="text-[11px] text-slate-300 dark:text-muted-foreground/60 mt-1">Trades will appear here once you start trading</p>
            </div>
          ) : (
            spotTrades.map((trade, i) => (
              <div key={trade.id || i} className={cn("flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-muted/40 transition-colors", i > 0 && "border-t border-slate-100 dark:border-border")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[9px] font-extrabold flex-shrink-0 tracking-wide",
                  trade.side === "BUY"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400")}>
                  {trade.side}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-foreground">{trade.symbol}</p>
                  <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5 flex items-center gap-1">
                    <IconClock size={9} />
                    {trade.time ? new Date(trade.time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-foreground tabular-nums">{parseFloat(trade.qty || "0").toFixed(4)}</p>
                  <span className={cn("inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5",
                    trade.status === "FILLED"
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-muted text-slate-500 dark:text-muted-foreground")}>
                    {trade.status || "—"}
                  </span>
                </div>
              </div>
            ))
          )
        ) : (
          perpTrades.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">No perpetual positions yet</p>
              <p className="text-[11px] text-slate-300 dark:text-muted-foreground/60 mt-1">Open a position to see it here</p>
            </div>
          ) : (
            perpTrades.map((pos, i) => {
              const pnl = parseFloat(pos.unrealizedProfit || "0");
              const isProfit = pnl >= 0;
              return (
                <div key={pos.id || i} className={cn("flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-muted/40 transition-colors", i > 0 && "border-t border-slate-100 dark:border-border")}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[9px] font-extrabold flex-shrink-0 tracking-wide",
                    pos.side === "LONG"
                      ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400")}>
                    {pos.side === "LONG" ? "LONG" : "SHORT"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-foreground">
                      {pos.symbol}
                      {pos.leverage && <span className="ml-1.5 text-[10px] font-bold text-slate-400 dark:text-muted-foreground bg-slate-100 dark:bg-muted px-1.5 py-0.5 rounded-md">{pos.leverage}×</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5">Entry {parseFloat(pos.entryPrice || "0").toFixed(2)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-foreground tabular-nums">{parseFloat(pos.positionAmt || "0").toFixed(4)}</p>
                    <span className={cn("text-[11px] font-bold tabular-nums", isProfit ? "text-emerald-500" : "text-red-500")}>
                      {isProfit ? "+" : ""}{pnl.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
