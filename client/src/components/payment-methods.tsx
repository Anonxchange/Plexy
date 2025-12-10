
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PaymentIcon = ({ icon, color }: { icon: string; color: string }) => {
  const icons: Record<string, JSX.Element> = {
    shop: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="12" y="20" width="40" height="6" rx="2" fill={color} />
        <rect x="16" y="26" width="32" height="24" rx="2" fill={color} opacity="0.8" />
        <rect x="22" y="34" width="8" height="12" fill="white" opacity="0.9" />
        <rect x="34" y="34" width="8" height="12" fill="white" opacity="0.9" />
        <rect x="18" y="30" width="6" height="4" rx="1" fill="white" opacity="0.7" />
        <rect x="40" y="30" width="6" height="4" rx="1" fill="white" opacity="0.7" />
      </svg>
    ),
    giftcard: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="14" y="28" width="36" height="20" rx="2" fill={color} />
        <rect x="12" y="22" width="40" height="6" rx="1" fill={color} opacity="0.7" />
        <rect x="31" y="22" width="2" height="26" fill="#FFD700" />
        <path d="M24 22c0-4 3-6 6-6s4 2 4 6" fill="#FFD700" />
        <path d="M40 22c0-4-3-6-6-6s-4 2-4 6" fill="#FFD700" />
      </svg>
    ),
    swap: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="24" fill={color} opacity="0.2" />
        <path d="M40 22l8 8-8 8" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M16 30h32" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M24 42l-8-8 8-8" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M48 34H16" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    wallet: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="10" y="18" width="44" height="28" rx="3" fill={color} />
        <rect x="12" y="20" width="40" height="24" rx="2" fill="white" opacity="0.2" />
        <rect x="42" y="28" width="10" height="8" rx="1" fill="white" opacity="0.9" />
        <circle cx="46" cy="32" r="2" fill={color} />
      </svg>
    ),
    card: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="10" y="20" width="44" height="24" rx="3" fill={color} />
        <rect x="10" y="26" width="44" height="4" fill="#333333" opacity="0.5" />
        <rect x="14" y="34" width="24" height="3" rx="1" fill="white" opacity="0.8" />
        <rect x="14" y="39" width="16" height="2" rx="1" fill="white" opacity="0.6" />
        <circle cx="48" cy="38" r="3" fill="#FFD700" />
      </svg>
    ),
    mobile: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="20" y="10" width="24" height="44" rx="3" fill={color} />
        <rect x="22" y="14" width="20" height="32" rx="1" fill="white" opacity="0.9" />
        <circle cx="32" cy="50" r="2" fill="white" opacity="0.9" />
      </svg>
    ),
    bank: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="14" y="16" width="22" height="36" rx="2" fill={color} />
        <rect x="38" y="26" width="12" height="26" rx="1" fill={color} opacity="0.7" />
        <rect x="18" y="20" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="26" y="20" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="18" y="28" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="26" y="28" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="42" y="30" width="4" height="4" rx="0.5" fill="white" opacity="0.7" />
      </svg>
    ),
    bitcoin: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="26" fill={color} />
        <path d="M38 28c0.6-4-2.4-6.2-6.5-7.6l1.3-5.4-3.2-0.8-1.3 5.2c-0.8-0.2-1.7-0.4-2.6-0.6l1.3-5.3-3.2-0.8-1.3 5.4c-0.7-0.2-1.4-0.3-2.1-0.5l-4.4-1.1-0.8 3.5s2.4 0.6 2.3 0.6c1.3 0.3 1.5 1.2 1.5 1.9l-3.5 14c-0.2 0.5-0.7 1.1-1.7 0.8 0 0.1-2.3-0.6-2.3-0.6l-1.5 3.8 4.2 1c0.8 0.2 1.5 0.4 2.3 0.5l-1.3 5.4 3.2 0.8 1.3-5.4c0.9 0.2 1.7 0.5 2.6 0.6l-1.3 5.3 3.2 0.8 1.3-5.4c5.5 1 9.6 0.6 11.4-4.4 1.4-4.1 0-6.4-3-7.9 2.1-0.5 3.7-1.9 4.1-4.8zm-7.4 10.5c-1 4-7.8 1.8-10 1.2l1.8-7.1c2.2 0.6 9.3 1.7 8.2 5.9zm1-10.6c-0.9 3.6-6.6 1.8-8.5 1.3l1.6-6.5c1.9 0.5 7.8 1.4 6.9 5.2z" fill="white" />
      </svg>
    ),
  };
  return icons[icon] || icons.wallet;
};

