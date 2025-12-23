import { useCallback } from 'react';

export interface MoonPayConfig {
  apiKey?: string;
  baseCurrencyCode?: string;
  baseCurrencyAmount?: number;
  defaultCurrencyCode?: string;
  amount?: number;
  email?: string;
  walletAddress?: string;
}

export const useMoonPay = () => {
  const MOONPAY_API_KEY = import.meta.env.VITE_MOONPAY_API_KEY || '';

  const generateSignature = useCallback(async (url: string): Promise<string> => {
    try {
      // Try Supabase Edge Function first
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && anonKey) {
        const response = await fetch(`${supabaseUrl}/functions/v1/moonpay-signature`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ url }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.signature;
        }
      }

      // Fallback to /api endpoint
      const apiResponse = await fetch('/api/moonpay/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to generate signature');
      }

      const data = await apiResponse.json();
      return data.signature;
    } catch (error) {
      console.error('Error generating MoonPay signature:', error);
      throw error;
    }
  }, []);

  const buildMoonPayUrl = useCallback(
    async (config: MoonPayConfig): Promise<string> => {
      const params = new URLSearchParams({
        apiKey: MOONPAY_API_KEY,
        baseCurrencyCode: config.baseCurrencyCode || 'usd',
        ...(config.baseCurrencyAmount && { baseCurrencyAmount: config.baseCurrencyAmount.toString() }),
        defaultCurrencyCode: config.defaultCurrencyCode || 'usdt',
        ...(config.amount && { amount: config.amount.toString() }),
        ...(config.email && { email: config.email }),
        ...(config.walletAddress && { walletAddress: config.walletAddress }),
        redirectURL: window.location.origin,
      });

      let url = `https://buy.moonpay.com?${params.toString()}`;

      try {
        const signature = await generateSignature(url);
        url += `&signature=${encodeURIComponent(signature)}`;
      } catch (error) {
        console.warn('Proceeding without signature:', error);
      }

      return url;
    },
    [MOONPAY_API_KEY, generateSignature]
  );

  const openMoonPay = useCallback(
    async (config: MoonPayConfig): Promise<void> => {
      try {
        const url = await buildMoonPayUrl(config);
        window.open(url, '_blank', 'width=500,height=700');
      } catch (error) {
        console.error('Error opening MoonPay:', error);
        throw error;
      }
    },
    [buildMoonPayUrl]
  );

  return {
    openMoonPay,
    buildMoonPayUrl,
    generateSignature,
  };
};
