const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SUPABASE_EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-client-ip`;

let _cachedIP: string | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchFromEdge(): Promise<string | null> {
  try {
    const res = await fetch(SUPABASE_EDGE_URL, {
      headers: { apikey: ANON_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ip && data.ip !== 'unknown') return data.ip;
    }
  } catch {
    // Edge function unreachable
  }
  return null;
}

async function fetchFromIpify(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) return data.ip;
    }
  } catch {
    // ipify unreachable
  }
  return null;
}

export async function getClientIP(): Promise<string> {
  const now = Date.now();
  if (_cachedIP && now < _cacheExpiry) return _cachedIP;

  const ip = (await fetchFromIpify()) ?? (await fetchFromEdge()) ?? 'unknown';

  if (ip !== 'unknown') {
    _cachedIP = ip;
    _cacheExpiry = now + CACHE_TTL_MS;
  }

  return ip;
}
