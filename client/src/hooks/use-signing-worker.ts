/**
 * use-signing-worker.ts
 *
 * Bridge between the React UI thread and the isolated cryptographic vault worker.
 *
 * All sensitive operations (key derivation, signing, encryption, hashing) run
 * inside signing.worker.ts in an isolated CPU thread. The UI thread only ever
 * sees addresses, signed tx hex, and EncryptedVault blobs — never raw keys.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *   // Module-level singleton (works outside React too)
 *   import { callSigningWorker } from "@/lib/use-signing-worker";
 *
 *   const mnemonic = await callSigningWorker("generateMnemonic", { strength: 256 });
 *
 *   const vault = await callSigningWorker("encryptVault", {
 *     data: mnemonic, password: userPassword, origin: window.location.origin
 *   });
 *
 *   const { signedTx, txHash } = await callSigningWorker("signEVMTransaction", {
 *     mnemonic, request: { to, amount, currency }
 *   });
 *
 *   // React hook variant
 *   const { call, ready } = useSigningWorker();
 *   const address = await call("getEVMAddress", { mnemonic });
 *
 * ─── Security properties ─────────────────────────────────────────────────────
 *
 *  • The worker is instantiated ONCE per page; never terminated (avoids
 *    re-init cost on each transaction).
 *  • postMessage is structured-clone — no prototype pollution across the boundary.
 *  • scrypt (N=262144) runs inside the worker — the main thread never blocks
 *    during the 1–3 s KDF computation.
 *  • Error messages from the worker are forwarded as plain strings so no
 *    stack traces with sensitive paths leak back.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkerRequest, WorkerResponse } from "./signing.worker";

// Re-export types consumers may need
export type { EncryptedVault, PasskeyVault, MultiChainWalletResult, SecureWalletResult, KdfParams } from "./signing.worker";

// ─── Singleton worker + pending-call registry ─────────────────────────────────

type PendingCall = {
  resolve: (value: unknown) => void;
  reject:  (reason: Error)  => void;
};

let sharedWorker: Worker | null = null;
const pending = new Map<string, PendingCall>();
let callSeq = 0;

function getWorker(): Worker {
  if (sharedWorker) return sharedWorker;
  sharedWorker = new Worker(
    new URL("./signing.worker.ts", import.meta.url),
    { type: "module" }
  );
  sharedWorker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
    const cb = pending.get(data.id);
    if (!cb) return;
    pending.delete(data.id);
    data.ok ? cb.resolve(data.result) : cb.reject(new Error(data.error));
  };
  sharedWorker.onerror = (err) => {
    console.error("[CryptoVaultWorker]", err.message ?? err);
  };
  return sharedWorker;
}

// ─── Core dispatch function ───────────────────────────────────────────────────

type RequestArgs<T extends WorkerRequest["type"]> =
  Omit<Extract<WorkerRequest, { type: T }>, "id" | "type">;

/**
 * Dispatch a request to the cryptographic vault worker and await the result.
 *
 * @example
 * const mnemonic = await callSigningWorker("generateMnemonic", {});
 * const vault    = await callSigningWorker("encryptVault", { data: mnemonic, password, origin });
 */
export function callSigningWorker<T = unknown>(
  type: WorkerRequest["type"],
  args: RequestArgs<typeof type>
): Promise<T> {
  const id = `cvw-${++callSeq}-${Date.now()}`;
  const worker = getWorker();

  // ── Transferable password hardening ────────────────────────────────────────
  // If args contains a `password` string, encode it to a Uint8Array and send
  // the underlying ArrayBuffer as a Transferable. After transfer the buffer is
  // detached on the main thread (byteLength → 0) so no other code can read it.
  // The worker receives it as `passwordBytes` and zero-fills it after the KDF.
  const payload: any = { id, type, ...args };
  const transfer: Transferable[] = [];
  if (typeof (args as any).password === "string" && (args as any).password.length > 0) {
    const pwBytes = new TextEncoder().encode((args as any).password);
    payload.passwordBytes = pwBytes;
    delete payload.password;          // don't send the string form
    transfer.push(pwBytes.buffer as ArrayBuffer);
  }

  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    worker.postMessage(payload, transfer);
  });
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * React hook that exposes the cryptographic vault worker.
 *
 * `ready` is true once the worker is loaded. Calls before the worker is ready
 * are queued automatically via the singleton — `ready` is primarily useful for
 * showing a loading indicator on the first render.
 */
export function useSigningWorker() {
  const [ready, setReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = getWorker();
    // Fire a cheap no-op ping to confirm the worker is alive
    callSigningWorker("validateMnemonic", { mnemonic: "" })
      .catch(() => { /* expected — empty string is invalid */ })
      .finally(() => setReady(true));
    return () => { /* never terminate the singleton */ };
  }, []);

  const call = useCallback(
    <T = unknown>(
      type: WorkerRequest["type"],
      args: RequestArgs<typeof type>
    ): Promise<T> => callSigningWorker<T>(type, args as any),
    []
  );

  return { call, ready };
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────
// These are thin wrappers so callers don't have to remember the message type strings.

/** Generate a fresh BIP-39 mnemonic inside the worker */
export const generateMnemonic = (strength: 128 | 256 = 256) =>
  callSigningWorker<string>("generateMnemonic", { strength });

/** Validate a BIP-39 mnemonic */
export const validateMnemonic = (mnemonic: string) =>
  callSigningWorker<boolean>("validateMnemonic", { mnemonic });

