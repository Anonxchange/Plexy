/**
 * ============================================================
 *  PEXLY CRYPTO VAULT WORKER — signing.worker.ts
 * ============================================================
 *
 * This is the Worker ENTRY POINT — the one file the `Worker` constructor in
 * use-signing-worker.ts loads (`new Worker(new URL("../lib/signing.worker.ts", ...))`).
 * It owns the postMessage protocol (WorkerRequest/WorkerResponse, the message
 * dispatch loop) and everything chain-specific: RPC calls through the Supabase
 * chain-gateway edge function, EIP-1559 fee logic, and transaction building
 * + signing for EVM only. Bitcoin/Solana/TRON signing is deliberately not exposed until each protocol has a tested transaction implementation.
 *
 * Mnemonic generation, per-chain key/address derivation, and vault
 * encryption/decryption live in ./vault-crypto.ts, which this file imports.
 * That split is source-file organisation only — the runtime architecture,
 * the postMessage security properties, and the "nothing sensitive crosses
 * the wire" invariants described below are unchanged and still enforced
 * entirely within this one Worker thread (across its two source files).
 *
 * ─── What NEVER crosses the postMessage wire ─────────────────────────────────
 *   • Plaintext mnemonics (except the one controlled path: getMnemonicForBackup)
 *   • Raw private keys of any chain
 *   • Scrypt-derived key material
 *   • Plaintext passwords (received as passwordBytes, zero-filled after use)
 *
 * ─── Signing coverage ─────────────────────────────────────────────────────────
 *   EVM   — RLP + keccak-256 + ECDSA (EIP-155 legacy + EIP-1559 type-2)
 *   BTC   — Native SegWit (P2WPKH) via @scure/btc-signer, with network UTXO verification
 *   SOL   — SLIP-0010 (m/44'/501'/0'/0) + ed25519, canonical legacy message serialization
 *   TRX   — TRON protobuf raw_data_hex supplied by the gateway, SHA-256 + secp256k1 signature
 */

// ─── Imports ──────────────────────────────────────────────────────────────────

import * as RLP      from "@ethereumjs/rlp";
import * as secp      from "@noble/secp256k1";
import * as btc       from "@scure/btc-signer";
import * as nobleEd   from "@noble/ed25519";
import { base58 }     from "@scure/base";


import { keccak_256 } from "@noble/hashes/sha3.js";
import { sha256 }     from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import {
  wipeBytes,
  clearSessionCache,
  parseVault,
  workerValidateMnemonic,
  deriveEVMKey,
  deriveBTCPrivateKey,
  deriveSOLPrivateKey,
  deriveTRONPrivateKey,
  encryptVault,
  encryptVaultBatch,
  openVault,
  migrateLegacyVault,
  createSecureWallet,
  getMnemonicForBackup,
  validateVaultPassword,
  workerHash,
  workerHmacSha256,
} from "./vault-crypto";
import type {
  EncryptedVault,
  KdfParams,
  MultiChainWalletResult,
  SecureWalletResult,
  PasskeyVault,
} from "./vault-crypto";

// Re-export vault-crypto's types so use-signing-worker.ts's existing
// `export type { EncryptedVault, PasskeyVault, MultiChainWalletResult, SecureWalletResult, KdfParams } from "./signing.worker"`
// keeps working unmodified — this file is still "the worker module" as far
// as every external import is concerned.
export type { EncryptedVault, PasskeyVault, KdfParams, MultiChainWalletResult, SecureWalletResult };

// ─── Chain configs ────────────────────────────────────────────────────────────

// rpcUrl / rpcFallbacks removed — all RPC calls now go through the Supabase
// chain-gateway edge function via workerGatewayRpc(). No direct public-node calls.
const CHAIN_CONFIGS: Record<string, {
  chainId: number;
  symbol: string;
  /** true = EIP-1559 type-2 tx by default; false = legacy type-0 only */
  eip1559: boolean;
}> = {
  ETH:  { chainId: 1,     symbol: "ETH", eip1559: true  },
  BSC:  { chainId: 56,    symbol: "BNB", eip1559: false },
  BNB:  { chainId: 56,    symbol: "BNB", eip1559: false },
  ARB:  { chainId: 42161, symbol: "ETH", eip1559: true  },
  POL:  { chainId: 137,   symbol: "POL",  eip1559: true  },
  MATIC:{ chainId: 137,   symbol: "POL",  eip1559: true  },
  AVAX: { chainId: 43114, symbol: "AVAX", eip1559: true  },
};

const TOKEN_CONTRACTS: Record<string, { address: string; decimals: number }> = {
  USDT_ETH:  { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6  },
  USDC_ETH:  { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6  },
  USDT_BSC:  { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
  USDC_BSC:  { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
  USDT_BNB:  { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
  USDC_BNB:  { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
  USDT_ARB:  { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6  },
  USDC_ARB:  { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6  },
  USDCE_ARB: { address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6  },
};

const NATIVE_CURRENCIES: Record<string, Set<string>> = {
  ETH: new Set(["ETH"]),
  BSC: new Set(["BNB"]),
  BNB: new Set(["BNB"]),
  ARB: new Set(["ETH"]),
  POL: new Set(["POL", "MATIC"]),
  MATIC: new Set(["POL", "MATIC"]),
  AVAX: new Set(["AVAX"]),
};

function assertSupportedCurrency(currency: string, baseChain: string): void {
  if (TOKEN_CONTRACTS[currency]) return;
  if (!NATIVE_CURRENCIES[baseChain]?.has(currency)) {
    throw new Error(`Unsupported currency ${currency} on ${baseChain}`);
  }
}

// ─── Gateway RPC helpers ───────────────────────────────────────────────────────
// All blockchain reads are routed through the Supabase chain-gateway edge
// function (Alchemy-backed) instead of calling public nodes directly.
// This applies to nonce, gas price, gas estimation, and any other read-only
// eth_* call made from within the signing worker.

/** Maps local CHAIN_CONFIGS key → Alchemy chain identifier used by chain-gateway. */
const WORKER_GATEWAY_CHAIN: Record<string, string> = { BSC: "BNB", BNB: "BNB", MATIC: "POL" };
function workerGatewayChain(key: string): string {
  return WORKER_GATEWAY_CHAIN[key] ?? key;
}

/**
 * Routes a read-only JSON-RPC call through the Supabase chain-gateway edge
 * function (Alchemy-backed). Returns the JSON-RPC `.result` value directly
 * so callers can use it as a hex string without further unwrapping.
 *
 * Replaces the old `rpcCall()` helper that made direct calls to hardcoded
 * public RPC endpoints (publicnode.com, drpc.org, etc.).
 */
let currentAccessToken: string | undefined;

async function workerGatewayRpc(chain: string, method: string, params: unknown[], accessToken?: string): Promise<unknown> {
  accessToken = accessToken ?? currentAccessToken;
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  const anonKey    = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
  if (!supabaseUrl || !anonKey) {
    throw new Error("chain-gateway: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.");
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/chain-gateway`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ action: "rpc", chain: chain.toUpperCase(), method, params }),
      signal: ctrl.signal,
    });
    let data: any;
    try { data = await res.json(); } catch { throw new Error(`Gateway returned non-JSON (HTTP ${res.status})`); }
    if (!res.ok || data?.error) {
      throw new Error(formatWorkerRpcError(data?.error ?? data?.message ?? `Gateway HTTP ${res.status}`));
    }
    // Extract the JSON-RPC result from the {result, jsonrpc, id} envelope
    return data?.result ?? data;
  } finally {
    clearTimeout(t);
  }
}

async function workerGatewayTron(path: string, body: unknown, accessToken?: string): Promise<any> {
  accessToken = accessToken ?? currentAccessToken;
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
  if (!supabaseUrl || !anonKey) throw new Error("chain-gateway: Supabase environment is missing");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/chain-gateway`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: anonKey, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ action: "tron", path, method: "POST", body }), signal: ctrl.signal
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.error) throw new Error(formatWorkerRpcError(data?.error ?? data?.message ?? `Gateway HTTP ${res.status}`));
    return data;
  } finally { clearTimeout(t); }
}

function parseDecimalUnits(value: unknown, decimals: number, name: string): bigint {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) throw new Error(`Invalid ${name}`);
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) throw new Error(`${name} has more than ${decimals} decimal places`);
  return BigInt(whole) * (10n ** BigInt(decimals)) + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0");
}

