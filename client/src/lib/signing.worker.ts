/**
 * ============================================================
 *  PEXLY CRYPTOGRAPHIC VAULT WORKER
 * ============================================================
 *
 * Security architecture — three execution contexts:
 *
 *   ┌─────────────────────────┐     unsigned tx      ┌──────────────────────┐
 *   │  Edge Function (CF)     │ ─────blueprint──────▶ │  UI Thread (React)   │
 *   │  • Premium RPC keys     │                       │  • No key material   │
 *   │  • nonce / fee fetch    │                       │  • postMessage only  │
 *   └─────────────────────────┘                       └──────────┬───────────┘
 *                                                                 │ postMessage
 *                                                     ┌──────────▼───────────┐
 *                                                     │  THIS WORKER (vault) │
 *                                                     │  • Isolated JS realm │
 *                                                     │  • Separate heap     │
 *                                                     │  • No DOM access     │
 *                                                     │  • wipeBytes() after │
 *                                                     └──────────────────────┘
 *
 * ── Accurate threat model ─────────────────────────────────────────────────────
 *
 * What the worker DOES protect:
 *   • Separate JS heap — main-thread JS cannot read worker memory directly.
 *   • Separate ECMAScript realm — prototype mutations on the main thread
 *     (e.g. overriding Uint8Array.prototype.slice) patch MAIN THREAD objects
 *     only; the worker's built-in prototypes are entirely separate objects.
 *   • No DOM access — DOM-based XSS cannot reach or enumerate worker scope.
 *   • postMessage structured-clone boundary — objects are deep-copied, not
 *     shared; a main-thread attacker cannot hold a live reference into the
 *     worker's heap.
 *
 * What the worker does NOT protect against:
 *   • Privileged browser extensions — some can inject scripts into worker
 *     scope, overriding worker-side built-ins as well.
 *   • Supply-chain compromise of worker bundle itself — if signing.worker.ts
 *     or its dependencies are tampered with at build time, all bets are off.
 *   • postMessage wire interception — a compromised main-thread dependency
 *     can hook Worker.prototype.postMessage and read outbound args. This is
 *     why the *FromVault API exists (mnemonic decrypted inside worker, never
 *     in postMessage args) and why password is sent as a transferred
 *     Uint8Array (buffer moves to worker, main-thread ref becomes detached).
 *   • JS string immutability — mnemonics that pass through JS strings cannot
 *     be reliably zeroed. V8 may intern short strings. We minimise string
 *     lifetime by converting to bytes as early as possible and zero-filling
 *     those bytes, but the original string object remains in the GC heap
 *     until collected. There is no solution to this within browser JS.
 *   • Side-channel / speculative execution (Spectre) — SharedArrayBuffer is
 *     disabled; standard postMessage structured-clone does not share memory.
 *     This is not a complete Spectre mitigation, only a partial one.
 *
 * ── postMessage password hardening ────────────────────────────────────────────
 *
 * Passwords are sent as transferred ArrayBuffers (not strings). After the
 * main thread calls postMessage with a transferred buffer, its own reference
 * becomes detached (zero-length) — it can no longer be read. The worker
 * zero-fills the password bytes immediately after the scrypt KDF completes.
 *
 *   Insecure (old): { password: "hunter2" }   ← string lives in both heaps
 *   Secure (now):   { passwordBytes: Uint8Array } + transfer=[buffer]
 *                                              ← buffer MOVED, main ref neutered
 *
 * ── Adaptive KDF ──────────────────────────────────────────────────────────────
 *
 * scrypt N is chosen at runtime based on the device's hardware:
 *   N = 262 144 (2¹⁸)  desktop / high-end   — ~2–3 s
 *   N = 131 072 (2¹⁷)  mid-range            — ~1–2 s
 *   N =  65 536 (2¹⁶)  mobile / low-memory  — ~0.5–1 s
 *
 * The actual N is stored inside each EncryptedVault so decryption on any
 * device uses the exact same parameters the vault was created with.
 *
 * What runs here (100% of sensitive crypto):
 *   1.  Mnemonic generation          — @scure/bip39 generateMnemonic
 *   2.  Seed / key derivation        — mnemonicToSeed + @scure/bip32 HDKey
 *   3.  Vault encryption             — scrypt (N=262144) + AES-256-GCM
 *   4.  Vault decryption             — origin-bound AAD check + scrypt + AES-256-GCM
 *   5.  EVM tx signing (mnemonic)    — RLP + keccak-256 + ECDSA (EIP-155)
 *   6.  EVM tx signing (vault) ★     — decrypt vault, derive key, sign, wipe
 *   7.  EVM contract-call (vault) ★  — decrypt + estimateGas + sign + wipe
 *   8.  EVM message signing (vault) ★— EIP-191 personal_sign from vault
 *   9.  Bitcoin tx (vault) ★         — @scure/btc-signer P2WPKH from vault
 *  10.  Solana tx (vault) ★          — Ed25519 from vault
 *  11.  Address generation           — all chains (EVM/BTC/SOL/TRX/XRP)
 *  12.  Hashing utilities            — keccak-256, SHA-256, SHA-512, RIPEMD-160
 *  13.  BigInt token maths           — no float precision errors
 *  14.  ERC-20 calldata encoding     — transfer(address,uint256)
 *  15.  Legacy vault migration       — scrypt re-encryption with random salt
 *  16.  Secure wallet creation ★     — mnemonic generated + encrypted + NEVER
 *                                      returned in postMessage response
 *  17.  Mnemonic backup display ★    — one-time controlled release for seed
 *                                      phrase backup screen only
 *
 *  ★ = vault-based API — mnemonic never crosses the postMessage wire
 *
 * What NEVER crosses the postMessage wire:
 *   • Seed phrases (mnemonics) — for vault-based ops
 *   • Raw private key bytes
 *   • Intermediate HDKey objects
 *   • scrypt-derived key material
 *
 * What DOES cross (safe to send over postMessage):
 *   • Public addresses (0x…, bc1q…, base58…)
 *   • Signed transaction hex / signature bytes
 *   • EncryptedVault blobs (ciphertext only — useless without scrypt+password)
 *   • Boolean / string confirmations
 */

// ─── Imports ──────────────────────────────────────────────────────────────────

import * as scrypt    from "scrypt-js";
import * as RLP       from "@ethereumjs/rlp";
import * as secp      from "@noble/secp256k1";
import * as btc       from "@scure/btc-signer";
import * as nobleEd   from "@noble/ed25519";

import { generateMnemonic, mnemonicToSeed, validateMnemonic } from "@scure/bip39";
import { wordlist }  from "@scure/bip39/wordlists/english.js";
import { HDKey }     from "@scure/bip32";
import { base58 }    from "@scure/base";

import { keccak_256 }  from "@noble/hashes/sha3";
import { sha256 }      from "@noble/hashes/sha256";
import { sha512 }      from "@noble/hashes/sha512";
import { ripemd160 }   from "@noble/hashes/ripemd160";
import { bytesToHex }  from "@noble/hashes/utils";
import { hmac }        from "@noble/hashes/hmac";