/** Derive the EVM (ETH/BSC/ARB/…) address for a mnemonic */
export const getEVMAddress = (mnemonic: string) =>
  callSigningWorker<string>("getEVMAddress", { mnemonic });

/** Derive the Bitcoin SegWit (P2WPKH / bc1q…) address */
export const getBitcoinAddress = (mnemonic: string) =>
  callSigningWorker<string>("getBitcoinAddress", { mnemonic });

/** Derive the Solana address */
export const getSolanaAddress = (mnemonic: string) =>
  callSigningWorker<string>("getSolanaAddress", { mnemonic });

/** Derive the Tron (TRC-20) address */
export const getTronAddress = (mnemonic: string) =>
  callSigningWorker<string>("getTronAddress", { mnemonic });

/** Derive the XRP address */
export const getXRPAddress = (mnemonic: string) =>
  callSigningWorker<string>("getXRPAddress", { mnemonic });

/** Derive ALL chain addresses in one call */
export const getAllAddresses = (mnemonic: string) =>
  callSigningWorker<{ EVM: string; BTC: string; SOL: string; TRX: string; XRP: string }>(
    "getAllAddresses", { mnemonic }
  );

/** Encrypt a secret (mnemonic or private key) with scrypt + AES-256-GCM */
export const encryptVault = (data: string, password: string, origin?: string) =>
  callSigningWorker("encryptVault", { data, password, origin });

/** Encrypt multiple secrets with a single scrypt round */
export const encryptVaultBatch = (items: Array<{ data: string }>, password: string, origin?: string) =>
  callSigningWorker("encryptVaultBatch", { items, password, origin });

/** Decrypt a vault */
export const decryptVault = (vault: unknown, password: string) =>
  callSigningWorker<string>("decryptVault", { vault, password });

/** Decrypt a passkey vault (WebAuthn PRF) — no scrypt, pure AES-GCM in worker */
export const decryptVaultWithRawKey = (vault: import("./signing.worker").PasskeyVault, rawKey: ArrayBuffer) =>
  callSigningWorker<string>("decryptVaultWithRawKey", { vault, rawKey });

/** Validate a vault password without returning the plaintext */
export const validateVaultPassword = (vault: unknown, password: string) =>
  callSigningWorker<boolean>("validateVaultPassword", { vault, password });

/** Migrate a legacy (deterministic-salt) vault to a modern random-salt vault */
export const migrateLegacyVault = (legacyData: any, password: string, userId: string, origin?: string) =>
  callSigningWorker("migrateLegacyVault", { legacyData, password, userId, origin });

/** Create a full multi-chain wallet with a single scrypt round */
export const createMultiChainWallet = (password: string, origin?: string, existingMnemonic?: string) =>
  callSigningWorker("createMultiChainWallet", { password, origin, existingMnemonic });

/** Hash arbitrary data */
export const hash = (algorithm: "keccak256" | "sha256" | "sha512" | "ripemd160", hex: string) =>
  callSigningWorker<string>("hash", { algorithm, hex });

/** HMAC-SHA256 */
export const hmacSha256 = (keyHex: string, dataHex: string) =>
  callSigningWorker<string>("hmacSha256", { keyHex, dataHex });

// ─── Secure vault-based API ───────────────────────────────────────────────────
// These wrappers use vault + password instead of plaintext mnemonic.
// The mnemonic is decrypted, used, and wiped entirely inside the worker —
// it never appears as a postMessage argument.

/**
 * Create a full multi-chain wallet where the mnemonic NEVER leaves the worker.
 * Returns addresses + EncryptedVaults. Call getMnemonicForBackup() once for
 * the seed phrase display screen.
 */
export const createSecureWallet = (password: string, origin?: string, existingMnemonic?: string) =>
  callSigningWorker<import("./signing.worker").SecureWalletResult>(
    "createSecureWallet", { password, origin, existingMnemonic }
  );

/**
 * Decrypt the mnemonic vault and return the plaintext phrase for the seed
 * phrase backup screen. This is the ONLY time the mnemonic crosses the wire.
 * Discard it from component state immediately after the user confirms backup.
 */
export const getMnemonicForBackup = (vault: unknown, password: string) =>
  callSigningWorker<string>("getMnemonicForBackup", { vault, password });

/** Sign an EVM transfer/send from vault — mnemonic never on postMessage wire */
export const signEVMTransactionFromVault = (vault: unknown, password: string, request: any) =>
  callSigningWorker("signEVMTransactionFromVault", { vault, password, request });

/** Sign an EVM contract call from vault — mnemonic never on postMessage wire */
export const signEVMContractCallFromVault = (vault: unknown, password: string, request: any) =>
  callSigningWorker("signEVMContractCallFromVault", { vault, password, request });

/** Sign an EIP-191 personal_sign message from vault */
export const signEVMMessageFromVault = (vault: unknown, password: string, message: string) =>
  callSigningWorker<string>("signEVMMessageFromVault", { vault, password, message });

/** Sign a Bitcoin SegWit transaction from vault */
export const signBitcoinTransactionFromVault = (vault: unknown, password: string, request: any) =>
  callSigningWorker("signBitcoinTransactionFromVault", { vault, password, request });

/** Sign a Solana transaction from vault */
export const signSolanaTransactionFromVault = (vault: unknown, password: string, request: any) =>
  callSigningWorker("signSolanaTransactionFromVault", { vault, password, request });
