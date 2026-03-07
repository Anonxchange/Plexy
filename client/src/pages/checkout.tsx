import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NowPaymentsCheckout from "@/components/nowpayments-checkout";
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
  const processingRef = useRef(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      setLocation("/signin?redirect=/checkout");
    }
  }, [user, loading, setLocation]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/gift-cards");
    }
  };

  const handlePlaceOrder = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    try {
      // TODO: actual order placement logic
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const subtotal = items?.reduce((acc, item) => acc + (item?.price || 0) * (item?.quantity || 0), 0) || 0;
  const processingFee = 2.99;
  const total = subtotal + processingFee;
  const rewardPoints = Math.floor(subtotal * 10);

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Your cart is empty</p>
        <Button onClick={() => setLocation("/gift-cards")}>
          Browse Gift Cards
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleGoBack} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6 pb-8">
        {/* Order Summary */}
        <div className="space-y-4">
          <h2 className="font-semibold">Order Summary</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    4.9
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    (4,731)
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-2 text-primary hover:text-primary/80 transition-colors"
                        disabled={isProcessing}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      {item.quantity}
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 text-primary hover:text-primary/80 transition-colors"
                        disabled={isProcessing}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        disabled={isProcessing}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg text-sm">
              <div className="w-6 h-6 flex items-center justify-center">
                👑
              </div>
              Earn {rewardPoints.toLocaleString()} reward points
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="text-xs bg-muted rounded-full w-4 h-4 flex items-center justify-center cursor-help">
                    ?
                  </span>
                </div>
                <span>${processingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="space-y-3">
          <h2 className="font-semibold">Account Details</h2>
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div>
              <p className="font-medium">
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" disabled={isProcessing}>
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <h2 className="font-semibold">Payment Method</h2>
          <div className="bg-card rounded-xl border border-border p-4">
            <Tabs defaultValue="card">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="card">
                  <div className="flex flex-col items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs">Credit/Debit</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="paypal">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold">PayPal</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="crypto">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex -space-x-1">
                      <img src={cryptoIconUrls.btc} className="w-4 h-4" alt="" />
                      <img src={cryptoIconUrls.eth} className="w-4 h-4" alt="" />
                      <img src={cryptoIconUrls.usdt} className="w-4 h-4" alt="" />
                    </div>
                    <span className="text-xs">Crypto</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="oxxo">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold">OXXO</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Card Number</label>
                    <Input placeholder="1234 5678 9012 3456" disabled={isProcessing} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Exp Date</label>
                      <Input placeholder="MM/YY" disabled={isProcessing} />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">CVV</label>
                      <Input placeholder="123" disabled={isProcessing} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Postal Code</label>
                    <Input placeholder="12345" disabled={isProcessing} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="save-card" disabled={isProcessing} />
                    <label htmlFor="save-card" className="text-sm text-muted-foreground cursor-pointer">
                      Save this payment method
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                  <Lock className="w-3 h-3" />
                  Secure 256-bit encrypted payment
                </div>

                <Button className="w-full mt-4" size="lg" onClick={handlePlaceOrder} disabled={isProcessing}>
                  <Lock className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Place Secure Order"}
                </Button>
              </TabsContent>

              <TabsContent value="paypal">
                <p className="text-sm text-muted-foreground mb-4">
                  You will be redirected to PayPal to complete your purchase securely.
                </p>
                <Button className="w-full" size="lg" disabled={isProcessing}>
                  Continue to PayPal
                </Button>
              </TabsContent>

              <TabsContent value="crypto">
                <NowPaymentsCheckout
                  amount={total}
                  currency="usd"
                  description="Gift Card Purchase"
                  metadata={{ service: "gift-cards", items: JSON.stringify(items) }}
                  onPaymentSuccess={(paymentData) => {
                    console.log("Payment successful:", paymentData);
                  }}
                  onPaymentClose={() => {
                    console.log("Payment cancelled");
                  }}
                  disabled={isProcessing}
                />
              </TabsContent>

              <TabsContent value="oxxo">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate an OXXO voucher to pay in cash at any store.
                </p>
                <Button className="w-full" size="lg" disabled={isProcessing}>
                  Generate OXXO Voucher
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer Review */}
        <div className="text-center space-y-2 pt-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="font-semibold">The best out there!!</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            "I have found this site to be the best, fastest, and most reliable compared to other sites where I buy gift cards."
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