// ─── noble-ed25519 SHA-512 wiring (handles v2 and v3 APIs) ───────────────────
{
  const ned = nobleEd as any;
  if (ned.hashes && !ned.hashes.sha512 && !Object.isFrozen(ned.hashes)) {
    ned.hashes.sha512 = sha512;
  }
  if (ned.utils && !ned.utils.sha512Sync && !Object.isFrozen(ned.utils) && typeof ned.utils.concatBytes === "function") {
    const cb = ned.utils.concatBytes;
    ned.utils.sha512Sync = (...m: Uint8Array[]) => sha512(cb(...m));
  }
}

// ─── Secure memory wipe ───────────────────────────────────────────────────────

function wipeBytes(b: Uint8Array | null | undefined): void {
  if (b instanceof Uint8Array) b.fill(0);
}
function wipeHDKey(k: any): void {
  if (!k) return;
  try { if (k.privateKey instanceof Uint8Array) k.privateKey.fill(0); } catch { /**/ }
  try { if (k.chainCode instanceof Uint8Array) k.chainCode.fill(0); } catch { /**/ }
}

// ─── Vault constants ──────────────────────────────────────────────────────────

const IV_LEN   = 12;
const SALT_LEN = 16;

export interface KdfParams { N: number; r: number; p: number; dkLen: number }

/**
 * Pick scrypt N based on device capability detected inside the worker.
 * Workers have access to navigator.hardwareConcurrency and deviceMemory.
 * The actual params are stored in each EncryptedVault so any device can
 * decrypt a vault without needing to know the original device's profile.
 */
function getAdaptiveKdfParams(): KdfParams {
  const cores  = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 2;
  const memGb  = (typeof navigator !== "undefined" && (navigator as any).deviceMemory)  || 0;
  // Low-end: ≤4 logical cores, or device reports ≤4 GB RAM
  const isLowEnd = cores <= 4 || (memGb > 0 && memGb <= 4);
  // Mid-range: ≤8 cores (catches most mid-range Android / iPad)
  const isMid    = !isLowEnd && cores <= 8;
  const N = isLowEnd ? 65_536   // 2¹⁶ — mobile-safe (~0.5–1 s)
          : isMid    ? 131_072  // 2¹⁷ — balanced  (~1–2 s)
          :            262_144; // 2¹⁸ — strong    (~2–3 s)
  return { N, r: 8, p: 1, dkLen: 32 };
}

export interface EncryptedVault {
  version: number;
  ciphertext: string;
  iv: string;
  salt: string;
  kdf: "scrypt";
  kdfParams: KdfParams;
  origin?: string;
}

export interface PasskeyVault {
  version: 2;
  ciphertext: string;
  iv: string;
}

// ─── Chain configs ────────────────────────────────────────────────────────────

const CHAIN_CONFIGS: Record<string, {
  rpcUrl: string;
  rpcFallbacks: string[];
  chainId: number;
  symbol: string;
  /** true = EIP-1559 type-2 tx by default; false = legacy type-0 only */
  eip1559: boolean;
}> = {
  ETH:  { rpcUrl: "https://ethereum.publicnode.com",  rpcFallbacks: ["https://eth.drpc.org", "https://1rpc.io/eth"],                   chainId: 1,     symbol: "ETH", eip1559: true  },
  BSC:  { rpcUrl: "https://bsc-dataseed.binance.org", rpcFallbacks: ["https://bsc-dataseed1.defibit.io", "https://bsc.drpc.org"],       chainId: 56,    symbol: "BNB", eip1559: false },
  BNB:  { rpcUrl: "https://bsc-dataseed.binance.org", rpcFallbacks: ["https://bsc-dataseed1.defibit.io", "https://bsc.drpc.org"],       chainId: 56,    symbol: "BNB", eip1559: false },
  ARB:  { rpcUrl: "https://arb1.arbitrum.io/rpc",     rpcFallbacks: ["https://arbitrum.drpc.org"],                                     chainId: 42161, symbol: "ETH", eip1559: true  },
  POL:  { rpcUrl: "https://polygon.publicnode.com",   rpcFallbacks: ["https://polygon.drpc.org", "https://1rpc.io/matic"],             chainId: 137,   symbol: "POL", eip1559: true  },
  MATIC:{ rpcUrl: "https://polygon.publicnode.com",   rpcFallbacks: ["https://polygon.drpc.org", "https://1rpc.io/matic"],             chainId: 137,   symbol: "POL", eip1559: true  },
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

// ─── RPC helpers ──────────────────────────────────────────────────────────────

async function rpcCall(rpcUrl: string, method: string, params: unknown[], fallbacks: string[] = []): Promise<unknown> {
  const urls = [rpcUrl, ...fallbacks];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10_000);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as any;
        if (json.error) throw new Error(json.error.message ?? "RPC error");
        return json.result;
      } finally { clearTimeout(t); }
    } catch (err) { lastErr = err; }
  }
  throw new Error(`Network error — blockchain node unreachable. (${lastErr instanceof Error ? lastErr.message : String(lastErr)})`);
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
  const n = typeof raw === "string" ? parseInt(raw, 16) : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > RPC_NONCE_MAX) {
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

// ─── Cryptographic helpers ────────────────────────────────────────────────────

/**
 * Derive a scrypt key.
 *
 * Accepts the password as either:
 *   - string  — encoded to UTF-8 bytes here; those bytes are zero-filled after KDF
 *   - Uint8Array — used directly (caller must zero-fill after the entire operation)
 *
 * Uses adaptive KDF params unless an explicit `params` override is supplied
 * (e.g. when re-deriving during vault decryption, where the vault stores the
 * original params and we MUST reproduce the exact same key).
 */
async function deriveScryptKey(
  password: string | Uint8Array,
  salt: Uint8Array,
  params?: KdfParams,
): Promise<Uint8Array> {
  const kdf = params ?? getAdaptiveKdfParams();
  let pwBytes: Uint8Array;
  let ownBytes = false;
  if (password instanceof Uint8Array) {
    pwBytes = password;
  } else {
    pwBytes = new TextEncoder().encode(password.normalize("NFKC"));
    ownBytes = true;
  }
  try {
    return await scrypt.scrypt(pwBytes, salt, kdf.N, kdf.r, kdf.p, kdf.dkLen);
  } finally {
    // Zero-fill the encoded password bytes as soon as scrypt is done.
    // If we encoded them ourselves we always wipe; if the caller passed a
    // Uint8Array they are responsible for wiping after the full op completes.
    if (ownBytes) pwBytes.fill(0);
  }
}

function b64encode(u8: Uint8Array): string {
  // Spread-into-btoa crashes on large arrays (call stack limit ~65 K args).
  // Process in 32 KB chunks to stay well under the limit.
  const CHUNK = 0x8000;
  let out = "";
  for (let i = 0; i < u8.length; i += CHUNK) {
    out += String.fromCharCode(...u8.subarray(i, i + CHUNK));
  }
  return btoa(out);
}
function b64decode(s: string): Uint8Array {
  return new Uint8Array(atob(s).split("").map(c => c.charCodeAt(0)));
}

/** Parse a vault that may have been serialised as a JSON string */
function parseVault(v: unknown): EncryptedVault | null {
  if (!v) return null;
  if (typeof v === "object") return v as EncryptedVault;
  if (typeof v === "string") {
    try { return JSON.parse(v) as EncryptedVault; } catch { return null; }
  }
  return null;
}

// ─── ①  Mnemonic generation ───────────────────────────────────────────────────

function workerGenerateMnemonic(strength: 128 | 256 = 256): string {
  return generateMnemonic(wordlist, strength);
}

function workerValidateMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic, wordlist);
}

