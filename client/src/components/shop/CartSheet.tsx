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

  // Refresh cart when sheet opens — guarded by isLoading to prevent race conditions
  useEffect(() => {
    if (isOpen && cartId && !isLoading) {
      refreshCart();
    }
  }, [isOpen, cartId, isLoading, refreshCart]);

  const subtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  const currency = items[0]?.currency || "USD";

  const handleCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {items.reduce((acc, item) => acc + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
        <div className="flex items-center justify-between p-6 pb-4">
          <SheetHeader className="flex-1">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Shopping Cart
            </SheetTitle>
            <SheetDescription>
              {items.length} {items.length === 1 ? 'item' : 'items'} ready for checkout
            </SheetDescription>
          </SheetHeader>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <div className="flex-1 min-h-0">
          {isLoading && items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <div className="rounded-full bg-muted p-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Explore our Shopify store and add some amazing digital products to your cart.
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 rounded-lg bg-secondary/50">
                    <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-sm font-semibold ml-2 flex-shrink-0">
                          {Number(item.price).toFixed(2)} {item.currency}
                        </p>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isLoading || item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isLoading}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
          <div className="flex-shrink-0 border-t p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing Fee</span>
                <span>Free</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold">Order Total</span>
                  <p className="text-xs text-muted-foreground">Taxes included</p>
                </div>
                <span className="text-xl font-bold">
                  {subtotal.toFixed(2)} {currency}
                </span>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isLoading || !checkoutUrl}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Complete Checkout
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Securely processed by Shopify Payments</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
