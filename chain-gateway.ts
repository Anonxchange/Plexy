import { createClient } from "npm:@supabase/supabase-js@2";

// Supabase Edge Functions run on Deno; use Deno.serve.

/**
 * Pexly chain gateway (Supabase Edge Function, Deno).
 *
 * Bitcoin now runs on Alchemy's Bitcoin JSON-RPC
 * (https://bitcoin-mainnet.g.alchemy.com/v2/<KEY>) instead of public
 * mempool.space for every method a Bitcoin Core node can answer:
 * fees (estimatesmartfee), tx reads (getrawtransaction), blocks, mempool,
 * and broadcast (sendrawtransaction).
 *
 * The ONE thing a bitcoind node cannot do is address-indexed queries
 * (balance / UTXO set for an address) — Core has no address index, so
 * Alchemy's Bitcoin API exposes no such method. Those two calls fall back
 * to an indexer (BTC_INDEXER_URL, default mempool.space) and are strictly
 * whitelisted. Point BTC_INDEXER_URL at your own Esplora/Blockbook to drop
 * the public dependency entirely.
 *
 * XRP is NOT an Alchemy network (Alchemy ships EVM + Solana + Bitcoin only),
 * so the XRP Ledger lane talks XRPL JSON-RPC directly via XRPL_RPC_URL
 * (default xrplcluster.com) with a command whitelist and signed-blob-only
 * submits.
 */

// ── CORS: restrict to pexly.app origins ─────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "https://www.pexly.app",
  "https://pexly.app",
]);

function isAllowedOrigin(origin: string | null): boolean {
  return !!origin && ALLOWED_ORIGINS.has(origin);
}

/** No wildcard and no fallback origin: a disallowed origin gets no
 *  Access-Control-Allow-Origin header at all. */
function corsHeadersFor(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin as string;
  return headers;
}

/** Browser traffic must originate from pexly.app / www.pexly.app. An absent
 *  Origin (cron, function-to-function, server-side) is only allowed with an
 *  Authorization bearer, so omitting Origin is no longer a bypass. */
function isRequestAllowed(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (origin !== null) return isAllowedOrigin(origin);
  return !!request.headers.get("Authorization");
}

// ── Limits & timeouts ───────────────────────────────────────────────────────
const MAX_BODY_BYTES = 64 * 1024;
const MAX_UPSTREAM_BYTES = 2 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 10_000;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 200;

// ── Rate limiting (in-memory, per-instance, best-effort) ────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_BROADCAST_MAX = 10;
const rateBuckets = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || b.reset < now) {
    rateBuckets.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) if (v.reset < now) rateBuckets.delete(k);
}, 60_000);

// ── Structured logging ──────────────────────────────────────────────────────
function log(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields }));
}

// ── Alchemy chain map (Bitcoin included) ────────────────────────────────────
const ALCHEMY_CHAINS: Record<string, string> = {
  ETH: "eth-mainnet",
  ARB: "arb-mainnet",
  POL: "polygon-mainnet",
  MATIC: "polygon-mainnet",
  OP: "opt-mainnet",
  AVAX: "avax-mainnet",
  AVALANCHE: "avax-mainnet",
  BNB: "bnb-mainnet",
  SOL: "solana-mainnet",
  BTC: "bitcoin-mainnet",
  TRX: "tron-mainnet",
  TRON: "tron-mainnet",
};

const alchemyUrl = (network: string, apiKey: string) => `https://${network}.g.alchemy.com/v2/${apiKey}`;

const READ_ONLY_EVM_METHODS = new Set([
  "eth_blockNumber", "eth_call", "eth_chainId", "eth_estimateGas", "eth_gasPrice",
  "eth_getBalance", "eth_getBlockByHash", "eth_getBlockByNumber",
  "eth_getBlockTransactionCountByHash", "eth_getCode", "eth_getTransactionByHash",
  "eth_getTransactionCount", "eth_getTransactionReceipt", "eth_maxPriorityFeePerGas",
  "eth_syncing", "net_version", "alchemy_getAssetTransfers", "eth_feeHistory",
]);

