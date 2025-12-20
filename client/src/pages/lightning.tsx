import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    Opennode?: any;
  }
}

export default function Lightning() {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState<"receive" | "send">("receive");
  const containerRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ lightning_invoice: string; amount: string } | null>(null);
  const [sendInvoice, setSendInvoice] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load OpenNode script
    const script = document.createElement("script");
    script.src = "https://checkout.opennode.com/checkout.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleReceive = async () => {
    if (!user) {
      alert("Please sign in first");
      return;
    }

    const receiveAmount = amount || "0.001";
    const satoshis = Math.round(parseFloat(receiveAmount) * 100000000);

    if (satoshis <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const token = session?.access_token;
      
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL not configured');
      }

      if (!token) {
        throw new Error('Not signed in. Please sign in to your account first.');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/opennode-create-invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: satoshis,
          description: `Deposit ${receiveAmount} BTC`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || `HTTP ${response.status}`;
        console.error('Invoice creation error:', errorMsg, data);
        throw new Error(errorMsg);
      }

      if (data.success && data.invoice?.lightning_invoice) {
        // Store invoice data and show modal
        setInvoiceData({ 
          lightning_invoice: data.invoice.lightning_invoice, 
          amount: receiveAmount 
        });
        setShowReceiveModal(true);
        setAmount("");
      } else {
        throw new Error(data.error || 'No invoice returned from OpenNode');
      }
    } catch (error) {
      console.error('Invoice error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Error: ${errorMsg}\n\nSee TROUBLESHOOT.md for help`);
    }
  };

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Show modal to paste Lightning invoice
    setShowSendModal(true);
  };

  const handleCopyInvoice = () => {
    if (invoiceData?.lightning_invoice) {
      navigator.clipboard.writeText(invoiceData.lightning_invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendWithInvoice = () => {
    if (!sendInvoice.trim()) {
      alert("Please paste a valid Lightning invoice");
      return;
    }
    // TODO: Implement actual Lightning payment with the invoice
    alert(`Ready to send ${amount} BTC to the provided Lightning invoice.\n\nImplementing payment...`);
    setSendInvoice("");
    setShowSendModal(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Lightning Hero Section */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Receive and send Bitcoin with Lightning network
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Easily send and receive Bitcoin to your wallet with amazing low fees and near-instant speed.
          </p>
          
          {/* Tabs */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex gap-2 mb-6">
                <Button 
                  size="lg"
                  variant={activeTab === "receive" ? "default" : "outline"}
                  className="flex-1 h-12"
                  onClick={() => setActiveTab("receive")}
                >
                  Receive Bitcoin
                </Button>
                <Button 
                  size="lg"
                  variant={activeTab === "send" ? "default" : "outline"}
                  className="flex-1 h-12"
                  onClick={() => setActiveTab("send")}
                >
                  Send Bitcoin
                </Button>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  {activeTab === "receive" ? "Request Amount (BTC)" : "Send Amount (BTC)"}
                </label>
                <input 
                  type="number"
                  step="0.00000001"
                  min="0"
                  placeholder="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: 0.00000001 BTC
                </p>
              </div>

              {/* Action Button */}
              <Button 
                size="lg" 
                className="w-full h-12 text-lg font-semibold"
                onClick={activeTab === "receive" ? handleReceive : handleSend}
              >
                {activeTab === "receive" ? "Create Invoice" : "Send Now"}
              </Button>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                ⚡ Powered by OpenNode (Instant Lightning payments)
              </p>
            </CardContent>
          </Card>
          
          <a 
            href="#faq" 
            className="text-primary hover:underline font-medium"
          >
            Learn more about Lightning feature →
          </a>
        </div>

        {/* Transactions Header */}
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          Transactions
        </h2>

        {/* Transactions Section */}
        <Card className="bg-muted/30 border-2 mb-8">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 mb-6 flex items-center justify-center">
                <Search className="h-12 w-12 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground">
                You don't have transactions yet
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Receive Invoice Modal */}
        <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Your Lightning Invoice</DialogTitle>
            </DialogHeader>
            {invoiceData && (
              <div className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Lightning Invoice:</p>
                  <p className="text-sm font-mono break-all text-foreground">
                    {invoiceData.lightning_invoice}
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Amount:</p>
                  <p className="text-lg font-bold text-foreground">{invoiceData.amount} BTC</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⏱️ This invoice expires in 1 hour
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleCopyInvoice}
                    className="flex-1"
                    variant="default"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Invoice
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => setShowReceiveModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Share this invoice with the sender to receive payment
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Invoice Modal */}
        <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Bitcoin via Lightning</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Amount to send:</p>
                <p className="text-lg font-bold text-foreground">{amount} BTC</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold">
                  Recipient's Lightning Invoice
                </label>
                <textarea 
                  placeholder="Paste the Lightning invoice here (starts with 'lnbc' or 'LNBC')"
                  value={sendInvoice}
                  onChange={(e) => setSendInvoice(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground font-mono text-sm min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Lightning invoices typically start with "lnbc" or "LNBC"
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleSendWithInvoice}
                  className="flex-1"
                  variant="default"
                >
                  Send Now
                </Button>
                <Button 
                  onClick={() => {
                    setSendInvoice("");
                    setShowSendModal(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* FAQ Section */}
        <div className="mt-12" id="faq">
          <h2 className="text-2xl font-bold mb-6">FAQ</h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                What is Lightning?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The Lightning Network is a "layer 2" payment protocol layered on top of Bitcoin. It enables fast, low-cost Bitcoin transactions through a network of payment channels.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                What is Lightning used for?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Lightning Network is used for instant Bitcoin payments with minimal fees. It's ideal for microtransactions, daily purchases, and fast cross-border transfers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                How do I receive BTC to my NoOnes account with the Lightning Network? Where is my Lightning address?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                To receive BTC via Lightning, go to your wallet and select "Receive" then choose "Lightning Network". You'll get a Lightning invoice or address that you can share with the sender.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                How do I send BTC from my NoOnes Wallet via Lightning?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                To send BTC via Lightning, go to your wallet, select "Send", choose "Lightning Network", and paste the recipient's Lightning invoice. Confirm the amount and send.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                Can I use my NoOnes Wallet to pay for goods or services via Lightning?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can use your NoOnes Wallet to pay at any merchant that accepts Lightning Network payments. Simply scan their Lightning invoice QR code or paste the invoice to complete the payment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                Why won't my transaction go through?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Transactions may fail due to insufficient balance, network congestion, expired invoice, or connectivity issues. Check your balance and ensure the Lightning invoice is still valid (usually 24 hours).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
