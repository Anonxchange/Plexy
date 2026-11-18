import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { Search } from "@/lib/icons";
import { useUniversalSearch, type SearchResult } from "@/hooks/use-universal-search";

const PER_GROUP = 4;

export function searchHref(query: string) {
  const q = query.trim();
  return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
}

interface HeaderSearchProps {
  variant: "desktop" | "mobile";
  label: string;
  query: string;
  onQueryChange: (value: string) => void;
  onNavigate: () => void;
}

export function HeaderSearch({ variant, label, query, onQueryChange, onNavigate }: HeaderSearchProps) {
  const [, setLocation] = useLocation();
  const baseId = useId();
  const listId = `${baseId}-listbox`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(-1);
  const search = useUniversalSearch(query, true);
  const trimmed = query.trim();
  const tooShort = trimmed.length < 2;

  const visible = useMemo(
    () => search.groups.map(group => ({ ...group, results: group.results.slice(0, PER_GROUP) })),
    [search.groups],
  );
  const flat = useMemo(() => visible.flatMap(group => group.results), [visible]);
  const totalFound = search.groups.reduce((sum, group) => sum + group.results.length, 0);
  const loading = !tooShort && (search.isDebouncing || search.isFetching) && flat.length === 0;
  const failedGroups = visible.filter(group => group.error);
  const allFailed = !loading && visible.length > 0 && failedGroups.length === visible.length;
  const showList = open && !tooShort;

  useEffect(() => { setActive(-1); }, [search.groups, trimmed]);

  useEffect(() => {
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setLocation(href);
    onNavigate();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (active >= 0 && flat[active]) return go(flat[active].href);
    go(searchHref(query));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      if (flat.length) setActive(i => (i + 1) % flat.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (flat.length) setActive(i => (i <= 0 ? flat.length - 1 : i - 1));
    } else if (event.key === "Escape") {
      if (showList) {
        event.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    }
  };

  const optionId = (index: number) => `${baseId}-opt-${index}`;
  let index = -1;

  const renderOption = (result: SearchResult) => {
    index += 1;
    const i = index;
    return (
      <li
        key={`${result.kind}-${result.id}`}
        id={optionId(i)}
        role="option"
        aria-selected={active === i}
        className={`px-sugg-opt${active === i ? " active" : ""}`}
        onMouseEnter={() => setActive(i)}
        onMouseDown={event => event.preventDefault()}
        onClick={() => go(result.href)}
        data-testid={`option-search-${result.kind}-${result.id}`}
      >
        <span className="px-sugg-thumb" aria-hidden="true">
          {result.image ? <img src={result.image} alt="" loading="lazy" /> : result.title.slice(0, 1).toUpperCase()}
        </span>
        <span className="px-sugg-text">
          <b>{result.title}</b>
          <small>{result.subtitle}</small>
        </span>
        {result.price && <span className="px-sugg-price">{result.price}</span>}
      </li>
    );
  };

  return (
    <div className={`px-sugg-wrap px-sugg-${variant}`} ref={wrapRef}>
      <form
        className={variant === "desktop" ? "px-search-form" : "px-mobile-search-form"}
        role="search"
        aria-label={label}
        onSubmit={submit}
        id={variant === "mobile" ? "px-mobile-search-panel" : undefined}
      >
        <Search aria-hidden="true" />
        <input
          autoFocus
          type="search"
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          placeholder="Search gift cards, top-ups, products..."
          value={query}
          onChange={event => { onQueryChange(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          data-testid={`input-header-search-${variant}`}
        />
        <button className="px-search-submit" type="submit" data-testid={`button-header-search-${variant}`}>Search</button>
      </form>
      {showList && (
        <div className="px-sugg-panel">
          <p className="sr-only" role="status" aria-live="polite">
            {loading ? "Searching" : `${totalFound} results`}
          </p>
          {loading && (
            <div className="px-sugg-skel" aria-hidden="true">
              {[0, 1, 2].map(n => <span key={n} />)}
            </div>
          )}
          {!loading && search.isError && (
            <div className="px-sugg-note" role="alert">
              Search could not finish.{" "}
              <button type="button" onClick={() => void search.refetch()}>Try again</button>
            </div>
          )}
          {!loading && allFailed && (
            <div className="px-sugg-note" role="alert">
              {failedGroups[0]?.error ?? "Catalogs are unavailable right now."}{" "}
              <button type="button" onClick={() => void search.refetch()}>Try again</button>
            </div>
          )}
          {!loading && !search.isError && !allFailed && visible.length > 0 && totalFound === 0 && (
            <p className="px-sugg-note">No matches for "{trimmed}". Try a brand, operator or product name.</p>
          )}
          <ul id={listId} role="listbox" aria-label="Search suggestions" className="px-sugg-list">
            {visible.map(group => group.results.length > 0 && (
              <li key={group.kind} role="presentation">
                <span className="px-sugg-head" role="presentation">{group.label}</span>
                <ul role="group" aria-label={group.label}>
                  {group.results.map(renderOption)}
                </ul>
              </li>
            ))}
          </ul>
          {!loading && !allFailed && failedGroups.length > 0 && (
            <p className="px-sugg-partial">
              Some catalogs did not respond: {failedGroups.map(g => g.label).join(", ")}.
            </p>
          )}
          <button
            type="button"
            className="px-sugg-all"
            onMouseDown={event => event.preventDefault()}
            onClick={() => go(searchHref(query))}
            data-testid={`button-search-all-${variant}`}
          >
            See all results for "{trimmed}"
          </button>
        </div>
      )}
    </div>
  );
}