const READ_ONLY_SOL_METHODS = new Set([
  "getBalance", "getBlockHeight", "getSlot", "getLatestBlockhash", "getBlockhash",
  "getAccountInfo", "getTokenAccountBalance", "getTokenAccountsByOwner",
  "getSignatureStatuses", "getTransaction", "getFeeForMessage", "getEpochInfo",
  "getMinimumBalanceForRentExemption", "getRecentPrioritizationFees",
]);

// Bitcoin Core JSON-RPC methods Alchemy exposes, read-only subset.
const READ_ONLY_BTC_METHODS = new Set([
  "decoderawtransaction", "decodescript", "estimatesmartfee",
  "getbestblockhash", "getblock", "getblockchaininfo", "getblockcount",
  "getblockhash", "getblockheader", "getblockstats", "getchaintips",
  "getchaintxstats", "getdifficulty", "getmempoolancestors",
  "getmempooldescendants", "getmempoolinfo", "getnetworkinfo",
  "getrawmempool", "getrawtransaction", "gettxout", "gettxoutproof",
  "testmempoolaccept", "validateaddress", "verifymessage",
]);
const BTC_BROADCAST_METHOD = "sendrawtransaction";

// ── XRP Ledger (Alchemy has no XRPL product — uses XRPL JSON-RPC) ───────────
const xrplUrl = () => (Deno.env.get("XRPL_RPC_URL") ?? "https://xrplcluster.com").replace(/\/$/, "");

const READ_ONLY_XRP_METHODS = new Set([
  "account_info", "account_lines", "account_objects", "account_tx",
  "fee", "ledger", "ledger_current", "ledger_closed", "server_info",
  "server_state", "tx", "gateway_balances", "submit_multisigned_dry",
]);
const XRP_BROADCAST_METHOD = "submit";

// ── Tron (TronGrid) path whitelist ──────────────────────────────────────────
const TRON_GET_PATTERNS: RegExp[] = [
  /^\/wallet\/getnowblock$/,
  /^\/wallet\/getblockbynum(\?.*)?$/,
  /^\/v1\/accounts\/[A-Za-z0-9]{25,40}$/,
  /^\/v1\/accounts\/[A-Za-z0-9]{25,40}\/transactions(\/trc20)?(\?.*)?$/,
  /^\/v1\/accounts\/[A-Za-z0-9]{25,40}\/resources$/,
];
const TRON_POST_PATHS = new Set<string>([
  "/wallet/getaccount",
  "/wallet/getaccountresource",
  "/wallet/triggerconstantcontract",
  "/wallet/triggersmartcontract",
  "/wallet/createtransaction",
  "/wallet/broadcasttransaction",
  "/wallet/broadcasthex",
  "/wallet/getcontract",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────
function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function requireString(value: unknown, name: string, max = 10_000): string {
  if (typeof value !== "string" || value.length === 0 || value.length > max) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
}

function normalizePath(value: unknown): string {
  const path = requireString(value, "path", 500);
  if (!path.startsWith("/") || path.includes("://") || path.includes("..")) {
    throw new Error("Invalid upstream path");
  }
  return path;
}

const BTC_ADDRESS_RE = /^[a-zA-Z0-9]{10,90}$/;
function requireBtcAddress(value: unknown): string {
  const address = requireString(value, "address", 90);
  if (!BTC_ADDRESS_RE.test(address)) throw new Error("Invalid Bitcoin address");
  return address;
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function readLimitedBody(req: Request): Promise<unknown> {
  const cl = req.headers.get("content-length");
  if (cl && Number(cl) > MAX_BODY_BYTES) throw new Error("Request body too large");
  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_BODY_BYTES) throw new Error("Request body too large");
  const text = new TextDecoder().decode(buf);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

async function readLimitedUpstream(res: Response, asText = false): Promise<unknown> {
  const cl = res.headers.get("content-length");
  if (cl && Number(cl) > MAX_UPSTREAM_BYTES) throw new Error("Upstream response too large");
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_UPSTREAM_BYTES) throw new Error("Upstream response too large");
  const text = new TextDecoder().decode(buf);
  if (asText) return text;
  try {
    return text.length ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required");
if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is required");

async function requireUser(request: Request) {
  const token = request.headers.get("Authorization");
  if (!token) {
    throw new Error("Authentication is required to broadcast");
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: token } },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Authentication is required to broadcast");
  return data.user;
}

// ── Fetch with timeout + retry on transient failures ────────────────────────
const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);

async function fetchWithRetry(url: string, init: RequestInit, reqId: string, label: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    const started = Date.now();
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      const durationMs = Date.now() - started;
      if (TRANSIENT_STATUS.has(res.status) && attempt < RETRY_ATTEMPTS) {
        log("warn", "upstream_transient", { reqId, label, status: res.status, attempt, durationMs });
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)));
        continue;
      }
      log("info", "upstream_ok", { reqId, label, status: res.status, attempt, durationMs });
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      const aborted = (err as Error)?.name === "AbortError";
      log(aborted ? "warn" : "warn", aborted ? "upstream_timeout" : "upstream_error", {
        reqId,
        label,
        attempt,
        error: (err as Error)?.message,
      });
      if (attempt >= RETRY_ATTEMPTS) break;
      await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
  }
  throw new Error(`Upstream unreachable: ${(lastErr as Error)?.message || label}`);
}

