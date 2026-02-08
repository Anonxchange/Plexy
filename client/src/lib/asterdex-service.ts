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

// ---- Non-Custodial Order Types ----

export interface BuildTransactionRequest {
  symbol: string;           // e.g. "SOLUSDT"
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType?: 'MARKET' | 'LIMIT';
  price?: number;           // required for LIMIT
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  walletAddress: string;    // user's wallet address for signing
}

export interface BuildTransactionResponse {
  /** The order parameters that were built */
  orderParams: Record<string, string | number>;
  /** Deterministic string to sign with ECDSA */
  messageToSign: string;
  /** Current market price for user validation */
  marketPrice: number | null;
  /** AsterDEX endpoint to submit the signed order */
  submitEndpoint: string;
  /** HTTP method for submission */
  submitMethod: string;
  timestamp: number;
}

// ==================== HELPER ====================

async function invokeAsterdex<T>(body: Record<string, unknown>): Promise<T> {
  console.log(`[AsterDEX] Invoking action: ${body.action}`, body);
  const { data, error } = await supabase.functions.invoke('asterdex', { body });
  if (error) {
    console.error(`[AsterDEX] Edge function error for ${body.action}:`, error);
    throw error;
  }
  const result = data?.data ?? data;
  console.log(`[AsterDEX] Response for ${body.action}:`, result);
  return result;
}

// ==================== SERVICE ====================

export const asterdexService = {
  // Get ticker data for a single symbol (e.g. "BTCUSDT")
  async getTicker(symbol: string): Promise<TickerData> {
    const formattedSymbol = symbol.includes("USDT") ? symbol : `${symbol}USDT`;
    return invokeAsterdex<TickerData>({ 
      action: 'ticker', 
      symbol: formattedSymbol
    });
  },

  // Get multiple tickers (optionally filter by symbols array)
  async getTickers(symbols?: string[]): Promise<TickerData[]> {
    const formattedSymbols = symbols?.map(s => s.includes("USDT") ? s : `${s}USDT`);
    return invokeAsterdex<TickerData[]>({ 
      action: 'tickers', 
      symbols: formattedSymbols
    });
  },

  // Get order book for a symbol
  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    try {
      const formattedSymbol = symbol.includes("USDT") ? symbol : `${symbol}USDT`;
      const result = await invokeAsterdex<any>({ 
        action: 'orderbook', 
        symbol: formattedSymbol,
        limit 
      });
      return result?.data ?? result ?? { bids: [], asks: [] };
    } catch (error) {
      console.error(`Failed to fetch order book for ${symbol}:`, error);
      return { bids: [], asks: [] };
    }
  },

  // Get recent trades for a symbol
  async getRecentTrades(symbol: string, limit: number = 50): Promise<RecentTrade[]> {
    try {
      const formattedSymbol = symbol.includes("USDT") ? symbol : `${symbol}USDT`;
      const result = await invokeAsterdex<any>({ 
        action: 'trades', 
        symbol: formattedSymbol,
        limit 
      });
      // Handle the case where the function might expect 'fromSymbol' or 'toSymbol' for trades too
      // or if it needs the base symbol specifically
      const data = result?.data ?? result ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Failed to fetch trades for ${symbol}:`, error);
      return [];
    }
  },

  // Get klines (candlestick) data
  async getKlines(symbol: string, interval: string = '1h', limit: number = 100): Promise<any[]> {
    const formattedSymbol = symbol.includes("USDT") ? symbol : `${symbol}USDT`;
    return invokeAsterdex<any[]>({ 
      action: 'klines', 
      symbol: formattedSymbol,
      interval, 
      limit 
    });
  },

  // Get all supported trading pairs with current prices
  async getTradingPairs(): Promise<{ pairs: TradePair[]; pricesUpdatedAt: number }> {
    return invokeAsterdex<{ pairs: TradePair[]; pricesUpdatedAt: number }>({ 
      action: 'pairs' 
    });
  },

  // Get a swap quote (read-only, no execution)
  async getQuote(
    fromToken: string,
    toToken: string,
    amount: number,
    slippage: number = 0.005
  ): Promise<TradeQuote> {
    console.log(`[AsterDEX] Requesting quote: ${fromToken} -> ${toToken}, amount: ${amount}`);
    try {
      // Ensure symbols are formatted correctly for the Edge Function
      const fromSymbol = fromToken.includes("USDT") || fromToken === "USDT" ? fromToken : `${fromToken}USDT`;
      const toSymbol = toToken.includes("USDT") || toToken === "USDT" ? toToken : `${toToken}USDT`;

      const result = await invokeAsterdex<any>({
        action: 'quote',
        fromSymbol: fromSymbol,
        toSymbol: toSymbol,
        amount,
        tradeType: 'spot', // Ensure spot trade type
        slippage,
      });
      // Handle various response structures from Supabase Functions
      const quote = result?.data ?? result;
      console.log(`[AsterDEX] Quote response:`, quote);
      
      // Ensure it matches the expected TradeQuote interface
      if (quote && typeof quote === 'object') {
        return {
          fromSymbol: quote.fromSymbol || fromToken,
          toSymbol: quote.toSymbol || toToken,
          fromAmount: Number(quote.fromAmount) || amount,
          toAmount: Number(quote.toAmount) || 0,
          price: Number(quote.price) || 0,
          priceImpact: Number(quote.priceImpact) || 0,
          fee: Number(quote.fee) || 0,
          feeRate: Number(quote.feeRate) || 0,
          expiresAt: Number(quote.expiresAt) || Date.now() + 60000,
          minReceived: Number(quote.minReceived) || 0,
          route: quote.route || [fromToken, toToken],
        };
      }
      throw new Error("Invalid quote response format");
    } catch (error) {
      console.error(`[AsterDEX] Quote error for ${fromToken}->${toToken}:`, error);
      throw error;
    }
  },
  // ---- Non-Custodial Trade Flow ----
  // Step 1: Backend validates price + builds unsigned order payload
  // Step 2: Frontend signs messageToSign with user's ECDSA key
  // Step 3: Frontend submits { ...orderParams, signature } to submitEndpoint

  async buildTransaction(request: BuildTransactionRequest): Promise<BuildTransactionResponse> {
    const formattedSymbol = request.symbol.includes("USDT") ? request.symbol : `${request.symbol}USDT`;
    return invokeAsterdex<BuildTransactionResponse>({
      action: 'build-transaction',
      symbol: formattedSymbol,
      side: request.side,
      quantity: request.quantity,
      orderType: request.orderType || 'MARKET',
      price: request.price,
      timeInForce: request.timeInForce,
      walletAddress: request.walletAddress,
    });
  },

  // Step 3 helper: Submit the signed order directly to AsterDEX
  async submitSignedOrder(
    submitEndpoint: string,
    orderParams: Record<string, string | number>,
    signature: string
  ): Promise<unknown> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(orderParams)) {
      params.append(key, String(value));
    }
    params.append('signature', signature);

    const response = await fetch(`${submitEndpoint}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Order submission failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  },
};
