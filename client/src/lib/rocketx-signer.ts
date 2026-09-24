import { Wallet, JsonRpcProvider } from 'ethers'; // ethers v6. If you use viem, tell me and I'll swap this file.
import { nonCustodialWalletManager } from '@/lib/non-custodial-wallet';
import { rpcUrlFor, type SendTx } from '@/lib/rocketx-dex';

/**
 * Decrypts the wallet's EVM key via the signing worker (decryptVault).
 * Passing userId routes the attempt through your server-side brute-force unlock gate.
 * All EVM chain rows share one keypair, so any EVM wallet row works for any EVM chain.
 */
async function getEvmPrivateKey(wallet: any, password: string, userId: string): Promise<string> {
  const raw = (await nonCustodialWalletManager.decryptPrivateKey(wallet.encryptedPrivateKey, password, userId)).trim();
  const key = /^0x/i.test(raw) ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error('Unexpected private key format for an EVM wallet.');
  return key;
}

/** Builds a `sendTx` that signs with the user's key on the route's source chain. Scope it to a single swap. */
export async function createEvmTxSender(
  wallet: any,
  password: string,
  chainIdHex: string,
  userId: string
): Promise<SendTx> {
  const key = await getEvmPrivateKey(wallet, password, userId);
  const provider = new JsonRpcProvider(rpcUrlFor(chainIdHex), parseInt(chainIdHex, 16));
  const signer = new Wallet(key, provider);

  // Safety: never sign with a key that doesn't belong to the address RocketX is quoting for.
  if (signer.address.toLowerCase() !== String(wallet.address).toLowerCase()) {
    throw new Error('Decrypted key does not match the wallet address.');
  }

  return async (tx) => {
    const sent = await signer.sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value ? BigInt(tx.value) : 0n,
      ...(tx.gas ? { gasLimit: BigInt(tx.gas) } : {}), // fee pricing is left to the provider (EIP-1559 aware)
    });
    return sent.hash;
  };
}