function alchemyKey(): string {
  const apiKey = (Deno.env.get("ALCHEMY_API_KEY") ?? Deno.env.get("ALCHEMYS_API_KEY"));
  if (!apiKey) throw new Error("ALCHEMY_API_KEY (or ALCHEMYS_API_KEY) is not configured in Supabase secrets");
  return apiKey;
}

async function alchemyRpc(network: string, method: string, params: unknown[], reqId: string): Promise<{ status: number; payload: any }> {
  const upstream = await fetchWithRetry(
    alchemyUrl(network, alchemyKey()),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    },
    reqId,
    `alchemy:${network}:${method}`,
  );
  return { status: upstream.status, payload: await readLimitedUpstream(upstream) };
}

// ── Action: EVM / Solana / Bitcoin RPC via Alchemy ──────────────────────────
async function forwardRpc(request: Request, chain: string, method: string, params: unknown[], cors: Record<string, string>, reqId: string) {
  const network = ALCHEMY_CHAINS[chain];
  if (!network) {
    throw new Error(`Chain "${chain}" is not supported. Supported: ${Object.keys(ALCHEMY_CHAINS).join(", ")}.`);
  }
  if (typeof method !== "string" || method.length > 100) throw new Error("Invalid RPC method");

  const isBroadcast = chain === "SOL" ? method === "sendTransaction" : chain === "BTC" ? method === BTC_BROADCAST_METHOD : method === "eth_sendRawTransaction";

  if (!isBroadcast) {
    const allowed = chain === "SOL" ? READ_ONLY_SOL_METHODS : chain === "BTC" ? READ_ONLY_BTC_METHODS : READ_ONLY_EVM_METHODS;
    if (!allowed.has(method)) throw new Error(`RPC method not allowed: ${method}`);
  }

  if (isBroadcast) {
    const user = await requireUser(request);
    if (!rateLimit(`bcast:${user.id}`, RATE_LIMIT_BROADCAST_MAX)) {
      return json({ error: "Broadcast rate limit exceeded" }, 429, cors);
    }
  }

  const { status, payload } = await alchemyRpc(network, method, params, reqId);
  if (status >= 400) {
    return json({ error: payload?.error?.message || `RPC HTTP ${status}` }, status, cors);
  }
  return json(payload, 200, cors);
}

// ── Action: bitcoin fee estimate (Alchemy estimatesmartfee) ─────────────────
const BTC_FEE_TARGETS = { fast: 1, normal: 3, slow: 6 } as const;

