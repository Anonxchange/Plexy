import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
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
  productName?: string;
  size?: number;
  enabled?: boolean;
}) {
  const size = params.size ?? 100;

  return useInfiniteQuery<ProductsResponse, Error, InfiniteData<ProductsResponse>, readonly unknown[], number>({
    queryKey: ["gift-card-catalog", params.countryCode, params.categoryId, params.productName, size],
    enabled: params.enabled ?? true,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const url = new URL(`${FUNCTIONS_BASE}/reloadly-products`);
      url.searchParams.set("page", String(pageParam));
      url.searchParams.set("size", String(size));
      if (params.countryCode) url.searchParams.set("countryCode", params.countryCode);
      if (params.categoryId) url.searchParams.set("categoryId", String(params.categoryId));
      if (params.productName) url.searchParams.set("productName", params.productName);
      const res = await fetch(url.toString(), { headers: await authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch products");
      return (await res.json()) as ProductsResponse;
    },
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < (lastPage?.totalPages ?? 1) ? allPages.length + 1 : undefined,
  });
}
