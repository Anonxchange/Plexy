import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import {
  initializeMarketCountry,
  detectAndSetMarketCountry,
  getMarketConfig,
  setMarketCountry,
  SUPPORTED_MARKETS,
} from "@/lib/market-manager";
import { shopifyService } from "@/lib/shopify-service";
import { toast } from "sonner";

const CART_ID_KEY = "shopify_cart_id";

export function MarketSelector() {
  const [country, setCountry] = useState(initializeMarketCountry);
  const [open, setOpen] = useState(false);

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
    if (nextCountry === country) {
      setOpen(false);
      return;
    }

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
    setOpen(false);
    window.location.reload();
  }

  const current = getMarketConfig(country);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Select market"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span aria-hidden>{current?.flag}</span>
        <span>{current?.code ?? country}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-sheet-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-sm bg-background rounded-t-2xl md:rounded-2xl md:shadow-xl flex flex-col max-h-[75vh]"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <h2 id="market-sheet-title" className="text-xs font-semibold uppercase tracking-widest text-primary">
                Shopping in
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-2 pb-2 flex-1">
              {SUPPORTED_MARKETS.map((m) => {
                const isSelected = m.code === country;
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => handleChange(m.code)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span aria-hidden>{m.flag}</span>
                      <span className="font-semibold">{m.code}</span>
                      <span className="text-muted-foreground">— {m.region}</span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="h-2 md:hidden shrink-0" />
          </div>
        </div>
      )}
    </>
  );
}
