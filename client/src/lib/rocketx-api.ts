/**
 * Rocketx Exchange API Integration
 * Provides real-time exchange rates and swap quotes from Rocketx
 */

export interface RocketxQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: number;
  minAmount?: string;
  maxAmount?: string;
  fee?: number;
}

const ROCKETX_API_BASE = 'https://api.rocketx.exchange/api/v1';
const ROCKETX_API_KEY = import.meta.env.VITE_ROCKETX_API_KEY;

/**
 * Fetch exchange rate from Rocketx API
 */
export async function getRocketxRate(
  fromTokenSymbol: string,
  toTokenSymbol: string
): Promise<number> {
  try {
    // Map symbols to Rocketx token IDs (using common mappings)
    const tokenMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'SOL': 'solana',
      'BNB': 'binancecoin',
      'TRX': 'tron',
    };

    const fromId = tokenMap[fromTokenSymbol] || fromTokenSymbol.toLowerCase();
    const toId = tokenMap[toTokenSymbol] || toTokenSymbol.toLowerCase();

    // Construct Rocketx API request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (ROCKETX_API_KEY) {
      headers['Authorization'] = `Bearer ${ROCKETX_API_KEY}`;
    }

    const response = await fetch(
      `${ROCKETX_API_BASE}/quote?fromTokenSymbol=${fromTokenSymbol}&toTokenSymbol=${toTokenSymbol}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      console.warn(`Rocketx API error: ${response.status}`, response.statusText);
      return 0;
    }

    const data = await response.json();
    
    if (data && data.data && data.data.rate) {
      return parseFloat(data.data.rate);
    }

    return 0;
  } catch (error) {
    console.error('Error fetching Rocketx rate:', error);
    return 0;
  }
}

/**
 * Fetch quote from Rocketx for specific amount
 */
export async function getRocketxQuote(
  fromTokenSymbol: string,
  toTokenSymbol: string,
  fromAmount: string
): Promise<RocketxQuote | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (ROCKETX_API_KEY) {
      headers['Authorization'] = `Bearer ${ROCKETX_API_KEY}`;
    }

    const response = await fetch(
      `${ROCKETX_API_BASE}/quote?fromTokenSymbol=${fromTokenSymbol}&toTokenSymbol=${toTokenSymbol}&amount=${fromAmount}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      console.warn(`Rocketx API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data && data.data) {
      return {
        fromToken: fromTokenSymbol,
        toToken: toTokenSymbol,
        fromAmount: fromAmount,
        toAmount: data.data.toAmount || '0',
        rate: parseFloat(data.data.rate) || 0,
        minAmount: data.data.minAmount,
        maxAmount: data.data.maxAmount,
        fee: data.data.fee,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Rocketx quote:', error);
    return null;
  }
}
