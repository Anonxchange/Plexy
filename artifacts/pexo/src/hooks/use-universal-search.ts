import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, shopifyService } from "@/lib/shopify-service";
import { useCountryPreferences } from "@/lib/country-preferences";
import { airTile, giftTile } from "@/lib/gift-card-utils";
import { sanitizeImageUrl } from "@/lib/sanitize";

export type SearchKind = "gift-card" | "topup" | "product";
export interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  href: string;
  price?: string;
  priceValue?: number;
  category?: string;
  discount?: number;
  availableForSale?: boolean;
  relevance?: number;
}
export interface SearchGroup {
  kind: SearchKind;
  label: string;
  results: SearchResult[];
  error?: string;
  needsCountry?: boolean;
}

async function digitalRequest(name: string, params: Record<string, string>, signal?: AbortSignal) {
  const client = await getSupabase();
  const { data: { session } } = await client.auth.getSession();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`);
  Object.entries(params).forEach(([k, value]) => url.searchParams.set(k, value));
  const response = await fetch(url, {
    signal,
    headers: { apikey: key, Authorization: `Bearer ${session?.access_token ?? key}` },
  });
  if (!response.ok) throw new Error("This catalog is temporarily unavailable. Please try again.");
  return response.json();
}

function tokenize(text: string): string[] {
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function scoreMatch(
  rawQuery: string,
  queryWords: string[],
  title: string,
  secondary = "",
  boost = 0,
): number {
  const q = rawQuery.toLocaleLowerCase().trim();
  const t = title.toLocaleLowerCase().trim();
  const s = secondary.toLocaleLowerCase().trim();
  const titleWords = tokenize(t);

  let score = boost;
  if (t === q) score += 1000;
  else if (t.startsWith(q)) score += 650;
  else if (q.length >= 2 && t.includes(q)) score += 450;

  let matchedInTitle = 0;
  let matchedAnywhere = 0;
  for (const w of queryWords) {
    const prefixTitle = titleWords.some((tw) => tw.startsWith(w));
    const inTitle = prefixTitle || t.includes(w);
    const inSecondary = s.includes(w);
    if (prefixTitle) score += 60;
    else if (inTitle) score += 35;
    else if (inSecondary) score += 14;
    if (inTitle) matchedInTitle += 1;
    if (inTitle || inSecondary) matchedAnywhere += 1;
  }

  if (queryWords.length > 0) {
    if (matchedInTitle === queryWords.length) score += 240;
    else if (matchedAnywhere === queryWords.length) score += 110;
  }
  return score;
}

// Escape Shopify's search grammar: user text must not become a query operator.
function shopifySearch(query: string, mode: "AND" | "OR" = "AND") {
  const words = (query.match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 8);
  return words.length
    ? words.map((word) => `(title:${word}* OR tag:${word}* OR product_type:${word}*)`).join(` ${mode} `)
    : 'title:""';
}

export function useUniversalSearch(query: string, enabled = true) {
  const preferences = useCountryPreferences();
  const digitalCountry = preferences.digital?.country;
  const deliveryCountry = preferences.delivery?.country;
  const [debounced, setDebounced] = useState(query.trim().slice(0, 120));
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim().slice(0, 120)), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const result = useQuery<SearchGroup[]>({
    queryKey: ["universal-search", debounced, digitalCountry, deliveryCountry],
    enabled: enabled && debounced.length >= 2,
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const words = tokenize(debounced);

      const definitions: Array<{ kind: SearchKind; label: string; load: () => Promise<SearchResult[]> }> = [
        {
          kind: "gift-card",
          label: "Gift cards",
          load: async () => {
            const directRaw = await digitalRequest(
              "reloadly-products",
              {
                productName: debounced,
                page: "1",
                size: "48",
                ...(digitalCountry ? { countryCode: digitalCountry } : {}),
              },
              signal,
            );
            const directList = (Array.isArray(directRaw) ? directRaw : directRaw?.content ?? []).filter(
              (p: any) => p && p.status !== "INACTIVE",
            );

            // When direct productName returns few hits (e.g. searching a category like "gaming",
            // "travel", "food" or multi-word query), match against the cached country catalog too.
            let catalogExtra: any[] = [];
            if (directList.length < 8) {
              const catalogData = await queryClient
                .fetchQuery({
                  queryKey: ["gift-card-search-catalog", digitalCountry ?? "all"],
                  staleTime: 1000 * 60 * 10,
                  queryFn: () =>
                    digitalRequest("reloadly-products", {
                      page: "1",
                      size: "200",
                      ...(digitalCountry ? { countryCode: digitalCountry } : {}),
                    }),
                })
                .catch(() => null);
              const catalogList: any[] = Array.isArray(catalogData)
                ? catalogData
                : catalogData?.content ?? [];
              catalogExtra = catalogList.filter((p: any) => {
                if (!p || p.status === "INACTIVE") return false;
                const hay = [
                  p.productName,
                  p.brand?.brandName,
                  p.category?.name,
                  p.country?.name,
                  p.country?.isoName,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLocaleLowerCase();
                return words.length > 0 && words.every((w) => hay.includes(w));
              });
            }

            const deduped = new Map<string, any>();
            for (const p of [...directList, ...catalogExtra]) {
              const key = String(p.productId);
              if (!deduped.has(key)) deduped.set(key, p);
            }

            return Array.from(deduped.values())
              .map((p: any) => {
                const tile = giftTile(p);
                const numericPrice = typeof tile.usd === "number" && Number.isFinite(tile.usd) ? tile.usd : undefined;
                const secondary = [p.brand?.brandName, p.category?.name, p.country?.name].filter(Boolean).join(" ");
                const discount = typeof p.discountPercentage === "number" ? p.discountPercentage : 0;
                const relevance = scoreMatch(debounced, words, tile.name, secondary, discount > 0 ? 10 : 0);
                return {
                  id: String(p.productId),
                  kind: "gift-card" as const,
                  title: tile.name,
                  subtitle: p.category?.name
                    ? `${p.category.name}${p.country?.name ? ` · ${p.country.name}` : ""}`
                    : p.country?.name ?? "Gift card",
                  image: sanitizeImageUrl(tile.img) || undefined,
                  href: `/gift-cards/${encodeURIComponent(p.productId)}`,
                  price: tile.range || undefined,
                  priceValue: numericPrice,
                  category: p.category?.name || undefined,
                  discount: discount > 0 ? discount : undefined,
                  relevance,
                };
              })
              .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0) || a.title.localeCompare(b.title))
              .slice(0, 48);
          },
        },
        {
          kind: "topup",
          label: "Mobile top-ups",
          load: async () => {
            if (!digitalCountry) return [];
            const ops = await queryClient.fetchQuery({
              queryKey: ["airtime-operators", digitalCountry],
              staleTime: 1000 * 60 * 30,
              queryFn: async () => {
                const raw = await digitalRequest("reloadly-operators", { countryCode: digitalCountry }, signal);
                return Array.isArray(raw) ? raw : raw?.content ?? [];
              },
            });

            return (ops as any[])
              .filter((op: any) => {
                const hay = [
                  op.name,
                  op.country?.name,
                  digitalCountry,
                  "mobile topup top-up airtime recharge",
                  op.bundle || op.data ? "data bundle internet" : "airtime",
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLocaleLowerCase();
                return words.every((w) => hay.includes(w));
              })
              .map((op: any) => {
                const tile = airTile(op);
                const minRaw = op.minAmount ?? op.fixedAmounts?.[0] ?? op.localMinAmount ?? op.localFixedAmounts?.[0];
                const numericPrice = typeof minRaw === "number" && Number.isFinite(minRaw) ? minRaw : undefined;
                const secondary = [op.country?.name, digitalCountry, op.bundle || op.data ? "data bundle" : "airtime"]
                  .filter(Boolean)
                  .join(" ");
                const relevance = scoreMatch(debounced, words, op.name, secondary, 0);
                return {
                  id: String(op.operatorId ?? op.id),
                  kind: "topup" as const,
                  title: op.name,
                  subtitle: `${op.bundle || op.data ? "Mobile data & top-up" : "Mobile top-up"} · ${digitalCountry}`,
                  image: sanitizeImageUrl(op.logoUrls?.[0] ?? tile.img) || undefined,
                  href: `/mobile-topup?operator=${encodeURIComponent(op.operatorId ?? op.id)}`,
                  price: tile.range || undefined,
                  priceValue: numericPrice,
                  relevance,
                };
              })
              .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0) || a.title.localeCompare(b.title))
              .slice(0, 24);
          },
        },
        {
          kind: "product",
          label: "Physical products",
          load: async () => {
            const strict = await shopifyService.getProducts(48, undefined, shopifySearch(debounced, "AND"));
            let edges: any[] = strict.products ?? [];

            // Broaden multi-word / zero-hit searches so partial matches in title, tags, type, or description still surface cleanly
            if (edges.length < 4 && (words.length > 1 || edges.length === 0)) {
              const broad = await shopifyService
                .getProducts(48, undefined, shopifySearch(debounced, "OR"))
                .catch(() => ({ products: [] }));
              const seen = new Set(edges.map((e: any) => e?.node?.id).filter(Boolean));
              for (const edge of broad.products ?? []) {
                if (edge?.node?.id && !seen.has(edge.node.id)) {
                  seen.add(edge.node.id);
                  edges.push(edge);
                }
              }
            }

            return edges
              .map(({ node: p }: any) => {
                const firstImage = p.images?.edges?.[0]?.node;
                const minAmount = Number(p.priceRange?.minVariantPrice?.amount);
                const variants: any[] = p.variants?.edges ?? [];
                const availableForSale =
                  variants.length === 0 || variants.some((v) => v?.node?.availableForSale !== false);
                const secondary = [
                  p.productType,
                  ...(Array.isArray(p.tags) ? p.tags : []),
                  typeof p.description === "string" ? p.description.slice(0, 240) : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const relevance = scoreMatch(
                  debounced,
                  words,
                  p.title || "",
                  secondary,
                  availableForSale ? 30 : 0,
                );
                return {
                  id: p.id,
                  kind: "product" as const,
                  title: p.title,
                  subtitle: p.productType || "Physical product",
                  image: sanitizeImageUrl(firstImage?.url) || undefined,
                  imageWidth: typeof firstImage?.width === "number" ? firstImage.width : undefined,
                  imageHeight: typeof firstImage?.height === "number" ? firstImage.height : undefined,
                  href: `/shop/product/${encodeURIComponent(p.handle)}`,
                  price: p.priceRange?.minVariantPrice
                    ? formatPrice(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode)
                    : undefined,
                  priceValue: Number.isFinite(minAmount) ? minAmount : undefined,
                  category: p.productType || undefined,
                  availableForSale,
                  relevance,
                };
              })
              .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0) || a.title.localeCompare(b.title))
              .slice(0, 48);
          },
        },
      ];

      return Promise.all(
        definitions.map(async ({ kind, label, load }) => {
          if (!isSupabaseConfigured()) {
            return { kind, label, results: [], error: "Live catalogs are not connected in this copy yet." };
          }
          if (kind === "topup" && !digitalCountry) {
            return { kind, label, results: [], needsCountry: true };
          }
          try {
            return { kind, label, results: await load() };
          } catch (error) {
            if (signal.aborted) throw error;
            return {
              kind,
              label,
              results: [],
              error: error instanceof Error ? error.message : "Catalog unavailable.",
            };
          }
        }),
      );
    },
  });

  const isDebouncing = debounced !== query.trim().slice(0, 120);
  return { ...result, groups: isDebouncing ? [] : result.data ?? [], isDebouncing, digitalCountry, deliveryCountry };
}