function u64le(value: bigint): number[] {
  if (value < 0n || value > 0xffffffffffffffffn) throw new Error("u64 value out of range");
  const out = new Array<number>(8); let x = value;
  for (let i = 0; i < 8; i++) { out[i] = Number(x & 0xffn); x >>= 8n; }
  return out;
}

function solShortVec(n: number): number[] {
  if (!Number.isInteger(n) || n < 0) throw new Error("Invalid Solana vector length");
  const out: number[] = []; let x = n;
  do { let b = x & 0x7f; x = Math.floor(x / 128); if (x) b |= 0x80; out.push(b); } while (x);
  return out;
}

function buildSolanaLegacyMessage(payer: Uint8Array, recentBlockhash: Uint8Array, keys: Uint8Array[], programIndex: number, accountIndexes: number[], data: Uint8Array, readonlyUnsigned: number): Uint8Array {
  if (recentBlockhash.length !== 32) throw new Error("Invalid Solana recent blockhash");
  const header = [1, 0, readonlyUnsigned];
  return new Uint8Array([
    ...header, ...solShortVec(keys.length), ...keys.flatMap(k => Array.from(k)),
    ...recentBlockhash, ...solShortVec(1), programIndex, ...solShortVec(accountIndexes.length),
    ...accountIndexes, ...solShortVec(data.length), ...data
  ]);
}

function decodeRpcBytes(data: unknown): Uint8Array {
  if (!Array.isArray(data) || typeof data[0] !== "string") throw new Error("Invalid Solana account data");
  if (data[1] !== "base64") throw new Error("Solana account data must be base64");
  const bin = atob(data[0]); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function tronAddressToHex(address: string): string {
  if (typeof address !== "string" || !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) throw new Error("Invalid TRON address");
  const raw = base58.decode(address);
  if (raw.length !== 25 || raw[0] !== 0x41) throw new Error("Invalid TRON address checksum payload");
  const body = raw.slice(0, 21); const checksum = sha256(sha256(body)).slice(0, 4);
  for (let i = 0; i < 4; i++) if (checksum[i] !== raw[21 + i]) throw new Error("Invalid TRON address checksum");
  return bytesToHex(body);
}

function tronAddressFromPrivateKey(priv: Uint8Array): string {
  const pub = secp.getPublicKey(priv, false);
  const body = new Uint8Array([0x41, ...keccak_256(pub.slice(1)).slice(-20)]);
  const full = new Uint8Array([...body, ...sha256(sha256(body)).slice(0, 4)]);
  return base58.encode(full);
}

function formatWorkerRpcError(value: unknown): string {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const error = value as Record<string, unknown>;
    const nested = error.error;
    if (nested && nested !== value) return formatWorkerRpcError(nested);
    const message = error.message ?? error.msg ?? error.detail ?? error.reason;
    if (typeof message === "string" && message.trim()) {
      return message.replace(/\s*\(code\s+[-\d]+\)\s*$/i, "").trim();
    }
    try { return JSON.stringify(value); } catch { return "Unknown RPC error"; }
  }
  return String(value || "Unknown RPC error");
}

// ─── RPC response validators ──────────────────────────────────────────────────
// Every value that comes back from an untrusted public RPC endpoint is checked
// against hard bounds before it enters any BigInt / signing path.
// An attacker who can MitM the RPC response could otherwise:
//   • Inject a nonce of 0 to replay old transactions
//   • Return an absurdly high gasPrice to drain the sender
//   • Return a gasLimit of 0 to make the signed tx always fail

const RPC_NONCE_MAX        = 2 ** 32;          // no wallet has >4 billion txs
const RPC_GAS_PRICE_MIN    = 1_000_000n;        // 0.001 gwei floor (stale RPC)
const RPC_GAS_PRICE_MAX    = 50_000n * 1_000_000_000n; // 50 000 gwei ceiling
const RPC_GAS_LIMIT_MIN    = 21_000n;
const RPC_GAS_LIMIT_MAX    = 15_000_000n;       // Ethereum block gas limit

function validateRpcNonce(raw: unknown): number {
  let n: number;
  if (typeof raw === "string") {
    if (!/^0x[0-9a-fA-F]+$/.test(raw)) throw new Error(`RPC returned invalid nonce: ${JSON.stringify(raw)}`);
    n = Number(BigInt(raw));
  } else {
    n = Number(raw);
  }
  if (!Number.isSafeInteger(n) || n < 0 || n > RPC_NONCE_MAX) {
    throw new Error(`RPC returned implausible nonce: ${JSON.stringify(raw)}`);
  }
  return n;
}

function validateRpcGasPrice(raw: unknown): bigint {
  let v: bigint;
  try { v = BigInt(typeof raw === "string" ? raw : String(raw)); }
  catch { throw new Error(`RPC returned non-numeric gasPrice: ${JSON.stringify(raw)}`); }
  if (v < RPC_GAS_PRICE_MIN || v > RPC_GAS_PRICE_MAX) {
    throw new Error(
      `RPC gasPrice out of safe range: ${v} wei (${v / 1_000_000_000n} gwei). ` +
      `Acceptable: 0.001–50 000 gwei. Possible RPC manipulation — tx rejected.`
    );
  }
  return v;
}

function tryValidateRpcGasPrice(raw: unknown): bigint | null {
  try {
    return validateRpcGasPrice(raw);
  } catch {
    return null;
  }
}

interface FeeHistoryFallback {
  latestBaseFeePerGas: bigint;
  priorityFeePerGas: bigint;
}

/**
 * Some RPC providers return zero for eth_gasPrice and/or
 * eth_maxPriorityFeePerGas while feeHistory is still populated. Use the
 * canonical EIP-1559 fee-history method before rejecting the transaction.
 *
 * This is deliberately not a hardcoded gas-price fallback: the values still
 * come from the authenticated chain gateway and are checked against the same
 * safety bounds as every other RPC-derived fee.
 */
async function getFeeHistoryFallback(chain: string): Promise<FeeHistoryFallback> {
  const raw = await workerGatewayRpc(chain, "eth_feeHistory", ["0x5", "latest", [25, 50, 75]]) as any;
  const baseFees = Array.isArray(raw?.baseFeePerGas) ? raw.baseFeePerGas : [];
  const rewards = Array.isArray(raw?.reward) ? raw.reward : [];

  // eth_feeHistory returns one more base fee than the number of sampled
  // blocks; the final entry is the next block's base fee and is the best
  // current estimate for maxFeePerGas.
  const latestBaseFeePerGas = tryValidateRpcGasPrice(baseFees[baseFees.length - 1]);
  if (latestBaseFeePerGas == null) {
    throw new Error("RPC feeHistory did not contain a valid base fee");
  }

  const priorityCandidates = rewards
    .flatMap((row: unknown) => Array.isArray(row) ? row : [])
    .map((value: unknown) => tryValidateRpcGasPrice(value))
    .filter((value: bigint | null): value is bigint => value != null)
    .sort((a: bigint, b: bigint) => a < b ? -1 : a > b ? 1 : 0);

  if (priorityCandidates.length === 0) {
    throw new Error("RPC feeHistory did not contain a valid priority fee");
  }

  return {
    latestBaseFeePerGas,
    priorityFeePerGas: priorityCandidates[Math.floor(priorityCandidates.length / 2)],
  };
}

