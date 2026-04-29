
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, CreditCard, Building2, Smartphone, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BankAccount {
  id: string;
  payment_type: string;
  bank_name: string;
  account_number: string;
  account_holder?: string;
  account_name?: string;
}

interface BankAccountSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAccount: (account: BankAccount) => void;
  selectedAccountId?: string;
}

const getPaymentIcon = (type: string) => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('bank')) return Building2;
  if (lowerType.includes('mobile') || lowerType.includes('wallet')) return Smartphone;
  if (lowerType.includes('card')) return CreditCard;
  return Wallet;
};

export function BankAccountSelector({
  open,
  onOpenChange,
  onSelectAccount,
  selectedAccountId,
}: BankAccountSelectorProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const supabase = createClient();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (!user || !open) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (!error && data) {
          setBankAccounts(data);
        }
      } catch (error) {
        console.error("Error fetching bank accounts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankAccounts();
  }, [open, user]);

  const handleSelectAccount = (account: BankAccount) => {
    onSelectAccount(account);
    onOpenChange(false);
  };

  const content = (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : bankAccounts.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-lg">No Payment Methods</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a payment method in your account settings first
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              window.location.href = '/account-settings';
            }}
            className="mt-4"
          >
            Go to Settings
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {bankAccounts.map((account) => {
            const Icon = getPaymentIcon(account.payment_type);
            const isSelected = selectedAccountId === account.id;

            return (
              <button
                key={account.id}
                onClick={() => handleSelectAccount(account)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base truncate">
                        {account.bank_name}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {account.payment_type}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                        {account.account_number}
                      </div>
                      <div className="text-xs text-muted-foreground/80 mt-0.5 truncate">
                        {account.account_holder || account.account_name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-lg">Select Payment Method</SheetTitle>
                  <SheetDescription className="text-sm mt-1">
                    Choose where you want to receive payment
                  </SheetDescription>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              {content}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
          <DialogDescription>
            Choose where you want to receive payment
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
