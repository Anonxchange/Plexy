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

export interface RocketxSwapRequest {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  toAddress: string;
  slippage?: string;
  referrer?: string;
}

export interface RocketxSwapResponse {
  transactionHash: string;
  status: 'pending' | 'completed' | 'failed';
  fromAmount: string;
  toAmount: string;
  rate: number;
  fee: number;
  timestamp: string;
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

/**
 * Execute a swap through Rocketx API
 * Performs the actual swap transaction on-chain
 */
export async function executeRocketxSwap(
  params: RocketxSwapRequest
): Promise<RocketxSwapResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (ROCKETX_API_KEY) {
      headers['Authorization'] = `Bearer ${ROCKETX_API_KEY}`;
    }

    const requestBody = {
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress || params.fromAddress,
      slippage: params.slippage || '1', // 1% default slippage
      referrer: params.referrer,
    };

    const response = await fetch(`${ROCKETX_API_BASE}/swap`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Rocketx swap failed with status ${response.status}`
      );
    }

    const data = await response.json();

    if (!data || !data.data) {
      throw new Error('Invalid response from Rocketx API');
    }

    const swapData = data.data;

    return {
      transactionHash: swapData.txHash || swapData.transactionHash || crypto.randomUUID(),
      status: swapData.status || 'pending',
      fromAmount: swapData.fromAmount || params.fromAmount,
      toAmount: swapData.toAmount || '0',
      rate: parseFloat(swapData.rate) || 0,
      fee: parseFloat(swapData.fee) || 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error executing Rocketx swap:', error);
    throw error;
  }
}
