import { nonCustodialWalletManager } from "./non-custodial-wallet";
import { getSupabase, supabase } from "./supabase";
import { getWalletMonitorTargets } from "./wallet-chain-monitor";
import { monitorWithdrawal } from "./withdrawal-monitor";

export interface Wallet {
  id: string;
  user_id: string;
  crypto_symbol: string;
  balance: number;
  locked_balance: number;
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


export async function getUserWallets(userId: string): Promise<Wallet[]> {
  try {
    const localWallets = await (nonCustodialWalletManager as any).getWalletsFromStorage(userId);
    if (import.meta.env.DEV) console.log(`[getUserWallets] Found ${localWallets.length} local wallets`);
    return localWallets.map((w: any) => ({
      id: w.id,
      user_id: userId,
      crypto_symbol: mapChainIdToSymbol(w.chainId),
      balance: typeof w.balance === 'number' ? w.balance : (typeof w.balance === 'string' ? parseFloat(w.balance) || 0 : 0),
      locked_balance: 0,
      deposit_address: w.address,
      created_at: w.createdAt,
      updated_at: w.createdAt,
      isNonCustodial: true
    }));
  } catch (e) {
    console.error(`[getUserWallets] Error fetching wallets:`, e);
    return [];
  }
}

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find(w => w.crypto_symbol === cryptoSymbol) || null;
}

function readString(raw: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = raw?.[key];
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
 * Largest plausible *human* amount, keyed by the asset's decimals.
 * An integer at or above this is almost certainly stored in base units
 * (satoshis, drops, sun, lamports, wei).
 */
const HUMAN_MAX_BY_DECIMALS: Record<number, number> = {
  6: 1_000_000_000,
  8: 1_000,
  9: 1_000_000,
  18: 1_000_000_000,
};

/**
 * Converts a stored/legacy wallet amount into its human display value.
 * Fractional values pass through untouched; integers that look like base
 * units are divided by 10^decimals for that asset. Nothing is hardcoded
 * per transaction — this is pure unit inference and applies to every coin,
 * not just BTC.
 */
export function normalizeWalletDisplayAmount(
  amount: number | string | null | undefined,
  symbol?: string | null,
): number {
  const raw = typeof amount === "string" ? Number(amount) : amount;
  if (raw == null || !Number.isFinite(raw) || raw === 0) return 0;

  const sign = raw < 0 ? -1 : 1;
  const value = Math.abs(raw);
  if (!Number.isInteger(value)) return sign * value;

  const decimals = getAssetDecimals(symbol);
  const threshold = HUMAN_MAX_BY_DECIMALS[decimals] ?? 1_000_000;
  if (value >= threshold) return sign * (value / Math.pow(10, decimals));

  return sign * value;
}

function readAmount(raw: any, symbol?: string | null): number {
  const value = raw?.amount ?? raw?.tokenAmount ?? raw?.value_decimal ?? raw?.value;
  const candidate = typeof value === "object"
    ? value?.uiAmountString ?? value?.uiAmount ?? value?.amount ?? value?.value
    : value;
  const explicitAmount = typeof candidate === "string" && candidate.startsWith("0x")
    ? parseInt(candidate, 16)
    : Number(candidate);

  // The deposit monitor returns both:
  //   amount    — display units, e.g. "0.00001" BTC
  //   amountRaw — smallest units, e.g. "1000" satoshis
  //
  // Some deployed monitor versions put the raw value in `amount` while
  // retaining `amountRaw`. Prefer the authoritative raw value when the two
  // disagree so the activity sheet cannot show base units as whole coins.
  const rawValue = raw?.amountRaw
    ?? raw?.valueRaw
    ?? (typeof raw?.tokenAmount === "object" ? raw.tokenAmount?.amount : undefined);

  // Decimals from the payload when present, otherwise the per-asset fallback.
  const payloadDecimals = Number(
    raw?.decimals ?? (typeof raw?.tokenAmount === "object" ? raw.tokenAmount?.decimals : undefined),
  );
  const assetDecimals = getAssetDecimals(symbol);
  // Only trust payload decimals when they are plausible. Some monitor builds
  // send `decimals: 0` alongside base units, which would leave 1000 satoshis
  // rendered as "1,000 BTC".
  const decimals = Number.isInteger(payloadDecimals) && payloadDecimals > 0 && payloadDecimals <= 36
    ? payloadDecimals
    : assetDecimals;

  if (rawValue != null) {
    try {
      const rawString = String(rawValue).trim();
      const rawUnits = rawString.startsWith("0x")
        ? BigInt(rawString)
        : /^[+-]?\d+$/.test(rawString) ? BigInt(rawString) : null;
      if (rawUnits !== null) {
        const scaledAmount = Number(rawUnits) / Math.pow(10, decimals);
        // Safety net: if the payload decimals were wrong, the result is still
        // an integer in base units. Re-run unit inference for the asset.
        if (Number.isFinite(scaledAmount)) return normalizeWalletDisplayAmount(scaledAmount, symbol);
      }
    } catch {
      // Fall through to the display-unit value for malformed upstream data.
    }
  }

  // No raw field: the monitor may still be handing us base units in `amount`.
  return normalizeWalletDisplayAmount(
    Number.isFinite(explicitAmount) ? explicitAmount : 0,
    symbol,
  );
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
  const type = isDeposit
    ? "deposit"
    : sameAddress(from, target.address)
      ? "withdrawal"
      : raw?.type === "swap" ? "swap" : "deposit";

  const rawStatus = String(raw?.status ?? "").toLowerCase();
  const status: WalletTransaction["status"] =
    rawStatus === "failed" || raw?.success === false
      ? "failed"
      : rawStatus === "pending" || raw?.confirmed === false
        ? "pending"
        : "completed";

  const symbol = (
    readString(raw, "crypto_symbol", "cryptoSymbol", "symbol", "tokenSymbol", "asset") ??
    (
      target.chain === "BSC" ? "BNB" :
      target.chain === "POLYGON" ? "POL" :
      target.chain === "BASE" || target.chain === "ARBITRUM" || target.chain === "OPTIMISM" ? "ETH" :
      target.chain
    )
  ).toUpperCase();

  return {
    id: `onchain:${target.chain}:${hash}:${symbol}`,
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
    confirmations: Number(raw?.confirmations ?? 0) || null,
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
      amount: normalizeWalletDisplayAmount(w.amount, w.cryptoSymbol),
      fee: 0,
      status: "pending" as const,
      tx_hash: w.txHash,
      from_address: w.fromAddress,
      to_address: w.toAddress,
      reference_id: w.txHash,
      notes: "Broadcast from non-custodial wallet",
      confirmations: null,
      created_at: w.createdAt,
      completed_at: null,
    }));
}

/**
 * Read wallet activity from the same public-address monitor used for balances.
 * Deposits come from the chain scanner. Withdrawals are read from the user's
 * outbound activity index because the deposit scanner only searches transfers
 * into the wallet.
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

  // Outbound transfers are not discoverable through monitor-deposits. Read
  // the user's own rows to locate their tx hashes, then verify pending hashes
  // through the dedicated withdrawal monitor.
  for (const tx of readLocalWithdrawals(userId, limit)) {
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
