import * as RLP from "@ethereumjs/rlp";
import { mnemonicToSeed } from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import { wipeBytes, wipeHDKey } from "./secureMemory";

// @noble/secp256k1 v3.x: signAsync() default format is 'compact' (raw Uint8Array),
// NOT a Signature object — so sig.r / sig.s are undefined in that mode.
// Always pass { format: 'recovered', prehash: false }:
//   format:'recovered' → 65-byte [recovery, r[32], s[32]] Uint8Array with recovery byte
//   prehash:false      → callers supply already-keccak256-hashed data; skip internal SHA-256

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

export const CHAIN_CONFIGS: Record<string, { rpcUrl: string; rpcFallbacks?: string[]; chainId: number; symbol: string }> = {
  ETH: {
    rpcUrl: "https://ethereum.publicnode.com",
    rpcFallbacks: ["https://eth.drpc.org", "https://1rpc.io/eth", "https://gateway.tenderly.co/public/mainnet"],
    chainId: 1, symbol: "ETH",
  },
  BSC: {
    rpcUrl: "https://bsc-dataseed.binance.org",
    rpcFallbacks: ["https://bsc-dataseed1.defibit.io", "https://bsc-dataseed2.defibit.io", "https://bsc.drpc.org", "https://bsc.publicnode.com"],
    chainId: 56, symbol: "BNB",
  },
  BNB: {
    rpcUrl: "https://bsc-dataseed.binance.org",
    rpcFallbacks: ["https://bsc-dataseed1.defibit.io", "https://bsc-dataseed2.defibit.io", "https://bsc.drpc.org", "https://bsc.publicnode.com"],
    chainId: 56, symbol: "BNB",
  },
  ARB: {
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    rpcFallbacks: ["https://arbitrum.drpc.org", "https://arbitrum-one.publicnode.com"],
    chainId: 42161, symbol: "ETH",
  },
  POL: {
    rpcUrl: "https://polygon.publicnode.com",
    rpcFallbacks: ["https://polygon.drpc.org", "https://1rpc.io/matic", "https://gateway.tenderly.co/public/polygon"],
    chainId: 137, symbol: "POL",
  },
  MATIC: {
    rpcUrl: "https://polygon.publicnode.com",
    rpcFallbacks: ["https://polygon.drpc.org", "https://1rpc.io/matic", "https://gateway.tenderly.co/public/polygon"],
    chainId: 137, symbol: "POL",
  },
};

