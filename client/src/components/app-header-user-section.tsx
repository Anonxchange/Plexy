import { useState, useEffect, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, EyeOff, LayoutDashboard, User, Settings, Lightbulb, LogOut,
  Bell, CheckCircle2, XCircle, Menu,
} from "lucide-react";
import { SecurityShieldIcon } from "@/components/ui/security-shield";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { useWalletData } from "@/hooks/use-wallet-data";
import {
  getNotifications,
  subscribeToNotifications,
  type Notification,
} from "@/lib/notifications-api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onOpenSidebar: () => void;
}

const avatarTypes = [
  { id: "default",    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=default" },
  { id: "trader",     image: "https://api.dicebear.com/7.x/avataaars/svg?seed=trader" },
  { id: "crypto",     image: "https://api.dicebear.com/7.x/avataaars/svg?seed=crypto" },
  { id: "robot",      image: "https://api.dicebear.com/7.x/bottts/svg?seed=robot" },
  { id: "ninja",      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=ninja" },
  { id: "astronaut",  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut" },
  { id: "developer",  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=developer" },
  { id: "artist",     image: "https://api.dicebear.com/7.x/avataaars/svg?seed=artist" },
];

interface NotificationIconProps {
  count?: number;
  onClick?: () => void;
}

function NotificationIcon({ count = 0, onClick }: NotificationIconProps) {
  const displayCount = count > 99 ? "99+" : count;
  const showBadge = count > 0;
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10 bg-card rounded-xl shadow-notification hover:shadow-notification-hover transition-all duration-200 hover:scale-105 active:scale-95"
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
    >
      <Bell className="w-5 h-5 text-foreground" strokeWidth={2} />
      {showBadge && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-badge-pop">
          {displayCount}
        </span>
      )}
    </button>
  );
}

export const AppHeaderUserSection = memo(function AppHeaderUserSection({ onOpenSidebar }: Props) {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // true while the Supabase avatar fetch is in-flight; prevents initials flash
  const [isAvatarFetching, setIsAvatarFetching] = useState(true);
  // tracks whether the <img> itself has finished loading after we have the URL
  const [imageLoadStatus, setImageLoadStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  const { data: walletData, isLoading: walletsLoading } = useWalletData();
  const balance = walletData?.totalBalance || 0;
  const preferredCurrency = walletData?.preferredCurrency || "USD";
  const isConverting = walletData?.isConverting || false;

  const setPreferredCurrency = (currency: string) => {
    if (user?.id) {
      localStorage.setItem(`pexly_currency_${user.id}`, currency);
    }
  };

  useEffect(() => {
    if (!user) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== `pexly_currency_${user.id}` || !e.newValue) return;
      const upper = e.newValue.toUpperCase();
      if (upper !== preferredCurrency) setPreferredCurrency(upper);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user, preferredCurrency]);

  useEffect(() => {
    if (!user) return;

    // Silently ignore errors — notifications are non-critical
    getNotifications().then(setNotifications).catch(() => {});

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToNotifications(user.id, (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        toast({ title: notification.title, description: notification.message });
      });
    } catch {
      // Supabase client not ready yet — realtime notifications gracefully skipped
    }

    return () => unsubscribe?.();
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    // Reset avatar state for this user session so we always show skeleton first
    setIsAvatarFetching(true);
    setImageLoadStatus("idle");
    setProfileAvatar(null);
    fetchProfileAvatar();
    (async () => {
      const supabase = await getSupabase();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("username, preferred_currency")
        .eq("id", user.id)
        .single();
      if (profile?.username) setUserName(profile.username);
      if (profile?.preferred_currency)
        setPreferredCurrency(profile.preferred_currency.toUpperCase());
    })();
  }, [user?.id]);

  const fetchProfileAvatar = async () => {
    // Hard cap of 5 s so the skeleton never gets permanently stuck if the
    // network request stalls (wrong URL, flaky connection, cold Supabase, etc.)
    const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
      Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

    try {
      const supabase = await withTimeout(getSupabase(), 5000);
      const { data, error } = await withTimeout(
        supabase
          .from("user_profiles")
          .select("avatar_url, avatar_type")
          .eq("id", user?.id)
          .single(),
        4000
      );
      if (error && error.code !== "PGRST116") return;
      if (data?.avatar_url) {
        setProfileAvatar(data.avatar_url);
      } else if (data?.avatar_type) {
        const found = avatarTypes.find((a) => a.id === data.avatar_type);
        if (found) setProfileAvatar(found.image);
      }
    } catch {
      // silent — avatar is cosmetic, fall through to show initials
    } finally {
      // Always clear the fetch-spinner regardless of success, failure, or timeout
      setIsAvatarFetching(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const securityInfo = useMemo(() => {
    if (!user) return { level: "low" as const, score: 0, label: "At Risk", color: "red" };
    const has2FA = !!user.user_metadata?.two_factor_enabled;
    const hasPhone = !!user.phone;
    const hasEmailVerified = !!user.email_confirmed_at;
    const score = [has2FA, hasPhone, hasEmailVerified].filter(Boolean).length;
    if (score === 3)
      return { level: "high" as const, score, label: "Strong", color: "green", checks: { has2FA, hasPhone, hasEmailVerified } };
    if (score === 2)
      return { level: "medium" as const, score, label: "Fair", color: "yellow", checks: { has2FA, hasPhone, hasEmailVerified } };
    return { level: "low" as const, score, label: "At Risk", color: "red", checks: { has2FA, hasPhone, hasEmailVerified } };
  }, [user]);

  if (user) {
    return (
      <>
        <div className="text-center relative max-w-[120px] sm:max-w-[150px] hidden sm:block">
          <div className="text-sm font-semibold text-foreground truncate">
            {userName || user.email?.split("@")[0] || "User"}
          </div>
          <div className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
            <span className="truncate">
              {walletsLoading || isConverting ? (
                <Skeleton className="h-3 w-16" />
              ) : balanceVisible ? (
                `${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${preferredCurrency}`
              ) : (
                "****"
              )}
            </span>
            <button
              className="inline-flex items-center justify-center h-4 w-4 hover:opacity-70 transition-opacity flex-shrink-0"
              onClick={() => setBalanceVisible(!balanceVisible)}
              aria-label={balanceVisible ? "Hide balance" : "Show balance"}
            >
              {balanceVisible ? (
                <Eye className="h-3 w-3 text-muted-foreground" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {isAvatarFetching || (profileAvatar !== null && imageLoadStatus === "loading") ? (
          /* Skeleton replaces the avatar button during both loading phases:
             Phase 1 — Supabase fetch in-flight (isAvatarFetching)
             Phase 2 — URL received, browser downloading the image (imageLoadStatus === "loading")
             Once both are done the real dropdown trigger appears in the same spot. */
          <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
        ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              data-testid="button-profile"
            >
              <Avatar
                className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-offset-2 ring-offset-background transition-all duration-200"
                style={{
                  ringColor: securityInfo.color === "green" ? "#22c55e" : securityInfo.color === "yellow" ? "#eab308" : "#ef4444",
                  boxShadow: `0 0 0 2px ${securityInfo.color === "green" ? "#22c55e" : securityInfo.color === "yellow" ? "#eab308" : "#ef4444"}`,
                }}
              >
                <AvatarImage
                  src={profileAvatar || user.user_metadata?.avatar_url}
                  alt="User avatar"
                  onLoadingStatusChange={setImageLoadStatus}
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {user.user_metadata?.full_name?.substring(0, 2)?.toUpperCase() ??
                    user.email?.substring(0, 2)?.toUpperCase() ??
                    "JD"}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                style={{
                  backgroundColor:
                    securityInfo.color === "green" ? "#22c55e" : securityInfo.color === "yellow" ? "#eab308" : "#ef4444",
                }}
              />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[300px] p-0 overflow-hidden" sideOffset={10}>
            <div className="relative bg-gradient-to-br from-muted/80 to-muted/30 px-4 pt-4 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar
                    className="h-12 w-12"
                    style={{
                      boxShadow: `0 0 0 2px ${securityInfo.color === "green" ? "#22c55e" : securityInfo.color === "yellow" ? "#eab308" : "#ef4444"}, 0 0 12px ${securityInfo.color === "green" ? "#22c55e40" : securityInfo.color === "yellow" ? "#eab30840" : "#ef444440"}`,
                    }}
                  >
                    <AvatarImage src={profileAvatar || user.user_metadata?.avatar_url} alt="User avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">
                      {user.user_metadata?.full_name?.substring(0, 2)?.toUpperCase() ??
                        user.email?.substring(0, 2)?.toUpperCase() ??
                        "JD"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {userName || user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          securityInfo.color === "green" ? "#22c55e20" : securityInfo.color === "yellow" ? "#eab30820" : "#ef444420",
                        color:
                          securityInfo.color === "green" ? "#16a34a" : securityInfo.color === "yellow" ? "#ca8a04" : "#dc2626",
                      }}
                    >
                      <SecurityShieldIcon level={securityInfo.level} size={11} />
                      {securityInfo.level === "high"
                        ? t("security.strong")
                        : securityInfo.level === "medium"
                        ? t("security.fair")
                        : t("security.at_risk")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground">{t("nav.dashboard")}</span>
                  <span className="text-[10px] text-muted-foreground">{t("user_menu.overview_activity")}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <User className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground">{t("user_menu.profile")}</span>
                  <span className="text-[10px] text-muted-foreground">{t("user_menu.public_profile")}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate("/account-settings")} className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground">{t("user_menu.account_settings")}</span>
                  <span className="text-[10px] text-muted-foreground">{t("user_menu.preferences_security")}</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate("/submit-idea")} className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Lightbulb className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground">{t("user_menu.submit_idea")}</span>
                  <span className="text-[10px] text-muted-foreground">{t("user_menu.share_feedback")}</span>
                </div>
              </DropdownMenuItem>
            </div>

            <div className="mx-1.5 mb-1.5 rounded-xl border border-border overflow-hidden">
              <div
                className="px-3 pt-3 pb-2.5"
                style={{
                  background:
                    securityInfo.color === "green"
                      ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                      : securityInfo.color === "yellow"
                      ? "linear-gradient(135deg, #fefce8, #fef9c3)"
                      : "linear-gradient(135deg, #fff1f2, #ffe4e6)",
                }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-widest">
                    {t("security.account_security")}
                  </span>
                  <span
                    className="text-[11px] font-bold tracking-wide"
                    style={{
                      color:
                        securityInfo.color === "green" ? "#16a34a" : securityInfo.color === "yellow" ? "#ca8a04" : "#dc2626",
                    }}
                  >
                    {securityInfo.level === "high"
                      ? t("security.strong")
                      : securityInfo.level === "medium"
                      ? t("security.fair")
                      : t("security.at_risk")}
                  </span>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-shrink-0 drop-shadow-sm">
                    <SecurityShieldIcon level={securityInfo.level} size={46} />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-end gap-[2px] h-7">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const filled =
                          securityInfo.color === "green"
                            ? true
                            : securityInfo.color === "yellow"
                            ? i < 13
                            : i < 6;
                        const barColor = filled
                          ? securityInfo.color === "green"
                            ? "#22c55e"
                            : securityInfo.color === "yellow"
                            ? "#eab308"
                            : "#ef4444"
                          : "rgba(0,0,0,0.09)";
                        const heights = [55, 70, 62, 80, 58, 75, 68, 85, 60, 72, 64, 78, 56, 74, 66, 82, 59, 71, 65, 79];
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-[2px] transition-all duration-500"
                            style={{ height: `${heights[i % heights.length]}%`, backgroundColor: barColor, minHeight: "4px" }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-[3px]">
                      {[
                        { label: t("security.email_verified"), ok: !!user.email_confirmed_at },
                        { label: t("security.phone_linked"),   ok: !!user.phone },
                        { label: t("security.two_fa_enabled"), ok: !!user.user_metadata?.two_factor_enabled },
                      ].map(({ label, ok }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-[10px] text-foreground/65 leading-none">{label}</span>
                          {ok ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {securityInfo.level !== "high" && (
                  <button
                    onClick={() => navigate("/account-settings")}
                    className="mt-2.5 w-full text-[10px] font-semibold py-1.5 rounded-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98] text-white"
                    style={{ backgroundColor: securityInfo.color === "yellow" ? "#ca8a04" : "#dc2626" }}
                  >
                    {t("security.improve_security")}
                  </button>
                )}
              </div>
            </div>

            <div className="p-1.5 pt-0">
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                <div className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                </div>
                <span className="text-sm font-medium">{t("auth.sign_out")}</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        <NotificationIcon count={unreadCount} onClick={() => navigate("/notifications")} />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenSidebar}
        data-testid="button-sidebar-toggle"
        aria-label="Open navigation menu"
        className="border-border lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => navigate("/signin")} className="hidden sm:inline-flex">
        {t("auth.sign_in")}
      </Button>
      <Button size="sm" onClick={() => navigate("/signup")} className="hidden sm:inline-flex">
        {t("auth.get_started")}
      </Button>
    </>
  );
});
