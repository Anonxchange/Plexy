import { useEffect, useState } from "react";
import {
  initializeMarketCountry,
  detectAndSetMarketCountry,
  getMarketConfig,
  setMarketCountry,
  SUPPORTED_MARKETS,
} from "@/lib/market-manager";
import { shopifyService } from "@/lib/shopify-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const CART_ID_KEY = "shopify_cart_id";

export function MarketSelector() {
  const [country, setCountry] = useState(initializeMarketCountry);

  useEffect(() => {
    let cancelled = false;

    detectAndSetMarketCountry().then((detected) => {
      if (!cancelled && detected) {
        setCountry(detected);
        // Prices/currency/listings depend on market — refetch by reloading.
        window.location.reload();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleChange(nextCountry: string) {
    if (nextCountry === country) return;

    const cartId = window.localStorage.getItem(CART_ID_KEY);

    // Product prices are localized by @inContext(country:), while an existing
    // Shopify cart keeps its own buyer identity. Update that identity before
    // reloading so checkout uses the same market as the product listing.
    if (cartId) {
      try {
        const result = await shopifyService.updateCartBuyerIdentity(cartId, nextCountry);
        if (!result.success) {
          throw new Error("Shopify rejected the cart market update");
        }

        if (result.checkoutUrl) {
          window.localStorage.setItem("shopify_checkout_url", result.checkoutUrl);
        }
      } catch (error) {
        console.error("Failed to update Shopify cart market:", error);
        toast.error("Could not switch shopping market", {
          description: "Your cart was not changed. Please try again.",
        });
        return;
      }
    }

    setMarketCountry(nextCountry);
    setCountry(nextCountry);
    window.location.reload();
  }

  const current = getMarketConfig(country);

  return (
    <Select value={country} onValueChange={handleChange}>
      <SelectTrigger className="w-[110px] gap-1.5" aria-label="Select market">
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span aria-hidden>{current?.flag}</span>
            <span>{current?.code ?? country}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          Shopping in
        </div>
        {SUPPORTED_MARKETS.map((m) => (
          <SelectItem key={m.code} value={m.code}>
            <span className="flex items-center gap-2">
              <span aria-hidden>{m.flag}</span>
              <span>{m.code} — {m.region}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
