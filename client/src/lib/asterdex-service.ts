const BASE_URL = 'https://fapi.asterdex.com';

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

// Make public request
async function publicRequest<T>(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<T> {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString 
    ? `${BASE_URL}${endpoint}?${queryString}`
    : `${BASE_URL}${endpoint}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Asterdex API error: ${response.status}`);
  }

  return response.json();
}

export const asterdexService = {
  // Get ticker data for a single symbol
  async getTicker(symbol: string): Promise<TickerData> {
    return publicRequest(`/fapi/v1/ticker/24hr`, { symbol });
  },

  // Get multiple tickers - fetch them individually
  async getTickers(symbols: string[]): Promise<TickerData[]> {
    const results = await Promise.all(
      symbols.map(symbol => 
        publicRequest<TickerData>('/fapi/v1/ticker/24hr', { symbol })
          .catch(error => {
            console.warn(`Failed to fetch ticker for ${symbol}:`, error);
            return null;
          })
      )
    );
    return results.filter((ticker): ticker is TickerData => ticker !== null);
  },

  // Get order book
  async getOrderBook(symbol: string, limit: number = 20): Promise<{ bids: Array<[string, string]>; asks: Array<[string, string]> }> {
    try {
      const data = await publicRequest('/fapi/v1/depth', { symbol, limit });
      return {
        bids: data.bids || [],
        asks: data.asks || []
      };
    } catch (error) {
      console.error(`Failed to fetch order book for ${symbol}:`, error);
      return { bids: [], asks: [] };
    }
  },

  // Get recent trades
  async getRecentTrades(symbol: string, limit: number = 50): Promise<Array<{ id: number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean }>> {
    try {
      return await publicRequest('/fapi/v1/trades', { symbol, limit });
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
    return publicRequest('/fapi/v1/klines', { symbol, interval, limit });
  },
};
