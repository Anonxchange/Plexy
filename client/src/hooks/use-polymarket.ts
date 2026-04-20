import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

async function polymarketRequest(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('polymarket', {
    body: { action, params },
  });
  if (error) throw new Error(error.message);
  return data;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  conditionId: string;
  slug: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  clobTokenIds: string;
  outcomePrices: string;
  outcomes: string;
  volume: string;
  volumeNum: number;
  liquidity: string;
  liquidityNum: number;
  endDate: string;
  startDate: string;
  tags: string[];
  bestBid: number;
  bestAsk: number;
  lastTradePrice: number;
}

export interface PricePoint {
  t: number;
  p: number;
}

export function useMarkets(params?: { limit?: number; offset?: number; tag?: string; closed?: string }) {
  return useQuery({
    queryKey: ['polymarket', 'markets', params],
    queryFn: () => polymarketRequest('getMarkets', params || {}),
    staleTime: 30000,
  });
}

export function useEvents(params?: { limit?: number; offset?: number; tag?: string }) {
  return useQuery({
    queryKey: ['polymarket', 'events', params],
    queryFn: () => polymarketRequest('getEvents', params || {}),
    staleTime: 30000,
  });
}

export function useMarketDetail(conditionId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'market', conditionId],
    queryFn: () => polymarketRequest('getMarket', { conditionId }),
    enabled: !!conditionId,
  });
}

export function useOrderbook(tokenId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'orderbook', tokenId],
    queryFn: () => polymarketRequest('getOrderbook', { tokenId }),
    enabled: !!tokenId,
    refetchInterval: 10000,
  });
}

export function usePriceHistory(tokenId: string | undefined, interval: string) {
  return useQuery({
    queryKey: ['polymarket', 'priceHistory', tokenId, interval],
    queryFn: () => polymarketRequest('getPriceHistory', { tokenId, interval }),
    enabled: !!tokenId,
    staleTime: 60000,
  });
}

export function useBalance() {
  return useQuery({
    queryKey: ['polymarket', 'balance'],
    queryFn: () => polymarketRequest('getBalance'),
    staleTime: 15000,
    retry: false,
  });
}

export function useOpenOrders() {
  return useQuery({
    queryKey: ['polymarket', 'openOrders'],
    queryFn: () => polymarketRequest('getOpenOrders'),
    refetchInterval: 15000,
    retry: false,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Record<string, unknown>) =>
      polymarketRequest('postOrder', { order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'openOrders'] });
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'balance'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      polymarketRequest('cancelOrder', { orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'openOrders'] });
    },
  });
}
