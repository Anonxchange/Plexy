// monitor-deposits — multi-chain deposit scanner (standalone, no shared imports)
//
// Chains: BTC, XRP, ETH, BSC, POLYGON, ARBITRUM, OPTIMISM, SOL, TRX
// Assets: native coin + allowlisted stablecoins (USDT / USDC) on every chain that has them.
//
// Provider split:
//   BTC  -> Tatum (primary indexer) + public Esplora nodes as fallback
//   XRP  -> public rippled JSON-RPC cluster
//   rest -> Alchemy
//
// Every failure is surfaced, never silently treated as "0 balance".
//
// QUOTA: prefer the `alchemy-webhook` function (Address Activity push) as the primary
// detector. This polling scanner is for backfill, reconciliation and the chains Notify
// does not cover (BTC, XRP, TRX). Do not run it on a tight loop.
//
// Secrets: ALCHEMYS_API_KEY (required for EVM/SOL/TRX), TATUM_API_KEY (optional, BTC primary)
//
// Request:  POST { address, chain, mode?: "deposits",
//                  fromBlock?, sinceSignature?, page?, afterTxid?, ledgerIndexMin?,
//                  includeUnlisted?: boolean }
// Response: { success, chain, address, balance, transactions[], unlisted[], cursor, scannedAt }
//           on failure: { success:false, error, retryable } with HTTP 4xx/502 — callers MUST NOT
//           interpret this as "no deposits".

const ALLOWED_ORIGINS = ['https://pexly.app', 'https://www.pexly.app']

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const KEY = Deno.env.get('ALCHEMYS_API_KEY') ?? ''
const TATUM_KEY = Deno.env.get('TATUM_API_KEY') ?? ''

const NET = {
  ETH: () => `https://eth-mainnet.g.alchemy.com/v2/${KEY}`,
  BSC: () => `https://bnb-mainnet.g.alchemy.com/v2/${KEY}`,
  POLYGON: () => `https://polygon-mainnet.g.alchemy.com/v2/${KEY}`,
  ARBITRUM: () => `https://arb-mainnet.g.alchemy.com/v2/${KEY}`,
  OPTIMISM: () => `https://opt-mainnet.g.alchemy.com/v2/${KEY}`,
  SOL: () => `https://solana-mainnet.g.alchemy.com/v2/${KEY}`,
  TRX: () => `https://tron-mainnet.g.alchemy.com/v2/${KEY}`,
}

const TATUM_BASE = 'https://api.tatum.io/v3/bitcoin'
const BTC_PUBLIC_ESPLORA = [
  'https://blockstream.info/api',
  'https://mempool.space/api',
  'https://btcscan.org/api',
]

const XRP_PUBLIC_NODES = [
  'https://xrplcluster.com',
  'https://s1.ripple.com:51234',
  'https://s2.ripple.com:51234',
]

type EvmChain = 'ETH' | 'BSC' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM'
type ChainKey = EvmChain | 'BTC' | 'XRP' | 'SOL' | 'TRX'

const NATIVE: Record<ChainKey, { symbol: string; decimals: number }> = {
  BTC: { symbol: 'BTC', decimals: 8 },
  XRP: { symbol: 'XRP', decimals: 6 },
  ETH: { symbol: 'ETH', decimals: 18 },
  BSC: { symbol: 'BNB', decimals: 18 },
  POLYGON: { symbol: 'POL', decimals: 18 },
  ARBITRUM: { symbol: 'ETH', decimals: 18 },
  OPTIMISM: { symbol: 'ETH', decimals: 18 },
  SOL: { symbol: 'SOL', decimals: 9 },
  TRX: { symbol: 'TRX', decimals: 6 },
}

/* ------------------------- STABLECOIN ALLOWLIST ---------------------------
 * A deposit is only creditable when its contract/mint is in this table for
 * that exact chain. Anything else is reported under `unlisted` and never
 * credited — this is what stops fake "USDT" contracts from minting balance.
 * EVM/TRON keys are lowercased hex. Solana keys are base58 mints.
 * ------------------------------------------------------------------------ */
interface TokenDef { symbol: string; decimals: number; label?: string }

const TOKENS: Record<ChainKey, Record<string, TokenDef>> = {
  BTC: {},
  XRP: {},
  ETH: {
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
  },
  BSC: {
    '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18 },
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', decimals: 18 },
  },
  POLYGON: {
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 },
    '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': { symbol: 'USDC', decimals: 6 },
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: 'USDC', decimals: 6, label: 'USDC.e' },
  },
  ARBITRUM: {
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': { symbol: 'USDT', decimals: 6 },
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { symbol: 'USDC', decimals: 6 },
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': { symbol: 'USDC', decimals: 6, label: 'USDC.e' },
  },
  OPTIMISM: {
    '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': { symbol: 'USDT', decimals: 6 },
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85': { symbol: 'USDC', decimals: 6 },
    '0x7f5c764cbc14f9669b88837ca1490cca17c31607': { symbol: 'USDC', decimals: 6, label: 'USDC.e' },
  },
  SOL: {
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: 'USDT', decimals: 6 },
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: 'USDC', decimals: 6 },
  },
  TRX: {
    // base58 (wallet API) and 0x hex (eth_getLogs) forms of the same contracts
    TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t: { symbol: 'USDT', decimals: 6 },
    '0xa614f803b6fd780986a42c78ec9c7f77e6ded13c': { symbol: 'USDT', decimals: 6 },
    TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8: { symbol: 'USDC', decimals: 6 },
    '0x3487b63d30b5b2c87fb7ffa8bcfade38eaac1abe': { symbol: 'USDC', decimals: 6 },
  },
}

