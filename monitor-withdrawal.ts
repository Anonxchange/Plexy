// monitor-withdrawal — multi-chain outbound payout tracker (standalone, no shared imports)
//
// Deliberately a separate function from monitor-deposits. Deposits answer
// "did money arrive at an address we own?"; withdrawals answer "did the exact
// transaction we broadcast settle, fail, get dropped, or get replaced?".
// Different inputs, different failure modes, different money risk.
//
// Chains: BTC, XRP, ETH, BSC, POLYGON, ARBITRUM, OPTIMISM, SOL, TRX
// Assets: native coin + allowlisted stablecoins (USDT / USDC).
//
// Secrets: ALCHEMYS_API_KEY (EVM/SOL/TRX), TATUM_API_KEY (optional, BTC primary)
//
// Request:  POST {
//   chain, txHash,
//   fromAddress?,               // required for EVM replacement/drop detection
//   nonce?,                     // EVM: the nonce this tx was signed with
//   broadcastAt?,               // unix seconds; enables "stuck"/"dropped" verdicts
//   expected?: {                // optional payout assertion
//     toAddress?, amount?, asset?, contract?, destinationTag?
//   }
// }
//
// Response: {
//   success, chain, txHash,
//   status: "pending" | "mined" | "confirmed" | "failed" | "dropped" | "replaced" | "unknown",
//   settled: boolean,           // true ONLY for status "confirmed" — the single flag
//                               // the ledger should act on to mark a payout complete
//   terminalFailure: boolean,   // safe to release the reserved balance / retry payout
//   confirmations, required, blockNumber, fee, effectiveAmount, recipient,
//   assertion: { checked, matches, mismatches[] },
//   stuckSeconds, scannedAt
// }
//   on failure: { success:false, error, retryable } with HTTP 4xx/502.
//
// NEVER treat an error response, or status "unknown"/"pending", as a completed
// payout, and never re-broadcast on those. Only `terminalFailure: true` means
// the funds definitively did not move.

// ── CORS: pexly.app + www.pexly.app ONLY ────────────────────────────────────
// No wildcard, no "default" origin. An origin that is not on this list gets NO
// Access-Control-Allow-Origin header at all, so the browser drops the response,
// and the request is additionally rejected with 403 below.
const ALLOWED_ORIGINS = ['https://pexly.app', 'https://www.pexly.app'] as const

function isAllowedOrigin(origin: string | null): boolean {
  return !!origin && (ALLOWED_ORIGINS as readonly string[]).includes(origin)
}

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin',
  }
  if (isAllowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin as string
  return headers
}

/** Browser calls must come from a pexly.app origin. Requests with no Origin
 *  header (cron, other edge functions, server-to-server) are only accepted
 *  when they carry an Authorization bearer — otherwise the missing-Origin case
 *  would be a free bypass of the allowlist. */
function isRequestAllowed(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (origin !== null) return isAllowedOrigin(origin)
  return !!req.headers.get('authorization')
}

const KEY = Deno.env.get('ALCHEMYS_API_KEY') ?? Deno.env.get('ALCHEMY_API_KEY') ?? ''
const TATUM_KEY = Deno.env.get('TATUM_API_KEY') ?? ''

