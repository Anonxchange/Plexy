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

// ── Country constants ────────────────────────────────────────────────────────
const FLAG_MAP: Record<string, string> = {
  us: "🇺🇸", gb: "🇬🇧", ng: "🇳🇬", ca: "🇨🇦", au: "🇦🇺", de: "🇩🇪",
  fr: "🇫🇷", ru: "🇷🇺", cn: "🇨🇳", in: "🇮🇳", br: "🇧🇷", mx: "🇲🇽",
  pk: "🇵🇰", bd: "🇧🇩", id: "🇮🇩", tr: "🇹🇷", eg: "🇪🇬", ph: "🇵🇭",
  vn: "🇻🇳", ua: "🇺🇦", pl: "🇵🇱", th: "🇹🇭", ke: "🇰🇪", gh: "🇬🇭",
  za: "🇿🇦", ar: "🇦🇷", co: "🇨🇴", se: "🇸🇪", nl: "🇳🇱", es: "🇪🇸",
  it: "🇮🇹", jp: "🇯🇵", kr: "🇰🇷", sa: "🇸🇦", ae: "🇦🇪", my: "🇲🇾",
  sg: "🇸🇬", ro: "🇷🇴", cz: "🇨🇿", hu: "🇭🇺", pt: "🇵🇹", be: "🇧🇪",
};

export function countryFlag(code: string): string {
  return FLAG_MAP[code?.toLowerCase()] ?? "🌐";
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useVNCountries(server = "2") {
  return useQuery<Record<string, VNCountry>>({
    queryKey: ["vn-countries", server],
    queryFn: async () => {
      const data = await fleexaGet({ action: "countries", server });
      return data.data ?? {};
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

export function useVNApps({
  countryId,
  server = "2",
  page = "1",
  limit = "30",
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
      const params: Record<string, string> = { action: "apps", countryId, server, page, limit };
      if (search) params.search = search;
      const data = await fleexaGet(params);
      return {
        apps: data.data ?? [],
        pagination: data.pagination,
        exchange_rate: data.exchange_rate, // available on sms3
      };
    },
    enabled: !!countryId && enabled,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

export function useBuyVirtualNumber(server = "2") {
  return useMutation<VNPurchase, Error, {
    countryName: string;
    appName: string;
    countryId: string;
    projectId?: string;
  }>({
    mutationFn: async (params) => {
      const data = await fleexaPost("buy", params, server);
      if (!data.success) throw new Error(data.message ?? "Purchase failed");
      return data.data as VNPurchase;
    },
  });
}

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
      return 20_000; // poll every 20s while WAITING
    },
    refetchIntervalInBackground: true,
  });
}

export function useCancelVirtualNumber(server = "2") {
  const qc = useQueryClient();
  return useMutation<void, Error, { requestId: string }>({
    mutationFn: async ({ requestId }) => {
      const data = await fleexaPost("cancel", { requestId }, server);
      if (!data.success) throw new Error(data.message ?? "Cancel failed");
    },
    onSuccess: (_data, { requestId }) => {
      qc.invalidateQueries({ queryKey: ["vn-check", requestId] });
    },
  });
}
