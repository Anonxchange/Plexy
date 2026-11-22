"use client";
import { useMemo, useState } from "react";
import { CurrentMarketingPage } from "@/components/marketing/current-marketing-page";
import {
  ArrowUpDown,
  ChevronDown,
  Coffee,
  CreditCard,
  Filter,
  Flame,
  Gamepad2,
  Gift,
  Globe,
  Heart,
  Home,
  Laptop,
  Music,
  Search,
  ShoppingBag,
  Tag,
  Ticket,
  UtensilsCrossed,
} from "@/lib/icons";
import { useGiftCardCategories } from "@/hooks/use-reloadly";
import { useAirtimeOperators } from "@/hooks/use-airtime-operators";
import { useGiftCardCatalog } from "@/hooks/use-gift-card-catalog";
import { useDigitalCountry } from "@/lib/country-preferences";
import {
  airTile,
  giftTile,
  preferredRank,
  uniqueByName,
  type CardTile,
} from "@/lib/gift-card-utils";

const PAGE_SIZE = 40;

type IconType = typeof Flame;

// Category icon by name (the name comes from Reloadly, so this matches on keywords)
function categoryIcon(name: string): IconType {
  const n = name.toLowerCase();
  if (/popular/.test(n)) return Flame;
  if (/travel|hotel|flight|transport|airline/.test(n)) return Globe;
  if (/food|grocer|restaurant|dining|delivery/.test(n)) return UtensilsCrossed;
  if (/gam/.test(n)) return Gamepad2;
  if (/music/.test(n)) return Music;
  if (/entertain|stream|movie|video|tv/.test(n)) return Ticket;
  if (/payment|prepaid|card|finance/.test(n)) return CreditCard;
  if (/electron|tech|computer/.test(n)) return Laptop;
  if (/health|beauty|wellness|care/.test(n)) return Heart;
  if (/home|garden|furniture|diy/.test(n)) return Home;
  if (/coffee|cafe/.test(n)) return Coffee;
  if (/shop|retail|fashion|cloth|market/.test(n)) return ShoppingBag;
  if (/gift/.test(n)) return Gift;
  return Tag;
}

function readParams() {
  if (typeof window === "undefined") return { category: null as number | null, name: "", type: "gift", q: "" };
  const sp = new URLSearchParams(window.location.search);
  const c = Number(sp.get("category"));
  return {
    category: Number.isFinite(c) && c > 0 ? c : null,
    name: sp.get("name") || "",
    type: sp.get("type") === "airtime" ? "airtime" : "gift",
    q: sp.get("q") || "",
  };
}

function writeParams(next: { category: number | null; name: string; type: string; q: string }) {
  const sp = new URLSearchParams();
  if (next.type === "airtime") sp.set("type", "airtime");
  if (next.category) {
    sp.set("category", String(next.category));
    if (next.name) sp.set("name", next.name);
  }
  if (next.q) sp.set("q", next.q);
  const qs = sp.toString();
  window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
}

