import { openCountryMenu, useCountryPreferences } from "@/lib/country-preferences";

export function CountrySummary({ topup = false }: { topup?: boolean }) {
  const { digital } = useCountryPreferences();
  const country = digital?.country;
  const isAllCountries = !topup && digital?.source === "manual" && !country;
  let name = isAllCountries ? "All countries" : country;
  try { if (country) name = new Intl.DisplayNames(["en"], { type: "region" }).of(country); } catch { /* Show code. */ }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
      <span>{topup ? "Recipient country" : "Redemption country"}: <strong>{name || "Choose a country"}</strong></span>
      <button type="button" className="underline underline-offset-2" onClick={() => openCountryMenu("digital")}>Change</button>
    </span>
  );
}
