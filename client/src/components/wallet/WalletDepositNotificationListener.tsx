import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWalletActivity } from "@/hooks/use-wallet-activity";
import { useAuth } from "@/lib/auth-context";
import { ToastAction } from "@/components/ui/toast";

const SEEN_KEY_PREFIX = "pexly_seen_wallet_deposits_v1";
const MAX_SEEN_IDS = 200;

function seenKey(userId: string) {
  return `${SEEN_KEY_PREFIX}_${userId}`;
}

function readSeenIds(userId: string): Set<string> {
  try {
    const value = JSON.parse(localStorage.getItem(seenKey(userId)) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function hasSeenState(userId: string) {
  try {
    return localStorage.getItem(seenKey(userId)) !== null;
  } catch {
    return false;
  }
}

function saveSeenIds(userId: string, ids: Set<string>) {
  try {
    localStorage.setItem(seenKey(userId), JSON.stringify(Array.from(ids).slice(-MAX_SEEN_IDS)));
  } catch {
    // Local storage is only a duplicate-alert guard; it is not app state.
  }
}

function formatAmount(amount: number, symbol: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `— ${symbol.toUpperCase()}`;
  const formatted = value < 0.0001
    ? value.toExponential(4)
    : value.toLocaleString("en-US", { maximumFractionDigits: 8, useGrouping: false });
  return `${formatted} ${symbol.toUpperCase()}`;
}

/**
 * Shows an in-app alert for deposits discovered by the on-chain monitor.
 *
 * The first successful read is baseline-only, preventing historical deposits
 * from generating a burst of alerts after login. Later refreshes alert only
 * transaction IDs not seen before. This intentionally does not write to
 * wallet_transactions or notifications: the chain remains authoritative.
 */
export function WalletDepositNotificationListener() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: transactions, isSuccess } = useWalletActivity();
  const initializedUserRef = useRef<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId || !isSuccess || !transactions) return;

    const seen = readSeenIds(userId);
    const isFirstRead = initializedUserRef.current !== userId;
    const deposits = transactions.filter((tx) => tx.type === "deposit");

    // On a brand-new browser, baseline existing history so login does not
    // produce a burst of old alerts. If this user already has a local
    // baseline, compare against it so deposits received while offline alert
    // on the next successful read.
    if (isFirstRead && !hasSeenState(userId)) {
      deposits.forEach((tx) => seen.add(tx.id));
      initializedUserRef.current = userId;
      saveSeenIds(userId, seen);
      return;
    }
    initializedUserRef.current = userId;

    const newDeposits = deposits
      .filter((tx) => !seen.has(tx.id))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    newDeposits.forEach((tx) => {
      seen.add(tx.id);
      toast({
        title: "Deposit received",
        description: `${formatAmount(tx.amount, tx.crypto_symbol)} has arrived in your wallet.`,
        action: (
          <ToastAction altText="View activity" onClick={() => navigate("/wallet?tab=activity")}>
            View activity
          </ToastAction>
        ),
        duration: 7000,
      });
    });

    saveSeenIds(userId, seen);
  }, [isSuccess, toast, transactions, userId]);

  return null;
}