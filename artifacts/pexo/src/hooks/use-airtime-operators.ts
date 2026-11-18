import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";

export interface AirtimeOperator {
  id?: number;
  operatorId?: number;
  name: string;
  denominationType?: "RANGE" | "FIXED" | string;
  logoUrls?: string[];
  minAmount?: number | null;
  maxAmount?: number | null;
  localMinAmount?: number | null;
  localMaxAmount?: number | null;
  fixedAmounts?: number[] | null;
  localFixedAmounts?: number[] | null;
  supportsLocalAmounts?: boolean;
  senderCurrencyCode?: string;
  destinationCurrencyCode?: string;
}

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function authHeaders(): Promise<Record<string, string>> {
  const client = await getSupabase();
  const {
    data: { session },
  } = await client.auth.getSession();
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
}

/** Airtime operators for a country, via the `reloadly-operators` edge function. */
export function useAirtimeOperators(countryCode: string | undefined, enabled = true) {
  return useQuery<AirtimeOperator[]>({
    queryKey: ["airtime-operators", countryCode],
    enabled: enabled && !!countryCode,
    staleTime: 1000 * 60 * 30,
    retry: false,
    queryFn: async () => {
      const res = await fetch(
        `${FUNCTIONS_BASE}/reloadly-operators?countryCode=${encodeURIComponent(String(countryCode))}`,
        { headers: await authHeaders() },
      );
      if (!res.ok) throw new Error("Failed to fetch airtime operators");
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
  });
}