async function bitcoinFees(cors: Record<string, string>, reqId: string) {
  const entries = await Promise.all(
    (Object.entries(BTC_FEE_TARGETS) as [keyof typeof BTC_FEE_TARGETS, number][]).map(async ([tier, blocks]) => {
      const { payload } = await alchemyRpc(ALCHEMY_CHAINS.BTC, "estimatesmartfee", [blocks, "CONSERVATIVE"], reqId);
      const feerate = Number(payload?.result?.feerate ?? 0);
      const satPerVb = feerate > 0 ? Math.max(1, Math.ceil((feerate * 1e8) / 1000)) : null;
      return [tier, satPerVb] as const;
    }),
  );

  const fees = Object.fromEntries(entries) as Record<string, number | null>;
  if (fees.fast === null && fees.normal === null && fees.slow === null) {
    throw new Error("Bitcoin fee estimation unavailable");
  }
  const fallback = fees.fast ?? fees.normal ?? fees.slow ?? 1;
  return json({ unit: "sat/vB", source: "alchemy:estimatesmartfee", fast: fees.fast ?? fallback, normal: fees.normal ?? fallback, slow: fees.slow ?? fallback, minimum: 1 }, 200, cors);
}

// ── Action: address-indexed Bitcoin reads ─────────────────────────────────
const btcIndexerUrl = () => (Deno.env.get("BTC_INDEXER_URL") ?? "https://mempool.space/api").replace(/\/$/, "");

/** Minimum confirmations before a UTXO counts as spendable / credited balance. */
const BTC_MIN_CONFIRMATIONS = Math.max(1, Math.floor(Number(Deno.env.get("BTC_MIN_CONFIRMATIONS") ?? 1)) || 1);

