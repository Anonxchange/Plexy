import { rocketXApi, type RocketXQuote } from '@/lib/rocketx-api';

/* ------------------------------------------------------------------ *
 *  RocketX DEX flow (EVM):
 *   1. non-native token  -> ensure ERC-20 allowance for quote.allowanceAddress
 *   2. POST /v1/swap     -> returns requestId + `tx` { from, to, data, value, gas, gasPrice }
 *   3. user's wallet signs + broadcasts `tx`  -> on-chain hash
 *   4. GET /v1/status?requestId=…&txId=<hash> until success / failed
 *
 *  NOTE: swap response `txId` is an INTERNAL integer. The `txId` the status API wants
 *  is the ON-CHAIN transaction hash from step 3.
 * ------------------------------------------------------------------ */

export type SendTx = (tx: { to: string; data?: string; value?: string; gas?: string }) => Promise<string>;

// Public RPCs as defaults. For production set VITE_RPC_<decimalChainId> (e.g. VITE_RPC_1, VITE_RPC_56) to your own provider.
const DEFAULT_RPC: Record<string, string> = {
  '0x1': 'https://cloudflare-eth.com',
  '0x38': 'https://bsc-dataseed.binance.org',
  '0x89': 'https://polygon-rpc.com',
  '0xa4b1': 'https://arb1.arbitrum.io/rpc',
  '0xa': 'https://mainnet.optimism.io',
  '0x2105': 'https://mainnet.base.org',
  '0xa86a': 'https://api.avax.network/ext/bc/C/rpc',
};

export function rpcUrlFor(chainIdHex: string): string {
  const id = chainIdHex.toLowerCase();
  const override = (import.meta as any).env?.[`VITE_RPC_${parseInt(id, 16)}`];
  const url = override || DEFAULT_RPC[id];
  if (!url) throw new Error(`No RPC configured for chain ${chainIdHex}. Set VITE_RPC_${parseInt(id, 16)}.`);
  return url;
}

async function rpc(chainIdHex: string, method: string, params: unknown[]): Promise<any> {
  const res = await fetch(rpcUrlFor(chainIdHex), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await res.json();
  if (j.error) throw new Error(`RPC ${method} failed: ${j.error.message}`);
  return j.result;
}

const pad32 = (hexNoPrefix: string) => hexNoPrefix.toLowerCase().padStart(64, '0');
const strip0x = (h: string) => (h.startsWith('0x') ? h.slice(2) : h);
const normHex = (v?: string) => (!v ? '0x0' : v.startsWith('0x') ? v : `0x${v}`);

/** Decimal amount -> integer base units without float error. */
export function toBaseUnits(amount: number | string, decimals: number): bigint {
  const str = typeof amount === 'number' ? amount.toFixed(Math.min(decimals, 20)) : amount;
  const [whole, frac = ''] = str.split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(fracPadded || '0');
}

async function getAllowance(chainIdHex: string, token: string, owner: string, spender: string): Promise<bigint> {
  const data = '0xdd62ed3e' + pad32(strip0x(owner)) + pad32(strip0x(spender)); // allowance(owner,spender)
  const out = await rpc(chainIdHex, 'eth_call', [{ to: token, data }, 'latest']);
  return BigInt(out && out !== '0x' ? out : '0x0');
}

const approveData = (spender: string, amount: bigint) =>
  '0x095ea7b3' + pad32(strip0x(spender)) + pad32(amount.toString(16)); // approve(spender,amount)

async function waitForReceipt(chainIdHex: string, hash: string, timeoutMs = 180_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await rpc(chainIdHex, 'eth_getTransactionReceipt', [hash]);
    if (r) {
      if (r.status === '0x1') return;
      throw new Error('Approval transaction reverted on-chain.');
    }
    await new Promise((res) => setTimeout(res, 3000));
  }
  throw new Error('Approval transaction was not confirmed in time.');
}

export interface DexSwapArgs {
  quote: RocketXQuote;
  userAddress: string;
  destinationAddress: string;
  slippage?: number;
  refundAddress?: string;
  refundMemo?: string;
  sendTx: SendTx;
  onStep?: (step: 'approving' | 'creating' | 'sending') => void;
}

