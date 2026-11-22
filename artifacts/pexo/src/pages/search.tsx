import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useHead } from "@unhead/react";
import { buildCanonicalUrl } from "@/lib/site-document";
import { Search, Smartphone, SlidersHorizontal, ArrowUpDown, ChevronDown, Check, X } from "@/lib/icons";
import { useUniversalSearch, type SearchKind, type SearchResult } from "@/hooks/use-universal-search";
import { ResponsivePickerModal } from "@/components/responsive-picker-modal";
import "./search.css";

type Filter = "all" | SearchKind;
type SortKey = "best" | "low" | "high" | "az";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "gift-card", label: "Gift cards" },
  { value: "topup", label: "Mobile top-ups" },
  { value: "product", label: "Physical products" },
];

const SORT_LABELS: Record<SortKey, string> = {
  best: "Sort",
  low: "Price: low to high",
  high: "Price: high to low",
  az: "Name A–Z",
};

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "best", label: "Best match" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
  { value: "az", label: "Name A–Z" },
];

const QUICK_SEARCHES = ["Netflix", "Steam", "Amazon", "MTN", "Watch", "Headphones"];
const INITIAL_GROUP_LIMIT = 20;

function sortResults(items: SearchResult[], sort: SortKey): SearchResult[] {
  const copy = [...items];
  if (sort === "best") {
    return copy.sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0) || a.title.localeCompare(b.title));
  }
  if (sort === "az") return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "low") return copy.sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
  return copy.sort((a, b) => (b.priceValue ?? -1) - (a.priceValue ?? -1));
}

function seeAllHref(kind: SearchKind, query: string): string {
  const q = query.trim();
  if (kind === "gift-card") return q ? `/gift-cards/all?q=${encodeURIComponent(q)}` : "/gift-cards/all";
  if (kind === "topup") return "/mobile-topup";
  return q ? `/shop?q=${encodeURIComponent(q)}` : "/shop";
}

function columnsForWidth(): number {
  if (typeof window === "undefined") return 2;
  const w = window.innerWidth;
  return w >= 1100 ? 4 : w >= 700 ? 3 : 2;
}

