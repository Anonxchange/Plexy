import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";

export default function CryptoToBank() {
  const [sendAmount, setSendAmount] = useState("0.00001116");
  const [sendCurrency, setSendCurrency] = useState("btc");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [receiveCurrency, setReceiveCurrency] = useState("ngn");
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Get rate
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className="w-16 h-0.5 bg-muted"></div>
            <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className="w-16 h-0.5 bg-muted"></div>
            <div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className="w-16 h-0.5 bg-muted"></div>
            <div className={`w-3 h-3 rounded-full ${currentStep >= 4 ? 'bg-primary' : 'bg-muted'}`}></div>
          </div>
        </div>

        {/* You send */}
        <div className="mb-6">
          <Label htmlFor="send" className="text-base font-semibold mb-3 block">
            You send
          </Label>
          <div className="relative">
            <Input
              id="send"
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              className="w-full h-16 pr-32 text-lg border-2"
              placeholder="0.00000000"
            />
            <Select value={sendCurrency} onValueChange={setSendCurrency}>
              <SelectTrigger className="absolute right-2 top-1/2 -translate-y-1/2 w-28 border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="btc">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₿</span>
                    </div>
                    <span>BTC</span>
                  </div>
                </SelectItem>
                <SelectItem value="usdt">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₮</span>
                    </div>
                    <span>USDT</span>
                  </div>
                </SelectItem>
                <SelectItem value="eth">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Ξ</span>
                    </div>
                    <span>ETH</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* You receive */}
        <div className="mb-8">
          <Label htmlFor="receive" className="text-base font-semibold mb-3 block">
            You receive
          </Label>
          <div className="relative">
            <Input
              id="receive"
              type="text"
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(e.target.value)}
              className="w-full h-16 pr-32 text-lg border-2"
              placeholder="Enter amount"
            />
            <Select value={receiveCurrency} onValueChange={setReceiveCurrency}>
              <SelectTrigger className="absolute right-2 top-1/2 -translate-y-1/2 w-28 border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ngn">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇳🇬</span>
                    <span>NGN</span>
                  </div>
                </SelectItem>
                <SelectItem value="usd">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇺🇸</span>
                    <span>USD</span>
                  </div>
                </SelectItem>
                <SelectItem value="eur">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇪🇺</span>
                    <span>EUR</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Next Button */}
        <Button className="w-full md:w-auto h-14 px-12 text-base font-bold mb-12">
          Next
        </Button>

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
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">FAQ</h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                What is Sell crypto instantly?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sell crypto instantly allows you to convert your cryptocurrency to local currency and receive it directly in your bank account within minutes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                How much does NoOnes charge?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                NoOnes charges a competitive service fee based on the transaction amount. The exact fee will be displayed before you confirm your transaction.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                How much will I receive for the USDT I send?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The amount you receive is calculated based on the current market exchange rate minus our service fee. You'll see the exact amount before confirming the transaction.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                What happens to my funds when I transfer them?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your crypto is converted to local currency at the current market rate and transferred directly to your registered bank account. The process is secure and typically completes within 5-30 minutes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
