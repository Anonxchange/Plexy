import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useHead } from "@unhead/react";
import { Search } from "@/lib/icons";
import { useUniversalSearch, type SearchKind } from "@/hooks/use-universal-search";
import "./search.css";

type Filter = "all" | SearchKind;
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "gift-card", label: "Gift cards" },
  { value: "topup", label: "Mobile top-ups" },
  { value: "product", label: "Physical products" },
];

export function SearchPage() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(searchString);
  const q = params.get("q") ?? "";
  const typeParam = params.get("type") as Filter | null;
  const filter: Filter = FILTERS.some(f => f.value === typeParam) ? (typeParam as Filter) : "all";
  const [draft, setDraft] = useState(q);
  useEffect(() => { setDraft(q); }, [q]);

  const search = useUniversalSearch(q, true);
  const trimmed = q.trim();

  useHead({
    title: trimmed ? `Search results for "${trimmed}" | Pexly` : "Search the marketplace | Pexly",
    meta: [
      { name: "description", content: trimmed
        ? `Gift cards, mobile top-ups and shipped products matching "${trimmed}" on Pexly. Pay with crypto.`
        : "Search Pexly gift cards, mobile top-ups and shipped products in one place." },
      { name: "robots", content: "noindex, follow" },
    ],
  });

  const setUrl = (nextQ: string, nextFilter: Filter) => {
    const p = new URLSearchParams();
    if (nextQ.trim()) p.set("q", nextQ.trim());
    if (nextFilter !== "all") p.set("type", nextFilter);
    const s = p.toString();
    setLocation(s ? `/search?${s}` : "/search");
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setUrl(draft, filter); };

  const groups = search.groups.filter(g => filter === "all" || g.kind === filter);
  const loading = trimmed.length >= 2 && (search.isDebouncing || search.isLoading || (search.isFetching && search.groups.length === 0));
  const count = (kind: SearchKind) => search.groups.find(g => g.kind === kind)?.results.length;
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
          <button type="submit" data-testid="button-search-page">Search</button>
        </form>

        <div className="pxs-countries" data-testid="panel-search-countries">
          <div>
            <b>Digital country: {search.digitalCountry ?? "Not set"}</b>
            <span>Used for gift cards and mobile top-ups, wherever the recipient redeems them.</span>
          </div>
          <div>
            <b>Delivery country: {search.deliveryCountry ?? "Not set"}</b>
            <span>Used for physical products: where we ship, plus prices and stock.</span>
          </div>
        </div>

        <div className="pxs-filters" role="tablist" aria-label="Filter results by type">
          {FILTERS.map(f => {
            const n = f.value === "all" ? undefined : count(f.value);
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={filter === f.value}
                className={filter === f.value ? "active" : ""}
                onClick={() => setUrl(q, f.value)}
                data-testid={`tab-filter-${f.value}`}
              >
                {f.label}{typeof n === "number" && !loading && <span>{n}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="pxs-results" aria-live="polite" aria-busy={loading}>
        {trimmed.length < 2 ? (
          <div className="pxs-empty">
            <h2>What are you looking for?</h2>
            <p>Type at least two characters. Try a brand like a streaming service, a mobile operator, or a product name.</p>
            <div className="pxs-links">
              <Link href="/gift-cards">Browse gift cards</Link>
              <Link href="/mobile-topup">Mobile top-up</Link>
              <Link href="/shop">Shop products</Link>
            </div>
          </div>
        ) : loading ? (
          <div className="pxs-grid" aria-label="Loading results">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="pxs-card pxs-skel" />)}
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
                <p>Check the spelling, try a shorter name, or switch filters.</p>
              </div>
            )}
            {groups.map(group => (
              <div key={group.kind} className="pxs-group" data-testid={`group-${group.kind}`}>
                <div className="pxs-group-head">
                  <h2>{group.label}</h2>
                  <span>{group.results.length} found</span>
                </div>
                {group.needsCountry ? (
                  <div className="pxs-note">
                    Choose a digital country in the header to search mobile operators.
                  </div>
                ) : group.error ? (
                  <div className="pxs-note" role="alert">
                    {group.error}
                    <button type="button" onClick={() => void search.refetch()}>Try again</button>
                  </div>
                ) : group.results.length === 0 ? (
                  <p className="pxs-none">Nothing in {group.label.toLowerCase()} matched.</p>
                ) : (
                  <div className="pxs-grid">
                    {group.results.map(r => (
                      <Link key={`${r.kind}-${r.id}`} href={r.href} className="pxs-card" data-testid={`card-result-${r.kind}-${r.id}`}>
                        <span className="pxs-thumb">
                          {r.image ? <img src={r.image} alt="" loading="lazy" /> : <span aria-hidden="true">{r.title.slice(0, 1).toUpperCase()}</span>}
                        </span>
                        <b>{r.title}</b>
                        <small>{r.subtitle}</small>
                        {r.price && <span className="pxs-price">From {r.price}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
