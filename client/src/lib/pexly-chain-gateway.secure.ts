import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Pexly chain gateway.
 *
 * Security model:
 * - Every request requires a valid Supabase user JWT. CORS is not auth.
 * - Only explicitly allowlisted chains/methods/paths are forwarded.
 * - RPC parameters are bounded and validated per method where practical.
 * - Upstream URLs and API keys are server-controlled; no user-supplied URL is fetched.
 * - Broadcasts have a separate stricter per-user rate limit.
 * - The gateway never signs transactions; it only reads or relays already-signed blobs.
 */

const ALLOWED_ORIGINS = new Set(["https://www.pexly.app", "https://pexly.app"]);

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

const MAX_BODY_BYTES = 64 * 1024;
const MAX_UPSTREAM_BYTES = 2 * 1024 * 1024;
const MAX_RPC_PARAMS = 16;
const MAX_PARAM_STRING = 16 * 1024;
const MAX_JSON_VALUE_BYTES = 48 * 1024;
const UPSTREAM_TIMEOUT_MS = 10_000;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 200;

// Best-effort per-isolate limiting. Authentication/user identity is the primary key;
// this is deliberately not treated as a global distributed security boundary.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_BROADCAST_MAX = 10;
const rateBuckets = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || b.reset <= now) {
    rateBuckets.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) if (v.reset <= now) rateBuckets.delete(k);
}, RATE_LIMIT_WINDOW_MS);

function log(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields }));
}

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
};

const alchemyUrl = (network: string, apiKey: string) =>
  `https://${network}.g.alchemy.com/v2/${apiKey}`;

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

const READ_ONLY_BTC_METHODS = new Set([
  "decoderawtransaction", "decodescript", "estimatesmartfee", "getbestblockhash",
  "getblock", "getblockchaininfo", "getblockcount", "getblockhash", "getblockheader",
  "getblockstats", "getchaintips", "getchaintxstats", "getdifficulty",
  "getmempoolancestors", "getmempooldescendants", "getmempoolinfo", "getnetworkinfo",
  "getrawmempool", "getrawtransaction", "gettxout", "gettxoutproof", "testmempoolaccept",
  "validateaddress", "verifymessage",
]);
const BTC_BROADCAST_METHOD = "sendrawtransaction";

const xrplUrl = () =>
  (Deno.env.get("XRPL_RPC_URL") ?? "https://xrplcluster.com").replace(/\/$/, "");

const READ_ONLY_XRP_METHODS = new Set([
  "account_info", "account_lines", "account_objects", "account_tx", "fee", "ledger",
  "ledger_current", "ledger_closed", "server_info", "server_state", "tx",
  "gateway_balances", "submit_multisigned_dry",
]);
const XRP_BROADCAST_METHOD = "submit";

