import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────

export interface Ticker24h {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

export interface TickerPrice {
  symbol: string;
  price: string;
}

export interface OrderBookEntry {
  price: string;
  qty: string;
}

export interface OrderBook {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: number;
}

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export interface SpotBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface FuturesPosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: string;
  positionSide: string;
  notional: string;
}

export interface FuturesBalance {
  asset: string;
  balance: string;
  availableBalance: string;
  crossUnPnl: string;
}

export interface OrderResult {
  orderId: number;
  symbol: string;
  status: string;
  type: string;
  side: string;
  price: string;
  origQty: string;
  executedQty: string;
  transactTime: number;
}

export interface FundingRate {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  markPrice: string;
}

export interface DepositAddress {
  address: string;
  coin: string;
  tag: string;
  url: string;
  network: string;
}

export interface DepositRecord {
  amount: string;
  coin: string;
  network: string;
  status: number;
  txId: string;
  insertTime: number;
  confirmTimes: string;
}

export interface WithdrawRecord {
  id: string;
  amount: string;
  coin: string;
  network: string;
  status: number;
  txId: string;
  applyTime: string;
}

export interface CoinInfo {
  coin: string;
  name: string;
  free: string;
  locked: string;
  networkList: {
    network: string;
    withdrawEnable: boolean;
    depositEnable: boolean;
    withdrawFee: string;
    withdrawMin: string;
    depositMin: string;
  }[];
}

// ── Helper ─────────────────────────────────────────────

async function invoke(action: string, params: Record<string, string | undefined> = {}, auth = false) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ) as Record<string, string>;

  const options: any = { body: { action, params: cleanParams } };

  if (auth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Authentication required. Please sign in.');
    options.headers = { Authorization: `Bearer ${session.access_token}` };
  }

  const { data, error } = await supabase.functions.invoke('asterdex', options);

  if (error) {
    const message = data?.error || data?.msg || error.message || 'AsterDEX request failed';
    throw new Error(message);
  }
  if (data?.code && data.code < 0) throw new Error(data.msg || `AsterDEX error ${data.code}`);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── Public Market Data ─────────────────────────────────

export const asterMarket = {
  // Spot
  spotTicker: (symbol?: string) =>
    invoke('spot_ticker', symbol ? { symbol } : {}),

  spotTickerPrice: (symbol?: string) =>
    invoke('spot_ticker_price', symbol ? { symbol } : {}),

  spotOrderBook: (symbol: string, limit = '20') =>
    invoke('spot_orderbook', { symbol, limit }),

  spotKlines: (symbol: string, interval: string, limit = '100') =>
    invoke('spot_klines', { symbol, interval, limit }),

  spotTrades: (symbol: string, limit = '20') =>
    invoke('spot_trades', { symbol, limit }),

  spotExchangeInfo: () => invoke('spot_exchange_info'),

  // Futures
  futuresTicker: (symbol?: string) =>
    invoke('futures_ticker', symbol ? { symbol } : {}),

  futuresTickerPrice: (symbol?: string) =>
    invoke('futures_ticker_price', symbol ? { symbol } : {}),

  futuresOrderBook: (symbol: string, limit = '20') =>
    invoke('futures_orderbook', { symbol, limit }),

  futuresKlines: (symbol: string, interval: string, limit = '100') =>
    invoke('futures_klines', { symbol, interval, limit }),

  futuresTrades: (symbol: string, limit = '20') =>
    invoke('futures_trades', { symbol, limit }),

  futuresExchangeInfo: () => invoke('futures_exchange_info'),

  futuresFundingRate: (symbol?: string) =>
    invoke('futures_funding_rate', symbol ? { symbol } : {}),

  futuresMarkPrice: (symbol?: string) =>
    invoke('futures_mark_price', symbol ? { symbol } : {}),
};

// ── Authenticated Trading ──────────────────────────────