/** BigInt-safe smallest-unit -> decimal string. Never use Number() on sats. */
function formatUnits(raw: bigint, decimals: number): string {
  const neg = raw < 0n;
  const v = neg ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const frac = (v % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${v / base}${frac ? "." + frac : ""}`;
}

function toBigInt(v: unknown): bigint {
  try {
    return BigInt(String(v ?? "0").split(".")[0] || "0");
  } catch {
    return 0n;
  }
}

async function btcTipHeight(reqId: string): Promise<number> {
  try {
    const { payload } = await alchemyRpc(ALCHEMY_CHAINS.BTC, "getblockcount", [], reqId);
    return Number(payload?.result ?? 0) || 0;
  } catch {
    return 0;
  }
}

async function bitcoinAddress(kind: "utxos" | "summary", address: string, cors: Record<string, string>, reqId: string) {
  const suffix = kind === "utxos" ? "/utxo" : "";
  const upstream = await fetchWithRetry(`${btcIndexerUrl()}/address/${encodeURIComponent(address)}${suffix}`, { method: "GET" }, reqId, `btc-indexer:${kind}`);
  const payload = await readLimitedUpstream(upstream);

  if (!upstream.ok) {
    return json({ error: `Bitcoin indexer HTTP ${upstream.status}` }, upstream.status, cors);
  }

  if (kind === "summary") {
    const s = payload as any;
    // Esplora sums are in SATOSHIS. Confirmed and mempool funds are reported
    // separately: mempool money is NOT a confirmed balance and must never be
    // folded into the spendable figure.
    const confirmed =
      toBigInt(s?.chain_stats?.funded_txo_sum) - toBigInt(s?.chain_stats?.spent_txo_sum);
    const pending =
      toBigInt(s?.mempool_stats?.funded_txo_sum) - toBigInt(s?.mempool_stats?.spent_txo_sum);

    return json(
      {
        address,
        symbol: "BTC",
        decimals: 8,
        unit: "sat",
        // raw / confirmedRaw are SATOSHIS — divide by 1e8 before display.
        raw: confirmed.toString(),
        confirmedRaw: confirmed.toString(),
        pendingRaw: pending.toString(),
        totalRaw: (confirmed + pending).toString(),
        // Pre-formatted BTC strings so a caller can never render sats as BTC.
        balance: formatUnits(confirmed, 8),
        confirmed: formatUnits(confirmed, 8),
        pending: formatUnits(pending, 8),
        total: formatUnits(confirmed + pending, 8),
        minConfirmations: BTC_MIN_CONFIRMATIONS,
      },
      200,
      cors,
    );
  }

  const list = Array.isArray(payload) ? payload : [];
  const tip = await btcTipHeight(reqId);
  const utxos = list.map((u: any) => {
    const height = Number(u.status?.block_height ?? 0);
    const isConfirmed = Boolean(u.status?.confirmed);
    const confirmations = isConfirmed && tip > 0 && height > 0 ? Math.max(tip - height + 1, 0) : 0;
    return {
      txid: u.txid,
      vout: u.vout,
      // value is in SATOSHIS (string to stay exact for large amounts).
      value: toBigInt(u.value).toString(),
      valueSat: toBigInt(u.value).toString(),
      confirmed: isConfirmed,
      confirmations,
      spendable: confirmations >= BTC_MIN_CONFIRMATIONS,
      blockHeight: height || null,
    };
  });

  const sum = (rows: typeof utxos) => rows.reduce((acc, u) => acc + BigInt(u.value), 0n);
  const spendable = utxos.filter((u) => u.spendable);

  return json(
    {
      address,
      unit: "sat",
      decimals: 8,
      tipHeight: tip || null,
      minConfirmations: BTC_MIN_CONFIRMATIONS,
      utxos,
      spendableUtxos: spendable,
      total: sum(utxos).toString(),
      spendableTotal: sum(spendable).toString(),
      pendingTotal: sum(utxos.filter((u) => !u.spendable)).toString(),
    },
    200,
    cors,
  );
}


// ── Action: Tron via TronGrid ───────────────────────────────────────────────
async function xrplCall(command: string, params: Record<string, unknown>, reqId: string): Promise<{ status: number; payload: any }> {
  const upstream = await fetchWithRetry(
    xrplUrl(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: command, params: [params] }),
    },
    reqId,
    `xrpl:${command}`,
  );
  return { status: upstream.status, payload: await readLimitedUpstream(upstream) };
}

async function forwardXrp(request: Request, command: string, params: Record<string, unknown>, cors: Record<string, string>, reqId: string) {
  if (typeof command !== "string" || command.length > 60) throw new Error("Invalid XRPL command");
  const isBroadcast = command === XRP_BROADCAST_METHOD;
  if (!isBroadcast && !READ_ONLY_XRP_METHODS.has(command)) {
    throw new Error(`XRPL command not allowed: ${command}`);
  }

  if (isBroadcast) {
    if (typeof (params as any)?.tx_blob !== "string") {
      throw new Error("XRPL submit requires a signed tx_blob");
    }
    const user = await requireUser(request);
    if (!rateLimit(`bcast:${user.id}`, RATE_LIMIT_BROADCAST_MAX)) {
      return json({ error: "Broadcast rate limit exceeded" }, 429, cors);
    }
  }

  const { status, payload } = await xrplCall(command, isBroadcast ? { tx_blob: (params as any).tx_blob } : params, reqId);
  const result = payload?.result;
  if (status >= 400 || result?.error) {
    return json({ error: result?.error_message || result?.error || `XRPL HTTP ${status}` }, status >= 400 ? status : 400, cors);
  }
  return json(payload, 200, cors);
}

async function xrpFees(cors: Record<string, string>, reqId: string) {
  const { payload } = await xrplCall("fee", {}, reqId);
  const drops = payload?.result?.drops;
  const base = Number(drops?.minimum_fee ?? 10);
  const normal = Number(drops?.median_fee ?? base);
  const fast = Number(drops?.open_ledger_fee ?? normal);
  if (!Number.isFinite(base)) throw new Error("XRP fee estimation unavailable");
  return json({ unit: "drops", source: "xrpl:fee", fast: Math.max(base, Math.ceil(fast)), normal: Math.max(base, Math.ceil(normal)), slow: base, minimum: base }, 200, cors);
}

const XRP_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

async function xrpBalance(address: unknown, cors: Record<string, string>, reqId: string) {
  const account = requireString(address, "address", 40);
  if (!XRP_ADDRESS_RE.test(account)) throw new Error("Invalid XRP address");
  const [info, state] = await Promise.all([
    xrplCall("account_info", { account, ledger_index: "validated" }, reqId),
    xrplCall("server_state", {}, reqId).catch(() => ({ payload: null } as any)),
  ]);
  const result = info.payload?.result;

  if (result?.error === "actNotFound") {
    return json(
      {
        address: account,
        decimals: 6,
        symbol: "XRP",
        unit: "drop",
        raw: "0",
        spendableRaw: "0",
        balance: "0",
        spendable: "0",
        reserveRaw: "0",
        funded: false,
      },
      200,
      cors,
    );
  }
  if (result?.error) {
    return json({ error: result.error_message || result.error }, 400, cors);
  }

  // Balance is in DROPS (1 XRP = 1,000,000 drops) and includes the account
  // reserve, which can never be sent. Expose both so the UI stops showing
  // reserved funds as available.
  const raw = toBigInt(result?.account_data?.Balance);
  const validated = state.payload?.result?.state?.validated_ledger;
  const baseReserve = toBigInt(validated?.reserve_base ?? 1_000_000);
  const incReserve = toBigInt(validated?.reserve_inc ?? 200_000);
  const ownerCount = toBigInt(result?.account_data?.OwnerCount ?? 0);
  const reserve = baseReserve + incReserve * ownerCount;
  const spendable = raw > reserve ? raw - reserve : 0n;

  return json(
    {
      address: account,
      decimals: 6,
      symbol: "XRP",
      unit: "drop",
      raw: raw.toString(),
      reserveRaw: reserve.toString(),
      spendableRaw: spendable.toString(),
      balance: formatUnits(raw, 6),
      reserve: formatUnits(reserve, 6),
      spendable: formatUnits(spendable, 6),
      ownerCount: Number(ownerCount),
      sequence: result?.account_data?.Sequence ?? null,
      funded: true,
    },
    200,
    cors,
  );
}


async function forwardTron(request: Request, path: string, method: string, body: unknown, cors: Record<string, string>, reqId: string) {
  if (method === "GET") {
    if (!TRON_GET_PATTERNS.some((r) => r.test(path))) throw new Error("Tron path not allowed");
  } else if (method === "POST") {
    if (!TRON_POST_PATHS.has(path)) throw new Error("Tron path not allowed");
    if (path === "/wallet/broadcasttransaction" || path === "/wallet/broadcasthex") {
      const user = await requireUser(request);
      if (!rateLimit(`bcast:${user.id}`, RATE_LIMIT_BROADCAST_MAX)) {
        return json({ error: "Broadcast rate limit exceeded" }, 429, cors);
      }
    }
  } else {
    throw new Error("Unsupported Tron method");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const tronGridKey = Deno.env.get("TRONGRID_API_KEY");
  if (tronGridKey) headers["TRON-PRO-API-KEY"] = tronGridKey;

  const init: RequestInit = {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  };

  let upstream: Response | null = null;
  let usedFallback = false;
  const alchemyApiKey = (Deno.env.get("ALCHEMY_API_KEY") ?? Deno.env.get("ALCHEMYS_API_KEY"));

  if (alchemyApiKey) {
    try {
      upstream = await fetchWithRetry(`${alchemyUrl(ALCHEMY_CHAINS.TRX, alchemyApiKey)}${path}`, init, reqId, `alchemy:tron:${method}:${path}`);
      if (upstream.status >= 500 || upstream.status === 429) upstream = null;
    } catch {
      upstream = null;
    }
  }

  if (!upstream) {
    usedFallback = true;
    log("warn", "tron_fallback_trongrid", { reqId, path });
    upstream = await fetchWithRetry(`https://api.trongrid.io${path}`, { ...init, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined }, reqId, `trongrid:${method}:${path}`);
  }

  const payload = await readLimitedUpstream(upstream);
  if (!upstream.ok) {
    return json({ error: (payload as any)?.message || `Tron HTTP ${upstream.status}`, source: usedFallback ? "trongrid" : "alchemy" }, upstream.status, cors);
  }

  return json(payload, 200, cors);
}