const TRON_GET_PATTERNS: RegExp[] = [
  /^\/wallet\/getnowblock$/,
  /^\/wallet\/getblockbynum$/,
  /^\/v1\/accounts\/[A-Za-z0-9]{25,40}$/,
  /^\/v1\/accounts\/[A-Za-z0-9]{25,40}\/transactions(?:\/trc20)?$/,
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

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function requireString(value: unknown, name: string, max = 10_000): string {
  if (typeof value !== "string" || value.length === 0 || value.length > max) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, name: string, min = -Infinity, max = Infinity): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} is invalid`);
  }
  return value;
}

function normalizePath(value: unknown): string {
  const path = requireString(value, "path", 500);
  if (!path.startsWith("/") || path.includes("://") || path.includes("..") || path.includes("\\")) {
    throw new Error("Invalid upstream path");
  }
  if (/[\r\n]/.test(path)) throw new Error("Invalid upstream path");
  return path;
}

function isHex(value: unknown, bytes?: number): value is string {
  if (typeof value !== "string" || !/^[0-9a-fA-F]*$/.test(value)) return false;
  return bytes === undefined ? value.length % 2 === 0 : value.length === bytes * 2;
}

const BTC_BASE58_RE = /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/;
const BTC_BECH32_RE = /^bc1[ac-hj-np-z02-9]{11,71}$/i;
function requireBtcAddress(value: unknown): string {
  const address = requireString(value, "address", 90);
  if (!BTC_BASE58_RE.test(address) && !BTC_BECH32_RE.test(address)) {
    throw new Error("Invalid Bitcoin mainnet address");
  }
  return address;
}

const XRP_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
function requireXrpAddress(value: unknown): string {
  const address = requireString(value, "address", 40);
  if (!XRP_ADDRESS_RE.test(address)) throw new Error("Invalid XRP address");
  return address;
}

function requireJsonSize(value: unknown, name: string, max = MAX_JSON_VALUE_BYTES): void {
  let serialized: string;
  try { serialized = JSON.stringify(value); } catch { throw new Error(`${name} is not serializable`); }
  if (serialized.length > max) throw new Error(`${name} is too large`);
}

function validateRpcParams(chain: string, method: string, params: unknown[]): void {
  if (!Array.isArray(params) || params.length > MAX_RPC_PARAMS) throw new Error("Invalid RPC params");
  requireJsonSize(params, "RPC params");

  for (const p of params) {
    if (typeof p === "string" && p.length > MAX_PARAM_STRING) throw new Error("RPC parameter too large");
  }

  if (chain === "BTC") {
    if (method === "getrawtransaction" || method === "gettransaction") {
      if (typeof params[0] !== "string" || !/^[0-9a-fA-F]{64}$/.test(params[0])) throw new Error("Invalid Bitcoin txid");
      if (params.length > 2) throw new Error("Invalid getrawtransaction params");
      if (params[1] !== undefined && typeof params[1] !== "boolean") throw new Error("Invalid verbose flag");
      if (params[2] !== undefined && (typeof params[2] !== "string" || !/^[0-9a-fA-F]{64}$/.test(params[2]))) throw new Error("Invalid block hash");
    }
    if (method === "getblockhash" || method === "getblock") {
      if (method === "getblockhash" && (typeof params[0] !== "number" || !Number.isInteger(params[0]) || params[0] < 0 || params[0] > 100_000_000)) {
        throw new Error("Invalid Bitcoin block height");
      }
      if (method === "getblock" && (typeof params[0] !== "string" || !/^[0-9a-fA-F]{64}$/.test(params[0]))) throw new Error("Invalid Bitcoin block hash");
    }
    if (method === "gettxout" && (typeof params[0] !== "string" || !/^[0-9a-fA-F]{64}$/.test(params[0]))) throw new Error("Invalid Bitcoin txid");
    if (method === "decoderawtransaction" && (!isHex(params[0]) || String(params[0]).length > 200_000)) throw new Error("Invalid raw Bitcoin transaction");
    if (method === "estimatesmartfee" && (params[0] !== undefined && (typeof params[0] !== "number" || !Number.isInteger(params[0]) || params[0] < 1 || params[0] > 1008))) throw new Error("Invalid fee target");
  }

  if (chain === "SOL") {
    if ((method === "getBalance" || method === "getAccountInfo" || method === "getTokenAccountsByOwner") && typeof params[0] !== "string") {
      throw new Error("Invalid Solana account");
    }
    if ((method === "getTransaction" || method === "getSignatureStatuses") && typeof params[0] !== "object" && !Array.isArray(params[0])) {
      if (typeof params[0] !== "string" && !Array.isArray(params[0])) throw new Error("Invalid Solana signature parameter");
    }
  }

  if (chain !== "BTC" && chain !== "SOL") {
    if (method === "eth_getBalance" || method === "eth_getCode" || method === "eth_getTransactionCount") {
      if (typeof params[0] !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(params[0])) throw new Error("Invalid EVM address");
    }
    if (method === "eth_getTransactionByHash" || method === "eth_getTransactionReceipt" || method === "eth_getBlockByHash") {
      if (typeof params[0] !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(params[0])) throw new Error("Invalid EVM hash");
    }
    if (method === "eth_getBlockByNumber" && (typeof params[0] !== "string" || params[0].length > 80)) throw new Error("Invalid block tag");
    if (method === "eth_call" || method === "eth_estimateGas") {
      if (!params[0] || typeof params[0] !== "object" || Array.isArray(params[0])) throw new Error("Invalid EVM call object");
      requireJsonSize(params[0], "EVM call object", 24 * 1024);
    }
  }
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required");
if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is required");

async function requireUser(request: Request) {
  const authorization = request.headers.get("Authorization") ?? request.headers.get("authorization");
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    throw new Error("Authentication is required");
  }

  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Authentication is required");
  return data.user;
}

const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);

async function fetchWithRetry(url: string, init: RequestInit, reqId: string, label: string, allowRetry = true): Promise<Response> {
  let lastErr: unknown;
  const attempts = allowRetry ? RETRY_ATTEMPTS : 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    const started = Date.now();
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      const durationMs = Date.now() - started;
      if (TRANSIENT_STATUS.has(res.status) && attempt < attempts && res.status !== 429) {
        log("warn", "upstream_transient", { reqId, label, status: res.status, attempt, durationMs });
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)));
        continue;
      }
      log("info", "upstream_response", { reqId, label, status: res.status, attempt, durationMs });
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt >= attempts) break;
      await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
  }
  throw new Error(`Upstream unreachable: ${(lastErr as Error)?.message || label}`);
}

async function readLimitedBody(req: Request): Promise<unknown> {
  const cl = req.headers.get("content-length");
  if (cl && (!/^\d+$/.test(cl) || Number(cl) > MAX_BODY_BYTES)) throw new Error("Request body too large");
  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_BODY_BYTES) throw new Error("Request body too large");
  try { return JSON.parse(new TextDecoder().decode(buf)); } catch { throw new Error("Invalid JSON body"); }
}

async function readLimitedUpstream(res: Response, asText = false): Promise<unknown> {
  const cl = res.headers.get("content-length");
  if (cl && (!/^\d+$/.test(cl) || Number(cl) > MAX_UPSTREAM_BYTES)) throw new Error("Upstream response too large");
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_UPSTREAM_BYTES) throw new Error("Upstream response too large");
  const text = new TextDecoder().decode(buf);
  if (asText) return text;
  try { return text.length ? JSON.parse(text) : null; } catch { return null; }
}

function alchemyKey(): string {
  const key = Deno.env.get("ALCHEMY_API_KEY");
  if (!key || key.length > 256) throw new Error("ALCHEMY_API_KEY is not configured");
  return key;
}

async function alchemyRpc(network: string, method: string, params: unknown[], reqId: string) {
  const upstream = await fetchWithRetry(
    alchemyUrl(network, alchemyKey()),
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) },
    reqId,
    `alchemy:${network}:${method}`,
    !["eth_call", "eth_estimateGas", "alchemy_getAssetTransfers"].includes(method),
  );
  return { status: upstream.status, payload: await readLimitedUpstream(upstream) as any };
}

async function forwardRpc(request: Request, chain: string, method: string, params: unknown[], cors: Record<string, string>, reqId: string) {
  const network = ALCHEMY_CHAINS[chain];
  if (!network) throw new Error(`Chain "${chain}" is not supported by the generic RPC lane`);
  if (method.length > 100) throw new Error("Invalid RPC method");
  const isEvmChain = new Set(["ETH", "ARB", "POL", "MATIC", "OP", "BASE", "BNB"]).has(chain);
  const isBroadcast = chain === "SOL" ? method === "sendTransaction" : chain === "BTC" ? method === BTC_BROADCAST_METHOD : isEvmChain && method === "eth_sendRawTransaction";

  if (!isBroadcast) {
    const allowed = chain === "SOL" ? READ_ONLY_SOL_METHODS : chain === "BTC" ? READ_ONLY_BTC_METHODS : READ_ONLY_EVM_METHODS;
    if (!allowed.has(method)) throw new Error(`RPC method not allowed: ${method}`);
  }

  validateRpcParams(chain, method, params);

  if (isBroadcast) {
    if (chain === "BTC" && (typeof params[0] !== "string" || !isHex(params[0]) || params[0].length < 20 || params[0].length > 2_000_000)) throw new Error("Invalid raw Bitcoin transaction");
    if (chain === "SOL" && (typeof params[0] !== "string" || params[0].length > 2_000_000)) throw new Error("Invalid Solana transaction payload");
    if (isEvmChain && (typeof params[0] !== "string" || !/^0x[0-9a-fA-F]+$/.test(params[0]) || params[0].length > 2_000_000)) throw new Error("Invalid signed EVM transaction");
    const user = await requireUser(request);
    if (!rateLimit(`bcast:${user.id}`, RATE_LIMIT_BROADCAST_MAX)) return json({ error: "Broadcast rate limit exceeded" }, 429, cors);
  }

  const { status, payload } = await alchemyRpc(network, method, params, reqId);
  if (status >= 400) return json({ error: payload?.error?.message || `RPC HTTP ${status}` }, status, cors);
  return json(payload, 200, cors);
}

const BTC_FEE_TARGETS = { fast: 1, normal: 3, slow: 6 } as const;
async function bitcoinFees(cors: Record<string, string>, reqId: string) {
  const entries = await Promise.all(Object.entries(BTC_FEE_TARGETS).map(async ([tier, blocks]) => {
    const { payload } = await alchemyRpc("bitcoin-mainnet", "estimatesmartfee", [blocks, "CONSERVATIVE"], reqId);
    const feerate = Number(payload?.result?.feerate ?? 0);
    const satPerVb = feerate > 0 ? Math.max(1, Math.ceil((feerate * 1e8) / 1000)) : null;
    return [tier, satPerVb] as const;
  }));
  const fees = Object.fromEntries(entries) as Record<string, number | null>;
  if (fees.fast === null && fees.normal === null && fees.slow === null) throw new Error("Bitcoin fee estimation unavailable");
  const fallback = fees.fast ?? fees.normal ?? fees.slow ?? 1;
  return json({ unit: "sat/vB", source: "alchemy:estimatesmartfee", fast: fees.fast ?? fallback, normal: fees.normal ?? fallback, slow: fees.slow ?? fallback, minimum: 1 }, 200, cors);
}

const btcIndexerUrl = () => {
  const value = (Deno.env.get("BTC_INDEXER_URL") ?? "https://mempool.space/api").replace(/\/$/, "");
  if (!/^https:\/\//i.test(value)) throw new Error("BTC_INDEXER_URL must use HTTPS");
  return value;
};

async function btcTipHeight(reqId: string): Promise<number> {
  try {
    const res = await fetchWithRetry(`${btcIndexerUrl()}/blocks/tip/height`, { method: "GET" }, reqId, "btc-indexer:tip");
    if (!res.ok) return 0;
    const text = (await res.text()).trim();
    const height = Number(text);
    return Number.isSafeInteger(height) && height > 0 ? height : 0;
  } catch { return 0; }
}

async function bitcoinAddress(kind: "utxos" | "summary", address: string, cors: Record<string, string>, reqId: string) {
  const suffix = kind === "utxos" ? "/utxo" : "";
  const upstream = await fetchWithRetry(`${btcIndexerUrl()}/address/${encodeURIComponent(address)}${suffix}`, { method: "GET" }, reqId, `btc-indexer:${kind}`);
  const payload = await readLimitedUpstream(upstream);
  if (!upstream.ok) return json({ error: `Bitcoin indexer HTTP ${upstream.status}` }, upstream.status, cors);

  if (kind === "summary") {
    const s = payload as any;
    const funded = Number(s?.chain_stats?.funded_txo_sum ?? 0) + Number(s?.mempool_stats?.funded_txo_sum ?? 0);
    const spent = Number(s?.chain_stats?.spent_txo_sum ?? 0) + Number(s?.mempool_stats?.spent_txo_sum ?? 0);
    if (!Number.isSafeInteger(funded) || !Number.isSafeInteger(spent)) throw new Error("Invalid Bitcoin indexer balance");
    return json({ address, decimals: 8, symbol: "BTC", raw: String(funded - spent) }, 200, cors);
  }

  const list = Array.isArray(payload) ? payload : [];
  const tip = await btcTipHeight(reqId);
  const utxos = list.slice(0, 500).map((u: any) => {
    if (typeof u?.txid !== "string" || !/^[0-9a-fA-F]{64}$/.test(u.txid)) throw new Error("Invalid Bitcoin UTXO txid");
    if (!Number.isInteger(u?.vout) || u.vout < 0 || u.vout > 10_000) throw new Error("Invalid Bitcoin UTXO index");
    if (!Number.isSafeInteger(u?.value) || u.value < 0) throw new Error("Invalid Bitcoin UTXO value");
    const blockHeight = u?.status?.block_height ?? null;
    const confirmed = u?.status?.confirmed === true && Number.isSafeInteger(blockHeight) && blockHeight > 0;
    const confirmations = !confirmed ? 0 : tip > 0 ? Math.max(tip - Number(blockHeight) + 1, 1) : 0;
    return { txid: u.txid, vout: u.vout, value: u.value, confirmed, confirmations, spendable: confirmed && confirmations >= 1, blockHeight };
  });

  return json({ address, utxos, spendableUtxos: utxos.filter((u) => u.spendable), total: utxos.reduce((sum, u) => sum + u.value, 0) }, 200, cors);
}

async function xrplCall(command: string, params: Record<string, unknown>, reqId: string) {
  const upstream = await fetchWithRetry(xrplUrl(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: command, params: [params] }) }, reqId, `xrpl:${command}`);
  return { status: upstream.status, payload: await readLimitedUpstream(upstream) as any };
}

function validateXrpParams(command: string, params: Record<string, unknown>) {
  requireJsonSize(params, "XRPL params", 32 * 1024);
  if (command === "account_info" || command === "account_lines" || command === "account_objects" || command === "account_tx" || command === "gateway_balances") {
    if (params.account !== undefined) requireXrpAddress(params.account);
  }
  if (command === "tx" && params.transaction !== undefined && (typeof params.transaction !== "string" || !/^[0-9A-Fa-f]{64}$/.test(params.transaction))) throw new Error("Invalid XRPL transaction hash");
  if (command === "submit_multisigned_dry" && params.tx_json !== undefined) requireJsonSize(params.tx_json, "XRPL tx_json", 24 * 1024);
}

async function forwardXrp(request: Request, command: string, params: Record<string, unknown>, cors: Record<string, string>, reqId: string) {
  if (command.length > 60) throw new Error("Invalid XRPL command");
  const isBroadcast = command === XRP_BROADCAST_METHOD;
  if (!isBroadcast && !READ_ONLY_XRP_METHODS.has(command)) throw new Error(`XRPL command not allowed: ${command}`);

  if (isBroadcast) {
    if (typeof params.tx_blob !== "string" || !/^[0-9A-Fa-f]{100,200000}$/.test(params.tx_blob)) throw new Error("XRPL submit requires a valid signed tx_blob");
    const user = await requireUser(request);
    if (!rateLimit(`bcast:${user.id}`, RATE_LIMIT_BROADCAST_MAX)) return json({ error: "Broadcast rate limit exceeded" }, 429, cors);
  } else {
    validateXrpParams(command, params);
  }

  const { status, payload } = await xrplCall(command, isBroadcast ? { tx_blob: params.tx_blob } : params, reqId);
  const result = payload?.result;
  if (status >= 400 || result?.error) return json({ error: result?.error_message || result?.error || `XRPL HTTP ${status}` }, status >= 400 ? status : 400, cors);
  return json(payload, 200, cors);
}

async function xrpFees(cors: Record<string, string>, reqId: string) {
  const { payload } = await xrplCall("fee", {}, reqId);
  const drops = payload?.result?.drops;
  const base = Number(drops?.minimum_fee ?? 10);
  const normal = Number(drops?.median_fee ?? base);
  const fast = Number(drops?.open_ledger_fee ?? normal);
  if (![base, normal, fast].every((n) => Number.isFinite(n) && n >= 0 && n <= 10_000_000)) throw new Error("XRP fee estimation unavailable");
  return json({ unit: "drops", source: "xrpl:fee", fast: Math.max(base, Math.ceil(fast)), normal: Math.max(base, Math.ceil(normal)), slow: Math.max(1, Math.ceil(base)), minimum: Math.max(1, Math.ceil(base)) }, 200, cors);
}

async function xrpBalance(address: unknown, cors: Record<string, string>, reqId: string) {
  const account = requireXrpAddress(address);
  const { payload } = await xrplCall("account_info", { account, ledger_index: "validated" }, reqId);
  const result = payload?.result;
  if (result?.error === "actNotFound") return json({ address: account, decimals: 6, symbol: "XRP", raw: "0", funded: false }, 200, cors);
  if (result?.error) return json({ error: result.error_message || result.error }, 400, cors);
  return json({ address: account, decimals: 6, symbol: "XRP", raw: String(result?.account_data?.Balance ?? "0"), sequence: result?.account_data?.Sequence ?? null, funded: true }, 200, cors);
}

async function forwardTron(request: Request, path: string, method: string, body: unknown, cors: Record<string, string>, reqId: string) {
  if (method === "GET") {
    if (!TRON_GET_PATTERNS.some((r) => r.test(path))) throw new Error("Tron path not allowed");
  } else if (method === "POST") {
    if (!TRON_POST_PATHS.has(path)) throw new Error("Tron path not allowed");
    if (path === "/wallet/broadcasttransaction" || path === "/wallet/broadcasthex") {
      const user = await requireUser(request);
      if (!rateLimit(`bcast:${user.id}`, RATE_LIMIT_BROADCAST_MAX)) return json({ error: "Broadcast rate limit exceeded" }, 429, cors);
    }
    requireJsonSize(body ?? {}, "Tron body", 48 * 1024);
  } else throw new Error("Unsupported Tron method");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const tronGridKey = Deno.env.get("TRONGRID_API_KEY");
  if (tronGridKey) headers["TRON-PRO-API-KEY"] = tronGridKey;

  const init: RequestInit = { method, headers, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined };
  let upstream: Response | null = null;
  let usedFallback = false;
  const alchemyApiKey = Deno.env.get("ALCHEMY_API_KEY");

  if (alchemyApiKey) {
    try {
      upstream = await fetchWithRetry(`${alchemyUrl(ALCHEMY_CHAINS.TRX, alchemyApiKey)}${path}`, init, reqId, `alchemy:tron:${method}:${path}`);
      if (upstream.status >= 500 || upstream.status === 429) upstream = null;
    } catch { upstream = null; }
  }

  if (!upstream) {
    usedFallback = true;
    log("warn", "tron_fallback_trongrid", { reqId, path });
    upstream = await fetchWithRetry(`https://api.trongrid.io${path}`, init, reqId, `trongrid:${method}:${path}`);
  }

  const payload = await readLimitedUpstream(upstream);
  if (!upstream.ok) return json({ error: (payload as any)?.message || `Tron HTTP ${upstream.status}`, source: usedFallback ? "trongrid" : "alchemy" }, upstream.status, cors);
  return json(payload, 200, cors);
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const cors = corsHeadersFor(origin);
  const reqId = crypto.randomUUID();

  if (request.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response("forbidden", { status: 403 });
    return new Response("ok", { headers: cors });
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { "Content-Type": "application/json" } });
  if (request.method !== "POST") return json({ error: "POST required" }, 405, cors);

  const startedAt = Date.now();
  let userId = "unknown";
  try {
    // Authentication is required for reads as well as broadcasts. CORS is not an access-control boundary.
    const user = await requireUser(request);
    userId = user.id;

    if (!rateLimit(`user:${user.id}`, RATE_LIMIT_MAX)) return json({ error: "Rate limit exceeded" }, 429, cors);

    const input = await readLimitedBody(request) as Record<string, unknown>;
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid request object");
    const action = requireString(input.action, "action", 32);
    log("info", "request", { reqId, userId, action });

    let response: Response;
    if (action === "rpc") {
      response = await forwardRpc(request, requireString(input.chain, "chain", 16).toUpperCase(), requireString(input.method, "method", 100), Array.isArray(input.params) ? input.params : [], cors, reqId);
    } else if (action === "btc_fees") {
      response = await bitcoinFees(cors, reqId);
    } else if (action === "btc_utxos") {
      response = await bitcoinAddress("utxos", requireBtcAddress(input.address), cors, reqId);
    } else if (action === "btc_balance") {
      response = await bitcoinAddress("summary", requireBtcAddress(input.address), cors, reqId);
    } else if (action === "xrp") {
      const params = input.params && typeof input.params === "object" && !Array.isArray(input.params) ? input.params as Record<string, unknown> : {};
      response = await forwardXrp(request, requireString(input.command, "command", 60), params, cors, reqId);
    } else if (action === "xrp_fees") {
      response = await xrpFees(cors, reqId);
    } else if (action === "xrp_balance") {
      response = await xrpBalance(input.address, cors, reqId);
    } else if (action === "tron") {
      response = await forwardTron(request, normalizePath(input.path), String(input.method || "GET").toUpperCase(), input.body, cors, reqId);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    log("info", "response", { reqId, userId, action, status: response.status, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gateway request failed";
    // Do not log Authorization headers, request bodies, RPC params, tx blobs, or API keys.
    log("error", "request_failed", { reqId, userId, error: message, durationMs: Date.now() - startedAt });
    const status = message === "Authentication is required" ? 401 : message === "Origin not allowed" ? 403 : 400;
    return json({ error: message }, status, cors);
  }
});
