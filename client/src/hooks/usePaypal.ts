import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export function usePayPal() {
  const [loading, setLoading] = useState(false);

  const createAndCaptureOrder = async (amount: number, currency = "USD") => {
    setLoading(true);
    try {
      // Step 1: Create order
      const { data: createData, error: createError } = await supabase.functions.invoke("paypal", {
        body: { action: "create", amount, currency },
      });
      if (createError) throw createError;

      const orderId = createData.id;

      // Step 2: Open PayPal approval in popup
      const approvalUrl = `https://www.paypal.com/checkoutnow?token=${orderId}`;
      const popup = window.open(approvalUrl, "paypal", "width=500,height=700");

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for PayPal.");
      }

      // Wait for popup to close (user approved or cancelled)
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            resolve();
          }
        }, 500);
        // Timeout after 10 minutes
        setTimeout(() => {
          clearInterval(interval);
          popup.close();
          reject(new Error("PayPal payment timed out"));
        }, 600000);
      });

      // Step 3: Capture the order
      const { data: captureData, error: captureError } = await supabase.functions.invoke("paypal", {
        body: { action: "capture", order_id: orderId },
      });
      if (captureError) throw captureError;

      if (captureData.status === "COMPLETED") {
        toast({ title: "Payment successful", description: `$${amount} deposited via PayPal` });
        return captureData;
      } else {
        throw new Error("Payment was not completed");
      }
    } catch (err: any) {
      toast({ title: "PayPal error", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createAndCaptureOrder, loading };
}