export const TOKEN_CONTRACTS: Record<string, { address: string; decimals: number }> = {
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

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface EVMTransactionRequest {
  to: string;
  amount: string;
  currency:
    | "ETH" | "BSC" | "BNB" | "ARB"
    | "USDT_ETH" | "USDC_ETH"
    | "USDT_BSC" | "USDC_BSC"
    | "USDT_BNB" | "USDC_BNB"
    | "USDT_ARB" | "USDC_ARB" | "USDCE_ARB";
  gasPrice?: string;
  gasLimit?: string;
  nonce?: number;
}

export interface SignedEVMTransaction {
  signedTx: string;
  txHash: string;
  from: string;
  to: string;
  value: string;
  currency: string;
}

/* -------------------------------------------------------------------------- */
/*                               HELPER FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

function toHex(bytes: Uint8Array): string {
  return "0x" + bytesToHex(bytes);
}

const RPC_TIMEOUT_MS = 10_000;

async function rpcCallOnce(url: string, method: string, params: any[]): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message ?? "RPC error");
    return json.result;
  } finally {
    clearTimeout(timer);
  }
}

// Tries the primary RPC, then each fallback in order.
// Surfaces a clear, user-facing message instead of the raw browser "Load failed".
async function rpcCall(rpcUrl: string, method: string, params: any[], fallbacks: string[] = []): Promise<any> {
  const urls = [rpcUrl, ...fallbacks];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      return await rpcCallOnce(url, method, params);
    } catch (err) {
      lastErr = err;
    }
  }
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`Network error — could not reach the blockchain node. Check your connection and try again. (${msg})`);
}

async function derivePrivateKey(mnemonic: string) {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/44'/60'/0'/0/0");
  // Copy the private key bytes into a fresh buffer BEFORE wiping the HDKey.
  // child.privateKey is a reference into the HDKey's internal buffer; calling
  // wipeHDKey(child) zeroes that buffer in place, so we must snapshot it first.
  const priv = child.privateKey!.slice();
  wipeBytes(seed);
  wipeHDKey(root);
  wipeHDKey(child);
  return priv;
}

/**
 * Derives the EVM private key from a mnemonic (m/44'/60'/0'/0/0).
 * Call once and reuse the key for multiple signing operations to avoid
 * repeated PBKDF2 (mnemonicToSeed) which takes 2-5 s in the browser.
 * CALLER MUST wipeBytes(key) after use.
 */
export async function deriveEVMPrivateKey(mnemonic: string): Promise<Uint8Array> {
  return derivePrivateKey(mnemonic);
}

/**
 * Signs an Ethereum personal_sign message with a pre-derived private key.
 * Use this instead of signEVMMessage when you already have the key in memory.
 */
export async function signEVMMessageWithKey(privKey: Uint8Array, message: string): Promise<string> {
  // FIX: must use byte-length (not JS character count) for the EIP-191 prefix.
  // For multi-byte Unicode (emoji, CJK, etc.) message.length !== encoded byte count,
  // producing a hash no standard wallet verifier can reproduce.
  const msgBytes = new TextEncoder().encode(message);
  const prefix = `\x19Ethereum Signed Message:\n${msgBytes.byteLength}`;
  const prefixBytes = new TextEncoder().encode(prefix);
  const combined = new Uint8Array(prefixBytes.length + msgBytes.length);
  combined.set(prefixBytes);
  combined.set(msgBytes, prefixBytes.length);
  const msgHash = keccak_256(combined);
  const sigBytes = await secp.signAsync(msgHash, privKey, { lowS: true, format: 'recovered', prehash: false } as any);
  const recovery = sigBytes[0];
  const r = bytesToHex(sigBytes.slice(1, 33));
  const s = bytesToHex(sigBytes.slice(33, 65));
  const v = (27 + recovery).toString(16).padStart(2, "0");
  return "0x" + r + s + v;
}

async function deriveAddress(mnemonic: string) {
  const priv = await derivePrivateKey(mnemonic);
  try {
    const pub = secp.getPublicKey(priv, false);
    const hash = keccak_256(pub.slice(1));
    return "0x" + bytesToHex(hash.slice(-20));
  } finally {
    wipeBytes(priv);
  }
}

/**
 * Parses a decimal amount string into a bigint with `decimals` precision.
 * Avoids IEEE 754 float arithmetic which loses precision for large token amounts
 * (e.g. "1234567.89" * 10**18 overflows 53-bit mantissa).
 */
function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const fracPadded = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(fracPadded || "0");
}

function encodeERC20Transfer(to: string, amount: bigint) {
  const methodId = keccak_256(new TextEncoder().encode("transfer(address,uint256)")).slice(0, 4);
  const paddedTo = to.toLowerCase().replace("0x", "").padStart(64, "0");
  const paddedAmount = amount.toString(16).padStart(64, "0");
  return "0x" + bytesToHex(methodId) + paddedTo + paddedAmount;
}

/* -------------------------------------------------------------------------- */
/*                               BALANCE CHECK                                */
/* -------------------------------------------------------------------------- */

export async function getEVMBalance(
  mnemonic: string,
  currency: string
): Promise<string> {
  const address = await deriveAddress(mnemonic);
  const config = CHAIN_CONFIGS[currency] || CHAIN_CONFIGS["ETH"];

  const tokenEntry = TOKEN_CONTRACTS[currency];
  if (tokenEntry) {
    const data = "0x70a08231" + address.replace("0x", "").padStart(64, "0");
    const result = await rpcCall(config.rpcUrl, "eth_call", [{ to: tokenEntry.address, data }, "latest"], config.rpcFallbacks);
    return (BigInt(result) / BigInt(10 ** tokenEntry.decimals)).toString();
  }

  const balance = await rpcCall(config.rpcUrl, "eth_getBalance", [address, "latest"], config.rpcFallbacks);
  return (BigInt(balance) / BigInt(1e18)).toString();
}

