import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ReloadlyProduct {
  productId: number;
  productName: string;
  brand: { brandId: number; brandName: string };
  country: { isoName: string; name: string; flagUrl: string };
  category: { id: number; name: string };
  recipientCurrencyCode: string;
  senderCurrencyCode: string;
  denominationType: string;
  fixedRecipientDenominations: number[];
  minRecipientDenomination: number;
  maxRecipientDenomination: number;
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

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-products`
      );
      Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));

      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
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
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-products?productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      // If it's a single product request, it might return the object directly or in an array
      return Array.isArray(data) ? data[0] : data;
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
