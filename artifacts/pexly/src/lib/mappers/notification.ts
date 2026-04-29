import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import type { Notification, Announcement } from "@/lib/notifications-api";

export function mapNotification(raw: unknown): Notification {
  const r = raw as Record<string, unknown>;
  const validTypes = [
    "trade", "price_alert", "system",
    "payment", "announcement", "account_change",
  ] as const;

  const type = validTypes.includes(r.type as any)
    ? (r.type as Notification["type"])
    : "system";

  const metadata = r.metadata as Record<string, unknown> | undefined;
  const safeMeta = metadata
    ? {
        ...metadata,
        counterpart_avatar: typeof metadata.counterpart_avatar === "string"
          ? sanitizeUrl(metadata.counterpart_avatar)
          : metadata.counterpart_avatar,
        counterpart_name: typeof metadata.counterpart_name === "string"
          ? sanitizeText(metadata.counterpart_name)
          : metadata.counterpart_name,
      }
    : undefined;

  return {
    id: typeof r.id === "string" ? r.id : "",
    user_id: typeof r.user_id === "string" ? r.user_id : "",
    title: sanitizeText(typeof r.title === "string" ? r.title : ""),
    message: sanitizeText(typeof r.message === "string" ? r.message : ""),
    type,
    read: Boolean(r.read),
    created_at: typeof r.created_at === "string" ? r.created_at : "",
    metadata: safeMeta,
  };
}

export function mapAnnouncement(raw: unknown): Announcement {
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.id === "string" ? r.id : "",
    title: sanitizeText(typeof r.title === "string" ? r.title : ""),
    excerpt: sanitizeText(typeof r.excerpt === "string" ? r.excerpt : ""),
    content: sanitizeText(typeof r.content === "string" ? r.content : ""),
    category: sanitizeText(typeof r.category === "string" ? r.category : ""),
    image_url: typeof r.image_url === "string" && r.image_url
      ? sanitizeUrl(r.image_url)
      : null,
    author: sanitizeText(typeof r.author === "string" ? r.author : ""),
    read_time: sanitizeText(typeof r.read_time === "string" ? r.read_time : ""),
    created_at: typeof r.created_at === "string" ? r.created_at : "",
  };
}
