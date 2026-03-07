import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Minus, Plus, Trash2, Lock, Star, ShoppingBag } from "lucide-react";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { useLocation } from "wouter";

export function GiftCardCartSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { items, updateQuantity, removeItem } = useGiftCardCart();

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const [, setLocation] = useLocation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-none">
        <div className="p-6 flex items-center justify-between">
          <SheetTitle className="text-2xl font-bold">Your Cart</SheetTitle>
          <SheetClose className="rounded-full p-2 hover:bg-secondary">
            <X className="h-5 w-5" />
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mb-2 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold leading-tight">{item.title}</h4>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <span className="text-xs font-bold text-foreground mr-1">4.9</span>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-2.5 w-2.5 fill-current" />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">(4,731)</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center bg-secondary/50 rounded-lg px-1">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1.5 text-blue-500 hover:text-blue-600"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 text-blue-500 hover:text-blue-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-bold">
                        {item.quantity} x ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span role="img" aria-label="heart">❤️</span>
              <span className="text-xs font-bold uppercase tracking-wider">Bundle and save!</span>
            </div>
            <div className="flex gap-3">
              <div className="w-16 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=200&h=150&fit=crop" alt="Promo" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-bold">Global $200 Razer Gold Gift Card</h5>
                <p className="text-sm font-bold">$213.94</p>
              </div>
              <Button size="sm" variant="secondary" className="h-8 rounded-lg text-[10px] font-bold">Add +</Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Have a coupon?</p>
            <div className="flex gap-2">
              <Input placeholder="Coupon code" className="h-10 bg-muted/50 border-none" />
              <Button variant="ghost" className="text-muted-foreground font-bold">Apply</Button>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-full py-2 px-4 flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-[10px]">👑</span>
            </div>
            <span className="text-xs font-bold">Earn {(total * 10).toLocaleString()} reward points</span>
          </div>
        </div>

        <div className="p-6 bg-background border-t space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">Total</span>
            <span className="text-xl font-bold">${total.toFixed(2)}</span>
          </div>

          <Button 
            onClick={() => {
              onOpenChange(false);
              setLocation("/checkout");
            }}
            className="w-full h-14 bg-gradient-to-r from-orange-400 to-yellow-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 gap-2"
          >
            <Lock className="h-5 w-5" />
            Checkout
          </Button>

          <div className="flex justify-center gap-4 opacity-50 grayscale">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5" alt="Mastercard" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" className="h-4" alt="Bitcoin" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
