import { supabase } from "@/lib/supabase";
import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";

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
  // On-chain metadata returned by the chain-assets endpoint.
  // Present for coins fetched via asterGetChainAssets; absent for the fallback list.
  contractAddress?: string;
  decimals?: number;
  isNative?: boolean;
}

// ── AsterDEX public REST API base URLs ─────────────────
// Spot:    https://sapi.asterdex.com/api/v1/...
// Futures: https://fapi.asterdex.com/fapi/v1/...
// All market data endpoints are public — no API key needed.

const SPOT_BASE    = 'https://sapi.asterdex.com';
const FUTURES_BASE = 'https://fapi.asterdex.com';

// Allowed origins for all AsterDEX fetch helpers.
// Any constructed URL whose origin is not in this set is rejected before the request is sent.
const ASTERDEX_ALLOWED_ORIGINS = new Set([
  'https://sapi.asterdex.com',
  'https://fapi.asterdex.com',
  'https://fapi3.asterdex.com',
  'https://www.asterdex.com',
]);

function assertAsterOrigin(url: string): void {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    throw new Error('Blocked: malformed AsterDEX request URL');
  }
  if (!ASTERDEX_ALLOWED_ORIGINS.has(origin)) {
    throw new Error(`Blocked: request to unexpected host "${origin}"`);
  }
}

async function spotFetch(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${SPOT_BASE}${path}${qs ? '?' + qs : ''}`;
  assertAsterOrigin(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AsterDEX spot API ${res.status}`);
  return res.json();
}

async function futuresFetch(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${FUTURES_BASE}${path}${qs ? '?' + qs : ''}`;
  assertAsterOrigin(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AsterDEX futures API ${res.status}`);
  return res.json();
}

// ── Supabase edge function proxy (authenticated trading only) ──
async function invoke(action: string, params: Record<string, string | undefined> = {}, auth = false) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ) as Record<string, string>;

  const options: any = { body: { action, ...cleanParams } };

  if (auth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Authentication required. Please sign in.');
    options.headers = { Authorization: `Bearer ${session.access_token}` };
  }

  const { data, error } = await supabase.functions.invoke('asterdex', options);

  if (error) {
    let message = error.message || 'AsterDEX request failed';
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) message = body.error;
      else if (body?.msg) message = body.msg;
    } catch {}
    throw new Error(message);
  }
  if (data?.code && data.code < 0) throw new Error(data.msg || `AsterDEX error ${data.code}`);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── Public Market Data — calls AsterDEX REST API directly ──────

export const asterMarket = {
  // Spot
  spotTicker: (symbol?: string) =>
    spotFetch('/api/v1/ticker/24hr', symbol ? { symbol } : {}),

  spotTickerPrice: (symbol?: string) =>
    spotFetch('/api/v1/ticker/price', symbol ? { symbol } : {}),

  spotOrderBook: (symbol: string, limit = '20') =>
    spotFetch('/api/v1/depth', { symbol, limit }),

  spotKlines: (symbol: string, interval: string, limit = '100') =>
    spotFetch('/api/v1/klines', { symbol, interval, limit }),

  spotTrades: (symbol: string, limit = '20') =>
    spotFetch('/api/v1/trades', { symbol, limit }),

  spotExchangeInfo: () => spotFetch('/api/v1/exchangeInfo'),

  // Futures / Perpetual
  futuresTicker: (symbol?: string) =>
    futuresFetch('/fapi/v1/ticker/24hr', symbol ? { symbol } : {}),

  futuresTickerPrice: (symbol?: string) =>
    futuresFetch('/fapi/v1/ticker/price', symbol ? { symbol } : {}),

  futuresOrderBook: (symbol: string, limit = '20') =>
    futuresFetch('/fapi/v1/depth', { symbol, limit }),

  futuresKlines: (symbol: string, interval: string, limit = '100') =>
    futuresFetch('/fapi/v1/klines', { symbol, interval, limit }),

  futuresTrades: (symbol: string, limit = '20') =>
    futuresFetch('/fapi/v1/trades', { symbol, limit }),

  futuresExchangeInfo: () => futuresFetch('/fapi/v1/exchangeInfo'),

  futuresFundingRate: (symbol?: string) =>
    futuresFetch('/fapi/v1/fundingRate', symbol ? { symbol } : {}),

  futuresMarkPrice: (symbol?: string) =>
    futuresFetch('/fapi/v1/premiumIndex', symbol ? { symbol } : {}),
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
  // Solana-specific fields (present when chainId === 101)
  bank?: string;
  solVault?: string;
  tokenMint?: string;
  tokenVault?: string;
}

