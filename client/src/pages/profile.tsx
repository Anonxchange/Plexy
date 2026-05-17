import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useRewardsProfile } from "@/hooks/use-rewards";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PexlyFooter } from "@/components/pexly-footer";
import { getCountryFlag } from "@/lib/localization";
import { ProfileOverviewCards, ProfilePredictionsTab, ProfileShopTab, ProfileActivityTab } from "@/components/profile-overview-cards";
import { GiftCardMarquee } from "@/components/gift-card-marquee";
import { cn } from "@/lib/utils";
import { Upload, User } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { BlockchainCanvas } from "@/components/blockchain-canvas";
import { uploadToR2 } from "@/lib/r2-storage";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import medalTheOg from "@assets/generated_images/IMG_1432.png";
import medalInitiate from "@assets/generated_images/IMG_1430.png";
import medalTop1 from "@assets/generated_images/IMG_1425.png";

// ─── SVG Icons (from demo) ────────────────────────────────────────────────────

function IconVerified({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="vg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#d4fc79" /><stop offset="100%" stopColor="#8ec506" />
        </radialGradient>
      </defs>
      <path d="M12 2l2.4 4.1L19 7.5l-3.5 3.4.8 4.8L12 13.4l-4.3 2.3.8-4.8L5 7.5l4.6-1.4z" fill="url(#vg)" />
      <path d="M9.5 12l2 2 3.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M12 2L4 6v5c0 5 3.5 9.3 8 10.3C16.5 20.3 20 16 20 11V6z" fill="url(#sg)" opacity=".85" />
      <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCamera({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="3" fill="#475569" />
      <path d="M8 7l2-3h4l2 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="4" fill="none" stroke="#e2e8f0" strokeWidth="1.8" />
      <circle cx="12" cy="14" r="2" fill="#cbd5e1" />
      <circle cx="18" cy="10" r="1" fill="#94a3b8" />
    </svg>
  );
}

function IconPencil({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" /><stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" fill="url(#pg)" />
      <path d="M15 5l4 4" stroke="#cbd5e1" strokeWidth="1.2" />
    </svg>
  );
}

function IconCopy({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2.5" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMapPin({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.7 2 6 4.7 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6z" fill="#94a3b8" />
      <circle cx="12" cy="8" r="2.5" fill="#fff" />
    </svg>
  );
}

function IconCalendar({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="17" rx="3" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M3 10h18" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <rect x="7" y="13" width="3" height="3" rx="1" fill="#94a3b8" />
      <rect x="14" y="13" width="3" height="3" rx="1" fill="#94a3b8" />
    </svg>
  );
}

function IconUsers({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="4" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 11a3 3 0 000-6M22 20c0-2.2-1.3-4-3-5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconAward({ size = 14, accent = false }: { size?: number; accent?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="awg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="9" r="7" fill={accent ? "url(#awg)" : "none"} stroke={accent ? "none" : "#f59e0b"} strokeWidth="2" opacity={accent ? 1 : 0.8} />
      <path d="M8.5 15.5L7 22l5-3 5 3-1.5-6.5" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
      {accent && <path d="M9.5 9l2 2 3.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function IconPortfolio({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="portg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b4f22e" /><stop offset="100%" stopColor="#8ec506" />
        </linearGradient>
      </defs>
      <rect x="3" y="14" width="4" height="7" rx="1.5" fill="url(#portg)" opacity=".5" />
      <rect x="10" y="9" width="4" height="12" rx="1.5" fill="url(#portg)" opacity=".75" />
      <rect x="17" y="4" width="4" height="17" rx="1.5" fill="url(#portg)" />
    </svg>
  );
}

function IconWinRate({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="wrg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <polyline points="3,17 8,11 13,14 21,5" stroke="url(#wrg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="16,5 21,5 21,10" stroke="url(#wrg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M3 21h18" stroke="#d1fae5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconRank({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="rkg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" /><stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2 2 9.3l6.9-1z" fill="url(#rkg)" />
      <path d="M12 6l1.8 3.7 4 .6-2.9 2.8.7 4L12 15l-3.6 1.9.7-4L6.2 10l4-.6z" fill="#fef3c7" opacity=".6" />
    </svg>
  );
}

function IconNetwork({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="netg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#a5b4fc" /><stop offset="100%" stopColor="#6366f1" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="3" fill="url(#netg)" />
      <circle cx="4" cy="6" r="2.5" fill="#818cf8" opacity=".7" />
      <circle cx="20" cy="6" r="2.5" fill="#818cf8" opacity=".7" />
      <circle cx="4" cy="18" r="2.5" fill="#818cf8" opacity=".7" />
      <circle cx="20" cy="18" r="2.5" fill="#818cf8" opacity=".7" />
      <line x1="6.5" y1="7" x2="9.5" y2="10" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17.5" y1="7" x2="14.5" y2="10" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6.5" y1="17" x2="9.5" y2="14" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17.5" y1="17" x2="14.5" y2="14" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconWallet({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="wlg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" /><stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="20" height="15" rx="3" fill="url(#wlg)" />
      <path d="M2 10h20" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M2 6l3-4h14l3 4" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="15" y="13" width="5" height="4" rx="2" fill="#e2e8f0" opacity=".7" />
    </svg>
  );
}

function IconClock({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStar({ size = 11, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2 2 9.3l6.9-1z" fill={filled ? "#fbbf24" : "#e2e8f0"} />
    </svg>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm", className)}>{children}</div>;
}

const TABS = ["Overview", "Predictions", "Shop", "Activity"] as const;
type Tab = typeof TABS[number];

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  username: string;
  country: string;
  bio: string | null;
  languages: string[];
  created_at: string;
  positive_feedback: number;
  negative_feedback: number;
  total_trades: number;
  trade_partners: number;
  is_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  avatar_type: string | null;
  avatar_url: string | null;
  pexly_pay_id: string | null;
  last_seen: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getRank(trades: number) {
  if (trades >= 500) return "Diamond";
  if (trades >= 100) return "Gold";
  if (trades >= 50) return "Silver";
  if (trades >= 10) return "Bronze";
  return "Newcomer";
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="relative h-56 bg-gradient-to-br from-[#e8f5d0] via-[#f0fce8] to-[#dff0f8] dark:from-[#1a2410] dark:via-[#111a0d] dark:to-[#0d1a1f]" />
      <div className="max-w-5xl mx-auto px-4 lg:px-6 pb-6">
        <div className="relative -mt-14 mb-6">
          <div className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <Skeleton className="w-24 h-24 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2.5 pt-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-52" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-xl self-start sm:self-auto" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="w-28 h-20 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-4 mb-5 shadow-sm">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex gap-1 p-1 bg-white dark:bg-card border border-slate-100 dark:border-border rounded-xl mb-5 shadow-sm">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="flex-1 h-9 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Profile() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/profile/:userId");
  const { toast } = useToast();
  const supabase = createClient();

  const viewingUserId = params?.userId || user?.id;
  const isOwnProfile = !params?.userId || params?.userId === user?.id;

  // ── Tab / UI state ──
  const [tab, setTab] = useState<Tab>("Overview");
  const [copied, setCopied] = useState(false);

  // ── Data state ──
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ── Edit profile state ──
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", bio: "", languages: [] as string[], avatar_type: "default" as string, avatar_url: null as string | null });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Rewards ──
  const { data: rewardsProfile } = useRewardsProfile();

  const avatarTypes = [
    { id: "default", label: "Default", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=default" },
    { id: "trader", label: "Trader", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=trader" },
    { id: "crypto", label: "Crypto", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=crypto" },
    { id: "robot", label: "Robot", image: "https://api.dicebear.com/7.x/bottts/svg?seed=robot" },
    { id: "ninja", label: "Ninja", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=ninja" },
    { id: "astronaut", label: "Astronaut", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut" },
    { id: "developer", label: "Developer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=developer" },
    { id: "artist", label: "Artist", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=artist" },
  ];

  // ── Auth redirect ──
  useEffect(() => {
    if (!loading && !user && isOwnProfile) { setLocation("/signin"); return; }
    if (viewingUserId) {
      fetchProfileData();
    }
  }, [user, loading, viewingUserId]);

  // ── Data fetchers ──
  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);
      const minDelay = new Promise(res => setTimeout(res, 600));
      const timeout = new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 5000));
      const [{ data, error }] = await Promise.all([
        Promise.race([supabase.from("user_profiles").select("*").eq("id", viewingUserId).single(), timeout]) as any,
        minDelay,
      ]);
      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        const emailVerified = isOwnProfile ? !!user?.email_confirmed_at : (data.email_verified || false);
        const { count: pos } = await supabase.from("trade_feedback").select("*", { count: "exact", head: true }).eq("to_user_id", viewingUserId).eq("rating", "positive");
        const { count: neg } = await supabase.from("trade_feedback").select("*", { count: "exact", head: true }).eq("to_user_id", viewingUserId).eq("rating", "negative");
        setProfileData({ ...data, email_verified: emailVerified, positive_feedback: pos || 0, negative_feedback: neg || 0 });
      } else {
        const country = user?.user_metadata?.country || user?.user_metadata?.Country || "";
        const def: any = { id: user?.id, username: `user_${user?.id?.substring(0, 8)}`, country, preferred_currency: "usd", bio: null, languages: ["English"], positive_feedback: 0, negative_feedback: 0, total_trades: 0, trade_partners: 0, is_verified: false, phone_verified: false, email_verified: false, last_seen: new Date().toISOString() };
        const { data: np, error: ce } = await supabase.from("user_profiles").insert(def).select().single();
        setProfileData((!ce && np) ? np : def);
      }
    } catch {
      const country = user?.user_metadata?.country || user?.user_metadata?.Country || "";
      setProfileData({ id: user?.id || "", username: `user_${user?.id?.substring(0, 8)}`, country, bio: null, languages: ["English"], positive_feedback: 0, negative_feedback: 0, total_trades: 0, trade_partners: 0, is_verified: false, phone_verified: false, email_verified: false, last_seen: new Date().toISOString(), created_at: new Date().toISOString(), avatar_type: "default", avatar_url: null, pexly_pay_id: null });
    } finally { setLoadingProfile(false); }
  };

  // ── Handlers ──
  const handleCopyId = () => {
    const id = profileData?.pexly_pay_id || `PEXLY-${(user?.id || "").substring(0, 8).toUpperCase()}`;
    navigator.clipboard.writeText(id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/profile/${viewingUserId}`;
    if (navigator.share) {
      try { await navigator.share({ title: `@${username}'s Profile`, text: `Check out @${username}'s trading profile on Pexly`, url }); }
      catch (e) { if (e instanceof Error && e.name !== "AbortError") { navigator.clipboard.writeText(url); toast({ title: "Link Copied!", description: "Profile link copied to clipboard" }); } }
    } else { navigator.clipboard.writeText(url); toast({ title: "Link Copied!", description: "Profile link copied to clipboard" }); }
  };

  const handleEditProfile = () => {
    setEditForm({ username: profileData?.username || "", bio: profileData?.bio || "", languages: profileData?.languages || ["English"], avatar_type: profileData?.avatar_type || "default", avatar_url: profileData?.avatar_url || null });
    setEditDialogOpen(true);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const result = await uploadToR2(file, "profile-pictures", user?.id || "");
      if (!result.success) throw new Error(result.error || "Upload failed");
      setEditForm(prev => ({ ...prev, avatar_type: "custom", avatar_url: result.url || null }));
      toast({ title: "Success!", description: "Avatar uploaded successfully" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to upload avatar";
      toast({ title: "Upload Failed", description: msg.includes("Bucket not found") ? "Storage not configured. Please contact support." : msg, variant: "destructive" });
    } finally { setUploadingAvatar(false); }
  };

  const handleSaveProfile = async () => {
    try {
      if (!editForm.username || editForm.username.trim().length < 3) { toast({ title: "Invalid Username", description: "Username must be at least 3 characters long", variant: "destructive" }); return; }
      const { data: existing } = await supabase.from("user_profiles").select("id").eq("username", editForm.username).neq("id", user?.id).single();
      if (existing) { toast({ title: "Username Taken", description: "This username is already in use. Please choose another.", variant: "destructive" }); return; }
      const upd: any = { username: editForm.username.trim(), bio: editForm.bio, avatar_type: editForm.avatar_type, avatar_url: editForm.avatar_url };
      if (editForm.languages?.length) upd.languages = editForm.languages;
      const { error } = await supabase.from("user_profiles").update(upd).eq("id", user?.id);
      if (error) {
        if (error.code === "PGRST204" && error.message.includes("languages")) {
          delete upd.languages;
          const { error: e2 } = await supabase.from("user_profiles").update(upd).eq("id", user?.id);
          if (e2) throw e2;
        } else throw error;
      }
      toast({ title: "Success!", description: "Profile updated successfully" });
      setEditDialogOpen(false);
      fetchProfileData();
    } catch { toast({ title: "Error", description: "Failed to update profile. Please check your database schema.", variant: "destructive" }); }
  };

  // ── Guards ──
  if (loading || loadingProfile) return <ProfilePageSkeleton />;
  if (!user && isOwnProfile) return null;

  // ── Derived values ──
  const username = profileData?.username || "User";
  const totalFeedback = (profileData?.positive_feedback || 0) + (profileData?.negative_feedback || 0);
  const winRate = totalFeedback > 0 ? Math.round(((profileData?.positive_feedback || 0) / totalFeedback) * 100) : 0;
  const rank = getRank(profileData?.total_trades || 0);
  const pts = rewardsProfile?.lifetimeEarned ?? 0;
  const PTS_TIERS = [
    { label: "Newcomer", threshold: 0 },
    { label: "Bronze",   threshold: 1_000 },
    { label: "Silver",   threshold: 5_000 },
    { label: "Gold",     threshold: 15_000 },
    { label: "Diamond",  threshold: 50_000 },
  ];
  const currentTierIdx = PTS_TIERS.findLastIndex(t => pts >= t.threshold);
  const nextTier = PTS_TIERS[currentTierIdx + 1] ?? PTS_TIERS[PTS_TIERS.length - 1];
  const prevTier = PTS_TIERS[currentTierIdx];
  const ptsProgress = nextTier.threshold > prevTier.threshold
    ? Math.min(((pts - prevTier.threshold) / (nextTier.threshold - prevTier.threshold)) * 100, 100)
    : 100;
  const pexlyId = profileData?.pexly_pay_id || `PEXLY-${(user?.id || "").substring(0, 8).toUpperCase()}`;
  const memberSince = profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "recently";
  const kycLevel = profileData?.is_verified ? "Advanced" : profileData?.email_verified ? "Basic" : "None";

  const badges: string[] = [];
  if ((profileData?.total_trades || 0) >= 1) badges.push("Early Adopter");
  if ((profileData?.total_trades || 0) >= 50) badges.push("Trade Pro");

  const avatarSrc = profileData?.avatar_url || avatarTypes.find(a => a.id === profileData?.avatar_type)?.image || avatarTypes[0].image;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background relative overflow-x-hidden">

      {/* ── Canvas header ── */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5d0] via-[#f0fce8] to-[#dff0f8] dark:from-[#1a2410] dark:via-[#111a0d] dark:to-[#0d1a1f]" />
        <BlockchainCanvas dark={false} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50/70 dark:from-background/70 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link href="/" className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium bg-white/85 dark:bg-card/80 border border-slate-200 dark:border-border px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm transition-colors">
            ← Pexly
          </Link>
          <button onClick={handleShareProfile} className="text-xs text-slate-700 dark:text-slate-300 font-medium bg-white/85 dark:bg-card/80 border border-slate-200 dark:border-border px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm hover:bg-white dark:hover:bg-card transition-all">
            Share profile
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pb-6">

        {/* ── Profile Card ── */}
        <div className="relative -mt-14 mb-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">

              {/* Avatar */}
              <div className="relative flex-shrink-0 group/avatar -mt-16">
                <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#4a4a4a]">
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={avatarSrc} alt={username} className="object-cover" />
                    <AvatarFallback className="rounded-none bg-transparent text-white text-2xl font-bold">
                      {username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {profileData?.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-sm">
                    <IconVerified size={14} />
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                  >
                    <IconCamera size={22} />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 mt-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-foreground">{username}</h1>
                  <span className="text-sm text-slate-400 dark:text-muted-foreground font-mono">@{username.toLowerCase()}</span>
                  {profileData?.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 font-medium">
                      <IconShield size={12} /> {kycLevel} KYC
                    </span>
                  )}
                  <span className="text-lg">{getCountryFlag(profileData?.country)}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-muted-foreground leading-relaxed max-w-lg mb-2.5">
                  {profileData?.bio || (isOwnProfile ? "No bio yet — click Edit Profile to add one." : "No bio set.")}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-400 dark:text-muted-foreground">
                  {profileData?.country && <span className="flex items-center gap-1"><IconMapPin size={12} />{profileData.country}</span>}
                  <span className="flex items-center gap-1"><IconCalendar size={12} />Joined {memberSince}</span>
                  <span className="flex items-center gap-1"><IconUsers size={12} />{profileData?.trade_partners || 0} trading partners</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground transition-colors font-mono border border-slate-200 dark:border-border px-2.5 py-1.5 rounded-lg dark:bg-card"
                >
                  <IconCopy size={12} />
                  {copied ? "Copied!" : pexlyId}
                </button>

                {isOwnProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-border flex items-center justify-center text-slate-500 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted transition-all"
                    title="Edit profile"
                  >
                    <IconPencil size={14} />
                  </button>
                )}

                <Button size="sm" className="bg-primary text-black hover:bg-primary/90 font-semibold px-5 text-sm" onClick={isOwnProfile ? handleEditProfile : () => toast({ title: "Send Coin", description: "Send coin feature coming soon" })}>
                  {isOwnProfile ? "Edit Profile" : "Send Coin"}
                </Button>
              </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-100 dark:border-border">
                {badges.map(b => (
                  <span key={b} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-muted text-slate-600 dark:text-muted-foreground border border-slate-200 dark:border-border">
                    <IconAward size={12} /> {b}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Portfolio", value: "Multi-Asset", sub: "BTC · ETH · SOL", subColor: "text-emerald-600", icon: <IconPortfolio size={20} />, bg: "bg-lime-50 dark:bg-lime-950/40" },
            { label: "Win Rate", value: `${winRate}%`, sub: `${profileData?.positive_feedback || 0}W · ${profileData?.negative_feedback || 0}L`, subColor: "text-slate-400 dark:text-muted-foreground", icon: <IconWinRate size={20} />, bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            { label: "Rank", value: rank, sub: `${profileData?.total_trades || 0} trades`, subColor: "text-slate-400 dark:text-muted-foreground", icon: <IconRank size={20} />, bg: "bg-amber-50 dark:bg-amber-950/40" },
            { label: "Network", value: "Multi-Chain", sub: "BTC · ETH · SOL", subColor: "text-slate-400 dark:text-muted-foreground", icon: <IconNetwork size={20} />, bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          ].map(({ label, value, sub, subColor, icon, bg }) => (
            <Card key={label} className="p-4 flex items-center gap-3">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>{icon}</div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 dark:text-muted-foreground mb-0.5">{label}</div>
                <div className="text-base font-bold text-slate-900 dark:text-foreground tabular-nums leading-tight">{value}</div>
                <div className={cn("text-[11px] truncate", subColor)}>{sub}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Gift Card Marquee ── */}
        <div className="mb-4">
          <GiftCardMarquee />
        </div>

        {/* ── XP Progress ── */}
        <Card className="p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-foreground flex items-center gap-1.5">
              <IconAward size={16} accent /> {prevTier.label}
            </span>
            <span className="text-xs text-slate-400 dark:text-muted-foreground tabular-nums">
              {pts.toLocaleString()} / {nextTier.threshold.toLocaleString()} pts
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-lime-400" style={{ width: `${ptsProgress}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-muted-foreground mt-1.5">
            <span>Newcomer</span><span>Diamond</span>
          </div>
        </Card>

        {/* ── Tabs ── */}
        <div className="flex gap-0.5 p-1 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl mb-5 overflow-x-auto scrollbar-hide shadow-sm">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 min-w-[90px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap",
                tab === t ? "bg-primary text-black shadow-sm" : "text-slate-500 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground hover:bg-slate-50 dark:hover:bg-muted"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "Overview" && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <ProfileOverviewCards
              onViewPredictions={() => setTab("Predictions")}
              onViewShop={() => setTab("Shop")}
            />

          </div>
        )}

        {tab === "Predictions" && <ProfilePredictionsTab />}
        {tab === "Shop" && <ProfileShopTab />}
        {tab === "Activity" && <ProfileActivityTab userId={user?.id} />}

      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-20 h-20">
                  {editForm.avatar_url
                    ? <AvatarImage src={editForm.avatar_url} alt="Avatar preview" />
                    : <><AvatarImage src={avatarTypes.find(a => a.id === editForm.avatar_type)?.image || avatarTypes[0].image} alt="Avatar preview" /><AvatarFallback className="bg-primary text-primary-foreground"><User className="h-10 w-10" /></AvatarFallback></>
                  }
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload Image</span>
                    </div>
                    <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </Label>
                  {uploadingAvatar && <p className="text-xs text-slate-400 mt-1">Uploading…</p>}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Or choose an avatar:</Label>
                <div className="grid grid-cols-4 gap-2">
                  {avatarTypes.map(avatar => (
                    <button key={avatar.id} type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, avatar_type: avatar.id, avatar_url: null }))}
                      className={cn("p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors",
                        editForm.avatar_type === avatar.id && !editForm.avatar_url ? "border-primary bg-primary/10" : "border-slate-200 hover:bg-slate-50")}>
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={avatar.image} alt={avatar.label} />
                        <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{avatar.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={editForm.username} onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))} placeholder="Enter username (min 3 characters)" minLength={3} />
              <p className="text-xs text-slate-400">Visible to other users on the platform</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={editForm.bio} onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell us about yourself…" className="min-h-24 resize-none" maxLength={180} />
              <p className="text-xs text-slate-400">Maximum 180 characters ({editForm.bio.length}/180)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="languages">Languages (comma-separated)</Label>
              <Input id="languages" value={editForm.languages.join(", ")} onChange={e => setEditForm(prev => ({ ...prev, languages: e.target.value.split(",").map(l => l.trim()).filter(l => l) }))} placeholder="e.g., English, Spanish, French" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-black hover:bg-primary/90" onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <PexlyFooter />
    </div>
  );
}