function lookupToken(chain: ChainKey, contract: string | undefined): TokenDef | null {
  if (!contract) return null
  const table = TOKENS[chain] ?? {}
  return table[contract] ?? table[contract.toLowerCase()] ?? null
}

/** Confirmations required before a deposit may be credited. */
const MIN_CONFIRMATIONS: Record<ChainKey, number> = {
  BTC: 2,
  XRP: 1,
  ETH: 12,
  BSC: 15,
  POLYGON: 128,
  ARBITRUM: 20,
  OPTIMISM: 20,
  SOL: 32,
  TRX: 19,
}

const TIMEOUT_MS = 15_000
const MAX_RETRIES = 4

class UpstreamError extends Error {
  retryable: boolean
  status: number
  constructor(message: string, status = 502, retryable = true) {
    super(message)
    this.retryable = retryable
    this.status = status
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** fetch with timeout + exponential backoff on 429/5xx/network errors. Throws — never returns []. */
async function httpJson(url: string, init: RequestInit = {}, label = 'upstream', retries = MAX_RETRIES): Promise<any> {
  let lastErr = ''
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(Math.min(2 ** attempt * 250, 4000) + Math.random() * 200)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal })
      const text = await res.text()
      if (res.status === 429 || res.status >= 500) {
        lastErr = `${label}: HTTP ${res.status} ${text.slice(0, 200)}`
        continue
      }
      if (!res.ok) {
        throw new UpstreamError(`${label}: HTTP ${res.status} ${text.slice(0, 200)}`, 502, false)
      }
      try {
        return JSON.parse(text)
      } catch {
        throw new UpstreamError(`${label}: invalid JSON response`, 502, false)
      }
    } catch (e) {
      if (e instanceof UpstreamError) throw e
      lastErr = `${label}: ${e instanceof Error ? e.message : String(e)}`
    } finally {
      clearTimeout(timer)
    }
  }
  throw new UpstreamError(`${lastErr} (after ${retries + 1} attempts)`, 502, true)
}

async function rpc(url: string, method: string, params: unknown[] | object, label: string) {
  const body = await httpJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    },
    `${label}:${method}`,
  )
  if (body.error) {
    const msg = body.error.message ?? JSON.stringify(body.error)
    throw new UpstreamError(`${label}:${method} rpc error ${body.error.code}: ${msg}`, 502, false)
  }
  return body.result
}

