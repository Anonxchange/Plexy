import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProductsResponse } from "@/hooks/use-reloadly";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
}

/**
 * Every gift card for a country (optionally one category), loaded page by page.
 * Powers the "See all" view. Uses the same `reloadly-products` edge function.
 */
export function useGiftCardCatalog(params: {
  countryCode?: string;
  categoryId?: number;
  size?: number;
  enabled?: boolean;
}) {
  const size = params.size ?? 100;

  return useInfiniteQuery<ProductsResponse>({
    queryKey: ["gift-card-catalog", params.countryCode, params.categoryId, size],
    enabled: params.enabled ?? true,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    // required by react-query v5; ignored by v4 (cast keeps both type-checking)
    ...({ initialPageParam: 1 } as object),
    queryFn: async (ctx) => {
      const page = Number((ctx as { pageParam?: number }).pageParam ?? 1);
      const url = new URL(`${FUNCTIONS_BASE}/reloadly-products`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("size", String(size));
      if (params.countryCode) url.searchParams.set("countryCode", params.countryCode);
      if (params.categoryId) url.searchParams.set("categoryId", String(params.categoryId));
      const res = await fetch(url.toString(), { headers: await authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    getNextPageParam: (last: ProductsResponse, all: ProductsResponse[]) =>
      all.length < (last?.totalPages ?? 1) ? all.length + 1 : undefined,
  });
}