export async function executeDexSwap(a: DexSwapArgs): Promise<{ requestId: string; txHash: string }> {
  const q = a.quote;

  if (q.exchangeType !== 'DEX' || q.fromNetworkType !== 'EVM' || !q.fromChainId) {
    throw new Error('This route cannot be executed from your wallet. Choose a different pair.');
  }
  if (!q.fromTokenId || !q.toTokenId) throw new Error('Quote data is incomplete — refresh the quote and try again.');
  if (q.isRefundAddressRequired && !a.refundAddress) throw new Error('This route requires a refund address.');

  const chainId = q.fromChainId;
  const isNative = !!q.fromIsNative;
  const amountBase = toBaseUnits(q.fromAmount, q.fromTokenDecimals ?? 18);

  // Approve only what's needed (+1% headroom for rounding), never unlimited.
  const ensureAllowance = async (spender: string) => {
    const token = q.fromTokenAddress;
    if (!token) throw new Error('Missing token contract address for approval.');
    const current = await getAllowance(chainId, token, a.userAddress, spender);
    if (current >= amountBase) return;
    a.onStep?.('approving');
    // Some tokens (e.g. USDT on Ethereum) refuse a non-zero -> non-zero change: reset first.
    if (current > 0n) {
      const h0 = await a.sendTx({ to: token, data: approveData(spender, 0n), value: '0x0' });
      await waitForReceipt(chainId, h0);
    }
    const h = await a.sendTx({ to: token, data: approveData(spender, (amountBase * 101n) / 100n), value: '0x0' });
    await waitForReceipt(chainId, h);
  };

  let spender = q.allowanceAddress;
  if (!isNative && spender) await ensureAllowance(spender);

  a.onStep?.('creating');
  const resp: any = await rocketXApi.executeSwap({
    fromTokenId: q.fromTokenId,
    toTokenId: q.toTokenId,
    userAddress: a.userAddress,
    destinationAddress: a.destinationAddress,
    amount: q.fromAmount,
    slippage: a.slippage ?? 1,
    ...(q.rateId ? { rateId: q.rateId } : {}),
    ...(a.refundAddress ? { refundAddress: a.refundAddress } : {}),
    ...(a.refundMemo ? { refundMemo: a.refundMemo } : {}),
    // Gas estimation fails for an un-approved token, so skip it when we still have to approve after this call.
    ...(!isNative && !spender ? { disableEstimate: true } : {}),
  });

  const requestId: string | undefined = resp?.requestId;
  if (!requestId) throw new Error('Swap creation failed — no requestId returned.');

  const tx = resp.swap?.tx ?? resp.tx; // docs (PDF, indented under `swap`): swap.tx; top-level kept as a fallback
  if (!tx?.to || !tx?.data) throw new Error('Swap response did not include transaction data to sign.');
  if (tx.from && tx.from.toLowerCase() !== a.userAddress.toLowerCase()) {
    throw new Error('Swap transaction is for a different sender address — aborting.');
  }

  if (!isNative && !spender) {
    spender = resp.allowanceAddress ?? resp.swap?.allowanceAddress;
    if (!spender) throw new Error('No allowance address was returned for this token route.');
    await ensureAllowance(spender);
  }

  a.onStep?.('sending');
  const txHash = await a.sendTx({ to: tx.to, data: tx.data, value: normHex(tx.value), gas: tx.gas ? normHex(tx.gas) : undefined });
  return { requestId, txHash };
}

/** Polls /v1/status until success. Throws on failure/timeout. Returns null if cancelled. */
export async function pollSwapStatus(o: {
  requestId: string;
  txHash: string;
  timeoutMs?: number;
  intervalMs?: number;
  isCancelled?: () => boolean;
}): Promise<any | null> {
  const { requestId, txHash, timeoutMs = 10 * 60_000, intervalMs = 5000, isCancelled } = o;
  const start = Date.now();
  let consecutiveErrors = 0;

  while (Date.now() - start < timeoutMs) {
    if (isCancelled?.()) return null;
    await new Promise((r) => setTimeout(r, intervalMs));
    let s: any;
    try {
      s = await rocketXApi.getStatus(requestId, txHash);
      consecutiveErrors = 0;
    } catch (e) {
      // Tolerate transient network / rate-limit blips; the swap itself is already on-chain.
      if (++consecutiveErrors >= 5) throw e;
      continue;
    }
    // Docs: status = pending | success | failed ; subState 0>invalid … 6>withdraw_success
    if (s?.status === 'success' || s?.subState === 'withdraw_success') return s;
    if (s?.status === 'failed' || s?.subState === 'invalid') {
      throw new Error(s?.remarks || 'Swap failed or timed out on the exchange.');
    }
  }
  throw new Error('Swap is taking longer than expected. Check your wallet history — funds may still arrive.');
}