async function withFallback<T>(
  label: string,
  providers: { name: string; run: () => Promise<T> }[],
): Promise<{ result: T; provider: string }> {
  const errors: string[] = []
  for (const p of providers) {
    try {
      return { result: await p.run(), provider: p.name }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${p.name}: ${msg}`)
      console.warn(`[${label}] provider ${p.name} failed: ${msg}`)
    }
  }
  throw new UpstreamError(`${label}: all providers failed -> ${errors.join(' | ')}`, 502, true)
}

/** BigInt-safe smallest-unit -> decimal string (no float rounding). */
function fromUnits(raw: bigint, decimals: number): string {
  const neg = raw < 0n
  const v = neg ? -raw : raw
  const base = 10n ** BigInt(decimals)
  const whole = v / base
  const frac = (v % base).toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${neg ? '-' : ''}${whole}${frac ? '.' + frac : ''}`
}

/**
 * Decimal string -> smallest units.
 * FIX: an integer-looking input used to be returned unscaled, so Tatum's
 * "1" BTC was read as 1 satoshi. Integers are now scaled like everything else.
 */
function toUnits(value: unknown, decimals: number): bigint {
  const s = String(value ?? '0').trim()
  if (!s || s === 'null' || s === 'undefined' || s === 'NaN') return 0n
  if (!/^-?\d+(\.\d+)?$/.test(s)) return 0n
  if (!s.includes('.')) return BigInt(s) * 10n ** BigInt(decimals)
  const neg = s.startsWith('-')
  const [w, f = ''] = (neg ? s.slice(1) : s).split('.')
  const frac = (f + '0'.repeat(decimals)).slice(0, decimals)
  const raw = BigInt(w || '0') * 10n ** BigInt(decimals) + BigInt(frac || '0')
  return neg ? -raw : raw
}

function hexToBigInt(v: unknown): bigint {
  const s = String(v ?? '0x0')
  if (!s || s === '0x') return 0n
  try {
    return BigInt(s)
  } catch {
    return 0n
  }
}

interface Deposit {
  /** Stable idempotency key. Credit each depositId at most once. */
  depositId: string
  txHash: string
  /** Disambiguates multiple transfers inside one transaction. */
  index: number
  amount: string
  amountRaw: string
  asset: string
  label?: string
  contract?: string
  decimals: number
  confirmations: number
  /** true only when confirmations >= MIN_CONFIRMATIONS for the chain. */
  creditable: boolean
  blockNumber?: number
  timestamp: number
  from?: string
  /** XRP shared-address routing. */
  destinationTag?: number
  memo?: string
}

/** Anything that reached the address but is NOT on the allowlist. Never credited. */
interface UnlistedTransfer {
  txHash: string
  index: number
  contract: string
  amountRaw: string
  blockNumber?: number
  reason: string
}

function finalize(chain: ChainKey, txs: Deposit[]): Deposit[] {
  const min = MIN_CONFIRMATIONS[chain]
  const seen = new Set<string>()
  const out: Deposit[] = []
  for (const t of txs) {
    if (!t.txHash) continue
    if (seen.has(t.depositId)) continue
    seen.add(t.depositId)
    t.creditable = t.confirmations >= min
    out.push(t)
  }
  return out.sort((a, b) => (a.blockNumber ?? 0) - (b.blockNumber ?? 0) || a.index - b.index)
}

/* --------------------------------- BITCOIN -------------------------------- */

function tatumHeaders() {
  return { 'x-api-key': TATUM_KEY, 'Content-Type': 'application/json' }
}

async function btcTipTatum(): Promise<number> {
  const info = await httpJson(`${TATUM_BASE}/info`, { headers: tatumHeaders() }, 'btc:tatum:info', 2)
  return Number(info?.blocks ?? info?.headers ?? 0)
}

interface BtcScan {
  balance: string
  unconfirmed: string
  transactions: Deposit[]
  unlisted: UnlistedTransfer[]
  cursor: Record<string, unknown>
}

async function scanBitcoinTatum(address: string, page = 1): Promise<BtcScan> {
  if (!TATUM_KEY) throw new UpstreamError('TATUM_API_KEY not configured', 502, false)
  const pageSize = 50
  const offset = (Math.max(page, 1) - 1) * pageSize
  const [balanceRes, txsRes, tip] = await Promise.all([
    httpJson(`${TATUM_BASE}/address/balance/${address}`, { headers: tatumHeaders() }, 'btc:tatum:balance', 2),
    httpJson(
      `${TATUM_BASE}/transaction/address/${address}?pageSize=${pageSize}&offset=${offset}`,
      { headers: tatumHeaders() },
      'btc:tatum:txs',
      2,
    ),
    btcTipTatum().catch(() => 0),
  ])

  const txs: Deposit[] = []
  for (const tx of Array.isArray(txsRes) ? txsRes : []) {
    const hash = tx.hash ?? tx.txId ?? tx.txid
    if (!hash) continue
    const height = Number(tx.blockNumber ?? 0)
    const confirmations = height > 0 && tip > 0 ? Math.max(tip - height + 1, 0) : 0
    // One row per matching vout: two outputs to the same address in one tx
    // must not collapse into a single idempotency key.
    const outs = tx.outputs ?? []
    for (let i = 0; i < outs.length; i++) {
      const out = outs[i]
      if (String(out.address ?? '') !== address) continue
      const sats = toUnits(out.value, 8)
      if (sats <= 0n) continue
      txs.push({
        depositId: `BTC:${hash}:${i}`,
        txHash: hash,
        index: i,
        amount: fromUnits(sats, 8),
        amountRaw: sats.toString(),
        asset: 'BTC',
        decimals: 8,
        confirmations,
        creditable: false,
        blockNumber: height > 0 ? height : undefined,
        timestamp: Number(tx.time ?? tx.blockTime ?? 0),
        from: tx.inputs?.[0]?.coin?.address,
      })
    }
  }

  const incoming = toUnits(balanceRes?.incoming ?? '0', 8)
  const outgoing = toUnits(balanceRes?.outgoing ?? '0', 8)
  const pendingIn = toUnits(balanceRes?.incomingPending ?? '0', 8)
  const pendingOut = toUnits(balanceRes?.outgoingPending ?? '0', 8)

  return {
    balance: fromUnits(incoming - outgoing, 8),
    unconfirmed: fromUnits(pendingIn - pendingOut, 8),
    transactions: txs,
    unlisted: [] as UnlistedTransfer[],
    cursor: {
      page,
      pageSize,
      hasMore: (Array.isArray(txsRes) ? txsRes.length : 0) >= pageSize,
      tipHeight: tip || null,
    },
  }
}

/** Esplora REST (blockstream / mempool.space / btcscan) — identical response shape. */
async function scanBitcoinEsplora(base: string, address: string, afterTxid?: string): Promise<BtcScan> {
  const [stats, tipStr] = await Promise.all([
    httpJson(`${base}/address/${address}`, {}, `btc:${base}:address`, 2),
    (async () => {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
      try {
        const res = await fetch(`${base}/blocks/tip/height`, { signal: ctrl.signal })
        return res.ok ? (await res.text()).trim() : '0'
      } catch {
        return '0'
      } finally {
        clearTimeout(timer)
      }
    })(),
  ])
  const tip = Number(tipStr) || 0

  // Esplora caps at 25 confirmed txs per page. Without ?after_txid paging,
  // older deposits are invisible forever.
  const url = afterTxid
    ? `${base}/address/${address}/txs/chain/${afterTxid}`
    : `${base}/address/${address}/txs`
  const list: any[] = await httpJson(url, {}, `btc:${base}:txs`, 2)

  const txs: Deposit[] = []
  for (const tx of list ?? []) {
    const height = tx.status?.block_height ?? 0
    const confirmations = tx.status?.confirmed && tip > 0 && height > 0 ? Math.max(tip - height + 1, 0) : 0
    const vouts = tx.vout ?? []
    for (let i = 0; i < vouts.length; i++) {
      if (vouts[i]?.scriptpubkey_address !== address) continue
      const sats = BigInt(vouts[i].value ?? 0)
      if (sats <= 0n) continue
      txs.push({
        depositId: `BTC:${tx.txid}:${i}`,
        txHash: tx.txid,
        index: i,
        amount: fromUnits(sats, 8),
        amountRaw: sats.toString(),
        asset: 'BTC',
        decimals: 8,
        confirmations,
        creditable: false,
        blockNumber: height > 0 ? height : undefined,
        timestamp: tx.status?.block_time ?? 0,
        from: tx.vin?.[0]?.prevout?.scriptpubkey_address,
      })
    }
  }

  const cs = stats?.chain_stats ?? {}
  const ms = stats?.mempool_stats ?? {}
  const confirmed = BigInt(cs.funded_txo_sum ?? 0) - BigInt(cs.spent_txo_sum ?? 0)
  const pending = BigInt(ms.funded_txo_sum ?? 0) - BigInt(ms.spent_txo_sum ?? 0)

  return {
    balance: fromUnits(confirmed, 8),
    unconfirmed: fromUnits(pending, 8),
    transactions: txs,
    unlisted: [] as UnlistedTransfer[],
    cursor: {
      lastSeenTxid: (list ?? [])[(list ?? []).length - 1]?.txid ?? null,
      hasMore: (list ?? []).length >= 25,
      tipHeight: tip || null,
    },
  }
}

async function scanBitcoin(address: string, page = 1, afterTxid?: string) {
  const providers = [
    ...(TATUM_KEY ? [{ name: 'tatum', run: () => scanBitcoinTatum(address, page) }] : []),
    ...BTC_PUBLIC_ESPLORA.map((base) => ({
      name: base.replace('https://', ''),
      run: () => scanBitcoinEsplora(base, address, afterTxid),
    })),
  ]
  const { result, provider } = await withFallback('BTC', providers)
  return { ...result, transactions: finalize('BTC', result.transactions), provider }
}

/* ----------------------------------- XRP ----------------------------------- */

function isValidXrpAddress(address: unknown): address is string {
  return typeof address === 'string' && /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address.trim())
}

async function xrpCall(node: string, method: string, params: Record<string, unknown>) {
  const body = await httpJson(
    node,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params: [params] }),
    },
    `XRP:${method}`,
    2,
  )
  const result = body?.result
  if (result?.status === 'error') {
    const err = String(result.error ?? 'unknown')
    if (err === 'actNotFound') return { notFound: true }
    throw new UpstreamError(`XRP:${method} error ${err}: ${result.error_message ?? ''}`, 502, err !== 'invalidParams')
  }
  return result
}

