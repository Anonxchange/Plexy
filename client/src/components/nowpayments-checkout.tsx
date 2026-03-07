import { useState, useEffect, useRef } from "react";
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
  metadata?: Record<string, any>;
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
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [prevEstimatedAmount, setPrevEstimatedAmount] = useState<number | null>(null);

  // Ref-based guard against double-click race condition
  const processingRef = useRef(false);
  const checkingRef = useRef(false);

  // Reset stale preview when crypto changes
  useEffect(() => {
    setPrevEstimatedAmount(null);
  }, [selectedCrypto]);

  useEffect(() => {
    if (!showForm || paymentData) return;

    const abortController = new AbortController();

    const fetchEstimate = async () => {
      setEstimating(true);
      setEstimateError(null);
      try {
        const data = await getNowPaymentsEstimate(amount, currency, selectedCrypto);
        if (abortController.signal.aborted) return;

        if (data.error) {
          setEstimateError(data.error);
          setEstimatedAmount(null);
        } else {
          const newAmount = data.estimated_amount || null;
          setEstimatedAmount(newAmount);
          setEstimateError(null);
          if (newAmount !== null) {
            setPrevEstimatedAmount(newAmount);
          }
        }
      } catch (err: any) {
        if (abortController.signal.aborted) return;
        console.error("Estimate error:", err);
        setEstimateError(err.message || "Failed to fetch price estimate");
        setEstimatedAmount(null);
      } finally {
        if (!abortController.signal.aborted) setEstimating(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 300);
    return () => {
      abortController.abort();
      clearTimeout(timer);
    };
  }, [showForm, selectedCrypto, amount, currency, paymentData]);

  const handleCreatePayment = async () => {
    // Ref guard: prevents double-fire before React re-renders
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    try {
      const serviceMetadata = metadata ? { ...metadata } : {};
      const service = (serviceMetadata.service as string) || "";
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
      processingRef.current = false;
    }
  };

  const handleCheckStatus = async () => {
    if (!paymentData?.payment_id) return;
    if (checkingRef.current) return;
    checkingRef.current = true;
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
      checkingRef.current = false;
    }
  };

  const copyToClipboard = (text: string, label: string = "text") => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!", { description: `${label} copied to clipboard` });
  };

  // Initial state
  if (!showForm && !paymentData) {
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Pay with Bitcoin, Ethereum, USDT, TRON, and 6+ more cryptocurrencies instantly. Secure and fast.
        </p>
        <Button onClick={() => setShowForm(true)} disabled={disabled}>
          <Bitcoin className="mr-2 h-4 w-4" />
          Continue to Crypto
        </Button>
      </div>
    );
  }

  // Payment created state
  if (paymentData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5" />
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
        <CardContent>
          {/* Amount to send */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount to send</span>
              <span className="font-mono font-bold">{paymentData.pay_amount} {paymentData.pay_currency?.toUpperCase()}</span>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Original: {currency.toUpperCase()} {amount.toFixed(2)}
            </div>
          </div>

          {/* Payment address */}
          <div className="mb-4">
            <span className="text-sm text-muted-foreground">Send to this address</span>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted p-2 rounded flex-1 break-all">
                {paymentData.pay_address}
              </code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(paymentData.pay_address, "Address")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Memo/Tag if present */}
          {paymentData.payin_extra_id && (
            <div className="mb-4">
              <span className="text-sm text-muted-foreground">Memo / Payment ID</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-muted p-2 rounded flex-1 break-all">
                  {paymentData.payin_extra_id}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(paymentData.payin_extra_id, "Memo")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-destructive mt-1">Include this memo with your payment</p>
            </div>
          )}

          {/* Status badge */}
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Payment Status</span>
            <Badge variant="outline">{paymentData.payment_status || "waiting"}</Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPaymentData(null);
                setShowForm(false);
                setEstimatedAmount(null);
                onPaymentClose?.();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCheckStatus} disabled={checkingStatus}>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
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
      <CardContent>
        <div className="mb-4">
          <span className="text-sm text-muted-foreground">Choose crypto to pay with</span>
          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
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

        {/* Price summary */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Fiat Amount</span>
            <span className="font-mono">{currency.toUpperCase()} {amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">You'll send</span>
            <span className="font-mono">
              {estimating && !estimatedAmount ? (
                <>
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  {prevEstimatedAmount && <span>≈ {prevEstimatedAmount.toFixed(8)} {selectedCrypto.toUpperCase()}</span>}
                </>
              ) : estimateError ? (
                <span className="text-destructive text-xs">{estimateError}</span>
              ) : estimatedAmount ? (
                <>≈ {estimatedAmount.toFixed(8)} {selectedCrypto.toUpperCase()}</>
              ) : (
                "—"
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowForm(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleCreatePayment} disabled={processing || !estimatedAmount || !!estimateError}>
            {processing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : estimateError ? (
              "Failed to load price"
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