// ── Stablecoin allowlist (USDT / USDC) ──────────────────────────────────────
// Mirrors monitor-deposits. Only these contracts/mints may be surfaced as
// USDT/USDC — anything else is an unlisted look-alike token.
interface TokenDef { symbol: "USDT" | "USDC"; decimals: number; label?: string }

const TOKENS: Record<string, Record<string, TokenDef>> = {
  ETH: {
    "0xdac17f958d2ee523a2206206994597c13d831ec7": { symbol: "USDT", decimals: 6 },
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { symbol: "USDC", decimals: 6 },
  },
  BNB: {
    "0x55d398326f99059ff775485246999027b3197955": { symbol: "USDT", decimals: 18 },
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": { symbol: "USDC", decimals: 18 },
  },
  POL: {
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": { symbol: "USDT", decimals: 6 },
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": { symbol: "USDC", decimals: 6 },
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": { symbol: "USDC", decimals: 6, label: "USDC.e" },
  },
  ARB: {
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": { symbol: "USDT", decimals: 6 },
    "0xaf88d065e77c8cc2239327c5edb3a432268e5831": { symbol: "USDC", decimals: 6 },
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": { symbol: "USDC", decimals: 6, label: "USDC.e" },
  },
  OP: {
    "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": { symbol: "USDT", decimals: 6 },
    "0x0b2c639c533813f4aa9d7837caf62653d097ff85": { symbol: "USDC", decimals: 6 },
    "0x7f5c764cbc14f9669b88837ca1490cca17c31607": { symbol: "USDC", decimals: 6, label: "USDC.e" },
  },
  AVAX: {
    "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": { symbol: "USDT", decimals: 6 },
    "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": { symbol: "USDC", decimals: 6 },
    "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664": { symbol: "USDC", decimals: 6, label: "USDC.e" },
  },
  SOL: {
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: "USDT", decimals: 6 },
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: "USDC", decimals: 6 },
  },
  TRX: {
    TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t: { symbol: "USDT", decimals: 6 },
    TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8: { symbol: "USDC", decimals: 6 },
  },
};
TOKENS.MATIC = TOKENS.POL;
TOKENS.AVALANCHE = TOKENS.AVAX;
TOKENS.TRON = TOKENS.TRX;

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const SPL_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TRON_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