function decodeXrpMemo(t: any): string | undefined {
  const hex = t?.Memos?.[0]?.Memo?.MemoData
  if (typeof hex !== 'string' || !/^[0-9a-fA-F]+$/.test(hex)) return undefined
  try {
    return decodeURIComponent(hex.replace(/../g, '%$&'))
  } catch {
    return hex
  }
}

async function scanXrpNode(node: string, address: string, ledgerIndexMin?: number) {
  const info: any = await xrpCall(node, 'account_info', { account: address, ledger_index: 'validated' })
  const notFound = info?.notFound === true
  const drops = BigInt(info?.account_data?.Balance ?? 0)
  const validatedLedger = Number(info?.ledger_current_index ?? info?.ledger_index ?? 0)

  const txs: Deposit[] = []
  let marker: unknown = null
  if (!notFound) {
    const txRes: any = await xrpCall(node, 'account_tx', {
      account: address,
      ledger_index_min: ledgerIndexMin && ledgerIndexMin > 0 ? ledgerIndexMin : -1,
      ledger_index_max: -1,
      binary: false,
      forward: false,
      limit: 50,
    })
    marker = txRes?.marker ?? null
    for (const entry of txRes?.transactions ?? []) {
      const t = entry.tx ?? entry.tx_json ?? {}
      const meta = entry.meta ?? entry.metaData ?? {}
      if (!entry.validated) continue
      if (meta.TransactionResult !== 'tesSUCCESS') continue
      if (t.TransactionType !== 'Payment') continue
      if (t.Destination !== address) continue

      // A string delivered_amount is drops (XRP). An object is an issued
      // currency (IOU) and is never credited here.
      const delivered = meta.delivered_amount ?? meta.DeliveredAmount ?? t.Amount
      if (typeof delivered !== 'string') continue

      const amountDrops = BigInt(delivered)
      if (amountDrops <= 0n) continue
      const ledger = Number(t.ledger_index ?? entry.ledger_index ?? 0)
      const hash = t.hash ?? entry.hash
      txs.push({
        depositId: `XRP:${hash}`,
        txHash: hash,
        index: 0,
        amount: fromUnits(amountDrops, 6),
        amountRaw: amountDrops.toString(),
        asset: 'XRP',
        decimals: 6,
        confirmations: validatedLedger > 0 && ledger > 0 ? Math.max(validatedLedger - ledger + 1, 1) : 1,
        creditable: false,
        blockNumber: ledger || undefined,
        // Ripple epoch -> Unix epoch.
        timestamp: t.date ? Number(t.date) + 946684800 : 0,
        from: t.Account,
        // FIX: without the tag, deposits to a shared XRP address cannot be
        // attributed to a user.
        destinationTag: typeof t.DestinationTag === 'number' ? t.DestinationTag : undefined,
        memo: decodeXrpMemo(t),
      })
    }
  }

  return {
    balance: fromUnits(drops, 6),
    reserve: '10',
    transactions: txs,
    unlisted: [] as UnlistedTransfer[],
    cursor: {
      validatedLedger: validatedLedger || null,
      nextLedgerIndexMin: validatedLedger ? validatedLedger + 1 : null,
      marker,
    },
    accountFunded: !notFound,
  }
}

async function scanXrp(address: string, ledgerIndexMin?: number) {
  if (!isValidXrpAddress(address)) {
    throw new UpstreamError(`XRP: invalid address format: "${address}" — expected classic r-address`, 400, false)
  }
  const { result, provider } = await withFallback(
    'XRP',
    XRP_PUBLIC_NODES.map((node) => ({
      name: node.replace('https://', ''),
      run: () => scanXrpNode(node, address.trim(), ledgerIndexMin),
    })),
  )
  return { ...result, transactions: finalize('XRP', result.transactions), provider }
}

/* --------------------------------- EVM ------------------------------------ */

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const decimalsCache = new Map<string, number>()

