import { useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { devLog } from '@/lib/dev-logger';

export interface ShippingRate {
  logisticName: string;
  logisticAftName?: string;
  logisticPrice: number;
  logisticPriceCur?: string;
  minDeliveryTime?: number;
  maxDeliveryTime?: number;
}

export interface CalculateRatesInput {
  endCountryCode: string;
  endProvinceCode?: string;
  endCityCode?: string;
  products: Array<{ vid: string; quantity: number }>;
}

export function useShippingRates() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: CalculateRatesInput) => {
    if (!input.products.length) {
      setRates([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      devLog.info('[ShippingRates] Calling cj-freight with', input);
      const supabase = await getSupabase();
      const { data, error: fnError } = await supabase.functions.invoke('cj-freight', {
        body: input,
      });
      devLog.info('[ShippingRates] cj-freight raw response', { data, fnError });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const list: ShippingRate[] = data?.data || [];
      devLog.info('[ShippingRates] Parsed rates', list);
      list.sort((a, b) => a.logisticPrice - b.logisticPrice);
      setRates(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch shipping rates';
      devLog.error('[ShippingRates] Error:', err);
      setError(msg);
      setRates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRates([]);
    setError(null);
  }, []);

  return { rates, isLoading, error, calculate, reset };
}
