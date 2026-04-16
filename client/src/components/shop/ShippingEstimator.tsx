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
import {
  MapPin,
  Truck,
  CreditCard,
  ShoppingCart,
  Loader2,
  Package,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveRate {
  handle: string;
  title: string;
  amount: string;
  currencyCode: string;
  deliveryMethodType: string;
}

type FetchState = "idle" | "loading" | "loaded" | "unavailable" | "error";

// ─── Metafield ship_to parser (for available country filtering) ───────────────
function parseShipToCountryCodes(shipping: ShippingInfo | undefined): string[] {
  const raw = shipping?.shipTo?.trim() || "";
  if (!raw || raw.toLowerCase() === "worldwide" || raw.toLowerCase() === "select at checkout") {
    return ALL_COUNTRIES.map((c) => c.code);
  }
  const tokens = raw.startsWith("[")
    ? (() => { try { return JSON.parse(raw) as string[]; } catch { return raw.split(/[,|;]+/); } })()
    : raw.split(/[,|;]+/);

  const codes = tokens.map((t: string) => {
    const upper = t.trim().toUpperCase();
    if (ALL_COUNTRIES.some((c) => c.code === upper)) return upper;
    return ALL_COUNTRIES.find((c) => c.name.toLowerCase() === t.trim().toLowerCase())?.code ?? null;
  }).filter((c): c is string => c !== null);

  return codes.length ? codes : ALL_COUNTRIES.map((c) => c.code);
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
  const availableCountryCodes = useMemo(() => parseShipToCountryCodes(shipping), [shipping]);
  const availableCountries = ALL_COUNTRIES.filter((c) => availableCountryCodes.includes(c.code));

  const [selectedCountry, setSelectedCountry] = useState<string>(
    availableCountries.find((c) => c.code === "US")?.code ?? availableCountries[0]?.code ?? ""
  );
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [liveRates, setLiveRates] = useState<LiveRate[]>([]);
  const [selectedRateHandle, setSelectedRateHandle] = useState<string>("");
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { addToCart } = useCart();

  const selectedRate = liveRates.find((r) => r.handle === selectedRateHandle) ?? liveRates[0] ?? null;
  const shippingFee = selectedRate ? parseFloat(selectedRate.amount) : null;
  const total = shippingFee !== null ? productPrice + shippingFee : null;

  const selectedCountryName = ALL_COUNTRIES.find((c) => c.code === selectedCountry)?.name ?? "";

  const handleCheckRates = async () => {
    if (!variantId) {
      toast.error("Please select all product options first.");
      return;
    }
    setFetchState("loading");
    setLiveRates([]);
    setSelectedRateHandle("");
    setCheckoutUrl("");

    try {
      const result = await shopifyService.createCartForShipping(variantId, selectedCountry);

      if (!result) {
        setFetchState("error");
        return;
      }

      setCheckoutUrl(result.checkoutUrl);

      if (result.deliveryGroups.length === 0) {
        setFetchState("unavailable");
        return;
      }

      setLiveRates(result.deliveryGroups);
      setSelectedRateHandle(result.deliveryGroups[0]?.handle ?? "");
      setFetchState("loaded");
    } catch {
      setFetchState("error");
    }
  };

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setFetchState("idle");
    setLiveRates([]);
    setSelectedRateHandle("");
    setCheckoutUrl("");
  };

  const handleGoToCheckout = async () => {
    if (!variantId) {
      toast.error("Please select all product options first.");
      return;
    }
    setIsCheckingOut(true);
    try {
      const url = checkoutUrl || (await shopifyService.createCart({ variantId, quantity: 1 }))?.checkoutUrl;
      if (!url) {
        toast.error("Could not create checkout. Please try again.");
        return;
      }
      window.location.href = url;
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

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Shipping Estimator</p>
        {fetchState === "loaded" && (
          <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Live rates
          </span>
        )}
      </div>

      <Separator />

      {/* Country selector */}
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Ship to
          </label>
          <div className="flex gap-2">
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="flex-1 h-10 text-sm">
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
            <Button
              onClick={handleCheckRates}
              disabled={fetchState === "loading" || !variantId}
              className="h-10 px-4 shrink-0"
              variant={fetchState === "loaded" ? "outline" : "default"}
            >
              {fetchState === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : fetchState === "loaded" ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh
                </>
              ) : (
                "Check Rates"
              )}
            </Button>
          </div>
        </div>

        {/* Idle hint */}
        {fetchState === "idle" && (
          <p className="text-xs text-muted-foreground">
            Select your country and click <strong>Check Rates</strong> to see live shipping options from Shopify.
          </p>
        )}

        {/* Error */}
        {fetchState === "error" && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not fetch rates. Please try again.
          </div>
        )}

        {/* Unavailable */}
        {fetchState === "unavailable" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Package className="h-4 w-4 shrink-0" />
            No shipping options found to <strong>{selectedCountryName}</strong>. Try another country or check rates at checkout.
          </div>
        )}
      </div>

      {/* Live rate cards */}
      {fetchState === "loaded" && liveRates.length > 0 && (
        <>
          <Separator />
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Available shipping to {selectedCountryName}
            </p>
            <div className="space-y-2">
              {liveRates.map((rate) => {
                const fee = parseFloat(rate.amount);
                const isSelected = selectedRateHandle === rate.handle || (selectedRateHandle === "" && liveRates[0]?.handle === rate.handle);
                return (
                  <button
                    key={rate.handle}
                    onClick={() => setSelectedRateHandle(rate.handle)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border/40 hover:border-primary/40 bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "border-primary" : "border-border"
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span>{rate.title}</span>
                    </div>
                    <span className={`font-bold ${isSelected ? "text-primary" : ""}`}>
                      {fee === 0 ? "Free" : formatPrice(fee, rate.currencyCode)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Cost summary — shown once rates are loaded */}
      {fetchState === "loaded" && selectedRate && (
        <>
          <Separator />
          <div className="p-4 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Product price</span>
              <span className="font-semibold">{formatPrice(productPrice, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                {selectedRate.title}
              </span>
              <span className="font-semibold">
                {parseFloat(selectedRate.amount) === 0
                  ? "Free"
                  : formatPrice(parseFloat(selectedRate.amount), selectedRate.currencyCode)}
              </span>
            </div>
            {total !== null && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">Estimated total</span>
                  <span className="font-bold text-lg text-primary">
                    {formatPrice(total, currency)}
                  </span>
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              * Taxes calculated at checkout. Delivery times shown at checkout.
            </p>
          </div>
        </>
      )}

      <Separator />

      {/* Actions */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-11" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button
          className="h-11"
          onClick={handleGoToCheckout}
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
