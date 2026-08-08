// src/hooks/use-sms-orders.ts
//
// Client hooks for the PAY-FIRST flow.
//
//   buy/reuse  -> korapay-initiate  (creates sms_orders row + Korapay checkout)
//   listing    -> fleexa?action=my-numbers
//   polling    -> fleexa?action=code&orderId=...
//   cancel     -> fleexa?action=cancel&orderId=...
//
// FIXES IN THIS REVISION
//   1. `retry: 0` on initiate. react-query's default retry:3 turned one failed
//      tap into four Korapay charges — the direct cause of the 429s.
//   2. A stable idempotencyKey is sent per (server, appId, countryId, intent)
//      so a double tap or a browser-level retry collides server-side.
//   3. An in-flight guard: initiate cannot be entered twice concurrently.
//   4. Poll loops back off on 429/503 instead of hammering, and stop after
//      repeated failures rather than spinning forever.
//   5. HTTP status is carried on the thrown error so callers can react.
//
// NOTE: adjust the supabase import path to whatever your project uses
// (e.g. "@/lib/supabase" or "@/integrations/supabase/client").

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export class FnError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FnError";
    this.status = status;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You need to be signed in.");
  return {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    "Content-Type": "application/json",
  };
}

async function callFn<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${FUNCTIONS_BASE}/${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new FnError(
      (body as any)?.error ?? `Request failed (${res.status})`,
      res.status,
    );
  }
  return body as T;
}

// ── Types ────────────────────────────────────────────────────────────────────
export type SmsOrder = {
  id: string;
  created_at: string;
  status:
    | "pending" | "paid" | "fulfilled" | "code_received"
    | "failed" | "refund_required" | "cancelled" | "expired";
  server: string;
  country_id: string | null;
  app_id: string;
  app_name: string | null;
  amount: string | number;
  phone_number: string | null;
  sms_code: string | null;
  sms_full_text: string | null;
  fleexa_request_id: string | null;
  expires_at: string | null;
  intent: "buy" | "reuse";
  reuse_of: string | null;
  reference: string;
  checkout_url: string | null;
  can_reuse: boolean;
  awaiting_code: boolean;
};

export type InitiateResponse = {
  success: true;
  order_id: string;
  reference: string;
  amount: number;
  currency: "NGN";
  checkout_url?: string;
  reused?: boolean;
};

export type InitiateInput = {
  server: string;
  appId: string;
  countryId?: string;
  intent?: "buy" | "reuse";
  reuseOf?: string;
};

// ── 1. Start a purchase (pay first) ──────────────────────────────────────────

/**
 * Stable per-intent key. Two taps on the same service inside the same session
 * produce the same key, so the server returns the existing checkout instead of
 * asking Korapay for a second charge.
 */
function idempotencyKeyFor(input: InitiateInput): string {
  const parts = [
    input.intent ?? "buy",
    input.server,
    input.appId,
    input.countryId ?? "",
    input.reuseOf ?? "",
    // Bucket by 10-minute window so a genuine later purchase is not blocked.
    Math.floor(Date.now() / (10 * 60 * 1000)),
  ];
  return parts.join(":");
}

/** Module-level guard: one initiate in flight at a time, app-wide. */
let initiateInFlight: Promise<InitiateResponse> | null = null;

export function useInitiateOrder() {
  return useMutation<InitiateResponse, Error, InitiateInput>({
    // CRITICAL: no automatic retries. Each retry is a real payment attempt.
    retry: 0,
    mutationFn: (input) => {
      if (initiateInFlight) return initiateInFlight;
      const promise = callFn<InitiateResponse>("korapay-initiate", {
        method: "POST",
        body: JSON.stringify({ ...input, idempotencyKey: idempotencyKeyFor(input) }),
      }).finally(() => {
        initiateInFlight = null;
      });
      initiateInFlight = promise;
      return promise;
    },
  });
}

/** Redirect the browser to Korapay's hosted checkout. */
export function goToCheckout(res: InitiateResponse) {
  if (!res.checkout_url) throw new Error("Payment could not be started. Please try again.");
  window.location.href = res.checkout_url;
}

// ── 2. My numbers ────────────────────────────────────────────────────────────
export function useMyNumbers(enabled = true) {
  return useQuery({
    queryKey: ["sms-orders"],
    enabled,
    retry: 1,
    refetchInterval: (q) => {
      // Back off rather than hammer a rate-limited or booting function.
      if (q.state.status === "error") return 15000;
      const rows = (q.state.data as { data: SmsOrder[] } | undefined)?.data ?? [];
      // Poll while anything is still in flight (payment landing / SMS pending).
      return rows.some((o) => o.status === "pending" || o.status === "paid" || o.awaiting_code)
        ? 5000
        : false;
    },
    queryFn: () => callFn<{ data: SmsOrder[] }>("fleexa?action=my-numbers&limit=50"),
    select: (r) => r.data,
  });
}

// ── 3. Poll one order for its SMS code ───────────────────────────────────────
const MAX_CODE_POLL_FAILURES = 5;

export function useOrderCode(orderId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["sms-order-code", orderId],
    enabled: !!orderId && enabled,
    retry: 0,
    refetchInterval: (q) => {
      // Give up after repeated failures instead of polling a broken endpoint.
      if (q.state.fetchFailureCount >= MAX_CODE_POLL_FAILURES) return false;
      if (q.state.status === "error") {
        const status = (q.state.error as FnError | null)?.status;
        return status === 429 || status === 503 ? 20000 : 10000;
      }
      return (q.state.data as any)?.data?.code ? false : 5000;
    },
    queryFn: () =>
      callFn<{ data: { status: string; number: string | null; code: string | null; message?: string | null } }>(
        `fleexa?action=code&orderId=${encodeURIComponent(orderId!)}`,
      ),
    select: (r) => r.data,
  });
}

// ── 4. Cancel ────────────────────────────────────────────────────────────────
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    retry: 0,
    mutationFn: (orderId: string) =>
      callFn(`fleexa?action=cancel&orderId=${encodeURIComponent(orderId)}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sms-orders"] }),
  });
}

// ── 5. Reuse (server 1 only — also pay-first) ────────────────────────────────
export function useReuseNumber() {
  const initiate = useInitiateOrder();
  return {
    ...initiate,
    reuse: async (previousOrderId: string) => {
      const res = await initiate.mutateAsync({
        // server/appId/countryId are resolved server-side from the previous order
        server: "1",
        appId: "",
        intent: "reuse",
        reuseOf: previousOrderId,
      });
      goToCheckout(res);
    },
  };
}
