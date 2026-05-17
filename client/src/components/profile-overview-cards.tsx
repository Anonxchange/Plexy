import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useMarkets } from "@/hooks/use-polymarket";
import { shopifyService } from "@/lib/shopify-service";
import { cn } from "@/lib/utils";

interface ShopProduct {
  id: string;
  title: string;
  images: string[];
  price: number;
  currency: string;
  inStock: boolean;
}

/** Fisher-Yates shuffle — returns first `n` items from a fresh random order */
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

interface Props {
  onViewPredictions: () => void;
  onViewShop: () => void;
}

export function ProfileOverviewCards({ onViewPredictions, onViewShop }: Props) {
  const [, setLocation] = useLocation();

  /* ── Predictions ── */
  const { data: predictionMarkets } = useMarkets({ limit: 50 });

  const displayedMarkets = useMemo(() => {
    if (!predictionMarkets || predictionMarkets.length === 0) return [];
    const active = predictionMarkets.filter((m: any) => m.active && !m.closed);
    const pool = active.length >= 3 ? active : predictionMarkets;
    return randomPick(pool, 3);
  }, [predictionMarkets]);

  /* ── Shop products ── */
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);

  useEffect(() => {
    shopifyService.getProducts(12).then((result: any) => {
      const all: ShopProduct[] = result.products.map((edge: any) => {
        const p = edge.node;
        const firstVariant = p.variants?.edges?.[0]?.node;
        return {
          id: p.id,
          title: p.title,
          images: p.images.edges.map((e: any) => e.node.url),
          price: parseFloat(p.priceRange.minVariantPrice.amount),
          currency: p.priceRange.minVariantPrice.currencyCode,
          inStock: firstVariant ? firstVariant.availableForSale : true,
        };
      });
      setShopProducts(randomPick(all, 3));
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">

      {/* ══════════════════ ACTIVE PREDICTIONS ══════════════════ */}
      <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-border shadow-sm bg-white dark:bg-card">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-lime-400 to-emerald-500 inline-block" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">
              Active Predictions
            </span>
          </div>
          <button
            onClick={onViewPredictions}
            className="text-[11px] font-semibold text-primary hover:opacity-70 transition-opacity flex items-center gap-1 bg-primary/8 px-2.5 py-1 rounded-full"
          >
            View all
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Market rows */}
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
                  className={cn(
                    "w-full flex items-center gap-3 py-3 text-left group transition-colors rounded-xl px-1 -mx-1 hover:bg-slate-50 dark:hover:bg-muted/40",
                    !isLast && "border-b border-slate-100 dark:border-border"
                  )}
                >
                  {/* Thumbnail with % badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-muted">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={m.question}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center text-lg font-bold",
                          isHigh ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600" : "bg-red-50 dark:bg-red-950/50 text-red-500"
                        )}>
                          {m.question.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* Odds pill */}
                    <span className={cn(
                      "absolute -bottom-1 -right-1 text-[9px] font-bold px-1 py-0.5 rounded-md leading-none shadow-sm border",
                      isHigh
                        ? "bg-emerald-500 text-white border-emerald-400"
                        : "bg-red-500 text-white border-red-400"
                    )}>
                      {yesOdds}%
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-foreground line-clamp-2 leading-snug">
                      {m.question}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5 truncate">
                      Vol: {m.volume || "—"}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg className="flex-shrink-0 text-slate-300 dark:text-muted-foreground group-hover:text-primary transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════ TRENDING PRODUCTS ══════════════════ */}
      <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-border shadow-sm bg-white dark:bg-card">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-violet-400 to-indigo-500 inline-block" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">
              Trending Products
            </span>
          </div>
          <button
            onClick={onViewShop}
            className="text-[11px] font-semibold text-primary hover:opacity-70 transition-opacity flex items-center gap-1 bg-primary/8 px-2.5 py-1 rounded-full"
          >
            Shop
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Product rows */}
        {shopProducts.length === 0 ? (
          <div className="px-4 pb-5">
            {[0, 1, 2].map(i => (
              <div key={i} className={cn("flex items-center gap-3 py-3", i < 2 && "border-b border-slate-100 dark:border-border")}>
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
                  className={cn(
                    "w-full flex items-center gap-3 py-3 text-left group transition-colors rounded-xl px-1 -mx-1 hover:bg-slate-50 dark:hover:bg-muted/40",
                    !isLast && "border-b border-slate-100 dark:border-border"
                  )}
                >
                  {/* Product image */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex-shrink-0">
                    {p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-300 text-lg">
                        🛍
                      </div>
                    )}
                  </div>

                  {/* Title + currency */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-foreground truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5">{p.currency}</p>
                  </div>

                  {/* Price + arrow */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-foreground tabular-nums">
                      ${p.price.toFixed(2)}
                    </span>
                    <svg className="text-slate-300 dark:text-muted-foreground group-hover:text-primary transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
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