function validateRpcGasLimit(raw: unknown, floorOverride?: bigint): bigint {
  let v: bigint;
  try { v = BigInt(typeof raw === "string" ? raw : String(raw)); }
  catch { throw new Error(`RPC returned non-numeric gasLimit: ${JSON.stringify(raw)}`); }
  const floor = floorOverride ?? RPC_GAS_LIMIT_MIN;
  if (v < floor || v > RPC_GAS_LIMIT_MAX) {
    throw new Error(
      `RPC gasLimit out of safe range: ${v}. ` +
      `Acceptable: ${floor}–${RPC_GAS_LIMIT_MAX}.`
    );
  }
  return v;
}

// ─── ⑦  EVM transaction signing ──────────────────────────────────────────────

const MAX_REQUEST_STRING = 16 * 1024;
const MAX_DATA_BYTES = 128 * 1024;

function assertString(value: unknown, name: string, max = MAX_REQUEST_STRING): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > max) {
    throw new Error(`Invalid ${name}`);
  }
}

function assertHex(value: unknown, name: string, bytes?: number): string {
  assertString(value, name, bytes == null ? MAX_DATA_BYTES : bytes * 2 + 2);
  const stripped = value.startsWith("0x") ? value.slice(2) : value;
  if (stripped.length % 2 || !/^[0-9a-fA-F]*$/.test(stripped)) {
    throw new Error(`Invalid ${name}: expected hexadecimal data`);
  }
  if (bytes != null && stripped.length !== bytes * 2) {
    throw new Error(`Invalid ${name}: expected ${bytes} bytes`);
  }
  return "0x" + stripped;
}

function assertAddress(value: unknown, name = "address"): string {
  assertString(value, name, 42);
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`Invalid ${name}: expected a 20-byte EVM address`);
  }
  return value;
}

function assertPositiveDecimal(value: unknown, name: string, decimals: number): string {
  assertString(value, name, 128);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    throw new Error(`Invalid ${name}`);
  }
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) {
    throw new Error(`${name} has more than ${decimals} decimal places`);
  }
  if (BigInt(whole) === 0n && BigInt(fraction || "0") === 0n) {
    throw new Error(`${name} must be greater than zero`);
  }
  return value;
}

const MAX_INTENT_STRING = 4096;

function canonicalIntent(value: Record<string, unknown>): string {
  const keys = Object.keys(value).sort();
  const ordered: Record<string, unknown> = Object.create(null);
  for (const key of keys) ordered[key] = value[key];
  return JSON.stringify(ordered);
}

async function intentDigest(intent: Record<string, unknown>): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalIntent(intent));
  return "0x" + bytesToHex(sha256(bytes));
}

function assertIntentDigest(value: unknown): string {
  return assertHex(value, "approvalDigest", 32);
}

// Prepared approvals live only inside this Worker. A digest supplied by the
// UI is not enough: the Worker must have issued the exact approval first, and
// every approval is single-use and short-lived. This prevents replay and stops
// the UI from changing the transaction after preparation. It does NOT prove
// that the browser UI itself was honest; a fully compromised origin can still
// ask the Worker to prepare and approve a malicious transaction. A hardware
// signer / external trusted display is required for that stronger guarantee.
const APPROVAL_TTL_MS = 90_000;
const MAX_PENDING_APPROVALS = 8;
const pendingApprovals = new Map<string, { expiresAt: number; from: string; intent: Record<string, unknown> }>();

function rememberApproval(approvalDigest: string, from: string, intent: Record<string, unknown>): void {
  const now = Date.now();
  for (const [digest, entry] of pendingApprovals) {
    if (entry.expiresAt <= now) pendingApprovals.delete(digest);
  }
  if (pendingApprovals.size >= MAX_PENDING_APPROVALS) {
    throw new Error("Too many pending transaction approvals; finish or cancel an existing approval first");
  }
  pendingApprovals.set(approvalDigest, { expiresAt: now + APPROVAL_TTL_MS, from: from.toLowerCase(), intent });
}

function consumeApproval(approvalDigest: string, from: string, intent: Record<string, unknown>): void {
  const entry = pendingApprovals.get(approvalDigest);
  pendingApprovals.delete(approvalDigest);
  if (!entry || entry.expiresAt <= Date.now()) throw new Error("Transaction approval expired or was not prepared by this Worker");
  if (entry.from !== from.toLowerCase()) throw new Error("Transaction approval belongs to a different wallet address");
  if (canonicalIntent(entry.intent) !== canonicalIntent(intent)) throw new Error("Transaction approval does not match the exact prepared transaction");
}

function clearPendingApprovals(): void {
  pendingApprovals.clear();
}

function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ""] = amount.split(".");
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction) || fraction.length > decimals) {
    throw new Error("Invalid token amount or excessive precision");
  }
  return BigInt(whole) * (10n ** BigInt(decimals)) +
    BigInt(fraction.padEnd(decimals, "0") || "0");
}

function encodeERC20Transfer(to: string, amount: bigint): string {
  const address = assertAddress(to, "token recipient").slice(2).toLowerCase();
  if (amount < 0n || amount >= (1n << 256n)) throw new Error("Invalid token amount");
  const selector = keccak_256(new TextEncoder().encode("transfer(address,uint256)")).slice(0, 4);
  const paddedTo  = address.padStart(64, "0");
  const paddedAmt = amount.toString(16).padStart(64, "0");
  return "0x" + bytesToHex(selector) + paddedTo + paddedAmt;
}

// ─── EIP-1559 helper ──────────────────────────────────────────────────────────
// Prepend the transaction type byte to an RLP-encoded payload.
function prependTxType(type: number, rlpPayload: Uint8Array): Uint8Array {
  const out = new Uint8Array(1 + rlpPayload.length);
  out[0] = type;
  out.set(rlpPayload, 1);
  return out;
}

/**
 * Shared EIP-1559 type-2 / legacy type-0 EVM signing core.
 * Eliminates the duplicate signing block that existed in both EVM handlers.
 */
function validateTxType(value: unknown, config: typeof CHAIN_CONFIGS[string]): 0 | 2 | null {
  if (value == null) return null;
  if (value !== 0 && value !== 2) throw new Error("Unsupported EVM transaction type");
  if (value === 2 && !config.eip1559) throw new Error("EIP-1559 transactions are not supported on this chain");
  return value;
}

