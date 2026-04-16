import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Truck, Clock, CreditCard, ShoppingCart, Loader2, Package } from "lucide-react";
import { shopifyService, formatPrice } from "@/lib/shopify-service";
import { useCart } from "@/hooks/use-shopify-cart";
import { toast } from "sonner";
import type { ShippingInfo } from "./shipping-types";

// ─── Country list ─────────────────────────────────────────────────────────────
const ALL_COUNTRIES: { code: string; name: string }[] = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" }, { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" }, { code: "AU", name: "Australia" }, { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" }, { code: "BR", name: "Brazil" }, { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" }, { code: "CN", name: "China" }, { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" }, { code: "CZ", name: "Czech Republic" }, { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" }, { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "GH", name: "Ghana" }, { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" }, { code: "HU", name: "Hungary" }, { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" }, { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" }, { code: "JP", name: "Japan" }, { code: "JO", name: "Jordan" },
  { code: "KE", name: "Kenya" }, { code: "KW", name: "Kuwait" }, { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" }, { code: "MA", name: "Morocco" }, { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" }, { code: "NG", name: "Nigeria" }, { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" }, { code: "PH", name: "Philippines" }, { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" }, { code: "QA", name: "Qatar" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "SA", name: "Saudi Arabia" }, { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" }, { code: "KR", name: "South Korea" }, { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" }, { code: "CH", name: "Switzerland" }, { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" }, { code: "TR", name: "Turkey" }, { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" }, { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" }, { code: "VN", name: "Vietnam" },
];

// ─── Metafield parser ─────────────────────────────────────────────────────────
function parseMultiValue(raw: string | undefined): string[] {
  if (!raw) return [];
  raw = raw.trim();
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
  }
  return raw.split(/[,|;]+/).map((s) => s.trim()).filter(Boolean);
}

function parseFee(raw: string | undefined): number | null {
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw);
      const first = Object.values(obj)[0];
      const n = parseFloat(String(first));
      return isNaN(n) ? null : n;
    } catch {}
  }
  const match = raw.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

interface ParsedShipping {
  methods: string[];
  processingTimes: string[];
  deliveryTimes: string[];
  fees: (number | null)[];
  availableCountryCodes: string[];
  shipsFrom: string;
}