async function tokenDecimals(url: string, contract: string, label: string, fallback = 18): Promise<number> {
  const k = `${label}:${contract.toLowerCase()}`
  if (decimalsCache.has(k)) return decimalsCache.get(k)!
  try {
    const res = await rpc(url, 'eth_call', [{ to: contract, data: '0x313ce567' }, 'latest'], label)
    const d = res && res !== '0x' ? Number(BigInt(res)) : fallback
    const val = Number.isFinite(d) && d >= 0 && d <= 36 ? d : fallback
    decimalsCache.set(k, val)
    return val
  } catch {
    return fallback
  }
}

async function scanEvm(chain: EvmChain, address: string, fromBlock?: number, includeUnlisted = false) {
  const url = NET[chain]()
  const native = NATIVE[chain]
  const latest = Number(hexToBigInt(await rpc(url, 'eth_blockNumber', [], chain)))

  const txs: Deposit[] = []
  const unlisted: UnlistedTransfer[] = []
  let usedFallback = false

  const baseParams: Record<string, unknown> = {
    fromBlock: '0x' + BigInt(Math.max(fromBlock ?? 0, 0)).toString(16),
    toBlock: 'latest',
    toAddress: address,
    // FIX: `internal` catches deposits forwarded by a contract (exchange
    // sweepers, smart wallets); `external` alone misses them entirely.
    category: chain === 'BSC'
      ? ['external', 'erc20']
      : ['external', 'internal', 'erc20'],
    withMetadata: true,
    excludeZeroValue: true,
    maxCount: '0x64',
    order: 'asc',
  }

  try {
    // FIX: page through every result. A single 100-item page silently
    // truncated history on busy addresses.
    let pageKey: string | undefined
    let pages = 0
    do {
      const res = await rpc(
        url,
        'alchemy_getAssetTransfers',
        [{ ...baseParams, ...(pageKey ? { pageKey } : {}) }],
        chain,
      )
      for (const t of res?.transfers ?? []) {
        const contract: string | undefined = t.rawContract?.address ?? undefined
        const blockNumber = Number(hexToBigInt(t.blockNum))
        const confirmations = Math.max(latest - blockNumber + 1, 0)
        const uid = typeof t.uniqueId === 'string' ? t.uniqueId : `${t.category}:${txs.length}`
        const raw = hexToBigInt(t.rawContract?.value)

        if (!contract) {
          if (raw <= 0n) continue
          txs.push({
            depositId: `${chain}:${t.hash}:${uid}`,
            txHash: t.hash,
            index: txs.length,
            amount: fromUnits(raw, native.decimals),
            amountRaw: raw.toString(),
            asset: native.symbol,
            decimals: native.decimals,
            confirmations,
            creditable: false,
            blockNumber,
            timestamp: t.metadata?.blockTimestamp ? Math.floor(Date.parse(t.metadata.blockTimestamp) / 1000) : 0,
            from: t.from,
          })
          continue
        }

        const def = lookupToken(chain, contract)
        if (!def) {
          if (includeUnlisted || unlisted.length < 25) {
            unlisted.push({
              txHash: t.hash,
              index: unlisted.length,
              contract: contract.toLowerCase(),
              amountRaw: raw.toString(),
              blockNumber,
              reason: 'contract not on stablecoin allowlist for this chain',
            })
          }
          continue
        }
        if (raw <= 0n) continue
        txs.push({
          depositId: `${chain}:${t.hash}:${uid}`,
          txHash: t.hash,
          index: txs.length,
          // Allowlist decimals are authoritative — never trust the response.
          amount: fromUnits(raw, def.decimals),
          amountRaw: raw.toString(),
          asset: def.symbol,
          label: def.label,
          contract: contract.toLowerCase(),
          decimals: def.decimals,
          confirmations,
          creditable: false,
          blockNumber,
          timestamp: t.metadata?.blockTimestamp ? Math.floor(Date.parse(t.metadata.blockTimestamp) / 1000) : 0,
          from: t.from,
        })
      }
      pageKey = res?.pageKey
      pages++
    } while (pageKey && pages < 20)
  } catch (e) {
    if (e instanceof UpstreamError && /-32601|not supported|not available/i.test(e.message)) {
      usedFallback = true
      const start = Math.max(fromBlock ?? latest - 5000, 0)
      const fb = await scanEvmLogsFallback(url, chain, address, latest, start, includeUnlisted)
      txs.push(...fb.txs)
      unlisted.push(...fb.unlisted)
    } else {
      throw e
    }
  }

  const nativeRaw = hexToBigInt(await rpc(url, 'eth_getBalance', [address, 'latest'], chain))

  return {
    balance: fromUnits(nativeRaw, native.decimals),
    nativeSymbol: native.symbol,
    transactions: finalize(chain, txs),
    unlisted,
    cursor: { latestBlock: latest, nextFromBlock: latest + 1, usedFallback },
  }
}

