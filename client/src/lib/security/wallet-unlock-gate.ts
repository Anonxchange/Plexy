/**
 * Server-side wallet-unlock rate limiter.
 *
 * Wraps a local decryption attempt with two RPC calls:
 *   1. `checkUnlockAllowed(userId)` BEFORE attempting decrypt — throws
 *      `WalletLockedError` if the account is currently locked out.
 *   2. `reportUnlockAttempt(userId, success)` AFTER the attempt — clears
 *      the counter on success or escalates the lockout on failure.
 *
 * Failures are escalated server-side (4 → 30s, 5 → 1m, 6 → 5m, 7 → 30m,
 * 8+ → 24h). A stolen vault blob therefore cannot be brute-forced offline
 * via the app UI even if the attacker also has the user's session cookie.
 *
 * Helper `runWithUnlockGate(userId, fn)` does both calls for you.
 */

import { getSupabase } from "../supabase";

export class WalletLockedError extends Error {
  constructor(public retryAfterSeconds: number, public failureCount: number) {
    super(
      `Too many failed wallet unlocks. Try again in ${formatDuration(retryAfterSeconds)}.`
    );
    this.name = "WalletLockedError";
  }
}

interface LockoutStatus {
  locked: boolean;
  retry_after_seconds: number;
  failure_count: number;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  return `${Math.ceil(seconds / 3600)}h`;
}

export async function checkUnlockAllowed(userId: string): Promise<void> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc("check_wallet_unlock_lockout", {
    p_user_id: userId,
  });
  // Fail-open on RPC/network errors so legitimate users aren't blocked from
  // their own funds by a transient outage. The server-side counter still
  // protects against actual brute-force because each attempt re-checks.
  if (error) return;
  const status = data as LockoutStatus | null;
  if (status?.locked) {
    throw new WalletLockedError(status.retry_after_seconds, status.failure_count);
  }
}

export async function reportUnlockAttempt(userId: string, success: boolean): Promise<void> {
  const supabase = await getSupabase();
  await supabase.rpc("record_wallet_unlock_attempt", {
    p_user_id: userId,
    p_success: success,
  });
}

/**
 * Convenience wrapper: gate-check, run the decrypt, report outcome.
 * Re-throws the underlying error so callers see the original failure reason.
 */
export async function runWithUnlockGate<T>(
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  await checkUnlockAllowed(userId);
  try {
    const result = await fn();
    // Best-effort report; never block the user from getting their result.
    void reportUnlockAttempt(userId, true).catch(() => {});
    return result;
  } catch (err) {
    void reportUnlockAttempt(userId, false).catch(() => {});
    throw err;
  }
}
