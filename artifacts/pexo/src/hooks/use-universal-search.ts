import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { shopifyService } from "@/lib/shopify-service";
import { useCountryPreferences } from "@/lib/country-preferences";

export type SearchKind = "gift-card" | "topup" | "product";
export interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  image?: string;
  href: string;
  price?: string;
}
export interface SearchGroup {
  kind: SearchKind;
  label: string;
  results: SearchResult[];
  error?: string;
  needsCountry?: boolean;
}

async function digitalRequest(name: string, params: Record<string, string>, signal: AbortSignal) {
  const client = await getSupabase();
  const { data: { session } } = await client.auth.getSession();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    signal,
    headers: { apikey: key, Authorization: `Bearer ${session?.access_token ?? key}` },
  });
  if (!response.ok) throw new Error("This catalog is temporarily unavailable. Please try again.");
  return response.json();
}

// Escape Shopify's search grammar: user text must not become a query operator.
function shopifySearch(query: string) {
  const words = query.match(/[\p{L}\p{N}]+/gu)?.slice(0, 8) ?? [];
  return words.length
    ? words.map(word => `(title:${word}* OR tag:${word}* OR product_type:${word}*)`).join(" AND ")
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
      const definitions: Array<{ kind: SearchKind; label: string; load: () => Promise<SearchResult[]> }> = [
        {
          kind: "gift-card", label: "Gift cards",
          load: async () => {
            const data = await digitalRequest("reloadly-products", {
              productName: debounced, page: "1", size: "24",
              ...(digitalCountry ? { countryCode: digitalCountry } : {}),
            }, signal);
            return (Array.isArray(data) ? data : data.content ?? []).map((p: any) => ({
              id: String(p.productId), kind: "gift-card" as const, title: p.productName,
              subtitle: p.country?.name ?? "Gift card", image: p.logoUrls?.[0],
              href: `/gift-cards/${encodeURIComponent(p.productId)}`,
            }));
          },
        },
        {
          kind: "topup", label: "Mobile top-ups",
          load: async () => {
            if (!digitalCountry) return [];
            const data = await digitalRequest("reloadly-operators", { countryCode: digitalCountry }, signal);
            const words = debounced.toLocaleLowerCase().split(/\s+/);
            return (Array.isArray(data) ? data : data.content ?? [])
              .filter((op: any) => words.every(word => `${op.name} mobile topup top-up airtime data ${digitalCountry}`.toLocaleLowerCase().includes(word)))
              .slice(0, 24).map((op: any) => ({
                id: String(op.operatorId ?? op.id), kind: "topup" as const, title: op.name,
                subtitle: `Mobile top-up · ${digitalCountry}`, image: op.logoUrls?.[0],
                href: `/mobile-topup?operator=${encodeURIComponent(op.operatorId ?? op.id)}`,
              }));
          },
        },
        {
          kind: "product", label: "Physical products",
          load: async () => {
            const data = await shopifyService.getProducts(24, undefined, shopifySearch(debounced));
            return data.products.map(({ node: p }: any) => ({
              id: p.id, kind: "product" as const, title: p.title,
              subtitle: p.productType || "Physical product", image: p.images?.edges?.[0]?.node?.url,
              href: `/shop/product/${encodeURIComponent(p.handle)}`,
              price: p.priceRange?.minVariantPrice
                ? new Intl.NumberFormat(undefined, { style: "currency", currency: p.priceRange.minVariantPrice.currencyCode }).format(Number(p.priceRange.minVariantPrice.amount))
                : undefined,
            }));
          },
        },
      ];
      return Promise.all(definitions.map(async ({ kind, label, load }) => {
        if (!isSupabaseConfigured()) return { kind, label, results: [], error: "Live catalogs are not connected in this copy yet." };
        if (kind === "topup" && !digitalCountry) return { kind, label, results: [], needsCountry: true };
        try {
          return { kind, label, results: await load() };
        } catch (error) {
          if (signal.aborted) throw error;
          return { kind, label, results: [], error: error instanceof Error ? error.message : "Catalog unavailable." };
        }
      }));
    },
  });
  const isDebouncing = debounced !== query.trim().slice(0, 120);
  return { ...result, groups: isDebouncing ? [] : result.data ?? [], isDebouncing, digitalCountry, deliveryCountry };
}