async function scanEvmLogsFallback(
  url: string,
  chain: EvmChain,
  address: string,
  latest: number,
  fromBlock: number,
  includeUnlisted: boolean,
) {
  const topicAddr = '0x' + address.toLowerCase().replace(/^0x/, '').padStart(64, '0')
  const logs = await rpc(url, 'eth_getLogs', [{
    fromBlock: '0x' + BigInt(Math.max(fromBlock, 0)).toString(16),
    toBlock: 'latest',
    topics: [TRANSFER_TOPIC, null, topicAddr],
  }], chain)

  const txs: Deposit[] = []
  const unlisted: UnlistedTransfer[] = []

  for (const l of logs ?? []) {
    const blockNumber = Number(hexToBigInt(l.blockNumber))
    // FIX: logIndex keeps two token transfers in the same tx distinct;
    // keying on txHash alone dropped one of them.
    const logIndex = Number(hexToBigInt(l.logIndex))
    const contract = String(l.address ?? '').toLowerCase()
    const raw = hexToBigInt(l.data === '0x' ? '0x0' : l.data)
    const def = lookupToken(chain, contract)

    if (!def) {
      if (includeUnlisted || unlisted.length < 25) {
        unlisted.push({
          txHash: l.transactionHash,
          index: logIndex,
          contract,
          amountRaw: raw.toString(),
          blockNumber,
          reason: 'contract not on stablecoin allowlist for this chain',
        })
      }
      continue
    }
    if (raw <= 0n) continue

    // Allowlisted decimals are authoritative; the on-chain read is a sanity net.
    const dec = def.decimals ?? (await tokenDecimals(url, contract, chain, 18))
    txs.push({
      depositId: `${chain}:${l.transactionHash}:${logIndex}`,
      txHash: l.transactionHash,
      index: logIndex,
      // FIX: previously labelled "TOKEN" with a guessed decimal count.
      amount: fromUnits(raw, dec),
      amountRaw: raw.toString(),
      asset: def.symbol,
      label: def.label,
      contract,
      decimals: dec,
      confirmations: Math.max(latest - blockNumber + 1, 0),
      creditable: false,
      blockNumber,
      timestamp: 0,
      from: '0x' + String(l.topics?.[1] ?? '').slice(26),
    })
  }

  return { txs, unlisted }
}

/* --------------------------------- SOLANA --------------------------------- */

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Decode(s: string): Uint8Array | null {
  const bytes: number[] = []
  for (const ch of s) {
    let carry = B58.indexOf(ch)
    if (carry < 0) return null
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  for (let i = 0; i < s.length && s[i] === '1'; i++) bytes.push(0)
  return new Uint8Array(bytes.reverse())
}

function isValidSolanaAddress(address: unknown): address is string {
  if (typeof address !== 'string') return false
  const a = address.trim()
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return false
  return base58Decode(a)?.length === 32
}

async function scanSolana(address: string, untilSignature?: string, includeUnlisted = false) {
  if (!isValidSolanaAddress(address)) {
    throw new UpstreamError(`SOL: invalid address format: "${address}" — expected base58 public key`, 400, false)
  }
  const url = NET.SOL()
  const sigs: any[] = await rpc(url, 'getSignaturesForAddress',
    [address, { limit: 50, ...(untilSignature ? { until: untilSignature } : {}) }], 'SOL')

  const finalizedSlot = Number(await rpc(url, 'getSlot', [{ commitment: 'finalized' }], 'SOL').catch(() => 0))

  const txs: Deposit[] = []
  const unlisted: UnlistedTransfer[] = []

  for (const s of sigs) {
    if (s.err) continue
    const tx = await rpc(url, 'getTransaction',
      [s.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }], 'SOL')
    if (!tx?.meta || tx.meta.err) continue

    const finalized = s.confirmationStatus === 'finalized'
    const confirmations = finalized ? MIN_CONFIRMATIONS.SOL : 1
    const keys = (tx.transaction?.message?.accountKeys ?? []).map((k: any) => (typeof k === 'string' ? k : k.pubkey))

    // 1) native SOL delta on the owner account
    const i = keys.indexOf(address)
    if (i >= 0) {
      const delta = BigInt(tx.meta.postBalances?.[i] ?? 0) - BigInt(tx.meta.preBalances?.[i] ?? 0)
      if (delta > 0n) {
        txs.push({
          depositId: `SOL:${s.signature}:native`,
          txHash: s.signature,
          index: 0,
          amount: fromUnits(delta, 9),
          amountRaw: delta.toString(),
          asset: 'SOL',
          decimals: 9,
          confirmations,
          creditable: false,
          blockNumber: s.slot,
          timestamp: s.blockTime ?? 0,
        })
      }
    }

    // 2) SPL token deltas (USDT / USDC).
    // FIX: this was missing entirely — every stablecoin deposit on Solana
    // went undetected because only the native lamport delta was inspected.
    const pre = new Map<number, any>()
    for (const b of tx.meta.preTokenBalances ?? []) pre.set(b.accountIndex, b)
    for (const post of tx.meta.postTokenBalances ?? []) {
      if (post.owner !== address) continue
      const before = BigInt(pre.get(post.accountIndex)?.uiTokenAmount?.amount ?? '0')
      const after = BigInt(post.uiTokenAmount?.amount ?? '0')
      const delta = after - before
      if (delta <= 0n) continue

      const def = lookupToken('SOL', post.mint)
      if (!def) {
        if (includeUnlisted || unlisted.length < 25) {
          unlisted.push({
            txHash: s.signature,
            index: post.accountIndex,
            contract: post.mint,
            amountRaw: delta.toString(),
            blockNumber: s.slot,
            reason: 'mint not on stablecoin allowlist',
          })
        }
        continue
      }
      const dec = post.uiTokenAmount?.decimals ?? def.decimals
      txs.push({
        depositId: `SOL:${s.signature}:${post.accountIndex}`,
        txHash: s.signature,
        index: post.accountIndex,
        amount: fromUnits(delta, dec),
        amountRaw: delta.toString(),
        asset: def.symbol,
        contract: post.mint,
        decimals: dec,
        confirmations,
        creditable: false,
        blockNumber: s.slot,
        timestamp: s.blockTime ?? 0,
      })
    }
  }

  const bal = await rpc(url, 'getBalance', [address], 'SOL')
  return {
    balance: fromUnits(BigInt(bal?.value ?? 0), 9),
    nativeSymbol: 'SOL',
    transactions: finalize('SOL', txs),
    unlisted,
    cursor: { latestSignature: sigs[0]?.signature ?? untilSignature ?? null, finalizedSlot: finalizedSlot || null },
  }
}

