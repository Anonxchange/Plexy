import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGiftCardProduct, orderGiftCard } from "@/hooks/useGiftCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Gift, ShoppingCart, Mail, Phone } from "lucide-react";
import PaystackCheckout from "@/components/PaystackCheckout";
import NowPaymentsCheckout from "@/components/NowPaymentsCheckout";

const GiftCardDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading, error } = useGiftCardProduct(productId);

  const [selectedDenom, setSelectedDenom] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [ordering, setOrdering] = useState(false);

  const fixedDenoms = product?.fixedRecipientDenominations ?? [];

  // Allowed range: for FIXED cards fall back to the smallest/largest preset.
  const minAmount =
    product?.minRecipientDenomination ??
    (fixedDenoms.length ? Math.min(...fixedDenoms) : undefined);
  const maxAmount =
    product?.maxRecipientDenomination ??
    (fixedDenoms.length ? Math.max(...fixedDenoms) : undefined);

  const parsedAmount =
    customAmount.trim() === "" ? NaN : parseFloat(customAmount);

  const hasAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const belowMin = hasAmount && minAmount != null && parsedAmount < minAmount;
  const aboveMax = hasAmount && maxAmount != null && parsedAmount > maxAmount;
  const amountValid = hasAmount && !belowMin && !aboveMax;

  const amountError = !customAmount.trim()
    ? null
    : !hasAmount
      ? "Enter a valid amount"
      : belowMin || aboveMax
        ? `Amount must be between ${minAmount} and ${maxAmount} ${product?.recipientCurrencyCode ?? ""}`
        : null;

  // Only a valid, in-range amount becomes a real unit price.
  const unitPrice = amountValid ? parsedAmount : null;
  const canCheckout = !!unitPrice && !ordering;

  const handleAmountChange = (value: string) => {
    setCustomAmount(value);
    const n = parseFloat(value);
    setSelectedDenom(fixedDenoms.includes(n) ? n : null);
  };

  const handlePresetClick = (d: number) => {
    // Tapping the active preset clears it so the field can be edited freely.
    if (selectedDenom === d) {
      setSelectedDenom(null);
      setCustomAmount("");
      return;
    }
    setSelectedDenom(d);
    setCustomAmount(String(d));
  };

  const handleOrder = async () => {
    if (!unitPrice || !product) return;

    setOrdering(true);
    try {
      const result = await orderGiftCard({
        productId: product.productId,
        unitPrice,
        quantity,
        recipientEmail: recipientEmail || undefined,
        recipientPhone: recipientPhone || undefined,
      });

      toast({
        title: "Order placed!",
        description: `Gift card ordered successfully. Transaction: ${result.transactionId}`,
      });
    } catch (err: any) {
      toast({
        title: "Order failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full mb-6 rounded-lg" />
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load product</p>
          <Link to="/gift-cards">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/gift-cards" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to catalog
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-muted rounded-lg flex items-center justify-center p-8">
            {product.logoUrls?.[0] ? (
              <img
                src={product.logoUrls[0]}
                alt={product.productName}
                className="max-h-48 max-w-full object-contain"
              />
            ) : (
              <Gift className="h-24 w-24 text-muted-foreground" />
            )}
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{product.productName}</h1>
            <p className="text-muted-foreground mb-1">{product.brand?.brandName}</p>

            <div className="flex gap-2 mb-4">
              {product.country?.name && (
                <Badge variant="secondary">{product.country.name}</Badge>
              )}
              {product.category?.name && (
                <Badge variant="outline">{product.category.name}</Badge>
              )}
              {product.discountPercentage > 0 && (
                <Badge className="bg-destructive text-destructive-foreground">
                  -{product.discountPercentage.toFixed(0)}% off
                </Badge>
              )}
            </div>

            {/* Denomination Selection */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Amount ({product.recipientCurrencyCode})</CardTitle>
              </CardHeader>
              <CardContent>
                {fixedDenoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {fixedDenoms.map((d) => (
                      <Button
                        key={d}
                        type="button"
                        variant={selectedDenom === d ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetClick(d)}
                      >
                        {d} {product.recipientCurrencyCode}
                      </Button>
                    ))}
                  </div>
                )}

                <div>
                  {minAmount != null && maxAmount != null && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Range: {minAmount} - {maxAmount} {product.recipientCurrencyCode}
                    </p>
                  )}
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    min={minAmount}
                    max={maxAmount}
                    aria-invalid={!!amountError}
                  />
                  {amountError && (
                    <p className="text-xs text-destructive mt-2">{amountError}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-foreground">Qty:</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={10}
                className="w-20"
              />
            </div>

            {/* Recipient */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Recipient email (optional)"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="pl-10"
                  type="email"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Recipient phone (optional)"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Total & Buy */}
            {unitPrice && (
              <div className="bg-muted p-4 rounded-lg mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span>{unitPrice} {product.recipientCurrencyCode}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>{quantity}</span>
                </div>
                {product.senderFee > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Fee</span>
                    <span>{product.senderFee} {product.senderCurrencyCode}</span>
                  </div>
                )}
                <div className="border-t border-border mt-2 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{(unitPrice * quantity).toFixed(2)} {product.recipientCurrencyCode}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                disabled={!canCheckout}
                onClick={handleOrder}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {ordering ? "Processing..." : "Buy Gift Card"}
              </Button>

              {unitPrice && (
                <PaystackCheckout
                  amount={unitPrice * quantity}
                  sourceCurrency={product.recipientCurrencyCode || "USD"}
                  description={`Gift Card: ${product.productName} x${quantity}`}
                  disabled={!canCheckout}
                  metadata={{
                    service: "gift_card",
                    productId: product.productId,
                    productName: product.productName,
                    quantity,
                    unitPrice,
                  }}
                  onPaymentSuccess={async (reference) => {
                    try {
                      await orderGiftCard({
                        productId: product.productId,
                        unitPrice,
                        quantity,
                        recipientEmail: recipientEmail || undefined,
                        recipientPhone: recipientPhone || undefined,
                      });
                      toast({
                        title: "Order placed!",
                        description: `Payment ref: ${reference}. Gift card ordered successfully.`,
                      });
                    } catch (err: any) {
                      toast({
                        title: "Order failed after payment",
                        description: err.message,
                        variant: "destructive",
                      });
                    }
                  }}
                  buttonLabel="Pay with Paystack"
                />
              )}

              {unitPrice && (
                <NowPaymentsCheckout
                  amount={unitPrice * quantity}
                  currency={product.recipientCurrencyCode?.toLowerCase() || "usd"}
                  description={`Gift Card: ${product.productName} x${quantity}`}
                  disabled={!canCheckout}
                  metadata={{
                    service: "gift_card",
                    productId: product.productId,
                    productName: product.productName,
                    quantity,
                    unitPrice,
                  }}
                  onPaymentSuccess={async () => {
                    try {
                      await orderGiftCard({
                        productId: product.productId,
                        unitPrice,
                        quantity,
                        recipientEmail: recipientEmail || undefined,
                        recipientPhone: recipientPhone || undefined,
                      });
                      toast({
                        title: "Order placed!",
                        description: "Crypto payment confirmed. Gift card ordered.",
                      });
                    } catch (err: any) {
                      toast({
                        title: "Order failed after payment",
                        description: err.message,
                        variant: "destructive",
                      });
                    }
                  }}
                  
                />
              )}
            </div>
          </div>
        </div>

        {/* Redeem Instructions */}
        {product.redeemInstruction?.verbose && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">How to Redeem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {product.redeemInstruction.verbose}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GiftCardDetail;
