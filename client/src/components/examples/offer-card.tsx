import { OfferCard } from "../offer-card";

export default function OfferCardExample() {
  return (
    <div className="p-4">
      <OfferCard
        id="1"
        vendor={{
          name: "John Trader",
          isVerified: true,
          trades: 1542,
          responseTime: "< 5 min",
        }}
        paymentMethod="Bank Transfer"
        pricePerBTC={122500}
        currency="USD"
        availableRange={{ min: 100, max: 50000 }}
        limits={{ min: 50, max: 10000 }}
        type="buy"
      />
    </div>
  );
}
