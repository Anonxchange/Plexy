import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { QRCodeSVG as QRCode } from "qrcode.react";

declare global {
  interface Window {
    Opennode?: any;
  }
}

export default function Lightning() {
  const { user, session } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"receive" | "send">("receive");
  const containerRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ lightning_invoice: string; amount: string } | null>(null);
  const [sendInvoice, setSendInvoice] = useState("");
  const [copied, setCopied] = useState(false);
  const [lightningBalance, setLightningBalance] = useState<string>("0.00");
  const [loadingBalance, setLoadingBalance] = useState(false);

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

  useEffect(() => {
    // Load Lightning balance on mount
    fetchLightningBalance();
    
    // Set up periodic refresh every 30 seconds to catch webhook updates
    const interval = setInterval(() => {
      fetchLightningBalance();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [session?.access_token]);

  const fetchLightningBalance = async () => {
    if (!session?.access_token) return;
    
    setLoadingBalance(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL not configured');
      
      // TODO: Fetch Lightning balance from OpenNode API
      // For now, showing placeholder balance
      setLightningBalance("0.00");
    } catch (error) {
      console.error('Error fetching Lightning balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

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
        
        // Refresh balance after invoice is created (webhook will update when paid)
        setTimeout(() => fetchLightningBalance(), 2000);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Receive and send Bitcoin with Lightning network
          </h1>
          <p className="text-lg text-muted-foreground">
            Easily send and receive Bitcoin to your wallet with amazing low fees and near-instant speed.
          </p>
        </div>

        {/* Desktop Grid Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* Left Column: Balance and Transaction Forms */}
          <div className="lg:col-span-8 space-y-6">
            {/* Lightning Balance Card */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">⚡ Lightning Balance</p>
                    <p className="text-3xl font-bold text-foreground">
                      {loadingBalance ? "..." : lightningBalance} BTC
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-2">Available to send</p>
                    <p className="text-lg font-semibold text-primary">
                      {lightningBalance} BTC
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Transaction Controls Card */}
            <Card>
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
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.00000001"
                      min="0"
                      placeholder="0.001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground text-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      BTC
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary/40" />
                    Minimum: 0.00000001 BTC
                  </p>
                </div>

                {/* Action Button */}
                {!user ? (
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98]"
                    onClick={() => setLocation("/signin")}
                  >
                    Sign In to Continue
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98]"
                    onClick={activeTab === "receive" ? handleReceive : handleSend}
                  >
                    {activeTab === "receive" ? "Create Invoice" : "Send Now"}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  ⚡ Powered by OpenNode (Instant Lightning payments)
                </p>
              </CardContent>
            </Card>

            {/* Transactions Header & Section */}
            {user && (
              <div className="pt-4">
                <h2 className="text-2xl font-bold mb-4">Transactions</h2>
                <Card className="bg-muted/30 border-dashed border-2">
                  <CardContent className="py-24">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 mb-8 rounded-full bg-muted/50 flex items-center justify-center">
                        <Search className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <p className="text-xl font-medium text-muted-foreground">
                        No transactions found
                      </p>
                      <p className="text-base text-muted-foreground/60 max-w-sm mx-auto mt-3">
                        Your Lightning network activity will appear here once you start transacting.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column: FAQ and Information */}
          <div className="lg:col-span-4 mt-8 lg:mt-0 space-y-6">
            <div className="sticky top-8 space-y-6">
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">Why use Lightning?</h3>
                  <ul className="space-y-3">
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-[10px]">⚡</span>
                      </div>
                      Instant settlements (under 1 second)
                    </li>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-[10px]">💰</span>
                      </div>
                      Extremely low fees (fractions of a cent)
                    </li>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-[10px]">🌍</span>
                      </div>
                      Perfect for micro-payments anywhere
                    </li>
                  </ul>
                  <div className="mt-6">
                    <a 
                      href="#faq" 
                      className="text-primary hover:underline font-semibold text-sm inline-flex items-center gap-1"
                    >
                      Learn more about Lightning feature <span>→</span>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Your Lightning Invoice</DialogTitle>
            </DialogHeader>
            {invoiceData && (
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Lightning Invoice:</p>
                  <p className="text-sm font-mono break-all text-foreground">
                    {invoiceData.lightning_invoice}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCode 
                      value={invoiceData.lightning_invoice} 
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
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
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Bitcoin via Lightning</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
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
                Is the Lightning Network safe?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, the Lightning Network is built on top of the Bitcoin blockchain and uses smart contracts to ensure that your funds are secure. It's a well-tested and widely used technology in the Bitcoin ecosystem.
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