const ALL_CSS = `
.pxg .gsa{--gs-ink:#091e1c;--gs-mute:#52625f;--gs-line:#e3ebe9;--gs-field:#f3f7f6;color:var(--gs-ink);background:#fff}
.pxg .gsa .gsa-w{max-width:1320px;margin:0 auto;padding:0 16px}
.pxg .gsa .gsa-search{display:flex;align-items:center;gap:8px;height:56px;margin:18px 0 0;padding:0 8px 0 20px;background:var(--gs-field);border:1.5px solid var(--gs-line);border-radius:999px}
.pxg .gsa .gsa-search:focus-within{border-color:var(--gs-ink)}
.pxg .gsa .gsa-search input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font-family:inherit;font-weight:500;font-size:17px;line-height:1;color:var(--gs-ink);padding:0;margin:0;box-shadow:none;-webkit-appearance:none;appearance:none}
.pxg .gsa .gsa-search input::placeholder{color:#7b8a87;opacity:1}
.pxg .gsa .gsa-search input::-webkit-search-cancel-button{display:none}
.pxg .gsa .gsa-search button{display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;min-width:0;padding:0;margin:0;border:0;border-radius:50%;background:#bef264;color:var(--gs-ink);cursor:pointer;-webkit-appearance:none;appearance:none}
.pxg .gsa .gsa-kinds{display:flex;gap:6px;margin-top:16px;overflow-x:auto;scrollbar-width:none}
.pxg .gsa .gsa-kinds::-webkit-scrollbar{display:none}
.pxg .gsa .gsa-kind{flex:0 0 auto;height:44px;padding:0 20px;border:1.5px solid transparent;border-radius:999px;background:transparent;color:var(--gs-ink);font-family:inherit;font-weight:700;font-size:16px;cursor:pointer;margin:0}
.pxg .gsa .gsa-kind[aria-pressed="true"]{border-color:var(--gs-ink)}
.pxg .gsa .gsa-cats{background:var(--gs-field);margin-top:14px;border-top:1px solid var(--gs-line);border-bottom:1px solid var(--gs-line)}
.pxg .gsa .gsa-cats-in{max-width:1320px;margin:0 auto;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:14px 12px}
.pxg .gsa .gsa-cats-in::-webkit-scrollbar{display:none}
.pxg .gsa .gsa-cat{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:8px;min-width:76px;padding:6px 10px;border:0;background:transparent;font-family:inherit;font-weight:600;font-size:14px;color:var(--gs-mute);cursor:pointer;margin:0;border-radius:12px}
.pxg .gsa .gsa-cat[aria-pressed="true"]{color:var(--gs-ink);font-weight:800}
.pxg .gsa .gsa-cat:focus-visible,.pxg .gsa .gsa-kind:focus-visible,.pxg .gsa .gsa-ctl:focus-visible,.pxg .gsa .gsa-pill select:focus-visible,.pxg .gsa .gsa-search button:focus-visible,.pxg .gsa .gsa-more:focus-visible{outline:3px solid #5b8cff;outline-offset:2px}
.pxg .gsa .gsa-title{margin:26px 0 0;font-size:clamp(30px,6vw,44px);line-height:1;letter-spacing:-.035em;font-weight:800;color:var(--gs-ink)}
.pxg .gsa .gsa-bar{display:flex;gap:10px;align-items:center;margin-top:18px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}
.pxg .gsa .gsa-bar::-webkit-scrollbar{display:none}
.pxg .gsa .gsa-ctl{flex:0 0 auto;display:grid;place-items:center;width:48px;height:48px;padding:0;margin:0;border:1.5px solid var(--gs-line);border-radius:50%;background:#fff;color:var(--gs-ink);cursor:pointer;position:relative}
.pxg .gsa .gsa-ctl[aria-expanded="true"]{border-color:var(--gs-ink)}
.pxg .gsa .gsa-dot{position:absolute;top:8px;right:9px;width:9px;height:9px;border-radius:50%;background:#bef264;border:1.5px solid #fff}
.pxg .gsa .gsa-pill{flex:0 0 auto;position:relative;display:inline-flex;align-items:center;height:48px;border:1.5px solid var(--gs-line);border-radius:999px;background:#fff;color:var(--gs-ink)}
.pxg .gsa .gsa-pill>svg{position:absolute;pointer-events:none}
.pxg .gsa .gsa-pill .lead{left:14px}
.pxg .gsa .gsa-pill .tail{right:12px}
.pxg .gsa .gsa-pill select{height:100%;border:0;background:transparent;font-family:inherit;font-weight:700;font-size:15px;color:var(--gs-ink);padding:0 38px 0 16px;margin:0;border-radius:999px;cursor:pointer;-webkit-appearance:none;appearance:none;max-width:260px}
.pxg .gsa .gsa-pill.has-lead select{padding-left:42px}
.pxg .gsa .gsa-panel{margin-top:12px;padding:14px 16px;border:1.5px solid var(--gs-line);border-radius:16px;background:var(--gs-field);display:flex;gap:18px;flex-wrap:wrap;align-items:center}
.pxg .gsa .gsa-panel label{display:flex;align-items:center;gap:9px;font-weight:600;font-size:15px;cursor:pointer}
.pxg .gsa .gsa-panel input{width:18px;height:18px;accent-color:#091e1c;margin:0}
.pxg .gsa .gsa-panel button{margin-left:auto;border:0;background:none;font-family:inherit;font-weight:700;font-size:14px;color:var(--gs-mute);text-decoration:underline;cursor:pointer;padding:0}
.pxg .gsa .gsa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 14px;margin-top:20px}
@media(min-width:700px){.pxg .gsa .gsa-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:28px 18px}}
@media(min-width:1000px){.pxg .gsa .gsa-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
.pxg .gsa .gsa-tile{display:block;text-decoration:none;color:inherit}
.pxg .gsa .gsa-art{position:relative;aspect-ratio:1.586;border-radius:14px;overflow:hidden;display:grid;place-items:center;border:1px solid var(--gs-line);background:#fff;transition:transform .2s}
.pxg .gsa .gsa-tile:hover .gsa-art{transform:translateY(-4px)}
.pxg .gsa .gsa-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;max-width:none}
.pxg .gsa .gsa-fb{padding:10px;text-align:center;font-weight:800;font-size:15px;color:#45524f}
.pxg .gsa .gsa-tn{margin-top:10px;font-weight:700;font-size:15px;line-height:1.3;color:var(--gs-ink)}
.pxg .gsa .gsa-ts{margin-top:3px;font-size:14px;line-height:1.3;color:var(--gs-mute);font-variant-numeric:tabular-nums}
.pxg .gsa .gsa-sk{aspect-ratio:1.586;border-radius:14px;background:linear-gradient(90deg,#eef2f1,#f7f9f8,#eef2f1);background-size:200% 100%;animation:gsa-pulse 1.2s linear infinite}
@keyframes gsa-pulse{to{background-position:-200% 0}}
.pxg .gsa .gsa-foot{max-width:420px;margin:36px auto 0;text-align:center}
.pxg .gsa .gsa-foot p{margin:0;font-weight:700;font-size:16px}
.pxg .gsa .gsa-prog{height:6px;border-radius:99px;background:var(--gs-line);margin:14px auto 0;overflow:hidden}
.pxg .gsa .gsa-prog i{display:block;height:100%;background:var(--gs-ink);border-radius:99px;transition:width .3s}
.pxg .gsa .gsa-more{margin:22px auto 0;height:50px;padding:0 28px;border:1.5px solid var(--gs-ink);border-radius:999px;background:transparent;color:var(--gs-ink);font-family:inherit;font-weight:700;font-size:16px;cursor:pointer}
.pxg .gsa .gsa-more[disabled]{opacity:.6;cursor:default}
.pxg .gsa .gsa-msg{margin:30px 0;color:var(--gs-mute);font-size:15px}
.pxg .gsa .gsa-end{height:46px}
`;

