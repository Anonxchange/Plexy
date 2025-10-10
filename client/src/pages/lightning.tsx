import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Lightning() {
  const handleReceive = () => {
    console.log("Receive Bitcoin via Lightning");
  };

  const handleSend = () => {
    console.log("Send Bitcoin via Lightning");
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Button 
              size="lg" 
              className="h-14 text-lg font-semibold"
              onClick={handleReceive}
            >
              Receive Bitcoin
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={handleSend}
            >
              Send Bitcoin
            </Button>
          </div>
          
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
