// src/hooks/use-sms-orders.ts
//
// Client hooks for the PAY-FIRST flow.
//
//   buy/reuse  -> korapay-initiate  (creates sms_orders row + Korapay checkout)
//   listing    -> fleexa?action=my-numbers
//   polling    -> fleexa?action=code&orderId=...
//   cancel     -> fleexa?action=cancel&orderId=...
//
// The old `useBuyVirtualNumber` is intentionally left in place — the edge
// function now answers it with 403, so nothing silently spends money.
//
// NOTE: adjust the supabase import path to whatever your project uses
// (e.g. "@/lib/supabase" or "@/integrations/supabase/client").

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

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
  if (!res.ok) throw new Error((body as any)?.error ?? `Request failed (${res.status})`);
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
};

// ── 1. Start a purchase (pay first) ──────────────────────────────────────────
export function useInitiateOrder() {
  return useMutation({
    mutationFn: (input: {
      server: string;
      appId: string;
      countryId?: string;
      intent?: "buy" | "reuse";
      reuseOf?: string;
    }) =>
      callFn<InitiateResponse>("korapay-initiate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
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
    refetchInterval: (q) => {
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
export function useOrderCode(orderId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["sms-order-code", orderId],
    enabled: !!orderId && enabled,
    refetchInterval: (q) =>
      (q.state.data as any)?.data?.code ? false : 5000,
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
