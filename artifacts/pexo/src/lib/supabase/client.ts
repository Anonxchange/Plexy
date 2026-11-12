// Reuse the marketplace's singleton so auth state and PKCE handling stay shared.
export {
  createClient,
  getSupabase,
  isSupabaseConfigured,
} from "../supabase.ts";
