import { supabase } from "./supabase";

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
const PRICES_CACHE_DURATION = 30000; // 30 seconds for general use

// Real-time price cache (3 seconds like Bybit)
let realtimePricesCache: Record<string, CryptoPrice> | null = null;
let lastRealtimeFetchTime = 0;
const REALTIME_CACHE_DURATION = 3000; // 3 seconds for real-time pricing

export interface HistoricalPrice {
  timestamp: number;
  price: number;
  date: string;
}

// Generate fallback prices if API is unavailable
function generateFallbackPrices(symbols: string[]): Record<string, CryptoPrice> {
  const fallbackPrices: Record<string, number> = {
    BTC: 95000,
    ETH: 3500,
    USDT: 1,
    USDC: 1,
    SOL: 200,
    BNB: 600,
    TRX: 0.2,
    LTC: 80,
    XRP: 1.5,
    ADA: 0.8,
    DOGE: 0.35,
    AVAX: 40,
    MATIC: 0.85,
    DOT: 7,
    LINK: 15,
    UNI: 12,
    ATOM: 10,
    APT: 12,
    ARB: 1.2,
    OP: 2.5,
    NEAR: 6,
    FTM: 1.2,
    ALGO: 0.4,
    VET: 0.05
  };
  
  const pricesMap: Record<string, CryptoPrice> = {};
  
  symbols.forEach(symbol => {
    if (fallbackPrices[symbol]) {
      pricesMap[symbol] = {
        symbol,
        name: symbol,
        current_price: fallbackPrices[symbol],
        price_change_percentage_24h: 0,
        market_cap: 0,
        total_volume: 0
      };
    }
  });
  
  return pricesMap;
}

// Add React Query support for prices
import { useQuery } from '@tanstack/react-query';

export function useCryptoPrices(symbols: string[]) {
  return useQuery({
    queryKey: ['crypto-prices', symbols.sort()],
    queryFn: () => getCryptoPrices(symbols),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

export function useRealtimeCryptoPrices(symbols: string[]) {
  return useQuery({
    queryKey: ['realtime-prices', symbols.sort()],
    queryFn: () => getRealtimeCryptoPrices(symbols),
    staleTime: 3000, // 3 seconds
    refetchInterval: 5000, // 5 seconds
  });
}

export async function getCryptoPrices(symbols: string[]): Promise<Record<string, CryptoPrice>> {
  const now = Date.now();
  
  if (cryptoPricesCache && (now - lastPricesFetchTime) < PRICES_CACHE_DURATION) {
    const hasAllSymbols = symbols.every(s => cryptoPricesCache![s]);
    if (hasAllSymbols) {
      return cryptoPricesCache;
    }
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('crypto-prices', {
      body: { symbols, type: 'markets' }
    });
    
    if (error) throw error;
    
    const pricesMap = (data?.data || data) as Record<string, CryptoPrice>;
    cryptoPricesCache = pricesMap;
    lastPricesFetchTime = now;
    
    return pricesMap;
  } catch (error) {
    console.error('Error fetching crypto prices from Supabase:', error);
    return cryptoPricesCache || generateFallbackPrices(symbols);
  }
}

export async function getRealtimeCryptoPrices(symbols: string[]): Promise<Record<string, CryptoPrice>> {
  const now = Date.now();
  
  if (realtimePricesCache && (now - lastRealtimeFetchTime) < REALTIME_CACHE_DURATION) {
    const hasAllSymbols = symbols.every(s => realtimePricesCache![s]);
    if (hasAllSymbols) {
      return realtimePricesCache;
    }
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('crypto-prices', {
      body: { symbols, type: 'simple' }
    });
    
    if (error) throw error;
    
    const pricesMap = (data?.data || data) as Record<string, CryptoPrice>;
    realtimePricesCache = pricesMap;
    lastRealtimeFetchTime = now;
    
    return pricesMap;
  } catch (error) {
    console.error('Error fetching realtime crypto prices from Supabase:', error);
    return realtimePricesCache || cryptoPricesCache || generateFallbackPrices(symbols);
  }
}

export async function getHistoricalPrices(symbol: string, days: number = 30): Promise<HistoricalPrice[]> {
  try {
    const { data, error } = await supabase.functions.invoke('crypto-prices', {
      body: { symbols: [symbol], days, type: 'historical' }
    });
    
    if (error) throw error;
    return (data?.data || data) as HistoricalPrice[];
  } catch (error) {
    console.error('Error fetching historical prices from Supabase:', error);
    return [];
  }
}

export async function getIntradayPrices(symbol: string): Promise<HistoricalPrice[]> {
  try {
    const { data, error } = await supabase.functions.invoke('crypto-prices', {
      body: { symbols: [symbol], days: 1, type: 'historical' }
    });
    
    if (error) throw error;
    return (data?.data || data) as HistoricalPrice[];
  } catch (error) {
    console.error('Error fetching intraday prices from Supabase:', error);
    return [];
  }
}

// Calculate floating price based on premium percentage (Bybit-style)
export function calculateFloatingPrice(
  marketPrice: number,
  premiumPercentage: number
): number {
  return marketPrice * (1 + premiumPercentage / 100);
}

// Calculate premium percentage from fixed price and market price
export function calculatePremiumFromPrice(
  fixedPrice: number,
  marketPrice: number
): number {
  if (marketPrice === 0) return 0;
  return ((fixedPrice / marketPrice) - 1) * 100;
}

// Get price range based on premium (for premium indicator)
export function getPriceRange(
  marketPrice: number,
  minPremium: number = -10,
  maxPremium: number = 100
): { minPrice: number; maxPrice: number } {
  return {
    minPrice: calculateFloatingPrice(marketPrice, minPremium),
    maxPrice: calculateFloatingPrice(marketPrice, maxPremium)
  };
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

// Convert any currency amount to USD
export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === 'USD') {
    return amount;
  }
  
  const rates = await getExchangeRates();
  const fromRate = rates[fromCurrency];
  
  if (!fromRate || fromRate === 0) {
    throw new Error(`Exchange rate for ${fromCurrency} not available`);
  }
  
  // Convert to USD (rates are relative to USD = 1)
  return amount / fromRate;
}

// Get minimum and maximum offer limits in the specified currency
// Limits are based on USD: $3 minimum, $50,000 maximum
export async function getOfferLimits(currency: string): Promise<{ min: number; max: number }> {
  const MIN_USD = 3;
  const MAX_USD = 50000;
  
  if (currency === 'USD') {
    return { min: MIN_USD, max: MAX_USD };
  }
  
  try {
    const min = await convertCurrency(MIN_USD, currency);
    const max = await convertCurrency(MAX_USD, currency);
    
    return { 
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100
    };
  } catch (error) {
    throw new Error(`Cannot calculate limits for currency ${currency}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