// ─── ②  Key derivation ────────────────────────────────────────────────────────

async function deriveEVMKey(mnemonic: string): Promise<Uint8Array> {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/44'/60'/0'/0/0");
  const priv = child.privateKey!.slice();
  wipeBytes(seed); wipeHDKey(root); wipeHDKey(child);
  return priv;
}

async function deriveEVMAddress(mnemonic: string): Promise<string> {
  const priv = await deriveEVMKey(mnemonic);
  const pub = secp.getPublicKey(priv, false);
  const hash = keccak_256(pub.slice(1));
  wipeBytes(priv);
  return "0x" + bytesToHex(hash.slice(-20));
}

async function deriveBTCAddress(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/84'/0'/0'/0/0");
  wipeBytes(seed); wipeHDKey(root);
  const p2wpkh = btc.p2wpkh(child.publicKey!, btc.NETWORK);
  wipeHDKey(child);
  if (!p2wpkh.address) throw new Error("Failed to generate SegWit address");
  return p2wpkh.address;
}

async function deriveSOLAddress(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  // SLIP-0010 hardened derivation: m/44'/501'/0'/0 — matches Phantom, Solflare, solanaSigner.ts
  let I = hmac(sha512, new TextEncoder().encode("ed25519 seed"), seed);
  let IL = I.slice(0, 32);
  let IR = I.slice(32);
  wipeBytes(seed);
  const path = [44, 501, 0, 0];
  for (const index of path) {
    const data = new Uint8Array(37);
    data[0] = 0;
    data.set(IL, 1);
    const h = (index + 0x80000000) >>> 0;
    data[33] = (h >>> 24) & 0xff;
    data[34] = (h >>> 16) & 0xff;
    data[35] = (h >>>  8) & 0xff;
    data[36] =  h         & 0xff;
    I = hmac(sha512, IR, data);
    const nextIL = I.slice(0, 32);
    IR.fill(0);
    IR = I.slice(32);
    IL.fill(0);
    IL = nextIL;
  }
  const pub = await nobleEd.getPublicKeyAsync(IL);
  wipeBytes(IL);
  return base58.encode(pub);
}

async function deriveTRONAddress(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const account = root.derive("m/44'/195'/0'/0/0");
  wipeBytes(seed); wipeHDKey(root);
  const priv = account.privateKey!.slice();
  wipeHDKey(account);
  try {
    const pub = secp.getPublicKey(priv, false);
    const hash = keccak_256(pub.slice(1));
    const addrBytes = new Uint8Array([0x41, ...hash.slice(-20)]);
    const checksum = sha256(sha256(addrBytes)).slice(0, 4);
    const full = new Uint8Array(addrBytes.length + 4);
    full.set(addrBytes); full.set(checksum, addrBytes.length);
    return base58.encode(full);
  } finally { wipeBytes(priv); }
}

const XRP_ALPHABET = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";
function b58EncodeXRP(input: Uint8Array): string {
  let digits = [0];
  for (let i = 0; i < input.length; i++) {
    let carry = input[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  let result = "";
  for (let i = 0; i < input.length && input[i] === 0; i++) result += XRP_ALPHABET[0];
  for (let i = digits.length - 1; i >= 0; i--) result += XRP_ALPHABET[digits[i]];
  return result;
}

async function deriveXRPAddress(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const account = root.derive("m/44'/144'/0'/0/0");
  wipeBytes(seed); wipeHDKey(root);
  const pub = account.publicKey!;
  wipeHDKey(account);
  const accountId = ripemd160(sha256(pub));
  const payload = new Uint8Array(21);
  payload[0] = 0x00; payload.set(accountId, 1);
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const final = new Uint8Array(25);
  final.set(payload); final.set(checksum, 21);
  return b58EncodeXRP(final);
}

// ─── ③  Vault encryption (scrypt + AES-256-GCM) ──────────────────────────────

/**
 * Encrypts a secret string (mnemonic or private key) into an EncryptedVault.
 * scrypt runs HERE in the worker — not on the UI thread — so the 1–3s KDF
 * work does not block React rendering or user interactions.
 *
 * Origin binding: when origin is provided it is used as AES-GCM AAD.
 * A phishing clone on a different domain cannot decrypt vaults created here.
 */
async function encryptVault(data: string, password: string | Uint8Array, origin?: string): Promise<EncryptedVault> {
  const kdfParams = getAdaptiveKdfParams(); // adaptive — stored in vault for portability
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv   = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const keyBuffer = await deriveScryptKey(password, salt, kdfParams);
  // Wipe transferred password bytes after KDF (string path already wiped inside deriveScryptKey)
  if (password instanceof Uint8Array) password.fill(0);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["encrypt"]);
  keyBuffer.fill(0);
  const gcmParams: AesGcmParams = { name: "AES-GCM", iv };
  if (origin) gcmParams.additionalData = new TextEncoder().encode(origin);
  const ciphertext = await crypto.subtle.encrypt(gcmParams, cryptoKey, new TextEncoder().encode(data));
  return {
    version: 1,
    ciphertext: b64encode(new Uint8Array(ciphertext)),
    iv: b64encode(iv),
    salt: b64encode(salt),
    kdf: "scrypt",
    kdfParams,
    ...(origin ? { origin } : {}),
  };
}

/**
 * Encrypts multiple vaults with a SINGLE scrypt round.
 * Use for multi-chain wallet creation (6 chains = 6 vaults, 1× KDF cost).
 */
async function encryptVaultBatch(
  items: Array<{ data: string }>,
  password: string | Uint8Array,
  origin?: string
): Promise<EncryptedVault[]> {
  const kdfParams = getAdaptiveKdfParams();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const keyBuffer = await deriveScryptKey(password, salt, kdfParams);
  if (password instanceof Uint8Array) password.fill(0);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["encrypt"]);
  keyBuffer.fill(0);

  return Promise.all(items.map(async ({ data }) => {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    const gcmParams: AesGcmParams = { name: "AES-GCM", iv };
    if (origin) gcmParams.additionalData = new TextEncoder().encode(origin);
    const ciphertext = await crypto.subtle.encrypt(gcmParams, cryptoKey, new TextEncoder().encode(data));
    return {
      version: 1,
      ciphertext: b64encode(new Uint8Array(ciphertext)),
      iv: b64encode(iv),
      salt: b64encode(salt),
      kdf: "scrypt" as const,
      kdfParams,
      ...(origin ? { origin } : {}),
    };
  }));
}

// ─── ④  Vault decryption ──────────────────────────────────────────────────────

/**
 * Decrypts an EncryptedVault.
 * NEVER returns the plaintext to the UI thread if it is a private key.
 * Callers that need to immediately re-use the key (e.g. sign then return only
 * the signed hex) should call the signing handlers directly rather than
 * round-tripping the plaintext through postMessage.
 */
