import { FormEvent, useState } from "react";
import { MessageCircle, X, Search, Loader2, ShoppingBag, ExternalLink } from "lucide-react";

const MCP_URL = "https://hvpeycnedmzrjshmvgri.supabase.co/functions/v1/pexly-shop-mcp";

type ShopProduct = {
  id?: string;
  title: string;
  description?: string;
  price?: string | number;
  currency?: string;
  availableForSale?: boolean;
  image?: string;
  url?: string;
};

function safeHttpsUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function displayPrice(product: ShopProduct): string | null {
  if (product.price === undefined || product.price === null || product.price === "") return null;
  const amount = Number(product.price);
  if (!Number.isFinite(amount)) return null;
  const currency = product.currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

async function searchCatalog(query: string): Promise<ShopProduct[]> {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_products",
        arguments: { query: query.trim(), limit: 5 },
      },
    }),
  });
  if (!response.ok) throw new Error(`Catalog request failed (HTTP ${response.status}).`);
  const payload = await response.json();
  const result = payload?.result;
  if (result?.isError) {
    const message = result?.content?.find((item: any) => item?.type === "text")?.text;
    throw new Error(typeof message === "string" ? message : "The catalog search failed.");
  }
  const structured = result?.structuredContent;
  if (Array.isArray(structured?.products)) return structured.products;
  const text = result?.content?.find((item: any) => item?.type === "text")?.text;
  if (typeof text === "string") {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed?.products)) return parsed.products;
    } catch {
      // The server returned text rather than a product payload.
    }
  }
  return [];
}

export function PexlyShopAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setQuery(trimmed);
    setLastQuery(trimmed);
    setLoading(true);
    setError("");
    setProducts([]);
    try {
      const results = await searchCatalog(trimmed);
      setProducts(results.filter((p) => p && typeof p.title === "string" && p.title.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reach the Pexly Shop catalog. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  return (
    <div className="fixed bottom-5 right-4 z-[70] sm:right-6" aria-live="polite">
      {open && (
        <section className="mb-3 flex w-[min( calc(100vw-2rem), 25rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-background text-foreground shadow-2xl sm:w-96" aria-label="Pexly Shop product assistant">
          <header className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300 text-black"><ShoppingBag size={19} /></span>
              <div>
                <p className="text-sm font-semibold">Pexly Shop Assistant</p>
                <p className="text-xs text-muted-foreground">Search products from our catalog</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-muted" aria-label="Close shop assistant"><X size={18} /></button>
          </header>

          <div className="max-h-[min(60vh,32rem)] space-y-3 overflow-y-auto p-3">
            {!lastQuery && (
              <div className="space-y-3">
                <p className="text-sm">What are you looking for?</p>
                <div className="flex flex-wrap gap-2">
                  {["T-shirts", "Shoes", "Trousers"].map((item) => (
                    <button key={item} type="button" onClick={() => void runSearch(item)} disabled={loading} className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50">{item}</button>
                  ))}
                </div>
              </div>
            )}

            {loading && <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Searching the live catalog…</div>}
            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">{error}<p className="mt-1 text-xs text-muted-foreground">No products or prices have been guessed.</p></div>}
            {!loading && !error && lastQuery && products.length === 0 && (
              <div className="rounded-xl border p-3 text-sm">No matching products were returned for “{lastQuery}”. Try another search phrase.</div>
            )}

            {products.map((product, index) => {
              const imageUrl = safeHttpsUrl(product.image);
              const productUrl = safeHttpsUrl(product.url);
              const price = displayPrice(product);
              return (
                <article key={product.id || product.url || `${product.title}-${index}`} className="flex gap-3 rounded-xl border p-2.5">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.title} loading="lazy" className="h-20 w-20 shrink-0 rounded-lg bg-muted object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><ShoppingBag size={22} /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
                    {price && <p className="mt-1 text-sm font-semibold">{price}</p>}
                    {product.availableForSale === false && <p className="mt-1 text-xs text-muted-foreground">Currently unavailable</p>}
                    {product.availableForSale === true && <p className="mt-1 text-xs text-muted-foreground">Available</p>}
                    {productUrl && <a href={productUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4">View product <ExternalLink size={12} /></a>}
                  </div>
                </article>
              );
            })}
          </div>

          <form onSubmit={submit} className="flex gap-2 border-t p-3">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shirts, shoes…" aria-label="Search Pexly Shop products" maxLength={120} className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" disabled={loading || !query.trim()} className="inline-flex items-center justify-center rounded-xl bg-primary px-3 text-primary-foreground disabled:opacity-50" aria-label="Search catalog"><Search size={18} /></button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-lime-300 px-4 font-semibold text-black shadow-lg transition hover:scale-[1.02]" aria-label={open ? "Close Pexly Shop assistant" : "Open Pexly Shop assistant"}>
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span className="text-sm">Ask Pexly</span>
      </button>
    </div>
  );
}
