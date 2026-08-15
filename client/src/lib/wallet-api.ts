import { nonCustodialWalletManager } from "./non-custodial-wallet";
import { getSupabase, supabase } from "./supabase";
import { getWalletMonitorTargets } from "./wallet-chain-monitor";
import { monitorWithdrawal } from "./withdrawal-monitor";

export interface Wallet {
  id: string;
  user_id: string;
  crypto_symbol: string;
  /** Total on-chain value, including inbound value below the confirmation minimum. */
  balance: number;
  /** Inbound value that has not reached this chain's confirmation minimum. */
  unconfirmed_balance: number;
  /** Structurally unspendable value (e.g. the XRP base reserve). */
  locked_balance: number;
  /** balance - unconfirmed_balance - locked_balance. Spend flows must use this. */
  available_balance: number;
  /** True when no live chain read backed this row (never spendable). */
  is_stale: boolean;
  deposit_address: string | null;
  created_at: string;
  updated_at: string;
  isNonCustodial?: boolean;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'swap' | 'p2p_buy' | 'p2p_sell' | 'escrow_lock' | 'escrow_release' | 'fee';
  crypto_symbol: string;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  reference_id: string | null;
  notes: string | null;
  confirmations: number | null;
  /** Confirmations required before this transaction is treated as final. */
  required_confirmations: number | null;
  created_at: string;
  completed_at: string | null;
}

function mapChainIdToSymbol(chainId: string): string {
  if (chainId === 'Ethereum (ERC-20)' || chainId === 'ethereum') return 'ETH';
  if (chainId === 'Bitcoin (SegWit)'  || chainId === 'bitcoin')  return 'BTC';
  if (chainId === 'Binance Smart Chain (BEP-20)' || chainId === 'BNB' || chainId === 'BSC') return 'BNB';
  if (chainId === 'Solana')           return 'SOL';
  if (chainId === 'Tron (TRC-20)')    return 'TRX';
  if (chainId === 'XRP')              return 'XRP';
  return chainId;
}

/**
 * Map a crypto symbol to the chain key used by the on-chain monitor.
 * Inverse of mapChainIdToSymbol: values returned here round-trip back to
 * the original symbol. Non-native assets default to the mainnet their
 * monitor scanner reads them on (USDT/USDC -> Ethereum unless token-specific).
 */
export function toMonitorChainKey(cryptoSymbol: string): string {
  const s = (cryptoSymbol || '').toUpperCase().trim();

  // Native / wrapped native assets.
  if (s === 'BTC' || s === 'WBTC' || s === 'CBTC' || s === 'XBT') return 'Bitcoin';
  if (s === 'BNB' || s === 'WBNB') return 'BSC';
  if (s === 'SOL' || s === 'WSOL') return 'Solana';
  if (s === 'TRX' || s === 'TRX_TRON') return 'Tron';
  if (s === 'XRP') return 'XRP';
  if (s === 'POL' || s === 'MATIC' || s === 'POLYGON') return 'POLYGON';
  if (s === 'BASE' || s === 'CBETH') return 'BASE';
  if (s === 'ARB' || s === 'ARBITRUM') return 'ARBITRUM';
  if (s === 'OP' || s === 'OPTIMISM') return 'OPTIMISM';

  // Everything else (ETH, USDT, USDC, DAI, LINK, ...) defaults to Ethereum.
  return 'Ethereum';
}

/* =========================================
   CONFIRMATION POLICY

   Mirrors the deposit scanner's MIN_CONFIRMATIONS.
   A transaction is only "completed" once it has at
   least this many confirmations on its chain — not
   at the first confirmation.
========================================= */

export const MIN_CONFIRMATIONS: Record<string, number> = {
  BITCOIN: 2,
  BTC: 2,
  ETHEREUM: 12,
  ETH: 12,
  BSC: 15,
  POLYGON: 128,
  ARBITRUM: 20,
  OPTIMISM: 20,
  BASE: 20,
  AVALANCHE: 20,
  SOLANA: 32,
  SOL: 32,
  TRON: 19,
  TRX: 19,
  XRP: 1,
};

export function minConfirmationsForChain(chain?: string | null): number {
  return MIN_CONFIRMATIONS[String(chain ?? '').toUpperCase().trim()] ?? 12;
}

/**
 * XRP base reserve fallback (XRP). The live network value is an
 * amendment-controlled parameter — the provider value always wins; this is
 * only used when the provider omits it.
 */