const NET = {
  ETH: () => `https://eth-mainnet.g.alchemy.com/v2/${KEY}`,
  BSC: () => `https://bnb-mainnet.g.alchemy.com/v2/${KEY}`,
  POLYGON: () => `https://polygon-mainnet.g.alchemy.com/v2/${KEY}`,
  ARBITRUM: () => `https://arb-mainnet.g.alchemy.com/v2/${KEY}`,
  OPTIMISM: () => `https://opt-mainnet.g.alchemy.com/v2/${KEY}`,
  AVAX: () => `https://avax-mainnet.g.alchemy.com/v2/${KEY}`,
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

type EvmChain = 'ETH' | 'BSC' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM' | 'AVAX'
type ChainKey = EvmChain | 'BTC' | 'XRP' | 'SOL' | 'TRX'

const NATIVE: Record<ChainKey, { symbol: string; decimals: number }> = {
  BTC: { symbol: 'BTC', decimals: 8 },
  XRP: { symbol: 'XRP', decimals: 6 },
  ETH: { symbol: 'ETH', decimals: 18 },
  BSC: { symbol: 'BNB', decimals: 18 },
  POLYGON: { symbol: 'POL', decimals: 18 },
  ARBITRUM: { symbol: 'ETH', decimals: 18 },
  OPTIMISM: { symbol: 'ETH', decimals: 18 },
  AVAX: { symbol: 'AVAX', decimals: 18 },
  SOL: { symbol: 'SOL', decimals: 9 },
  TRX: { symbol: 'TRX', decimals: 6 },
}

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
  AVAX: {
    '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': { symbol: 'USDT', decimals: 6 },
    '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': { symbol: 'USDC', decimals: 6 },
    '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664': { symbol: 'USDC', decimals: 6, label: 'USDC.e' },
  },
  SOL: {
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: 'USDT', decimals: 6 },
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: 'USDC', decimals: 6 },
  },
  TRX: {
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

/** Confirmations before an outbound transfer is reported as settled.
 *
 *  NON-CUSTODIAL MODEL, matched to the deposit table (see monitor-deposits for
 *  the per-chain reasoning and sources). A self-custody wallet is reporting
 *  "your transaction went through", not releasing someone else's money, so the
 *  bar is each chain's own inclusion/finality signal:
 *    BTC 1 (mined), XRP 1 (validated ledger), ETH 1 slot, BSC 3 (~0.65s fast
 *    finality), POLYGON 5 (milestone finality 2-5s), ARBITRUM/OPTIMISM 1
 *    (sequencer soft-confirm), AVAX 2, SOL 32 (`finalized` commitment sentinel),
 *    TRX 19 (solidified by 2/3+1 SRs).
 *  ETH keeps 2 and AVAX 2 purely so a one-block reorg cannot flip an already
 *  reported "confirmed" payout back to pending.
 *  Raise per chain with WITHDRAWAL_MIN_CONF_<CHAIN> if a policy needs it.
 */
const REQUIRED_CONFIRMATIONS_DEFAULT: Record<ChainKey, number> = {
  BTC: 1,
  XRP: 1,
  ETH: 2,
  BSC: 3,
  POLYGON: 5,
  ARBITRUM: 1,
  OPTIMISM: 1,
  AVAX: 2,
  SOL: 32,
  TRX: 19,
}

/** Per-chain override, e.g. WITHDRAWAL_MIN_CONF_BTC=1. Never below 1 —
 *  zero-conf money is not money (same rule Trust Wallet applies). */
const REQUIRED_CONFIRMATIONS: Record<ChainKey, number> = Object.fromEntries(
  (Object.keys(REQUIRED_CONFIRMATIONS_DEFAULT) as ChainKey[]).map((c) => {
    const raw = Number(Deno.env.get(`WITHDRAWAL_MIN_CONF_${c}`) ?? NaN)
    return [c, Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : REQUIRED_CONFIRMATIONS_DEFAULT[c]]
  }),
) as Record<ChainKey, number>

/** Confirmations at which a transfer is shown in the balance/activity UI.
 *  Trust Wallet surfaces funds as soon as they are in a block (1 conf) and
 *  only gates spending and crediting on the deeper threshold above. */
const VISIBLE_CONFIRMATIONS = 1

/** Past this age with no inclusion, a still-pending tx is reported as stuck. */
const STUCK_AFTER_SECONDS = 20 * 60

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
      // 404 is meaningful here: "this tx is not known to the indexer".
      if (res.status === 404) throw new UpstreamError(`${label}: NOT_FOUND`, 404, false)
      if (!res.ok) throw new UpstreamError(`${label}: HTTP ${res.status} ${text.slice(0, 200)}`, 502, false)
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
  let sawNotFound = false
  for (const p of providers) {
    try {
      return { result: await p.run(), provider: p.name }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('NOT_FOUND')) sawNotFound = true
      errors.push(`${p.name}: ${msg}`)
      console.warn(`[${label}] provider ${p.name} failed: ${msg}`)
    }
  }
  if (sawNotFound) throw new UpstreamError(`${label}: NOT_FOUND`, 404, false)
  throw new UpstreamError(`${label}: all providers failed -> ${errors.join(' | ')}`, 502, true)
}

