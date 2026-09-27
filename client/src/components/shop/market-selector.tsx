import { useEffect, useState } from "react";
import {
  initializeMarketCountry,
  detectAndSetMarketCountry,
  getMarketConfig,
  setMarketCountry,
  SUPPORTED_MARKETS,
} from "@/lib/market-manager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  function handleChange(nextCountry: string) {
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