function tokensFor(chain: string) {
  return TOKENS[chain] ?? {};
}

/** List the supported stablecoins for a chain (or every chain). */
function tokenList(chain: string | null, cors: Record<string, string>) {
  const build = (c: string) =>
    Object.entries(tokensFor(c)).map(([contract, t]) => ({ chain: c, contract, ...t }));
  const chains = chain ? [chain] : Object.keys(TOKENS);
  return json({ chains, tokens: chains.flatMap(build) }, 200, cors);
}

/**
 * Allowlisted USDT/USDC balance on any supported chain.
 * Always returns { raw (smallest units), decimals, balance (decimal string) }
 * so a caller can never mistake base units for whole tokens.
 */
async function tokenBalance(chain: string, contractInput: unknown, ownerInput: unknown, cors: Record<string, string>, reqId: string) {
  const owner = requireString(ownerInput, "address", 64);
  const rawContract = requireString(contractInput, "contract", 64);
  const table = tokensFor(chain);
  const key = rawContract.startsWith("0x") ? rawContract.toLowerCase() : rawContract;
  const meta = table[key];
  if (!meta) {
    throw new Error(`Token ${rawContract} is not allowlisted on ${chain}`);
  }

  const respond = (raw: bigint) =>
    json(
      {
        chain,
        contract: key,
        address: owner,
        symbol: meta.symbol,
        label: meta.label ?? meta.symbol,
        decimals: meta.decimals,
        unit: "base",
        raw: raw.toString(),
        balance: formatUnits(raw, meta.decimals),
      },
      200,
      cors,
    );

  if (chain === "SOL") {
    if (!SPL_ADDRESS_RE.test(owner)) throw new Error("Invalid Solana address");
    const { payload } = await alchemyRpc(
      ALCHEMY_CHAINS.SOL,
      "getTokenAccountsByOwner",
      [owner, { mint: key }, { encoding: "jsonParsed" }],
      reqId,
    );
    if (payload?.error) return json({ error: payload.error.message ?? "Solana RPC error" }, 502, cors);
    const total = (payload?.result?.value ?? []).reduce(
      (acc: bigint, a: any) => acc + toBigInt(a?.account?.data?.parsed?.info?.tokenAmount?.amount),
      0n,
    );
    return respond(total);
  }

  if (chain === "TRX" || chain === "TRON") {
    if (!TRON_ADDRESS_RE.test(owner)) throw new Error("Invalid Tron address");
    const upstream = await fetchWithRetry(
      `${alchemyUrl(ALCHEMY_CHAINS.TRX, alchemyKey())}/wallet/triggerconstantcontract`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_address: owner,
          contract_address: key,
          function_selector: "balanceOf(address)",
          parameter: "",
          visible: true,
        }),
      },
      reqId,
      "tron:balanceOf",
    );
    const payload: any = await readLimitedUpstream(upstream);
    const hex = payload?.constant_result?.[0];
    if (!hex) return json({ error: payload?.result?.message ?? "Tron balanceOf failed" }, 502, cors);
    return respond(BigInt(`0x${hex}`));
  }

  const network = ALCHEMY_CHAINS[chain];
  if (!network) throw new Error(`Chain "${chain}" is not supported`);
  if (!EVM_ADDRESS_RE.test(owner)) throw new Error("Invalid EVM address");
  // balanceOf(address) selector + 32-byte padded owner
  const data = `0x70a08231${owner.slice(2).toLowerCase().padStart(64, "0")}`;
  const { payload } = await alchemyRpc(network, "eth_call", [{ to: key, data }, "latest"], reqId);
  if (payload?.error) return json({ error: payload.error.message ?? "EVM RPC error" }, 502, cors);
  const result = String(payload?.result ?? "0x0");
  return respond(result === "0x" ? 0n : BigInt(result));
}