const XRP_FALLBACK_RESERVE = 1;

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function readUnconfirmed(scope: any): number {
  const value =
    scope?.unconfirmed ??
    scope?.unconfirmedBalance ??
    scope?.unconfirmed_balance ??
    scope?.pending ??
    scope?.pendingBalance ??
    scope?.incomingPending;
  const n = toNumber(value, 0);
  return n > 0 ? n : 0;
}

/**
 * Live balance read for one (address, chain) pair.
 * Returns null when the chain could not be read — callers must treat that as
 * "unknown", never as zero and never as "the cached number is fine to spend".
 */
async function readAddressBalances(
  client: any,
  address: string,
  chain: string,
): Promise<any | null> {
  try {
    const res = await client.functions.invoke('monitor-deposits', {
      body: {
        address,
        chain,
        mode: 'balances',
        minConfirmations: minConfirmationsForChain(chain),
      },
    });
    if (res.error || !res.data?.success || !res.data?.native) return null;
    return res.data;
  } catch {
    return null;
  }
}

/**
 * Wallets for a user.
 *
 * Addresses come from the local non-custodial wallet store, but BALANCES ARE
 * NEVER read from local storage: that value is user-writable and cannot be
 * trusted for anything financial. Every balance below is read live from the
 * chain, split into confirmed / unconfirmed / locked, and any chain that could
 * not be read is returned as is_stale with available_balance 0.
 */
export async function getUserWallets(userId: string): Promise<Wallet[]> {
  try {
    const localWallets = await (nonCustodialWalletManager as any).getWalletsFromStorage(userId);
    if (import.meta.env.DEV) console.log(`[getUserWallets] Found ${localWallets.length} local wallets`);

    const client = await getSupabase();
    const now = new Date().toISOString();

    // Deduplicate the chain reads: several wallet rows can share one address.
    const balanceCache = new Map<string, Promise<any | null>>();
    const readCached = (address: string, chain: string) => {
      const key = `${address}::${chain}`;
      if (!balanceCache.has(key)) balanceCache.set(key, readAddressBalances(client, address, chain));
      return balanceCache.get(key)!;
    };

    return await Promise.all(
      localWallets.map(async (w: any): Promise<Wallet> => {
        const symbol = mapChainIdToSymbol(w.chainId);
        const address = typeof w.address === 'string' ? w.address.trim() : '';
        const chain = toMonitorChainKey(symbol);

        const base: Wallet = {
          id: w.id,
          user_id: userId,
          crypto_symbol: symbol,
          balance: 0,
          unconfirmed_balance: 0,
          locked_balance: 0,
          available_balance: 0,
          is_stale: true,
          deposit_address: address || null,
          created_at: w.createdAt,
          updated_at: w.createdAt,
          isNonCustodial: true,
        };

        if (!address) return base;

        const data = await readCached(address, chain);
        if (!data) return base;

        const isNative = String(data?.native?.symbol ?? '').toUpperCase() === symbol.toUpperCase();
        const token = Array.isArray(data?.tokens)
          ? data.tokens.find((t: any) => String(t?.symbol ?? '').toUpperCase() === symbol.toUpperCase())
          : undefined;
        const scope = isNative ? data.native : token;

        // A successful read with no matching asset means the balance is 0.
        const total = scope ? toNumber(scope.balance) : 0;
        const unconfirmed = Math.min(
          scope ? (readUnconfirmed(scope) || (isNative ? readUnconfirmed(data) : 0)) : 0,
          total,
        );

        let locked = 0;
        if (chain === 'XRP' && isNative) {
          locked = data?.accountFunded === false
            ? 0
            : Math.min(toNumber(data?.reserve, XRP_FALLBACK_RESERVE), total);
        }

        const available = Math.max(0, total - unconfirmed - locked);

        return {
          ...base,
          balance: total,
          unconfirmed_balance: unconfirmed,
          locked_balance: locked,
          available_balance: available,
          is_stale: false,
          updated_at: now,
        };
      }),
    );
  } catch (e) {
    console.error(`[getUserWallets] Error fetching wallets:`, e);
    return [];
  }
}

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find(w => w.crypto_symbol === cryptoSymbol) || null;
}

/**
 * Spendable amount for a symbol. 0 when the chain read failed (is_stale) or
 * when everything held is unconfirmed / reserved. Never use `wallet.balance`
 * to authorise a send, swap or escrow lock.
 */
