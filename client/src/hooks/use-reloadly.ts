import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  hasGiftCardDenominationRange,
} from "@/lib/gift-card-denominations";

export interface ReloadlyProduct {
  productId: number;
  productName: string;
  brand: { brandId: number; brandName: string };
  country: { isoName: string; name: string; flagUrl: string };
  category: { id: number; name: string };
  recipientCurrencyCode: string;
  senderCurrencyCode: string;
  denominationType: string;
  fixedRecipientDenominations: number[] | null;
  minRecipientDenomination: number | null;
  maxRecipientDenomination: number | null;
  senderFee: number;
  senderFeePercentage: number;
  discountPercentage: number;
  logoUrls: string[];
  redeemInstruction: { concise: string; verbose: string };
}

export interface ProductsResponse {
  content: ReloadlyProduct[];
  totalElements: number;
  totalPages: number;
  pageable: { pageNumber: number; pageSize: number };
}

export function useGiftCardProducts(params: {
  page?: number;
  size?: number;
  countryCode?: string;
  productName?: string;
  categoryId?: number;
}) {
  return useQuery<ProductsResponse>({
    queryKey: ["gift-card-products", params],
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        page: String(params.page || 1),
        size: String(params.size || 20),
      };
      if (params.countryCode) queryParams.countryCode = params.countryCode;
      if (params.productName) queryParams.productName = params.productName;
      if (params.categoryId) queryParams.categoryId = String(params.categoryId);

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-products`
      );
      Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });
}

export function useGiftCardProduct(productId: string | undefined) {
  return useQuery<ReloadlyProduct>({
    queryKey: ["gift-card-product", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers = {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      };

      const extractProduct = (data: any): ReloadlyProduct | undefined => {
        if (!data) return undefined;
        if (Array.isArray(data)) {
          return data.find((p) => String(p.productId) === String(productId));
        }
        if (Array.isArray(data.content)) {
          return data.content.find((p: ReloadlyProduct) => String(p.productId) === String(productId));
        }
        if (String(data.productId) === String(productId)) return data as ReloadlyProduct;
        return undefined;
      };

      let directProduct: ReloadlyProduct | undefined;

      // 1. Try the direct productId query first (fast path, works if the
      //    edge function supports filtering a single product).
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-products?productId=${productId}`,
          { headers }
        );
        if (res.ok) {
          directProduct = extractProduct(await res.json());
          if (directProduct && hasGiftCardDenominationRange(directProduct)) {
            return directProduct;
          }
        }
      } catch { /* fall through to list search */ }

      // 2. Fall back to scanning the full product list for this productId,
      //    since some deployments of the edge function only support listing
      //    products and don't support filtering by a single productId.
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-products`);
      url.searchParams.set("page", "1");
      url.searchParams.set("size", "200");
      const listRes = await fetch(url.toString(), { headers });
      if (!listRes.ok) throw new Error("Failed to fetch product");
      const listData: ProductsResponse = await listRes.json();
      const product = (listData.content ?? []).find((p) => String(p.productId) === String(productId));
      if (product) return product;
      if (directProduct) return directProduct;
      throw new Error("Failed to fetch product");
    },
  });
}

interface OrderParams {
  productId: number;
  unitPrice: number;
  quantity?: number;
  recipientEmail?: string;
  recipientPhone?: string;
}

export function useCreateGiftCardOrder() {
  return useMutation({
    mutationFn: async (params: OrderParams) => {
      const { data, error } = await supabase.functions.invoke("reloadly-order", {
        body: params,
      });

      if (error) throw error;
      return data;
    },
  });
}

export interface ReloadlyCategory {
  id: number;
  name: string;
}

export interface ReloadlyCountry {
  isoName: string;
  name: string;
  flag: string;
}

function isoToFlag(iso: string): string {
  return iso.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

export function useGiftCardCountries() {
  return useQuery<ReloadlyCountry[]>({
    queryKey: ["gift-card-countries"],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers = {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      };

      // 1. Try the dedicated countries edge function first
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-countries`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data
              .filter((c: any) => c.isoName && c.name)
              .map((c: any) => ({
                isoName: c.isoName as string,
                name: c.name as string,
                flag: isoToFlag(c.isoName),
              }))
              .sort((a, b) => a.name.localeCompare(b.name));
          }
        }
      } catch { /* fall through */ }

      // 2. Derive real countries from a large product fetch
      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-products`
      );
      url.searchParams.set("page", "1");
      url.searchParams.set("size", "200");

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error("Failed to fetch products for countries");
      const data: ProductsResponse = await res.json();

      const seen = new Map<string, string>();
      for (const p of data.content ?? []) {
        const iso = p.country?.isoName;
        const name = p.country?.name;
        if (iso && name && !seen.has(iso)) seen.set(iso, name);
      }

      return Array.from(seen.entries())
        .map(([isoName, name]) => ({ isoName, name, flag: isoToFlag(isoName) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

export function useGiftCardCategories() {
  return useQuery<ReloadlyCategory[]>({
    queryKey: ["gift-card-categories"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers = {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      };

      // 1. Try the dedicated categories edge function first
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-categories`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch { /* fall through */ }

      // 2. Derive categories from a large product fetch
      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-products`
      );
      url.searchParams.set("page", "1");
      url.searchParams.set("size", "200");

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error("Failed to fetch products for categories");
      const data: ProductsResponse = await res.json();

      const seen = new Map<number, string>();
      for (const p of data.content ?? []) {
        const id = p.category?.id;
        const name = p.category?.name;
        if (id && name && !seen.has(id)) seen.set(id, name);
      }

      return Array.from(seen.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}
