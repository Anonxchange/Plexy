import {
  prepareEVMTransferIntent,
  signEVMTransactionFromVault,
  prepareSolanaTransferIntent,
  signSolanaTransactionFromVault,
  prepareSplTokenTransferIntent,
  signSplTokenTransactionFromVault,
} from '@/hooks/use-signing-worker';
import { broadcastEVMTransaction, TOKEN_CONTRACTS } from './evmSigner';
import { broadcastSolanaTransaction } from './solanaSigner';

// evmSigner.ts exports TOKEN_CONTRACTS (a plain Record) but no
// "EVMTransactionRequest" type — that type doesn't exist there. The worker's
// currency key is just "one of TOKEN_CONTRACTS' keys, or a native chain key",
// so that's what's typed here instead of importing something that isn't exported.
type EVMCurrency = keyof typeof TOKEN_CONTRACTS | 'ETH' | 'BSC' | 'ARB' | 'AVAX';

// NOTE ON THIS REWRITE — read before changing the prepare/sign pairs below:
//
// The signing worker requires a two-step prepare -> sign flow for every
// chain (see signing.worker.ts's assertIntentDigest / consumeApproval). The
// previous version of this file called sign*FromVault directly with a
// hand-built request object; against the current worker that throws
// immediately ("... requires a prepared approval" / "approval digest
// mismatch"), because no prior prepare call had established an approved
// intent. Every branch below now does prepare, then passes prepare's own
// `signRequest` straight through to sign — don't reconstruct that object by
// hand, since the sign step's approval check requires it to match exactly
// what was resolved during prepare.
//
// This also means getLatestBlockhash / getUserTokenAccount (previously
// imported from ./solanaSigner) are no longer needed here: prepareSolanaTransferIntent
// fetches a fresh blockhash itself, and prepareSplTokenTransferIntent derives
// and verifies both the sender's and recipient's Associated Token Accounts
// on-chain inside the worker. Doing that work twice, in two places, is
// exactly how it would eventually drift out of sync with what the worker
// actually checks — so it's removed here rather than kept "just in case."
//
// accessToken: prepare/sign calls that touch the chain-gateway need a
// Supabase access token. That's handled centrally by use-signing-worker.ts's
// callSigningWorker (see setAccessTokenProvider there) — nothing here needs
// to fetch or pass one explicitly.

const EXPLORER_BASE: Record<string, string> = {
  ETH: 'https://etherscan.io/tx',
  BSC: 'https://bscscan.com/tx',
  BNB: 'https://bscscan.com/tx',
  ARB: 'https://arbiscan.io/tx',
  SOL: 'https://solscan.io/tx',
};

// Map well-known coin+network combos to the static token-contract keys that
// signing.worker.ts's TOKEN_CONTRACTS actually recognizes.
const STATIC_CURRENCY_MAP: Record<string, EVMCurrency> = {
  'USDT_ETH': 'USDT_ETH', 'USDC_ETH': 'USDC_ETH',
  'USDT_BSC': 'USDT_BSC', 'USDC_BSC': 'USDC_BSC',
  'USDT_BNB': 'USDT_BSC', 'USDC_BNB': 'USDC_BSC',
  'USDT_ARB': 'USDT_ARB', 'USDC_ARB': 'USDC_ARB', 'USDCE_ARB': 'USDCE_ARB',
};

export interface DepositBroadcastParams {
  coin: string;
  network: string;
  amount: string;
  /** Encrypted wallet vault blob — mnemonic is decrypted inside the worker, never on the main thread. */
  vault: unknown;
  /** Wallet password used to decrypt the vault. */
  password: string;
  depositAddress: string;
  walletAddress: string;
  // On-chain metadata from the AsterDEX asset list. Currently informational
  // only for EVM tokens — see the removed "dynamic contract" path below for
  // why this isn't wired to an arbitrary-token signing path anymore.
  contractAddress?: string;
  decimals?: number;
  isNative?: boolean;
}

export interface DepositBroadcastResult {
  txHash: string;
  explorerUrl: string;
}

export async function broadcastDeposit({
  coin,
  network,
  amount,
  vault,
  password,
  depositAddress,
  walletAddress,
  contractAddress,
  decimals,
  isNative,
}: DepositBroadcastParams): Promise<DepositBroadcastResult> {
  if (!amount || Number(amount) <= 0) {
    throw new Error('Enter an amount to deposit first.');
  }

  if (network === 'SOL') {
    return broadcastSolDeposit({ coin, amount, vault, password, depositAddress });
  }

  return broadcastEvmDeposit({ coin, network, amount, vault, password, depositAddress, contractAddress, decimals, isNative });
}

