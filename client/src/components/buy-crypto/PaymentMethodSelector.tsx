import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, CreditCard, Landmark, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { id: "CARD", name: "Credit / Debit Card", icon: CreditCard, description: "Visa, Mastercard" },
  { id: "APPLE_PAY", name: "Apple Pay", icon: Wallet, description: "Fast & Secure" },
  { id: "GOOGLE_PAY", name: "Google Pay", icon: Wallet, description: "Fast & Secure" },
  { id: "BANK_TRANSFER", name: "Bank Transfer", icon: Landmark, description: "Lower fees" },
];

interface PaymentMethodSelectorProps {
  onSelect: (method: string) => void;
  selectedId?: string;
}

export function PaymentMethodSelector({ onSelect, selectedId }: PaymentMethodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = paymentMethods.find(m => m.id === selectedId) || paymentMethods[0];

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black text-white px-4 py-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-all shadow-sm"
      >
        <div className="flex items-center gap-3">
          <selected.icon className="w-4 h-4" />
          <span className="font-bold text-xs">{selected.name}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-gray-100 shadow-xl overflow-hidden">
          <CardContent className="p-2 bg-white">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => {
                  onSelect(method.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  selectedId === method.id ? "bg-[#CCFF00]/10" : "hover:bg-gray-50"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <method.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{method.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{method.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
