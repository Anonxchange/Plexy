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
  const numericAmount = typeof amount === "number" ? amount : parseFloat(String(amount) || "0");
  const [showForm, setShowForm] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [prevEstimatedAmount, setPrevEstimatedAmount] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (!showForm || paymentData) return;
    if (!numericAmount || numericAmount <= 0) {
      setEstimateError("Invalid amount");
      setEstimatedAmount(null);
      return;
    }
    let cancelled = false;

    const fetchEstimate = async () => {
      setEstimating(true);
      setEstimateError(null);
      try {
        const data = await getNowPaymentsEstimate(numericAmount, currency, selectedCrypto);
        if (!cancelled) {
          if (data.error) {
            setEstimateError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
            setEstimatedAmount(null);
          } else {
            const raw = data.estimated_amount;
            const newAmount = typeof raw === "number" ? raw : Number(raw);
            if (!isNaN(newAmount) && newAmount > 0) {
              setEstimatedAmount(newAmount);
              setPrevEstimatedAmount(newAmount);
              setEstimateError(null);
            } else {
              setEstimatedAmount(null);
              setEstimateError("Amount too small or unsupported pair");
            }
          }
        }
      } catch (err: any) {
        console.error("Estimate error:", err);
        if (!cancelled) {
          setEstimateError(err.message || "Failed to fetch price estimate");
          setEstimatedAmount(null);
        }
      } finally {
        if (!cancelled) setEstimating(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 300);
    return () => { 
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showForm, selectedCrypto, numericAmount, currency, paymentData]);

  const handleCreatePayment = async () => {
    if (!estimatedAmount && !prevEstimatedAmount) {
      toast.error("Price not loaded", { description: "Please wait for price estimation to complete" });
      return;
    }

    setProcessing(true);
    setPaymentError(null);
    try {
      const serviceMetadata = metadata ? { ...metadata } : {};
      const service = serviceMetadata.service as string || "";
      delete serviceMetadata.service;
      const structuredOrderId = service
        ? `${service}:${JSON.stringify(serviceMetadata)}`
        : `order_${Date.now()}`;

      const supabaseBaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || "").trim().replace(/\/$/, "");
      const ipnCallbackUrl = `${supabaseBaseUrl}/functions/v1/nowpayments-webhook`;

      const data = await createNowPayment({
        priceAmount: numericAmount,
        priceCurrency: currency,
        payCurrency: selectedCrypto,
        orderId: structuredOrderId,
        orderDescription: description,
        ipnCallbackUrl,
      });

      console.log("Payment response:", data);

      if (!data || !data.pay_address) {
        throw new Error(data?.message || data?.error || "Payment creation failed - no address returned");
      }

      setPaymentData(data);
      toast.success("Payment created!", { description: "Send the exact amount to the address below" });
    } catch (err: any) {
      console.error("Payment creation error:", err);
      const msg = err.message || "Failed to create payment";
      setPaymentError(msg);
      toast.error("Payment error", { description: msg });
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

  const safeFixed = (val: number | null, digits: number) => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return Number(val).toFixed(digits);
  };

  // Initial state
  if (!showForm && !paymentData) {
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Pay with Bitcoin, Ethereum, USDT, TRON, and 6+ more cryptocurrencies instantly. Secure and fast.
        </p>
        <Button
          variant="outline"
          className="w-full border-primary/30 hover:bg-primary/5"
          size="lg"
          onClick={() => setShowForm(true)}
          disabled={disabled}
        >
          <Bitcoin className="mr-2 h-4 w-4" />
          Continue to Crypto
        </Button>
      </div>
    );
  }

  // Payment created state
  if (paymentData) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-primary" />
              Send {paymentData.pay_currency?.toUpperCase()} Payment
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { 
                setPaymentData(null); 
                setShowForm(false); 
                setEstimatedAmount(null);
                onPaymentClose?.(); 
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount to send</span>
              <span className="font-mono font-semibold">{paymentData.pay_amount} {paymentData.pay_currency?.toUpperCase()}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Original: {currency.toUpperCase()} {safeFixed(numericAmount, 2)}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Send to this address</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-background p-2 rounded flex-1 break-all border border-border">
                {paymentData.pay_address}
              </code>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard(paymentData.pay_address, "Address")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {paymentData.payin_extra_id && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Memo / Payment ID</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background p-2 rounded flex-1 break-all border border-border">
                  {paymentData.payin_extra_id}
                </code>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard(paymentData.payin_extra_id, "Memo")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Include this memo with your payment</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Payment Status</span>
            <Badge variant="outline" className="text-xs">
              {paymentData.payment_status || "waiting"}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { 
              setPaymentData(null); 
              setShowForm(false); 
              setEstimatedAmount(null);
              onPaymentClose?.(); 
            }}>
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleCheckStatus} disabled={checkingStatus} className="flex-1">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowForm(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Choose crypto to pay with</label>
          <Select value={selectedCrypto} onValueChange={(v) => { setSelectedCrypto(v); setPaymentError(null); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_CRYPTOS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fiat Amount</span>
            <span>{currency.toUpperCase()} {safeFixed(numericAmount, 2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-border pt-1">
            <span>You'll send</span>
            <span>
              {estimating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                  {prevEstimatedAmount ? (
                    <>≈ {safeFixed(prevEstimatedAmount, 8)} {selectedCrypto.toUpperCase()}</>
                  ) : (
                    <>Calculating...</>
                  )}
                </>
              ) : estimateError ? (
                <span className="text-destructive text-xs">{estimateError}</span>
              ) : estimatedAmount ? (
                <>≈ {safeFixed(estimatedAmount, 8)} {selectedCrypto.toUpperCase()}</>
              ) : (
                <>—</>
              )}
            </span>
          </div>
        </div>

        {paymentError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {paymentError}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={processing}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleCreatePayment} disabled={processing || (!estimatedAmount && !prevEstimatedAmount) || !!estimateError}>
            {processing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : estimateError ? (
              <>Failed to load price</>
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
