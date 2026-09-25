import { prepareEVMContractIntent, signEVMContractCallFromVault } from '@/hook/use-signing-worker';
import { rpcUrlFor, type SendTx } from '@/lib/rocketx-dex';

/**
 * Signs RocketX DEX swap transactions entirely inside the isolated signing
 * worker (see signing.worker.ts) instead of via `ethers` on the main thread.
 * The private key is derived, used to sign, and wiped INSIDE the Worker —
 * it never crosses the postMessage boundary or exists in this file's scope.
 * This also removes the `ethers` dependency that was breaking the build
 * (Rolldown couldn't resolve it — most likely a missing/out-of-sync
 * package.json + lockfile entry).
 *
 * Signing and broadcasting are two separate steps here (unlike ethers'
 * signer.sendTransaction(), which does both at once): the worker only
 * returns a signed raw tx; this function broadcasts it via eth_sendRawTransaction.
 *
 * ⚠️ TODO — verify before shipping:
 * 1. `wallet.vault` below assumes the wallet row's encrypted-key field is
 *    named `vault` (an EncryptedVault blob, per signing.worker.ts), matching
 *    the vault-based API this file now calls. The OLD code read
 *    `wallet.encryptedPrivateKey`. If your non-custodial-wallet.ts still
 *    names the field `encryptedPrivateKey` (just holding a vault blob under
 *    the old name) or something else entirely, fix the `vault` line below.
 * 2. The old code's `userId` param fed into a server-side brute-force
 *    lockout (`runWithUnlockGate`, per use-signing-worker.ts's comments)
 *    via `decryptPrivateKey(..., userId)`. That call is gone now since we
 *    never decrypt on the main thread — so unless prepareEVMContractIntent /
 *    signEVMContractCallFromVault are ALREADY wrapped in that same gate
 *    somewhere upstream, wrong-password attempts here are no longer
 *    rate-limited. Confirm with non-custodial-wallet.ts before shipping;
 *    `userId` is kept in this signature so it's ready to wire into a gate.
 * 3. CHAIN_CONFIGS in signing.worker.ts currently only defines ETH, BSC/BNB,
 *    ARB, POL/MATIC, AVAX. Base (0x2105) and Optimism (0xa) are NOT in there
 *    yet — a swap routed through either will fail at prepareEVMContractIntent
 *    with "Unsupported EVM chain" until they're added to the worker.
 */

// Hex chain ID -> the chain key signing.worker.ts's CHAIN_CONFIGS expects.
// Keep in sync with that file's CHAIN_CONFIGS keys.
const HEX_CHAIN_TO_WORKER_KEY: Record<string, string> = {
  '0x1': 'ETH',
  '0x38': 'BSC',
  '0xa4b1': 'ARB',
  '0x89': 'POL',
  '0xa86a': 'AVAX',
};

function workerChainKey(chainIdHex: string): string {
  const key = HEX_CHAIN_TO_WORKER_KEY[chainIdHex.toLowerCase()];
  if (!key) {
    throw new Error(`Unsupported EVM chain for signing: ${chainIdHex} (add it to HEX_CHAIN_TO_WORKER_KEY and to signing.worker.ts's CHAIN_CONFIGS)`);
  }
  return key;
}

/** Builds a `sendTx` that signs with the user's key on the route's source chain, via the signing worker. Scope it to a single swap. */
export async function createEvmTxSender(
  wallet: any,
  password: string,
  chainIdHex: string,
  userId: string
): Promise<SendTx> {
  const chain = workerChainKey(chainIdHex);

  // See TODO #1 above — confirm this field name against non-custodial-wallet.ts.
  const vault = wallet.vault ?? wallet.encryptedVault ?? wallet.encryptedPrivateKey;
  if (!vault) throw new Error('Wallet has no encrypted vault to sign with.');

  return async (tx) => {
    // Step 1: prepare — resolves nonce/gas/fees, returns a single-use
    // approvalDigest baked into signRequest. Must be passed straight through
    // to the sign call below, unmodified.
    const prepared: any = await prepareEVMContractIntent(vault, password, {
      chain,
      to: tx.to,
      data: tx.data,
      // valueWei must be a plain decimal string; RocketX's tx.value is hex.
      valueWei: tx.value ? BigInt(tx.value).toString() : '0',
      // gasLimit accepts hex or decimal (worker does BigInt(raw) internally).
      ...(tx.gas ? { gasLimit: String(tx.gas) } : {}),
    });

    // Safety: never sign/broadcast with a key that doesn't belong to the
    // address RocketX is quoting for.
    if (String(prepared.from).toLowerCase() !== String(wallet.address).toLowerCase()) {
      throw new Error('Decrypted key does not match the wallet address.');
    }

    // Step 2: sign — private key is derived + used + wiped inside the worker.
    // Only the signed raw tx crosses back over postMessage.
    const signed: any = await signEVMContractCallFromVault(vault, password, prepared.signRequest);

    // Step 3: broadcast — the worker only signs, so this is the one step
    // that still runs here on the main thread.
    const res = await fetch(rpcUrlFor(chainIdHex), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: [signed.signedTx] }),
    });
    const body = await res.json();
    if (body.error) throw new Error(body.error.message || 'Broadcast failed');
    return body.result ?? signed.txHash;
  };
}
