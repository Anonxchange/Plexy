import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const EDGE = `${SUPABASE_URL}/functions/v1/fleexa`;

async function authHeaders() {
  try {
    const sb = await getSupabase();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function fleexaGet(params: Record<string, string>) {
  const q = new URLSearchParams(params);
  const headers = await authHeaders();
  const res = await fetch(`${EDGE}?${q}`, { headers: headers as HeadersInit });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Request failed");
  return data;
}

async function fleexaPost(action: string, body: Record<string, unknown>, server = "2") {
  const headers = await authHeaders();
  const res = await fetch(`${EDGE}?action=${action}&server=${server}`, {
    method: "POST",
    headers: { ...(headers as Record<string, string>), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Request failed");
  return data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VNCountry {
  id: number;
  title: string;
  code: string;
  prefix?: string;
}

export interface VNApp {
  /** Normalized: SMS 1 returns "qty", SMS 2/3 return "quantity" — always read this field */
  id: string;
  name: string;
  quantity: number;
  price_ngn: string;
  api_discount_percent?: number;
  exchange_rate?: number;
}

export interface VNPurchase {
  requestId: string;
  number: string;
  service: string;
  country: string;
  amount_paid: number;
  status: string;
}

export interface SMSCheckResult {
  code: "WAITING" | "RECEIVED" | "CANCELED" | "EXPIRED";
  sms?: string;
  message?: string;
}

// ── Normalization ─────────────────────────────────────────────────────────────
// SMS 1 uses "qty", SMS 2 and 3 use "quantity". Always normalize to "quantity".
function normalizeApp(raw: any): VNApp {
  return {
    id: String(raw.id),
    name: raw.name ?? "",
    quantity: raw.quantity ?? raw.qty ?? 0,
    price_ngn: raw.price_ngn ?? "0",
    api_discount_percent: raw.api_discount_percent,
    exchange_rate: raw.exchange_rate,
  };
}

// ── Country flags ─────────────────────────────────────────────────────────────
const FLAG_MAP: Record<string, string> = {
  us: "🇺🇸", gb: "🇬🇧", ng: "🇳🇬", ca: "🇨🇦", au: "🇦🇺", de: "🇩🇪",
  fr: "🇫🇷", ru: "🇷🇺", cn: "🇨🇳", in: "🇮🇳", br: "🇧🇷", mx: "🇲🇽",
  pk: "🇵🇰", bd: "🇧🇩", id: "🇮🇩", tr: "🇹🇷", eg: "🇪🇬", ph: "🇵🇭",
  vn: "🇻🇳", ua: "🇺🇦", pl: "🇵🇱", th: "🇹🇭", ke: "🇰🇪", gh: "🇬🇭",
  za: "🇿🇦", ar: "🇦🇷", co: "🇨🇴", se: "🇸🇪", nl: "🇳🇱", es: "🇪🇸",
  it: "🇮🇹", jp: "🇯🇵", kr: "🇰🇷", sa: "🇸🇦", ae: "🇦🇪", my: "🇲🇾",
  sg: "🇸🇬", ro: "🇷🇴", cz: "🇨🇿", hu: "🇭🇺", pt: "🇵🇹", be: "🇧🇪",
  at: "🇦🇹", ch: "🇨🇭", dk: "🇩🇰", fi: "🇫🇮", gr: "🇬🇷", il: "🇮🇱",
  nz: "🇳🇿", no: "🇳🇴", sk: "🇸🇰", et: "🇪🇹", tz: "🇹🇿", ug: "🇺🇬",
};

export function countryFlag(code: string): string {
  return FLAG_MAP[code?.toLowerCase()] ?? "🌐";
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

/**
 * Get the full list of countries for the selected server.
 * Edge function: action=countries&server=X → GET /{seg}/countries
 */
export function useVNCountries(server = "2") {
  return useQuery<Record<string, VNCountry>>({
    queryKey: ["vn-countries", server],
    queryFn: async () => {
      const data = await fleexaGet({ action: "countries", server });
      return data.data ?? {};
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get apps (services) for a specific country.
 * Edge function: action=apps&server=X&countryId=Y → GET /{seg}/apps?countryId=Y
 *
 * countryId is REQUIRED by all 3 servers. Never call without it.
 */
export function useVNApps({
  countryId,
  server = "2",
  page = "1",
  limit = "50",
  search = "",
  enabled = true,
}: {
  countryId: string;
  server?: string;
  page?: string;
  limit?: string;
  search?: string;
  enabled?: boolean;
}) {
  return useQuery<{ apps: VNApp[]; pagination: any; exchange_rate?: number }>({
    queryKey: ["vn-apps", countryId, server, page, limit, search],
    queryFn: async () => {
      const params: Record<string, string> = {
        action: "apps",
        server,
        countryId,
        page,
        limit,
      };
      if (search) params.search = search;
      const data = await fleexaGet(params);
      return {
        apps: (data.data ?? []).map(normalizeApp),
        pagination: data.pagination,
        exchange_rate: data.exchange_rate,
      };
    },
    enabled: !!countryId && enabled,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get ALL apps across all countries — used by AllAppsView (pick service first,
 * country second). The edge function omits countryId when not supplied, so the
 * Fleexa API returns the full platform-wide service list.
 */
export function useVNAllApps({
  server = "2",
  page = "1",
  limit = "50",
  search = "",
}: {
  server?: string;
  page?: string;
  limit?: string;
  search?: string;
} = {}) {
  return useQuery<{ apps: VNApp[]; pagination: any }>({
    queryKey: ["vn-all-apps", server, page, limit, search],
    queryFn: async () => {
      const params: Record<string, string> = { action: "apps", server, page, limit };
      if (search) params.search = search;
      const data = await fleexaGet(params);
      return {
        apps: (data.data ?? []).map(normalizeApp),
        pagination: data.pagination,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Find a specific service within a country — used by CountryRow to show
 * per-country price and quantity for the selected service.
 *
 * Uses `search` to let the API filter before client-side name matching.
 */
export function useVNServiceInCountry({
  countryId,
  server = "2",
  serviceName,
  enabled = true,
}: {
  countryId: string | number;
  server?: string;
  serviceName: string;
  enabled?: boolean;
}) {
  return useQuery<VNApp | null>({
    queryKey: ["vn-service-in-country", countryId, server, serviceName],
    queryFn: async () => {
      const params: Record<string, string> = {
        action: "apps",
        server,
        countryId: String(countryId),
        search: serviceName,
        limit: "20",
      };
      const data = await fleexaGet(params);
      const apps: VNApp[] = (data.data ?? []).map(normalizeApp);
      return (
        apps.find((a) => a.name.toLowerCase() === serviceName.toLowerCase()) ?? null
      );
    },
    enabled: !!countryId && !!serviceName && enabled,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Purchase a virtual number.
 *
 * Server differences:
 *   SMS 1 → POST /sms/buy   { countryName, appName, countryId, projectId }
 *   SMS 2 → POST /sms2/buy  { countryName, appName, countryId, projectId }
 *   SMS 3 → POST /sms3/buy  { countryName, appName, countryId, operator?, maxPrice? }
 *                              (no projectId — SMS 3 uses app.id as string like "tg" internally)
 */
export function useBuyVirtualNumber(server = "2") {
  return useMutation<
    VNPurchase,
    Error,
    {
      countryName: string;
      appName: string;
      countryId: string;
      projectId?: string;
      operator?: string;
      maxPrice?: number;
    }
  >({
    mutationFn: async (params) => {
      const body: Record<string, unknown> = {
        countryName: params.countryName,
        appName: params.appName,
        countryId: params.countryId,
      };

      if (server === "3") {
        // SMS 3: no projectId; optional operator + maxPrice
        if (params.operator) body.operator = params.operator;
        if (params.maxPrice !== undefined) body.maxPrice = params.maxPrice;
      } else {
        // SMS 1 & 2: projectId required (numeric for SMS 1, string id for SMS 2)
        if (params.projectId !== undefined) body.projectId = params.projectId;
      }

      const data = await fleexaPost("buy", body, server);
      if (!data.success) throw new Error(data.message ?? data.error ?? "Purchase failed");
      return data.data as VNPurchase;
    },
  });
}

/**
 * Poll SMS check status.
 * Edge function: action=check&requestId=X&server=Y → GET /{seg}/check/:requestId
 *
 * All 3 servers return: { code: "WAITING"|"RECEIVED"|"CANCELED"|"EXPIRED", sms?, message? }
 * Polls every 20 s while WAITING; stops on terminal codes.
 */
export function useCheckSMS({
  requestId,
  server = "2",
  enabled = false,
}: {
  requestId: string;
  server?: string;
  enabled?: boolean;
}) {
  return useQuery<SMSCheckResult>({
    queryKey: ["vn-check", requestId, server],
    queryFn: async () => {
      const data = await fleexaGet({ action: "check", requestId, server });
      if (!data.success) throw new Error(data.message ?? "Check failed");
      return data.data as SMSCheckResult;
    },
    enabled: !!requestId && enabled,
    refetchInterval: (query) => {
      const code = query.state.data?.code;
      if (code === "RECEIVED" || code === "CANCELED" || code === "EXPIRED") return false;
      return 20_000; // poll every 20 s while WAITING
    },
    refetchIntervalInBackground: true,
  });
}

/**
 * Cancel an activation.
 * Edge function: action=cancel&server=X body: { requestId }
 *
 * Cancel windows:
 *   SMS 1 → 30 seconds
 *   SMS 2 → 18 minutes
 *   SMS 3 → 2 minutes
 *
 * SMS 2/3 return { success: true, message: "..." } (no data.data).
 * SMS 1 returns { success: true, data: { success: true } }.
 * We only check data.success — not data.data.
 */
export function useCancelVirtualNumber(server = "2") {
  const qc = useQueryClient();
  return useMutation<void, Error, { requestId: string }>({
    mutationFn: async ({ requestId }) => {
      const data = await fleexaPost("cancel", { requestId }, server);
      if (data.success === false)
        throw new Error(data.message ?? data.error ?? "Cancel failed");
    },
    onSuccess: (_data, { requestId }) => {
      qc.invalidateQueries({ queryKey: ["vn-check", requestId] });
    },
  });
}
