import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

async function fetchAirtime(params: Record<string, string>) {
  const url = new URL(`${SUPABASE_URL}/functions/v1/reloadly-airtime`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch airtime data");
  return res.json();
}

export interface AirtimeCountry {
  isoName: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  flagUrl: string;
  callingCodes: string[];
}

export interface AirtimeOperator {
  id: number;
  operatorId: number;
  name: string;
  bundle: boolean;
  data: boolean;
  pin: boolean;
  supportsLocalAmounts: boolean;
  supportsGeographicalRechargePlans: boolean;
  denominationType: string;
  senderCurrencyCode: string;
  senderCurrencySymbol: string;
  destinationCurrencyCode: string;
  destinationCurrencySymbol: string;
  commission: number;
  internationalDiscount: number;
  localDiscount: number;
  mostPopularAmount: number | null;
  mostPopularLocalAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  localMinAmount: number | null;
  localMaxAmount: number | null;
  country: { isoName: string; name: string; flagUrl: string };
  fx: { rate: number; currencyCode: string };
  logoUrls: string[];
  fixedAmounts: number[];
  fixedAmountsDescriptions: Record<string, string>;
  localFixedAmounts: number[];
  localFixedAmountsDescriptions: Record<string, string>;
  suggestedAmounts: number[];
  suggestedAmountsMap: Record<string, string>;
  geographicalRechargePlans: unknown[];
}

export function useAirtimeCountries() {
  return useQuery<AirtimeCountry[]>({
    queryKey: ["airtime-countries"],
    queryFn: () => fetchAirtime({ action: "countries" }),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAirtimeOperators(countryCode: string | undefined) {
  return useQuery<AirtimeOperator[]>({
    queryKey: ["airtime-operators", countryCode],
    enabled: !!countryCode,
    queryFn: () => fetchAirtime({ action: "operators", countryCode: countryCode! }),
  });
}

export function useAutoDetectOperator(phone: string, countryCode: string) {
  return useQuery<AirtimeOperator>({
    queryKey: ["airtime-auto-detect", phone, countryCode],
    enabled: phone.length >= 6 && !!countryCode,
    queryFn: () => fetchAirtime({ action: "operators", phone, countryCode }),
    retry: false,
  });
}

export async function sendTopup(params: {
  operatorId: number;
  operatorName?: string;
  amount: number;
  useLocalAmount?: boolean;
  recipientPhone: string;
  recipientCountryCode: string;
  senderPhone?: string;
  senderCountryCode?: string;
}) {
  const { data, error } = await supabase.functions.invoke("reloadly-topup", {
    body: params,
  });
  if (error) throw error;
  return data;
}