/* -------------------------------------------------------------------------- */
/*                            TRANSACTION SIGNING                             */
/* -------------------------------------------------------------------------- */

export async function signEVMTransaction(
  mnemonic: string,
  request: EVMTransactionRequest
): Promise<SignedEVMTransaction> {
  const privKey = await derivePrivateKey(mnemonic);
  try {
  const from = await deriveAddress(mnemonic);
  const baseChain = request.currency.split("_")[0];
  const config = CHAIN_CONFIGS[baseChain] || CHAIN_CONFIGS["ETH"];

  const nonce = request.nonce ??
    parseInt(await rpcCall(config.rpcUrl, "eth_getTransactionCount", [from, "pending"], config.rpcFallbacks), 16);

  const gasPrice = BigInt(request.gasPrice ?? await rpcCall(config.rpcUrl, "eth_gasPrice", [], config.rpcFallbacks));

  let gasLimit = request.gasLimit ? BigInt(request.gasLimit) : BigInt(21000);

  let to = request.to;
  let value = BigInt(0);
  let data = "0x";

  // If the currency key exists in TOKEN_CONTRACTS it's an ERC-20 token,
  // regardless of naming convention (handles dynamically injected keys too).
  const tokenEntry = TOKEN_CONTRACTS[request.currency];
  if (tokenEntry) {
    const amount = parseTokenAmount(request.amount, tokenEntry.decimals);
    data = encodeERC20Transfer(request.to, amount);
    to = tokenEntry.address;
    gasLimit = BigInt(60000); // Default ERC20 gas
    value = BigInt(0);
  } else {
    value = parseTokenAmount(request.amount, 18);
  }

  const tx = [nonce, gasPrice, gasLimit, to, value, data, config.chainId, BigInt(0), BigInt(0)];
  const encoded = RLP.encode(tx);
  const hash = keccak_256(encoded);

  const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: 'recovered', prehash: false } as any);
  const recovery = sigBytes[0];
  const v = BigInt(config.chainId * 2 + 35 + recovery);
  const r = BigInt('0x' + bytesToHex(sigBytes.slice(1, 33)));
  const s = BigInt('0x' + bytesToHex(sigBytes.slice(33, 65)));

  const signedTx = RLP.encode([nonce, gasPrice, gasLimit, to, value, data, v, r, s]);
  const txHash = "0x" + bytesToHex(keccak_256(signedTx));

  return {
    signedTx: "0x" + bytesToHex(signedTx),
    txHash,
    from,
    to: request.to,
    value: request.amount,
    currency: request.currency
  };
  } finally {
    wipeBytes(privKey);
  }
}

/* -------------------------------------------------------------------------- */
/*                          GENERIC CONTRACT-CALL SIGNER                      */
/* -------------------------------------------------------------------------- */

export interface ContractCallRequest {
  /** Chain key in CHAIN_CONFIGS — e.g. "ETH", "BSC", "POL", "ARB". */
  chain: string;
  /** Target contract address (0x…). */
  to: string;
  /** Hex-encoded calldata (0x…). Use the encoders in `lib/staking.ts`. */
  data: string;
  /** Native value in wei as decimal string (e.g. "1000000000000000000" = 1 ETH). */
  valueWei?: string;
  /** Optional explicit gas limit. If omitted, eth_estimateGas is used. */
  gasLimit?: string;
  /** Optional explicit gas price. If omitted, eth_gasPrice is used. */
  gasPrice?: string;
  /** Optional nonce override. */
  nonce?: number;
}

/**
 * Signs (legacy / EIP-155) a generic contract call from the wallet derived
 * from `mnemonic`. Estimates gas via eth_estimateGas (with a 25% safety
 * buffer) when no gasLimit is provided. Returns the signed raw tx + hash so
 * the caller can broadcast it with `broadcastEVMTransaction(signedTx, chain)`.
 */
