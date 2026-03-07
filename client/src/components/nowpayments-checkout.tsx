import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { createNowPayment, getNowPaymentsEstimate, getNowPaymentStatus } from "@/hooks/useNowPayments";
import { Loader2, Bitcoin, Copy, ExternalLink, RefreshCw } from "lucide-react";

interface NowPaymentsCheckoutProps {
  amount: number;
  currency?: string;
  description: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentClose?: () => void;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
  buttonLabel?: string;
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
  buttonLabel = "Pay with Crypto",
}: NowPaymentsCheckoutProps) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;

    const fetchEstimate = async () => {
      setEstimating(true);
      try {
        const data = await getNowPaymentsEstimate(amount, currency, selectedCrypto);
        if (!cancelled) setEstimatedAmount(data.estimated_amount);
      } catch {
        if (!cancelled) setEstimatedAmount(null);
      } finally {
        if (!cancelled) setEstimating(false);
      }
    };

    fetchEstimate();
    return () => { cancelled = true; };
  }, [showForm, selectedCrypto, amount, currency]);

  const handleCreatePayment = async () => {
    setProcessing(true);
    try {
      // Encode service metadata in order_id for webhook fulfillment
      const serviceMetadata = metadata ? { ...metadata } : {};
      const service = serviceMetadata.service as string || "";
      delete serviceMetadata.service;
      const structuredOrderId = service
        ? `${service}:${JSON.stringify(serviceMetadata)}`
        : metadata?.orderId as string || `order_${Date.now()}`;

      const ipnUrl = `${import.meta.env.VITE_SUPABASE_URL || "https://hvpeycnedmzrjshmvgri.supabase.co"}/functions/v1/nowpayments-webhook`;

      const data = await createNowPayment({
        priceAmount: amount,
        priceCurrency: currency,
        payCurrency: selectedCrypto,
        orderId: structuredOrderId,
        orderDescription: description,
        ipnCallbackUrl: ipnUrl,
      });

      if (data.error || data.message) {
        throw new Error(data.message || data.error || "Payment creation failed");
      }

      setPaymentData(data);
      toast({ title: "Payment created", description: "Send crypto to the address shown below" });
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
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
        toast({ title: "Payment confirmed!", description: `Status: ${status.payment_status}` });
        onPaymentSuccess?.(status);
      } else if (["waiting", "confirming", "sending"].includes(status.payment_status)) {
        toast({ title: "Payment pending", description: `Status: ${status.payment_status}. Please wait.` });
      } else {
        toast({ title: "Payment status", description: `Status: ${status.payment_status}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Status check failed", variant: "destructive" });
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  if (!showForm) {
    return (
      <Button
        variant="outline"
        className="w-full border-primary/30 hover:bg-primary/5"
        size="lg"
        onClick={() => setShowForm(true)}
        disabled={disabled}
      >
        <Bitcoin className="mr-2 h-4 w-4" />
        {buttonLabel}
        <Badge variant="secondary" className="ml-2 text-xs">Crypto</Badge>
      </Button>
    );
  }

  if (paymentData) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bitcoin className="h-4 w-4 text-primary" />
            Send Crypto Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono font-semibold">
                {paymentData.pay_amount} {paymentData.pay_currency?.toUpperCase()}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground block mb-1">Send to address:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background p-2 rounded flex-1 break-all border border-border">
                  {paymentData.pay_address}
                </code>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard(paymentData.pay_address)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {paymentData.payin_extra_id && (
              <div className="text-sm">
                <span className="text-muted-foreground block mb-1">Memo / Tag:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background p-2 rounded flex-1 break-all border border-border">
                    {paymentData.payin_extra_id}
                  </code>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard(paymentData.payin_extra_id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <Badge variant="outline" className="text-xs">
              Status: {paymentData.payment_status || "waiting"}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setPaymentData(null); setShowForm(false); onPaymentClose?.(); }}>
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

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bitcoin className="h-4 w-4 text-primary" />
          Pay with Crypto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Select cryptocurrency</label>
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

        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span>{currency.toUpperCase()} {amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-border pt-1">
            <span>Estimated crypto</span>
            <span>
              {estimating ? (
                <Loader2 className="h-4 w-4 animate-spin inline" />
              ) : estimatedAmount ? (
                `≈ ${estimatedAmount} ${selectedCrypto.toUpperCase()}`
              ) : (
                "—"
              )}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={processing}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleCreatePayment} disabled={processing || !estimatedAmount}>
            {processing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              <><Bitcoin className="mr-2 h-4 w-4" /> Pay with {selectedCrypto.toUpperCase()}</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NowPaymentsCheckout;
