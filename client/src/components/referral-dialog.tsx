import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Copy, ChevronDown, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralDialog({ open, onOpenChange }: ReferralDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  const referralCode = user?.id?.slice(0, 6).toUpperCase() || "QBRM6X";
  const referralRewards = 0;
  const maxRewards = 250;
  const rewardPerFriend = 2.5;
  const friendReward = 2.5;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied",
      description: "Referral code copied to clipboard",
    });
  };

  const handleShareLink = () => {
    const shareUrl = `https://pexly.com/ref/${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: "Join Pexly Pay",
        text: `Join Pexly Pay using my referral code ${referralCode} and get ${friendReward} USDT!`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    }
  };

  const progressPercent = (referralRewards / maxRewards) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Referral</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Gift className="h-12 w-12 mx-auto text-primary" />
            <h3 className="text-2xl font-bold">
              Invite friends to get max
            </h3>
            <p className="text-3xl font-bold text-primary">
              {maxRewards} USDT Rewards!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">You will get</p>
              <p className="text-lg font-bold">{rewardPerFriend} USDT per friend</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Your friend will get</p>
              <p className="text-lg font-bold">{friendReward} USDT</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rewards progress</span>
                <span className="font-medium">Max {maxRewards} USDT</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="font-mono">
                  {referralRewards} USDT
                </Badge>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="font-mono font-bold text-lg">{referralCode}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleShareLink} className="px-6">
                Share Link
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Collapsible open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span className="font-medium">How does it work?</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      howItWorksOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-2 text-sm text-muted-foreground space-y-2">
                <p>1. Share your referral code with friends</p>
                <p>2. They sign up using your code</p>
                <p>3. When they complete their first trade, you both get rewards!</p>
                <p>4. Earn up to {maxRewards} USDT total</p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={faqOpen} onOpenChange={setFaqOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span className="font-medium">FAQ</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      faqOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-2 text-sm text-muted-foreground space-y-3">
                <div>
                  <p className="font-medium text-foreground mb-1">When do I get my rewards?</p>
                  <p>Rewards are credited instantly after your friend completes their first verified trade.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Is there a limit?</p>
                  <p>You can earn up to {maxRewards} USDT from the referral program.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">How do I withdraw rewards?</p>
                  <p>Rewards are added to your Pexly Pay balance and can be withdrawn anytime.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
