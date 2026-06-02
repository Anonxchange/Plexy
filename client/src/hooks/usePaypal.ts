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
   *  1. Tell the edge function WHAT the user is buying (product/operator + denomination).
   *     The server fetches the real price from Reloadly — the browser never sets the amount.
   *  2. Open the PayPal popup for user approval.
   *  3. Capture the order — the server retrieves the amount from PayPal's own API.
   *
   * Returns the capture result on success, or null on failure/cancellation.
   */
  const checkout = async (
    payload: PayPalProductPayload,
  ): Promise<PayPalCaptureResult | null> => {
    setLoading(true);
    try {
      const supabase = await getSupabase();

      /* Step 1 — create order (amount set server-side from Reloadly) */
      const { data: createData, error: createError } = await supabase.functions.invoke("paypal", {
        body: { action: "create", ...payload },
      });
      if (createError) throw new Error(createError.message);

      const orderId: string         = createData.id;
      const verifiedAmount: number  = createData.verifiedAmount;
      const currency: string        = createData.currency ?? "USD";

      /* Step 2 — open PayPal popup */
      const approvalUrl = `https://www.paypal.com/checkoutnow?token=${orderId}`;
      const popup = window.open(approvalUrl, "paypal", "width=500,height=700");

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site to complete payment.");
      }

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

      /* Step 3 — capture (only order_id goes to the server; amount comes from PayPal) */
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
