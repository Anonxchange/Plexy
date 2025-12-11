import { useState } from "react";
import { OfferCard, type OfferCardProps } from "@/components/offer-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useSchema, buyPageSchema } from "@/hooks/use-schema";

//todo: remove mock functionality
const mockOffers: OfferCardProps[] = [
  {
    id: "1",
    vendor: { name: "Sarah Trading", isVerified: true, trades: 2341, responseTime: "< 2 min" },
    paymentMethod: "Bank Transfer",
    pricePerBTC: 122500,
    currency: "USD",
    availableRange: { min: 100, max: 50000 },
    limits: { min: 50, max: 10000 },
    type: "buy",
  },
  {
    id: "2",
    vendor: { name: "CryptoKing", isVerified: true, trades: 5689, responseTime: "< 1 min" },
    paymentMethod: "PayPal",
    pricePerBTC: 122800,
    currency: "USD",
    availableRange: { min: 50, max: 20000 },
    limits: { min: 25, max: 5000 },
    type: "buy",
  },
  {
    id: "3",
    vendor: { name: "BitMaster", isVerified: false, trades: 456, responseTime: "< 10 min" },
    paymentMethod: "Credit Card",
    pricePerBTC: 123200,
    currency: "USD",
    availableRange: { min: 200, max: 30000 },
    limits: { min: 100, max: 8000 },
    type: "buy",
  },
  {
    id: "4",
    vendor: { name: "QuickTrade", isVerified: true, trades: 3421, responseTime: "< 3 min" },
    paymentMethod: "Zelle",
    pricePerBTC: 122300,
    currency: "USD",
    availableRange: { min: 100, max: 40000 },
    limits: { min: 50, max: 15000 },
    type: "buy",
  },
];

export default function Buy() {
  useSchema(buyPageSchema, "buy-page-schema");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Buy Bitcoin</h1>
          <p className="text-muted-foreground">Choose from the best offers available</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search offers..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-offers"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Payment Method</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger data-testid="select-payment-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="grid gap-6">
              {mockOffers.map((offer) => (
                <OfferCard key={offer.id} {...offer} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