const paymentCategories = [
  { icon: "shop", color: "#FF6B6B", name: "Shop", count: "200+", badge: "NEW", description: "Find unique products and services from creators" },
  { icon: "giftcard", color: "#FFA500", name: "Gift card store", count: "120+", badge: "HOT", description: "Use crypto to buy instant gift cards for global brands" },
  { icon: "swap", color: "#4FACFE", name: "Swap", count: "100+", badge: "BEST RATE", description: "Exchange your crypto instantly with fast, low-fee swaps" },
  { icon: "wallet", color: "#A855F7", name: "Wallet", count: "90+", description: "Send and receive crypto safely in your secure NoOnes wallet" },
  { icon: "card", color: "#3B82F6", name: "Visa card", count: "80+", description: "Spend your crypto anywhere with a virtual card" },
  { icon: "bitcoin", color: "#F59E0B", name: "Buy crypto", count: "150+", description: "Receive your stablecoins directly in your NoOnes wallet" },
  { icon: "mobile", color: "#10B981", name: "Mobile top-up", count: "60+", description: "Recharge any mobile number globally using your crypto" },
  { icon: "giftcard", color: "#06B6D4", name: "Pexly gift card", count: "85+", description: "Gift crypto instantly with a simple, secure NoOnes link" },
  { icon: "bank", color: "#8B5CF6", name: "Bank Transfer", count: "200+", description: "ACH, SEPA, Wire Transfer, SWIFT transfers" },
  { icon: "card", color: "#EC4899", name: "Credit/Debit Cards", count: "80+", description: "Visa, Mastercard, Amex, Discover" },
  { icon: "mobile", color: "#14B8A6", name: "Mobile Money", count: "150+", description: "M-Pesa, MTN, Orange Money, Airtel" },
  { icon: "wallet", color: "#F97316", name: "E-Wallets", count: "100+", description: "PayPal, Skrill, Neteller, Perfect Money" },
];

const popularMethods = [
  "PayPal", "Venmo", "Cash App", "Zelle", "Apple Pay", "Google Pay", "Bank Transfer", "ACH", "SEPA",
  "M-Pesa", "MTN Mobile Money", "GCash", "Paytm", "WeChat Pay", "Alipay", "Amazon Gift Card", 
  "Visa", "Mastercard", "Western Union", "MoneyGram", "Wise", "Revolut"
];

export function PaymentMethods() {
  return (
    <section className="pt-12 pb-20 bg-white dark:bg-[#1a1d24]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white">
            Our products
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover our full range of tools designed to make crypto easy and accessible
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {paymentCategories.map((method, index) => (
            <Card 
              key={index} 
              className="relative overflow-hidden backdrop-blur-xl bg-gray-50/80 dark:bg-[#2a2d35]/80 border border-gray-200 dark:border-white/10 hover:border-primary/50 cursor-pointer transition-all duration-300 group hover:shadow-2xl hover:shadow-primary/20"
              data-testid={`card-payment-${method.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-3 lg:p-6 space-y-2 lg:space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                    <PaymentIcon icon={method.icon} color={method.color} />
                  </div>
                  {method.badge && (
                    <Badge variant="secondary" className="text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 bg-primary/20 text-primary backdrop-blur-sm border-primary/30 font-semibold">
                      {method.badge}
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm lg:text-lg text-gray-900 dark:text-white mb-1">{method.name}</h3>
                  <p className="text-[11px] lg:text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 lg:line-clamp-none">
                    {method.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
