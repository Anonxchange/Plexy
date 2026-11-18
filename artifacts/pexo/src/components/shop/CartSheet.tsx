import { ShoppingCart, Minus, Plus, Trash2, Loader2, ExternalLink } from "@/lib/icons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-shopify-cart";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { useTopupCart } from "@/hooks/use-topup-cart";
import { useState, useEffect, type ReactElement } from "react";
import { DigitalCartSections } from "./DigitalCartSections";

export function CartSheet({
  renderTrigger,
  initiallyOpen = false,
  open,
  onOpenChange,
}: {
  renderTrigger?: (itemCount: number) => ReactElement;
  initiallyOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(initiallyOpen);
  const isOpen = open ?? internalOpen;
  const setIsOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const { items, cartId, checkoutUrl, isLoading, marketError, updateQuantity, removeItem, refreshCart } = useCart();
  const gifts = useGiftCardCart();
  const topups = useTopupCart();
  const itemCount = items.reduce((n, item) => n + item.quantity, 0)
    + gifts.items.reduce((n, item) => n + item.quantity, 0) + topups.items.length;
  const shopSubtotal = items.reduce((n, item) => n + Number(item.price) * item.quantity, 0);
  const shopCurrency = items[0]?.currency || "USD";
  const shopUnavailable = items.some(item => item.availableForSale === false);

  // Refresh once on opening, not on every loading transition.
  useEffect(() => {
    if (isOpen && cartId) void refreshCart();
  }, [isOpen, cartId, refreshCart]);

  useEffect(() => {
    if (initiallyOpen) setInternalOpen(true);
  }, [initiallyOpen]);

  return <Sheet open={isOpen} onOpenChange={setIsOpen}>
    {open === undefined && <SheetTrigger asChild>
      {renderTrigger ? renderTrigger(itemCount) : <Button variant="ghost" size="icon" className="relative" aria-label={`Open cart, ${itemCount} items`}>
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && <Badge className="absolute -top-2 -right-2 rounded-full px-1.5">{itemCount}</Badge>}
      </Button>}
    </SheetTrigger>}
    <SheetContent className="w-full sm:max-w-lg flex flex-col h-[100dvh] p-0 gap-0">
      <SheetHeader className="p-6 pr-12 border-b text-left">
        <SheetTitle>Your cart ({itemCount})</SheetTitle>
        <SheetDescription>All your items in one place. Shop, gift cards, and top-ups check out separately.</SheetDescription>
      </SheetHeader>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
        {itemCount === 0 && <p className="rounded-xl bg-muted p-4 text-sm">Your cart is empty. Add products, gift cards, or a mobile top-up to get started.</p>}
        <section aria-labelledby="shop-cart-title" className="rounded-2xl border p-4 space-y-4">
          <h3 id="shop-cart-title" className="font-bold flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Shop items</h3>
          {marketError && <p className="text-sm text-destructive" role="alert">{marketError}</p>}
          {isLoading && items.length > 0 && <p className="text-sm" role="status">Updating shop cart…</p>}
          {isLoading && !items.length ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading shop cart" /> :
            !items.length ? <p className="text-sm text-muted-foreground">No shop items added yet.</p> :
            <>
              {items.map(item => <div key={item.id} className="border-b pb-4 space-y-3">
                <div className="flex gap-3">
                  {item.image && <img src={item.image} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-sm">{(Number(item.price) * item.quantity).toFixed(2)} {item.currency}</p>
                    {item.availableForSale === false && <p className="text-xs text-destructive">Currently unavailable</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button className="text-xs underline disabled:opacity-50" disabled={isLoading} onClick={() => void removeItem(item.id)} aria-label={`Remove ${item.title} shop item`}>Remove</button>
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="outline" className="h-7 w-7" disabled={isLoading} aria-label={`Decrease ${item.title} shop quantity`} onClick={() => void (item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1))}>
                      {item.quantity === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    </Button>
                    <span className="text-sm tabular-nums">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" disabled={isLoading} aria-label={`Increase ${item.title} shop quantity`} onClick={() => void updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>)}
              <div className="flex justify-between font-semibold text-sm"><span>Shop subtotal</span><span>{shopSubtotal.toFixed(2)} {shopCurrency}</span></div>
              <p className="text-xs text-muted-foreground">Shipping and applicable taxes are calculated at Shopify checkout.</p>
              <Button className="w-full rounded-full" disabled={isLoading || !!marketError || !checkoutUrl || shopUnavailable} onClick={() => {
                if (checkoutUrl && !isLoading && !marketError && !shopUnavailable) window.location.assign(checkoutUrl);
              }}>Checkout shop items <ExternalLink className="ml-2 h-3 w-3" /></Button>
            </>}
        </section>
        <DigitalCartSections />
      </div>
      <div className="border-t p-4"><Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>Continue browsing</Button></div>
    </SheetContent>
  </Sheet>;
}