// Fetch supported assets for a given chainId from the public BAPI.
// - operation='deposit'  → hits /deposit/assets  (coins the exchange accepts for deposit)
// - operation='withdraw' → hits /withdraw/assets (coins the exchange allows for withdrawal)
// Spot and Perpetual accounts list different coins per chain — always pass the correct accountType.
// Maps them to the CoinInfo structure used throughout the modal.
export async function asterGetChainAssets(
  chainId: number,
  accountType: 'spot' | 'perp' = 'perp',
  operation: 'deposit' | 'withdraw' = 'withdraw',
): Promise<CoinInfo[]> {
  if (!Number.isInteger(chainId) || chainId < 0 || chainId > 2147483647) {
    throw new Error('Invalid chainId');
  }
  if (accountType !== 'spot' && accountType !== 'perp') {
    throw new Error('Invalid accountType');
  }
  if (operation !== 'deposit' && operation !== 'withdraw') {
    throw new Error('Invalid operation');
  }
  // Solana is not an EVM chain — it needs networks=SOL in the query
  const networkParam = chainId === 101 ? 'SOL' : 'EVM';
  const endpoint = operation === 'deposit' ? 'deposit' : 'withdraw';
  const requestUrl = `${ASTER_BAPI_ROOT}/aster/${endpoint}/assets?chainIds=${chainId}&networks=${networkParam}&accountType=${accountType}`;
  assertAsterOrigin(requestUrl);
  const res = await fetch(requestUrl);
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
      // Carry through the on-chain details so the broadcaster can use the exact
      // contract address and decimals returned by the API instead of a hardcoded table.
      contractAddress: a.contractAddress || undefined,
      decimals: a.decimals ?? undefined,
      isNative: a.isNative ?? undefined,
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

// ── V3 Registration ────────────────────────────────────────────────────────────
// V3 uses EIP-712 signed requests instead of HMAC. Authentication requires:
//   user       = the user's main EVM wallet address
//   signer     = a dedicated API signer wallet address (registered with AsterDEX)
//   signerKey  = the private key of the signer wallet (stored in Supabase user_metadata)
//
// The signer keypair is generated locally and registered by calling /api/v3/createApiKey.

// Derive an EVM address from a secp256k1 private key (EIP-55 checksum).
function deriveEvmAddress(privateKey: Uint8Array): string {
  const pubKey = secp.getPublicKey(privateKey, false); // uncompressed 65 bytes
  const addressBytes = keccak_256(pubKey.slice(1)).slice(-20);
  const hexAddr = Array.from(addressBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  // EIP-55 checksum
  const hash = keccak_256(new TextEncoder().encode(hexAddr));
  const checksum = hexAddr.split('').map((c, i) =>
    (hash[Math.floor(i / 2)] >> (4 - (i % 2) * 4) & 0xf) >= 8 ? c.toUpperCase() : c
  ).join('');
  return '0x' + checksum;
}

// Generate a fresh Ethereum keypair to use as the AsterDEX V3 signer wallet.
export function asterGenerateSignerWallet(): { address: string; privateKey: string } {
  const privKey = secp.utils.randomPrivateKey();
  const address = deriveEvmAddress(privKey);
  const privateKey = '0x' + Array.from(privKey).map(b => b.toString(16).padStart(2, '0')).join('');
  return { address, privateKey };
}

// V3 version of getNonce — uses /api/v3/getNonce
export async function asterGetNonceV3(address: string): Promise<string> {
  const body = new URLSearchParams({ address, userOperationType: 'CREATE_API_KEY' });
  const res = await fetch(`https://sapi.asterdex.com/api/v3/getNonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    // Fall through to V1 nonce if V3 endpoint not found
    let msg = 'Failed to get nonce';
    try { msg = JSON.parse(text).msg ?? msg; } catch {}
    throw new Error(msg);
  }
  return text.trim();
}

// Register a V3 signer wallet with AsterDEX via /api/v3/createApiKey.
// The signerAddress is the address we generated locally — AsterDEX links it to the user account.
// Returns the confirmed signer address (may differ from input if AsterDEX normalises it).
export async function asterCreateApiKeyV3(
  address: string,
  signature: string,
  signerAddress: string,
): Promise<{ user: string; signer: string }> {
  const body = new URLSearchParams({
    address,
    userOperationType: 'CREATE_API_KEY',
    userSignature: signature,
    signerAddress,
    desc: 'pexly-v3',
    timestamp: String(Date.now()),
  });
  const res = await fetch(`https://sapi.asterdex.com/api/v3/createApiKey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = await res.json();
  if (!res.ok || (json.code !== undefined && json.code !== 0 && json.code !== 200)) {
    throw new Error(json.msg ?? 'Failed to register V3 API key');
  }
  // Normalise response — some builds return { data: { signer } }, others return { signer } directly
  const data = json.data ?? json;
  return {
    user: address,
    signer: (data.signer ?? data.signerAddress ?? signerAddress) as string,
  };
}

// Fetch the AsterDEX deposit address for a given chain and coin.
// - EVM chains (ETH/BSC/ARB): shared treasury contract address from ae/deposit-address.
// - Solana (chainId 101): per-coin program bank address from the deposit/assets endpoint.
//   Each SPL token has its own bank; native SOL uses the shared solVault address.
export async function asterGetDepositAddress(
  chainId: number,
  coin?: string,
  accountType: 'spot' | 'perp' = 'spot',
): Promise<string> {
  if (!Number.isInteger(chainId) || chainId < 0 || chainId > 2147483647) {
    throw new Error('Invalid chainId');
  }
  if (accountType !== 'spot' && accountType !== 'perp') {
    throw new Error('Invalid accountType');
  }
  if (chainId === 101) {
    // Solana: look up the coin's bank address from the deposit assets list.
    // accountType distinguishes spot vs perpetual bank addresses.
    const networkParam = 'SOL';
    const solUrl = `${ASTER_BAPI_ROOT}/aster/deposit/assets?chainIds=${chainId}&networks=${networkParam}&accountType=${accountType}`;
    assertAsterOrigin(solUrl);
    const res = await fetch(solUrl);
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? 'Failed to get Solana deposit address');
    const assets: AsterAsset[] = json.data ?? [];

    if (coin) {
      const match = assets.find(a => a.name === coin || a.displayName === coin);
      if (match) {
        // Native SOL uses solVault; SPL tokens use per-coin bank address
        const addr = match.isNative ? match.solVault : match.bank;
        if (addr) return addr;
      }
    }
    // Fallback: use the shared solVault from the first asset that has one
    const vaultAsset = assets.find(a => a.solVault);
    if (vaultAsset) return vaultAsset.solVault!;

    throw new Error('No Solana deposit address available for this coin');
  }

  // EVM chains: shared treasury contract address
  const evmUrl = `${ASTER_BAPI}/ae/deposit-address?chainId=${chainId}`;
  assertAsterOrigin(evmUrl);
  const res = await fetch(evmUrl);
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
