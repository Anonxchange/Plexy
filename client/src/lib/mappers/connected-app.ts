import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";

export interface SafeConnectedApp {
  id: string;
  app_name: string;
  app_icon_url: string | null;
  connected_at: string;
  scope?: string;
  last_used?: string;
  user_id?: string;
}

export function mapConnectedApp(raw: unknown): SafeConnectedApp {
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.id === "string" ? r.id : "",
    app_name: sanitizeText(typeof r.app_name === "string" ? r.app_name : ""),
    app_icon_url: typeof r.app_icon_url === "string" && r.app_icon_url
      ? sanitizeUrl(r.app_icon_url)
      : null,
    connected_at: typeof r.connected_at === "string" ? r.connected_at : "",
    scope: typeof r.scope === "string" ? sanitizeText(r.scope) : undefined,
    last_used: typeof r.last_used === "string" ? r.last_used : undefined,
    user_id: typeof r.user_id === "string" ? r.user_id : undefined,
  };
}