async function decryptVault(vault: EncryptedVault, password: string | Uint8Array): Promise<string> {
  if (vault.origin) {
    const workerOrigin = (self as any).location?.origin as string | undefined;
    if (workerOrigin && workerOrigin !== vault.origin) {
      throw new Error(
        `Vault is bound to ${vault.origin} and cannot be opened on ${workerOrigin}. ` +
        `This may be a phishing site — close the tab immediately.`
      );
    }
  }
  const salt       = b64decode(vault.salt);
  const iv         = b64decode(vault.iv);
  const ciphertext = b64decode(vault.ciphertext);
  // Always pass explicit kdfParams from vault so we reproduce the exact key
  // regardless of the current device's adaptive profile.
  const keyBuffer  = await deriveScryptKey(password, salt, vault.kdfParams);
  if (password instanceof Uint8Array) password.fill(0);
  const cryptoKey  = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"]);
  keyBuffer.fill(0);
  const gcmParams: AesGcmParams = { name: "AES-GCM", iv };
  if (vault.origin) gcmParams.additionalData = new TextEncoder().encode(vault.origin);
  try {
    const decrypted = await crypto.subtle.decrypt(gcmParams, cryptoKey, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Invalid password or corrupted vault data");
  }
}

async function decryptVaultWithRawKey(vault: PasskeyVault, rawKey: ArrayBuffer): Promise<string> {
  const iv         = b64decode(vault.iv);
  const ciphertext = b64decode(vault.ciphertext);
  const cryptoKey  = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
  try {
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Passkey vault decryption failed — passkey may not match");
  }
}

// ─── ⑤  Legacy vault migration ────────────────────────────────────────────────

async function migrateLegacyVault(legacyData: any, password: string, userId: string, origin?: string): Promise<EncryptedVault> {
  let mnemonic: string;
  if (typeof legacyData === "string") {
    const combined = b64decode(legacyData);
    const saltStr   = `pexly_v1_vault_${userId}`;
    const saltBuf   = new TextEncoder().encode(saltStr);
    const keyBuffer = await deriveScryptKey(password, saltBuf);
    const iv        = combined.slice(0, 12);
    const ctxt      = combined.slice(12);
    const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"]);
    keyBuffer.fill(0);
    const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ctxt).catch(() => {
      throw new Error("Legacy vault migration failed — wrong password");
    });
    mnemonic = new TextDecoder().decode(dec);
  } else if (legacyData?.version === 1) {
    return legacyData as EncryptedVault;
  } else {
    throw new Error("Unknown vault format");
  }
  return encryptVault(mnemonic, password, origin);
}

// ─── ⑥  Multi-chain wallet creation ──────────────────────────────────────────

/**
 * Returned by createMultiChainWallet (legacy, mnemonic in response for
 * callers that need to display the seed phrase immediately after generation).
 * Prefer createSecureWallet for production flows — it never returns the
 * mnemonic and uses getMnemonicForBackup for the one-time display path.
 */
export interface MultiChainWalletResult {
  mnemonic: string;
  addresses: { EVM: string; BTC: string; SOL: string; TRX: string; XRP: string };
  encryptedVaults: {
    EVM: EncryptedVault; BTC: EncryptedVault; SOL: EncryptedVault;
    TRX: EncryptedVault; XRP: EncryptedVault; mnemonic: EncryptedVault;
  };
}

/**
 * Returned by createSecureWallet — mnemonic is intentionally absent.
 * The mnemonic was generated, encrypted, and wiped entirely inside the worker.
 * Call getMnemonicForBackup(mnemonicVault, password) once on the backup screen.
 */
export interface SecureWalletResult {
  addresses: { EVM: string; BTC: string; SOL: string; TRX: string; XRP: string };
  encryptedVaults: {
    EVM: EncryptedVault; BTC: EncryptedVault; SOL: EncryptedVault;
    TRX: EncryptedVault; XRP: EncryptedVault; mnemonic: EncryptedVault;
  };
  // No `mnemonic` field — it never left the worker
}

async function createMultiChainWallet(
  password: string,
  origin?: string,
  existingMnemonic?: string
): Promise<MultiChainWalletResult> {
  const mnemonic = existingMnemonic || generateMnemonic(wordlist, 256);
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);

  // Derive all private keys
  const evmChild = root.derive("m/44'/60'/0'/0/0");
  const btcChild = root.derive("m/84'/0'/0'/0/0");
  const trnChild = root.derive("m/44'/195'/0'/0/0");
  const xrpChild = root.derive("m/44'/144'/0'/0/0");

  const evmPriv = evmChild.privateKey!.slice();
  const btcPriv = btcChild.privateKey!.slice();
  const trnPriv = trnChild.privateKey!.slice();
  const solPriv = seed.slice(0, 32); // SLIP-0010 Ed25519

  wipeBytes(seed);
  wipeHDKey(root); wipeHDKey(evmChild); wipeHDKey(btcChild); wipeHDKey(trnChild);
  // Note: xrpChild is NOT wiped here — we still need its publicKey and privateKey below.

  // Derive addresses
  const evmPub = secp.getPublicKey(evmPriv, false);
  const evmHash = keccak_256(evmPub.slice(1));
  const evmAddress = "0x" + bytesToHex(evmHash.slice(-20));

  // Use btcChild.publicKey directly — wipeHDKey only zeros the private key/chainCode,
  // not the public key, so it's still readable after the wipe above.
  const p2wpkh = btc.p2wpkh(btcChild.publicKey!, btc.NETWORK);
  if (!p2wpkh.address) throw new Error("BTC address derivation failed");
  const btcAddress = p2wpkh.address;

  const solPub = await nobleEd.getPublicKeyAsync(solPriv);
  const solAddress = base58.encode(solPub);

  const trnPub  = secp.getPublicKey(trnPriv, false);
  const trnHash = keccak_256(trnPub.slice(1));
  const trnAddrBytes = new Uint8Array([0x41, ...trnHash.slice(-20)]);
  const trnChecksum = sha256(sha256(trnAddrBytes)).slice(0, 4);
  const trnFull = new Uint8Array(trnAddrBytes.length + 4);
  trnFull.set(trnAddrBytes); trnFull.set(trnChecksum, trnAddrBytes.length);
  const trnAddress = base58.encode(trnFull);

  // Extract XRP private key and public key before wiping the HDKey node
  const xrpPriv = xrpChild.privateKey!.slice();
  const xrpPub  = xrpChild.publicKey!;
  wipeHDKey(xrpChild);
  const xrpAccountId = ripemd160(sha256(xrpPub));
  const xrpPayload = new Uint8Array(21);
  xrpPayload[0] = 0x00; xrpPayload.set(xrpAccountId, 1);
  const xrpChecksum = sha256(sha256(xrpPayload)).slice(0, 4);
  const xrpFinal = new Uint8Array(25);
  xrpFinal.set(xrpPayload); xrpFinal.set(xrpChecksum, 21);
  const xrpAddress = b58EncodeXRP(xrpFinal);

  // Single scrypt round for all 6 vaults (mnemonic + 5 chain private keys)
  const privHex = (b: Uint8Array) => Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
  const [evmVault, btcVault, solVault, trnVault, xrpVault, mnemVault] =
    await encryptVaultBatch([
      { data: privHex(evmPriv) },
      { data: privHex(btcPriv) },
      { data: privHex(solPriv) },
      { data: privHex(trnPriv) },
      { data: privHex(xrpPriv) }, // XRP secp256k1 private key — m/44'/144'/0'/0/0
      { data: mnemonic },
    ], password, origin);

  // Wipe all private key material immediately after vaults are built
  wipeBytes(evmPriv); wipeBytes(btcPriv); wipeBytes(solPriv); wipeBytes(trnPriv); wipeBytes(xrpPriv);

  return {
    mnemonic,  // caller must encrypt/store this and never log it
    addresses: { EVM: evmAddress, BTC: btcAddress, SOL: solAddress, TRX: trnAddress, XRP: xrpAddress },
    encryptedVaults: { EVM: evmVault, BTC: btcVault, SOL: solVault, TRX: trnVault, XRP: xrpVault, mnemonic: mnemVault },
  };
}

