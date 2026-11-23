import { useState } from "react";
import { Gift, Smartphone, Minus, Plus, Trash2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { useTopupCart } from "@/hooks/use-topup-cart";
import { giftCardCartOrder, openCartCheckout, topupCartOrder } from "@/lib/cart-checkout";
import { formatPrice } from "@/lib/shopify-service";
import { toast } from "sonner";

export function DigitalCartSections() {
  const giftCards = useGiftCardCart();
  const topups = useTopupCart();
  const [busy, setBusy] = useState(false);

  const checkoutGiftCards = async () => {
    setBusy(true);
    try {
      openCartCheckout(await giftCardCartOrder(giftCards.items));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open gift-card checkout.");
    } finally { setBusy(false); }
  };

  if (!giftCards.items.length && !topups.items.length) return null;

  const giftSubtotal = giftCards.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const giftCurrency = giftCards.items[0]?.currency?.toUpperCase() || "USD";

  return (
    <>
      {giftCards.items.length > 0 && (
        <section aria-labelledby="gift-cart-title" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 id="gift-cart-title" className="text-base font-medium text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-muted-foreground" /> Gift cards
            </h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {giftCards.items.reduce((n, item) => n + item.quantity, 0)} {giftCards.items.reduce((n, item) => n + item.quantity, 0) === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {giftCards.items.map(item => (
              <div key={item.id} className="py-4 first:pt-1 flex gap-3.5 items-start">
                {item.image && (
                  <div className="h-16 w-20 rounded-xl bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                    <img src={item.image} alt="" className="h-full w-full object-contain" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{item.title}</p>
                      {item.recipientAmount != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Card value: {item.recipientAmount} {item.recipientCurrency}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="p-1 -mr-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      onClick={() => giftCards.removeItem(item.id)}
                      aria-label={`Remove ${item.title} gift card`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {formatPrice(item.price * item.quantity, item.currency.toUpperCase())}
                    </p>
                    <div className="inline-flex items-center rounded-full border border-border bg-background h-8">
                      <button
                        type="button"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-l-full text-foreground hover:bg-muted/60 transition-colors"
                        aria-label={`Decrease ${item.title} gift card quantity`}
                        onClick={() => item.quantity === 1 ? giftCards.removeItem(item.id) : giftCards.updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2.5 text-sm font-medium tabular-nums select-none">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={item.quantity >= 999}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-r-full text-foreground hover:bg-muted/60 disabled:opacity-40 transition-colors"
                        aria-label={`Increase ${item.title} gift card quantity`}
                        onClick={() => giftCards.updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-base font-semibold text-foreground">
              <span>Gift card subtotal</span>
              <span className="tabular-nums">{formatPrice(giftSubtotal, giftCurrency)}</span>
            </div>
            <Button className="w-full h-11 rounded-full font-bold uppercase tracking-wide" disabled={busy} onClick={checkoutGiftCards}>
              {busy ? "Preparing checkout…" : "Checkout gift cards"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Gift cards check out separately. Any service fees are shown at checkout.
            </p>
          </div>
        </section>
      )}
      {topups.items.length > 0 && (
        <section aria-labelledby="topup-cart-title" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 id="topup-cart-title" className="text-base font-medium text-foreground flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" /> Mobile top-ups
            </h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {topups.items.length} {topups.items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Each recipient checks out separately. Confirm the number and amount before paying.
          </p>
          <div className="divide-y divide-border/60">
            {topups.items.map(item => (
              <div key={item.id} className="py-4 first:pt-1 space-y-3">
                <div className="flex items-start gap-3.5">
                  {item.image && (
                    <div className="h-14 w-14 rounded-xl bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                      <img src={item.image} alt="" className="h-full w-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
                      <button
                        type="button"
                        className="p-1 -mr-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        aria-label={`Remove ${item.title} for ${item.metadata.recipientPhone}`}
                        onClick={() => topups.removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs break-all text-muted-foreground mt-0.5">
                      {item.metadata.recipientPhone} · {item.metadata.recipientCountryCode}
                    </p>
                    <p className="text-sm font-bold text-foreground tabular-nums mt-1.5">
                      {formatPrice(item.amount, item.currency.toUpperCase())}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full h-11 rounded-full font-bold uppercase tracking-wide"
                  onClick={() => {
                    try { openCartCheckout(topupCartOrder(item)); }
                    catch { toast.error("Could not open top-up checkout. Allow browser storage and try again."); }
                  }}
                >
                  Checkout top-up
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
