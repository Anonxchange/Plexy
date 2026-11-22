import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { PexlyLogo } from "@/components/pexly-logo";
import { useAuth } from "@/lib/auth-context";
import { useEvmWallet } from "@/lib/wallet-provider";
import { Check, Search, ShoppingCart, User } from "@/components/header-icons";
import { useCart } from "@/hooks/use-shopify-cart";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { useTopupCart } from "@/hooks/use-topup-cart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGiftCardCountries } from "@/hooks/use-reloadly";
import {
  getMarketConfig,
  SUPPORTED_MARKETS as COUNTRY_NAMES,
} from "@/lib/market-manager";
import {
  setGiftCardMarketCountry,
} from "@/lib/gift-card-market";
import { isValidLang } from "@/lib/detect-language";
import { switchLanguage } from "@/lib/language-navigation";
import i18n from "@/lib/i18n";
import "./app-header.css";
import { OPEN_COUNTRY_MENU_EVENT, useCountryPreferences, type CountryScope as PreferenceScope } from "@/lib/country-preferences";
import { useQuery } from "@tanstack/react-query";
import { shopifyService } from "@/lib/shopify-service";

const HeaderSearch = lazy(() =>
  import("@/components/header-search").then(module => ({ default: module.HeaderSearch })),
);
const CartSheet = lazy(() =>
  import("@/components/shop/CartSheet").then(module => ({ default: module.CartSheet })),
);

type CountryScope = "shop" | "gift-card";

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ja", label: "日本語" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "yo", label: "Yorùbá" },
  { code: "ha", label: "Hausa" },
];

const marketplace = [
  { title: "Gift Cards", detail: "Shopping, gaming, streaming", href: "/gift-cards" },
  { title: "Mobile Top Up", detail: "Airtime and data, anywhere", href: "/wallet/mobile-topup" },
  { title: "Physical Products", detail: "Electronics, fashion, home", href: "/shop" },
];

const resources = [
  { title: "FAQ", detail: "Answers to common questions", href: "/support" },
  { title: "Blog", detail: "News and guides", href: "/blogs" },
];

function normalizeRoute(path: string) {
  const segments = path.split("?")[0].split("/").filter(Boolean);
  if (segments[0] && (isValidLang(segments[0]) || segments[0] === "jp")) {
    segments.shift();
  }
  return `/${segments.join("/")}` || "/";
}

function flagForCountry(countryCode?: string) {
  if (!countryCode) return "🌍";
  return countryCode
    .toUpperCase()
    .replace(/[A-Z]/g, letter =>
      String.fromCodePoint(letter.charCodeAt(0) + 127397),
    );
}