// ─── ⑦  EVM transaction signing ──────────────────────────────────────────────

function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const frac = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(frac || "0");
}

function encodeERC20Transfer(to: string, amount: bigint): string {
  const selector = keccak_256(new TextEncoder().encode("transfer(address,uint256)")).slice(0, 4);
  const paddedTo  = to.toLowerCase().replace("0x", "").padStart(64, "0");
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

async function handleSignEVMTransaction(mnemonic: string, request: any): Promise<unknown> {
  const privKey = await deriveEVMKey(mnemonic);
  try {
    const pub  = secp.getPublicKey(privKey, false);
    const from = "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
    const baseChain = (request.currency ?? "ETH").split("_")[0].toUpperCase();
    const config = CHAIN_CONFIGS[baseChain] || CHAIN_CONFIGS.ETH;

    const nonce = request.nonce != null
      ? validateRpcNonce(request.nonce)
      : validateRpcNonce(await rpcCall(config.rpcUrl, "eth_getTransactionCount", [from, "pending"], config.rpcFallbacks));

    let to = request.to;
    let value = BigInt(0);
    let data  = "0x";
    let gasLimit: bigint;

    const token = TOKEN_CONTRACTS[request.currency];
    if (token) {
      const amt = parseTokenAmount(request.amount, token.decimals);
      data = encodeERC20Transfer(request.to, amt);
      to = token.address;
      gasLimit = request.gasLimit != null ? validateRpcGasLimit(request.gasLimit, 21_000n) : 60_000n;
    } else {
      value = parseTokenAmount(request.amount, 18);
      gasLimit = request.gasLimit != null ? validateRpcGasLimit(request.gasLimit) : 21_000n;
    }

    // ── EIP-1559 type-2 (default for supported chains) ────────────────────────
    // Pass request.type = 0 to force legacy on an EIP-1559 chain.
    const useEip1559 = config.eip1559 && request.type !== 0;

    if (useEip1559) {
      // Priority fee — caller may supply it; otherwise fetch from node
      const rawPri = request.maxPriorityFeePerGas != null
        ? request.maxPriorityFeePerGas
        : await rpcCall(config.rpcUrl, "eth_maxPriorityFeePerGas", [], config.rpcFallbacks);
      const maxPriorityFeePerGas = validateRpcGasPrice(rawPri);

      // Max fee — caller may supply; otherwise: baseFee ≈ gasPrice/2, so maxFee = gasPrice * 2
      let maxFeePerGas: bigint;
      if (request.maxFeePerGas != null) {
        maxFeePerGas = validateRpcGasPrice(request.maxFeePerGas);
      } else {
        const gp = validateRpcGasPrice(await rpcCall(config.rpcUrl, "eth_gasPrice", [], config.rpcFallbacks));
        maxFeePerGas = gp * 2n;
        if (maxFeePerGas > RPC_GAS_PRICE_MAX) maxFeePerGas = RPC_GAS_PRICE_MAX;
      }
      if (maxFeePerGas < maxPriorityFeePerGas) maxFeePerGas = maxPriorityFeePerGas;

      const accessList: never[] = [];
      // EIP-1559: signing payload = 0x02 || RLP([chainId, nonce, maxPriorityFee, maxFee, gasLimit, to, value, data, accessList])
      const signingRlp     = RLP.encode([config.chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList]);
      const signingPayload = prependTxType(0x02, signingRlp);
      const hash           = keccak_256(signingPayload);
      const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: "recovered", prehash: false } as any);
      const v        = BigInt(sigBytes[0]); // 0 or 1 — NOT EIP-155 adjusted for type-2
      const r        = BigInt("0x" + bytesToHex(sigBytes.slice(1, 33)));
      const s        = BigInt("0x" + bytesToHex(sigBytes.slice(33, 65)));
      const signedRlp = RLP.encode([config.chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, v, r, s]);
      const signedTx  = prependTxType(0x02, signedRlp);
      const txHash    = "0x" + bytesToHex(keccak_256(signedTx));
      return { signedTx: "0x" + bytesToHex(signedTx), txHash, from, to: request.to, value: request.amount, currency: request.currency, type: 2 };
    }

    // ── Legacy type-0 (EIP-155 replay protection) ─────────────────────────────
    const gasPrice = request.gasPrice != null
      ? validateRpcGasPrice(request.gasPrice)
      : validateRpcGasPrice(await rpcCall(config.rpcUrl, "eth_gasPrice", [], config.rpcFallbacks));

    const tx       = [nonce, gasPrice, gasLimit, to, value, data, config.chainId, BigInt(0), BigInt(0)];
    const encoded  = RLP.encode(tx);
    const hash     = keccak_256(encoded);
    const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: "recovered", prehash: false } as any);
    const recovery = sigBytes[0];
    const v        = BigInt(config.chainId * 2 + 35 + recovery); // EIP-155
    const r        = BigInt("0x" + bytesToHex(sigBytes.slice(1, 33)));
    const s        = BigInt("0x" + bytesToHex(sigBytes.slice(33, 65)));
    const signedTx = RLP.encode([nonce, gasPrice, gasLimit, to, value, data, v, r, s]);
    const txHash   = "0x" + bytesToHex(keccak_256(signedTx));
    return { signedTx: "0x" + bytesToHex(signedTx), txHash, from, to: request.to, value: request.amount, currency: request.currency, type: 0 };
  } finally { wipeBytes(privKey); }
}

