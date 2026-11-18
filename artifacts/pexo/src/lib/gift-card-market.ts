import { getCountryPreferences, setCountryPreference } from "./country-preferences";
export const GIFT_CARD_MARKET_CHANGED_EVENT = "pexly:gift-card-market-changed";
export function getGiftCardMarketCountry() {
  return getCountryPreferences().digital?.country;
}
export function setGiftCardMarketCountry(country?: string) {
  setCountryPreference("digital", country);
}
