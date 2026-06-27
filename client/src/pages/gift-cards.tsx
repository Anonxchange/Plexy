import { useHead } from "@unhead/react";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, Coffee, Gamepad2, ShoppingBag, Music, Check, ChevronsUpDown, UtensilsCrossed, Zap, Home, Globe, Smartphone, Coins, Gift, Heart, Dumbbell, Lightbulb, Lock, Package, ShoppingCart, Plus } from '@/lib/icons';
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PexlyFooter } from "@/components/pexly-footer";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeImageUrl } from "@/lib/sanitize";

interface GiftCardProps {
  card: any;
  setLocation: (loc: string) => void;
  index: number;
}

// Component for the gift card itself, defined internally
function GiftCardComponent({ card, setLocation, index }: GiftCardProps) {
  return (
    <div
      className="cursor-pointer animate-slide-up"
      onClick={() => setLocation(`/gift-cards/${card.id}`)}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      {/* Free image — no card/border wrapper, just rounded image sitting on the page */}
      <div className="w-full aspect-[3/2] rounded-2xl overflow-hidden mb-1.5">
        <img
          src={card.image}
          alt={card.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Plain text below — no container */}
      <h3 className="font-semibold text-foreground text-xs leading-tight line-clamp-2">{card.name}</h3>
      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{card.priceRange}</p>
      {card.discount && card.discount !== "0%" && (
        <span className="inline-block text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1 py-0.5 rounded mt-0.5">
          {card.discount} off
        </span>
      )}
    </div>
  );
}


function GiftCardSkeleton() {
  return (
    <div>
      <Skeleton className="w-full aspect-[3/2] rounded-2xl mb-1.5" />
      <Skeleton className="h-3 w-3/4 mb-1" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
  );
}




const faqs = [
  {
    question: "What payment options do you accept?",
    answer: "We accept cryptocurrency payments including Bitcoin (BTC), Ethereum (ETH), and USDT. This ensures fast, secure, and private transactions."
  },
  {
    question: "Do I need to create an account to purchase a gift card?",
    answer: "No! You can purchase gift cards without creating an account. Simply select your card, pay with crypto, and receive your gift card code via email."
  },
  {
    question: "How long does it take to receive my purchased gift card?",
    answer: "Most gift cards are delivered instantly via email after your cryptocurrency payment is confirmed. Delivery typically takes 5-15 minutes depending on network congestion."
  },
  {
    question: "What happens if I don't receive my gift card email?",
    answer: "First, check your spam or junk folder — our emails occasionally get filtered. If it's not there, wait a few more minutes as delivery can sometimes be delayed. If you still haven't received it, contact our support team with your order details and we'll resolve it promptly."
  }
];

import { useGiftCardProducts, useGiftCardCategories, useGiftCardCountries } from "@/hooks/use-reloadly";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { GiftCardCartSheet } from "@/components/gift-card-cart-sheet";

const CATEGORY_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  "gaming": Gamepad2,
  "entertainment": Music,
  "food": Coffee,
  "food & groceries": Coffee,
  "groceries": Coffee,
  "travel": Globe,
  "transportation": Smartphone,
  "shopping": ShoppingBag,
  "fashion": ShoppingBag,
  "department stores": ShoppingBag,
  "multi-brand": ShoppingBag,
  "electronics": Lightbulb,
  "home": Home,
  "home & diy": Home,
  "health": Heart,
  "health & beauty": Heart,
  "beauty": Heart,
  "sports": Dumbbell,
  "sports & outdoors": Dumbbell,
  "gifts": Gift,
  "kids": Gift,
  "crypto": Coins,
  "voip": Smartphone,
  "prepaid phones": Smartphone,
  "phone codes": Smartphone,
  "esims": Smartphone,
  "privacy & tools": Lock,
  "other bundles": Package,
};