async function resolveEvmFeeFields(config: typeof CHAIN_CONFIGS[string], gwChain: string, request: any): Promise<{ type: number; gasPrice: string | null; maxFeePerGas: string | null; maxPriorityFeePerGas: string | null }> {
  validateTxType(request.type, config);
  const useEip1559 = config.eip1559 && request.type !== 0;
  if (!useEip1559) {
    const gasPrice = request.gasPrice != null
      ? validateRpcGasPrice(request.gasPrice)
      : validateRpcGasPrice(await workerGatewayRpc(gwChain, "eth_gasPrice", []));
    return { type: 0, gasPrice: gasPrice.toString(), maxFeePerGas: null, maxPriorityFeePerGas: null };
  }
  let priority: bigint;
  if (request.maxPriorityFeePerGas != null) priority = validateRpcGasPrice(request.maxPriorityFeePerGas);
  else {
    const raw = await workerGatewayRpc(gwChain, "eth_maxPriorityFeePerGas", []);
    const fallback = tryValidateRpcGasPrice(raw);
    priority = fallback ?? (await getFeeHistoryFallback(gwChain)).priorityFeePerGas;
  }
  let maxFee: bigint;
  if (request.maxFeePerGas != null) maxFee = validateRpcGasPrice(request.maxFeePerGas);
  else {
    const gp = tryValidateRpcGasPrice(await workerGatewayRpc(gwChain, "eth_gasPrice", []));
    maxFee = gp != null ? gp * 2n : (await getFeeHistoryFallback(gwChain)).latestBaseFeePerGas * 2n + priority;
    if (maxFee > RPC_GAS_PRICE_MAX) maxFee = RPC_GAS_PRICE_MAX;
  }
  if (maxFee < priority) throw new Error("maxFeePerGas cannot be lower than maxPriorityFeePerGas");
  return { type: 2, gasPrice: null, maxFeePerGas: maxFee.toString(), maxPriorityFeePerGas: priority.toString() };
}

async function _signEVMCore(
  privKey: Uint8Array,
  from: string,
  config: typeof CHAIN_CONFIGS[string],
  gwChain: string,
  nonce: number,
  to: string,
  value: bigint,
  data: string,
  gasLimit: bigint,
  request: any,
): Promise<{ signedTx: string; txHash: string; from: string; type: number }> {
  validateTxType(request.type, config);
  const useEip1559 = config.eip1559 && request.type !== 0;

  if (useEip1559) {
    let feeHistory: FeeHistoryFallback | null = null;
    let maxPriorityFeePerGas: bigint;

    if (request.maxPriorityFeePerGas != null) {
      maxPriorityFeePerGas = validateRpcGasPrice(request.maxPriorityFeePerGas);
    } else {
      const rawPri = await workerGatewayRpc(gwChain, "eth_maxPriorityFeePerGas", []);
      maxPriorityFeePerGas = tryValidateRpcGasPrice(rawPri) ?? (
        feeHistory = await getFeeHistoryFallback(gwChain),
        feeHistory.priorityFeePerGas
      );
    }

    let maxFeePerGas: bigint;
    if (request.maxFeePerGas != null) {
      maxFeePerGas = validateRpcGasPrice(request.maxFeePerGas);
    } else {
      const gasPrice = tryValidateRpcGasPrice(await workerGatewayRpc(gwChain, "eth_gasPrice", []));
      if (gasPrice != null) {
        maxFeePerGas = gasPrice * 2n;
      } else {
        feeHistory ??= await getFeeHistoryFallback(gwChain);
        maxFeePerGas = feeHistory.latestBaseFeePerGas * 2n + maxPriorityFeePerGas;
      }
      if (maxFeePerGas > RPC_GAS_PRICE_MAX) maxFeePerGas = RPC_GAS_PRICE_MAX;
    }
    if (maxFeePerGas < maxPriorityFeePerGas) maxFeePerGas = maxPriorityFeePerGas;
    const accessList: never[] = [];
    const signingRlp     = RLP.encode([config.chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList]);
    const signingPayload = prependTxType(0x02, signingRlp);
    const hash           = keccak_256(signingPayload);
    const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: "recovered", prehash: false } as any);
    const v = BigInt(sigBytes[0]);
    const r = BigInt("0x" + bytesToHex(sigBytes.slice(1, 33)));
    const s = BigInt("0x" + bytesToHex(sigBytes.slice(33, 65)));
    const signedRlp = RLP.encode([config.chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, v, r, s]);
    const signedTx  = prependTxType(0x02, signedRlp);
    return { signedTx: "0x" + bytesToHex(signedTx), txHash: "0x" + bytesToHex(keccak_256(signedTx)), from, type: 2 };
  }

  const gasPrice = request.gasPrice != null
    ? validateRpcGasPrice(request.gasPrice)
    : validateRpcGasPrice(await workerGatewayRpc(gwChain, "eth_gasPrice", []));
  const tx       = [nonce, gasPrice, gasLimit, to, value, data, config.chainId, BigInt(0), BigInt(0)];
  const encoded  = RLP.encode(tx);
  const hash     = keccak_256(encoded);
  const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: "recovered", prehash: false } as any);
  const recovery = sigBytes[0];
  const v        = BigInt(config.chainId * 2 + 35 + recovery);
  const r        = BigInt("0x" + bytesToHex(sigBytes.slice(1, 33)));
  const s        = BigInt("0x" + bytesToHex(sigBytes.slice(33, 65)));
  const signedTx = RLP.encode([nonce, gasPrice, gasLimit, to, value, data, v, r, s]);
  return { signedTx: "0x" + bytesToHex(signedTx), txHash: "0x" + bytesToHex(keccak_256(signedTx)), from, type: 0 };
}

async function handleSignEVMTransaction(mnemonic: string, request: any): Promise<unknown> {
  const privKey = await deriveEVMKey(mnemonic);
  try {
    const pub  = secp.getPublicKey(privKey, false);
    const from = "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
    const currency = typeof request?.currency === "string" ? request.currency.toUpperCase() : "ETH";
    const baseChain = currency.split("_")[0].toUpperCase();
    const config  = CHAIN_CONFIGS[baseChain];
    if (!config) throw new Error(`Unsupported EVM chain: ${baseChain}`);
    assertSupportedCurrency(currency, baseChain);
    const gwChain = workerGatewayChain(baseChain);

    const nonce = request.nonce != null
      ? validateRpcNonce(request.nonce)
      : validateRpcNonce(await workerGatewayRpc(gwChain, "eth_getTransactionCount", [from, "pending"]));

    let to = assertAddress(request.to, "recipient");
    let value = 0n;
    let data  = "0x";
    let gasLimit: bigint;

    const token = TOKEN_CONTRACTS[currency];
    if (token) {
      const amountText = assertPositiveDecimal(request.amount, "amount", token.decimals);
      const amt = parseTokenAmount(amountText, token.decimals);
      data = encodeERC20Transfer(to, amt);
      to = token.address;
      gasLimit = request.gasLimit != null ? validateRpcGasLimit(request.gasLimit, 21_000n) : 60_000n;
    } else {
      const amountText = assertPositiveDecimal(request.amount, "amount", 18);
      value = parseTokenAmount(amountText, 18);
      gasLimit = request.gasLimit != null ? validateRpcGasLimit(request.gasLimit) : 21_000n;
    }

    const approvalDigest = assertIntentDigest(request.approvalDigest);
    if (request.nonce == null || request.gasLimit == null) throw new Error("Signing requires the exact prepared nonce and gasLimit");
    const canonicalRecipient = assertAddress(request.to, "recipient").toLowerCase();
    const canonicalAmount = assertPositiveDecimal(request.amount, "amount", token?.decimals ?? 18);
    const approvedIntent = {
      kind: "evm-transfer", chainId: config.chainId, from: from.toLowerCase(), currency, recipient: canonicalRecipient,
      amount: canonicalAmount, nonce, gasLimit: gasLimit.toString(), to: to.toLowerCase(), value: value.toString(), data: data.toLowerCase(),
      gasPrice: request.gasPrice != null ? validateRpcGasPrice(request.gasPrice).toString() : null,
      maxFeePerGas: request.maxFeePerGas != null ? validateRpcGasPrice(request.maxFeePerGas).toString() : null,
      maxPriorityFeePerGas: request.maxPriorityFeePerGas != null ? validateRpcGasPrice(request.maxPriorityFeePerGas).toString() : null,
      type: request.type ?? null
    };
    consumeApproval(approvalDigest, from, approvedIntent);
    const core = await _signEVMCore(privKey, from, config, gwChain, nonce, to, value, data, gasLimit, request);
    return { ...core, to: request.to, value: request.amount, currency: request.currency, approvalDigest };
  } finally { wipeBytes(privKey); }
}

