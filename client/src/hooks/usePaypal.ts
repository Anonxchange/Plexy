import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

/* ── Payload types ─────────────────────────────────────────────────────── */

export interface GiftCardPayload {
  productType: "giftcard";
  productId: number;
  denomination: number;
}

export interface AirtimePayload {
  productType: "airtime";
  operatorId: number;
  amount: number;
}

/** For multi-item gift-card carts or utility bills whose amounts are
 *  already Reloadly-sourced. The edge function validates bounds ($1–$50k). */
export interface TotalPayload {
  productType: "total";
  amount: number;
  currency?: string;
}

export type PayPalProductPayload = GiftCardPayload | AirtimePayload | TotalPayload;

/* ── Return type ───────────────────────────────────────────────────────── */

export interface PayPalCaptureResult {
  status: "COMPLETED";
  capturedAmount: number;
  capturedCurrency: string;
  paypalOrderId: string;
  captureId: string;
}

/* ── Hook ──────────────────────────────────────────────────────────────── */

export function usePayPal() {
  const [loading, setLoading] = useState(false);

  /**
   * Full PayPal checkout flow:
   *  1. Open a blank popup immediately (must be synchronous — direct user gesture).
   *  2. Tell the edge function WHAT the user is buying; server fetches the real
   *     price from Reloadly — the browser never sets the amount.
   *  3. Navigate the already-open popup to the PayPal approval URL.
   *  4. Capture the order — server retrieves the amount from PayPal's own API.
   *
   * Returns the capture result on success, or null on failure/cancellation.
   */
  const checkout = async (
    payload: PayPalProductPayload,
  ): Promise<PayPalCaptureResult | null> => {
    /* ── Step 1: open popup synchronously so the browser allows it ── */
    const popup = window.open("about:blank", "paypal", "width=500,height=700");
    if (!popup) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site to complete payment.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const supabase = await getSupabase();

      /* ── Step 2: create order (amount set server-side from Reloadly) ── */
      const { data: createData, error: createError } = await supabase.functions.invoke("paypal", {
        body: { action: "create", ...payload },
      });
      if (createError) {
        popup.close();
        throw new Error(createError.message);
      }

      const orderId: string        = createData.id;
      const currency: string       = createData.currency ?? "USD";

      /* ── Step 3: navigate the already-open popup to PayPal ── */
      popup.location.href = `https://www.paypal.com/checkoutnow?token=${orderId}`;

      await new Promise<void>((resolve, reject) => {
        const poll = setInterval(() => {
          if (popup.closed) {
            clearInterval(poll);
            clearTimeout(timeout);
            resolve();
          }
        }, 500);

        const timeout = setTimeout(() => {
          clearInterval(poll);
          popup.close();
          reject(new Error("PayPal session timed out after 10 minutes."));
        }, 600_000);
      });

      /* ── Step 4: capture (only order_id goes to server; amount from PayPal) ── */
      const { data: captureData, error: captureError } = await supabase.functions.invoke("paypal", {
        body: { action: "capture", order_id: orderId },
      });
      if (captureError) throw new Error(captureError.message);

      if (captureData.status !== "COMPLETED") {
        throw new Error("Payment was not completed. Please try again.");
      }

      toast({
        title: "Payment successful",
        description: `${currency} ${captureData.capturedAmount.toFixed(2)} paid via PayPal`,
      });

      return captureData as PayPalCaptureResult;

    } catch (e: any) {
      if (!popup.closed) popup.close();
      toast({
        title: "PayPal error",
        description: e.message ?? "Something went wrong",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { checkout, loading };
}
