import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ReloadlyCountry {
  countryCode: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  flag: string;
}

export interface ReloadlyOperator {
  operatorId: number;
  name: string;
  bundle: boolean;
  data: boolean;
  pin: boolean;
  supportsLocalAmounts: boolean;
  denominationType: string;
  senderCurrencyCode: string;
  senderCurrencySymbol: string;
  destinationCurrencyCode: string;
  destinationCurrencySymbol: string;
  commission: number;
  internationalDiscount: number;
  localDiscount: number;
  mostPopularAmount: number;
  minAmount: number | null;
  maxAmount: number | null;
  localMinAmount: number | null;
  localMaxAmount: number | null;
  country: {
    countryCode: string;
    name: string;
  };
  fx: {
    rate: number;
    currencyCode: string;
  };
  logoUrls: string[];
  fixedAmounts: number[];
  fixedAmountsDescriptions: Record<string, string>;
  localFixedAmounts: number[];
  localFixedAmountsDescriptions: Record<string, string>;
  suggestedAmounts: number[];
  suggestedAmountsMap: Record<string, number>;
}

export interface TopupPayload {
  operatorId: number;
  amount: number;
  useLocalAmount?: boolean;
  recipientPhone: string;
  recipientCountryCode: string;
  senderPhone?: string;
  senderCountryCode?: string;
  customIdentifier?: string;
  operatorName?: string;
}

export function useAirtime(countryCode?: string) {
  // Fetch countries
  const countriesQuery = useQuery({
    queryKey: ["airtime-countries"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("reloadly-airtime", {
        method: "GET",
        queryParams: { action: "countries" },
      });
      if (error) throw error;
      return data as ReloadlyCountry[];
    },
  });

  // Fetch operators by country
  const operatorsQuery = useQuery({
    queryKey: ["airtime-operators", countryCode],
    queryFn: async () => {
      if (!countryCode) return [];
      const { data, error } = await supabase.functions.invoke("reloadly-airtime", {
        method: "GET",
        queryParams: { action: "operators", countryCode },
      });
      if (error) throw error;
      return data as ReloadlyOperator[];
    },
    enabled: !!countryCode,
  });

  // Auto-detect operator by phone
  const detectOperator = useMutation({
    mutationFn: async ({ phone, countryCode }: { phone: string; countryCode: string }) => {
      const { data, error } = await supabase.functions.invoke("reloadly-airtime", {
        method: "GET",
        queryParams: { action: "operators", phone, countryCode },
      });
      if (error) throw error;
      return data as ReloadlyOperator;
    },
  });

  // Get FX Rate
  const getFxRate = useMutation({
    mutationFn: async ({ operatorId, amount }: { operatorId: number; amount: number }) => {
      const { data, error } = await supabase.functions.invoke("reloadly-airtime", {
        method: "GET",
        queryParams: { action: "fx-rate", operatorId: String(operatorId), amount: String(amount) },
      });
      if (error) throw error;
      return data;
    },
  });

  // Process Top-up
  const topupMutation = useMutation({
    mutationFn: async (payload: TopupPayload) => {
      const { data, error } = await supabase.functions.invoke("reloadly-topup", {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
  });

  
    return {
      countries: countriesQuery.data || [],
      isLoadingCountries: countriesQuery.isLoading,
      countriesError: countriesQuery.error,
      operators: operatorsQuery.data || [],
      isLoadingOperators: operatorsQuery.isLoading,
      operatorsError: operatorsQuery.error,
      detectOperator,
      getFxRate,
      processTopup: topupMutation,
      getOperators: operatorsQuery
    };
}
