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
  Zap,
  Info,
  Coins,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getAnnouncements,
  getDeposits,
  getWithdrawals,
  subscribeToNotifications,
  type Notification,
  type Announcement,
  type WalletTx,
} from "@/lib/notifications-api";
import { useAuth } from "@/lib/auth-context";
import { sanitizeImageUrl, sanitizeRichText } from "@/lib/sanitize";
import {
  DAILY_TASKS,
  ONE_TIME_TASKS,
  MILESTONE_TASKS,
  type Task,
} from "@/components/rewards/rewards-data";

// ── Reward task helpers ────────────────────────────────────────────────────────

const ALL_REWARD_TASKS = [...DAILY_TASKS, ...ONE_TIME_TASKS, ...MILESTONE_TASKS];

function pickRandomTasks(n: number): Task[] {
  return [...ALL_REWARD_TASKS].sort(() => Math.random() - 0.5).slice(0, n);
}

function RewardTaskItem({ task, onNavigate }: { task: Task; onNavigate: () => void }) {
  return (
    <button
      onClick={onNavigate}
      className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50 border-b border-border last:border-0"
    >
      <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-[#B4F22E]/15">
        {task.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          {task.daily && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/15 px-1.5 py-0.5 rounded-full">
              Daily
            </span>
          )}
          <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1 bg-[#B4F22E]/15 text-[#5a8a00] dark:text-[#B4F22E] px-2.5 py-1 rounded-full">
        <Coins className="h-3 w-3" />
        <span className="text-xs font-bold tabular-nums">+{task.pts}</span>
      </div>
    </button>
  );
}

type TabId = "all" | "system" | "deposits" | "withdrawals" | "security" | "rewards" | "shopping" | "campaign";

const TABS: { id: TabId; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "system",      label: "System" },
  { id: "deposits",    label: "Deposits" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "security",    label: "Security" },
  { id: "rewards",     label: "Rewards" },
  { id: "shopping",    label: "Shopping" },
  { id: "campaign",    label: "Campaign" },
];

function formatAmount(amount: number, symbol: string) {
  const formatted = amount < 0.0001
    ? amount.toExponential(4)
    : amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 8 });
  return `${formatted} ${symbol.toUpperCase()}`;
}

function TxStatusBadge({ status }: { status: WalletTx["status"] }) {
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
      <CheckCircle2 className="h-2.5 w-2.5" /> Completed
    </span>
  );
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-1.5 py-0.5 rounded-full">
      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Pending
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15 px-1.5 py-0.5 rounded-full">
      <XCircle className="h-2.5 w-2.5" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
      {status}
    </span>
  );
}

