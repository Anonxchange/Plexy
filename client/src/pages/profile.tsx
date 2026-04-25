import { useEffect, useState, useMemo } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useRewardsProfile } from "@/hooks/use-rewards";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PexlyFooter } from "@/components/pexly-footer";
import { getCountryFlag } from "@/lib/localization";
import { useMarkets, type PolymarketMarket } from "@/hooks/use-polymarket";
import { shopifyService } from "@/lib/shopify-service";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { Upload, User, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
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
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

function IconChevronRight({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExternalLink({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconShoppingBag({ size = 14, gradient = false }: { size?: number; gradient?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" /><stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill={gradient ? "url(#sbg)" : "none"} stroke={gradient ? "none" : "#6366f1"} strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 6h18" stroke={gradient ? "#c7d2fe" : "#6366f1"} strokeWidth="1.5" />
      <path d="M16 10a4 4 0 01-8 0" stroke={gradient ? "#e0e7ff" : "#6366f1"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconTrending({ size = 16, up = true }: { size?: number; up?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="tg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={up ? "#34d399" : "#f87171"} /><stop offset="100%" stopColor={up ? "#10b981" : "#ef4444"} />
        </linearGradient>
      </defs>
      {up
        ? <><polyline points="3,17 8,11 13,14 21,5" stroke="url(#tg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /><polyline points="16,5 21,5 21,10" stroke="url(#tg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>
        : <><polyline points="3,7 8,13 13,10 21,19" stroke="url(#tg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /><polyline points="16,19 21,19 21,14" stroke="url(#tg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>
      }
    </svg>
  );
}

function IconPrediction({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="preg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#preg)" opacity=".15" stroke="url(#preg)" strokeWidth="1.5" />
      <path d="M8 12h8M12 8v8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" opacity=".4" />
      <circle cx="12" cy="12" r="3" fill="#6366f1" />
    </svg>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm", className)}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-3">{children}</p>;
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

interface ShopProduct { id: string; title: string; images: string[]; price: number; currency: string; productType: string; inStock: boolean; }
interface SpotTrade { id: string; symbol: string; side: string; price: string; qty: string; status: string; time: number; }
interface PerpTrade { id: string; symbol: string; side: string; positionAmt: string; entryPrice: string; unrealizedProfit: string; leverage?: string; }

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
  const [tradeTypeFilter, setTradeTypeFilter] = useState<"spot" | "perp">("spot");

  // ── Data state ──
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [spotTrades, setSpotTrades] = useState<SpotTrade[]>([]);
  const [perpTrades, setPerpTrades] = useState<PerpTrade[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTrades, setLoadingTrades] = useState(false);

  // ── Edit profile state ──
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", bio: "", languages: [] as string[], avatar_type: "default" as string, avatar_url: null as string | null });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Rewards ──
  const { data: rewardsProfile } = useRewardsProfile();

  // ── Live data ──
  const { data: predictionMarkets } = useMarkets({ limit: 10 });

  const activeMarkets = useMemo(() => {
    if (!predictionMarkets) return [];
    return [...predictionMarkets].sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0));
  }, [predictionMarkets]);

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

  // ── Fetch Shopify products ──
  useEffect(() => {
    shopifyService.getProducts(4).then(result => {
      setShopProducts(result.products.map((edge: any) => {
        const p = edge.node;
        const firstVariant = p.variants?.edges?.[0]?.node;
        return {
          id: p.id, title: p.title,
          images: p.images.edges.map((e: any) => e.node.url),
          price: parseFloat(p.priceRange.minVariantPrice.amount),
          currency: p.priceRange.minVariantPrice.currencyCode,
          productType: p.productType || "Product",
          inStock: firstVariant?.availableForSale !== false,
        };
      }));
    }).catch(() => {});
  }, []);

  // ── Auth redirect ──
  useEffect(() => {
    if (!loading && !user && isOwnProfile) { setLocation("/signin"); return; }
    if (viewingUserId) {
      fetchProfileData();
    }
  }, [user, loading, viewingUserId]);

  useEffect(() => { if (tab === "Activity" && user?.id) fetchSpotAndPerpTrades(); }, [tab, user?.id]);

  // ── Data fetchers ──
  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);
      const timeout = new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 5000));
      const { data, error } = await Promise.race([supabase.from("user_profiles").select("*").eq("id", viewingUserId).single(), timeout]) as any;
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

  const fetchSpotAndPerpTrades = async () => {
    if (!user?.id) return;
    setLoadingTrades(true);
    try {
      const { data: spot } = await supabase.from("spot_orders").select("*").eq("user_id", user.id).order("time", { ascending: false }).limit(20);
      setSpotTrades(spot || []);
    } catch { setSpotTrades([]); }
    try {
      const { data: perp } = await supabase.from("perp_positions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      setPerpTrades(perp || []);
    } catch { setPerpTrades([]); }
    setLoadingTrades(false);
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
  if (loading || loadingProfile) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
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
  if (shopProducts.length > 0) badges.push("Shop Pioneer");

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

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pb-24">

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

        {/* ── Wallet + XP ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center flex-shrink-0">
              <IconWallet size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-400 dark:text-muted-foreground">Pexly ID</div>
              <div className="text-sm font-mono font-semibold text-slate-800 dark:text-foreground truncate">{pexlyId}</div>
            </div>
            <div className="flex items-center gap-1.5">
              {["BTC", "ETH", "SOL"].map(t => (
                <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-muted rounded-full border border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground font-medium">
                  <img src={cryptoIconUrls[t]} alt={t} className="w-3 h-3 rounded-full object-cover" />
                  {t}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-4">
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
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Active Predictions */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Active Predictions</SectionLabel>
                  <button onClick={() => setTab("Predictions")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                    View all <IconChevronRight size={12} />
                  </button>
                </div>
                {activeMarkets.slice(0, 3).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No markets available</p>
                ) : (
                  activeMarkets.slice(0, 3).map((m, i, arr) => {
                    const prices = JSON.parse(m.outcomePrices || "[]");
                    const yesOdds = prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 0;
                    return (
                      <div key={m.conditionId} className={cn("flex items-center gap-3 py-3", i < arr.length - 1 ? "border-b border-slate-100 dark:border-border" : "")}>
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                          yesOdds >= 50 ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800")}>
                          {yesOdds}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 dark:text-foreground truncate">{m.question}</p>
                          <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5">Vol: {m.volume || "—"}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </Card>

              {/* Trending Products */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Trending Products</SectionLabel>
                  <button onClick={() => setTab("Shop")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                    Shop <IconChevronRight size={12} />
                  </button>
                </div>
                {shopProducts.slice(0, 3).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Loading products…</p>
                ) : (
                  shopProducts.slice(0, 3).map((p, i) => (
                    <div key={p.id} className={cn("flex items-center gap-3 py-3", i < 2 ? "border-b border-slate-100 dark:border-border" : "")}>
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.images[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover rounded-lg" /> : <IconShoppingBag size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-foreground truncate">{p.title}</p>
                        <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5">{p.currency}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-foreground tabular-nums">${p.price.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </Card>
            </div>

          </div>
        )}

        {/* ── PREDICTIONS TAB ── */}
        {tab === "Predictions" && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-foreground">Prediction Markets</h2>
              <Link href="/prediction" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Browse all <IconExternalLink size={12} />
              </Link>
            </div>
            {activeMarkets.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-slate-400">No prediction markets available</p>
              </Card>
            ) : (
              activeMarkets.map(m => {
                const prices = JSON.parse(m.outcomePrices || "[]");
                const yesOdds = prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 0;
                const imageSrc = m.image ? DOMPurify.sanitize(m.image) : null;
                return (
                  <Card key={m.conditionId} className="p-5 hover:border-primary/50 hover:shadow-md transition-all duration-150 cursor-default">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-13 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border px-3",
                        yesOdds >= 65 ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400")}>
                        <span className="text-sm font-bold tabular-nums leading-none">{yesOdds}%</span>
                        <span className="text-[9px] uppercase tracking-wide opacity-60">YES</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-muted text-slate-500 dark:text-muted-foreground border border-slate-200 dark:border-border font-medium">Crypto</span>
                              {(m.volumeNum || 0) > 500000 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-50 dark:bg-lime-950/50 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-800 font-medium flex items-center gap-1">
                                  <IconTrending size={10} /> Trending
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-foreground leading-snug">{m.question}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-[10px] text-emerald-600 font-medium w-7">YES</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${yesOdds}%` }} />
                          </div>
                          <span className="text-[10px] text-red-500 font-medium w-7 text-right">NO</span>
                        </div>
                        <div className="flex gap-4 text-[11px] text-slate-400 dark:text-muted-foreground">
                          <span>Vol {m.volume || "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border flex gap-2">
                      <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium border-0"
                        onClick={() => setLocation(`/prediction/${m.conditionId}`)}>
                        Buy YES
                      </Button>
                      <Button size="sm" className="h-7 text-xs bg-red-500 hover:bg-red-600 text-white font-medium border-0"
                        onClick={() => setLocation(`/prediction/${m.conditionId}`)}>
                        Buy NO
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground ml-auto"
                        onClick={() => setLocation(`/prediction/${m.conditionId}`)}>
                        Details <IconChevronRight size={11} className="ml-0.5 inline" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ── SHOP TAB ── */}
        {tab === "Shop" && (
          <div className="animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-foreground">Pexly Store</h2>
              <Link href="/shop" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Full store <IconExternalLink size={12} />
              </Link>
            </div>
            {shopProducts.length === 0 ? (
              <Card className="p-8 text-center"><p className="text-sm text-slate-400">Loading products…</p></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shopProducts.map(p => (
                  <Card key={p.id} className="overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-border transition-all duration-150 group cursor-pointer"
                    onClick={() => p.inStock && setLocation(`/shop/product/${encodeURIComponent(p.id)}`)}>
                    <div className="h-40 flex items-center justify-center relative bg-slate-100 dark:bg-muted overflow-hidden">
                      {p.images[0]
                        ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <IconShoppingBag size={42} gradient />}
                      {!p.inStock && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-card/70 flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-500 dark:text-muted-foreground bg-white dark:bg-card border border-slate-200 dark:border-border px-3 py-1 rounded-full shadow-sm">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {p.productType && <div className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase tracking-widest font-medium mb-1">{p.productType}</div>}
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
                      <div className="flex items-center gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => <IconStar key={i} size={12} filled={i < 4} />)}
                        <span className="text-[11px] text-slate-400 dark:text-muted-foreground ml-1">{p.currency}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-base font-bold text-slate-900 dark:text-foreground">${p.price.toFixed(2)}</div>
                        <Button size="sm" disabled={!p.inStock}
                          className={cn("h-8 text-xs font-semibold", p.inStock ? "bg-primary text-black hover:bg-primary/90" : "opacity-40 bg-slate-100 dark:bg-muted text-slate-400 dark:text-muted-foreground border border-slate-200 dark:border-border cursor-not-allowed")}>
                          {p.inStock ? "Add to Cart" : "Sold Out"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {tab === "Activity" && (
          <div className="animate-in fade-in-0 duration-200 space-y-4">

            {/* Spot / Perp Trade History */}
            <div className="flex items-center justify-between mt-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-foreground">Trade History</h2>
              <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-muted rounded-lg">
                {(["spot", "perp"] as const).map(t => (
                  <button key={t} onClick={() => setTradeTypeFilter(t)}
                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all",
                      tradeTypeFilter === t ? "bg-white dark:bg-card text-slate-800 dark:text-foreground shadow-sm" : "text-slate-400 dark:text-muted-foreground hover:text-slate-600 dark:hover:text-foreground")}>
                    {t === "spot" ? "Spot" : "Perpetual"}
                  </button>
                ))}
              </div>
            </div>

            <Card className="divide-y divide-slate-100 dark:divide-border">
              {loadingTrades ? (
                <div className="px-5 py-6 text-sm text-slate-400 dark:text-muted-foreground flex items-center gap-2"><LoadingSpinner size="sm" /> Loading trades…</div>
              ) : tradeTypeFilter === "spot" ? (
                spotTrades.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-slate-400 dark:text-muted-foreground">No spot trade history</div>
                ) : (
                  spotTrades.map((trade, i) => (
                    <div key={trade.id || i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                        trade.side === "BUY" ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400")}>
                        {trade.side === "BUY" ? "BUY" : "SELL"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-foreground font-medium">{trade.symbol}</p>
                        <p className="text-[11px] text-slate-400 dark:text-muted-foreground flex items-center gap-1 mt-0.5"><IconClock size={10} />{trade.time ? new Date(trade.time).toLocaleDateString() : "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800 dark:text-foreground">{parseFloat(trade.qty || "0").toFixed(6)}</p>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", trade.status === "FILLED" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-muted text-slate-500 dark:text-muted-foreground")}>
                          {trade.status || "—"}
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                perpTrades.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-slate-400 dark:text-muted-foreground">No perpetual positions</div>
                ) : (
                  perpTrades.map((pos, i) => {
                    const pnl = parseFloat(pos.unrealizedProfit || "0");
                    return (
                      <div key={pos.id || i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                          pos.side === "LONG" ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400")}>
                          {pos.side === "LONG" ? "LONG" : "SHORT"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 dark:text-foreground font-medium">{pos.symbol}{pos.leverage ? ` ${pos.leverage}×` : ""}</p>
                          <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5">Entry: {parseFloat(pos.entryPrice || "0").toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-800 dark:text-foreground">{parseFloat(pos.positionAmt || "0").toFixed(4)}</p>
                          <span className={cn("text-[10px] font-semibold", pnl >= 0 ? "text-emerald-600" : "text-red-500")}>
                            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </Card>

          </div>
        )}

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