export const asterTrading = {
  // Spot
  spotAccount: () => invoke('spot_account', {}, true),

  spotOpenOrders: (symbol?: string) =>
    invoke('spot_open_orders', symbol ? { symbol } : {}, true),

  spotAllOrders: (symbol: string) =>
    invoke('spot_all_orders', { symbol }, true),

  spotPlaceOrder: (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'LIMIT_MAKER';
    quantity: string;
    price?: string;
    stopPrice?: string;
    timeInForce?: string;
  }) => {
    const needsTimeInForce = ['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(params.type);
    return invoke('spot_order', {
      ...params,
      timeInForce: needsTimeInForce ? (params.timeInForce || 'GTC') : undefined,
    } as any, true);
  },

  spotCancelOrder: (symbol: string, orderId: string) =>
    invoke('spot_cancel_order', { symbol, orderId }, true),

  spotMyTrades: (symbol: string) =>
    invoke('spot_my_trades', { symbol }, true),

  // Futures
  futuresAccount: () => invoke('futures_account', {}, true),
  futuresBalance: () => invoke('futures_balance', {}, true),
  futuresPositions: () => invoke('futures_positions', {}, true),

  futuresOpenOrders: (symbol?: string) =>
    invoke('futures_open_orders', symbol ? { symbol } : {}, true),

  futuresPlaceOrder: (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET' | 'STOP' | 'STOP_MARKET' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET' | 'LIMIT_MAKER';
    quantity: string;
    price?: string;
    stopPrice?: string;
    timeInForce?: string;
    positionSide?: 'LONG' | 'SHORT' | 'BOTH';
    reduceOnly?: string;
  }) => {
    const needsTimeInForce = ['LIMIT', 'LIMIT_MAKER'].includes(params.type);
    return invoke('futures_order', {
      ...params,
      positionSide: params.positionSide || 'BOTH',
      timeInForce: needsTimeInForce ? (params.timeInForce || 'GTC') : undefined,
    } as any, true);
  },

  futuresCancelOrder: (symbol: string, orderId: string) =>
    invoke('futures_cancel_order', { symbol, orderId }, true),

  futuresSetLeverage: (symbol: string, leverage: string) =>
    invoke('futures_leverage', { symbol, leverage }, true),

  futuresSetMarginType: (symbol: string, marginType: 'ISOLATED' | 'CROSSED') =>
    invoke('futures_margin_type', { symbol, marginType }, true),

  futuresMyTrades: (symbol: string) =>
    invoke('futures_my_trades', { symbol }, true),

  futuresIncome: (params?: { symbol?: string; incomeType?: string; limit?: string }) =>
    invoke('futures_income', params as any || {}, true),
};

// ── Deposit & Withdraw ─────────────────────────────────

const NETWORK_TO_CHAIN_ID: Record<string, string> = {
  ETH: '1',
  BSC: '56',
  BNB: '56',
  ARB: '42161',
  ARBITRUM: '42161',
  SOL: '101',
  SOLANA: '101',
};

// ── AsterDEX API constants ─────────────────────────────────────────────────────

// Public Spot REST API (official, documented)
const ASTER_SAPI = 'https://sapi.asterdex.com/api/v1';

// Legacy BAPI root — still used for deposit-address and asset-list endpoints
const ASTER_BAPI_ROOT = 'https://www.asterdex.com/bapi/futures/v1/public/future';
const ASTER_BAPI      = `${ASTER_BAPI_ROOT}/web3`;

export interface AsterAsset {
  name: string;
  displayName: string;
  contractAddress: string;
  decimals: number;
  isNative: boolean;
  chainId: number;
  network: string;
}

// Fetch supported deposit assets for a given chainId from the public BAPI.
// Spot and Perpetual accounts list different coins per chain — always pass the correct accountType.
// Maps them to the CoinInfo structure used throughout the modal.
export async function asterGetChainAssets(chainId: number, accountType: 'spot' | 'perp' = 'perp'): Promise<CoinInfo[]> {
  // Solana is not an EVM chain — it needs networks=SOL in the query
  const networkParam = chainId === 101 ? 'SOL' : 'EVM';
  const res = await fetch(
    `${ASTER_BAPI_ROOT}/aster/withdraw/assets?chainIds=${chainId}&networks=${networkParam}&accountType=${accountType}`,
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? 'Failed to fetch chain assets');

  const networkKey = chainId === 1 ? 'ETH' : chainId === 56 ? 'BSC' : chainId === 42161 ? 'ARB' : chainId === 101 ? 'SOL' : String(chainId);

  const seen = new Set<string>();
  return (json.data as AsterAsset[])
    .filter(a => {
      if (seen.has(a.name)) return false;
      seen.add(a.name);
      return true;
    })
    .map(a => ({
      coin: a.name,
      name: a.displayName || a.name,
      free: '0',
      locked: '0',
      networkList: [{
        network: networkKey,
        withdrawEnable: true,
        depositEnable: true,
        withdrawFee: '0',
        withdrawMin: '0',
        depositMin: '0',
      }],
    }));
}