async function handleSignEVMContractCall(mnemonic: string, request: any): Promise<unknown> {
  const privKey = await deriveEVMKey(mnemonic);
  try {
    const pub     = secp.getPublicKey(privKey, false);
    const from    = "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
    const baseChain = typeof request?.chain === "string" ? request.chain.toUpperCase() : "ETH";
    const config  = CHAIN_CONFIGS[baseChain];
    if (!config) throw new Error(`Unsupported EVM chain: ${baseChain}`);
    const gwChain = workerGatewayChain(baseChain);

    const nonce = request.nonce != null
      ? validateRpcNonce(request.nonce)
      : validateRpcNonce(await workerGatewayRpc(gwChain, "eth_getTransactionCount", [from, "pending"]));

    const to = assertAddress(request.to, "contract address");
    const data = assertHex(request.data, "contract data");
    if (request.valueWei != null && !/^(?:0|[1-9]\d*)$/.test(String(request.valueWei))) {
      throw new Error("Invalid valueWei");
    }
    const valueWei = BigInt(request.valueWei ?? "0");
    if (valueWei < 0n || valueWei >= (1n << 256n)) throw new Error("Invalid valueWei");

    let gasLimit: bigint;
    if (request.gasLimit != null) {
      gasLimit = validateRpcGasLimit(request.gasLimit, 21_000n);
    } else {
      const raw = await workerGatewayRpc(gwChain, "eth_estimateGas",
        [{ from, to, value: "0x" + valueWei.toString(16), data }]);
      gasLimit = validateRpcGasLimit(raw, 21_000n);
      gasLimit = (gasLimit * 125n) / 100n;
      if (gasLimit < 60_000n) gasLimit = 60_000n;
      if (gasLimit > RPC_GAS_LIMIT_MAX) throw new Error("Estimated gas exceeds block limit — transaction would be invalid");
    }

    const approvalDigest = assertIntentDigest(request.approvalDigest);
    if (request.nonce == null || request.gasLimit == null) throw new Error("Signing requires the exact prepared nonce and gasLimit");
    const approvedIntent = {
      kind: "evm-contract", chainId: config.chainId, from: from.toLowerCase(), chain: baseChain, recipient: to.toLowerCase(),
      data: data.toLowerCase(), valueWei: valueWei.toString(), nonce, gasLimit: gasLimit.toString(),
      gasPrice: request.gasPrice != null ? validateRpcGasPrice(request.gasPrice).toString() : null,
      maxFeePerGas: request.maxFeePerGas != null ? validateRpcGasPrice(request.maxFeePerGas).toString() : null,
      maxPriorityFeePerGas: request.maxPriorityFeePerGas != null ? validateRpcGasPrice(request.maxPriorityFeePerGas).toString() : null,
      type: request.type ?? null
    };
    consumeApproval(approvalDigest, from, approvedIntent);
    return await _signEVMCore(privKey, from, config, gwChain, nonce, to, valueWei, data, gasLimit, request);
  } finally { wipeBytes(privKey); }
}

// ─── Two-step transaction approval ───────────────────────────────────────────
// Preparation performs all network-derived values first. The Worker stores the
// exact prepared intent. Signing requires that Worker-issued, single-use digest,
// preventing replay or changing recipient, amount, nonce, gas or fees after the
// preparation step. This is an integrity boundary, not a trusted-display claim.
async function prepareEVMTransferIntent(mnemonic: string, request: any): Promise<unknown> {
  const privKey = await deriveEVMKey(mnemonic);
  try {
    const pub = secp.getPublicKey(privKey, false);
    const from = "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
    const currency = typeof request?.currency === "string" ? request.currency.toUpperCase() : "ETH";
    const baseChain = currency.split("_")[0].toUpperCase();
    const config = CHAIN_CONFIGS[baseChain];
    if (!config) throw new Error(`Unsupported EVM chain: ${baseChain}`);
    assertSupportedCurrency(currency, baseChain);
    const gwChain = workerGatewayChain(baseChain);
    const nonce = request.nonce != null ? validateRpcNonce(request.nonce) : validateRpcNonce(await workerGatewayRpc(gwChain, "eth_getTransactionCount", [from, "pending"]));
    let to = assertAddress(request.to, "recipient");
    let value = 0n; let data = "0x"; let gasLimit: bigint;
    const token = TOKEN_CONTRACTS[currency];
    if (token) {
      const amount = assertPositiveDecimal(request.amount, "amount", token.decimals);
      data = encodeERC20Transfer(to, parseTokenAmount(amount, token.decimals));
      to = token.address;
      gasLimit = request.gasLimit != null ? validateRpcGasLimit(request.gasLimit, 21_000n) : 60_000n;
    } else {
      const amount = assertPositiveDecimal(request.amount, "amount", 18);
      value = parseTokenAmount(amount, 18);
      gasLimit = request.gasLimit != null ? validateRpcGasLimit(request.gasLimit) : 21_000n;
    }
    const fees = await resolveEvmFeeFields(config, gwChain, request);
    const canonicalRecipient = assertAddress(request.to, "recipient").toLowerCase();
    const canonicalAmount = assertPositiveDecimal(request.amount, "amount", token?.decimals ?? 18);
    const intent: Record<string, unknown> = {
      kind: "evm-transfer", chainId: config.chainId, from: from.toLowerCase(), currency, recipient: canonicalRecipient,
      amount: canonicalAmount, nonce, gasLimit: gasLimit.toString(), to: to.toLowerCase(), value: value.toString(), data: data.toLowerCase(),
      ...fees
    };
    const approvalDigest = await intentDigest(intent);
    rememberApproval(approvalDigest, from, intent);
    return { from, intent, approvalDigest, signRequest: { ...request, to: canonicalRecipient, amount: canonicalAmount, nonce, gasLimit: gasLimit.toString(), ...fees } };
  } finally { wipeBytes(privKey); }
}

async function prepareEVMContractIntent(mnemonic: string, request: any): Promise<unknown> {
  const privKey = await deriveEVMKey(mnemonic);
  try {
    const pub = secp.getPublicKey(privKey, false);
    const from = "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
    const baseChain = typeof request?.chain === "string" ? request.chain.toUpperCase() : "ETH";
    const config = CHAIN_CONFIGS[baseChain];
    if (!config) throw new Error(`Unsupported EVM chain: ${baseChain}`);
    const gwChain = workerGatewayChain(baseChain);
    const nonce = request.nonce != null ? validateRpcNonce(request.nonce) : validateRpcNonce(await workerGatewayRpc(gwChain, "eth_getTransactionCount", [from, "pending"]));
    const to = assertAddress(request.to, "contract address");
    const data = assertHex(request.data, "contract data");
    const valueWei = BigInt(request.valueWei ?? "0");
    if (valueWei < 0n || valueWei >= (1n << 256n)) throw new Error("Invalid valueWei");
    let gasLimit = request.gasLimit != null ? validateRpcGasLimit(request.gasLimit, 21_000n) : validateRpcGasLimit(await workerGatewayRpc(gwChain, "eth_estimateGas", [{ from, to, value: "0x" + valueWei.toString(16), data }]), 21_000n);
    if (request.gasLimit == null) { gasLimit = (gasLimit * 125n) / 100n; if (gasLimit < 60_000n) gasLimit = 60_000n; if (gasLimit > RPC_GAS_LIMIT_MAX) throw new Error("Estimated gas exceeds block limit"); }
    const fees = await resolveEvmFeeFields(config, gwChain, request);
    const intent: Record<string, unknown> = {
      kind: "evm-contract", chainId: config.chainId, from: from.toLowerCase(), chain: baseChain, recipient: to.toLowerCase(), data: data.toLowerCase(),
      valueWei: valueWei.toString(), nonce, gasLimit: gasLimit.toString(), ...fees
    };
    const approvalDigest = await intentDigest(intent);
    rememberApproval(approvalDigest, from, intent);
    return { from, intent, approvalDigest, signRequest: { ...request, to: to.toLowerCase(), data: data.toLowerCase(), nonce, gasLimit: gasLimit.toString(), ...fees } };
  } finally { wipeBytes(privKey); }
}

