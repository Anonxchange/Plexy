import { useHead } from "@unhead/react";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Settings as SettingsIcon,
  ArrowLeft,
  Shield,
  LogIn,
  Megaphone,
  Clock,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Gift,
  Zap,
  Info,
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getAnnouncements,
  subscribeToNotifications,
  type Notification,
  type Announcement,
} from "@/lib/notifications-api";
import { useAuth } from "@/lib/auth-context";
import { sanitizeImageUrl, sanitizeRichText } from "@/lib/sanitize";

type TabId = "all" | "system" | "security" | "rewards" | "campaign";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "system", label: "System" },
  { id: "security", label: "Security" },
  { id: "rewards", label: "Rewards" },
  { id: "campaign", label: "Campaign" },
];

function sanitizeAnnouncementContent(content?: string, fallback?: string): string {
  const htmlContent = content?.replace(/\n/g, "<br />") || fallback || "";
  return sanitizeRichText(htmlContent, ["p", "br", "strong", "em", "a", "ul", "ol", "li", "code"]);
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function getNotificationIcon(notification: Notification) {
  const msg = notification.message.toLowerCase();
  const cls = "h-5 w-5";

  if (notification.type === "account_change") {
    if (msg.includes("login") || msg.includes("ip")) return <LogIn className={cn(cls, "text-purple-500")} />;
    if (msg.includes("password")) return <Shield className={cn(cls, "text-orange-500")} />;
    if (msg.includes("2fa") || msg.includes("two-factor")) return <Shield className={cn(cls, "text-blue-500")} />;
    return <Shield className={cn(cls, "text-orange-500")} />;
  }
  if (notification.type === "system") {
    if (msg.includes("login")) return <LogIn className={cn(cls, "text-purple-500")} />;
    if (msg.includes("verified") || msg.includes("approved")) return <Shield className={cn(cls, "text-green-500")} />;
    if (msg.includes("rejected") || msg.includes("failed")) return <AlertTriangle className={cn(cls, "text-red-500")} />;
    return <Info className={cn(cls, "text-blue-500")} />;
  }
  if (notification.type === "payment") return <CreditCard className={cn(cls, "text-emerald-500")} />;
  if (notification.type === "price_alert") return <TrendingUp className={cn(cls, "text-cyan-500")} />;
  return <Bell className={cn(cls, "text-muted-foreground")} />;
}

function getAnnouncementIcon(announcement: Announcement) {
  if (announcement.image_url) {
    return (
      <img
        src={sanitizeImageUrl(announcement.image_url)}
        alt={announcement.title}
        className="h-full w-full object-cover rounded-xl"
      />
    );
  }
  return <Megaphone className="h-5 w-5 text-[#B4F22E]" />;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (n: Notification) => void;
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const isAccountChange = notification.type === "account_change";
  const accentColor = isAccountChange ? "bg-orange-500/5 border-orange-500/10" : "bg-purple-500/5 border-purple-500/10";
  const dotColor = isAccountChange ? "bg-orange-500" : "bg-primary";
  const iconBg = isAccountChange
    ? "bg-orange-100 dark:bg-orange-900/20"
    : "bg-purple-100 dark:bg-purple-900/20";

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50 border-b border-border last:border-0",
        !notification.read && accentColor
      )}
    >
      <div className={cn("flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mt-0.5", iconBg)}>
        {getNotificationIcon(notification)}
      </div>
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="text-sm font-medium text-foreground leading-snug mb-0.5">{notification.title}</p>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground/70 mt-1.5">{formatTime(notification.created_at)}</p>
      </div>
      {!notification.read && (
        <span className={cn("flex-shrink-0 h-2 w-2 rounded-full mt-2", dotColor)} />
      )}
    </button>
  );
}

interface AnnouncementItemProps {
  announcement: Announcement;
  isRead: boolean;
  onClick: (a: Announcement) => void;
}

