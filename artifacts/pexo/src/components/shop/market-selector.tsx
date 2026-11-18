import { openCountryMenu, useCountryPreferences } from "@/lib/country-preferences";

export function MarketSelector() {
  const country = useCountryPreferences().delivery?.country;
  return (
    <button type="button" onClick={() => openCountryMenu("delivery")} className="rounded-lg border px-3 py-2 text-sm">
      Shop delivery country: {country || "Choose"} · Change
    </button>
  );
}
