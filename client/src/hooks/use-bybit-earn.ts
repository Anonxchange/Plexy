import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

async function callBybitEarn(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("bybit-earn", {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message);
  if (!data.success) throw new Error(data.error || "Unknown error");
  return data.data;
}

export function useEarnProducts(category?: string, coin?: string) {
  return useQuery({
    queryKey: ["bybit-earn-products", category, coin],
    queryFn: () => callBybitEarn("get_products", { category, coin }),
    staleTime: 60_000,
  });
}

export function useEarnPosition(coin?: string) {
  return useQuery({
    queryKey: ["bybit-earn-position", coin],
    queryFn: () => callBybitEarn("get_position", { coin }),
    staleTime: 30_000,
  });
}

export function useSubscribeEarn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { productId: string; amount: string }) =>
      callBybitEarn("subscribe", params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bybit-earn-products"] });
      qc.invalidateQueries({ queryKey: ["bybit-earn-position"] });
    },
  });
}

export function useRedeemEarn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { productId: string; amount: string }) =>
      callBybitEarn("redeem", params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bybit-earn-products"] });
      qc.invalidateQueries({ queryKey: ["bybit-earn-position"] });
    },
  });
}