/* ---------------------------------- TRON ---------------------------------- */

function base58ToHex(addr: string): string {
  const decoded = base58Decode(addr)
  if (!decoded || decoded.length !== 25 || decoded[0] !== 0x41) {
    throw new UpstreamError(`invalid TRON address: ${addr}`, 400, false)
  }
  return Array.from(decoded.slice(0, 21), (b) => b.toString(16).padStart(2, '0')).join('')
}

async function scanTron(address: string, fromBlock?: number, includeUnlisted = false) {
  const url = NET.TRX()

  const acct = await httpJson(`${url}/wallet/getaccount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, visible: true }),
  }, 'TRX:getaccount')
  const balance = fromUnits(BigInt(acct?.balance ?? 0), 6)

  const hex41 = base58ToHex(address)
  const topicAddr = '0x' + hex41.slice(2).padStart(64, '0')
  const latest = Number(hexToBigInt(await rpc(url, 'eth_blockNumber', [], 'TRX')))
  const start = Math.max(fromBlock ?? latest - 1000, 0)

  const logs = await rpc(url, 'eth_getLogs', [{
    fromBlock: '0x' + BigInt(start).toString(16),
    toBlock: 'latest',
    topics: [TRANSFER_TOPIC, null, topicAddr],
  }], 'TRX')

  const txs: Deposit[] = []
  const unlisted: UnlistedTransfer[] = []

  for (const l of logs ?? []) {
    const blockNumber = Number(hexToBigInt(l.blockNumber))
    const logIndex = Number(hexToBigInt(l.logIndex))
    const contract = String(l.address ?? '').toLowerCase()
    const raw = hexToBigInt(l.data === '0x' ? '0x0' : l.data)
    const def = lookupToken('TRX', contract)
    const hash = String(l.transactionHash ?? '').replace(/^0x/, '')

    if (!def) {
      if (includeUnlisted || unlisted.length < 25) {
        unlisted.push({
          txHash: hash,
          index: logIndex,
          contract,
          amountRaw: raw.toString(),
          blockNumber,
          reason: 'TRC-20 contract not on stablecoin allowlist',
        })
      }
      continue
    }
    if (raw <= 0n) continue

    txs.push({
      depositId: `TRX:${hash}:${logIndex}`,
      txHash: hash,
      index: logIndex,
      // FIX: was labelled "TRC20" with decimals guessed from an RPC call.
      amount: fromUnits(raw, def.decimals),
      amountRaw: raw.toString(),
      asset: def.symbol,
      contract,
      decimals: def.decimals,
      confirmations: Math.max(latest - blockNumber + 1, 0),
      creditable: false,
      blockNumber,
      timestamp: 0,
      from: '41' + String(l.topics?.[1] ?? '').slice(26),
    })
  }

  return {
    balance,
    nativeSymbol: 'TRX',
    transactions: finalize('TRX', txs),
    unlisted,
    cursor: { latestBlock: latest, nextFromBlock: latest + 1 },
    note: 'native TRX transfers are not scanned here; TRC-20 (USDT/USDC) covered via logs',
  }
}

/* ============================ BALANCES MODE ============================== */

interface TokenBalance {
  symbol: string
  label?: string
  balance: string
  contract: string
  decimals: number
}

async function balancesEvm(chain: EvmChain, address: string) {
  const url = NET[chain]()
  const native = NATIVE[chain]
  const nativeRaw = hexToBigInt(await rpc(url, 'eth_getBalance', [address, 'latest'], chain))

  // FIX: query only allowlisted contracts. The old "erc20" sweep pulled in
  // spam tokens and trusted their self-reported symbol/decimals.
  const contracts = Object.keys(TOKENS[chain])
  const tokens: TokenBalance[] = []
  if (contracts.length) {
    const res = await rpc(url, 'alchemy_getTokenBalances', [address, contracts], chain)
    for (const t of res?.tokenBalances ?? []) {
      if (t.error) continue
      const raw = hexToBigInt(t.tokenBalance)
      if (raw <= 0n) continue
      const def = lookupToken(chain, t.contractAddress)
      if (!def) continue
      tokens.push({
        symbol: def.symbol,
        label: def.label,
        balance: fromUnits(raw, def.decimals),
        contract: String(t.contractAddress).toLowerCase(),
        decimals: def.decimals,
      })
    }
  }

  return {
    native: { symbol: native.symbol, balance: fromUnits(nativeRaw, native.decimals), decimals: native.decimals },
    tokens,
  }
}

async function balancesSolana(address: string) {
  if (!isValidSolanaAddress(address)) {
    throw new UpstreamError(`SOL: invalid address format: "${address}" — expected base58 public key`, 400, false)
  }
  const url = NET.SOL()
  const bal = await rpc(url, 'getBalance', [address], 'SOL')
  const accounts = await rpc(url, 'getTokenAccountsByOwner', [
    address,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    { encoding: 'jsonParsed' },
  ], 'SOL')

  const tokens: TokenBalance[] = []
  for (const acc of accounts?.value ?? []) {
    const info = acc.account?.data?.parsed?.info
    const amount = info?.tokenAmount
    if (!info?.mint || !amount) continue
    if (BigInt(amount.amount ?? '0') <= 0n) continue
    const def = lookupToken('SOL', info.mint)
    if (!def) continue
    const dec = amount.decimals ?? def.decimals
    tokens.push({
      symbol: def.symbol,
      // FIX: uiAmountString is a float-formatted value; use raw units.
      balance: fromUnits(BigInt(amount.amount ?? '0'), dec),
      contract: info.mint,
      decimals: dec,
    })
  }

  return { native: { symbol: 'SOL', balance: fromUnits(BigInt(bal?.value ?? 0), 9), decimals: 9 }, tokens }
}

async function balancesTron(address: string) {
  const url = NET.TRX()
  const acct = await httpJson(`${url}/wallet/getaccount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, visible: true }),
  }, 'TRX:getaccount')

  const tokens: TokenBalance[] = []
  for (const entry of acct?.trc20 ?? []) {
    for (const [contract, raw] of Object.entries(entry as Record<string, string>)) {
      if (!raw || BigInt(raw) <= 0n) continue
      const def = lookupToken('TRX', contract)
      if (!def) continue
      tokens.push({
        symbol: def.symbol,
        balance: fromUnits(BigInt(raw), def.decimals),
        contract,
        decimals: def.decimals,
      })
    }
  }

  return { native: { symbol: 'TRX', balance: fromUnits(BigInt(acct?.balance ?? 0), 6), decimals: 6 }, tokens }
}

