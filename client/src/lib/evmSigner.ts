import * as RLP from "@ethereumjs/rlp";
import { mnemonicToSeed } from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";

// noble-secp256k1 v2+ needs to be told which hash function to use for HMAC-SHA256
(secp.etc as any).hmacSha256Sync = (k: any, ...m: any[]) => (hmac as any)(sha256, k, ...m);

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

export const CHAIN_CONFIGS: Record<string, { rpcUrl: string; chainId: number; symbol: string }> = {
  ETH: { rpcUrl: "https://eth.llamarpc.com", chainId: 1, symbol: "ETH" },
  BSC: { rpcUrl: "https://binance.llamarpc.com", chainId: 56, symbol: "BNB" },
  BNB: { rpcUrl: "https://binance.llamarpc.com", chainId: 56, symbol: "BNB" }
};

export const TOKEN_CONTRACTS: Record<string, { address: string; decimals: number }> = {
  USDT_ETH: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  USDC_ETH: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  USDT_BSC: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
  USDC_BSC: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
  USDT_BNB: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
  USDC_BNB: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 }
};

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface EVMTransactionRequest {
  to: string;
  amount: string;
  currency:
    | "ETH" | "BSC" | "BNB"
    | "USDT_ETH" | "USDC_ETH"
    | "USDT_BSC" | "USDC_BSC"
    | "USDT_BNB" | "USDC_BNB";
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

async function rpcCall(rpcUrl: string, method: string, params: any[]) {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  const json = await res.json();
  return json.result;
}

async function derivePrivateKey(mnemonic: string) {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/44'/60'/0'/0/0");
  return child.privateKey!;
}

async function deriveAddress(mnemonic: string) {
  const priv = await derivePrivateKey(mnemonic);
  const pub = secp.getPublicKey(priv, false);
  const hash = keccak_256(pub.slice(1));
  return "0x" + bytesToHex(hash.slice(-20));
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

  if (currency.includes("USDT") || currency.includes("USDC")) {
    const token = TOKEN_CONTRACTS[currency];
    const data = "0x70a08231" + address.replace("0x", "").padStart(64, "0");
    const result = await rpcCall(config.rpcUrl, "eth_call", [{ to: token.address, data }, "latest"]);
    return (BigInt(result) / BigInt(10 ** token.decimals)).toString();
  }

  const balance = await rpcCall(config.rpcUrl, "eth_getBalance", [address, "latest"]);
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
  const from = await deriveAddress(mnemonic);
  const baseChain = request.currency.split("_")[0];
  const config = CHAIN_CONFIGS[baseChain] || CHAIN_CONFIGS["ETH"];

  const nonce = request.nonce ??
    parseInt(await rpcCall(config.rpcUrl, "eth_getTransactionCount", [from, "pending"]), 16);

  const gasPrice = BigInt(request.gasPrice ?? await rpcCall(config.rpcUrl, "eth_gasPrice", []));

  let gasLimit = request.gasLimit ? BigInt(request.gasLimit) : BigInt(21000);

  let to = request.to;
  let value = BigInt(0);
  let data = "0x";

  if (request.currency.includes("USDT") || request.currency.includes("USDC")) {
    const token = TOKEN_CONTRACTS[request.currency];
    const amount = BigInt(Math.floor(Number(request.amount) * 10 ** token.decimals));
    data = encodeERC20Transfer(request.to, amount);
    to = token.address;
    gasLimit = BigInt(60000); // Default ERC20 gas
    value = BigInt(0);
  } else {
    value = BigInt(Math.floor(Number(request.amount) * 1e18));
  }

  const tx = [nonce, gasPrice, gasLimit, to, value, data, config.chainId, BigInt(0), BigInt(0)];
  const encoded = RLP.encode(tx);
  const hash = keccak_256(encoded);

  const signature = await secp.sign(hash, privKey, { recovered: true });
  const [sig, recovery] = (signature as any);
  const v = BigInt(config.chainId * 2 + 35 + recovery);
  const r = BigInt("0x" + bytesToHex(sig.slice(0, 32)));
  const s = BigInt("0x" + bytesToHex(sig.slice(32, 64)));

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
}

/* -------------------------------------------------------------------------- */
/*                                 BROADCAST                                  */
/* -------------------------------------------------------------------------- */

export async function broadcastEVMTransaction(
  signedTx: string,
  chain: string
): Promise<string> {
  const config = CHAIN_CONFIGS[chain] || CHAIN_CONFIGS["ETH"];
  return await rpcCall(config.rpcUrl, "eth_sendRawTransaction", [signedTx]);
}

/* -------------------------------------------------------------------------- */
/*                               MESSAGE SIGNING                              */
/* -------------------------------------------------------------------------- */

export async function signEVMMessage(
  mnemonic: string,
  message: string
): Promise<string> {
  const priv = await derivePrivateKey(mnemonic);
  const msgHash = keccak_256(
    new TextEncoder().encode(`\x19Ethereum Signed Message:\n${message.length}${message}`)
  );
  const signature = await secp.sign(msgHash, priv);
  return "0x" + bytesToHex((signature as any).toCompactRawBytes());
}

/* -------------------------------------------------------------------------- */
/*                               ADDRESS EXPORT                               */
/* -------------------------------------------------------------------------- */

export async function getEVMAddress(mnemonic: string): Promise<string> {
  return deriveAddress(mnemonic);
}
