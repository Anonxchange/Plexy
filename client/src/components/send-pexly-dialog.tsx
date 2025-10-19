import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

interface SendPexlyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendPexlyDialog({ open, onOpenChange }: SendPexlyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pexly-id");
  const [recipientValue, setRecipientValue] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"recipient" | "amount" | "confirm">("recipient");

  const handleNext = () => {
    if (step === "recipient") {
      if (!recipientValue) {
        toast({
          title: "Error",
          description: "Please enter a recipient",
          variant: "destructive",
        });
        return;
      }
      setStep("amount");
    } else if (step === "amount") {
      if (!amount || parseFloat(amount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }
      setStep("confirm");
    } else {
      toast({
        title: "Success",
        description: "Transfer initiated successfully",
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setRecipientValue("");
    setAmount("");
    setStep("recipient");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "recipient" && "Send to Pexly user"}
            {step === "amount" && "Enter amount"}
            {step === "confirm" && "Confirm transfer"}
          </DialogTitle>
        </DialogHeader>

        {step === "recipient" && (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pexly-id">Pexly ID</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
              <TabsContent value="pexly-id" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pexly-id">Pexly ID</Label>
                  <Input
                    id="pexly-id"
                    placeholder="Enter Pexly ID"
                    value={recipientValue}
                    onChange={(e) => setRecipientValue(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={recipientValue}
                    onChange={(e) => setRecipientValue(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="phone" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={recipientValue}
                    onChange={(e) => setRecipientValue(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your friends haven't activated Pexly Pay yet? Invite them now and earn up to 250 USDT!{" "}
                <span className="text-primary font-medium cursor-pointer">Refer Now</span>
              </AlertDescription>
            </Alert>

            <Button onClick={handleNext} className="w-full">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === "amount" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium">{recipientValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium">Free</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("recipient")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{recipientValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Amount</span>
                <span className="text-2xl font-bold">{amount} USD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="pt-3 border-t flex justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">{amount} USD</span>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This transfer will be instant and free of charge.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("amount")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Confirm Transfer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