function AnnouncementItem({ announcement, isRead, onClick }: AnnouncementItemProps) {
  return (
    <button
      onClick={() => onClick(announcement)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50 border-b border-border last:border-0",
        !isRead && "bg-[#B4F22E]/5 border-[#B4F22E]/10"
      )}
    >
      <div className="flex-shrink-0 h-10 w-10 rounded-xl overflow-hidden bg-[#B4F22E]/15 flex items-center justify-center mt-0.5">
        {getAnnouncementIcon(announcement)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#B4F22E] bg-[#B4F22E]/15 px-1.5 py-0.5 rounded">
            Announcement
          </span>
        </div>
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{announcement.title}</p>
        {announcement.excerpt && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{announcement.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground/70">
          <span>{formatTime(announcement.created_at)}</span>
          {announcement.read_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {announcement.read_time}
            </span>
          )}
        </div>
      </div>
      {!isRead && <span className="flex-shrink-0 h-2 w-2 rounded-full bg-[#B4F22E] mt-2" />}
    </button>
  );
}

function EmptyState({ icon: Icon, title, subtitle, action }: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground max-w-[220px]">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default function NotificationsPage() {
  useHead({
    title: "Notifications | Pexly",
    meta: [{ name: "description", content: "Stay up to date with account alerts, platform updates, and security notifications." }],
  });

  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("readAnnouncementIds");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const loadNotifications = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
  }, []);

  const loadAnnouncements = useCallback(async () => {
    const data = await getAnnouncements();
    setAnnouncements(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    loadAnnouncements();

    const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => unsubscribe();
  }, [user, loadNotifications, loadAnnouncements]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
    if (notification.metadata?.url) {
      const dest = String(notification.metadata.url).trim();
      if (dest.startsWith("/")) navigate(dest);
    }
  };

  const markAnnouncementRead = (id: string) => {
    const updated = new Set(readAnnouncementIds);
    updated.add(id);
    setReadAnnouncementIds(updated);
    try {
      localStorage.setItem("readAnnouncementIds", JSON.stringify(Array.from(updated)));
    } catch {}
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    markAnnouncementRead(announcement.id);
    navigate(`/blog/${announcement.id}`);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const allAnnouncementIds = new Set(announcements.map((a) => a.id));
    setReadAnnouncementIds(allAnnouncementIds);
    try {
      localStorage.setItem("readAnnouncementIds", JSON.stringify(Array.from(allAnnouncementIds)));
    } catch {}
  };

  // Categorise — no P2P types (trade / offer)
  const systemNotifications = notifications.filter((n) => n.type === "system");
  const securityNotifications = notifications.filter((n) => n.type === "account_change");
  const generalNotifications = notifications.filter(
    (n) => n.type !== "system" && n.type !== "account_change"
  );

  const unreadAnnouncements = announcements.filter((a) => !readAnnouncementIds.has(a.id)).length;
  const unreadSystem = systemNotifications.filter((n) => !n.read).length + unreadAnnouncements;
  const unreadSecurity = securityNotifications.filter((n) => !n.read).length;
  const unreadAll = notifications.filter((n) => !n.read).length + unreadAnnouncements;

  const badgeCounts: Record<TabId, number> = {
    all: unreadAll,
    system: unreadSystem,
    security: unreadSecurity,
    rewards: 0,
    campaign: 0,
  };

  function renderItems() {
    const applyUnreadFilter = <T extends { read?: boolean }>(items: T[]) =>
      unreadOnly ? items.filter((i) => !i.read) : items;

    if (activeTab === "all") {
      const filteredNotifs = applyUnreadFilter(notifications);
      const filteredAnnouncements = unreadOnly
        ? announcements.filter((a) => !readAnnouncementIds.has(a.id))
        : announcements;

      if (filteredNotifs.length === 0 && filteredAnnouncements.length === 0) {
        return <EmptyState icon={Bell} title={unreadOnly ? "No unread notifications" : "You're all caught up"} subtitle="New alerts will appear here" />;
      }

      const combined: { type: "notif" | "announcement"; item: Notification | Announcement }[] = [
        ...filteredAnnouncements.map((a) => ({ type: "announcement" as const, item: a })),
        ...filteredNotifs.map((n) => ({ type: "notif" as const, item: n })),
      ].sort((a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime());

      return combined.map((entry) =>
        entry.type === "announcement" ? (
          <AnnouncementItem
            key={`ann-${entry.item.id}`}
            announcement={entry.item as Announcement}
            isRead={readAnnouncementIds.has(entry.item.id)}
            onClick={handleAnnouncementClick}
          />
        ) : (
          <NotificationItem
            key={`notif-${entry.item.id}`}
            notification={entry.item as Notification}
            onClick={handleNotificationClick}
          />
        )
      );
    }

    if (activeTab === "system") {
      const filteredAnnouncements = unreadOnly
        ? announcements.filter((a) => !readAnnouncementIds.has(a.id))
        : announcements;
      const filteredSystem = applyUnreadFilter(systemNotifications);

      if (filteredAnnouncements.length === 0 && filteredSystem.length === 0) {
        return <EmptyState icon={Info} title="No system notifications" subtitle="Platform updates and announcements appear here" />;
      }

      return (
        <>
          {filteredAnnouncements.map((a) => (
            <AnnouncementItem
              key={`ann-${a.id}`}
              announcement={a}
              isRead={readAnnouncementIds.has(a.id)}
              onClick={handleAnnouncementClick}
            />
          ))}
          {filteredSystem.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
          ))}
        </>
      );
    }

    if (activeTab === "security") {
      const filtered = applyUnreadFilter(securityNotifications);
      if (filtered.length === 0) {
        return <EmptyState icon={Shield} title="No security alerts" subtitle="Login events and account changes appear here" />;
      }
      return filtered.map((n) => (
        <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
      ));
    }

    if (activeTab === "rewards") {
      return (
        <EmptyState
          icon={Gift}
          title="No rewards notifications"
          subtitle="Complete tasks and earn rewards to see updates here"
          action={
            <Button onClick={() => navigate("/rewards")} size="sm" className="bg-[#B4F22E] text-black hover:bg-[#9FD624]">
              Explore Rewards
            </Button>
          }
        />
      );
    }

    if (activeTab === "campaign") {
      return <EmptyState icon={Zap} title="No campaign notifications" subtitle="Active promotions and campaigns will show here" />;
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="h-9 w-9 -ml-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Notifications</h1>
              {unreadAll > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                  {unreadAll > 99 ? "99+" : unreadAll}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                title="Mark all as read"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate("/account-settings?section=notifications")}
              >
                <SettingsIcon className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-3 px-4 pb-3">
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
                unreadOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", unreadOnly ? "bg-primary-foreground" : "bg-muted-foreground")} />
              Unread only
            </button>
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max border-b border-border">
              {TABS.map((tab) => {
                const count = badgeCounts[tab.id];
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={cn(
                        "inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 text-[10px] font-bold rounded-full",
                        isActive
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="divide-y-0">
          {renderItems()}
        </div>
      </div>
    </div>
  );
}
