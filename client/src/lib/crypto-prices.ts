export interface CryptoPrice {
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

export interface ExchangeRates {
  [key: string]: number;
}

// Cache for crypto prices
let cryptoPricesCache: Record<string, CryptoPrice> | null = null;
let lastPricesFetchTime = 0;
const PRICES_CACHE_DURATION = 30000; // 30 seconds

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  SOL: 'solana',
  TON: 'the-open-network',
  XMR: 'monero',
  BNB: 'binancecoin',
  TRX: 'tron',
  LTC: 'litecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  NEAR: 'near',
  FTM: 'fantom',
  ALGO: 'algorand',
  VET: 'vechain'
};

export async function getCryptoPrices(symbols: string[]): Promise<Record<string, CryptoPrice>> {
  const now = Date.now();
  
  // Return cached prices if still valid and contains all requested symbols
  if (cryptoPricesCache && (now - lastPricesFetchTime) < PRICES_CACHE_DURATION) {
    const hasAllSymbols = symbols.every(s => cryptoPricesCache![s]);
    if (hasAllSymbols) {
      return cryptoPricesCache;
    }
  }
  
  const ids = symbols.map(s => COINGECKO_IDS[s]).filter(Boolean).join(',');
  
  if (!ids) {
    return {};
  }
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`
    );
    
    if (!response.ok) {
      // If rate limited or error, return cached data if available
      if (cryptoPricesCache) {
        console.warn('Using cached crypto prices due to API error');
        return cryptoPricesCache;
      }
      throw new Error('Failed to fetch crypto prices');
    }
    
    const data = await response.json();
    
    const pricesMap: Record<string, CryptoPrice> = {};
    
    data.forEach((coin: any) => {
      const symbol = Object.keys(COINGECKO_IDS).find(
        key => COINGECKO_IDS[key] === coin.id
      );
      
      if (symbol) {
        pricesMap[symbol] = {
          symbol,
          name: coin.name,
          current_price: coin.current_price,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          market_cap: coin.market_cap,
          total_volume: coin.total_volume
        };
      }
    });
    
    cryptoPricesCache = pricesMap;
    lastPricesFetchTime = now;
    
    return pricesMap;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    // Return cached data if available, otherwise empty object
    return cryptoPricesCache || {};
  }
}

export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  } else if (price >= 1) {
    return price.toFixed(2);
  } else {
    return price.toFixed(4);
  }
}

// Cache for exchange rates
let exchangeRatesCache: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (exchangeRatesCache && (now - lastFetchTime) < CACHE_DURATION) {
    return exchangeRatesCache;
  }
  
  try {
    // Using exchangerate-api.com free tier (no API key needed)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    exchangeRatesCache = data.rates;
    lastFetchTime = now;
    
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return fallback rates if API fails
    return {
      USD: 1,
      NGN: 1470,
      EUR: 0.92,
      GBP: 0.79,
      GHS: 15.50,
      KES: 129.50,
      ZAR: 18.50,
    };
  }
}

export async function convertCurrency(usdAmount: number, toCurrency: string): Promise<number> {
  const rates = await getExchangeRates();
  const rate = rates[toCurrency] || 1;
  return usdAmount * rate;
}

// Legacy function for backward compatibility
export function convertToNGN(usdAmount: number, usdToNgnRate: number = 1470): number {
  return usdAmount * usdToNgnRate;
}

// Convert NGN amount to another currency
export async function convertFromNGN(ngnAmount: number, toCurrency: string): Promise<number> {
  if (toCurrency === 'NGN') {
    return ngnAmount;
  }
  
  const rates = await getExchangeRates();
  const ngnRate = rates['NGN'];
  const targetRate = rates[toCurrency];
  
  if (!ngnRate || ngnRate === 0) {
    throw new Error('NGN exchange rate not available');
  }
  
  if (!targetRate || targetRate === 0) {
    throw new Error(`Exchange rate for ${toCurrency} not available`);
  }
  
  const usdAmount = ngnAmount / ngnRate;
  return usdAmount * targetRate;
}

// Get minimum and maximum offer limits in the specified currency
export async function getOfferLimits(currency: string): Promise<{ min: number; max: number }> {
  const MIN_NGN = 4500;
  const MAX_NGN = 23000000;
  
  if (currency === 'NGN') {
    return { min: MIN_NGN, max: MAX_NGN };
  }
  
  try {
    const min = await convertFromNGN(MIN_NGN, currency);
    const max = await convertFromNGN(MAX_NGN, currency);
    
    return { 
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100
    };
  } catch (error) {
    throw new Error(`Cannot calculate limits for currency ${currency}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface HistoricalPrice {
  timestamp: number;
  price: number;
  date: string;
}

export async function getHistoricalPrices(
  symbol: string, 
  days: number = 30
): Promise<HistoricalPrice[]> {
  const coinId = COINGECKO_IDS[symbol];
  
  if (!coinId) {
    console.error(`No CoinGecko ID found for ${symbol}`);
    return [];
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch historical prices');
    }

    const data = await response.json();
    
    return data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
      date: new Date(timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return [];
  }
}

export async function getIntradayPrices(symbol: string): Promise<HistoricalPrice[]> {
  const coinId = COINGECKO_IDS[symbol];
  
  if (!coinId) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch intraday prices');
    }

    const data = await response.json();
    
    return data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
      date: new Date(timestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit'
      })
    }));
  } catch (error) {
    console.error('Error fetching intraday prices:', error);
    return [];
  }
}