function parseShipping(shipping: ShippingInfo | undefined): ParsedShipping {
  const methods = parseMultiValue(shipping?.method);
  const processingTimes = parseMultiValue(shipping?.processingTime);
  const deliveryTimes = parseMultiValue(shipping?.deliveryTime);
  const rawFees = parseMultiValue(shipping?.fee);
  const fees = rawFees.length ? rawFees.map((f) => parseFee(f)) : [parseFee(shipping?.fee)];

  // Parse ship_to into country codes or names
  const shipToRaw = shipping?.shipTo || "";
  let availableCountryCodes: string[] = [];
  if (
    shipToRaw.toLowerCase() === "worldwide" ||
    shipToRaw.toLowerCase() === "select at checkout" ||
    shipToRaw === ""
  ) {
    availableCountryCodes = ALL_COUNTRIES.map((c) => c.code);
  } else {
    const tokens = parseMultiValue(shipToRaw);
    availableCountryCodes = tokens
      .map((t) => {
        const upper = t.toUpperCase().trim();
        // Try as code first
        if (ALL_COUNTRIES.some((c) => c.code === upper)) return upper;
        // Try as name
        const byName = ALL_COUNTRIES.find(
          (c) => c.name.toLowerCase() === t.toLowerCase()
        );
        return byName?.code || null;
      })
      .filter((c): c is string => c !== null);
    if (availableCountryCodes.length === 0) {
      availableCountryCodes = ALL_COUNTRIES.map((c) => c.code);
    }
  }

  return {
    methods: methods.length ? methods : ["Standard Shipping"],
    processingTimes,
    deliveryTimes,
    fees,
    availableCountryCodes,
    shipsFrom: shipping?.shipsFrom || "Supplier warehouse",
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ShippingEstimatorProps {
  shipping: ShippingInfo | undefined;
  productPrice: number;
  currency: string;
  variantId: string | undefined;
  productTitle: string;
  productImage?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ShippingEstimator({
  shipping,
  productPrice,
  currency,
  variantId,
  productTitle,
  productImage,
}: ShippingEstimatorProps) {
  const parsed = useMemo(() => parseShipping(shipping), [shipping]);
  const availableCountries = ALL_COUNTRIES.filter((c) =>
    parsed.availableCountryCodes.includes(c.code)
  );

  const [selectedCountry, setSelectedCountry] = useState<string>(
    availableCountries[0]?.code ?? ""
  );
  const [selectedMethodIdx, setSelectedMethodIdx] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { addToCart } = useCart();

  const method = parsed.methods[selectedMethodIdx] ?? parsed.methods[0];
  const processingTime =
    parsed.processingTimes[selectedMethodIdx] ??
    parsed.processingTimes[0] ??
    "Calculated at checkout";
  const deliveryTime =
    parsed.deliveryTimes[selectedMethodIdx] ??
    parsed.deliveryTimes[0] ??
    "Calculated at checkout";
  const fee =
    parsed.fees[selectedMethodIdx] ?? parsed.fees[0];

  const shippingCostDisplay =
    fee === null || fee === undefined
      ? "Calculated at checkout"
      : fee === 0
      ? "Free"
      : formatPrice(fee, currency);

  const total = fee != null ? productPrice + fee : null;

  const handleCheckout = async () => {
    if (!variantId) {
      toast.error("Please select all product options before checkout.");
      return;
    }
    setIsCheckingOut(true);
    try {
      const result = await shopifyService.createCart({ variantId, quantity: 1 });
      if (!result?.checkoutUrl) {
        toast.error("Could not create checkout. Please try again.");
        return;
      }
      window.location.href = result.checkoutUrl;
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleAddToCart = async () => {
    if (!variantId) {
      toast.error("Please select all product options first.");
      return;
    }
    await addToCart(variantId, {
      variantId,
      title: productTitle,
      price: productPrice,
      currency,
      image: productImage ?? "",
    });
  };

  const selectedCountryName =
    ALL_COUNTRIES.find((c) => c.code === selectedCountry)?.name ?? "";

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden space-y-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Shipping Estimator</p>
      </div>

      <Separator />

      {/* Selectors */}
      <div className="p-4 space-y-3">
        {/* Country */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Ship to
          </label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full h-10 text-sm">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {availableCountries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shipping Method */}
        {parsed.methods.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Shipping method
            </label>
            <div className="flex flex-wrap gap-2">
              {parsed.methods.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setSelectedMethodIdx(i)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                    selectedMethodIdx === i
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border/40 hover:border-primary/50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
        {parsed.methods.length === 1 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Shipping method
            </p>
            <p className="text-sm font-semibold">{method}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Estimate breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            Ships from
          </div>
          <p className="text-sm font-semibold">{parsed.shipsFrom}</p>
        </div>
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Est. processing
          </div>
          <p className="text-sm font-semibold">{processingTime}</p>
        </div>
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            Est. delivery
          </div>
          <p className="text-sm font-semibold">{deliveryTime}</p>
          {selectedCountryName && (
            <p className="text-xs text-muted-foreground">to {selectedCountryName}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Cost summary */}
      <div className="p-4 space-y-2.5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Product price</span>
          <span className="font-semibold">{formatPrice(productPrice, currency)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Shipping fee
          </span>
          <span className="font-semibold">
            {shippingCostDisplay}
          </span>
        </div>
        {total !== null && (
          <>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">Total</span>
              <span className="font-bold text-lg text-primary">
                {formatPrice(total, currency)}
              </span>
            </div>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          * Taxes and final shipping calculated at checkout. Delivery times may vary by destination.
        </p>
      </div>

      <Separator />

      {/* Actions */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-11"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button
          className="h-11"
          onClick={handleCheckout}
          disabled={isCheckingOut || !variantId}
        >
          {isCheckingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Go to Checkout"
          )}
        </Button>
      </div>
    </div>
  );
}