function useColumnCount() {
  const [n, setN] = useState(columnsForWidth);
  useEffect(() => {
    const on = () => setN(columnsForWidth());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return n;
}

function photoRatio(item: SearchResult): number {
  const w = Number(item.imageWidth);
  const h = Number(item.imageHeight);
  if (w > 0 && h > 0) return Math.min(1.25, Math.max(1, h / w));
  const steps = [1, 1.2, 1.1, 1.25, 1.15];
  let hash = 0;
  const key = String(item.id || "");
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return steps[hash % steps.length];
}

function ProductResultsMasonry({ items }: { items: SearchResult[] }) {
  const colCount = useColumnCount();
  const cols = Array.from({ length: colCount }, () => ({
    h: 0,
    items: [] as { item: SearchResult; r: number }[],
  }));
  for (const item of items) {
    const r = photoRatio(item);
    let target = cols[0];
    for (const c of cols) if (c.h < target.h) target = c;
    target.items.push({ item, r });
    target.h += r + 0.45;
  }

  return (
    <div className="sp-masonry">
      {cols.map((col, ci) => (
        <div key={ci} className="sp-mcol">
          {col.items.map(({ item, r }) => (
            <article key={item.id} className="sp-card" data-testid={`card-result-${item.kind}-${item.id}`}>
              <Link href={item.href} className="sp-card-link">
                <div className="sp-img sp-real" style={{ aspectRatio: "1 / " + r }}>
                  {item.image ? (
                    <img className="sp-real-img" src={item.image} alt={item.title} loading="lazy" />
                  ) : null}
                </div>
                <h3>{item.title}</h3>
                {item.price ? (
                  <p className="sp-price">
                    <b>{item.price}</b>
                  </p>
                ) : null}
              </Link>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

function GiftCardResultTile({ item }: { item: SearchResult }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link href={item.href} className="gsa-tile" data-testid={`card-result-${item.kind}-${item.id}`}>
      <div className="gsa-art">
        <span className="gsa-fb">{item.title}</span>
        {item.image && !failed ? (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
      <div className="gsa-tn">{item.title}</div>
      {item.price ? <div className="gsa-ts">{item.price}</div> : null}
    </Link>
  );
}

function TopupResultTile({ item }: { item: SearchResult }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link href={item.href} className="gsa-tile gsa-tile-topup" data-testid={`card-result-${item.kind}-${item.id}`}>
      <div className="gsa-art">
        {item.image && !failed ? (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <Smartphone className="w-10 h-10 text-[#464646]" aria-hidden="true" />
        )}
      </div>
      <div className="gsa-tn">{item.title}</div>
      {item.price ? <div className="gsa-ts">{item.price}</div> : null}
    </Link>
  );
}

export function SearchPage() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(searchString);
  const q = params.get("q") ?? "";
  const typeParam = params.get("type") as Filter | null;
  const filter: Filter = FILTERS.some(f => f.value === typeParam) ? (typeParam as Filter) : "all";
  const [draft, setDraft] = useState(q);
  const [sort, setSort] = useState<SortKey>("best");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<Filter>(filter);
  const [minDraft, setMinDraft] = useState("");
  const [maxDraft, setMaxDraft] = useState("");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDraft(q);
    setExpanded({});
  }, [q]);

  const search = useUniversalSearch(q, true);
  const trimmed = q.trim();

  useHead({
    title: trimmed ? `Search results for "${trimmed}" | Pexly` : "Search the marketplace | Pexly",
    meta: [
      { name: "description", content: trimmed
        ? `Gift cards, mobile top-ups and shipped products matching "${trimmed}" on Pexly. Pay directly from your crypto wallet.`
        : "Search Pexly gift cards, mobile top-ups, and shipped products in one place and pay directly from your crypto wallet." },
      { name: "robots", content: "noindex, follow" },
    ],
    link: [{ rel: "canonical", key: "canonical", href: buildCanonicalUrl("/search") }],
  });

  const setUrl = (nextQ: string, nextFilter: Filter) => {
    const p = new URLSearchParams();
    if (nextQ.trim()) p.set("q", nextQ.trim());
    if (nextFilter !== "all") p.set("type", nextFilter);
    const s = p.toString();
    setLocation(s ? `/search?${s}` : "/search");
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setUrl(draft, filter); };

  const parsePrice = (value: string): number | null => {
    const n = Number(value.replace(/,/g, "").trim());
    return value.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
  };
  const openFilterModal = () => {
    setDraftFilter(filter);
    setMinDraft(minPrice !== null ? String(minPrice) : "");
    setMaxDraft(maxPrice !== null ? String(maxPrice) : "");
    setFilterOpen(true);
  };
  const applyFilters = () => {
    let nextMin = parsePrice(minDraft);
    let nextMax = parsePrice(maxDraft);
    if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
      [nextMin, nextMax] = [nextMax, nextMin];
    }
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    if (draftFilter !== filter) setUrl(q, draftFilter);
    setFilterOpen(false);
  };
  const clearAllFilters = () => {
    setDraftFilter("all");
    setMinDraft("");
    setMaxDraft("");
    setMinPrice(null);
    setMaxPrice(null);
    if (filter !== "all") setUrl(q, "all");
    setFilterOpen(false);
  };

  const priceActive = minPrice !== null || maxPrice !== null;
  const activeFilterCount = (filter !== "all" ? 1 : 0) + (priceActive ? 1 : 0);

  const countByDraftPrice = useMemo(() => {
    let dMin = parsePrice(minDraft);
    let dMax = parsePrice(maxDraft);
    if (dMin !== null && dMax !== null && dMin > dMax) [dMin, dMax] = [dMax, dMin];
    const hasDraftPrice = dMin !== null || dMax !== null;
    const map: Record<string, number> = { all: 0 };
    for (const g of search.groups) {
      const filtered = hasDraftPrice
        ? g.results.filter((r) => {
            if (r.priceValue == null) return false;
            if (dMin !== null && r.priceValue < dMin) return false;
            if (dMax !== null && r.priceValue > dMax) return false;
            return true;
          })
        : g.results;
      map[g.kind] = filtered.length;
      map.all += filtered.length;
    }
    return map;
  }, [search.groups, minDraft, maxDraft]);

  const groups = search.groups
    .filter(g => filter === "all" || g.kind === filter)
    .map(g => {
      const priceFiltered = priceActive
        ? g.results.filter((r) => {
            if (r.priceValue == null) return false;
            if (minPrice !== null && r.priceValue < minPrice) return false;
            if (maxPrice !== null && r.priceValue > maxPrice) return false;
            return true;
          })
        : g.results;
      return { ...g, results: sortResults(priceFiltered, sort) };
    });

  const visibleGroups = filter === "all"
    ? groups.filter(g => g.results.length > 0 || Boolean(g.error))
    : groups;
  const loading = trimmed.length >= 2 && (search.isDebouncing || search.isLoading || (search.isFetching && search.groups.length === 0));
  const total = groups.reduce((s, g) => s + g.results.length, 0);

  return (
    <div className="pxs-page">
      <section className="pxs-top">
        <p className="pxs-eyebrow">Marketplace search</p>
        <h1>{trimmed ? <>Results for <em>{trimmed}</em></> : "Search the marketplace"}</h1>
        <form className="pxs-form" role="search" aria-label="Search the marketplace" onSubmit={submit}>
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label="Search gift cards, top-ups and products"
            placeholder="Search gift cards, top-ups, products..."
            value={draft}
            onChange={e => setDraft(e.target.value)}
            data-testid="input-search-page"
          />
          {draft ? (
            <button
              type="button"
              className="pxs-clear"
              aria-label="Clear search"
              onClick={() => {
                setDraft("");
                if (q) setUrl("", filter);
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
          <button type="submit" className="pxs-submit" data-testid="button-search-page">Search</button>
        </form>

        <div className="tm-sortbar">
          <button
            type="button"
            className={filterOpen || activeFilterCount > 0 ? "tm-fbtn on" : "tm-fbtn"}
            onClick={openFilterModal}
            aria-haspopup="dialog"
            aria-expanded={filterOpen}
            data-testid="button-search-filter"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            <span>Filter</span>
            {activeFilterCount > 0 && <span className="tm-fbadge">{activeFilterCount}</span>}
          </button>
          <button
            type="button"
            className={sortOpen || sort !== "best" ? "tm-sort on" : "tm-sort"}
            onClick={() => setSortOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sortOpen}
            aria-label="Sort results"
            data-testid="select-search-sort"
          >
            <ArrowUpDown size={18} aria-hidden="true" />
            <span className="tm-sort-txt">{SORT_LABELS[sort]}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        </div>

        <ResponsivePickerModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter results"
          description="Narrow search results by category or price"
          footer={
            <div className="flex items-center gap-2.5">
              {(activeFilterCount > 0 || draftFilter !== "all" || minDraft || maxDraft) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="h-11 rounded-xl border border-[#dce3db] bg-white px-4 text-sm font-semibold text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={applyFilters}
                className="h-11 flex-1 rounded-xl bg-[#091e1c] px-5 text-sm font-bold text-white transition-colors hover:bg-[#bef264] hover:text-[#091e1c]"
              >
                {trimmed.length >= 2 && !loading
                  ? `Show ${countByDraftPrice[draftFilter] ?? 0} ${(countByDraftPrice[draftFilter] ?? 0) === 1 ? "result" : "results"}`
                  : "Apply filters"}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <div>
              <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[#52625f]">
                Category
              </h4>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => {
                  const count = trimmed.length >= 2 && !loading ? countByDraftPrice[f.value] : undefined;
                  const active = draftFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setDraftFilter(f.value)}
                      data-testid={`tab-filter-${f.value}`}
                      className={
                        active
                          ? "h-10 rounded-full border border-[#091e1c] bg-[#091e1c] px-4 text-[13px] font-semibold text-white transition-colors"
                          : "h-10 rounded-full border border-[#dce3db] bg-white px-4 text-[13px] font-semibold text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                      }
                    >
                      {f.label}
                      {count !== undefined ? ` (${count})` : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#eef2f1] pt-4">
              <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[#52625f]">
                Price range
              </h4>
              <div className="flex items-center gap-2.5">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="Min"
                  aria-label="Minimum price"
                  value={minDraft}
                  onChange={e => setMinDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyFilters(); } }}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#dce3db] bg-white px-3 text-[16px] text-[#091e1c] outline-none focus:border-[#091e1c]"
                />
                <span className="text-sm font-medium text-[#52625f]">–</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="Max"
                  aria-label="Maximum price"
                  value={maxDraft}
                  onChange={e => setMaxDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyFilters(); } }}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#dce3db] bg-white px-3 text-[16px] text-[#091e1c] outline-none focus:border-[#091e1c]"
                />
              </div>
            </div>
          </div>
        </ResponsivePickerModal>

        <ResponsivePickerModal
          open={sortOpen}
          onOpenChange={setSortOpen}
          title="Sort results"
          description="Choose how search results are ordered"
          maxWidthClassName="sm:max-w-[380px]"
        >
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Sort results">
            {SORT_OPTIONS.map(opt => {
              const active = sort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setSort(opt.value);
                    setSortOpen(false);
                  }}
                  className={
                    active
                      ? "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-[#c9e59a] bg-[#f0f7e4] px-3.5 text-left text-[15px] font-bold text-[#091e1c]"
                      : "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-transparent px-3.5 text-left text-[15px] font-medium text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                  }
                >
                  <span>{opt.label}</span>
                  {active ? <Check size={18} className="shrink-0 text-[#426b1d]" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </ResponsivePickerModal>
      </section>

      <section className="pxs-results" aria-live="polite" aria-busy={loading}>
        {trimmed.length < 2 ? (
          <div className="pxs-empty">
            <h2>What are you looking for?</h2>
            <p>Type at least two characters. Search brands, gift card categories, mobile operators, or shipped products.</p>
            <div className="pxs-chips" aria-label="Popular searches">
              {QUICK_SEARCHES.map(term => (
                <button
                  key={term}
                  type="button"
                  className="pxs-chip"
                  onClick={() => { setDraft(term); setUrl(term, filter); }}
                >
                  {term}
                </button>
              ))}
            </div>
            <div className="pxs-links">
              <Link href="/gift-cards">Browse gift cards</Link>
              <Link href="/mobile-topup">Mobile top-up</Link>
              <Link href="/shop">Shop products</Link>
            </div>
          </div>
        ) : loading ? (
          <div className="pxs-skel-grid" aria-label="Loading results">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pxs-skel-card">
                <div className="pxs-skel" />
                <div className="pxs-skel-line" />
                <div className="pxs-skel-line short" />
              </div>
            ))}
          </div>
        ) : search.isError ? (
          <div className="pxs-empty" role="alert">
            <h2>Search could not finish</h2>
            <p>The catalogs did not respond. Your query is saved above.</p>
            <button type="button" className="pxs-retry" onClick={() => void search.refetch()}>Try again</button>
          </div>
        ) : (
          <>
            {total === 0 && groups.every(g => !g.error && !g.needsCountry) && (
              <div className="pxs-empty">
                <h2>No matches for "{trimmed}"</h2>
                <p>
                  {activeFilterCount > 0
                    ? "Try clearing your active filters or searching a broader term."
                    : "Check the spelling, try a shorter name, or explore a popular search below."}
                </p>
                <div className="pxs-chips">
                  {activeFilterCount > 0 && (
                    <button type="button" className="pxs-retry" onClick={clearAllFilters}>
                      Reset filters
                    </button>
                  )}
                  {QUICK_SEARCHES.slice(0, 4).map(term => (
                    <button
                      key={term}
                      type="button"
                      className="pxs-chip"
                      onClick={() => { setDraft(term); setUrl(term, "all"); }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {visibleGroups.map(group => {
              if (group.results.length === 0 && !group.error && !group.needsCountry) {
                return null;
              }
              const isExpanded = Boolean(expanded[group.kind]) || filter !== "all";
              const shownItems = isExpanded ? group.results : group.results.slice(0, INITIAL_GROUP_LIMIT);
              const remaining = group.results.length - shownItems.length;

              return (
                <div key={group.kind} className="pxs-group" data-testid={`group-${group.kind}`}>
                  {(visibleGroups.length > 1 || group.results.length > 0) && (
                    <div className="pxs-group-head">
                      <div className="pxs-group-title">
                        <h2>{group.label}</h2>
                        {group.results.length > 0 && (
                          <span>{group.results.length} {group.results.length === 1 ? "result" : "results"}</span>
                        )}
                      </div>
                      {group.results.length > 0 && (
                        <Link href={seeAllHref(group.kind, trimmed)} className="pxs-seeall">
                          See all
                        </Link>
                      )}
                    </div>
                  )}
                  {group.needsCountry ? (
                    <div className="pxs-note">
                      Choose a digital country in the header to search mobile operators.
                    </div>
                  ) : group.error ? (
                    <div className="pxs-note" role="alert">
                      {group.error}
                      <button type="button" onClick={() => void search.refetch()}>Try again</button>
                    </div>
                  ) : group.kind === "product" ? (
                    <ProductResultsMasonry items={shownItems} />
                  ) : group.kind === "gift-card" ? (
                    <div className="pxs-gsa-grid">
                      {shownItems.map(r => (
                        <GiftCardResultTile key={`${r.kind}-${r.id}`} item={r} />
                      ))}
                    </div>
                  ) : (
                    <div className="pxs-topup-grid">
                      {shownItems.map(r => (
                        <TopupResultTile key={`${r.kind}-${r.id}`} item={r} />
                      ))}
                    </div>
                  )}
                  {remaining > 0 && (
                    <div className="pxs-more-wrap">
                      <button
                        type="button"
                        className="pxs-more"
                        onClick={() => setExpanded(prev => ({ ...prev, [group.kind]: true }))}
                      >
                        Show {remaining} more {group.label.toLowerCase()}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
}
