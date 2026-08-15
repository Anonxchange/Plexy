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

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
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
  BASE: "base-mainnet",
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
  const apiKey = Deno.env.get("ALCHEMY_API_KEY");
  if (!apiKey) throw new Error("ALCHEMY_API_KEY is not configured in Supabase secrets");
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

async function btcTipHeight(reqId: string): Promise<number> {
  try {
    const res = await fetchWithRetry(`${btcIndexerUrl()}/blocks/tip/height`, { method: "GET" }, reqId, "btc-indexer:tip");
    if (!res.ok) return 0;
    const text = (await res.text()).trim();
    const height = Number(text);
    return Number.isFinite(height) && height > 0 ? height : 0;
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
    const funded = Number(s?.chain_stats?.funded_txo_sum ?? 0) + Number(s?.mempool_stats?.funded_txo_sum ?? 0);
    const spent = Number(s?.chain_stats?.spent_txo_sum ?? 0) + Number(s?.mempool_stats?.spent_txo_sum ?? 0);
    return json({ address, decimals: 8, symbol: "BTC", raw: String(funded - spent) }, 200, cors);
  }

  const list = Array.isArray(payload) ? payload : [];
  const tip = await btcTipHeight(reqId);

  const utxos = list.map((u: any) => {
    const blockHeight = u?.status?.block_height ?? null;
    const confirmed = Boolean(u?.status?.confirmed) || blockHeight !== null;
    // Depth from the chain tip. When the tip lookup fails we still report 1 for
    // a mined output so clients never treat a confirmed UTXO as unspendable.
    const confirmations = !confirmed ? 0 : tip > 0 && blockHeight ? Math.max(tip - Number(blockHeight) + 1, 1) : 1;
    return {
      txid: u.txid,
      vout: u.vout,
      value: Number(u.value),
      confirmed,
      confirmations,
      spendable: confirmed && confirmations >= 1,
      blockHeight,
    };
  });

  return json(
    {
      address,
      utxos,
      // Mempool (unconfirmed) outputs are excluded: clients must never spend them.
      spendableUtxos: utxos.filter((u) => u.spendable),
      total: utxos.reduce((sum, u) => sum + (Number.isFinite(u.value) ? u.value : 0), 0),
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
  const { payload } = await xrplCall("account_info", { account, ledger_index: "validated" }, reqId);
  const result = payload?.result;

  if (result?.error === "actNotFound") {
    return json({ address: account, decimals: 6, symbol: "XRP", raw: "0", funded: false }, 200, cors);
  }
  if (result?.error) {
    return json({ error: result.error_message || result.error }, 400, cors);
  }

  return json({ address: account, decimals: 6, symbol: "XRP", raw: String(result?.account_data?.Balance ?? "0"), sequence: result?.account_data?.Sequence ?? null, funded: true }, 200, cors);
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
  const alchemyApiKey = Deno.env.get("ALCHEMY_API_KEY");

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

// ── Router ──────────────────────────────────────────────────────────────────
Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const cors = corsHeadersFor(origin);
  const reqId = crypto.randomUUID();
  const ip = clientIp(request);

  if (request.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return new Response("forbidden", { status: 403 });
    }
    return new Response("ok", { headers: cors });
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    log("warn", "origin_blocked", { reqId, ip, origin });
    return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { "Content-Type": "application/json" } });
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