export async function getSpendableBalance(userId: string, cryptoSymbol: string): Promise<number> {
  const wallet = await getWalletBalance(userId, cryptoSymbol);
  if (!wallet || wallet.is_stale) return 0;
  return wallet.available_balance;
}

function readString(raw: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = raw?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readIndex(raw: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = raw?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Base-unit exponent per asset. EVM-style assets default to 18. */
export const ASSET_DECIMALS: Record<string, number> = {
  BTC: 8, LTC: 8, BCH: 8, DOGE: 8, DASH: 8, ZEC: 8,
  XRP: 6, TRX: 6, ATOM: 6, USDT: 6, USDC: 6,
  SOL: 9, TON: 9,
  ETH: 18, BNB: 18, MATIC: 18, POL: 18, AVAX: 18, ARB: 18,
  OP: 18, BASE: 18, DAI: 18, LINK: 18, UNI: 18, SHIB: 18,
};

export function getAssetDecimals(symbol?: string | null): number {
  if (!symbol) return 18;
  return ASSET_DECIMALS[symbol.toUpperCase().trim()] ?? 18;
}

/**
 * Display value for an amount that is ALREADY expressed in display units.
 *
 * The previous implementation guessed whether an integer was base units by
 * comparing it against a per-decimals threshold. That guess is unsound in both
 * directions: `5` on BTC is 5 satoshis or 5 BTC depending on the source, and a
 * legitimate round amount got divided by 1e8. Unit conversion now happens only
 * where an explicit base-unit field and an explicit exponent are available
 * (see `fromBaseUnits`) — nothing is inferred from magnitude.
 */
export function normalizeWalletDisplayAmount(
  amount: number | string | null | undefined,
  _symbol?: string | null,
): number {
  const raw = typeof amount === "string" ? Number(amount) : amount;
  if (raw == null || !Number.isFinite(raw)) return 0;
  return raw;
}

/** Exact base-unit -> display conversion with an explicit exponent. */
function fromBaseUnits(rawValue: unknown, decimals: number): number | null {
  const rawString = String(rawValue ?? "").trim();
  if (!rawString) return null;
  let units: bigint;
  try {
    if (/^0x[0-9a-fA-F]+$/.test(rawString)) units = BigInt(rawString);
    else if (/^[+-]?\d+$/.test(rawString)) units = BigInt(rawString);
    else return null;
  } catch {
    return null;
  }
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const fraction = abs % divisor;
  const value = Number(whole) + Number(fraction) / Number(divisor);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/**
 * Amount in display units.
 *
 * Priority:
 *   1. explicit base units (`amountRaw` / `valueRaw` / `tokenAmount.amount`)
 *      scaled by an explicit exponent (payload decimals, else the asset table);
 *   2. an explicit display value (`amount`, `uiAmountString`, ...) used as-is.
 * No magnitude heuristics — an ambiguous payload yields the display value
 * unchanged rather than a silently rescaled one.
 */
function readAmount(raw: any, symbol?: string | null): number {
  const value = raw?.amount ?? raw?.tokenAmount ?? raw?.value_decimal ?? raw?.value;
  const candidate = typeof value === "object"
    ? value?.uiAmountString ?? value?.uiAmount ?? value?.amount ?? value?.value
    : value;
  const explicitAmount = typeof candidate === "string" && candidate.trim().startsWith("0x")
    ? Number(BigInt(candidate.trim()))
    : Number(candidate);

  const rawValue = raw?.amountRaw
    ?? raw?.valueRaw
    ?? (typeof raw?.tokenAmount === "object" ? raw.tokenAmount?.amount : undefined);

  const payloadDecimals = Number(
    raw?.decimals ?? (typeof raw?.tokenAmount === "object" ? raw.tokenAmount?.decimals : undefined),
  );
  const assetDecimals = getAssetDecimals(symbol);
  // A base-unit payload with `decimals: 0` is a known monitor bug for 8/6/18
  // decimal assets; fall back to the asset table rather than rendering
  // satoshis as whole coins.
  const decimals = Number.isInteger(payloadDecimals) && payloadDecimals > 0 && payloadDecimals <= 36
    ? payloadDecimals
    : assetDecimals;

  if (rawValue != null) {
    const scaled = fromBaseUnits(rawValue, decimals);
    if (scaled !== null) return scaled;
  }

  return Number.isFinite(explicitAmount) ? explicitAmount : 0;
}

function readDate(raw: any): string {
  const value =
    raw?.created_at ??
    raw?.createdAt ??
    raw?.timestamp ??
    raw?.time ??
    raw?.block_time ??
    raw?.blockTime ??
    raw?.date ??
    raw?.metadata?.blockTimestamp ??
    raw?.metadata?.timestamp;
  if (typeof value === "number") {
    return new Date(value < 1_000_000_000_000 ? value * 1000 : value).toISOString();
  }
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function extractOnChainTransactions(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const candidates = [
    data.data,
    data.result,
    data.transactions,
    data.activity,
    data.activities,
    data.operations,
    data.history,
    data.transfers,
    data.items,
    data.records,
    data.results,
    data.data?.transactions,
    data.data?.activity,
    data.data?.activities,
    data.data?.operations,
    data.data?.history,
    data.data?.transfers,
    data.data?.items,
    data.data?.records,
    data.data?.results,
    data.result?.transactions,
    data.result?.activity,
    data.result?.activities,
    data.result?.operations,
    data.result?.history,
    data.result?.transfers,
    data.result?.items,
    data.result?.records,
    data.result?.results,
  ];

  const list = candidates.find(Array.isArray);
  if (list) return list;

  for (const key of ["data", "result", "payload", "response"]) {
    const nested = data[key];
    if (nested && nested !== data) {
      const extracted = extractOnChainTransactions(nested);
      if (extracted.length > 0) return extracted;
    }
  }

  // Some monitor responses return one transaction directly rather than
  // wrapping it in an array.
  const hasTransactionIdentity = [
    "hash",
    "txid",
    "txId",
    "txHash",
    "transactionHash",
    "tx_hash",
    "signature",
    "transaction_id",
    "transactionId",
  ].some((key) => typeof data[key] === "string" && data[key].trim());
  return hasTransactionIdentity ? [data] : [];
}

function normalizeOnChainTransaction(
  raw: any,
  userId: string,
  target: { address: string; chain: string },
): WalletTransaction | null {
  const hash = readString(
    raw,
    "hash",
    "txid",
    "txId",
    "txHash",
    "transactionHash",
    "tx_hash",
    "signature",
    "transaction_id",
    "transactionId",
    "id",
  );
  if (!hash) return null;

  const from = readString(raw, "from", "fromAddress", "from_address", "sender");
  const to = readString(raw, "to", "toAddress", "to_address", "recipient");
  const sameAddress = (left: string | null, right: string) =>
    !!left && left.toLowerCase() === right.toLowerCase();
  const isDeposit = sameAddress(to, target.address) && !sameAddress(from, target.address);
  const isWithdrawal = sameAddress(from, target.address) && !sameAddress(to, target.address);

  let type: WalletTransaction["type"];
  if (isDeposit) type = "deposit";
  else if (isWithdrawal) type = "withdrawal";
  else if (raw?.type === "swap") type = "swap";
  else if (sameAddress(from, target.address) && sameAddress(to, target.address)) type = "swap"; // self-transfer
  // Direction genuinely unknown: dropping the row is correct. Defaulting to
  // "deposit" invented incoming money out of unparsable payloads.
  else return null;

  const symbol = (
    readString(raw, "crypto_symbol", "cryptoSymbol", "symbol", "tokenSymbol", "asset") ??
    (
      target.chain === "BSC" ? "BNB" :
      target.chain === "POLYGON" ? "POL" :
      target.chain === "BASE" || target.chain === "ARBITRUM" || target.chain === "OPTIMISM" ? "ETH" :
      target.chain
    )
  ).toUpperCase();

  const rawStatus = String(raw?.status ?? "").toLowerCase();
  const confirmations = Number(raw?.confirmations);
  const confirmationCount = Number.isFinite(confirmations) ? confirmations : 0;
  const requiredConfirmations = minConfirmationsForChain(target.chain);
  // A transaction is final only at the chain's confirmation minimum — one
  // confirmation is not enough on any chain in this table.
  const isFinal = confirmationCount >= requiredConfirmations;
  const status: WalletTransaction["status"] =
    rawStatus === "failed" || raw?.success === false
      ? "failed"
      : rawStatus === "pending" || raw?.confirmed === false || !isFinal
        ? "pending"
        : "completed";

  // A single transaction can contain several transfers of the same asset to
  // the same address (batched sends, multi-output BTC). Without the transfer
  // index they collapse into one row and deposits silently vanish.
  const transferIndex =
    readIndex(raw, "logIndex", "log_index", "vout", "outputIndex", "output_index", "index", "position", "traceId", "uniqueId") ??
    "0";

  return {
    id: `onchain:${target.chain}:${hash}:${symbol}:${transferIndex}`,
    user_id: userId,
    wallet_id: `onchain:${target.chain}:${target.address}`,
    type,
    crypto_symbol: symbol,
    amount: readAmount(raw, symbol),
    fee: Number(raw?.fee ?? 0) || 0,
    status,
    tx_hash: hash,
    from_address: from,
    to_address: to,
    reference_id: hash,
    notes: "On-chain transaction",
    confirmations: confirmationCount,
    required_confirmations: requiredConfirmations,
    created_at: readDate(raw),
    completed_at: status === "completed" ? readDate(raw) : null,
  };
}

async function refreshWithdrawalStatus(
  transaction: WalletTransaction,
  target: { address: string; chain: string },
): Promise<WalletTransaction> {
  if (transaction.type !== "withdrawal" || !transaction.tx_hash || transaction.status !== "pending") {
    return transaction;
  }

  try {
    const result = await monitorWithdrawal({
      chain: target.chain,
      txHash: transaction.tx_hash,
      fromAddress: target.address,
      expected: {
        toAddress: transaction.to_address ?? undefined,
        amount: String(transaction.amount),
        asset: transaction.crypto_symbol,
      },
    });

    const terminalFailure = result?.terminalFailure === true;
    const settled = result?.settled === true;
    const status: WalletTransaction["status"] = terminalFailure
      ? "failed"
      : settled
        ? "completed"
        : "pending";

    return {
      ...transaction,
      status,
      confirmations: Number.isFinite(Number(result?.confirmations))
        ? Number(result.confirmations)
        : transaction.confirmations,
      to_address: transaction.to_address ?? result?.recipient ?? null,
      completed_at: status === "completed" ? new Date().toISOString() : transaction.completed_at,
      notes: result?.status
        ? `Withdrawal monitor: ${String(result.status)}`
        : transaction.notes,
    };
  } catch (error) {
    // The chain activity row remains useful when the withdrawal monitor is
    // temporarily unavailable. Never turn a monitor outage into a failure.
    if (import.meta.env.DEV) {
      console.warn("[wallet-activity] withdrawal status refresh failed:", error);
    }
    return transaction;
  }
}

/**
 * Index a broadcast non-custodial withdrawal so outbound activity can be
 * displayed alongside deposits. The blockchain monitor remains authoritative
 * for the status of this record.
 */
export async function recordWithdrawalTransaction(params: {
  userId: string;
  cryptoSymbol: string;
  amount: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  createdAt?: string;
}): Promise<void> {
  // Non-custodial: nothing is written to a database. The broadcast hash is
  // cached locally so outbound activity can be shown until the chain indexes
  // it; the chain remains the only source of truth.
  addLocalWithdrawalHash(params);
}

const LOCAL_WITHDRAWALS_KEY = "pexly_local_withdrawals_v1";

interface LocalWithdrawal {
  userId: string;
  cryptoSymbol: string;
  amount: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  createdAt: string;
}

function readLocalWithdrawalCache(): LocalWithdrawal[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_WITHDRAWALS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addLocalWithdrawalHash(params: {
  userId: string;
  cryptoSymbol: string;
  amount: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  createdAt?: string;
}) {
  if (typeof localStorage === "undefined") return;
  const entry: LocalWithdrawal = {
    userId: params.userId,
    cryptoSymbol: params.cryptoSymbol.toUpperCase(),
    amount: params.amount,
    txHash: params.txHash,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
  const next = [entry, ...readLocalWithdrawalCache().filter((w) => w.txHash !== entry.txHash)].slice(0, 200);
  try {
    localStorage.setItem(LOCAL_WITHDRAWALS_KEY, JSON.stringify(next));
  } catch {
    // Cache only; the chain stays authoritative.
  }
}

function readLocalWithdrawals(userId: string, limit: number): WalletTransaction[] {
  return readLocalWithdrawalCache()
    .filter((w) => w.userId === userId)
    .slice(0, limit)
    .map((w) => ({
      id: `local:${w.txHash}`,
      user_id: userId,
      wallet_id: `withdrawal:${w.txHash}`,
      type: "withdrawal" as const,
      crypto_symbol: w.cryptoSymbol,
      // Already stored in display units at broadcast time — no rescaling.
      amount: normalizeWalletDisplayAmount(w.amount, w.cryptoSymbol),
      fee: 0,
      status: "pending" as const,
      tx_hash: w.txHash,
      from_address: w.fromAddress,
      to_address: w.toAddress,
      reference_id: w.txHash,
      notes: "Broadcast from non-custodial wallet",
      confirmations: null,
      required_confirmations: null,
      created_at: w.createdAt,
      completed_at: null,
    }));
}

/**
 * Read wallet activity from the same public-address monitor used for balances.
 * Deposits come from the chain scanner. Withdrawals come from the chain too
 * (outbound transfers the monitor reports) and are merged with the local
 * broadcast index, which only covers the window before the chain indexes them.
 */
export async function getOnChainTransactions(userId: string, limit: number = 200): Promise<WalletTransaction[]> {
  // Use the same awaited client initialization as balance reads. The lazy
  // `supabase` proxy can otherwise be hit before the browser client is ready,
  // which makes activity silently look empty on a fresh/mobile load.
  const client = await getSupabase();
  const targets = await getWalletMonitorTargets(userId);

  let failedTargets = 0;
  const results = await Promise.all(
    targets.map(async (target) => {
      try {
        const { data, error } = await client.functions.invoke("monitor-deposits", {
          body: {
            address: target.address,
            chain: target.chain,
            mode: "deposits",
            limit,
          },
        });

        if (error) throw new Error(`${target.chain}: ${error.message}`);

        const rawTransactions = extractOnChainTransactions(data);

        return rawTransactions
          .map((raw: any) => normalizeOnChainTransaction(raw, userId, target))
          .filter((tx: WalletTransaction | null): tx is WalletTransaction => !!tx);
      } catch (error) {
        failedTargets += 1;
        if (import.meta.env.DEV) {
          console.warn("[wallet-activity] on-chain history read failed:", target.chain, error);
        }
        return [];
      }
    }),
  );

  if (targets.length > 0 && failedTargets === targets.length) {
    throw new Error("Unable to read on-chain wallet activity");
  }

  const unique = new Map<string, WalletTransaction>();
  results.flat().forEach((tx) => unique.set(tx.id, tx));

  // Outbound transfers may not be discoverable through monitor-deposits. Read
  // the user's own broadcast index to locate their tx hashes, then verify
  // pending hashes through the dedicated withdrawal monitor. A local entry is
  // dropped once the chain has already produced a row for the same hash, so a
  // confirmed withdrawal is never shown twice as "pending".
  const chainHashes = new Set(
    Array.from(unique.values())
      .map((tx) => (tx.tx_hash ?? "").toLowerCase())
      .filter(Boolean),
  );
  for (const tx of readLocalWithdrawals(userId, limit)) {
    if (tx.tx_hash && chainHashes.has(tx.tx_hash.toLowerCase())) continue;
    unique.set(`withdrawal:${tx.id}`, tx);
  }

  const sorted = Array.from(unique.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Keep monitor calls bounded: completed historical withdrawals already have
  // their final state from monitor-deposits, while pending rows need the
  // dedicated withdrawal monitor for terminal/replacement detection.
  const pendingWithdrawals = sorted
    .filter((tx) => tx.type === "withdrawal" && tx.status === "pending")
    .slice(0, 25);
  const pendingById = new Map(
    await Promise.all(
      pendingWithdrawals.map(async (tx) => {
        const target = targets.find((candidate) =>
          !!tx.from_address && candidate.address.toLowerCase() === tx.from_address.toLowerCase(),
        ) ?? targets.find((candidate) =>
          tx.wallet_id === `onchain:${candidate.chain}:${candidate.address}`,
        );
        return [tx.id, target ? await refreshWithdrawalStatus(tx, target) : tx] as const;
      }),
    ),
  );

  return sorted
    .map((tx) => pendingById.get(tx.id) ?? tx)
    .slice(0, limit);
}

/**
 * Total outbound value that has been broadcast but is not yet confirmed.
 * The chain's balance endpoint still counts these coins on account-model
 * chains until the tx is mined, so subtract this from the spendable amount
 * before allowing another send.
 */
export function getPendingOutbound(userId: string, cryptoSymbol: string): number {
  const symbol = cryptoSymbol.toUpperCase();
  return readLocalWithdrawalCache()
    .filter((w) => w.userId === userId && w.cryptoSymbol.toUpperCase() === symbol)
    .reduce((sum, w) => sum + (Number.isFinite(Number(w.amount)) ? Number(w.amount) : 0), 0);
}

export async function sendCrypto(
  userId: string,
  cryptoSymbol: string,
  toAddress: string,
  amount: number,
  notes?: string
): Promise<WalletTransaction> {
  // Custodial withdrawal replaced with local placeholder or signing logic

  throw new Error("Withdrawal must be initiated via wallet signing");
}

export async function getDepositAddress(userId: string, cryptoSymbol: string): Promise<string> {
  const wallets = await getUserWallets(userId);

  let wallet = wallets.find(w => w.crypto_symbol === cryptoSymbol);

  if (wallet?.deposit_address) {
    return wallet.deposit_address;
  }

  if ((cryptoSymbol === 'USDT' || cryptoSymbol === 'USDC') && !cryptoSymbol.includes('-')) {
    wallet = wallets.find(w => w.crypto_symbol.startsWith(`${cryptoSymbol}-`));
    if (wallet?.deposit_address) {
      return wallet.deposit_address;
    }
  }

  const anyWallet = wallets.find(w => w.isNonCustodial);
  if (anyWallet?.deposit_address) {
    return anyWallet.deposit_address;
  }

  throw new Error('No deposit address found for this wallet.');
}

export async function monitorDeposits(userId: string, cryptoSymbol: string): Promise<{
  detected: boolean;
  transactions?: any[];
  message?: string;
}> {
  return { detected: false, message: 'Non-custodial monitoring handled on-client' };
}

export async function createCDPSession(
  address: string,
  assets: string[],
  paymentAmount?: string,
  paymentCurrency?: string,
  options?: { network?: string; paymentMethod?: string }
): Promise<{ onrampUrl: string | null; sessionToken: string | null }> {
  if (import.meta.env.DEV) console.log("[createCDPSession] Initiating cdp-create-session");

  const { data: { session } } = await supabase.auth.getSession();
  const access_token = session?.access_token;

  const purchaseCurrency = (assets[0] || 'USDC').toUpperCase() === 'MATIC'
    ? 'POL'
    : (assets[0] || 'USDC').toUpperCase();

  // Both edge functions validate `address` with /^0x[a-fA-F0-9]{40}$/ (EVM only).
  // Network mapping must therefore be EVM-compatible:
  //   BTC  → 'base'  (Coinbase delivers cbBTC on Base to any EVM address)
  //   everything else → 'ethereum' or the caller-supplied network
  let destinationNetwork = options?.network;
  if (!destinationNetwork) {
    if (purchaseCurrency === 'BTC') destinationNetwork = 'base';
    else destinationNetwork = 'ethereum'; // ETH, USDC, USDT, SOL not EVM-supported
  }

  // Edge fn only accepts these four values; default to CARD.
  const VALID_PAYMENT_METHODS = new Set(['CARD', 'ACH_BANK_ACCOUNT', 'APPLE_PAY', 'FIAT_WALLET']);
  const paymentMethod = (options?.paymentMethod && VALID_PAYMENT_METHODS.has(options.paymentMethod))
    ? options.paymentMethod
    : 'CARD';

  const { data, error } = await supabase.functions.invoke('cdp-create-session', {
    body: {
      address,
      destinationNetwork,
      purchaseCurrency,
      paymentAmount,
      paymentCurrency,
      paymentMethod,
    },
    headers: access_token ? { Authorization: `Bearer ${access_token}` } : undefined,
  });

  if (error) {
    console.error("[createCDPSession] Error response:", error);
    throw new Error(error.message || 'Failed to create CDP session');
  }

  if (import.meta.env.DEV) console.log("[createCDPSession] Session created successfully");

  const result = data as any;
  const onrampUrl: string | null = result?.onrampUrl ?? null;
  const sessionToken: string | null = result?.sessionToken ?? null;

  return { onrampUrl, sessionToken };
}

export async function createCDPOfframpSession(
  address: string,
  assets: string[],
  _sellAmount: string | undefined,   // kept for call-site compat; edge fn does not use it
  fiatCurrency?: string,
  options?: { network?: string; cashoutMethod?: string }
): Promise<{ offrampUrl: string | null }> {
  if (import.meta.env.DEV) console.log("[createCDPOfframpSession] Initiating cdp-offramp-session");

  const { data: { session } } = await supabase.auth.getSession();
  const access_token = session?.access_token;

  const sellCurrency = (assets[0] || 'USDC').toUpperCase() === 'MATIC'
    ? 'POL'
    : (assets[0] || 'USDC').toUpperCase();

  // Derive network from currency when not provided.
  let sellNetwork = options?.network;
  if (!sellNetwork) {
    if (sellCurrency === 'BTC') sellNetwork = 'bitcoin';
    else if (sellCurrency === 'SOL') sellNetwork = 'solana';
    else sellNetwork = 'ethereum';
  }

  // Edge fn accepts: BANK_ACCOUNT | ACH_BANK_ACCOUNT | PAYPAL | FIAT_WALLET
  const VALID_CASHOUT_METHODS = new Set(['BANK_ACCOUNT', 'ACH_BANK_ACCOUNT', 'PAYPAL', 'FIAT_WALLET']);
  const cashoutMethod = (options?.cashoutMethod && VALID_CASHOUT_METHODS.has(options.cashoutMethod))
    ? options.cashoutMethod
    : 'BANK_ACCOUNT';

  const { data, error } = await supabase.functions.invoke('cdp-create-offramp-session', {
    body: {
      sourceAddress: address,
      sellCurrency,
      sellNetwork,
      cashoutCurrency: fiatCurrency || 'USD',
      cashoutMethod,
    },
    headers: access_token ? { Authorization: `Bearer ${access_token}` } : undefined,
  });

  if (error) {
    console.error("[createCDPOfframpSession] Error response:", error);
    throw new Error(error.message || 'Failed to create CDP offramp session');
  }

  const result = data as any;
  // The edge fn returns { success, offrampUrl } — no session token.
  const offrampUrl: string | null = result?.offrampUrl ?? null;
  return { offrampUrl };
}

export function startDepositMonitoring(
  userId: string,
  cryptoSymbol: string,
  onDeposit: (transactions: any[]) => void,
  intervalMs: number = 30000
): () => void {
  const checkDeposits = async () => {
    try {
      const result = await monitorDeposits(userId, cryptoSymbol);
      if (result.detected && result.transactions && result.transactions.length > 0) {
        onDeposit(result.transactions);
      }
    } catch (error) {
      console.error('Deposit monitoring error:', error);
    }
  };

  const intervalId = setInterval(checkDeposits, intervalMs);
  checkDeposits();

  return () => clearInterval(intervalId);
}

export async function monitorWithdrawals(userId: string): Promise<{
  updated: any[];
  message?: string;
}> {
  const transactions = await getOnChainTransactions(userId);
  const updated = transactions
    .filter((transaction) => transaction.type === "withdrawal")
    .map((transaction) => ({
      transactionId: transaction.id,
      status: transaction.status,
      confirmations: transaction.confirmations,
      requiredConfirmations: transaction.required_confirmations,
      txHash: transaction.tx_hash,
    }));

  return {
    updated,
    message: "Withdrawal statuses checked",
  };
}

export function startWithdrawalMonitoring(
  userId: string,
  onUpdate: (transactions: any[]) => void,
  intervalMs: number = 30000
): () => void {
  const checkWithdrawals = async () => {
    try {
      const result = await monitorWithdrawals(userId);
      if (result.updated && result.updated.length > 0) {
        onUpdate(result.updated);
      }
    } catch (error) {
      console.error('Withdrawal monitoring error:', error);
    }
  };

  const intervalId = setInterval(checkWithdrawals, intervalMs);
  checkWithdrawals();

  return () => clearInterval(intervalId);
}

export async function sendPexlyPayment(
  senderId: string,
  recipientId: string,
  amount: number,
  cryptoSymbol: string = 'USDT',
  note?: string
): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('pexly-pay-send', {
      body: {
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        crypto_symbol: cryptoSymbol,
        note: note || null,
      },
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process transfer'
      };
    }

    const result = data as any;
    return {
      success: true,
      transactionId: result.transaction_id || result.transactionId,
    };
  } catch (error) {
    console.error('❌ Error in sendPexlyPayment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
