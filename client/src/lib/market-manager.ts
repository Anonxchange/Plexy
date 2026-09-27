import { useEffect, useState } from "react";
import { getCountryCode } from "@/lib/geo";
import {
  getMarketCountry,
  setMarketCountry,
} from "@/lib/shopify-service";

const SUPPORTED_COUNTRIES = new Set(["NG", "GB", "US", "CA"]);

export function initializeMarketCountry(): string {
  const saved = getMarketCountry();

  // Respect the user's previous manual selection.
  if (saved && SUPPORTED_COUNTRIES.has(saved)) {
    return saved;
  }

  return "US";
}

export function MarketSelector() {
  const [country, setCountry] = useState(initializeMarketCountry);

  useEffect(() => {
    let cancelled = false;

    async function detectMarket() {
      // Do not override a country the user previously selected.
      if (getMarketCountry()) return;

      const detected = (await getCountryCode()).toUpperCase();
      const nextCountry = SUPPORTED_COUNTRIES.has(detected) ? detected : "US";

      if (!cancelled) {
        setMarketCountry(nextCountry);
        setCountry(nextCountry);

        // Reload or trigger a Shopify-product refetch.
        window.location.reload();
      }
    }

    void detectMarket();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(nextCountry: string) {
    setMarketCountry(nextCountry);
    setCountry(nextCountry);
    window.location.reload();
  }

  // Render your Select here using `country` and `handleChange`.
}
