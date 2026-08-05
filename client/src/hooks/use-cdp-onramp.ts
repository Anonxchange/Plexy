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
      /** One of: CARD | ACH_BANK_ACCOUNT | APPLE_PAY | FIAT_WALLET */
      paymentMethod?: string;
    }) => {
      const { onrampUrl, sessionToken } = await createCDPSession(
        params.address,
        params.purchaseCurrency ? [params.purchaseCurrency] : [],
        params.paymentAmount,
        params.paymentCurrency,
        { paymentMethod: params.paymentMethod },
      );
      return { success: true, onrampUrl, sessionToken };
    },
  });
}