async function getBalances(key: ChainKey, address: string) {
  switch (key) {
    case 'BTC': {
      const scan = await scanBitcoin(address)
      return {
        native: { symbol: 'BTC', balance: scan.balance, decimals: 8 },
        tokens: [] as TokenBalance[],
        unconfirmed: scan.unconfirmed,
        provider: scan.provider,
      }
    }
    case 'XRP': {
      const scan = await scanXrp(address)
      return {
        native: { symbol: 'XRP', balance: scan.balance, decimals: 6 },
        tokens: [] as TokenBalance[],
        reserve: scan.reserve,
        accountFunded: scan.accountFunded,
        provider: scan.provider,
      }
    }
    case 'SOL':
      return await balancesSolana(address)
    case 'TRX':
      return await balancesTron(address)
    default:
      return await balancesEvm(key, address)
  }
}

const ALCHEMY_CHAINS = ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'SOL', 'TRX']
const CHAIN_KEYS: ChainKey[] = ['BTC', 'XRP', 'ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'SOL', 'TRX']

function normalizeChain(input: string): ChainKey | null {
  const c = input.toUpperCase()
  const key = ['BITCOIN', 'BTC'].includes(c) ? 'BTC'
    : ['RIPPLE', 'XRP', 'XRPL'].includes(c) ? 'XRP'
    : ['ETHEREUM', 'ETH', 'ERC20'].includes(c) ? 'ETH'
    : ['BNB', 'BSC', 'BINANCE', 'BEP20'].includes(c) ? 'BSC'
    : ['MATIC', 'POLYGON', 'POL'].includes(c) ? 'POLYGON'
    : ['ARB', 'ARBITRUM', 'ARBITRUM_ONE'].includes(c) ? 'ARBITRUM'
    : ['OP', 'OPTIMISM'].includes(c) ? 'OPTIMISM'
    : ['SOLANA', 'SOL', 'SPL'].includes(c) ? 'SOL'
    : ['TRON', 'TRX', 'TRC20'].includes(c) ? 'TRX'
    : c
  return CHAIN_KEYS.includes(key as ChainKey) ? (key as ChainKey) : null
}

Deno.serve(async (req) => {
  const corsHeaders = cors(req)
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed', retryable: false }, 405)

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON body', retryable: false }, 400)
  }

  const {
    address: rawAddress, chain, fromBlock, sinceSignature, ledgerIndexMin,
    page, afterTxid, mode, includeUnlisted,
  } = payload ?? {}
  if (!rawAddress || !chain) return json({ success: false, error: 'Missing address or chain', retryable: false }, 400)

  const address = String(rawAddress).trim()
  const key = normalizeChain(String(chain))
  if (!key) return json({ success: false, error: `Unsupported chain: ${chain}`, retryable: false }, 400)

  if (!KEY && ALCHEMY_CHAINS.includes(key)) {
    return json({ success: false, error: 'ALCHEMYS_API_KEY is not configured', retryable: false }, 500)
  }

  if (mode !== 'deposits') {
    try {
      const result = await getBalances(key, address)
      return json({ success: true, chain: key, address, ...result, scannedAt: new Date().toISOString() })
    } catch (e) {
      const err = e instanceof UpstreamError ? e : new UpstreamError(e instanceof Error ? e.message : String(e))
      console.error(`[${key}] balances failed:`, err.message)
      return json({ success: false, chain: key, address, error: err.message, retryable: err.retryable }, err.status)
    }
  }

  try {
    let result: any
    switch (key) {
      case 'BTC':
        result = await scanBitcoin(address, page ?? 1, afterTxid)
        break
      case 'XRP':
        result = await scanXrp(address, ledgerIndexMin)
        break
      case 'SOL':
        result = await scanSolana(address, sinceSignature, includeUnlisted === true)
        break
      case 'TRX':
        result = await scanTron(address, fromBlock, includeUnlisted === true)
        break
      default:
        result = await scanEvm(key, address, fromBlock, includeUnlisted === true)
        break
    }

    const creditable = result.transactions.filter((t: Deposit) => t.creditable).length
    console.log(
      `[${key}] ${address} balance=${result.balance} deposits=${result.transactions.length} ` +
      `creditable=${creditable} unlisted=${result.unlisted?.length ?? 0}`,
    )
    return json({
      success: true,
      chain: key,
      address,
      minConfirmations: MIN_CONFIRMATIONS[key],
      ...result,
      scannedAt: new Date().toISOString(),
    })
  } catch (e) {
    const err = e instanceof UpstreamError ? e : new UpstreamError(e instanceof Error ? e.message : String(e))
    console.error(`[${key}] scan failed:`, err.message)
    return json({ success: false, chain: key, address, error: err.message, retryable: err.retryable }, err.status)
  }
})