function fromUnits(raw: bigint, decimals: number): string {
  const neg = raw < 0n
  const v = neg ? -raw : raw
  const base = 10n ** BigInt(decimals)
  const whole = v / base
  const frac = (v % base).toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${neg ? '-' : ''}${whole}${frac ? '.' + frac : ''}`
}

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

type Status = 'pending' | 'mined' | 'confirmed' | 'failed' | 'dropped' | 'replaced' | 'unknown'

interface Expected {
  toAddress?: string
  amount?: string
  asset?: string
  contract?: string
  destinationTag?: number
}

interface Outcome {
  status: Status
  confirmations: number
  blockNumber?: number
  timestamp?: number
  /** Amount actually delivered, in decimal units. */
  effectiveAmount?: string
  effectiveAmountRaw?: string
  asset?: string
  contract?: string
  recipient?: string
  destinationTag?: number
  fee?: string
  feeAsset?: string
  /** Why the tx failed, verbatim from the chain where available. */
  failureReason?: string
  replacedBy?: string
  provider?: string
  note?: string
}

function normalizeAmount(a: unknown, decimals: number): string | null {
  if (a === undefined || a === null || a === '') return null
  return fromUnits(toUnits(a, decimals), decimals)
}

/** Compare the settled transaction against what the payout record promised. */
function assertExpectations(chain: ChainKey, o: Outcome, expected?: Expected) {
  const mismatches: string[] = []
  if (!expected || Object.keys(expected).length === 0) {
    return { checked: false, matches: true, mismatches }
  }

  if (expected.toAddress && o.recipient) {
    const a = expected.toAddress.trim()
    const b = o.recipient.trim()
    const same = chain === 'BTC' || chain === 'XRP' || chain === 'SOL' || chain === 'TRX'
      ? a === b
      : a.toLowerCase() === b.toLowerCase()
    if (!same) mismatches.push(`recipient: expected ${a}, on-chain ${b}`)
  }

  if (expected.amount && o.effectiveAmount) {
    const decimals = lookupToken(chain, expected.contract ?? o.contract)?.decimals ?? NATIVE[chain].decimals
    const want = normalizeAmount(expected.amount, decimals)
    const got = normalizeAmount(o.effectiveAmount, decimals)
    if (want !== got) mismatches.push(`amount: expected ${want}, on-chain ${got}`)
  }

  if (expected.asset && o.asset && expected.asset.toUpperCase() !== o.asset.toUpperCase()) {
    mismatches.push(`asset: expected ${expected.asset}, on-chain ${o.asset}`)
  }

  if (expected.contract && o.contract && expected.contract.toLowerCase() !== o.contract.toLowerCase()) {
    mismatches.push(`contract: expected ${expected.contract}, on-chain ${o.contract}`)
  }

  if (typeof expected.destinationTag === 'number' && expected.destinationTag !== o.destinationTag) {
    mismatches.push(`destinationTag: expected ${expected.destinationTag}, on-chain ${o.destinationTag ?? 'none'}`)
  }

  return { checked: true, matches: mismatches.length === 0, mismatches }
}

/* --------------------------------- EVM ------------------------------------ */

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

async function trackEvm(
  chain: EvmChain,
  txHash: string,
  fromAddress?: string,
  nonce?: number,
  broadcastAt?: number,
): Promise<Outcome> {
  const url = NET[chain]()
  const native = NATIVE[chain]
  const latest = Number(hexToBigInt(await rpc(url, 'eth_blockNumber', [], chain)))

  const tx = await rpc(url, 'eth_getTransactionByHash', [txHash], chain)

  if (!tx) {
    // Not in a block and not in the mempool. Either it never propagated, it
    // was evicted, or it was replaced by a same-nonce tx (RBF / fee bump /
    // cancel). Nonce comparison is the only reliable way to tell.
    if (fromAddress && typeof nonce === 'number') {
      const mined = Number(hexToBigInt(await rpc(url, 'eth_getTransactionCount', [fromAddress, 'latest'], chain)))
      if (mined > nonce) {
        return {
          status: 'replaced',
          confirmations: 0,
          note: `nonce ${nonce} already consumed by another transaction from ${fromAddress} ` +
            `(account nonce is now ${mined}); this hash will never confirm. ` +
            `Find the mined tx at that nonce before re-sending — the payout may already be out.`,
        }
      }
    }
    const age = broadcastAt ? Math.floor(Date.now() / 1000) - broadcastAt : 0
    return {
      status: broadcastAt && age > STUCK_AFTER_SECONDS ? 'dropped' : 'unknown',
      confirmations: 0,
      note: 'transaction not found in mempool or chain state',
    }
  }

  if (!tx.blockNumber) {
    return {
      status: 'pending',
      confirmations: 0,
      recipient: tx.to ?? undefined,
      note: 'in mempool, not yet included in a block',
    }
  }

  const receipt = await rpc(url, 'eth_getTransactionReceipt', [txHash], chain)
  if (!receipt) {
    return { status: 'pending', confirmations: 0, recipient: tx.to ?? undefined, note: 'receipt not yet available' }
  }

  const blockNumber = Number(hexToBigInt(receipt.blockNumber))
  const confirmations = Math.max(latest - blockNumber + 1, 0)
  const gasUsed = hexToBigInt(receipt.gasUsed)
  const gasPrice = hexToBigInt(receipt.effectiveGasPrice ?? tx.gasPrice)
  const fee = fromUnits(gasUsed * gasPrice, native.decimals)

  // status 0x0 = reverted on-chain. Gas was burned but no value moved.
  if (hexToBigInt(receipt.status) === 0n) {
    return {
      status: 'failed',
      confirmations,
      blockNumber,
      fee,
      feeAsset: native.symbol,
      recipient: tx.to ?? undefined,
      failureReason: 'transaction reverted (receipt status 0x0) — no value transferred, gas consumed',
    }
  }

  const required = REQUIRED_CONFIRMATIONS[chain]
  const settledStatus: Status = confirmations >= required ? 'confirmed' : 'mined'

  // Token payout: read the actual Transfer log rather than trusting the calldata.
  const def = lookupToken(chain, tx.to ?? undefined)
  if (def) {
    const log = (receipt.logs ?? []).find(
      (l: any) =>
        String(l.address ?? '').toLowerCase() === String(tx.to).toLowerCase() &&
        String(l.topics?.[0] ?? '').toLowerCase() === TRANSFER_TOPIC,
    )
    if (log) {
      const raw = hexToBigInt(log.data === '0x' ? '0x0' : log.data)
      return {
        status: settledStatus,
        confirmations,
        blockNumber,
        effectiveAmount: fromUnits(raw, def.decimals),
        effectiveAmountRaw: raw.toString(),
        asset: def.symbol,
        contract: String(tx.to).toLowerCase(),
        recipient: '0x' + String(log.topics?.[2] ?? '').slice(26),
        fee,
        feeAsset: native.symbol,
      }
    }
    return {
      status: settledStatus,
      confirmations,
      blockNumber,
      asset: def.symbol,
      contract: String(tx.to).toLowerCase(),
      recipient: tx.to ?? undefined,
      fee,
      feeAsset: native.symbol,
      note: 'succeeded but no matching Transfer log found — verify manually before settling',
    }
  }

  const value = hexToBigInt(tx.value)
  return {
    status: settledStatus,
    confirmations,
    blockNumber,
    effectiveAmount: fromUnits(value, native.decimals),
    effectiveAmountRaw: value.toString(),
    asset: native.symbol,
    recipient: tx.to ?? undefined,
    fee,
    feeAsset: native.symbol,
  }
}

/* --------------------------------- BITCOIN -------------------------------- */

function tatumHeaders() {
  return { 'x-api-key': TATUM_KEY, 'Content-Type': 'application/json' }
}

async function trackBitcoinEsplora(base: string, txHash: string): Promise<Outcome> {
  const tx = await httpJson(`${base}/tx/${txHash}`, {}, `btc:${base}:tx`, 2)
  const tipStr = await (async () => {
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
  })()
  const tip = Number(tipStr) || 0
  const height = tx.status?.block_height ?? 0
  const confirmed = tx.status?.confirmed === true
  const confirmations = confirmed && tip > 0 && height > 0 ? Math.max(tip - height + 1, 0) : 0

  // Largest non-change output is the payout; the caller's `expected.toAddress`
  // assertion is what actually validates it.
  let best: { addr?: string; value: bigint } = { value: 0n }
  for (const v of tx.vout ?? []) {
    const val = BigInt(v.value ?? 0)
    if (val > best.value) best = { addr: v.scriptpubkey_address, value: val }
  }

  return {
    status: !confirmed ? 'pending' : confirmations >= REQUIRED_CONFIRMATIONS.BTC ? 'confirmed' : 'mined',
    confirmations,
    blockNumber: height || undefined,
    timestamp: tx.status?.block_time ?? undefined,
    effectiveAmount: fromUnits(best.value, 8),
    effectiveAmountRaw: best.value.toString(),
    asset: 'BTC',
    recipient: best.addr,
    fee: fromUnits(BigInt(tx.fee ?? 0), 8),
    feeAsset: 'BTC',
    note: !confirmed ? 'in mempool — RBF replacement still possible until confirmed' : undefined,
  }
}

async function trackBitcoinTatum(txHash: string): Promise<Outcome> {
  if (!TATUM_KEY) throw new UpstreamError('TATUM_API_KEY not configured', 502, false)
  const tx = await httpJson(`${TATUM_BASE}/transaction/${txHash}`, { headers: tatumHeaders() }, 'btc:tatum:tx', 2)
  const info = await httpJson(`${TATUM_BASE}/info`, { headers: tatumHeaders() }, 'btc:tatum:info', 2).catch(() => null)
  const tip = Number(info?.blocks ?? 0)
  const height = Number(tx?.blockNumber ?? 0)
  const confirmations = height > 0 && tip > 0 ? Math.max(tip - height + 1, 0) : 0

  let best: { addr?: string; value: bigint } = { value: 0n }
  for (const out of tx?.outputs ?? []) {
    const val = toUnits(out.value, 8)
    if (val > best.value) best = { addr: out.address, value: val }
  }

  return {
    status: height <= 0 ? 'pending' : confirmations >= REQUIRED_CONFIRMATIONS.BTC ? 'confirmed' : 'mined',
    confirmations,
    blockNumber: height || undefined,
    timestamp: Number(tx?.time ?? tx?.blockTime ?? 0) || undefined,
    effectiveAmount: fromUnits(best.value, 8),
    effectiveAmountRaw: best.value.toString(),
    asset: 'BTC',
    recipient: best.addr,
    fee: tx?.fee !== undefined ? fromUnits(toUnits(tx.fee, 8), 8) : undefined,
    feeAsset: 'BTC',
  }
}

async function trackBitcoin(txHash: string, broadcastAt?: number): Promise<Outcome> {
  if (!/^[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new UpstreamError(`BTC: invalid txid "${txHash}"`, 400, false)
  }
  try {
    const { result, provider } = await withFallback('BTC', [
      ...(TATUM_KEY ? [{ name: 'tatum', run: () => trackBitcoinTatum(txHash) }] : []),
      ...BTC_PUBLIC_ESPLORA.map((base) => ({
        name: base.replace('https://', ''),
        run: () => trackBitcoinEsplora(base, txHash),
      })),
    ])
    return { ...result, provider }
  } catch (e) {
    if (e instanceof UpstreamError && e.status === 404) {
      const age = broadcastAt ? Math.floor(Date.now() / 1000) - broadcastAt : 0
      return {
        status: broadcastAt && age > STUCK_AFTER_SECONDS ? 'dropped' : 'unknown',
        confirmations: 0,
        note: 'txid unknown to every indexer — never relayed, evicted from mempool, or replaced via RBF',
      }
    }
    throw e
  }
}

/* ----------------------------------- XRP ----------------------------------- */

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
    if (err === 'txnNotFound') throw new UpstreamError(`XRP:${method}: NOT_FOUND`, 404, false)
    throw new UpstreamError(`XRP:${method} error ${err}: ${result.error_message ?? ''}`, 502, err !== 'invalidParams')
  }
  return result
}

async function trackXrpNode(node: string, txHash: string): Promise<Outcome> {
  const res: any = await xrpCall(node, 'tx', { transaction: txHash, binary: false })
  const t = res?.tx_json ?? res
  const meta = res?.meta ?? res?.metaData ?? {}
  const validated = res?.validated === true
  const engine = String(meta.TransactionResult ?? '')

  if (!validated) {
    return { status: 'pending', confirmations: 0, note: 'submitted but not yet in a validated ledger' }
  }
  if (engine && engine !== 'tesSUCCESS') {
    return {
      status: 'failed',
      confirmations: 1,
      blockNumber: Number(res?.ledger_index ?? t?.ledger_index ?? 0) || undefined,
      failureReason: `ledger result ${engine} — the fee was burned but no payment was delivered`,
      fee: t?.Fee ? fromUnits(BigInt(t.Fee), 6) : undefined,
      feeAsset: 'XRP',
    }
  }

  const delivered = meta.delivered_amount ?? meta.DeliveredAmount ?? t?.Amount
  const isXrp = typeof delivered === 'string'
  return {
    status: 'confirmed',
    confirmations: 1,
    blockNumber: Number(res?.ledger_index ?? t?.ledger_index ?? 0) || undefined,
    timestamp: t?.date ? Number(t.date) + 946684800 : undefined,
    effectiveAmount: isXrp ? fromUnits(BigInt(delivered), 6) : undefined,
    effectiveAmountRaw: isXrp ? String(delivered) : undefined,
    asset: isXrp ? 'XRP' : String((delivered as any)?.currency ?? 'IOU'),
    recipient: t?.Destination,
    destinationTag: typeof t?.DestinationTag === 'number' ? t.DestinationTag : undefined,
    fee: t?.Fee ? fromUnits(BigInt(t.Fee), 6) : undefined,
    feeAsset: 'XRP',
    note: isXrp ? undefined : 'delivered an issued currency, not native XRP',
  }
}

async function trackXrp(txHash: string, broadcastAt?: number): Promise<Outcome> {
  if (!/^[0-9A-Fa-f]{64}$/.test(txHash)) {
    throw new UpstreamError(`XRP: invalid transaction hash "${txHash}"`, 400, false)
  }
  try {
    const { result, provider } = await withFallback(
      'XRP',
      XRP_PUBLIC_NODES.map((node) => ({
        name: node.replace('https://', ''),
        run: () => trackXrpNode(node, txHash.toUpperCase()),
      })),
    )
    return { ...result, provider }
  } catch (e) {
    if (e instanceof UpstreamError && e.status === 404) {
      const age = broadcastAt ? Math.floor(Date.now() / 1000) - broadcastAt : 0
      return {
        status: broadcastAt && age > STUCK_AFTER_SECONDS ? 'dropped' : 'unknown',
        confirmations: 0,
        note: 'hash unknown to the cluster — likely never relayed, or its LastLedgerSequence expired',
      }
    }
    throw e
  }
}

/* --------------------------------- SOLANA --------------------------------- */

async function trackSolana(signature: string, broadcastAt?: number): Promise<Outcome> {
  if (!/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(signature)) {
    throw new UpstreamError(`SOL: invalid signature "${signature}"`, 400, false)
  }
  const url = NET.SOL()

  const statuses = await rpc(url, 'getSignatureStatuses', [[signature], { searchTransactionHistory: true }], 'SOL')
  const st = statuses?.value?.[0]

  if (!st) {
    // Solana forgets unlanded transactions once the blockhash expires (~90s).
    const age = broadcastAt ? Math.floor(Date.now() / 1000) - broadcastAt : 0
    return {
      status: broadcastAt && age > 120 ? 'dropped' : 'unknown',
      confirmations: 0,
      note: 'signature not found; if it was broadcast over ~90s ago its blockhash has expired and it can never land',
    }
  }

  if (st.err) {
    return {
      status: 'failed',
      confirmations: st.confirmations ?? REQUIRED_CONFIRMATIONS.SOL,
      blockNumber: st.slot,
      failureReason: `transaction landed but errored: ${JSON.stringify(st.err)}`,
    }
  }

  const finalized = st.confirmationStatus === 'finalized'
  const tx = await rpc(url, 'getTransaction',
    [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }], 'SOL')

  const base: Outcome = {
    status: finalized ? 'confirmed' : 'mined',
    confirmations: finalized ? REQUIRED_CONFIRMATIONS.SOL : (st.confirmations ?? 1),
    blockNumber: st.slot,
    timestamp: tx?.blockTime ?? undefined,
    fee: tx?.meta?.fee !== undefined ? fromUnits(BigInt(tx.meta.fee), 9) : undefined,
    feeAsset: 'SOL',
  }
  if (!tx?.meta) return { ...base, note: 'status known but full transaction not yet retrievable' }

  // SPL payout: find the destination token account whose balance increased.
  const pre = new Map<number, any>()
  for (const b of tx.meta.preTokenBalances ?? []) pre.set(b.accountIndex, b)
  for (const post of tx.meta.postTokenBalances ?? []) {
    const before = BigInt(pre.get(post.accountIndex)?.uiTokenAmount?.amount ?? '0')
    const after = BigInt(post.uiTokenAmount?.amount ?? '0')
    const delta = after - before
    if (delta <= 0n) continue
    const def = lookupToken('SOL', post.mint)
    const dec = post.uiTokenAmount?.decimals ?? def?.decimals ?? 0
    return {
      ...base,
      effectiveAmount: fromUnits(delta, dec),
      effectiveAmountRaw: delta.toString(),
      asset: def?.symbol ?? post.mint,
      contract: post.mint,
      recipient: post.owner,
    }
  }

  // Native SOL payout: largest positive lamport delta excluding the fee payer.
  const keys = (tx.transaction?.message?.accountKeys ?? []).map((k: any) => (typeof k === 'string' ? k : k.pubkey))
  let best = { i: -1, delta: 0n }
  for (let i = 1; i < keys.length; i++) {
    const delta = BigInt(tx.meta.postBalances?.[i] ?? 0) - BigInt(tx.meta.preBalances?.[i] ?? 0)
    if (delta > best.delta) best = { i, delta }
  }
  if (best.i >= 0) {
    return {
      ...base,
      effectiveAmount: fromUnits(best.delta, 9),
      effectiveAmountRaw: best.delta.toString(),
      asset: 'SOL',
      recipient: keys[best.i],
    }
  }

  return { ...base, note: 'no positive balance delta found — verify manually before settling' }
}

/* ---------------------------------- TRON ---------------------------------- */

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode(bytes: Uint8Array): string {
  let num = 0n
  for (const b of bytes) num = num * 256n + BigInt(b)
  let out = ''
  while (num > 0n) {
    out = B58[Number(num % 58n)] + out
    num /= 58n
  }
  for (const b of bytes) {
    if (b !== 0) break
    out = '1' + out
  }
  return out
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource))
}

/** 41-prefixed hex TRON address -> base58check, so recipients are comparable. */
async function hexToBase58Tron(hex41: string): Promise<string> {
  const clean = hex41.replace(/^0x/, '').toLowerCase()
  const body = clean.length === 40 ? '41' + clean : clean
  if (body.length !== 42) return hex41
  const raw = new Uint8Array(21)
  for (let i = 0; i < 21; i++) raw[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16)
  const checksum = (await sha256(await sha256(raw))).slice(0, 4)
  const full = new Uint8Array(25)
  full.set(raw, 0)
  full.set(checksum, 21)
  return base58Encode(full)
}

async function trackTron(txHash: string, broadcastAt?: number): Promise<Outcome> {
  const hash = txHash.replace(/^0x/, '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(hash)) {
    throw new UpstreamError(`TRX: invalid transaction id "${txHash}"`, 400, false)
  }
  const url = NET.TRX()

  const tx = await httpJson(`${url}/wallet/gettransactionbyid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: hash }),
  }, 'TRX:gettransactionbyid')

  if (!tx || Object.keys(tx).length === 0) {
    const age = broadcastAt ? Math.floor(Date.now() / 1000) - broadcastAt : 0
    return {
      status: broadcastAt && age > STUCK_AFTER_SECONDS ? 'dropped' : 'unknown',
      confirmations: 0,
      note: 'txid unknown to the node — never relayed, or its reference block expired',
    }
  }

  const contractRet = tx?.ret?.[0]?.contractRet
  const info = await httpJson(`${url}/wallet/gettransactioninfobyid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: hash }),
  }, 'TRX:gettransactioninfobyid').catch(() => null)

  if (!info || info.blockNumber === undefined) {
    return { status: 'pending', confirmations: 0, note: 'broadcast but not yet included in a block' }
  }

  const blockNumber = Number(info.blockNumber)
  const latest = Number(hexToBigInt(await rpc(url, 'eth_blockNumber', [], 'TRX').catch(() => '0x0')))
  const confirmations = latest > 0 ? Math.max(latest - blockNumber + 1, 0) : 0
  const fee = fromUnits(BigInt(info.fee ?? 0), 6)

  if (contractRet && contractRet !== 'SUCCESS') {
    return {
      status: 'failed',
      confirmations,
      blockNumber,
      fee,
      feeAsset: 'TRX',
      failureReason: `contractRet ${contractRet}${info.resMessage ? `: ${info.resMessage}` : ''}`,
    }
  }
  // OUT_OF_ENERGY on a TRC-20 send burns the fee and moves nothing.
  if (info.receipt?.result && info.receipt.result !== 'SUCCESS') {
    return {
      status: 'failed',
      confirmations,
      blockNumber,
      fee,
      feeAsset: 'TRX',
      failureReason: `energy receipt ${info.receipt.result} — TRC-20 transfer reverted`,
    }
  }

  const settled: Status = confirmations >= REQUIRED_CONFIRMATIONS.TRX ? 'confirmed' : 'mined'

  // TRC-20 payout via the Transfer log.
  const log = (info.log ?? []).find(
    (l: any) => String(l.topics?.[0] ?? '').toLowerCase() === TRANSFER_TOPIC.replace(/^0x/, ''),
  )
  if (log) {
    const contractHex = '41' + String(log.address ?? '')
    const def = lookupToken('TRX', '0x' + String(log.address ?? '').toLowerCase())
    const raw = hexToBigInt('0x' + String(log.data ?? '0'))
    const dec = def?.decimals ?? 6
    return {
      status: settled,
      confirmations,
      blockNumber,
      timestamp: info.blockTimeStamp ? Math.floor(Number(info.blockTimeStamp) / 1000) : undefined,
      effectiveAmount: fromUnits(raw, dec),
      effectiveAmountRaw: raw.toString(),
      asset: def?.symbol ?? 'TRC20',
      contract: await hexToBase58Tron(contractHex),
      recipient: await hexToBase58Tron('41' + String(log.topics?.[2] ?? '').slice(24)),
      fee,
      feeAsset: 'TRX',
      note: def ? undefined : 'TRC-20 contract is not on the stablecoin allowlist — do not settle without review',
    }
  }

  // Native TRX payout.
  const param = tx?.raw_data?.contract?.[0]?.parameter?.value ?? {}
  const amount = BigInt(param.amount ?? 0)
  return {
    status: settled,
    confirmations,
    blockNumber,
    timestamp: info.blockTimeStamp ? Math.floor(Number(info.blockTimeStamp) / 1000) : undefined,
    effectiveAmount: fromUnits(amount, 6),
    effectiveAmountRaw: amount.toString(),
    asset: 'TRX',
    recipient: param.to_address ? await hexToBase58Tron(param.to_address) : undefined,
    fee,
    feeAsset: 'TRX',
  }
}

/* ---------------------------------- ENTRY ---------------------------------- */

const ALCHEMY_CHAINS = ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVAX', 'SOL', 'TRX']
const CHAIN_KEYS: ChainKey[] = ['BTC', 'XRP', 'ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVAX', 'SOL', 'TRX']

function normalizeChain(input: string): ChainKey | null {
  const c = input.toUpperCase()
  const key = ['BITCOIN', 'BTC'].includes(c) ? 'BTC'
    : ['RIPPLE', 'XRP', 'XRPL'].includes(c) ? 'XRP'
    : ['ETHEREUM', 'ETH', 'ERC20'].includes(c) ? 'ETH'
    : ['BNB', 'BSC', 'BINANCE', 'BEP20'].includes(c) ? 'BSC'
    : ['MATIC', 'POLYGON', 'POL'].includes(c) ? 'POLYGON'
    : ['ARB', 'ARBITRUM', 'ARBITRUM_ONE'].includes(c) ? 'ARBITRUM'
    : ['OP', 'OPTIMISM'].includes(c) ? 'OPTIMISM'
    : ['AVAX', 'AVALANCHE', 'AVALANCHE_C', 'AVALANCHEC', 'C-CHAIN', 'CCHAIN', 'AVAXC'].includes(c) ? 'AVAX'
    : ['SOLANA', 'SOL', 'SPL'].includes(c) ? 'SOL'
    : ['TRON', 'TRX', 'TRC20'].includes(c) ? 'TRX'
    : c
  return CHAIN_KEYS.includes(key as ChainKey) ? (key as ChainKey) : null
}

Deno.serve(async (req) => {
  const corsHeaders = cors(req)

  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(req.headers.get('origin'))) {
      return new Response(null, { status: 403 })
    }
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (!isRequestAllowed(req)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Origin not allowed', retryable: false }),
      { status: 403, headers: { 'Content-Type': 'application/json', 'Vary': 'Origin' } },
    )
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed', retryable: false }, 405)

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON body', retryable: false }, 400)
  }

  const { chain, txHash: rawHash, fromAddress, nonce, broadcastAt, expected } = payload ?? {}
  if (!chain || !rawHash) {
    return json({ success: false, error: 'Missing chain or txHash', retryable: false }, 400)
  }

  const txHash = String(rawHash).trim()
  const key = normalizeChain(String(chain))
  if (!key) return json({ success: false, error: `Unsupported chain: ${chain}`, retryable: false }, 400)

  if (!KEY && ALCHEMY_CHAINS.includes(key)) {
    return json({ success: false, error: 'ALCHEMYS_API_KEY (or ALCHEMY_API_KEY) is not configured', retryable: false }, 500)
  }

  const broadcast = typeof broadcastAt === 'number' ? broadcastAt : undefined

  try {
    let outcome: Outcome
    switch (key) {
      case 'BTC':
        outcome = await trackBitcoin(txHash, broadcast)
        break
      case 'XRP':
        outcome = await trackXrp(txHash, broadcast)
        break
      case 'SOL':
        outcome = await trackSolana(txHash, broadcast)
        break
      case 'TRX':
        outcome = await trackTron(txHash, broadcast)
        break
      default:
        outcome = await trackEvm(key, txHash, fromAddress ? String(fromAddress) : undefined,
          typeof nonce === 'number' ? nonce : undefined, broadcast)
        break
    }

    const assertion = assertExpectations(key, outcome, expected as Expected | undefined)
    const required = REQUIRED_CONFIRMATIONS[key]

    // Settle only on a fully confirmed transaction that also matches the payout
    // record. A confirmed-but-mismatched transfer is an incident, not a success.
    const settled = outcome.status === 'confirmed' && assertion.matches
    const terminalFailure = outcome.status === 'failed' ||
      outcome.status === 'dropped' ||
      outcome.status === 'replaced'

    const stuckSeconds = broadcast && (outcome.status === 'pending' || outcome.status === 'unknown')
      ? Math.max(Math.floor(Date.now() / 1000) - broadcast, 0)
      : 0

    console.log(
      `[${key}] withdrawal ${txHash} status=${outcome.status} conf=${outcome.confirmations}/${required} ` +
      `settled=${settled} matches=${assertion.matches}`,
    )
    if (assertion.checked && !assertion.matches) {
      console.error(`[${key}] PAYOUT MISMATCH ${txHash}: ${assertion.mismatches.join('; ')}`)
    }

    return json({
      success: true,
      chain: key,
      txHash,
      ...outcome,
      required,
      settled,
      terminalFailure,
      stuckSeconds,
      stuck: stuckSeconds > STUCK_AFTER_SECONDS,
      assertion,
      scannedAt: new Date().toISOString(),
    })
  } catch (e) {
    const err = e instanceof UpstreamError ? e : new UpstreamError(e instanceof Error ? e.message : String(e))
    console.error(`[${key}] withdrawal track failed:`, err.message)
    return json({
      success: false,
      chain: key,
      txHash,
      status: 'unknown',
      settled: false,
      terminalFailure: false,
      error: err.message,
      retryable: err.retryable,
    }, err.status)
  }
})
