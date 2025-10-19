
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, HelpCircle, MessageCircle, X } from "lucide-react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PexlyPayHelp() {
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const helpOptions = [
    {
      icon: HelpCircle,
      label: "FAQs",
      description: "Check FAQs for quick answers",
      onClick: () => {
        // Navigate to FAQ section or open FAQ dialog
        window.location.href = "#faq";
      }
    },
    {
      icon: MessageCircle,
      label: "Live Chat",
      description: "Start live chat with our Customer Support",
      onClick: () => {
        setHelpDialogOpen(true);
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/wallet/pexly-pay/settings">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Help & Support</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-3">
          {helpOptions.map((option, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={option.onClick}
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-4 py-4 px-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <option.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-base">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-12" id="faq">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">How do I send money using Pexly Pay?</h3>
                <p className="text-sm text-muted-foreground">
                  Tap the "Send" button, enter the recipient's Pexly ID or scan their QR code, 
                  enter the amount, and confirm the transaction.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">What are the transaction limits?</h3>
                <p className="text-sm text-muted-foreground">
                  Daily transaction limits vary based on your verification level. You can check 
                  and adjust your limits in Payment Limits settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">How do I top up my Pexly Pay balance?</h3>
                <p className="text-sm text-muted-foreground">
                  You can top up using cryptocurrency from your wallet, bank transfer, or mobile money. 
                  Simply tap the "Top Up" button on the main Pexly Pay screen.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Is password-free payment safe?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, password-free payments are secure for transactions below your set limit. 
                  You can configure this in Password-Free Settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">How long do transfers take?</h3>
                <p className="text-sm text-muted-foreground">
                  Pexly Pay transfers are instant when sending to other Pexly Pay users. 
                  Bank and mobile money transfers may take 1-3 business days.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Live Chat Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Live Chat Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-primary" />
              <p className="font-medium mb-2">Chat with our support team</p>
              <p className="text-sm text-muted-foreground mb-4">
                We're available 24/7 to help you with any questions or issues.
              </p>
              <Button className="w-full">
                Start Live Chat
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Average response time: &lt; 2 minutes</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PexlyFooter />
    </div>
  );
}