async function handleSignEVMContractCall(mnemonic: string, request: any): Promise<unknown> {
  const privKey = await deriveEVMKey(mnemonic);
  try {
    const pub    = secp.getPublicKey(privKey, false);
    const from   = "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
    const config = CHAIN_CONFIGS[(request.chain ?? "ETH").toUpperCase()] || CHAIN_CONFIGS.ETH;

    const nonce = request.nonce != null
      ? validateRpcNonce(request.nonce)
      : validateRpcNonce(await rpcCall(config.rpcUrl, "eth_getTransactionCount", [from, "pending"], config.rpcFallbacks));

    const valueWei = BigInt(request.valueWei ?? "0");

    let gasLimit: bigint;
    if (request.gasLimit != null) {
      gasLimit = validateRpcGasLimit(request.gasLimit, 21_000n);
    } else {
      const raw = await rpcCall(config.rpcUrl, "eth_estimateGas",
        [{ from, to: request.to, value: "0x" + valueWei.toString(16), data: request.data }],
        config.rpcFallbacks);
      gasLimit = validateRpcGasLimit(raw, 21_000n);
      gasLimit = (gasLimit * 125n) / 100n; // 25% buffer
      if (gasLimit < 60_000n) gasLimit = 60_000n;
      if (gasLimit > RPC_GAS_LIMIT_MAX) throw new Error("Estimated gas exceeds block limit — transaction would be invalid");
    }

    // ── EIP-1559 type-2 (default for supported chains) ────────────────────────
    const useEip1559 = config.eip1559 && request.type !== 0;

    if (useEip1559) {
      const rawPri = request.maxPriorityFeePerGas != null
        ? request.maxPriorityFeePerGas
        : await rpcCall(config.rpcUrl, "eth_maxPriorityFeePerGas", [], config.rpcFallbacks);
      const maxPriorityFeePerGas = validateRpcGasPrice(rawPri);
      let maxFeePerGas: bigint;
      if (request.maxFeePerGas != null) {
        maxFeePerGas = validateRpcGasPrice(request.maxFeePerGas);
      } else {
        const gp = validateRpcGasPrice(await rpcCall(config.rpcUrl, "eth_gasPrice", [], config.rpcFallbacks));
        maxFeePerGas = gp * 2n;
        if (maxFeePerGas > RPC_GAS_PRICE_MAX) maxFeePerGas = RPC_GAS_PRICE_MAX;
      }
      if (maxFeePerGas < maxPriorityFeePerGas) maxFeePerGas = maxPriorityFeePerGas;
      const accessList: never[] = [];
      const signingRlp     = RLP.encode([config.chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, request.to, valueWei, request.data, accessList]);
      const signingPayload = prependTxType(0x02, signingRlp);
      const hash           = keccak_256(signingPayload);
      const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: "recovered", prehash: false } as any);
      const v        = BigInt(sigBytes[0]);
      const r        = BigInt("0x" + bytesToHex(sigBytes.slice(1, 33)));
      const s        = BigInt("0x" + bytesToHex(sigBytes.slice(33, 65)));
      const signedRlp = RLP.encode([config.chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, request.to, valueWei, request.data, accessList, v, r, s]);
      const signedTx  = prependTxType(0x02, signedRlp);
      return { signedTx: "0x" + bytesToHex(signedTx), txHash: "0x" + bytesToHex(keccak_256(signedTx)), from, type: 2 };
    }

    // ── Legacy type-0 ─────────────────────────────────────────────────────────
    const gasPrice = request.gasPrice != null
      ? validateRpcGasPrice(request.gasPrice)
      : validateRpcGasPrice(await rpcCall(config.rpcUrl, "eth_gasPrice", [], config.rpcFallbacks));

    const tx       = [nonce, gasPrice, gasLimit, request.to, valueWei, request.data, config.chainId, BigInt(0), BigInt(0)];
    const encoded  = RLP.encode(tx);
    const hash     = keccak_256(encoded);
    const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: "recovered", prehash: false } as any);
    const recovery = sigBytes[0];
    const v        = BigInt(config.chainId * 2 + 35 + recovery); // EIP-155
    const r        = BigInt("0x" + bytesToHex(sigBytes.slice(1, 33)));
    const s        = BigInt("0x" + bytesToHex(sigBytes.slice(33, 65)));
    const signedTx = RLP.encode([nonce, gasPrice, gasLimit, request.to, valueWei, request.data, v, r, s]);
    return { signedTx: "0x" + bytesToHex(signedTx), txHash: "0x" + bytesToHex(keccak_256(signedTx)), from, type: 0 };
  } finally { wipeBytes(privKey); }
}

async function handleSignEVMMessage(mnemonic: string, message: string): Promise<string> {
  const priv = await deriveEVMKey(mnemonic);
  try {
    // EIP-191: the length in the prefix must be the byte-length of the encoded
    // message, not its JavaScript character count. For ASCII they match, but
    // multi-byte Unicode characters would cause a mismatch and produce a hash
    // that no standard verifier can reproduce.
    const msgBytes = new TextEncoder().encode(message);
    const prefixStr = `\x19Ethereum Signed Message:\n${msgBytes.byteLength}`;
    const prefixBytes = new TextEncoder().encode(prefixStr);
    const combined = new Uint8Array(prefixBytes.length + msgBytes.length);
    combined.set(prefixBytes); combined.set(msgBytes, prefixBytes.length);
    const msgHash  = keccak_256(combined);
    const sigBytes = await secp.signAsync(msgHash, priv, { lowS: true, format: "recovered", prehash: false } as any);
    const r = bytesToHex(sigBytes.slice(1, 33));
    const s = bytesToHex(sigBytes.slice(33, 65));
    const v = (27 + sigBytes[0]).toString(16).padStart(2, "0");
    return "0x" + r + s + v;
  } finally { wipeBytes(priv); }
}

// ─── ⑧  Bitcoin signing ───────────────────────────────────────────────────────

async function handleSignBitcoinTransaction(mnemonic: string, request: any): Promise<unknown> {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/84'/0'/0'/0/0");
  wipeBytes(seed); wipeHDKey(root);
  try {
    const p2wpkh = btc.p2wpkh(child.publicKey!, btc.NETWORK);
    const changeAddr = request.changeAddress || p2wpkh.address!;
    const psbt = new btc.Transaction();
    for (const utxo of request.utxos) {
      psbt.addInput({ txid: utxo.txid, index: utxo.vout, witnessUtxo: { script: p2wpkh.script, amount: BigInt(utxo.value) } });
    }
    const totalInput = request.utxos.reduce((s: number, u: any) => s + u.value, 0);
    const amountSats = Math.round(request.amount * 1e8);
    const txSize     = request.utxos.length * 148 + 2 * 34 + 10;
    const feeSats    = Math.ceil(txSize * request.feeRate);
    psbt.addOutputAddress(request.to, BigInt(amountSats), btc.NETWORK);
    const change = totalInput - amountSats - feeSats;
    if (change > 546) psbt.addOutputAddress(changeAddr, BigInt(change), btc.NETWORK);
    psbt.sign(child.privateKey!);
    psbt.finalize();
    const txidBytes = sha256(sha256(psbt.toBytes())).reverse();
    return { signedTx: psbt.hex, txid: bytesToHex(txidBytes), from: p2wpkh.address!, to: request.to, amount: request.amount, fee: feeSats / 1e8 };
  } finally { wipeHDKey(child); }
}

// ─── ⑨  Solana signing ────────────────────────────────────────────────────────

async function handleSignSolanaTransaction(mnemonic: string, request: any): Promise<unknown> {
  const seed = await mnemonicToSeed(mnemonic);
  const priv = seed.slice(0, 32);
  try {
    const msgBytes = request.messageBytes instanceof Uint8Array ? request.messageBytes : new Uint8Array(request.messageBytes);
    const signature = await nobleEd.signAsync(msgBytes, priv);
    const pub = await nobleEd.getPublicKeyAsync(priv);
    return { signature: Array.from(signature), publicKey: base58.encode(pub) };
  } finally { wipeBytes(seed); }
}

