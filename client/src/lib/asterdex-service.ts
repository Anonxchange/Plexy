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

export interface DepositInfo {
  address: string | null;
  memo: string | null;
  isOnChain: boolean;
}

async function fetchDepositInfo(coin: string, network: string): Promise<DepositInfo> {
  const chainId = NETWORK_TO_CHAIN_ID[network.toUpperCase()] ?? '56';
  const networkType = network.toUpperCase() === 'SOL' ? 'SOL' : 'EVM';
  const url = `https://www.asterdex.com/bapi/futures/v1/public/future/aster/deposit/assets?chainIds=${chainId}&networks=${networkType}&accountType=spot`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data.success || !data.data?.length) throw new Error('No deposit info available');
  const asset = data.data.find((a: any) => a.name === coin);
  if (!asset) throw new Error(`${coin} not supported on ${network}`);
  return {
    address: asset.tokenVault ?? null,
    memo: null,
    isOnChain: !asset.tokenVault,
  };
}

export const asterWallet = {
  depositAddress: (coin: string, network: string): Promise<DepositInfo> =>
    fetchDepositInfo(coin, network),

  depositHistory: (coin?: string) =>
    invoke('spot_deposit_history', coin ? { coin } : {}, true),

  withdrawHistory: (coin?: string) =>
    invoke('spot_withdraw_history', coin ? { coin } : {}, true),

  withdrawFeeEstimate: (coin: string, network: string) => {
    const chainId = NETWORK_TO_CHAIN_ID[network.toUpperCase()] ?? '56';
    const networkType = network.toUpperCase() === 'SOL' ? 'SOL' : 'EVM';
    return invoke('spot_withdraw_fee_estimate', { coin, chainId, network: networkType }, false);
  },

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

  coinInfo: () => invoke('spot_coin_info', {}, true),

  transfer: (asset: string, amount: string, type: 'SPOT_TO_FUTURES' | 'FUTURES_TO_SPOT') =>
    invoke('spot_transfer', { asset, amount, type }, true),
};
