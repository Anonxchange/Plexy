import { supabase } from "./supabase";

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

export const asterdexService = {
  // Get ticker data for a single symbol
  async getTicker(symbol: string): Promise<TickerData> {
    const { data, error } = await supabase.functions.invoke('asterdex', {
      body: { symbol, action: 'ticker' }
    });
    if (error) throw error;
    return data?.data || data;
  },

  // Get multiple tickers
  async getTickers(symbols: string[]): Promise<TickerData[]> {
    const { data, error } = await supabase.functions.invoke('asterdex', {
      body: { symbols, action: 'tickers' }
    });
    if (error) throw error;
    return data?.data || data;
  },

  // Get order book
  async getOrderBook(symbol: string, limit: number = 20): Promise<{ bids: Array<[string, string]>; asks: Array<[string, string]> }> {
    try {
      const { data, error } = await supabase.functions.invoke('asterdex', {
        body: { symbol, limit, action: 'orderbook' }
      });
      if (error) throw error;
      const orderBookData = data?.data || data;
      return {
        bids: orderBookData.bids || [],
        asks: orderBookData.asks || []
      };
    } catch (error) {
      console.error(`Failed to fetch order book for ${symbol}:`, error);
      return { bids: [], asks: [] };
    }
  },

  // Get recent trades
  async getRecentTrades(symbol: string, limit: number = 50): Promise<Array<{ id: number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean }>> {
    try {
      const { data, error } = await supabase.functions.invoke('asterdex', {
        body: { symbol, limit, action: 'trades' }
      });
      if (error) throw error;
      return data?.data || data;
    } catch (error) {
      console.error(`Failed to fetch trades for ${symbol}:`, error);
      return [];
    }
  },

  // Get klines (candlestick) data
  async getKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('asterdex', {
      body: { symbol, interval, limit, action: 'klines' }
    });
    if (error) throw error;
    return data?.data || data;
  },
};