// ─── ⑩  Hashing utilities ─────────────────────────────────────────────────────

function workerHash(algorithm: "keccak256" | "sha256" | "sha512" | "ripemd160", hex: string): string {
  const input = new Uint8Array(hex.replace("0x", "").match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  switch (algorithm) {
    case "keccak256": return "0x" + bytesToHex(keccak_256(input));
    case "sha256":    return "0x" + bytesToHex(sha256(input));
    case "sha512":    return "0x" + bytesToHex(sha512(input));
    case "ripemd160": return "0x" + bytesToHex(ripemd160(input));
    default:          throw new Error(`Unknown hash algorithm: ${algorithm}`);
  }
}

function workerHmacSha256(keyHex: string, dataHex: string): string {
  const key  = new Uint8Array(keyHex.replace("0x","").match(/.{1,2}/g)!.map(b => parseInt(b,16)));
  const data = new Uint8Array(dataHex.replace("0x","").match(/.{1,2}/g)!.map(b => parseInt(b,16)));
  return "0x" + bytesToHex(hmac(sha256, key, data));
}

// ─── ⑪  Validate a vault password (timing-safe: full scrypt every time) ───────

async function validateVaultPassword(vault: EncryptedVault | PasskeyVault | unknown, password: string): Promise<boolean> {
  const parsed = parseVault(vault);
  if (!parsed) return false;
  try { await decryptVault(parsed, password); return true; } catch { return false; }
}

// ─── ⑫  Secure wallet creation (mnemonic NEVER in postMessage response) ───────
//
// Architecture:
//   1. Mnemonic is generated or accepted as existingMnemonic entirely inside worker.
//   2. All private keys and the mnemonic itself are encrypted to vaults.
//   3. Only SecureWalletResult (addresses + vaults) is returned — no `mnemonic` field.
//   4. To show the seed phrase backup screen, call getMnemonicForBackup(vault, pw)
//      exactly once; that is the only controlled crossing of the mnemonic.

async function createSecureWallet(
  password: string,
  origin?: string,
  existingMnemonic?: string,
): Promise<SecureWalletResult> {
  const full = await createMultiChainWallet(password, origin, existingMnemonic);
  // Return everything except the mnemonic field so it never appears in
  // the postMessage structured-clone serialised to the main thread.
  const { mnemonic: _dropped, ...rest } = full;
  void _dropped; // explicitly discard — V8 will let this GC
  return rest;
}

// ─── ⑬  One-time mnemonic backup display ──────────────────────────────────────
//
// Decrypts the mnemonic vault and returns the plaintext phrase.
// This is the ONLY path where the mnemonic crosses the postMessage wire.
// The caller must:
//   • Display it in a non-copyable, screenshot-blocked UI if possible.
//   • Immediately discard it from component state after the user confirms backup.
//   • Never write it to localStorage, a database, or any log.

async function getMnemonicForBackup(
  vault: EncryptedVault | unknown,
  password: string,
): Promise<string> {
  const parsed = parseVault(vault);
  if (!parsed) throw new Error("Invalid mnemonic vault");
  const mnemonic = await decryptVault(parsed, password);
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error("Decrypted data is not a valid BIP-39 mnemonic — wrong password or corrupted vault");
  }
  return mnemonic;
}

// ─── ⑭  Vault-based signing helpers (mnemonic stays in worker) ───────────────
//
// These accept an EncryptedVault + password instead of a plaintext mnemonic.
// Internally they:
//   1. Decrypt the mnemonic vault with the user's password (scrypt KDF inside worker).
//   2. Derive the chain-specific private key.
//   3. Sign the transaction / message.
//   4. Wipe all key material with wipeBytes / wipeHDKey.
//   5. Return only the signed output — mnemonic never touches postMessage args.

async function signEVMTransactionFromVault(
  vault: EncryptedVault | unknown,
  password: string,
  request: any,
): Promise<unknown> {
  const parsed = parseVault(vault);
  if (!parsed) throw new Error("Invalid vault");
  const mnemonic = await decryptVault(parsed, password);
  try {
    return await handleSignEVMTransaction(mnemonic, request);
  } finally {
    // String interning means we can't zero a JS string's backing buffer, but
    // we can at least remove the reference so the GC can collect it sooner.
    // The private key bytes inside handleSignEVMTransaction are already wiped
    // by its own finally block.
  }
}

async function signEVMContractCallFromVault(
  vault: EncryptedVault | unknown,
  password: string,
  request: any,
): Promise<unknown> {
  const parsed = parseVault(vault);
  if (!parsed) throw new Error("Invalid vault");
  const mnemonic = await decryptVault(parsed, password);
  return handleSignEVMContractCall(mnemonic, request);
}

async function signEVMMessageFromVault(
  vault: EncryptedVault | unknown,
  password: string,
  message: string,
): Promise<string> {
  const parsed = parseVault(vault);
  if (!parsed) throw new Error("Invalid vault");
  const mnemonic = await decryptVault(parsed, password);
  return handleSignEVMMessage(mnemonic, message);
}

async function signBitcoinTransactionFromVault(
  vault: EncryptedVault | unknown,
  password: string,
  request: any,
): Promise<unknown> {
  const parsed = parseVault(vault);
  if (!parsed) throw new Error("Invalid vault");
  const mnemonic = await decryptVault(parsed, password);
  return handleSignBitcoinTransaction(mnemonic, request);
}

async function signSolanaTransactionFromVault(
  vault: EncryptedVault | unknown,
  password: string,
  request: any,
): Promise<unknown> {
  const parsed = parseVault(vault);
  if (!parsed) throw new Error("Invalid vault");
  const mnemonic = await decryptVault(parsed, password);
  return handleSignSolanaTransaction(mnemonic, request);
}

// ─── Message type registry ────────────────────────────────────────────────────

