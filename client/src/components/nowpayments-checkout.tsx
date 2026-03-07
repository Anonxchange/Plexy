import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createNowPayment, getNowPaymentsEstimate, getNowPaymentStatus } from "@/hooks/use-nowpayments";
import { Loader2, Bitcoin, Copy, RefreshCw, ArrowLeft } from "lucide-react";

interface NowPaymentsCheckoutProps {
  amount: number;
  currency?: string;
  description: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentClose?: () => void;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

const POPULAR_CRYPTOS = [
  { value: "btc", label: "Bitcoin (BTC)" },
  { value: "eth", label: "Ethereum (ETH)" },
  { value: "usdttrc20", label: "USDT (TRC20)" },
  { value: "usdterc20", label: "USDT (ERC20)" },
  { value: "ltc", label: "Litecoin (LTC)" },
  { value: "trx", label: "TRON (TRX)" },
  { value: "bnbbsc", label: "BNB (BSC)" },
  { value: "sol", label: "Solana (SOL)" },
  { value: "doge", label: "Dogecoin (DOGE)" },
  { value: "xrp", label: "XRP" },
];

const NowPaymentsCheckout = ({
  amount,
  currency = "usd",
  description,
  onPaymentSuccess,
  onPaymentClose,
  disabled,
  metadata,
}: NowPaymentsCheckoutProps) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [prevEstimatedAmount, setPrevEstimatedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!showForm || paymentData) return;
    let cancelled = false;

