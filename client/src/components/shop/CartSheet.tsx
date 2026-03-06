import { ShoppingCart, Trash2, Plus, Minus, ExternalLink, Loader2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/use-shopify-cart";
import { useState, useEffect } from "react";

export function CartSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, cartId, checkoutUrl, isLoading, updateQuantity, removeItem, refreshCart } = useCart();

  // Refresh cart data when the sheet is opened to ensure accuracy
  // DISABLED: Immediate refresh on open can cause race conditions that clear local state
  /*
  useEffect(() => {
    if (isOpen && cartId) {
      console.log("CartSheet: Refreshing cart on open", cartId);
      refreshCart();
    }
  }, [isOpen, cartId, refreshCart]);
  */

  // Log items for debugging
  useEffect(() => {
    if (isOpen) {
      console.log("CartSheet: Current items", items);
    }
  }, [isOpen, items]);

  const subtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  const currency = items[0]?.currency || "USD";

  // Force a re-render when items change using a dedicated key
  const [renderKey, setRenderKey] = useState(0);
  useEffect(() => {
    setRenderKey(prev => prev + 1);
    console.log("CartSheet: Items changed, updated renderKey", { count: items.length });
  }, [items, cartId]);

  useEffect(() => {
    if (isOpen) {
      const storedCartId = localStorage.getItem('shopify_cart_id');
      const storedCheckoutUrl = localStorage.getItem('shopify_checkout_url');
      
      console.log("CartSheet Opened - Current State:", { 
        itemsCount: items.length, 
        cartId,
        storedCartId,
        checkoutUrl,
        storedCheckoutUrl,
        isLoading,
        renderKey,
        itemsSample: items.slice(0, 1)
      });
      
      // If we have a cart but no checkout URL, we MUST refresh to get it
      // But only if we aren't already loading to prevent duplication
      if (storedCartId && (!checkoutUrl || !storedCheckoutUrl) && !isLoading) {
        console.log("CartSheet: Missing checkout URL, triggering refresh");
        refreshCart();
      }
    }
  }, [isOpen, cartId, checkoutUrl]);


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative h-10 px-4 py-2 border-primary/20 hover:bg-primary/5 transition-all">
          <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
          <span className="font-medium">Cart</span>
          {items.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground border-2 border-background animate-in zoom-in">
              {items.reduce((acc, item) => acc + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-border/40 shadow-2xl overflow-y-auto">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-border/40 bg-muted/30">
          <div>
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Your Shopping Cart
            </SheetTitle>
            <SheetDescription className="mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'} ready for checkout
            </SheetDescription>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden relative min-h-[300px]">
          {isLoading && items.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <ShoppingCart className="h-10 w-10 text-primary/40" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  Explore our Shopify store and add some amazing digital products to your cart.
                </p>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => setIsOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full" key={`cart-scroll-${renderKey}-${items.length}`}>
              <div className="p-6 space-y-6">
                {items.map((item, index) => (
                  <div key={`${item.id || item.variantId}-${index}-${renderKey}`} className="group relative flex gap-4 bg-card p-3 rounded-xl border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="h-24 w-24 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border/20 shadow-inner">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted/50">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2">{item.title}</h4>
                        <p className="text-primary font-bold text-sm">
                          {item.price.toFixed(2)} {item.currency}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/20">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-background shadow-sm disabled:opacity-30"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isLoading || item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-background shadow-sm disabled:opacity-30"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isLoading}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => removeItem(item.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-muted/30 border-t border-border/40 space-y-6 mt-auto">
            <div className="space-y-3">
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{subtotal.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Processing Fee</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold">Order Total</span>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taxes included</p>
                </div>
                <span className="text-2xl font-bold text-primary tracking-tight">
                  {subtotal.toFixed(2)} <span className="text-sm font-medium">{currency}</span>
                </span>
              </div>
            </div>
            
            <div className="space-y-3 pb-8 md:pb-0">
              <Button 
                className="w-full h-14 gap-2 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.95] touch-manipulation relative z-50" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Checkout button clicked, URL:", checkoutUrl);
                  if (checkoutUrl) {
                    // Use a slightly different approach for mobile redirect
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    if (isMobile) {
                      window.location.assign(checkoutUrl);
                    } else {
                      window.location.href = checkoutUrl;
                    }
                  }
                }}
                disabled={isLoading || !checkoutUrl}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5" />
                    Complete Checkout
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-1.5 opacity-60">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-4h2v4zm0-6h-2V7h2v3z"/></svg>
                <p className="text-[11px] font-medium text-center">
                  Securely processed by Shopify Payments
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