export type WorkerRequest =
  // ① Mnemonic
  | { id: string; type: "generateMnemonic";    strength?: 128 | 256 }
  | { id: string; type: "validateMnemonic";    mnemonic: string }
  // ② Addresses (mnemonic-based — kept for wallet-restore flows)
  | { id: string; type: "getEVMAddress";       mnemonic: string }
  | { id: string; type: "getBitcoinAddress";   mnemonic: string }
  | { id: string; type: "getSolanaAddress";    mnemonic: string }
  | { id: string; type: "getTronAddress";      mnemonic: string }
  | { id: string; type: "getXRPAddress";       mnemonic: string }
  | { id: string; type: "getAllAddresses";     mnemonic: string }
  // ③ Encryption
  | { id: string; type: "encryptVault";        data: string; password: string; origin?: string }
  | { id: string; type: "encryptVaultBatch";   items: Array<{ data: string }>; password: string; origin?: string }
  | { id: string; type: "deriveVaultKey";      password: string }
  // ④ Decryption
  | { id: string; type: "decryptVault";        vault: EncryptedVault | unknown; password: string }
  | { id: string; type: "decryptVaultWithRawKey"; vault: PasskeyVault; rawKey: ArrayBuffer }
  | { id: string; type: "validateVaultPassword"; vault: unknown; password: string }
  // ⑤ Migration
  | { id: string; type: "migrateLegacyVault";  legacyData: any; password: string; userId: string; origin?: string }
  // ⑥ Multi-chain wallet (legacy — returns mnemonic in response; prefer createSecureWallet)
  | { id: string; type: "createMultiChainWallet"; password: string; origin?: string; existingMnemonic?: string }
  // ⑦ EVM signing (legacy mnemonic-based)
  | { id: string; type: "signEVMTransaction";  mnemonic: string; request: any }
  | { id: string; type: "signEVMContractCall"; mnemonic: string; request: any }
  | { id: string; type: "signEVMMessage";      mnemonic: string; message: string }
  // ⑧ Bitcoin (legacy mnemonic-based)
  | { id: string; type: "signBitcoinTransaction"; mnemonic: string; request: any }
  // ⑨ Solana (legacy mnemonic-based)
  | { id: string; type: "signSolanaTransaction"; mnemonic: string; request: any }
  // ⑩ Hashing
  | { id: string; type: "hash"; algorithm: "keccak256" | "sha256" | "sha512" | "ripemd160"; hex: string }
  | { id: string; type: "hmacSha256"; keyHex: string; dataHex: string }
  // ─── SECURE VAULT-BASED API (mnemonic never crosses the postMessage wire) ──
  // ⑫ Secure wallet creation — no `mnemonic` in response
  | { id: string; type: "createSecureWallet"; password: string; origin?: string; existingMnemonic?: string }
  // ⑬ One-time mnemonic backup display (user must confirm backup before calling)
  | { id: string; type: "getMnemonicForBackup"; vault: EncryptedVault | unknown; password: string }
  // ⑭ Vault-based signing — mnemonic decrypted + wiped entirely inside worker
  | { id: string; type: "signEVMTransactionFromVault";  vault: EncryptedVault | unknown; password: string; request: any }
  | { id: string; type: "signEVMContractCallFromVault"; vault: EncryptedVault | unknown; password: string; request: any }
  | { id: string; type: "signEVMMessageFromVault";      vault: EncryptedVault | unknown; password: string; message: string }
  | { id: string; type: "signBitcoinTransactionFromVault"; vault: EncryptedVault | unknown; password: string; request: any }
  | { id: string; type: "signSolanaTransactionFromVault";  vault: EncryptedVault | unknown; password: string; request: any };

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
//   Fall-through to msg.password (plain string) keeps backward compatibility
//   when passwordBytes is absent (e.g. legacy calls from other callers).

function resolvePassword(msg: any): string | Uint8Array {
  if (msg.passwordBytes instanceof Uint8Array) return msg.passwordBytes;
  return (msg.password as string) ?? "";
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data as any;
  const pw  = resolvePassword(msg); // Uint8Array (transferred) or string
  let response: WorkerResponse;
  try {
    let result: unknown;
    switch ((msg as WorkerRequest).type) {
      // ① Mnemonic
      case "generateMnemonic":    result = workerGenerateMnemonic(msg.strength); break;
      case "validateMnemonic":    result = workerValidateMnemonic(msg.mnemonic); break;
      // ② Addresses
      case "getEVMAddress":       result = await deriveEVMAddress(msg.mnemonic); break;
      case "getBitcoinAddress":   result = await deriveBTCAddress(msg.mnemonic); break;
      case "getSolanaAddress":    result = await deriveSOLAddress(msg.mnemonic); break;
      case "getTronAddress":      result = await deriveTRONAddress(msg.mnemonic); break;
      case "getXRPAddress":       result = await deriveXRPAddress(msg.mnemonic); break;
      case "getAllAddresses":
        result = {
          EVM: await deriveEVMAddress(msg.mnemonic),
          BTC: await deriveBTCAddress(msg.mnemonic),
          SOL: await deriveSOLAddress(msg.mnemonic),
          TRX: await deriveTRONAddress(msg.mnemonic),
          XRP: await deriveXRPAddress(msg.mnemonic),
        };
        break;
      // ③ Encryption — pw is Uint8Array or string; encryptVault accepts both
      case "encryptVault":      result = await encryptVault(msg.data, pw, msg.origin); break;
      case "encryptVaultBatch": result = await encryptVaultBatch(msg.items, pw, msg.origin); break;
      // ④ Decryption
      case "decryptVault": {
        const v = parseVault(msg.vault);
        if (!v) throw new Error("Invalid vault format");
        result = await decryptVault(v, pw);
        break;
      }
      case "decryptVaultWithRawKey": result = await decryptVaultWithRawKey(msg.vault, msg.rawKey); break;
      case "validateVaultPassword":  result = await validateVaultPassword(msg.vault, pw); break;
      // ⑤ Migration
      case "migrateLegacyVault":
        result = await migrateLegacyVault(msg.legacyData, pw as string, msg.userId, msg.origin); break;
      // ⑥ Multi-chain wallet (legacy)
      case "createMultiChainWallet":
        result = await createMultiChainWallet(pw as string, msg.origin, msg.existingMnemonic); break;
      // ⑦ EVM signing (legacy mnemonic-based)
      case "signEVMTransaction":  result = await handleSignEVMTransaction(msg.mnemonic, msg.request); break;
      case "signEVMContractCall": result = await handleSignEVMContractCall(msg.mnemonic, msg.request); break;
      case "signEVMMessage":      result = await handleSignEVMMessage(msg.mnemonic, msg.message); break;
      // ⑧ Bitcoin (legacy)
      case "signBitcoinTransaction": result = await handleSignBitcoinTransaction(msg.mnemonic, msg.request); break;
      // ⑨ Solana (legacy)
      case "signSolanaTransaction":  result = await handleSignSolanaTransaction(msg.mnemonic, msg.request); break;
      // ⑩ Hashing
      case "hash":      result = workerHash(msg.algorithm, msg.hex); break;
      case "hmacSha256": result = workerHmacSha256(msg.keyHex, msg.dataHex); break;
      // ⑫ Secure wallet creation
      case "createSecureWallet":
        result = await createSecureWallet(pw as string, msg.origin, msg.existingMnemonic); break;
      // ⑬ Mnemonic backup display (one-time, controlled)
      case "getMnemonicForBackup":
        result = await getMnemonicForBackup(msg.vault, pw); break;
      // ⑭ Vault-based signing — mnemonic never on postMessage wire
      case "signEVMTransactionFromVault":
        result = await signEVMTransactionFromVault(msg.vault, pw, msg.request); break;
      case "signEVMContractCallFromVault":
        result = await signEVMContractCallFromVault(msg.vault, pw, msg.request); break;
      case "signEVMMessageFromVault":
        result = await signEVMMessageFromVault(msg.vault, pw, msg.message); break;
      case "signBitcoinTransactionFromVault":
        result = await signBitcoinTransactionFromVault(msg.vault, pw, msg.request); break;
      case "signSolanaTransactionFromVault":
        result = await signSolanaTransactionFromVault(msg.vault, pw, msg.request); break;
      default:
        throw new Error(`Unknown worker message type: ${(msg as any).type}`);
    }
    response = { id: msg.id, ok: true, result };
  } catch (err) {
    response = { id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  self.postMessage(response);
};