function Tile({ t }: { t: CardTile }) {
  return (
    <a className={"gsa-tile"} href={t.href}>
      <div className={"gsa-art"}>
        <span className={"gsa-fb"}>{t.name}</span>
        {t.img ? (
          <img
            src={sanitizeImageUrl(t.img)}
            alt={""}
            loading={"lazy"}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>
      <div className={"gsa-tn"}>{t.name}</div>
      {t.range ? <div className={"gsa-ts"}>{t.range}</div> : null}
    </a>
  );
}

function AllCardsList() {
  const initial = useMemo(readParams, []);
  const [kind, setKind] = useState<string>(initial.type);
  const [categoryId, setCategoryId] = useState<number | null>(initial.category);
  const [categoryName, setCategoryName] = useState<string>(initial.name);
  const [qInput, setQInput] = useState(initial.q);
  const [q, setQ] = useState(initial.q);
  const country = useDigitalCountry();
  const [sort, setSort] = useState("recommended");
  const [panelOpen, setPanelOpen] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyRange, setOnlyRange] = useState(false);

  const categories = useGiftCardCategories();
  const isAir = kind === "airtime";
  const airCountry = country;

  const cat = useGiftCardCatalog({
    countryCode: country,
    categoryId: categoryId ?? undefined,
    productName: q || undefined,
    size: PAGE_SIZE,
    enabled: !isAir && !!country,
  });
  const air = useAirtimeOperators(airCountry, isAir);

  const cats = categories.data ?? [];
  const title = isAir ? "Mobile Top Up" : categoryId ? categoryName || cats.find((c) => c.id === categoryId)?.name || "Gift Cards" : "All Gift Cards";

  const changeCategory = (id: number | null, name: string) => {
    setCategoryId(id);
    setCategoryName(name);
    writeParams({ category: id, name, type: kind, q });
  };
  const changeKind = (k: string) => {
    setKind(k);
    writeParams({ category: k === "gift" ? categoryId : null, name: categoryName, type: k, q });
  };
  const submitSearch = () => {
    const v = qInput.trim();
    setQ(v);
    writeParams({ category: categoryId, name: categoryName, type: kind, q: v });
  };
  const loadedRaw = cat.data?.pages.flatMap((p) => p.content ?? []) ?? [];
  const total = cat.data?.pages[0]?.totalElements ?? 0;

  const tiles = useMemo(() => {
    let out: CardTile[];
    if (isAir) {
      out = (air.data ?? []).map(airTile);
      if (q) out = out.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
    } else {
      let list = loadedRaw.filter((p) => p.status !== "INACTIVE");
      if (onlyDiscount) list = list.filter((p) => (p.discountPercentage || 0) > 0);
      if (onlyRange) list = list.filter((p) => p.denominationType === "RANGE");
      list = uniqueByName(list);
      if (sort === "recommended" && !categoryId && !q) {
        list = [...list].sort((a, b) => preferredRank(a.brand?.brandName || a.productName) - preferredRank(b.brand?.brandName || b.productName));
      }
      out = list.map(giftTile);
    }
    if (sort === "az") out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "za") out.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "low") out.sort((a, b) => (a.usd ?? Infinity) - (b.usd ?? Infinity));
    if (sort === "high") out.sort((a, b) => (b.usd ?? -1) - (a.usd ?? -1));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAir, air.data, cat.data, sort, onlyDiscount, onlyRange, categoryId, q]);

  const loading = isAir ? air.isLoading : cat.isLoading;
  const failed = isAir ? air.isError : cat.isError;
  const filtersOn = onlyDiscount || onlyRange;
  const shown = loadedRaw.length;

  return (
    <div className={"gsa"}>
      <style>{ALL_CSS}</style>
      <div className={"gsa-w"}>
        <form
          className={"gsa-search"}
          role={"search"}
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
        >
          <input
            type={"search"}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={"Search for gift cards, top ups"}
            aria-label={"Search"}
            autoComplete={"off"}
            enterKeyHint={"search"}
          />
          <button type={"submit"} aria-label={"Search"}>
            <Search size={22} />
          </button>
        </form>
        <div className={"gsa-kinds"} role={"tablist"}>
          <button type={"button"} className={"gsa-kind"} aria-pressed={!isAir} onClick={() => changeKind("gift")}>
            {"Gift Cards"}
          </button>
          <button type={"button"} className={"gsa-kind"} aria-pressed={isAir} onClick={() => changeKind("airtime")}>
            {"Top Up"}
          </button>
        </div>
      </div>

      {isAir ? null : (
        <div className={"gsa-cats"}>
          <div className={"gsa-cats-in"}>
            {[{ id: 0, name: "Popular" }, ...cats].map((c) => {
              const Icon = categoryIcon(c.name);
              const active = c.id === 0 ? categoryId === null : categoryId === c.id;
              return (
                <button key={c.id} type={"button"} className={"gsa-cat"} aria-pressed={active} onClick={() => changeCategory(c.id === 0 ? null : c.id, c.id === 0 ? "" : c.name)}>
                  <Icon size={28} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={"gsa-w"}>
        <h1 className={"gsa-title"}>{title}</h1>

        <div className={"gsa-bar"}>
          {isAir ? null : (
            <button type={"button"} className={"gsa-ctl"} aria-label={"Filters"} aria-expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)}>
              <Filter size={22} />
              {filtersOn ? <span className={"gsa-dot"}></span> : null}
            </button>
          )}
          <label className={"gsa-pill has-lead"}>
            <ArrowUpDown size={20} className={"lead"} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={"Sort by"}>
              <option value={"recommended"}>{"Sort by: Recommended"}</option>
              <option value={"az"}>{"Name A–Z"}</option>
              <option value={"za"}>{"Name Z–A"}</option>
              <option value={"low"}>{"Price: low to high"}</option>
              <option value={"high"}>{"Price: high to low"}</option>
            </select>
            <ChevronDown size={18} className={"tail"} />
          </label>
        </div>

        {panelOpen && !isAir ? (
          <div className={"gsa-panel"}>
            <label>
              <input type={"checkbox"} checked={onlyDiscount} onChange={(e) => setOnlyDiscount(e.target.checked)} />
              {"Discounted only"}
            </label>
            <label>
              <input type={"checkbox"} checked={onlyRange} onChange={(e) => setOnlyRange(e.target.checked)} />
              {"Choose any amount"}
            </label>
            {filtersOn ? (
              <button
                type={"button"}
                onClick={() => {
                  setOnlyDiscount(false);
                  setOnlyRange(false);
                }}
              >
                {"Clear"}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={"gsa-grid"}>
          {loading ? Array.from({ length: 10 }).map((_, i) => <div key={i} className={"gsa-sk"}></div>) : tiles.map((t) => <Tile key={(isAir ? "a-" : "g-") + t.id} t={t} />)}
        </div>

        {failed ? <p className={"gsa-msg"}>{"Cards couldn’t be loaded right now. Please try again."}</p> : null}
        {!loading && !failed && tiles.length === 0 ? <p className={"gsa-msg"}>{"Nothing found. Try another country, category or search."}</p> : null}

        {!isAir && !loading && !failed && total > 0 ? (
          <div className={"gsa-foot"}>
            <p>{"Showing " + Math.min(shown, total) + " out of " + total}</p>
            <div className={"gsa-prog"} role={"progressbar"} aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(shown, total)}>
              <i style={{ width: Math.min(100, (shown / total) * 100) + "%" }}></i>
            </div>
            {cat.hasNextPage ? (
              <button type={"button"} className={"gsa-more"} onClick={() => cat.fetchNextPage()} disabled={cat.isFetchingNextPage}>
                {cat.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            ) : null}
          </div>
        ) : null}
        <div className={"gsa-end"}></div>
      </div>
    </div>
  );
}

export function GiftCardsAllPage() {
  return (
    <CurrentMarketingPage page={"gift-cards"}>
      <div className={"page-wrapper"}>
        <main id={"top"}>
          <div className={"pxg"}>
            <AllCardsList />
<div className={"g-main"}>
            <div className={"g-w"}>
              <div className={"g-after"} id={"g-after"}>
                <div>
                  <h2>
                    {"What happens after you pay"}
                  </h2>
                  <p>
                    {"No account, no card details. You pay from your wallet and the code comes to your inbox."}
                  </p>
                </div>
                <div className={"g-rc"}>
                  <h3>
                    {"Typical timing"}
                  </h3>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"0:00"}
                    </div>
                    <div>
                      <b>
                        {"You send the coin"}
                      </b>
                      <span>
                        {"From your own wallet to the address we show."}
                      </span>
                    </div>
                  </div>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"~0:30"}
                    </div>
                    <div>
                      <b>
                        {"The network confirms"}
                      </b>
                      <span>
                        {"Speed depends on the coin you picked."}
                      </span>
                    </div>
                  </div>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"~2:00"}
                    </div>
                    <div>
                      <b>
                        {"The code is in your inbox"}
                      </b>
                      <span>
                        {"Check spam if you don’t see it."}
                      </span>
                    </div>
                  </div>
                  <small>
                    {"Typical timings. Busy networks can take longer."}
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className={"g-main"}>
            <div className={"g-w"}>
              <div className={"g-faq"}>
                <div>
                  <h2>
                    {"Questions people ask"}
                  </h2>
                  <p className={"s"}>
                    {"Can’t find yours? Contact support from the footer."}
                  </p>
                </div>
                <div>
                  <details>
                    <summary>
                      {"Which coins can I pay with?"}
                    </summary>
                    <p>
                      {"USDT, USDC, Bitcoin, Ethereum, Solana and Litecoin. Pick one in the bar and all prices switch to it."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Do I need an account?"}
                    </summary>
                    <p>
                      {"No. Choose a card, pay, and the code is sent to the email you enter."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"How fast does the code arrive?"}
                    </summary>
                    <p>
                      {"Usually within a few minutes of your payment confirming."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Can I get a refund?"}
                    </summary>
                    <p>
                      {"Codes can’t be refunded once revealed. If a code doesn’t work, contact support within 24 hours."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Why do I only see some cards?"}
                    </summary>
                    <p>
                      {"Many cards only work in one country. Pick your country and you will only see cards that work for you."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Are there extra fees?"}
                    </summary>
                    <p>
                      {"The price shown is the card price in your coin. Your wallet’s network fee is separate and shown before you confirm."}
                    </p>
                  </details>
                </div>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </CurrentMarketingPage>
  );
}