// ── Registration: get nonce → sign → create API key ──────────────────────────
// Uses the official Spot API (sapi.asterdex.com), not the legacy BAPI.
// No separate "create broker account" step is needed — the Spot API creates
// the sub-account implicitly on first createApiKey call.

export async function asterGetNonce(address: string): Promise<string> {
  // SAPI requires application/x-www-form-urlencoded (not JSON).
  // Response is a plain-text integer, e.g. "180433"
  const body = new URLSearchParams({ address, userOperationType: 'CREATE_API_KEY' });
  const res = await fetch(`${ASTER_SAPI}/getNonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = 'Failed to get nonce';
    try { msg = JSON.parse(text).msg ?? msg; } catch {}
    throw new Error(msg);
  }
  return text.trim();
}

export async function asterCreateApiKey(
  address: string,
  signature: string,
): Promise<{ apiKey: string; apiSecret: string }> {
  // SAPI requires application/x-www-form-urlencoded (not JSON).
  const body = new URLSearchParams({
    address,
    userOperationType: 'CREATE_API_KEY',
    userSignature: signature,
    desc: 'pexly-wallet',
    timestamp: String(Date.now()),
  });
  const res = await fetch(`${ASTER_SAPI}/createApiKey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = await res.json();
  if (!res.ok || (json.code !== undefined && json.code !== 0 && json.code !== 200)) {
    throw new Error(json.msg ?? 'Failed to create API key');
  }
  return json.data ?? json;
}

// Fetch the AsterDEX treasury deposit address for a given chain.
// This is a public endpoint — no API key needed.
export async function asterGetDepositAddress(chainId: number): Promise<string> {
  const res = await fetch(
    `${ASTER_BAPI}/ae/deposit-address?chainId=${chainId}`,
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? 'Failed to get deposit address');
  return String(json.data);
}

export const asterWallet = {
  // Spot account deposit address and history
  depositAddress: (coin: string, network?: string) =>
    invoke('spot_deposit_address', { coin, ...(network ? { network } : {}) }, true),

  depositHistory: (coin?: string) =>
    invoke('spot_deposit_history', coin ? { coin } : {}, true),

  // Futures/Perpetual account deposit address and history
  futuresDepositAddress: (coin: string, network?: string) =>
    invoke('futures_deposit_address', { coin, ...(network ? { network } : {}) }, true),

  futuresDepositHistory: (coin?: string) =>
    invoke('futures_deposit_history', coin ? { coin } : {}, true),

  // Spot account withdraw history
  withdrawHistory: (coin?: string) =>
    invoke('spot_withdraw_history', coin ? { coin } : {}, true),

  // Futures account withdraw history
  futuresWithdrawHistory: (coin?: string) =>
    invoke('futures_withdraw_history', coin ? { coin } : {}, true),

  // Fee estimate is network-based and the same regardless of account type
  withdrawFeeEstimate: (coin: string, network: string) => {
    const chainId = NETWORK_TO_CHAIN_ID[network.toUpperCase()] ?? '56';
    const networkType = network.toUpperCase() === 'SOL' ? 'SOL' : 'EVM';
    return invoke('spot_withdraw_fee_estimate', { coin, chainId, network: networkType }, false);
  },

  // Withdraw from Spot account to an external address
  withdraw: (
    coin: string,
    address: string,
    amount: string,
    network: string,
    fee: string,
  ) => {
    const chainId = NETWORK_TO_CHAIN_ID[network.toUpperCase()] ?? '56';
    const nonce = String(Date.now() * 1000);
    return invoke('spot_withdraw', { coin, address, amount, network, chainId, fee, nonce }, true);
  },

  // Withdraw from Futures/Perpetual account to an external address
  futuresWithdraw: (
    coin: string,
    address: string,
    amount: string,
    network: string,
    fee: string,
  ) => {
    const chainId = NETWORK_TO_CHAIN_ID[network.toUpperCase()] ?? '56';
    const nonce = String(Date.now() * 1000);
    return invoke('futures_withdraw', { coin, address, amount, network, chainId, fee, nonce }, true);
  },

  coinInfo: () => invoke('spot_coin_info', {}, true),

  transfer: (asset: string, amount: string, type: 'SPOT_TO_FUTURES' | 'FUTURES_TO_SPOT') =>
    invoke('spot_transfer', { asset, amount, type }, true),
};
