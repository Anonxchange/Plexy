import { useCallback, useState } from 'react';

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
  const [moonPayUrl, setMoonPayUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
      // Use public API key (pk_test_ or pk_live_) not secret key (sk_test_)
      const apiKey = MOONPAY_API_KEY || '';
      
      // Get the current URL properly for redirect
      let redirectURL = window.location.origin;
      try {
        // For Replit environment, use the proper domain
        if (window.location.hostname.includes('replit.dev')) {
          redirectURL = window.location.origin;
        }
      } catch (e) {
        console.warn('Could not determine redirect URL:', e);
      }

      const params = new URLSearchParams({
        apiKey,
        baseCurrencyCode: config.baseCurrencyCode || 'usd',
        ...(config.baseCurrencyAmount && { baseCurrencyAmount: config.baseCurrencyAmount.toString() }),
        defaultCurrencyCode: config.defaultCurrencyCode || 'usdt',
        ...(config.amount && { amount: config.amount.toString() }),
        ...(config.email && { email: config.email }),
        ...(config.walletAddress && { walletAddress: config.walletAddress }),
        redirectURL,
      });

      let url = `https://buy.moonpay.com?${params.toString()}`;

      try {
        const signature = await generateSignature(url);
        url += `&signature=${encodeURIComponent(signature)}`;
      } catch (error) {
        console.warn('Proceeding without signature:', error);
      }

      console.log('MoonPay URL:', url);
      return url;
    },
    [MOONPAY_API_KEY, generateSignature]
  );

  const openMoonPay = useCallback(
    async (config: MoonPayConfig): Promise<void> => {
      try {
        const url = await buildMoonPayUrl(config);
        setMoonPayUrl(url);
        setIsOpen(true);
        console.log('MoonPay modal opened successfully');
      } catch (error) {
        console.error('Error opening MoonPay:', error);
        throw error;
      }
    },
    [buildMoonPayUrl]
  );

  const closeMoonPay = useCallback(() => {
    setIsOpen(false);
    setMoonPayUrl(null);
  }, []);

  return {
    openMoonPay,
    closeMoonPay,
    moonPayUrl,
    isOpen,
    setIsOpen,
    buildMoonPayUrl,
    generateSignature,
  };
};
