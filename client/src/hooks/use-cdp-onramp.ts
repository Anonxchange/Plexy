import { createCDPSession } from '@/lib/wallet-api';
import { useAuth } from '@/lib/auth-context';
import { useMutation } from '@tanstack/react-query';

export function useCdpOnramp() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      address: string;
      purchaseCurrency?: string;
      paymentAmount?: string;
      paymentCurrency?: string;
    }) => {
      const result = await createCDPSession(
        params.address, 
        params.purchaseCurrency ? [params.purchaseCurrency] : [],
        params.paymentAmount,
        params.paymentCurrency
      );
      
      // result could be the URL directly or a token
      const onrampUrl = typeof result === 'string' && result.startsWith('http') 
        ? result 
        : null;

      return { success: true, onrampUrl, sessionToken: !onrampUrl ? result : null };
    },
  });
}
