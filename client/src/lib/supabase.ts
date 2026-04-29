import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _client: SupabaseClient | null = null;
let _promise: Promise<SupabaseClient> | null = null;

/**
 * Async getter — always safe.
 * Triggers a one-time dynamic import of @supabase/ssr so the entire
 * Supabase SDK is excluded from the initial eager bundle.
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (_client) return _client;
  if (!_promise) {
    _promise = import("@supabase/ssr").then(({ createBrowserClient }) => {
      _client = createBrowserClient(supabaseUrl, supabaseKey);
      return _client;
    });
  }
  return _promise;
}

/**
 * Synchronous factory kept for lazy-loaded pages that call createClient() in
 * their component body. By the time any lazy page can be visited, auth-context
 * will have already resolved getSupabase(), so _client is guaranteed to be set.
 * Returns a Proxy that defers property access to the real client.
 */
export function createClient(): SupabaseClient {
  if (_client) return _client;
  void getSupabase(); // fire-and-forget safety net
  return new Proxy({} as SupabaseClient, {
    get(_, prop) {
      if (_client) return (_client as any)[prop];
      if (prop === "then") return undefined; // not a Promise
      throw new Error(
        `Supabase client accessed before initialisation (prop: ${String(prop)}). ` +
        "Ensure AuthProvider has mounted before rendering lazy pages."
      );
    },
  });
}

/**
 * Singleton Proxy — same safety semantics as createClient().
 * Used by legacy call-sites that import { supabase } directly.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (_client) return (_client as any)[prop];
    if (prop === "then") return undefined;
    throw new Error(
      `supabase.${String(prop)} accessed before client initialised. ` +
      "Use getSupabase() in async contexts."
    );
  },
});
