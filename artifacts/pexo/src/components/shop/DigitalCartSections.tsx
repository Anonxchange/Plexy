import { useState } from "react";
import { Gift, Smartphone, Minus, Plus, Trash2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { useTopupCart } from "@/hooks/use-topup-cart";
import { giftCardCartOrder, openCartCheckout, topupCartOrder } from "@/lib/cart-checkout";
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

  return <>
    <section aria-labelledby="gift-cart-title" className="rounded-2xl border p-4 space-y-4">
      <h3 id="gift-cart-title" className="font-bold flex items-center gap-2">
        <Gift className="h-4 w-4" /> Gift cards
      </h3>
      {!giftCards.items.length ? <p className="text-sm text-muted-foreground">No gift cards added yet.</p> : <>
        {giftCards.items.map(item => <div key={item.id} className="border-b pb-4 space-y-2">
          <div className="flex gap-3">
            {item.image && <img src={item.image} alt="" className="h-12 w-16 rounded-lg object-contain" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.recipientAmount != null && <p className="text-xs text-muted-foreground">Card value: {item.recipientAmount} {item.recipientCurrency}</p>}
              <p className="text-sm">{(item.price * item.quantity).toFixed(2)} {item.currency.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button className="text-xs underline" onClick={() => giftCards.removeItem(item.id)} aria-label={`Remove ${item.title} gift card`}>Remove</button>
            <div className="flex items-center gap-3">
              <Button size="icon" variant="outline" className="h-7 w-7" aria-label={`Decrease ${item.title} gift card quantity`} onClick={() => item.quantity === 1 ? giftCards.removeItem(item.id) : giftCards.updateQuantity(item.id, item.quantity - 1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm tabular-nums">{item.quantity}</span>
              <Button size="icon" variant="outline" className="h-7 w-7" disabled={item.quantity >= 999} aria-label={`Increase ${item.title} gift card quantity`} onClick={() => giftCards.updateQuantity(item.id, item.quantity + 1)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>)}
        <p className="text-xs text-muted-foreground">Gift cards have their own checkout. Any service fees are shown there.</p>
        <Button className="w-full rounded-full" disabled={busy} onClick={checkoutGiftCards}>
          {busy ? "Preparing checkout…" : "Checkout gift cards"}
        </Button>
      </>}
    </section>
    <section aria-labelledby="topup-cart-title" className="rounded-2xl border p-4 space-y-4">
      <h3 id="topup-cart-title" className="font-bold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile top-ups</h3>
      {!topups.items.length ? <p className="text-sm text-muted-foreground">No mobile top-ups added yet.</p> : <>
        <p className="text-xs text-muted-foreground">Each recipient checks out separately. Confirm the number and amount before paying.</p>
        {topups.items.map(item => <div key={item.id} className="border-b pb-4 space-y-3">
          <div className="flex items-start gap-3">
            {item.image && <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-contain" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs break-all text-muted-foreground">{item.metadata.recipientPhone} · {item.metadata.recipientCountryCode}</p>
              <p className="text-sm">{item.amount.toFixed(2)} {item.currency.toUpperCase()}</p>
            </div>
            <Button size="icon" variant="ghost" aria-label={`Remove ${item.title} for ${item.metadata.recipientPhone}`} onClick={() => topups.removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <Button variant="outline" className="w-full rounded-full" onClick={() => {
            try { openCartCheckout(topupCartOrder(item)); }
            catch { toast.error("Could not open top-up checkout. Allow browser storage and try again."); }
          }}>Checkout top-up</Button>
        </div>)}
      </>}
    </section>
  </>;
}
