
import { CreditCard, Building2, Smartphone, Gift, Banknote, Globe, Wallet, DollarSign, ArrowRightLeft, Landmark, ShoppingCart, Coins, TrendingUp, Store, Boxes, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const paymentCategories = [
  { icon: Building2, name: "Bank Transfer", count: "200+", methods: ["ACH", "SEPA", "Wire Transfer", "SWIFT", "Local Bank", "BACS", "CHAPS", "FPS", "TARGET2", "RTGS"] },
  { icon: CreditCard, name: "Credit/Debit Cards", count: "80+", methods: ["Visa", "Mastercard", "Amex", "Discover", "JCB", "UnionPay", "Diners Club", "Maestro", "RuPay", "Elo"] },
  { icon: Smartphone, name: "Mobile Money", count: "150+", methods: ["M-Pesa", "MTN Mobile Money", "Orange Money", "Airtel Money", "Tigo Pesa", "Vodafone Cash", "Ecocash", "Wave", "Moov Money", "GCash"] },
  { icon: Gift, name: "Gift Cards", count: "120+", methods: ["Amazon", "Apple", "Google Play", "Steam", "eBay", "iTunes", "Xbox", "PlayStation", "Target", "Walmart"] },
  { icon: Wallet, name: "E-Wallets", count: "100+", methods: ["PayPal", "Skrill", "Neteller", "Perfect Money", "WebMoney", "Payeer", "AdvCash", "EcoPayz", "Payoneer", "Paytm"] },
  { icon: DollarSign, name: "Digital Wallets", count: "90+", methods: ["Zelle", "Venmo", "Cash App", "Apple Pay", "Google Pay", "Samsung Pay", "WeChat Pay", "Alipay", "PhonePe", "Paytm"] },
  { icon: Banknote, name: "Cash Payments", count: "60+", methods: ["Cash Deposit", "Cash in Person", "ATM", "Western Union", "Remitly", "Ria", "Moneygram", "Xoom", "WorldRemit", "Cash Pickup"] },
  { icon: ArrowRightLeft, name: "Money Transfer", count: "85+", methods: ["Wise", "Remitly", "WorldRemit", "MoneyGram", "Ria", "Xoom", "Azimo", "TransferGo", "InstaReM", "Xe"] },
  { icon: Globe, name: "International", count: "110+", methods: ["TransferWise", "Revolut", "N26", "Payoneer", "Paysera", "Monese", "Starling", "Bunq", "Vivid", "Lydia"] },
  { icon: Landmark, name: "Banking Apps", count: "130+", methods: ["Chime", "Varo", "Current", "SoFi", "Ally", "Marcus", "Discover", "Capital One", "Chase", "Bank of America"] },
  { icon: ShoppingCart, name: "Buy Now Pay Later", count: "45+", methods: ["Klarna", "Afterpay", "Affirm", "Sezzle", "Quadpay", "Zip", "Laybuy", "Clearpay", "Splitit", "Humm"] },
  { icon: Coins, name: "Crypto Payments", count: "40+", methods: ["Bitcoin", "Ethereum", "USDT", "USDC", "BNB", "XRP", "Litecoin", "Dogecoin", "Cardano", "Solana"] },
  { icon: TrendingUp, name: "Investment Platforms", count: "50+", methods: ["Robinhood", "Webull", "E*TRADE", "TD Ameritrade", "Fidelity", "Schwab", "Interactive Brokers", "M1 Finance", "Acorns", "Stash"] },
  { icon: Store, name: "Point of Sale", count: "35+", methods: ["Square", "Stripe", "PayPal Here", "SumUp", "iZettle", "Clover", "Toast", "Shopify POS", "Lightspeed", "Vend"] },
  { icon: Boxes, name: "Business Solutions", count: "55+", methods: ["QuickBooks", "Xero", "FreshBooks", "Wave", "Zoho Books", "Sage", "Bill.com", "Melio", "Tipalti", "AvidXchange"] },
  { icon: Package, name: "Delivery Services", count: "30+", methods: ["Uber Cash", "Lyft Credits", "DoorDash", "Grubhub", "Postmates", "Deliveroo", "Just Eat", "Bolt", "Rappi", "Glovo"] },
];

const popularMethods = [
  // E-Wallets & Digital Payments
  "PayPal", "Venmo", "Cash App", "Zelle", "Apple Pay", "Google Pay", "Samsung Pay", "Wise", "Revolut",
  
  // Bank Transfers
  "Bank Transfer", "ACH", "SEPA", "Wire Transfer", "SWIFT", "Interac e-Transfer",
  
  // Cards
  "Credit Card", "Debit Card", "Visa", "Mastercard", "American Express", "Discover",
  
  // Mobile Money Africa
  "M-Pesa", "MTN Mobile Money", "Orange Money", "Airtel Money", "Ecocash", "Wave",
  
  // Mobile Money Asia
  "GCash", "PayMaya", "Paytm", "PhonePe", "Alipay", "WeChat Pay",
  
  // Latin America
  "Mercado Pago", "PicPay", "Nequi", "Yape", "Pix",
  
  // Gift Cards
  "Amazon Gift Card", "Apple Gift Card", "Google Play", "Steam", "iTunes",
  
  // E-Wallets International
  "Skrill", "Neteller", "Perfect Money", "WebMoney", "Payoneer",
  
  // Money Transfer
  "Western Union", "MoneyGram", "Remitly", "WorldRemit",
  
  // BNPL
  "Klarna", "Afterpay", "Affirm"
];

export function PaymentMethods() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center space-y-6 mb-16">
          <Badge className="text-sm px-4 py-2">500+ Payment Options</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Trade with Any Payment Method
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Access the world's most comprehensive payment network. From bank transfers to digital wallets, mobile money to gift cards - we support over 500 payment methods globally.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          {paymentCategories.map((method, index) => (
            <Card key={index} className="hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid={`card-payment-${method.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
                  <method.icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-1">{method.name}</div>
                  <div className="text-sm font-medium text-primary">{method.count} options</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">Popular Payment Methods</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {popularMethods.map((method, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="px-4 py-2 text-sm font-medium hover-elevate active-elevate-2 cursor-pointer"
                data-testid={`badge-method-${method.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {method}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
