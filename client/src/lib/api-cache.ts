const MEM = new Map<string, { data: unknown; exp: number }>();
const LS_PREFIX = "pexly:cg:";

export const CG_BASE = import.meta.env.DEV
  ? "/api/coingecko"
  : "https://api.coingecko.com/api/v3";

export async function cachedFetch(url: string, ttlMs: number): Promise<unknown> {
  const now = Date.now();

  const mem = MEM.get(url);
  if (mem && mem.exp > now) return mem.data;

  try {
    const raw = localStorage.getItem(LS_PREFIX + url);
    if (raw) {
      const entry = JSON.parse(raw) as { data: unknown; exp: number };
      if (entry.exp > now) {
        MEM.set(url, entry);
        return entry.data;
      }
    }
  } catch {}

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const entry = { data, exp: now + ttlMs };
  MEM.set(url, entry);
  try {
    localStorage.setItem(LS_PREFIX + url, JSON.stringify(entry));
  } catch {}

  return data;
}
