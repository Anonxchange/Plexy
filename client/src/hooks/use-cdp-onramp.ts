import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth-context';
import { useMutation } from '@tanstack/react-query';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export function useCdpOnramp() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      address: string;
      purchaseCurrency?: string;
      paymentAmount?: string;
      paymentCurrency?: string;
    }) => {
      const session = await supabase.auth.getSession();
      const access_token = session.data.session?.access_token;

      if (!access_token) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase.functions.invoke('cdp-create-session', {
        body: params,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to invoke function');
      }

      return data as { success: boolean; onrampUrl: string };
    },
  });
}
