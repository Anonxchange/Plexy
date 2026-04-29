import { safeCryptoSymbol, sanitizeText } from "@/lib/sanitize";
import { isValidAmount, isValidNumber } from "@/lib/validators";
import type { Wallet, WalletTransaction } from "@/hooks/use-wallet-balances";

/**
 * Maps a raw Wallet record for safe display.
 *
 * IMPORTANT: deposit_address is passed through WITHOUT sanitization.
 * Wallet addresses must NEVER be sanitized — only validated at point of use.
 * Sanitizing an address could silently corrupt it and cause fund loss.
 */
export function mapWallet(raw: unknown): Wallet {
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.id === "string" ? r.id : "",
    user_id: typeof r.user_id === "string" ? r.user_id : "",
    crypto_symbol: safeCryptoSymbol(typeof r.crypto_symbol === "string" ? r.crypto_symbol : ""),
    balance: isValidAmount(r.balance) ? r.balance : 0,
    locked_balance: isValidAmount(r.locked_balance) ? r.locked_balance : 0,
    deposit_address: typeof r.deposit_address === "string" ? r.deposit_address : null,
    chain_id: sanitizeText(typeof r.chain_id === "string" ? r.chain_id : ""),
    created_at: typeof r.created_at === "string" ? r.created_at : "",
    updated_at: typeof r.updated_at === "string" ? r.updated_at : "",
  };
}

/**
 * Maps a raw WalletTransaction for safe display.
 *
 * IMPORTANT: tx_hash, from_address, to_address are passed through WITHOUT
 * sanitization. These are cryptographic values — sanitizing them would
 * corrupt their content. They must only be validated before display.
 */
export function mapWalletTransaction(raw: unknown): WalletTransaction {
  const r = raw as Record<string, unknown>;
  const validTypes = [
    "deposit", "withdrawal", "swap", "p2p_buy", "p2p_sell",
    "escrow_lock", "escrow_release", "fee",
  ] as const;
  const validStatuses = ["pending", "completed", "failed", "cancelled"] as const;

  const type = validTypes.includes(r.type as any)
    ? (r.type as WalletTransaction["type"])
    : "deposit";

  const status = validStatuses.includes(r.status as any)
    ? (r.status as WalletTransaction["status"])
    : "pending";

  return {
    id: typeof r.id === "string" ? r.id : "",
    user_id: typeof r.user_id === "string" ? r.user_id : "",
    wallet_id: typeof r.wallet_id === "string" ? r.wallet_id : "",
    type,
    crypto_symbol: safeCryptoSymbol(typeof r.crypto_symbol === "string" ? r.crypto_symbol : ""),
    amount: isValidAmount(r.amount) ? r.amount : 0,
    fee: isValidAmount(r.fee) ? r.fee : 0,
    status,
    tx_hash: typeof r.tx_hash === "string" ? r.tx_hash : null,
    from_address: typeof r.from_address === "string" ? r.from_address : null,
    to_address: typeof r.to_address === "string" ? r.to_address : null,
    reference_id: typeof r.reference_id === "string" ? r.reference_id : null,
    notes: typeof r.notes === "string" ? sanitizeText(r.notes) : null,
    confirmations: isValidNumber(r.confirmations) ? r.confirmations : null,
    created_at: typeof r.created_at === "string" ? r.created_at : "",
    completed_at: typeof r.completed_at === "string" ? r.completed_at : null,
  };
}