    const fetchEstimate = async () => {
      setEstimating(true);
      try {
        const data = await getNowPaymentsEstimate(amount, currency, selectedCrypto);
        if (!cancelled) {
          const newAmount = data.estimated_amount || null;
          setEstimatedAmount(newAmount);
          if (newAmount !== null) {
            setPrevEstimatedAmount(newAmount);
          }
        }
      } catch (err: any) {
        console.error("Estimate error:", err);
        if (!cancelled) setEstimatedAmount(null);
      } finally {
        if (!cancelled) setEstimating(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 300);
    return () => { 
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showForm, selectedCrypto, amount, currency, paymentData]);

  const handleCreatePayment = async () => {
    setProcessing(true);
    try {
      const serviceMetadata = metadata ? { ...metadata } : {};
      const service = serviceMetadata.service as string || "";
      delete serviceMetadata.service;
      const structuredOrderId = service
        ? `${service}:${JSON.stringify(serviceMetadata)}`
        : `order_${Date.now()}`;

      const ipnUrl = `${import.meta.env.VITE_SUPABASE_URL || "https://hvpeycnedmzrjshmvgri.supabase.co"}/functions/v1/nowpayments-webhook`;

      const data = await createNowPayment({
        priceAmount: amount,
        priceCurrency: currency,
        payCurrency: selectedCrypto,
        orderId: structuredOrderId,
        orderDescription: description,
        ipnCallbackUrl: ipnUrl,
      });

      console.log("Payment response:", data);

      if (data.error || data.message || !data.pay_address) {
        throw new Error(data.message || data.error || "Payment creation failed - no address returned");
      }

      setPaymentData(data);
      toast.success("Payment created!", { description: "Send the exact amount to the address below" });
    } catch (err: any) {
      console.error("Payment creation error:", err);
      toast.error("Payment error", { description: err.message || "Failed to create payment" });
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!paymentData?.payment_id) return;
    setCheckingStatus(true);
    try {
      const status = await getNowPaymentStatus(paymentData.payment_id);
      if (["finished", "confirmed"].includes(status.payment_status)) {
        toast.success("Payment confirmed!", { description: `Status: ${status.payment_status}` });
        onPaymentSuccess?.(status);
      } else if (["waiting", "confirming", "sending"].includes(status.payment_status)) {
        toast.info("Payment pending", { description: `Status: ${status.payment_status}` });
      } else {
        toast.warning("Payment status", { description: `Status: ${status.payment_status}` });
      }
    } catch (err: any) {
      console.error("Status check error:", err);
      toast.error("Status check failed", { description: err.message });
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = (text: string, label: string = "text") => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!", { description: `${label} copied to clipboard` });
  };

  // Initial state - show description and button like PayPal
  if (!showForm && !paymentData) {
    return (
      <div className="text-center space-y-6">
        <p className="text-muted-foreground">
          Pay with Bitcoin, Ethereum, USDT, TRON, and 6+ more cryptocurrencies instantly. Secure and fast.
        </p>
        <Button 
          className="w-full h-14 bg-black text-white hover:bg-gray-900 font-bold text-lg rounded-xl gap-2"
          onClick={() => setShowForm(true)}
          disabled={disabled}
        >
          <Bitcoin className="h-5 w-5" />
          Continue to Crypto
        </Button>
      </div>
    );
  }

  // Payment created state - show address and amount
  if (paymentData) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-primary" />
              Send {paymentData.pay_currency?.toUpperCase()} Payment
            </CardTitle>
            <button 
              onClick={() => { 
                setPaymentData(null); 
                setShowForm(false); 
                setEstimatedAmount(null);
                onPaymentClose?.(); 
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount to send */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-muted-foreground">Amount to send</span>
              <span className="text-lg font-bold">{paymentData.pay_amount} {paymentData.pay_currency?.toUpperCase()}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Original: {currency.toUpperCase()} {amount.toFixed(2)}
            </div>
          </div>

          {/* Payment address */}
          <div className="space-y-2">
            <label className="text-sm font-semibold block">Send to this address</label>
            <div className="bg-background border border-border rounded-lg p-3 flex items-stretch gap-2">
              <code className="text-xs font-mono flex-1 break-all text-foreground self-center">
                {paymentData.pay_address}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 hover:bg-secondary" 
                onClick={() => copyToClipboard(paymentData.pay_address, "Address")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Memo/Tag if present */}
          {paymentData.payin_extra_id && (
            <div className="space-y-2">
              <label className="text-sm font-semibold block">Memo / Payment ID</label>
              <div className="bg-background border border-border rounded-lg p-3 flex items-stretch gap-2">
                <code className="text-xs font-mono flex-1 break-all text-foreground self-center">
                  {paymentData.payin_extra_id}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 hover:bg-secondary" 
                  onClick={() => copyToClipboard(paymentData.payin_extra_id, "Memo")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Include this memo with your payment</p>
            </div>
          )}

          {/* Status badge */}
          <div className="flex items-center justify-between py-2 border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Payment Status</span>
            <Badge variant="outline" className="text-xs">
              {paymentData.payment_status || "waiting"}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { 
                setPaymentData(null); 
                setShowForm(false); 
                setEstimatedAmount(null);
                onPaymentClose?.(); 
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCheckStatus} 
              disabled={checkingStatus} 
              className="flex-1"
            >
              {checkingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Crypto selection form
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bitcoin className="h-4 w-4 text-primary" />
            Select Cryptocurrency
          </CardTitle>
          <button 
            onClick={() => setShowForm(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Choose crypto to pay with</label>
          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_CRYPTOS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price summary */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fiat Amount</span>
            <span className="font-semibold">{currency.toUpperCase()} {amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
            <span>You'll send</span>
            <span className="flex items-center gap-1">
              {estimating && !estimatedAmount ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {prevEstimatedAmount && <span className="opacity-50">≈ {prevEstimatedAmount.toFixed(8)} {selectedCrypto.toUpperCase()}</span>}
                </>
              ) : estimatedAmount ? (
                <>≈ {estimatedAmount.toFixed(8)} {selectedCrypto.toUpperCase()}</>
              ) : (
                "—"
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowForm(false)} 
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90" 
            onClick={handleCreatePayment} 
            disabled={processing || (!estimatedAmount && estimating)}
          >
            {processing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              <><Bitcoin className="mr-2 h-4 w-4" /> Get Payment Address</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NowPaymentsCheckout;
 
