import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Star, 
  Minus, 
  Plus, 
  Trash2, 
  Edit2, 
  Lock,
  CreditCard
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cryptoIconUrls } from "@/lib/crypto-icons";

export function Checkout() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem } = useGiftCardCart();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin?redirect=/checkout");
    }
  }, [user, loading, setLocation]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const processingFee = 2.99;
  const total = subtotal + processingFee;
  const rewardPoints = Math.floor(subtotal * 10);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => setLocation("/gift-cards")}>
          Browse Gift Cards
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Order Summary */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Order Summary</h2>
          <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                  <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <span className="text-sm font-bold text-foreground">4.9</span>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">(4,731)</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center bg-secondary/50 rounded-xl px-1 border border-border">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <span className="text-lg font-bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-full py-3 px-6 flex items-center justify-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-xs">👑</span>
              </div>
              <span className="text-sm font-bold">Earn {rewardPoints.toLocaleString()} reward points</span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground items-center">
                <div className="flex items-center gap-1">
                  <span>Processing Fee</span>
                  <button className="text-muted-foreground/50 hover:text-foreground">
                    <span className="text-[10px] border border-current rounded-full w-3 h-3 flex items-center justify-center">?</span>
                  </button>
                </div>
                <span>${processingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Account Details */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Account Details</h2>
          <div className="bg-card border border-border rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="font-bold text-lg">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" className="text-blue-500 font-bold hover:bg-transparent hover:text-blue-600 p-0 h-auto">
              Edit
            </Button>
          </div>
        </section>

        {/* Payment Method */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Payment Method</h2>
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <Tabs defaultValue="card" className="w-full">
              <TabsList className="w-full h-auto p-0 bg-transparent border-b border-border rounded-none grid grid-cols-4">
                <TabsTrigger 
                  value="card" 
                  className="flex flex-col gap-2 py-4 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <div className="flex gap-1">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
                  </div>
                  <span className="text-xs font-bold">Credit/Debit</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="paypal" 
                  className="flex flex-col gap-2 py-4 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
                  <span className="text-xs font-bold">PayPal</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="crypto" 
                  className="flex flex-col gap-2 py-4 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <div className="flex gap-1">
                    <img src={cryptoIconUrls.BTC} className="h-4 w-4 rounded-full" alt="BTC" />
                    <img src={cryptoIconUrls.ETH} className="h-4 w-4 rounded-full" alt="ETH" />
                    <img src={cryptoIconUrls.USDT} className="h-4 w-4 rounded-full" alt="USDT" />
                  </div>
                  <span className="text-xs font-bold">Crypto</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="oxxo" 
                  className="flex flex-col gap-2 py-4 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Oxxo_Logo.svg" className="h-4" alt="OXXO" />
                  <span className="text-xs font-bold">OXXO</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="p-6 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Card Number</label>
                    <Input placeholder="Card Number" className="h-12 bg-secondary/30 border-none rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Exp Date</label>
                      <Input placeholder="MM / YY" className="h-12 bg-secondary/30 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">CVV</label>
                      <Input placeholder="CVV" className="h-12 bg-secondary/30 border-none rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Postal Code</label>
                    <Input placeholder="Postal Code" className="h-12 bg-secondary/30 border-none rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox id="save-card" />
                    <label htmlFor="save-card" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Save this payment method
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span className="text-xs font-medium">Secure 256-bit encrypted payment</span>
                </div>

                <Button 
                  className="w-full h-14 bg-[#FFC107] text-black hover:bg-[#FFB300] font-bold text-lg rounded-xl shadow-lg shadow-yellow-500/20 gap-2"
                  disabled={isProcessing}
                >
                  <Lock className="h-5 w-5" />
                  Place Secure Order
                </Button>
              </TabsContent>

              <TabsContent value="paypal" className="p-6 text-center space-y-6">
                <p className="text-muted-foreground">You will be redirected to PayPal to complete your purchase securely.</p>
                <Button className="w-full h-14 bg-[#0070BA] text-white hover:bg-[#005ea6] font-bold text-lg rounded-xl gap-2">
                  Continue to PayPal
                </Button>
              </TabsContent>

              <TabsContent value="crypto" className="p-6 text-center space-y-6">
                <p className="text-muted-foreground">Pay with Bitcoin, Ethereum, or USDT instantly.</p>
                <Button className="w-full h-14 bg-foreground text-background hover:opacity-90 font-bold text-lg rounded-xl gap-2">
                  Pay with Crypto
                </Button>
              </TabsContent>

              <TabsContent value="oxxo" className="p-6 text-center space-y-6">
                <p className="text-muted-foreground">Generate an OXXO voucher to pay in cash at any store.</p>
                <Button className="w-full h-14 bg-[#E20613] text-white hover:bg-[#c90511] font-bold text-lg rounded-xl gap-2">
                  Generate OXXO Voucher
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Footer Review */}
        <section className="text-center space-y-4 pt-4">
          <div className="flex justify-center gap-1 text-yellow-500">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <h3 className="text-2xl font-bold italic">The best out there!!</h3>
          <p className="text-muted-foreground italic leading-relaxed">
            "I have found this site to be the best, fastest, and most reliable compared to other sites where I buy gift cards."
          </p>
        </section>
      </main>
    </div>
  );
}