async function broadcastEvmDeposit({
  coin, network, amount, vault, password, depositAddress, contractAddress, decimals, isNative,
}: Omit<DepositBroadcastParams, 'walletAddress'>): Promise<DepositBroadcastResult> {
  const chainKey = network.toUpperCase();

  // REMOVED: the previous "dynamic contract" fast path mutated the shared,
  // module-level TOKEN_CONTRACTS map at runtime (`TOKEN_CONTRACTS[tempKey] =
  // {...}; ... delete TOKEN_CONTRACTS[tempKey];`) to let the worker sign a
  // transfer for whatever ERC-20 contract the AsterDEX API happened to
  // return, for any coin not in the static table. Two real problems with
  // that, on top of each other:
  //
  //   1. Race condition: TOKEN_CONTRACTS is shared, mutable, module-level
  //      state. Two concurrent deposits for two different dynamic tokens can
  //      interleave and stomp on each other's temporary entry — the same
  //      class of bug as the currentAccessToken race fixed earlier in
  //      signing.worker.ts, just on the caller's side this time.
  //   2. Trust: it signs a transfer to whatever contract address + decimals
  //      the API response says, with no independent verification — the exact
  //      "unsafe generic signer" shape this whole rewrite has been avoiding
  //      for SPL/TRC-20. A compromised or buggy API response naming the
  //      wrong contract, or the right contract with the wrong decimals,
  //      would move real funds to the wrong place or for the wrong amount,
  //      with nothing in this codebase double-checking it first.
  //
  // Every token this app can send now goes through signing.worker.ts's own
  // hardcoded, individually-verified TOKEN_CONTRACTS table (see
  // STATIC_CURRENCY_MAP below) or is declined with a manual-send message.
  // If you need to support arbitrary API-supplied ERC-20 contracts, that's a
  // real feature — it means teaching the worker to accept a contract address
  // + decimals directly and deciding what verification is enough (comparable
  // in spirit to how BTC UTXOs are checked against the network before
  // signing) — not re-adding a mutable shared map as a workaround.
  void contractAddress;
  void decimals;

  // Native coin (BNB, ETH, etc.) — no token contract needed.
  if (isNative) {
    const nativeCurrencyMap: Record<string, EVMCurrency> = {
      BSC: 'BSC', BNB: 'BSC', ETH: 'ETH', ARB: 'ARB',
    };
    const nativeCurrency = nativeCurrencyMap[chainKey];
    if (!nativeCurrency) {
      throw new Error(`Native deposits on ${network} are not yet supported. Copy the address and send manually.`);
    }
    const prepared = await prepareEVMTransferIntent(vault, password, {
      to: depositAddress,
      amount,
      currency: nativeCurrency,
    });
    const result = await signEVMTransactionFromVault(vault, password, prepared.signRequest) as any;
    // broadcastEVMTransaction(chain, signedTxHex) — was called with the
    // arguments reversed, which would throw immediately since chainKey
    // ("ETH"/"BSC"/...) doesn't start with "0x".
    await broadcastEVMTransaction(chainKey, result.signedTx);
    return {
      txHash: result.txHash,
      explorerUrl: `${EXPLORER_BASE[chainKey] ?? EXPLORER_BASE.ETH}/${result.txHash}`,
    };
  }

  // Static lookup table for the tokens the worker actually knows how to sign.
  const staticKey = `${coin.toUpperCase()}_${chainKey}`;
  const currency = STATIC_CURRENCY_MAP[staticKey];
  if (currency) {
    const prepared = await prepareEVMTransferIntent(vault, password, { to: depositAddress, amount, currency });
    const result = await signEVMTransactionFromVault(vault, password, prepared.signRequest) as any;
    await broadcastEVMTransaction(chainKey, result.signedTx);
    return { txHash: result.txHash, explorerUrl: `${EXPLORER_BASE[chainKey] ?? EXPLORER_BASE.ETH}/${result.txHash}` };
  }

  throw new Error(
    `Direct wallet deposit is not yet supported for ${coin} on ${network}. Copy the address above and send manually.`
  );
}

async function broadcastSolDeposit({
  coin, amount, vault, password, depositAddress,
}: Omit<DepositBroadcastParams, 'network' | 'walletAddress' | 'contractAddress' | 'decimals'>): Promise<DepositBroadcastResult> {
  if (coin.toUpperCase() === 'SOL') {
    // Vault-based: mnemonic decrypted, derived, and wiped entirely inside the
    // worker — it never appears on the main thread or in any postMessage arg.
    // prepareSolanaTransferIntent fetches its own fresh blockhash; no need to
    // do that here first.
    const prepared = await prepareSolanaTransferIntent(vault, password, {
      to: depositAddress,
      amount,
      currency: 'SOL',
    });
    const result = await signSolanaTransactionFromVault(vault, password, prepared.signRequest) as any;
    // broadcastSolanaTransaction returns { signature }, not a bare string.
    const { signature } = await broadcastSolanaTransaction(result.signedTx);
    return { txHash: signature, explorerUrl: `${EXPLORER_BASE.SOL}/${signature}` };
  }

  // SPL token path (USDC/USDT only — the worker's SPL_TOKENS table). The
  // worker derives and verifies both the sender's and recipient's Associated
  // Token Accounts on-chain itself; if the recipient has no token account
  // for this mint yet, prepare throws a clear error rather than silently
  // trying to create one (see signing.worker.ts's scope note on this).
  const symbol = coin.toUpperCase();
  const currency = symbol === 'USDC' ? 'USDC_SOL' : symbol === 'USDT' ? 'USDT_SOL' : null;
  if (!currency) {
    throw new Error(
      `Direct wallet deposit is not yet supported for ${coin} on Solana. Copy the address above and send manually.`
    );
  }

  const prepared = await prepareSplTokenTransferIntent(vault, password, {
    to: depositAddress,
    amount,
    currency,
  });
  const result = await signSplTokenTransactionFromVault(vault, password, prepared.signRequest) as any;
  const { signature } = await broadcastSolanaTransaction(result.signedTx);
  return { txHash: signature, explorerUrl: `${EXPLORER_BASE.SOL}/${signature}` };
}