// ─── Bitcoin / Solana / TRON protocol-correct signing ───────────────────────
async function prepareBitcoinTransferIntent(mnemonic: string, request: any): Promise<any> {
  const { deriveBTCAddress } = await import("./vault-crypto");
  const from = await deriveBTCAddress(mnemonic);
  if (!Array.isArray(request?.utxos) || request.utxos.length < 1 || request.utxos.length > 100) throw new Error("Invalid Bitcoin UTXO set");
  const amountSats = parseDecimalUnits(request.amount, 8, "amount");
  const feeRate = Number(request.feeRate);
  if (!Number.isSafeInteger(feeRate) || feeRate < 1 || feeRate > 10000) throw new Error("Invalid Bitcoin fee rate");
  const to = String(request.to ?? "");
  if (!/^(bc1[ac-hj-np-z02-9]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(to)) throw new Error("Invalid Bitcoin recipient");
  const priv = await deriveBTCPrivateKey(mnemonic);
  try {
    const pub = secp.getPublicKey(priv, true); const p2w = btc.p2wpkh(pub, btc.NETWORK); const expectedScript = bytesToHex(p2w.script).toLowerCase();
    const utxos: Array<{txid:string,vout:number,value:string}> = [];
    for (const u of request.utxos) {
      if (!/^[0-9a-fA-F]{64}$/.test(String(u.txid)) || !Number.isInteger(Number(u.vout)) || Number(u.vout) < 0 || Number(u.vout) > 100000) throw new Error("Invalid Bitcoin outpoint");
      const vout = Number(u.vout);
      const out = await workerGatewayRpc("BTC", "gettxout", [String(u.txid), vout, true], request.accessToken) as any;
      if (!out) throw new Error("Bitcoin UTXO is spent, missing, or no longer available");
      const networkValue = parseDecimalUnits(String(out.value), 8, "network UTXO value");
      const suppliedValue = parseDecimalUnits(String(u.value), 8, "UTXO value");
      if (networkValue !== suppliedValue) throw new Error("Bitcoin UTXO value mismatch");
      if (String(out.scriptPubKey?.hex ?? "").toLowerCase() !== expectedScript) throw new Error("Bitcoin UTXO does not belong to this wallet");
      utxos.push({ txid:String(u.txid).toLowerCase(), vout, value:networkValue.toString() });
    }
    const total = utxos.reduce((sum,u)=>sum+BigInt(u.value),0n);
    let fee = BigInt(feeRate * (10 + 68 * utxos.length + 31 * 2));
    let change = total - amountSats - fee;
    if (change < 0n) throw new Error("Insufficient Bitcoin funds");
    if (change <= 546n) { fee = total - amountSats; change = 0n; }
    const intent = { kind:"bitcoin-transfer", from, recipient:to, amountSats:amountSats.toString(), feeRate, feeSats:fee.toString(), changeSats:change.toString(), utxos };
    const approvalDigest = await intentDigest(intent); rememberApproval(approvalDigest, from, intent);
    return { from, intent, approvalDigest, signRequest:{...request,amountSats:amountSats.toString(),feeSats:fee.toString(),changeSats:change.toString(),utxos} };
  } finally { wipeBytes(priv); }
}
async function signBitcoinPrepared(mnemonic: string, request: any): Promise<any> {
  const { deriveBTCAddress } = await import("./vault-crypto");
  const from = await deriveBTCAddress(mnemonic);
  if (!request?.approvalDigest) throw new Error("Bitcoin transaction requires a prepared approval");
  const amountSats = parseDecimalUnits(request.amount, 8, "amount");
  const feeRate = Number(request.feeRate);
  if (!Array.isArray(request.utxos) || request.utxos.length < 1 || request.utxos.length > 100) throw new Error("Invalid Bitcoin UTXOs");
  const utxos: Array<{txid:string,vout:number,value:string}> = [];
  for (const u of request.utxos) {
    if (!/^[0-9a-fA-F]{64}$/.test(String(u.txid)) || !Number.isInteger(u.vout) || u.vout < 0 || u.vout > 100000) throw new Error("Invalid Bitcoin outpoint");
    const out = await workerGatewayRpc("BTC", "gettxout", [String(u.txid), u.vout, true], request.accessToken) as any;
    if (!out) throw new Error("Bitcoin UTXO is spent, missing, or no longer available");
    const sats = parseDecimalUnits(String(out.value), 8, "network UTXO value");
    const scriptHex = String(out.scriptPubKey?.hex ?? "").toLowerCase();
    const seedPriv = await deriveBTCPrivateKey(mnemonic);
    const pub = secp.getPublicKey(seedPriv, true); wipeBytes(seedPriv);
    const p2w = btc.p2wpkh(pub, btc.NETWORK);
    const expectedScript = bytesToHex(p2w.script).toLowerCase();
    if (scriptHex !== expectedScript) throw new Error("Bitcoin UTXO does not belong to this wallet");
    const requested = parseDecimalUnits(String(u.value),8,"UTXO value"); if (requested !== sats) throw new Error("Bitcoin UTXO value mismatch");
    utxos.push({txid:String(u.txid),vout:u.vout,value:sats.toString()});
  }
  const total = utxos.reduce((s,u)=>s+BigInt(u.value),0n);
  const change = BigInt(String(request.changeSats ?? "0"));
  const fee = BigInt(String(request.feeSats ?? "0"));
  if (total !== amountSats + fee + change) throw new Error("Bitcoin amount + fee + change does not equal verified inputs");
  const to = String(request.to); if (!/^(bc1[ac-hj-np-z02-9]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(to)) throw new Error("Invalid Bitcoin recipient");
  const intent = { kind:"bitcoin-transfer", from, recipient:to, amountSats:amountSats.toString(), feeRate, feeSats:fee.toString(), changeSats:change.toString(), utxos };
  const digest = await intentDigest(intent); consumeApproval(String(request.approvalDigest), from, intent);
  if (digest !== String(request.approvalDigest)) throw new Error("Bitcoin approval digest mismatch");
  const priv = await deriveBTCPrivateKey(mnemonic);
  try {
    const pub = secp.getPublicKey(priv, true); const p2wpkh = btc.p2wpkh(pub, btc.NETWORK); const tx = new btc.Transaction();
    for (const u of utxos) tx.addInput({ txid:u.txid, index:u.vout, witnessUtxo:{ script:p2wpkh.script, amount:BigInt(u.value) } });
    tx.addOutputAddress(to, amountSats, btc.NETWORK);
    if (change > 546n) tx.addOutputAddress(from, change, btc.NETWORK);
    tx.sign(priv); tx.finalize();
    const raw = tx.toBytes(); const txid = bytesToHex(sha256(sha256(raw)).slice().reverse());
    return { signedTx: "0x" + bytesToHex(raw), txid, from, to, amountSats: amountSats.toString(), feeSats: fee.toString() };
  } finally { wipeBytes(priv); }
}

async function prepareSolanaTransferIntent(mnemonic: string, request: any): Promise<any> {
  const priv = await deriveSOLPrivateKey(mnemonic); const pub = await nobleEd.getPublicKeyAsync(priv); wipeBytes(priv);
  const from = base58.encode(pub); const to = String(request?.to ?? "");
  let toBytes: Uint8Array; try { toBytes = base58.decode(to); } catch { throw new Error("Invalid Solana recipient"); }
  if (toBytes.length !== 32) throw new Error("Invalid Solana recipient");
  const amount = parseDecimalUnits(request.amount, 9, "SOL amount");
  const latest = await workerGatewayRpc("SOL", "getLatestBlockhash", [{ commitment:"finalized" }], request.accessToken) as any;
  const blockhash = latest?.value?.blockhash; if (typeof blockhash !== "string") throw new Error("Solana blockhash unavailable");
  const intent = { kind:"sol-transfer", from, recipient:to, amountLamports:amount.toString(), recentBlockhash:blockhash, currency:"SOL" };
  const approvalDigest = await intentDigest(intent); rememberApproval(approvalDigest, from, intent);
  return { from, intent, approvalDigest, signRequest:{...request, amountLamports:amount.toString(), recentBlockhash:blockhash} };
}

async function signSolanaPrepared(mnemonic: string, request: any): Promise<any> {
  const priv = await deriveSOLPrivateKey(mnemonic); try {
    const pub = await nobleEd.getPublicKeyAsync(priv); const from = base58.encode(pub); const to = String(request.to); const toBytes = base58.decode(to);
    if (toBytes.length !== 32) throw new Error("Invalid Solana recipient");
    const amount = BigInt(String(request.amountLamports)); if (amount <= 0n || amount > 0xffffffffffffffffn) throw new Error("Invalid SOL amount");
    const blockhash = base58.decode(String(request.recentBlockhash));
    const intent = {kind:"sol-transfer",from,recipient:to,amountLamports:amount.toString(),recentBlockhash:String(request.recentBlockhash),currency:"SOL"};
    const digest = await intentDigest(intent); consumeApproval(String(request.approvalDigest),from,intent); if(digest!==String(request.approvalDigest)) throw new Error("Solana approval digest mismatch");
    const systemProgram = base58.decode("11111111111111111111111111111111"); const data = new Uint8Array([2,...u64le(amount)]);
    const message = buildSolanaLegacyMessage(pub,blockhash,[pub,toBytes,systemProgram],2,[0,1],data,1);
    const signature = await nobleEd.signAsync(message,priv); const packet = new Uint8Array([...solShortVec(1),...signature,...message]);
    return {signedTx:base58.encode(packet),signature:base58.encode(signature),publicKey:from};
  } finally { wipeBytes(priv); }
}

async function prepareTronTransferIntent(mnemonic: string, request: any): Promise<any> {
  const priv = await deriveTRONPrivateKey(mnemonic); const from = tronAddressFromPrivateKey(priv); wipeBytes(priv);
  const to = String(request?.to ?? ""); tronAddressToHex(to); const amountSun = parseDecimalUnits(request.amount,6,"TRX amount"); if(amountSun<=0n||amountSun>9007199254740991n) throw new Error("Invalid TRX amount");
  const built = await workerGatewayTron("/wallet/createtransaction", {owner_address:from,to_address:to,amount:Number(amountSun),visible:true}, request.accessToken);
  const c=built?.raw_data?.contract?.[0]; const v=c?.parameter?.value;
  if(built?.raw_data?.contract?.length!==1||c?.type!=="TransferContract"||!v) throw new Error("Gateway returned an invalid TRON transaction");
  if(tronAddressToHex(from).toLowerCase()!==String(v.owner_address).toLowerCase() || tronAddressToHex(to).toLowerCase()!==String(v.to_address).toLowerCase() || BigInt(v.amount)!==amountSun) throw new Error("TRON transaction intent mismatch");
  const rawHex=String(built.raw_data_hex??""); if(!/^[0-9a-fA-F]+$/.test(rawHex)||rawHex.length%2||rawHex.length<20) throw new Error("Invalid TRON raw_data_hex");
  const intent={kind:"tron-transfer",from,to,amountSun:amountSun.toString(),rawDataHex:rawHex.toLowerCase()}; const approvalDigest=await intentDigest(intent); rememberApproval(approvalDigest,from,intent);
  return {from,intent,approvalDigest,signRequest:{...request,amountSun:amountSun.toString(),rawDataHex:rawHex,unsignedTransaction:built}};
}

async function signTronPrepared(mnemonic:string,request:any):Promise<any>{
  const priv=await deriveTRONPrivateKey(mnemonic); try{
    const from=tronAddressFromPrivateKey(priv); const to=String(request.to); tronAddressToHex(to); const amountSun=BigInt(String(request.amountSun)); const rawHex=String(request.rawDataHex??"");
    const intent={kind:"tron-transfer",from,to,amountSun:amountSun.toString(),rawDataHex:rawHex.toLowerCase()}; const digest=await intentDigest(intent); consumeApproval(String(request.approvalDigest),from,intent); if(digest!==String(request.approvalDigest)) throw new Error("TRON approval digest mismatch");
    const raw=Uint8Array.from((rawHex.match(/../g)||[]).map((x:string)=>parseInt(x,16))); const hash=sha256(raw); const sig=await secp.signAsync(hash,priv,{lowS:true,format:"recovered",prehash:false} as any); const signature=bytesToHex(sig.slice(1,65))+Number(sig[0]).toString(16).padStart(2,"0");
    return {signedTx:{...request.unsignedTransaction,raw_data_hex:rawHex,signature:[signature]},txID:bytesToHex(hash),from,to,amountSun:amountSun.toString()};
  }finally{wipeBytes(priv);}
}

// ─── ⑭  Vault-based EVM signing helpers ─────────────────────────────────────
// The mnemonic vault is decrypted only inside the Worker; only the final signed
// transaction is returned to the main thread.
async function signEVMTransactionFromVault(vault: unknown, password: string | Uint8Array, request: any): Promise<unknown> {
  return handleSignEVMTransaction(await openVault(vault, password), request);
}

async function signEVMContractCallFromVault(vault: unknown, password: string | Uint8Array, request: any): Promise<unknown> {
  return handleSignEVMContractCall(await openVault(vault, password), request);
}

// ─── Message type registry ────────────────────────────────────────────────────

export type WorkerRequest =
  // ① Mnemonic
  | { id: string; type: "validateMnemonic";    mnemonic: string }
  // ② Addresses (mnemonic-based — kept for wallet-restore flows)
  // ③ Encryption
  | { id: string; type: "encryptVault"; data: string; passwordBytes: Uint8Array; origin?: string }
  | { id: string; type: "encryptVaultBatch"; items: Array<{ data: string }>; passwordBytes: Uint8Array; origin?: string }
  // ③·5 Session cache management
  | { id: string; type: "clearSessionCache" }
  // ④ Decryption
  | { id: string; type: "validateVaultPassword"; vault: unknown; passwordBytes: Uint8Array }
  // ⑤ Migration
  | { id: string; type: "migrateLegacyVault"; legacyData: unknown; passwordBytes: Uint8Array; userId: string; origin?: string }
  // ⑥ Secure wallet creation only
  // ⑩ Hashing
  | { id: string; type: "hash"; algorithm: "keccak256" | "sha256" | "sha512" | "ripemd160"; hex: string }
  | { id: string; type: "hmacSha256"; keyHex: string; dataHex: string }
  // ─── SECURE VAULT-BASED API (mnemonic never crosses the postMessage wire) ──
  // ⑫ Secure wallet creation — no `mnemonic` in response
  | { id: string; type: "createSecureWallet"; passwordBytes: Uint8Array; origin?: string; existingMnemonic?: string }
  // ⑬ One-time mnemonic backup display (user must confirm backup before calling)
  | { id: string; type: "getMnemonicForBackup"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array }
  | { id: string; type: "prepareBitcoinTransferIntent"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  | { id: string; type: "signBitcoinTransactionFromVault"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  | { id: string; type: "prepareSolanaTransferIntent"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  | { id: string; type: "signSolanaTransactionFromVault"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  | { id: string; type: "prepareTronTransferIntent"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  | { id: string; type: "signTronTransactionFromVault"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  | { id: string; type: "prepareEVMTransferIntent"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  | { id: string; type: "prepareEVMContractIntent"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  // ⑭ Vault-based signing — mnemonic decrypted + wiped entirely inside worker
  | { id: string; type: "signEVMTransactionFromVault"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } }
  | { id: string; type: "signEVMContractCallFromVault"; vault: EncryptedVault | unknown; passwordBytes: Uint8Array; request: any & { accessToken?: string } };

export type WorkerResponse =
  | { id: string; ok: true;  result: unknown }
  | { id: string; ok: false; error: string };

// ─── Main message loop ────────────────────────────────────────────────────────
//
// Password resolution — prefer the transferred Uint8Array over the string:
//
//   callSigningWorker sends { passwordBytes: Uint8Array } as a transferable.
//   After transfer the main-thread buffer is detached (zero-length) so the
//   caller can no longer read it. We receive it here and zero-fill it after
//   every operation that consumes it (either inside deriveScryptKey, or
//   explicitly below for operations that pass it through).
//
//   There is deliberately NO plaintext-password fallback.

function resolvePassword(msg: any): Uint8Array {
  if (msg.passwordBytes instanceof Uint8Array && msg.passwordBytes.length > 0) {
    return msg.passwordBytes;
  }
  throw new Error("Sensitive worker operations require passwordBytes as a transferable Uint8Array");
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data as any;
  let pw: Uint8Array | null = null;
  let response: WorkerResponse;
  try {
    if (!msg || typeof msg !== "object" || typeof msg.id !== "string" || msg.id.length > 128) {
      throw new Error("Invalid worker request");
    }
    if (typeof msg.type !== "string" || msg.type.length > 128) {
      throw new Error("Invalid worker request type");
    }
    if (Object.getPrototypeOf(msg) !== Object.prototype && Object.getPrototypeOf(msg) !== null) {
      throw new Error("Invalid worker request object");
    }
    if (msg.request !== undefined) {
      if (!msg.request || typeof msg.request !== "object" || Array.isArray(msg.request)) throw new Error("Invalid transaction request");
      if (Object.getPrototypeOf(msg.request) !== Object.prototype && Object.getPrototypeOf(msg.request) !== null) throw new Error("Invalid transaction request object");
    }
    currentAccessToken = typeof msg.request?.accessToken === "string" && msg.request.accessToken.length <= 4096 ? msg.request.accessToken : undefined;

    const passwordTypes = new Set([
      "encryptVault", "encryptVaultBatch",
      "validateVaultPassword",
      "migrateLegacyVault", "createSecureWallet", "getMnemonicForBackup",
      "prepareEVMTransferIntent", "prepareEVMContractIntent",
      "prepareBitcoinTransferIntent", "signBitcoinTransactionFromVault",
      "prepareSolanaTransferIntent", "signSolanaTransactionFromVault",
      "prepareTronTransferIntent", "signTronTransactionFromVault",
      "signEVMTransactionFromVault", "signEVMContractCallFromVault"
    ]);
    pw = passwordTypes.has(msg.type) ? resolvePassword(msg) : null;

    let result: unknown;
    switch ((msg as WorkerRequest).type) {
      // ① Mnemonic
      case "validateMnemonic":    result = workerValidateMnemonic(msg.mnemonic); break;
      // ② Addresses
      // ③ Encryption — pw is Uint8Array or string; encryptVault accepts both
      // NOTE: there is intentionally no "deriveVaultKey" handler. A prior
      // version returned the raw scrypt-derived key as hex over postMessage,
      // which contradicts this file's own invariant that key material never
      // leaves the worker. Callers that need one scrypt round to produce
      // several vaults should use "encryptVaultBatch" — it derives the key
      // once internally and only ever returns finished EncryptedVault blobs.
      // ③·5 Session cache management
      case "clearSessionCache": clearSessionCache(); clearPendingApprovals(); result = true; break;
      case "encryptVault":      result = await encryptVault(msg.data, pw!, msg.origin); break;
      case "encryptVaultBatch": result = await encryptVaultBatch(msg.items, pw!, msg.origin); break;
      // ④ Decryption
      case "validateVaultPassword":  result = await validateVaultPassword(msg.vault, pw!); break;
      // ⑤ Migration
      case "migrateLegacyVault":
        result = await migrateLegacyVault(msg.legacyData, pw!, msg.userId, msg.origin); break;
      // ⑪ Hashing
      case "hash":      result = workerHash(msg.algorithm, msg.hex); break;
      case "hmacSha256": result = workerHmacSha256(msg.keyHex, msg.dataHex); break;
      // ⑫ Secure wallet creation
      case "createSecureWallet":
        result = await createSecureWallet(pw!, msg.origin, msg.existingMnemonic); break;
      // ⑬ Mnemonic backup display (one-time, controlled)
      case "getMnemonicForBackup":
        result = await getMnemonicForBackup(msg.vault, pw!); break;
      case "prepareBitcoinTransferIntent": { const mnemonic=await openVault(msg.vault,pw!); result=await prepareBitcoinTransferIntent(mnemonic,msg.request); break; }
      case "signBitcoinTransactionFromVault": { const mnemonic=await openVault(msg.vault,pw!); result=await signBitcoinPrepared(mnemonic,msg.request); break; }
      case "prepareSolanaTransferIntent": { const mnemonic=await openVault(msg.vault,pw!); result=await prepareSolanaTransferIntent(mnemonic,msg.request); break; }
      case "signSolanaTransactionFromVault": { const mnemonic=await openVault(msg.vault,pw!); result=await signSolanaPrepared(mnemonic,msg.request); break; }
      case "prepareTronTransferIntent": { const mnemonic=await openVault(msg.vault,pw!); result=await prepareTronTransferIntent(mnemonic,msg.request); break; }
      case "signTronTransactionFromVault": { const mnemonic=await openVault(msg.vault,pw!); result=await signTronPrepared(mnemonic,msg.request); break; }
      // ⑭ Two-step EVM approval: prepare exact intent before signing
      case "prepareEVMTransferIntent": {
        const mnemonic = await openVault(msg.vault, pw!);
        try { result = await prepareEVMTransferIntent(mnemonic, msg.request); } finally { /* mnemonic is immutable string; scope ends here */ }
        break;
      }
      case "prepareEVMContractIntent": {
        const mnemonic = await openVault(msg.vault, pw!);
        try { result = await prepareEVMContractIntent(mnemonic, msg.request); } finally { /* scope ends here */ }
        break;
      }
      // ⑭ Vault-based signing — mnemonic never on postMessage wire
      case "signEVMTransactionFromVault":
        result = await signEVMTransactionFromVault(msg.vault, pw!, msg.request); break;
      case "signEVMContractCallFromVault":
        result = await signEVMContractCallFromVault(msg.vault, pw!, msg.request); break;
      default:
        throw new Error(`Unknown worker message type: ${(msg as any).type}`);
    }
    response = { id: msg.id, ok: true, result };
  } catch (err) {
    response = {
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : formatWorkerRpcError(err),
    };
  } finally {
    currentAccessToken = undefined;
    if (pw) wipeBytes(pw);
  }
  self.postMessage(response);
};