export async function signEVMContractCall(
  mnemonic: string,
  request: ContractCallRequest
): Promise<{ signedTx: string; txHash: string; from: string }> {
  const privKey = await derivePrivateKey(mnemonic);
  try {
    const from = await deriveAddress(mnemonic);
    const config = CHAIN_CONFIGS[request.chain.toUpperCase()] || CHAIN_CONFIGS.ETH;

    const nonce = request.nonce ??
      parseInt(await rpcCall(config.rpcUrl, "eth_getTransactionCount", [from, "pending"], config.rpcFallbacks), 16);
    const gasPrice = BigInt(request.gasPrice ?? await rpcCall(config.rpcUrl, "eth_gasPrice", [], config.rpcFallbacks));
    const valueWei = BigInt(request.valueWei ?? "0");

    let gasLimit: bigint;
    if (request.gasLimit) {
      gasLimit = BigInt(request.gasLimit);
    } else {
      const est = await rpcCall(config.rpcUrl, "eth_estimateGas", [
        { from, to: request.to, value: "0x" + valueWei.toString(16), data: request.data },
      ], config.rpcFallbacks);
      // 25% safety buffer; floor 60_000.
      gasLimit = (BigInt(est) * 125n) / 100n;
      if (gasLimit < 60_000n) gasLimit = 60_000n;
    }

    const tx = [nonce, gasPrice, gasLimit, request.to, valueWei, request.data, config.chainId, BigInt(0), BigInt(0)];
    const encoded = RLP.encode(tx);
    const hash = keccak_256(encoded);

    const sigBytes = await secp.signAsync(hash, privKey, { lowS: true, format: 'recovered', prehash: false } as any);
    const recovery = sigBytes[0];
    const v = BigInt(config.chainId * 2 + 35 + recovery);
    const r = BigInt('0x' + bytesToHex(sigBytes.slice(1, 33)));
    const s = BigInt('0x' + bytesToHex(sigBytes.slice(33, 65)));

    const signedTx = RLP.encode([nonce, gasPrice, gasLimit, request.to, valueWei, request.data, v, r, s]);
    const txHash = "0x" + bytesToHex(keccak_256(signedTx));

    return { signedTx: "0x" + bytesToHex(signedTx), txHash, from };
  } finally {
    wipeBytes(privKey);
  }
}

/* -------------------------------------------------------------------------- */
/*                                 BROADCAST                                  */
/* -------------------------------------------------------------------------- */

export async function broadcastEVMTransaction(
  signedTx: string,
  chain: string
): Promise<string> {
  const config = CHAIN_CONFIGS[chain] || CHAIN_CONFIGS["ETH"];
  return await rpcCall(config.rpcUrl, "eth_sendRawTransaction", [signedTx], config.rpcFallbacks);
}

/* -------------------------------------------------------------------------- */
/*                               MESSAGE SIGNING                              */
/* -------------------------------------------------------------------------- */

export async function signEVMMessage(
  mnemonic: string,
  message: string
): Promise<string> {
  const priv = await derivePrivateKey(mnemonic);
  try {
    const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
    const msgHash = keccak_256(new TextEncoder().encode(prefix + message));
    const sigBytes = await secp.signAsync(msgHash, priv, { lowS: true, format: 'recovered', prehash: false } as any);
    const recovery = sigBytes[0];
    const r = bytesToHex(sigBytes.slice(1, 33));
    const s = bytesToHex(sigBytes.slice(33, 65));
    const v = (27 + recovery).toString(16).padStart(2, "0");
    return "0x" + r + s + v;
  } finally {
    wipeBytes(priv);
  }
}

/* -------------------------------------------------------------------------- */
/*                               ADDRESS EXPORT                               */
/* -------------------------------------------------------------------------- */

export async function getEVMAddress(mnemonic: string): Promise<string> {
  return deriveAddress(mnemonic);
}