function WalletTxItem({ tx, onNavigate }: { tx: WalletTx; onNavigate: () => void }) {
  const isDeposit = tx.type === "deposit";
  return (
    <button
      onClick={onNavigate}
      className="w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50 border-b border-border last:border-0"
    >
      <div className={cn(
        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mt-0.5",
        isDeposit ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-orange-100 dark:bg-orange-900/20"
      )}>
        {isDeposit
          ? <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          : <ArrowUpRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground">
            {isDeposit ? "+" : "-"}{formatAmount(tx.amount, tx.crypto_symbol)}
          </p>
          <TxStatusBadge status={tx.status} />
        </div>
        {(tx.from_address || tx.to_address) && (
          <p className="text-xs text-muted-foreground truncate">
            {isDeposit ? "From: " : "To: "}
            {(isDeposit ? tx.from_address : tx.to_address) ?? "Unknown"}
          </p>
        )}
        {tx.tx_hash && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
            Tx: {tx.tx_hash.slice(0, 10)}…{tx.tx_hash.slice(-6)}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">{formatTime(tx.created_at)}</p>
      </div>
    </button>
  );
}

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
    const changeType = notification.metadata?.changeType as string | undefined;
    if (changeType === "login_attempt" || msg.includes("sign-in") || msg.includes("signed in") || msg.includes("login")) return <LogIn className={cn(cls, "text-purple-500")} />;
    if (changeType === "password_changed" || msg.includes("password")) return <Shield className={cn(cls, "text-orange-500")} />;
    if (changeType === "2fa_enabled" || changeType === "2fa_disabled" || msg.includes("2fa") || msg.includes("two-factor")) return <Shield className={cn(cls, "text-blue-500")} />;
    return <Shield className={cn(cls, "text-orange-500")} />;
  }
  if (notification.type === "system") {
    if (msg.includes("login") || msg.includes("sign-in")) return <LogIn className={cn(cls, "text-purple-500")} />;
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
  const type = notification.type;
  const accentColor =
    type === "account_change" ? "bg-orange-500/5 border-orange-500/10" :
    type === "payment"        ? "bg-emerald-500/5 border-emerald-500/10" :
                                "bg-purple-500/5 border-purple-500/10";
  const dotColor =
    type === "account_change" ? "bg-orange-500" :
    type === "payment"        ? "bg-emerald-500" :
                                "bg-primary";
  const iconBg =
    type === "account_change" ? "bg-orange-100 dark:bg-orange-900/20" :
    type === "payment"        ? "bg-emerald-100 dark:bg-emerald-900/20" :
                                "bg-purple-100 dark:bg-purple-900/20";

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
  const [deposits, setDeposits] = useState<WalletTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletTx[]>([]);
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
  // Randomised on every page mount so the Rewards tab always shows fresh tasks
  const [randomRewardTasks] = useState<Task[]>(() => pickRandomTasks(4));

  const loadNotifications = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
  }, []);

  const loadAnnouncements = useCallback(async () => {
    const data = await getAnnouncements();
    setAnnouncements(data);
  }, []);

  const loadDeposits = useCallback(async () => {
    const data = await getDeposits();
    setDeposits(data);
  }, []);

  const loadWithdrawals = useCallback(async () => {
    const data = await getWithdrawals();
    setWithdrawals(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    loadAnnouncements();
    loadDeposits();
    loadWithdrawals();

    const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => unsubscribe();
  }, [user, loadNotifications, loadAnnouncements, loadDeposits, loadWithdrawals]);

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
    all:         unreadAll,
    system:      unreadSystem,
    deposits:    deposits.filter((t) => t.status === "pending").length,
    withdrawals: withdrawals.filter((t) => t.status === "pending").length,
    security:    unreadSecurity,
    rewards:     0,
    shopping:    0,
    campaign:    0,
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
        <>
          {/* Header prompt */}
          <div className="px-4 py-3 bg-[#B4F22E]/5 border-b border-[#B4F22E]/15 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Suggested for you</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Complete these tasks to earn points</p>
            </div>
            <button
              onClick={() => navigate("/rewards")}
              className="flex items-center gap-1 text-[11px] font-bold text-[#5a8a00] dark:text-[#B4F22E] hover:opacity-80 transition-opacity"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Random task list — refreshes on every page mount */}
          {randomRewardTasks.map((task) => (
            <RewardTaskItem
              key={task.id}
              task={task}
              onNavigate={() => navigate("/rewards")}
            />
          ))}

          {/* Footer CTA */}
          <div className="px-4 py-5 flex justify-center">
            <Button
              onClick={() => navigate("/rewards")}
              size="sm"
              className="bg-[#B4F22E] text-black hover:bg-[#9FD624] font-bold gap-1.5"
            >
              <Coins className="h-3.5 w-3.5" />
              See all tasks &amp; earn points
            </Button>
          </div>
        </>
      );
    }

    if (activeTab === "deposits") {
      if (deposits.length === 0) {
        return <EmptyState icon={ArrowDownLeft} title="No deposits yet" subtitle="Your crypto deposits will appear here" />;
      }
      return deposits.map((tx) => (
        <WalletTxItem key={tx.id} tx={tx} onNavigate={() => navigate("/wallet")} />
      ));
    }

    if (activeTab === "withdrawals") {
      if (withdrawals.length === 0) {
        return <EmptyState icon={ArrowUpRight} title="No withdrawals yet" subtitle="Your crypto withdrawals will appear here" />;
      }
      return withdrawals.map((tx) => (
        <WalletTxItem key={tx.id} tx={tx} onNavigate={() => navigate("/wallet")} />
      ));
    }

    if (activeTab === "shopping") {
      return <EmptyState icon={ShoppingBag} title="No shopping activity" subtitle="Your crypto purchases and gift card orders will appear here" />;
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
