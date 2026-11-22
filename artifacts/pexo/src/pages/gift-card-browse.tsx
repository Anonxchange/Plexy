import { useHead } from "@unhead/react";
import { buildCanonicalUrl } from "@/lib/site-document";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Search, Gift, ChevronDown } from "@/lib/icons";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGiftCardProducts, useGiftCardCategories, useGiftCardCountries } from "@/hooks/use-reloadly";
import { mapProducts, ProductCardGrid } from "@/components/gift-card-browse-cards";
import { useCountryPreferences } from "@/lib/country-preferences";

// ── Sidebar (shared with main page, but locally defined here to avoid circular imports) ──
const STATIC_SIDEBAR = [
  "All Gift Cards", "Payment Cards", "Travel", "Food & Groceries",
  "Gaming", "Transportation", "Electronics", "Fashion",
  "Entertainment", "Home & DIY", "Health & Beauty", "Sports & Outdoors", "Multi-Brand",
];

function Sidebar({ activeCategory, onSelect }: {
  activeCategory: string;
  onSelect: (name: string, id?: number) => void;
}) {
  const { data: apiCategories } = useGiftCardCategories();
  const categories = apiCategories && apiCategories.length > 0
    ? [{ name: "All Gift Cards", id: undefined as number | undefined }, ...apiCategories.map(c => ({ name: c.name, id: c.id as number | undefined }))]
    : STATIC_SIDEBAR.map(name => ({ name, id: undefined as number | undefined }));

  return (
    <nav className="w-56 flex-shrink-0 pr-4">
      <ul className="space-y-0.5">
        {categories.map(cat => (
          <li key={cat.name}>
            <button
              onClick={() => onSelect(cat.name, cat.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium",
                activeCategory === cat.name
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function GridCardSkeleton() {
  return (
    <div>
      <Skeleton className="w-full aspect-square rounded-xl mb-2" />
      <Skeleton className="h-4 w-3/4 mb-1" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

const SORT_OPTIONS = ["Popular", "Price: Low to High", "Price: High to Low", "Highest Discount"];

export function GiftCardBrowse() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const initialCategoryName = params.get("category") || "All Gift Cards";
  const initialCategoryId   = params.get("categoryId") ? Number(params.get("categoryId")) : undefined;
  const initialSearch       = params.get("q") || "";

  const [categoryName, setCategoryName]   = useState(initialCategoryName);
  const [categoryId,   setCategoryId]     = useState<number | undefined>(initialCategoryId);
  const [searchInput,  setSearchInput]    = useState(initialSearch);
  const [searchQuery,  setSearchQuery]    = useState(initialSearch);
  const [sortOpen,     setSortOpen]       = useState(false);
  const [sortBy,       setSortBy]         = useState("Popular");
  const [page,         setPage]           = useState(1);
  const { digital } = useCountryPreferences();
  const countryCode = digital?.country;
  const allCountries = digital?.source === "manual" && !countryCode;
  const hasSelection = Boolean(countryCode || allCountries);
  const [accumulated,  setAccumulated]    = useState<import("@/hooks/use-reloadly").ReloadlyProduct[]>([]);

  const canonical = buildCanonicalUrl("/gift-cards/browse");
  const title = `${categoryName} — Crypto Gift Cards | Pexly`;
  const description = `Browse ${categoryName.toLowerCase()} digital gift cards on Pexly. Pay directly from your crypto wallet with instant delivery after payment.`;
  useHead({
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    link: [{ rel: "canonical", key: "canonical", href: canonical }],
  });

  const { data: reloadlyCountries } = useGiftCardCountries();
  const activeCountryObj = (reloadlyCountries ?? []).find(c => c.isoName === countryCode);

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [countryCode]);

  const { data, isLoading, isFetching, isError, refetch } = useGiftCardProducts({
    page,
    size: 60,
    categoryId,
    productName: searchQuery || undefined,
    countryCode,
    enabled: hasSelection,
  });

  useEffect(() => {
    if (!data) return;
    setAccumulated(data.content || []);
  }, [data]);

  const apiCards = mapProducts(accumulated);
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const showingCount = Math.min(page * 60, totalElements || accumulated.length);
  const progressPct = totalElements > 0 ? Math.min(100, (showingCount / totalElements) * 100) : 100;

  const sortedCards = [...apiCards].sort((a, b) => {
    if (sortBy === "Price: Low to High") {
      return parseFloat(a.priceRange.split(" ")[1] || "0") - parseFloat(b.priceRange.split(" ")[1] || "0");
    }
    if (sortBy === "Price: High to Low") {
      const aMax = parseFloat(a.priceRange.split("–")[1]?.trim().split(" ").pop() || "0");
      const bMax = parseFloat(b.priceRange.split("–")[1]?.trim().split(" ").pop() || "0");
      return bMax - aMax;
    }
    if (sortBy === "Highest Discount") return (b.discount || 0) - (a.discount || 0);
    return 0;
  });

  const handleSidebarSelect = (name: string, id?: number) => {
    setCategoryName(name);
    setCategoryId(id);
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
    setAccumulated([]);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
    setAccumulated([]);
  };

  const handleLoadMore = () => {
    setPage(p => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {isError && <p className="p-4 text-sm" role="alert">Gift cards couldn’t be loaded. <button type="button" className="underline" onClick={() => void refetch()}>Try again</button></p>}

      {/* ════════════════════════════════════════════════════════
          DESKTOP layout (lg+)
          ════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6">

        {/* Desktop header */}
        <div className="py-6 flex items-center gap-4 border-b border-border mb-6">
          <button
            onClick={() => setLocation("/gift-cards")}
            className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search for products or brands…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                className="pl-9 h-10 rounded-xl text-sm"
              />
            </div>
            <button onClick={handleSearch} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0">
              Search
            </button>
          </div>

          {/* Sort By */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-border bg-secondary text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {sortBy === "Popular" ? "Sort By" : sortBy}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", sortOpen && "rotate-180")} />
            </button>
            {sortOpen && (
              <div className="absolute top-11 right-0 z-50 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setSortBy(opt); setSortOpen(false); }}
                    className={cn("w-full text-left px-4 py-2.5 text-sm transition-colors",
                      sortBy === opt ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary"
                    )}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar + grid */}
        <div className="flex gap-8 pb-16">
          <Sidebar activeCategory={categoryName} onSelect={handleSidebarSelect} />

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-foreground mb-5">{categoryName}</h2>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <GridCardSkeleton key={i} />)}
              </div>
            ) : sortedCards.length === 0 ? (
              <div className="text-center py-24">
                <Gift className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-bold text-lg mb-1">No gift cards found</p>
                <p className="text-muted-foreground text-sm">Try a different search or category</p>
                {searchQuery && (
                  <button onClick={() => { setSearchInput(""); setSearchQuery(""); setPage(1); setAccumulated([]); }} className="mt-4 text-sm text-primary underline">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedCards.map(card => (
                  <ProductCardGrid
                    key={card.id}
                    card={card}
                    onClick={() => {
                      if (String(card.id).startsWith("demo-")) return;
                      setLocation(`/gift-cards/${card.id}`);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Load more */}
            {!isLoading && sortedCards.length > 0 && totalElements > 0 && (
              <div className="flex flex-col items-center gap-4 mt-10">
                <p className="text-sm text-muted-foreground">
                  Showing {showingCount} out of {totalElements}
                </p>
                <div className="w-full max-w-xs h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                {page < totalPages && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="px-6 py-2.5 rounded-full bg-secondary text-foreground text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {isFetching ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          MOBILE layout (< lg)
          ════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">

        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/gift-cards")}
            className="flex-shrink-0 h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1 truncate">{categoryName}</h1>
        </div>

        {/* Search bar */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={`Search in ${categoryName}…`}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
              className="pl-9 h-10 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Sort / filter bar */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div className="relative">
            <button
              onClick={() => setSortOpen(v => !v)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full border border-border bg-secondary text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Sort By
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", sortOpen && "rotate-180")} />
            </button>
            {sortOpen && (
              <div className="absolute top-10 left-0 z-50 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setSortBy(opt); setSortOpen(false); }}
                    className={cn("w-full text-left px-4 py-2.5 text-sm transition-colors",
                      sortBy === opt ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary"
                    )}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {(sortBy !== "Popular" || countryCode) && (
          <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
            {sortBy !== "Popular" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {sortBy}
                <button onClick={() => setSortBy("Popular")} className="hover:opacity-70 ml-0.5">×</button>
              </span>
            )}
            {countryCode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                {activeCountryObj ? `${activeCountryObj.flag} ${activeCountryObj.name}` : countryCode}
              </span>
            )}
          </div>
        )}

        {/* Mobile 2-column grid */}
        <div className="px-4 pb-6">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(8)].map((_, i) => <GridCardSkeleton key={i} />)}
            </div>
          ) : sortedCards.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-semibold mb-1">No gift cards found</p>
              <p className="text-muted-foreground text-sm">Try a different search term</p>
              {searchQuery && (
                <button onClick={() => { setSearchInput(""); setSearchQuery(""); setPage(1); setAccumulated([]); }} className="mt-3 text-sm text-primary underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {sortedCards.map(card => (
                <ProductCardGrid
                  key={card.id}
                  card={card}
                  onClick={() => {
                    if (String(card.id).startsWith("demo-")) return;
                    setLocation(`/gift-cards/${card.id}`);
                  }}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {!isLoading && sortedCards.length > 0 && totalElements > 0 && (
            <div className="flex flex-col items-center gap-3 mt-8">
              <p className="text-sm text-muted-foreground">
                Showing {showingCount} out of {totalElements}
              </p>
              <div className="w-full max-w-[220px] h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              {page < totalPages && (
                <button
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  className="px-6 py-2.5 rounded-full bg-secondary text-foreground text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isFetching ? "Loading…" : "Load more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
