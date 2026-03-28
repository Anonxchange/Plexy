const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-client-ip`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _cachedIP: string | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getClientIP(): Promise<string> {
  const now = Date.now();
  if (_cachedIP && now < _cacheExpiry) return _cachedIP;

  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      headers: { apikey: ANON_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ip && data.ip !== 'unknown') {
        _cachedIP = data.ip;
        _cacheExpiry = now + CACHE_TTL_MS;
        return _cachedIP;
      }
    }
  } catch {
    // Edge function unreachable — fall through to unknown
  }

  return 'unknown';
}