export function AppHeader() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const wallet = useEvmWallet();
  const shopCart = useCart();
  const giftCart = useGiftCardCart();
  const topupCart = useTopupCart();
  const routePath = normalizeRoute(location);
  const isHomePage = routePath === "/";
  const isGiftCardsPage = routePath.startsWith("/gift-cards");
  const isTopupPage = /mobile-top-?up/.test(routePath);
  const isShopPage = routePath === "/shop" || routePath.startsWith("/shop/");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [cartOpen, setCartOpen] = useState(
    () => new URLSearchParams(window.location.search).get("openCart") === "1",
  );
  const giftCountriesQuery = useGiftCardCountries({
    enabled: countryOpen,
  });
  const preferences = useCountryPreferences();
  const shopCountry = preferences.delivery?.country;
  const giftCardCountry = preferences.digital?.country;
  const [editingScope, setEditingScope] = useState<CountryScope | null>(null);
  const [countryBusy, setCountryBusy] = useState(false);
  const marketsQuery = useQuery({
    queryKey: ["shopify-localization"],
    queryFn: () => shopifyService.getAvailableCountries(),
    staleTime: 300_000,
    retry: false,
    enabled: countryOpen,
  });
  const openCartFromUrl = new URLSearchParams(window.location.search).get("openCart") === "1";
  const cartItemCount =
    shopCart.items.reduce((count, item) => count + item.quantity, 0) +
    giftCart.items.reduce((count, item) => count + item.quantity, 0) +
    topupCart.items.length;
  const walletHref = user ? "/wallet" : "/signin?redirect=%2Fwallet";
  const activeCountryScope: CountryScope = isGiftCardsPage || isTopupPage
    ? "gift-card"
    : isShopPage
      ? "shop"
      : isHomePage
        ? "gift-card"
        : "shop";
  const pickerScope = editingScope ?? activeCountryScope;
  const displayedGiftCardCountry = giftCardCountry;
  const isAllGiftCardCountries = preferences.digital?.source === "manual" && !displayedGiftCardCountry;
  const activeCountryFlag =
    activeCountryScope === "shop"
      ? flagForCountry(shopCountry)
      : isAllGiftCardCountries
        ? "🌍"
        : giftCountriesQuery.data?.find(
            country => country.isoName === displayedGiftCardCountry,
          )?.flag ?? flagForCountry(displayedGiftCardCountry);
  const normalizedSearch = countrySearch.trim().toLocaleLowerCase();
  const filteredShopCountries = (marketsQuery.data ?? []).filter(country =>
    `${country.region} ${country.code}`.toLocaleLowerCase().includes(normalizedSearch),
  );
  // Gift-card availability must not hide a country that may have top-ups.
  // Each digital provider checks availability for the shared selection.
  const digitalCountryOptions = COUNTRY_NAMES.map(country =>
    giftCountriesQuery.data?.find(giftCountry => giftCountry.isoName === country.code) ??
    { isoName: country.code, name: country.region, flag: flagForCountry(country.code) });
  const filteredGiftCountries = digitalCountryOptions.filter(country =>
    `${country.name} ${country.isoName}`.toLocaleLowerCase().includes(normalizedSearch),
  );
  const showAllGiftCountriesOption =
    !normalizedSearch || "all countries global worldwide".includes(normalizedSearch);
  const currentLanguage = i18n.language?.split("-")[0] || "en";

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 30);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const open = (event: Event) => {
      const scope = (event as CustomEvent<{ scope: PreferenceScope }>).detail.scope;
      setEditingScope(scope === "delivery" ? "shop" : "gift-card");
      setCountrySearch("");
      setCountryOpen(true);
    };
    window.addEventListener(OPEN_COUNTRY_MENU_EVENT, open);
    return () => {
      window.removeEventListener(OPEN_COUNTRY_MENU_EVENT, open);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
    setSearchOpen(false);
    setCountryOpen(false);
    setCountrySearch("");
    setEditingScope(null);
  }, [location]);

  useEffect(() => {
    if (!openCartFromUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("openCart");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [openCartFromUrl]);

  const closeCountryPicker = () => {
    setCountryOpen(false);
    setCountrySearch("");
  };

  const selectShopCountry = async (countryCode: string) => {
    if (countryBusy) return;
    setCountryBusy(true);
    try {
      await shopifyService.changeDeliveryCountry(countryCode);
      closeCountryPicker();
    } catch (error) {
      const { toast } = await import("sonner");
      toast.error(error instanceof Error ? error.message : "Could not change delivery country.");
    } finally { setCountryBusy(false); }
  };

  const selectGiftCardCountry = (countryCode?: string) => {
    setGiftCardMarketCountry(countryCode);
    closeCountryPicker();
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenDropdown(null);
    setSearchOpen(false);
  };
  const searchLabel = "Search gift cards, top-ups and products";

  useEffect(() => {
    if (routePath !== "/search") return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q !== null) setSearchQuery(q);
  }, [routePath, location]);

  const dropdown = (name: string, links: typeof marketplace) => (
    <div className={`px-dd${openDropdown === name ? " open" : ""}`} key={name}>
      <button
        className="px-dd-t"
        type="button"
        aria-expanded={openDropdown === name}
        onClick={() => setOpenDropdown(current => current === name ? null : name)}
      >
        {name}<i aria-hidden="true" />
      </button>
      <div className="px-dd-l">
        {links.map(link => (
          <Link key={link.title} href={link.href} onClick={closeMenu}>
            <b>{link.title}</b><small>{link.detail}</small>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <header
      className={`px-nav px-nav-with-tools${isHomePage ? " home-hero-header" : ""}${scrolled ? " scrolled" : ""}`}
      id="pxnav"
    >
      <div className="px-nav-in">
        <button
          className="px-burger"
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setSearchOpen(false);
            setMenuOpen(open => !open);
          }}
        >
          <span /><span /><span />
        </button>
        <Link className="px-logo" href="/" onClick={closeMenu} data-testid="link-home-header">
          <PexlyLogo
            width="clamp(94px, 15vw, 148px)"
            className="max-w-full shrink-0"
          />
        </Link>
        <nav className={`px-menu${menuOpen ? " open" : ""}`} id="pxmenu" aria-label="Main">
          {dropdown("Marketplace", marketplace)}
          <Link className="px-l" href="/#how-it-works" onClick={closeMenu}>How it works</Link>
          <Link className="px-l" href="/gift-cards" onClick={closeMenu}>Categories</Link>
          {dropdown("Resources", resources)}
          <button
            className="px-menu-search"
            type="button"
            aria-expanded={searchOpen}
            aria-controls="px-mobile-search-panel"
            onClick={() => setSearchOpen(open => !open)}
          >
            <Search aria-hidden="true" />
            <span>{searchLabel}</span>
          </button>
          {searchOpen && (
            <Suspense fallback={null}>
            <HeaderSearch
              variant="mobile"
              label={searchLabel}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onNavigate={closeMenu}
            />
            </Suspense>
          )}
          <div className="px-mob-btns">
            <Link className="px-btn ghost" href={walletHref} onClick={closeMenu}>
              {user ? "My Wallet" : "Connect Wallet"}
            </Link>
            <Link className="px-btn solid" href="/gift-cards" onClick={closeMenu}>Start Shopping</Link>
          </div>
        </nav>
        {(() => {
          const handleCountryOpenChange = (open: boolean) => {
            setCountryOpen(open);
            if (open) {
              setEditingScope(activeCountryScope);
              setMenuOpen(false);
              setSearchOpen(false);
            } else {
              setCountrySearch("");
            }
          };

          const countryTriggerButton = (
            <button
              className="px-country-trigger"
              type="button"
              aria-label="Choose country and language"
              title="Country and language"
            >
              <span className="px-country-flag" aria-hidden="true">{activeCountryFlag}</span>
            </button>
          );

          const countryPickerBody = (
            <>
              <div className="px-country-store-tabs" role="group" aria-label="Country settings">
                <button
                  type="button"
                  aria-pressed={pickerScope === "shop"}
                  className={pickerScope === "shop" ? "active" : ""}
                  onClick={() => {
                    setEditingScope("shop");
                    setCountrySearch("");
                  }}
                >
                  Shop delivery country: {shopCountry || "Not set"}
                </button>
                <button
                  type="button"
                  aria-pressed={pickerScope === "gift-card"}
                  className={pickerScope === "gift-card" ? "active" : ""}
                  onClick={() => {
                    setEditingScope("gift-card");
                    setCountrySearch("");
                  }}
                >
                  Gift cards &amp; top-ups: {isAllGiftCardCountries ? "All countries" : giftCardCountry || "Not set"}
                </button>
              </div>
              {preferences.detection === "failed" && <p className="px-country-empty" role="status">Couldn’t detect your country. Choose each setting below.</p>}
              {preferences.detection === "loading" && <p className="px-country-empty" role="status">Detecting your approximate country… You can choose manually now.</p>}
              {preferences.storageBlocked && <p className="px-country-empty" role="status">Browser storage is blocked. Your choices apply for this visit only.</p>}
              {preferences.legacyConflict && <p className="px-country-empty" role="status">Your older country choices differed. The saved header choice was kept; please confirm it.</p>}
              {pickerScope === "shop" && shopCountry && marketsQuery.data && !marketsQuery.data.some(c => c.code === shopCountry) && <p className="px-country-empty" role="alert">Shop delivery to {getMarketConfig(shopCountry)?.region || shopCountry} is not available. Choose a configured delivery country.</p>}
              <div className="px-country-list-section">
                <label className="sr-only" htmlFor="px-country-search">Search countries</label>
                <input
                  id="px-country-search"
                  className="px-country-search"
                  type="search"
                  placeholder="Search countries"
                  value={countrySearch}
                  onChange={event => setCountrySearch(event.target.value)}
                />
                <div className="px-country-options" role="group" aria-label="Available countries">
                  {pickerScope === "shop" ? (
                    marketsQuery.isLoading ? <p className="px-country-empty" role="status">Checking delivery markets…</p> :
                    marketsQuery.isError ? <div className="px-country-empty" role="alert">Delivery markets could not be verified. Your saved choice has not changed. <button type="button" onClick={() => void marketsQuery.refetch()}>Try again</button></div> :
                    filteredShopCountries.length > 0 ? filteredShopCountries.map(country => (
                      <button
                        key={country.code}
                        className="px-country-option"
                        type="button"
                        disabled={countryBusy}
                        aria-pressed={shopCountry === country.code}
                        onClick={() => selectShopCountry(country.code)}
                      >
                        <span className="px-country-option-flag" aria-hidden="true">{flagForCountry(country.code)}</span>
                        <span className="px-country-option-name">{country.region}</span>
                        <span className="px-country-option-code">{country.code}</span>
                        <span className="px-country-option-code">{country.currency}</span>
                        {shopCountry === country.code && <Check aria-hidden="true" />}
                      </button>
                    )) : <p className="px-country-empty">No configured delivery markets match. This country is not available for shop delivery.</p>
                  ) : (
                    <>
                      {giftCardCountry && giftCountriesQuery.data && !giftCountriesQuery.data.some(c => c.isoName === giftCardCountry) && <p className="px-country-empty" role="status">Gift cards may be unavailable in {giftCardCountry}. Choose another country or check top-up availability.</p>}
                      {giftCountriesQuery.isLoading && (
                        <p className="px-country-empty" role="status">Loading countries…</p>
                      )}
                      {giftCountriesQuery.isError && (
                        <div className="px-country-empty" role="alert">
                          <span>Couldn’t verify gift-card availability. You can still choose a country; cards and operators will be checked when loaded.</span>
                          <button type="button" onClick={() => void giftCountriesQuery.refetch()}>
                            Try again
                          </button>
                        </div>
                      )}
                      {!giftCountriesQuery.isLoading && (
                        (showAllGiftCountriesOption || filteredGiftCountries.length > 0) ? (
                          <>
                            {showAllGiftCountriesOption && (
                              <button
                                key="ALL"
                                className="px-country-option"
                                type="button"
                                aria-pressed={isAllGiftCardCountries}
                                onClick={() => selectGiftCardCountry(undefined)}
                                data-testid="button-gift-card-all-countries"
                              >
                                <span className="px-country-option-flag" aria-hidden="true">🌍</span>
                                <span className="px-country-option-name">All countries</span>
                                <span className="px-country-option-code">ALL</span>
                                {isAllGiftCardCountries && <Check aria-hidden="true" />}
                              </button>
                            )}
                            {filteredGiftCountries.map(country => (
                              <button
                                key={country.isoName}
                                className="px-country-option"
                                type="button"
                                aria-pressed={displayedGiftCardCountry === country.isoName}
                                onClick={() => selectGiftCardCountry(country.isoName)}
                              >
                                <span className="px-country-option-flag" aria-hidden="true">{country.flag}</span>
                                <span className="px-country-option-name">{country.name}</span>
                                <span className="px-country-option-code">{country.isoName}</span>
                                {displayedGiftCardCountry === country.isoName && <Check aria-hidden="true" />}
                              </button>
                            ))}
                          </>
                        ) : <p className="px-country-empty">No countries match that search.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="px-language-control">
                <label htmlFor="px-header-language">Language</label>
                <select
                  id="px-header-language"
                  value={currentLanguage}
                  onChange={event => switchLanguage(event.target.value)}
                >
                  {languages.map(language => (
                    <option key={language.code} value={language.code}>{language.label}</option>
                  ))}
                </select>
              </div>
            </>
          );

          if (isMobile) {
            return (
              <Sheet open={countryOpen} onOpenChange={handleCountryOpenChange}>
                <SheetTrigger asChild>
                  {countryTriggerButton}
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  overlayClassName="z-[10000] bg-black/50 backdrop-blur-[2px]"
                  className="px-country-sheet z-[10000]"
                >
                  <div className="px-country-sheet-handle" aria-hidden="true" />
                  <SheetHeader className="px-country-sheet-header">
                    <SheetTitle className="px-country-sheet-title">Region &amp; language</SheetTitle>
                    <SheetDescription className="px-country-sheet-subtitle">
                      Choose separate service countries
                    </SheetDescription>
                  </SheetHeader>
                  {countryPickerBody}
                </SheetContent>
              </Sheet>
            );
          }

          return (
            <Popover open={countryOpen} onOpenChange={handleCountryOpenChange}>
              <PopoverTrigger asChild>
                {countryTriggerButton}
              </PopoverTrigger>
              <PopoverContent className="px-country-popover" aria-label="Country and language settings" align="end" sideOffset={8}>
                <div className="px-country-heading">
                  <strong>Region &amp; language</strong>
                  <span>
                    Choose separate service countries
                  </span>
                </div>
                {countryPickerBody}
              </PopoverContent>
            </Popover>
          );
        })()}
        <div className="px-tools" aria-label="Shopping tools">
          <button
            className="px-tool-search"
            type="button"
            aria-label={searchLabel}
            aria-expanded={searchOpen}
            aria-controls="px-header-search-panel"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(open => !open);
            }}
          >
            <Search aria-hidden="true" />
            <span>Search</span>
          </button>
          <button
            className="px-tool-cart"
            type="button"
            aria-label={`Open cart, ${cartItemCount} ${cartItemCount === 1 ? "item" : "items"}`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart aria-hidden="true" />
            <span className="px-tool-cart-count" aria-hidden="true">{cartItemCount}</span>
          </button>
          {cartOpen && (
            <Suspense fallback={null}>
              <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
            </Suspense>
          )}
          {wallet.isConnected && (
            <Link
              className="px-profile-link px-profile-link-desktop"
              href={walletHref}
              aria-label={user ? "Your account and wallet" : "Sign in to your account"}
              title={user ? "Your account and wallet" : "Sign in"}
            >
              <User aria-hidden="true" />
            </Link>
          )}
          <Link
            className="px-profile-link px-profile-link-mobile"
            href={walletHref}
            aria-label={user ? "Your account and wallet" : "Sign in to your account"}
            title={user ? "Your account and wallet" : "Sign in"}
          >
            <User aria-hidden="true" />
          </Link>
        </div>
        <div className="px-right">
          {!user && (
            <Link className="px-btn ghost" href={walletHref}>Connect Wallet</Link>
          )}
          <Link className="px-btn solid" href="/gift-cards">Start Shopping</Link>
        </div>
      </div>
      {searchOpen && (
        <div className="px-search-panel" id="px-header-search-panel">
          <Suspense fallback={null}>
            <HeaderSearch
              variant="desktop"
              label={searchLabel}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onNavigate={closeMenu}
            />
          </Suspense>
        </div>
      )}
    </header>
  );
}
