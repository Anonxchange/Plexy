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
      const onrampUrl = await createCDPSession(
        params.address, 
        params.purchaseCurrency ? [params.purchaseCurrency] : [],
        params.paymentAmount,
        params.paymentCurrency
      );
      return { success: true, onrampUrl };
    },
  });
}
