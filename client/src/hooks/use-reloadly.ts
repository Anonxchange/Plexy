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

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-products?productId=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
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

export interface ReloadlyCategory {
  id: number;
  name: string;
}

export interface ReloadlyCountry {
  isoName: string;
  name: string;
  flag: string;
}

const STATIC_RELOADLY_COUNTRIES: ReloadlyCountry[] = [
  { isoName: "US", name: "United States", flag: "🇺🇸" },
  { isoName: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { isoName: "CA", name: "Canada", flag: "🇨🇦" },
  { isoName: "AU", name: "Australia", flag: "🇦🇺" },
  { isoName: "DE", name: "Germany", flag: "🇩🇪" },
  { isoName: "FR", name: "France", flag: "🇫🇷" },
  { isoName: "ES", name: "Spain", flag: "🇪🇸" },
  { isoName: "IT", name: "Italy", flag: "🇮🇹" },
  { isoName: "NL", name: "Netherlands", flag: "🇳🇱" },
  { isoName: "BE", name: "Belgium", flag: "🇧🇪" },
  { isoName: "AT", name: "Austria", flag: "🇦🇹" },
  { isoName: "CH", name: "Switzerland", flag: "🇨🇭" },
  { isoName: "SE", name: "Sweden", flag: "🇸🇪" },
  { isoName: "NO", name: "Norway", flag: "🇳🇴" },
  { isoName: "DK", name: "Denmark", flag: "🇩🇰" },
  { isoName: "FI", name: "Finland", flag: "🇫🇮" },
  { isoName: "PT", name: "Portugal", flag: "🇵🇹" },
  { isoName: "PL", name: "Poland", flag: "🇵🇱" },
  { isoName: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { isoName: "HU", name: "Hungary", flag: "🇭🇺" },
  { isoName: "RO", name: "Romania", flag: "🇷🇴" },
  { isoName: "TR", name: "Turkey", flag: "🇹🇷" },
  { isoName: "UA", name: "Ukraine", flag: "🇺🇦" },
  { isoName: "RU", name: "Russia", flag: "🇷🇺" },
  { isoName: "IL", name: "Israel", flag: "🇮🇱" },
  { isoName: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { isoName: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { isoName: "QA", name: "Qatar", flag: "🇶🇦" },
  { isoName: "KW", name: "Kuwait", flag: "🇰🇼" },
  { isoName: "BH", name: "Bahrain", flag: "🇧🇭" },
  { isoName: "OM", name: "Oman", flag: "🇴🇲" },
  { isoName: "JO", name: "Jordan", flag: "🇯🇴" },
  { isoName: "EG", name: "Egypt", flag: "🇪🇬" },
  { isoName: "MA", name: "Morocco", flag: "🇲🇦" },
  { isoName: "NG", name: "Nigeria", flag: "🇳🇬" },
  { isoName: "KE", name: "Kenya", flag: "🇰🇪" },
  { isoName: "GH", name: "Ghana", flag: "🇬🇭" },
  { isoName: "ZA", name: "South Africa", flag: "🇿🇦" },
  { isoName: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { isoName: "UG", name: "Uganda", flag: "🇺🇬" },
  { isoName: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { isoName: "CM", name: "Cameroon", flag: "🇨🇲" },
  { isoName: "SN", name: "Senegal", flag: "🇸🇳" },
  { isoName: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { isoName: "RW", name: "Rwanda", flag: "🇷🇼" },
  { isoName: "ZM", name: "Zambia", flag: "🇿🇲" },
  { isoName: "IN", name: "India", flag: "🇮🇳" },
  { isoName: "PK", name: "Pakistan", flag: "🇵🇰" },
  { isoName: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { isoName: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { isoName: "PH", name: "Philippines", flag: "🇵🇭" },
  { isoName: "ID", name: "Indonesia", flag: "🇮🇩" },
  { isoName: "MY", name: "Malaysia", flag: "🇲🇾" },
  { isoName: "TH", name: "Thailand", flag: "🇹🇭" },
  { isoName: "VN", name: "Vietnam", flag: "🇻🇳" },
  { isoName: "SG", name: "Singapore", flag: "🇸🇬" },
  { isoName: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { isoName: "TW", name: "Taiwan", flag: "🇹🇼" },
  { isoName: "JP", name: "Japan", flag: "🇯🇵" },
  { isoName: "KR", name: "South Korea", flag: "🇰🇷" },
  { isoName: "CN", name: "China", flag: "🇨🇳" },
  { isoName: "MX", name: "Mexico", flag: "🇲🇽" },
  { isoName: "BR", name: "Brazil", flag: "🇧🇷" },
  { isoName: "AR", name: "Argentina", flag: "🇦🇷" },
  { isoName: "CL", name: "Chile", flag: "🇨🇱" },
  { isoName: "CO", name: "Colombia", flag: "🇨🇴" },
  { isoName: "PE", name: "Peru", flag: "🇵🇪" },
  { isoName: "EC", name: "Ecuador", flag: "🇪🇨" },
  { isoName: "GT", name: "Guatemala", flag: "🇬🇹" },
  { isoName: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { isoName: "NZ", name: "New Zealand", flag: "🇳🇿" },
];

export function useGiftCardCountries() {
  return useQuery<ReloadlyCountry[]>({
    queryKey: ["gift-card-countries"],
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-countries`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("edge function unavailable");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((c: any) => ({
            isoName: c.isoName,
            name: c.name,
            flag: STATIC_RELOADLY_COUNTRIES.find(s => s.isoName === c.isoName)?.flag ?? "🌍",
          }));
        }
        throw new Error("empty response");
      } catch {
        return STATIC_RELOADLY_COUNTRIES;
      }
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

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });
}