// ── Router ──────────────────────────────────────────────────────────────────
Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const cors = corsHeadersFor(origin);
  const reqId = crypto.randomUUID();
  const ip = clientIp(request);

  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { status: 204, headers: cors });
  }

  if (!isRequestAllowed(request)) {
    log("warn", "origin_blocked", { reqId, ip, origin });
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", Vary: "Origin" },
    });
  }

  if (request.method !== "POST") return json({ error: "POST required" }, 405, cors);

  if (!rateLimit(`ip:${ip}`, RATE_LIMIT_MAX)) {
    log("warn", "rate_limited", { reqId, ip });
    return json({ error: "Rate limit exceeded" }, 429, cors);
  }

  const startedAt = Date.now();
  try {
    const input = (await readLimitedBody(request)) as Record<string, unknown>;
    const action = requireString(input?.action, "action", 32);
    log("info", "request", { reqId, ip, action });

    let response: Response;
    if (action === "rpc") {
      response = await forwardRpc(
        request,
        requireString(input.chain, "chain", 16).toUpperCase(),
        requireString(input.method, "method", 100),
        Array.isArray(input.params) ? (input.params as unknown[]) : [],
        cors,
        reqId,
      );
    } else if (action === "token_balance") {
      response = await tokenBalance(
        requireString(input.chain, "chain", 16).toUpperCase(),
        input.contract,
        input.address,
        cors,
        reqId,
      );
    } else if (action === "tokens") {
      response = tokenList(
        typeof input.chain === "string" ? input.chain.toUpperCase() : null,
        cors,
      );
    } else if (action === "btc_fees") {
      response = await bitcoinFees(cors, reqId);
    } else if (action === "btc_utxos") {
      response = await bitcoinAddress("utxos", requireBtcAddress(input.address), cors, reqId);
    } else if (action === "btc_balance") {
      response = await bitcoinAddress("summary", requireBtcAddress(input.address), cors, reqId);
    } else if (action === "xrp") {
      response = await forwardXrp(
        request,
        requireString(input.command, "command", 60),
        input.params && typeof input.params === "object" && !Array.isArray(input.params) ? (input.params as Record<string, unknown>) : {},
        cors,
        reqId,
      );
    } else if (action === "xrp_fees") {
      response = await xrpFees(cors, reqId);
    } else if (action === "xrp_balance") {
      response = await xrpBalance(input.address, cors, reqId);
    } else if (action === "tron") {
      response = await forwardTron(request, normalizePath(input.path), String(input.method || "GET").toUpperCase(), input.body, cors, reqId);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    log("info", "response", { reqId, ip, action, status: response.status, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gateway request failed";
    log("error", "request_failed", { reqId, ip, error: message, durationMs: Date.now() - startedAt });
    return json({ error: message }, 400, cors);
  }
});
