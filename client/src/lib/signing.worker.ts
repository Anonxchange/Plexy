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
 * + signing for EVM / Bitcoin / Solana / Tron.
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
 *   BTC   — Native SegWit (P2WPKH) via @scure/btc-signer
 *   SOL   — SLIP-0010 (m/44'/501'/0'/0) + ed25519
 *   TRX   — secp256k1 / keccak-256 (same derivation as EVM, different address encoding)
 */

// ─── Imports ──────────────────────────────────────────────────────────────────

import * as RLP      from "@ethereumjs/rlp";
import * as secp      from "@noble/secp256k1";
import * as btc       from "@scure/btc-signer";
import * as nobleEd   from "@noble/ed25519";

import { mnemonicToSeed } from "@scure/bip39";
import { HDKey }    from "@scure/bip32";
import { base58 }   from "@scure/base";

import { keccak_256 } from "@noble/hashes/sha3.js";
import { sha256 }     from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import {
  wipeBytes,
  wipeHDKey,
  clearSessionCache,
  parseVault,
  workerGenerateMnemonic,
  workerValidateMnemonic,
  deriveEVMKey,
  deriveEVMAddress,
  deriveBTCAddress,
  deriveSOLAddress,
  deriveTRONAddress,
  deriveXRPAddress,
  deriveAllAddresses,
  _deriveSolPriv,
  encryptVault,
  encryptVaultBatch,
  decryptVault,
  decryptVaultWithRawKey,
  openVault,
  migrateLegacyVault,
  createMultiChainWallet,
  createSecureWallet,
  getMnemonicForBackup,
  validateVaultPassword,
  workerHash,
  workerHmacSha256,
} from "./vault-crypto";
import type {
  EncryptedVault,
  PasskeyVault,
  KdfParams,
  MultiChainWalletResult,
  SecureWalletResult,
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
async function workerGatewayRpc(chain: string, method: string, params: unknown[]): Promise<unknown> {
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
      headers: { "Content-Type": "application/json", apikey: anonKey },
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

/**
 * Shared EIP-1559 type-2 / legacy type-0 EVM signing core.
 * Eliminates the duplicate signing block that existed in both EVM handlers.
 */
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
    const baseChain = (request.currency ?? "ETH").split("_")[0].toUpperCase();
    const config  = CHAIN_CONFIGS[baseChain] || CHAIN_CONFIGS.ETH;
    const gwChain = workerGatewayChain(baseChain);

    const nonce = request.nonce != null
      ? validateRpcNonce(request.nonce)
      : validateRpcNonce(await workerGatewayRpc(gwChain, "eth_getTransactionCount", [from, "pending"]));

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

    const core = await _signEVMCore(privKey, from, config, gwChain, nonce, to, value, data, gasLimit, request);
    return { ...core, to: request.to, value: request.amount, currency: request.currency };
  } finally { wipeBytes(privKey); }
}

async function handleSignEVMContractCall(mnemonic: string, request: any): Promise<unknown> {
  const privKey = await deriveEVMKey(mnemonic);
  try {
    const pub     = secp.getPublicKey(privKey, false);
    const from    = "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
    const baseChain = (request.chain ?? "ETH").toUpperCase();
    const config  = CHAIN_CONFIGS[baseChain] || CHAIN_CONFIGS.ETH;
    const gwChain = workerGatewayChain(baseChain);

    const nonce = request.nonce != null
      ? validateRpcNonce(request.nonce)
      : validateRpcNonce(await workerGatewayRpc(gwChain, "eth_getTransactionCount", [from, "pending"]));

    const valueWei = BigInt(request.valueWei ?? "0");

    let gasLimit: bigint;
    if (request.gasLimit != null) {
      gasLimit = validateRpcGasLimit(request.gasLimit, 21_000n);
    } else {
      const raw = await workerGatewayRpc(gwChain, "eth_estimateGas",
        [{ from, to: request.to, value: "0x" + valueWei.toString(16), data: request.data }]);
      gasLimit = validateRpcGasLimit(raw, 21_000n);
      gasLimit = (gasLimit * 125n) / 100n;
      if (gasLimit < 60_000n) gasLimit = 60_000n;
      if (gasLimit > RPC_GAS_LIMIT_MAX) throw new Error("Estimated gas exceeds block limit — transaction would be invalid");
    }

    return await _signEVMCore(privKey, from, config, gwChain, nonce, request.to, valueWei, request.data, gasLimit, request);
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
    if (change < 0) {
      throw new Error("Insufficient confirmed Bitcoin funds for the amount and network fee.");
    }
    if (change > 546) psbt.addOutputAddress(changeAddr, BigInt(change), btc.NETWORK);
    psbt.sign(child.privateKey!);
    psbt.finalize();
    const txidBytes = sha256(sha256(psbt.toBytes())).reverse();
    return { signedTx: psbt.hex, txid: bytesToHex(txidBytes), from: p2wpkh.address!, to: request.to, amount: request.amount, fee: feeSats / 1e8 };
  } finally { wipeHDKey(child); }
}

// ─── ⑨  Solana signing (SLIP-0010 m/44'/501'/0'/0) ───────────────────────────

function _solEncodeLen(len: number): number[] {
  const out: number[] = [];
  while (len >= 0x80) { out.push((len & 0x7f) | 0x80); len >>= 7; }
  out.push(len);
  return out;
}

async function handleSignSolanaTransaction(mnemonic: string, request: any): Promise<unknown> {
  const seed = await mnemonicToSeed(mnemonic);
  const priv = await _deriveSolPriv(seed);
  wipeBytes(seed);
  try {
    // Legacy path: pre-built messageBytes (raw signing without tx construction)
    if (request.messageBytes != null) {
      const msgBytes = request.messageBytes instanceof Uint8Array
        ? request.messageBytes
        : new Uint8Array(request.messageBytes);
      const signature = await nobleEd.signAsync(msgBytes, priv);
      const pub = await nobleEd.getPublicKeyAsync(priv);
      return { signature: Array.from(signature), publicKey: base58.encode(pub) };
    }

    // Full transaction path: build from { to, amount, currency, recentBlockhash }
    const pub = await nobleEd.getPublicKeyAsync(priv);
    const recentBlockhash = base58.decode(request.recentBlockhash);
    let message: Uint8Array;

    if (request.currency === "SOL") {
      const toPubkey = base58.decode(request.to);
      const systemProgram = base58.decode("11111111111111111111111111111111");
      const [whole, fraction = ""] = request.amount.split(".");
      const lamports = BigInt(whole) * 1_000_000_000n + BigInt(fraction.padEnd(9, "0").slice(0, 9));
      const instrData = new Uint8Array(12);
      const view = new DataView(instrData.buffer);
      view.setUint32(0, 2, true);
      view.setBigUint64(4, lamports, true);
      const keys = [pub, toPubkey, systemProgram];
      message = new Uint8Array([
        1, 0, 1,
        ..._solEncodeLen(keys.length),
        ...keys.flatMap(k => Array.from(k)),
        ...recentBlockhash,
        ..._solEncodeLen(1),
        2,
        ..._solEncodeLen(2), 0, 1,
        ..._solEncodeLen(instrData.length),
        ...instrData,
      ]);
    } else {
      if (!request.fromTokenAccount || !request.toTokenAccount || !request.tokenAddress) {
        throw new Error("fromTokenAccount, toTokenAccount and tokenAddress required for SPL transfers");
      }
      const tokenProgram = base58.decode("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
      const fromATA = base58.decode(request.fromTokenAccount);
      const toATA   = base58.decode(request.toTokenAccount);
      const mint    = base58.decode(request.tokenAddress);
      const [whole, fraction = ""] = request.amount.split(".");
      const amount  = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0").slice(0, 6));
      const instrData = new Uint8Array(10);
      const view = new DataView(instrData.buffer);
      view.setUint8(0, 12);
      view.setBigUint64(1, amount, true);
      view.setUint8(9, 6);
      const keys = [pub, fromATA, mint, toATA, tokenProgram];
      message = new Uint8Array([
        1, 0, 3,
        ..._solEncodeLen(keys.length),
        ...keys.flatMap(k => Array.from(k)),
        ...recentBlockhash,
        ..._solEncodeLen(1),
        4,
        ..._solEncodeLen(5), 0, 1, 2, 3, 4,
        ..._solEncodeLen(instrData.length),
        ...instrData,
      ]);
    }

    const signature = await nobleEd.signAsync(message, priv);
    const packet = new Uint8Array([1, ...signature, ...message]);
    return { signedTx: base58.encode(packet), txHash: base58.encode(sha256(message)) };
  } finally { wipeBytes(priv); }
}

// ─── ⑩  Tron signing (secp256k1 / keccak-256 — same derivation as EVM) ───────

async function handleSignTronTransaction(mnemonic: string, request: any): Promise<unknown> {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const account = root.derive("m/44'/195'/0'/0/0");
  wipeBytes(seed); wipeHDKey(root);
  const priv = account.privateKey!.slice();
  wipeHDKey(account);
  try {
    const pub       = secp.getPublicKey(priv, false);
    const addrHash  = keccak_256(pub.slice(1));
    const addrBytes = new Uint8Array([0x41, ...addrHash.slice(-20)]);
    const checksum  = sha256(sha256(addrBytes)).slice(0, 4);
    const full = new Uint8Array(25);
    full.set(addrBytes); full.set(checksum, 21);
    const from = base58.encode(full);

    const [whole, fraction = ""] = request.amount.split(".");
    const sun = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0").slice(0, 6));

    const tx: any = {
      owner_address: from,
      to_address: request.to,
      amount: Number(sun),
      timestamp: Date.now(),
      type: "TransferContract",
    };
    const txBytes  = new TextEncoder().encode(JSON.stringify(tx));
    const txHash   = sha256(txBytes);
    // format: "recovered" — @noble/secp256k1 v3 defaults to a 64-byte
    // "compact" signature (r,s only) unless a format is specified. TRON
    // signatures require the 65-byte recovered form (r,s,v) for on-chain
    // public-key recovery, same as Ethereum. Without this, signAsync() was
    // silently returning a signature TRON nodes would reject as malformed.
    const sigBytes = await secp.signAsync(txHash, priv, { format: "recovered", prehash: false } as any);
    const signedTx = { ...tx, signature: base58.encode(sigBytes) };
    const txID     = base58.encode(sha256(new TextEncoder().encode(JSON.stringify(signedTx))));
    return { signedTx: JSON.stringify(signedTx), txID, from, to: request.to, amount: request.amount };
  } finally { wipeBytes(priv); }
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

async function signEVMTransactionFromVault(vault: unknown, password: string | Uint8Array, request: any): Promise<unknown> {
  return handleSignEVMTransaction(await openVault(vault, password), request);
}

async function signEVMContractCallFromVault(vault: unknown, password: string | Uint8Array, request: any): Promise<unknown> {
  return handleSignEVMContractCall(await openVault(vault, password), request);
}

async function signEVMMessageFromVault(vault: unknown, password: string | Uint8Array, message: string): Promise<string> {
  return handleSignEVMMessage(await openVault(vault, password), message);
}

async function signBitcoinTransactionFromVault(vault: unknown, password: string | Uint8Array, request: any): Promise<unknown> {
  return handleSignBitcoinTransaction(await openVault(vault, password), request);
}

async function signSolanaTransactionFromVault(vault: unknown, password: string | Uint8Array, request: any): Promise<unknown> {
  return handleSignSolanaTransaction(await openVault(vault, password), request);
}

async function signTronTransactionFromVault(vault: unknown, password: string | Uint8Array, request: any): Promise<unknown> {
  return handleSignTronTransaction(await openVault(vault, password), request);
}

/**
 * Sign a pre-computed 32-byte hash with the vault's EVM secp256k1 key.
 *
 * Used for EIP-712 flows (e.g. AsterDEX registration) where the hash is
 * computed outside the worker. Returns the Ethereum-compatible signature:
 *   "0x" + r (32 bytes hex) + s (32 bytes hex) + v (1 byte, 27 or 28)
 *
 * The private key is derived entirely inside the worker and wiped after use.
 */
async function signEVMRawHashFromVault(vault: unknown, password: string | Uint8Array, hashHex: string): Promise<string> {
  const mnemonic = await openVault(vault, password);
  const privKey  = await deriveEVMKey(mnemonic);
  try {
    const stripped = hashHex.startsWith("0x") ? hashHex.slice(2) : hashHex;
    const hash = new Uint8Array(stripped.length / 2);
    for (let i = 0; i < hash.length; i++) hash[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
    const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: "recovered", prehash: false } as any);
    const recovery = sigBytes[0];
    return "0x"
      + bytesToHex(sigBytes.slice(1, 33))
      + bytesToHex(sigBytes.slice(33, 65))
      + (recovery + 27).toString(16).padStart(2, "0");
  } finally {
    wipeBytes(privKey);
  }
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
  // ③·5 Session cache management
  | { id: string; type: "clearSessionCache" }
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
  | { id: string; type: "signSolanaTransactionFromVault";  vault: EncryptedVault | unknown; password: string; request: any }
  // ⑩ Tron (legacy mnemonic-based)
  | { id: string; type: "signTronTransaction"; mnemonic: string; request: any }
  // ⑭ continued — Tron vault-based
  | { id: string; type: "signTronTransactionFromVault";    vault: EncryptedVault | unknown; password: string; request: any }
  // ⑮ Raw EIP-712 hash signing (AsterDEX and similar EIP-712 flows)
  | { id: string; type: "signEVMRawHashFromVault"; vault: EncryptedVault | unknown; password: string; hashHex: string };

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
  if (typeof msg.password === "string") {
    if (import.meta.env.DEV) {
      console.warn("[CryptoVaultWorker] Password arrived as plain string — upgrade caller to use passwordBytes transferable");
    }
    return msg.password;
  }
  return "";
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
      case "getAllAddresses":     result = await deriveAllAddresses(msg.mnemonic); break;
      // ③ Encryption — pw is Uint8Array or string; encryptVault accepts both
      // NOTE: there is intentionally no "deriveVaultKey" handler. A prior
      // version returned the raw scrypt-derived key as hex over postMessage,
      // which contradicts this file's own invariant that key material never
      // leaves the worker. Callers that need one scrypt round to produce
      // several vaults should use "encryptVaultBatch" — it derives the key
      // once internally and only ever returns finished EncryptedVault blobs.
      // ③·5 Session cache management
      case "clearSessionCache": clearSessionCache(); result = true; break;
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
      // ⑩ Tron (legacy)
      case "signTronTransaction":    result = await handleSignTronTransaction(msg.mnemonic, msg.request); break;
      // ⑪ Hashing
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
      case "signTronTransactionFromVault":
        result = await signTronTransactionFromVault(msg.vault, pw, msg.request); break;
      case "signEVMRawHashFromVault":
        result = await signEVMRawHashFromVault(msg.vault, pw, msg.hashHex); break;
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
  }
  self.postMessage(response);
};