function getCategoryIcon(name: string): ComponentType<{ className?: string }> {
  return CATEGORY_ICON_MAP[name.toLowerCase()] ?? Package;
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border transition-colors duration-300 overflow-hidden ${
        open
          ? "border-primary/30 bg-primary/5"
          : "border-border/60 bg-card hover:border-border"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3.5 px-5 py-4 text-left"
      >
        <span
          className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-300 ${
            open ? "bg-primary text-black" : "bg-secondary text-muted-foreground"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-sm font-semibold leading-snug">{question}</span>
        <span
          className={`flex-shrink-0 h-6 w-6 rounded-full border flex items-center justify-center transition-all duration-300 ${
            open ? "border-primary/40 bg-primary/10 rotate-45" : "border-border rotate-0"
          }`}
        >
          <Plus className="h-3 w-3" />
        </span>
      </button>
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "400px" : "0px", overflow: "hidden" }}
      >
        <p className="text-sm text-muted-foreground leading-relaxed px-5 pb-5 ml-[42px]">
          {answer}
        </p>
      </div>
    </div>
  );
}


export function GiftCards() {
  useHead({ title: "Gift Cards | Pexly", meta: [{ name: "description", content: "Buy digital gift cards from hundreds of brands worldwide and pay with cryptocurrency." }] });
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const { items: cartItems } = useGiftCardCart();
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const { data: reloadlyCategories } = useGiftCardCategories();
  const { data: reloadlyCountries } = useGiftCardCountries();
  const [openCountry, setOpenCountry] = useState(false);
  const [selectedSidebarCategory, setSelectedSidebarCategory] = useState("All Categories");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [amount, setAmount] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // Country filter applies immediately on selection; amount/search apply on Search press
  const [activeCountryCode, setActiveCountryCode] = useState<string | undefined>(undefined);
  const [activeAmount, setActiveAmount] = useState<number | undefined>(undefined);

  const { data, isLoading, error } = useGiftCardProducts({
    productName: searchQuery,
    page: page,
    size: pageSize,
    categoryId: selectedCategoryId,
    countryCode: activeCountryCode,
  });

  const handleSearch = () => {
    setSearchQuery(inputValue);
    setActiveAmount(amount && !isNaN(Number(amount)) && Number(amount) > 0 ? Number(amount) : undefined);
    setPage(1);
  };

  const handleSelectCountry = (isoName: string) => {
    setActiveCountryCode(isoName || undefined);
    setPage(1);
    setOpenCountry(false);
  };

  const clearCountryFilter = () => {
    setActiveCountryCode(undefined);
    setPage(1);
  };

  const clearAmountFilter = () => {
    setAmount("");
    setActiveAmount(undefined);
  };

  const activeCountryObj = (reloadlyCountries ?? []).find((c) => c.isoName === activeCountryCode);

  const allGiftCards = data?.content?.map((card: any) => {
    const currencyCode: string = card.recipientCurrencyCode || "USD";
    const fixedDenominations: number[] = card.fixedRecipientDenominations || [];
    const minVal = card.denominationType === "FIXED"
      ? (fixedDenominations.length > 0 ? Math.min(...fixedDenominations) : 0)
      : (card.minRecipientDenomination || 0);
    const maxVal = card.denominationType === "FIXED"
      ? (fixedDenominations.length > 0 ? Math.max(...fixedDenominations) : 0)
      : (card.maxRecipientDenomination || 0);
    return {
      id: card.productId,
      name: card.productName,
      brand: card.brand?.brandName || "",
      priceRange: `${currencyCode} ${minVal} – ${maxVal}`,
      cryptoRange: card.country?.name || "",
      discount: `${card.discountPercentage || 0}%`,
      image: sanitizeImageUrl(card.logoUrls?.[0]) || "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop",
      gradient: "from-gray-100 to-white",
      description: card.redeemInstruction?.concise || "",
      minValue: minVal,
      maxValue: maxVal,
      fixedDenominations,
      denominationType: card.denominationType,
    };
  }) || [];

  // Client-side amount filter: keep cards that support the requested denomination
  const giftCards = activeAmount
    ? allGiftCards.filter((card) => {
        if (card.denominationType === "FIXED") {
          return card.fixedDenominations.some((d) => Math.abs(d - activeAmount) < 0.01);
        }
        return activeAmount >= card.minValue && activeAmount <= card.maxValue;
      })
    : allGiftCards;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="hidden lg:block lg:col-span-1 bg-card rounded-3xl p-6 border border-border/50 h-fit lg:sticky lg:top-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Categories</h3>
          <div className="space-y-1">
            {[{ name: "All Categories", id: undefined, icon: LayoutGrid }, ...(reloadlyCategories || []).map(c => ({ name: c.name, id: c.id, icon: getCategoryIcon(c.name) }))].map((category, index) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedSidebarCategory(category.name);
                    setSelectedCategoryId(category.id);
                    setPage(1);
                  }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSidebarCategory === category.name
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{category.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="lg:col-span-3">
          {/* ── HERO ── */}
          <section className="relative rounded-3xl mb-6 overflow-hidden bg-[#0b1120] min-h-[300px] lg:min-h-[340px]">

            {/* Mobile: diagonal slash across bottom half */}
            <div
              className="absolute inset-0 lg:hidden"
              style={{
                background: "#120d35",
                clipPath: "polygon(0% 58%, 100% 38%, 100% 100%, 0% 100%)",
              }}
            />

            {/* Desktop: diagonal slash — right half gets deep purple */}
            <div
              className="absolute inset-0 hidden lg:block"
              style={{
                background: "#120d35",
                clipPath: "polygon(38% 0%, 100% 0%, 100% 100%, 48% 100%)",
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-stretch h-full">

              {/* LEFT — headline + trust + cart */}
              <div className="flex-1 px-7 pt-8 pb-6 lg:px-10 lg:pt-10 flex flex-col justify-between">
                <div>
                  <h1 className="text-3xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-3">
                    Buy Gift Cards<br className="hidden lg:block" /> with Crypto
                  </h1>
                  <p className="text-sm lg:text-base text-zinc-400 mb-5 lg:mb-7 max-w-sm">
                    500+ brands across gaming, streaming, food & travel.
                    Instant delivery. Up to 20% off.
                  </p>

                  {/* Trust badges — desktop only */}
                  <div className="hidden lg:flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <span className="text-sm">⚡</span>
                      <span className="text-xs text-zinc-300 font-medium">Instant delivery</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <img src="/logos/bitcoin-btc-logo.svg" className="w-4 h-4 object-contain" alt="BTC" />
                      <img src="/logos/ethereum-eth-logo.svg" className="w-4 h-4 object-contain" alt="ETH" />
                      <span className="text-xs text-zinc-300 font-medium">Pay with BTC / ETH</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <span className="text-sm">🏷️</span>
                      <span className="text-xs text-zinc-300 font-medium">Up to 20% off</span>
                    </div>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between mt-6 lg:mt-0">
                  <p className="text-xs text-zinc-600 font-medium uppercase tracking-widest">Click a card to filter</p>
                  <button
                    onClick={() => setCartOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount > 0
                      ? <span className="font-bold text-white">{cartCount} in cart</span>
                      : <span>Cart</span>
                    }
                  </button>
                </div>
              </div>

              {/* RIGHT — 2×2 brand tiles */}
              <div className="lg:w-[360px] flex-shrink-0 grid grid-cols-2 gap-2.5 p-5 lg:p-6 content-center">
                {([
                  { name: "Netflix",  logo: "/logos/brands/netflix.svg",     bg: "#E50914" },
                  { name: "Amazon",   logo: "/logos/brands/amazon.svg",       bg: "#FF9900" },
                  { name: "Spotify",  logo: "/logos/brands/spotify.svg",      bg: "#1DB954" },
                  { name: "Steam",    logo: "/logos/brands/steampowered.svg", bg: "#1b2838" },
                ] as const).map((card) => (
                  <button
                    key={card.name}
                    onClick={() => { setInputValue(card.name); setSearchQuery(card.name); setPage(1); }}
                    className="rounded-2xl flex flex-col justify-between p-4 aspect-[3/2] hover:scale-[1.03] hover:brightness-110 transition-all duration-200"
                    style={{ background: card.bg, boxShadow: `0 8px 24px ${card.bg}44` }}
                  >
                    <img src={card.logo} alt={card.name} className="w-8 h-8 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
                    <span className="text-white font-bold text-sm">{card.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar — full width, pinned to bottom */}
            <div className="px-6 pb-6 lg:px-10 lg:pb-8">

              {/* Search name */}
              <div className="relative mb-2.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                <Input
                  placeholder="Search brands… (Amazon, Apple, Netflix)"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="pl-9 h-12 border border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-indigo-400/60"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
                />
              </div>

              {/* Amount + Currency + Search button */}
              <div className="flex gap-2">
                <Input
                  placeholder="Amount"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="w-24 flex-shrink-0 h-11 border border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-indigo-400/60"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
                />
                <Popover open={openCountry} onOpenChange={setOpenCountry}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      role="combobox"
                      className="flex-1 min-w-0 justify-between h-11 font-normal border border-white/10 text-white hover:bg-white/10 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
                    >
                      <span className="truncate">
                        {activeCountryObj ? `${activeCountryObj.flag} ${activeCountryObj.name}` : "All Countries"}
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 ml-1 flex-shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="all" onSelect={() => handleSelectCountry("")}>
                            <Check className={cn("mr-2 h-4 w-4", !activeCountryCode ? "opacity-100" : "opacity-0")} />
                            <span className="mr-2">🌍</span>
                            <span>All Countries</span>
                          </CommandItem>
                          {(reloadlyCountries ?? []).map((c) => (
                            <CommandItem key={c.isoName} value={`${c.name} ${c.isoName}`} onSelect={() => handleSelectCountry(c.isoName)}>
                              <Check className={cn("mr-2 h-4 w-4", activeCountryCode === c.isoName ? "opacity-100" : "opacity-0")} />
                              <span className="mr-2">{c.flag}</span>
                              <span>{c.name}</span>
                              <span className="ml-auto text-zinc-500 text-xs">{c.isoName}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  className="h-11 px-4 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex-shrink-0"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>

              {/* Active filter chips */}
              {(activeCountryCode || activeAmount) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs text-zinc-500 self-center">Filters:</span>
                  {activeCountryCode && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-medium">
                      {activeCountryObj ? `${activeCountryObj.flag} ${activeCountryObj.name}` : activeCountryCode}
                      <button onClick={clearCountryFilter} className="ml-0.5 hover:opacity-70">×</button>
                    </span>
                  )}
                  {activeAmount && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 text-xs font-medium">
                      {activeAmount}
                      <button onClick={clearAmountFilter} className="ml-0.5 hover:opacity-70">×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[{ name: "All Categories", id: undefined, icon: LayoutGrid }, ...(reloadlyCategories || []).map(c => ({ name: c.name, id: c.id, icon: getCategoryIcon(c.name) }))].map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedSidebarCategory(category.name);
                      setSelectedCategoryId(category.id);
                      setPage(1);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap ${
                      selectedSidebarCategory === category.name
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs font-medium">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">{selectedSidebarCategory}</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-8">
              {isLoading ? (
                [...Array(9)].map((_, i) => (
                  <GiftCardSkeleton key={i} />
                ))
              ) : (
                giftCards && giftCards.length > 0 ? giftCards.map((card, index) => (
                  <GiftCardComponent key={card.id} card={card} setLocation={setLocation} index={index} />
                )) : (
                  <div className="text-center py-12 w-full col-span-full">
                    <p className="text-muted-foreground font-medium">
                      {activeAmount
                        ? `No gift cards found for amount ${activeAmount}${activeCountryObj ? ` in ${activeCountryObj.flag} ${activeCountryObj.name}` : ""}`
                        : searchQuery
                        ? `No results for "${searchQuery}"`
                        : "No gift cards available"}
                    </p>
                    {(activeAmount || searchQuery) && (
                      <button
                        onClick={() => {
                          setInputValue("");
                          setSearchQuery("");
                          setAmount("");
                          setActiveAmount(undefined);
                          setPage(1);
                        }}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mb-8">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => {
                    setPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>


          <div className="mt-10 space-y-3">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                FAQ
              </span>
              <h3 className="font-bold text-base">Frequently asked questions</h3>
            </div>
            {faqs.map((faq, i) => (
              <FaqItem key={i} index={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>

      <GiftCardCartSheet open={cartOpen} onOpenChange={setCartOpen} />

      <PexlyFooter />
    </div>
  );
}
