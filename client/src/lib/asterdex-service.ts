import { supabase } from "./supabase";


// ==================== TYPES ====================

interface TickerData {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

interface TradeQuote {
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  price: number;
  priceImpact: number;
  fee: number;
  feeRate: number;
  expiresAt: number;
  minReceived: number;
  route: string[];
}

interface TradePair {
  symbol: string;
  name: string;
  baseSymbol: string;
  quoteSymbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  isActive: boolean;
}

interface OrderBook {
  bids: Array<[string, string]> | Array<{ price: number; amount: number; total: number }>;
  asks: Array<[string, string]> | Array<{ price: number; amount: number; total: number }>;
}

interface RecentTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
}

// ==================== HELPER ====================

async function invokeAsterdex<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('asterdex', { body });
  if (error) throw error;
  return data?.data ?? data;
}

// ==================== SERVICE ====================

export const asterdexService = {
  // Get ticker data for a single symbol (e.g. "BTCUSDT")
  async getTicker(symbol: string): Promise<TickerData> {
    return invokeAsterdex<TickerData>({ type: 'ticker', symbol });
  },

  // Get multiple tickers (optionally filter by symbols array)
  async getTickers(symbols?: string[]): Promise<TickerData[]> {
    return invokeAsterdex<TickerData[]>({ type: 'tickers', symbols });
  },

  // Get order book for a symbol
  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    try {
      return await invokeAsterdex<OrderBook>({ type: 'orderbook', symbol, limit });
    } catch (error) {
      console.error(`Failed to fetch order book for ${symbol}:`, error);
      return { bids: [], asks: [] };
    }
  },

  // Get recent trades for a symbol
  async getRecentTrades(symbol: string, limit: number = 50): Promise<RecentTrade[]> {
    try {
      return await invokeAsterdex<RecentTrade[]>({ type: 'trades', symbol, limit });
    } catch (error) {
      console.error(`Failed to fetch trades for ${symbol}:`, error);
      return [];
    }
  },

  // Get klines (candlestick) data
  async getKlines(symbol: string, interval: string = '1h', limit: number = 100): Promise<any[]> {
    return invokeAsterdex<any[]>({ type: 'klines', symbol, interval, limit });
  },

  // Get all supported trading pairs with current prices
  async getTradingPairs(): Promise<{ pairs: TradePair[]; pricesUpdatedAt: number }> {
    return invokeAsterdex<{ pairs: TradePair[]; pricesUpdatedAt: number }>({ type: 'pairs' });
  },

  // Get a swap quote (read-only, no execution)
  async getQuote(
    fromToken: string,
    toToken: string,
    amount: number,
    slippage: number = 0.005
  ): Promise<TradeQuote> {
    return invokeAsterdex<TradeQuote>({
      type: 'quote',
      fromToken,
      toToken,
      amount,
      slippage,
    });
  },
};

