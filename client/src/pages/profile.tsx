import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OfferCard, type OfferCardProps } from "@/components/offer-card";
import { getCountryFlag } from "@/lib/localization";
import { 
  User, 
  Copy,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Users,
  ChevronDown,
  Share2,
  Upload,
  Image as ImageIcon,
  Trophy,
  Flag,
  Wallet,
  Send,
  FilterIcon, // Added FilterIcon for the filter button
} from "lucide-react";
import medalTheOg from '@assets/generated_images/IMG_1432.png';
import medalInitiate from '@assets/generated_images/IMG_1430.png';
import medalTop1 from '@assets/generated_images/IMG_1425.png';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { uploadToR2 } from "@/lib/r2-storage";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Helper function for relative time formatting
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

interface ProfileStats {
  trustedByCount: number;
  blockedByCount: number;
  hasBlockedCount: number;
  thirtyDayStats: {
    tradesSuccess: number | null;
    avgTimeToPayment: number | null;
    avgTimeToRelease: number | null;
    tradesVolume: number;
  };
}

interface Offer {
  id: string;
  crypto_symbol: string;
  fiat_currency: string;
  payment_method: string;
  price: number;
  min_amount: number;
  max_amount: number;
  type: 'buy' | 'sell';
}

interface Feedback {
  id: string;
  from_user: string;
  from_user_id: string;
  rating: 'positive' | 'negative';
  comment: string;
  created_at: string;
  payment_method: string;
  trade_count: number;
  currency?: string;
  offer_id?: string;
  from_user_profile?: {
    username: string;
    country: string;
  };
}

interface TradeHistory {
  id: string;
  buyer_id: string;
  seller_id: string;
  crypto_symbol: string;
  crypto_amount: string;
  fiat_amount: string;
  fiat_currency: string;
  status: string;
  created_at: string;
  payment_method?: string;
}

export function Profile() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/profile/:userId");
  const { toast } = useToast();
  const supabase = createClient();
  const isMobile = useIsMobile();

  // If there's a userId in the URL, view that user's profile; otherwise view own profile
  const viewingUserId = params?.userId || user?.id;
  const isOwnProfile = !params?.userId || params?.userId === user?.id;

  const [offerFilter, setOfferFilter] = useState("buying");
  const [feedbackFilter, setFeedbackFilter] = useState("buyers");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    languages: [] as string[],
    avatar_type: 'default' as string,
    avatar_url: null as string | null,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isTrusted, setIsTrusted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [trustLoading, setTrustLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    trustedByCount: 0,
    blockedByCount: 0,
    hasBlockedCount: 0,
    thirtyDayStats: {
      tradesSuccess: null,
      avgTimeToPayment: null,
      avgTimeToRelease: null,
      tradesVolume: 0,
    },
  });

  const avatarTypes = [
    { id: 'default', label: 'Default', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
    { id: 'trader', label: 'Trader', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader' },
    { id: 'crypto', label: 'Crypto', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto' },
    { id: 'robot', label: 'Robot', image: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot' },
    { id: 'ninja', label: 'Ninja', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ninja' },
    { id: 'astronaut', label: 'Astronaut', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut' },
    { id: 'developer', label: 'Developer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer' },
    { id: 'artist', label: 'Artist', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist' },
  ];

  useEffect(() => {
    if (!loading && !user && isOwnProfile) {
      setLocation("/signin");
    } else if (viewingUserId) {
      fetchProfileData();
      fetchFeedbacks();
      fetchProfileStats();
      if (!isOwnProfile && user?.id) {
        checkTrustAndBlockStatus();
      }
    }
  }, [user, loading, setLocation, viewingUserId]);

  const checkTrustAndBlockStatus = async () => {
    if (!user?.id || !viewingUserId || isOwnProfile) return;

    try {
      // Check if user is trusted
      const { data: trustData } = await supabase
        .from('trusted_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('trusted_user_id', viewingUserId)
        .single();

      setIsTrusted(!!trustData);

      // Check if user is blocked
      const { data: blockData } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('blocked_user_id', viewingUserId)
        .single();

      setIsBlocked(!!blockData);
    } catch (error) {
      console.error('Error checking trust/block status:', error);
    }
  };

  const fetchProfileStats = async () => {
    if (!viewingUserId) return;

    try {
      // Fetch trusted by count (how many users trust this profile)
      const { count: trustedByCount } = await supabase
        .from('trusted_users')
        .select('*', { count: 'exact', head: true })
        .eq('trusted_user_id', viewingUserId);

      // Fetch blocked by count (how many users blocked this profile)
      const { count: blockedByCount } = await supabase
        .from('blocked_users')
        .select('*', { count: 'exact', head: true })
        .eq('blocked_user_id', viewingUserId);

      // Fetch has blocked count (how many users this profile has blocked)
      const { count: hasBlockedCount } = await supabase
        .from('blocked_users')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', viewingUserId);

      // Fetch 30-day trade stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentTrades } = await supabase
        .from('p2p_trades')
        .select('*')
        .or(`buyer_id.eq.${viewingUserId},seller_id.eq.${viewingUserId}`)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      let tradesSuccess: number | null = null;
      let avgTimeToPayment: number | null = null;
      let avgTimeToRelease: number | null = null;
      let tradesVolume = 0;

      if (recentTrades && recentTrades.length > 0) {
        const completedTrades = recentTrades.filter((t: any) => t.status === 'completed');
        const totalTrades = recentTrades.length;
        
        if (totalTrades > 0) {
          tradesSuccess = Math.round((completedTrades.length / totalTrades) * 100);
        }

        // Calculate average time to payment (for trades where user is buyer)
        const buyerTrades = recentTrades.filter((t: any) => 
          t.buyer_id === viewingUserId && t.paid_at && t.created_at
        );
        if (buyerTrades.length > 0) {
          const totalPaymentTime = buyerTrades.reduce((acc: number, t: any) => {
            const created = new Date(t.created_at).getTime();
            const paid = new Date(t.paid_at).getTime();
            return acc + (paid - created);
          }, 0);
          avgTimeToPayment = Math.round(totalPaymentTime / buyerTrades.length / (1000 * 60)); // in minutes
        }

        // Calculate average time to release (for trades where user is seller)
        const sellerTrades = recentTrades.filter((t: any) => 
          t.seller_id === viewingUserId && t.released_at && t.paid_at
        );
        if (sellerTrades.length > 0) {
          const totalReleaseTime = sellerTrades.reduce((acc: number, t: any) => {
            const paid = new Date(t.paid_at).getTime();
            const released = new Date(t.released_at).getTime();
            return acc + (released - paid);
          }, 0);
          avgTimeToRelease = Math.round(totalReleaseTime / sellerTrades.length / (1000 * 60)); // in minutes
        }

        // Calculate total volume in USD
        tradesVolume = completedTrades.reduce((acc: number, t: any) => {
          return acc + parseFloat(t.fiat_amount || '0');
        }, 0);
      }

      setProfileStats({
        trustedByCount: trustedByCount || 0,
        blockedByCount: blockedByCount || 0,
        hasBlockedCount: hasBlockedCount || 0,
        thirtyDayStats: {
          tradesSuccess,
          avgTimeToPayment,
          avgTimeToRelease,
          tradesVolume,
        },
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', viewingUserId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // For email_verified: use profile data for the viewed user
        // Only use auth data if viewing own profile
        const emailVerified = isOwnProfile 
          ? (user?.email_confirmed_at ? true : false)
          : (data.email_verified || false);
        
        // Fetch actual feedback counts from trade_feedback table
        const { count: positiveCount } = await supabase
          .from('trade_feedback')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', viewingUserId)
          .eq('rating', 'positive');
        
        const { count: negativeCount } = await supabase
          .from('trade_feedback')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', viewingUserId)
          .eq('rating', 'negative');

        // Fetch actual trades count (completed trades where user was seller - "released")
        const { count: tradesReleasedCount } = await supabase
          .from('p2p_trades')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', viewingUserId)
          .eq('status', 'completed');

        // Count unique trade partners
        const { data: buyerTrades } = await supabase
          .from('p2p_trades')
          .select('seller_id')
          .eq('buyer_id', viewingUserId)
          .eq('status', 'completed');

        const { data: sellerTrades } = await supabase
          .from('p2p_trades')
          .select('buyer_id')
          .eq('seller_id', viewingUserId)
          .eq('status', 'completed');

        const uniquePartners = new Set([
          ...(buyerTrades?.map(t => t.seller_id) || []),
          ...(sellerTrades?.map(t => t.buyer_id) || [])
        ]);

        setProfileData({
          ...data,
          email_verified: emailVerified,
          positive_feedback: positiveCount || 0,
          negative_feedback: negativeCount || 0,
          total_trades: tradesReleasedCount || 0,
          trade_partners: uniquePartners.size,
        });
      } else {
        // Create default profile if doesn't exist
        // Try to get country from user metadata or profile data
        const userCountry = user?.user_metadata?.country || 
                          user?.user_metadata?.Country || 
                          '';

        const defaultProfile = {
          id: user?.id,
          username: `user_${user?.id?.substring(0, 8)}`,
          country: userCountry,
          bio: null,
          languages: ['English'],
          positive_feedback: 0,
          negative_feedback: 0,
          total_trades: 0,
          trade_partners: 0,
          is_verified: false,
          phone_verified: false,
          email_verified: false,
          last_seen: new Date().toISOString(),
        };

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(defaultProfile)
          .select()
          .single();

        if (!createError && newProfile) {
          setProfileData(newProfile);
        } else if (createError) {
          console.error('Error creating default profile:', createError);
          // Use default profile locally if DB fails
          setProfileData(defaultProfile as UserProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set a default profile even on error to prevent blank page
      const userCountry = user?.user_metadata?.country || 
                        user?.user_metadata?.Country || 
                        '';

      const defaultProfile = {
        id: user?.id || '',
        username: `user_${user?.id?.substring(0, 8)}`,
        country: userCountry,
        bio: null,
        languages: ['English'],
        positive_feedback: 0,
        negative_feedback: 0,
        total_trades: 0,
        trade_partners: 0,
        is_verified: false,
        phone_verified: false,
        email_verified: false,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        avatar_type: 'default',
        avatar_url: null,
        pexly_pay_id: null,
      };
      setProfileData(defaultProfile);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchOffers = async () => {
    try {
      // Fetch offers for the profile being viewed (either own or another user's)
      // When "buying" is selected, show SELL offers (so visitors can buy from this profile)
      // When "selling" is selected, show BUY offers (so visitors can sell to this profile)
      const type = offerFilter === "buying" ? "sell" : "buy";

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );

      const fetchPromise = supabase
        .from('p2p_offers')
        .select('*')
        .eq('user_id', viewingUserId)
        .eq('offer_type', type)
        .eq('is_active', true)
        .limit(10);

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching offers:', error);
        setOffers([]);
        return;
      }

      // Map the data to match expected schema
      const mappedOffers = (data || []).map((offer: any) => ({
        id: offer.id,
        crypto_symbol: offer.crypto_symbol,
        fiat_currency: offer.fiat_currency,
        payment_method: Array.isArray(offer.payment_methods) 
          ? offer.payment_methods.join(', ') 
          : offer.payment_methods,
        price: offer.price_type === "fixed" ? (offer.fixed_price || 0) : (offer.price_per_unit || 0),
        min_amount: offer.min_amount || 0,
        max_amount: offer.max_amount || 0,
        type: offer.offer_type,
      }));

      setOffers(mappedOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      // Step 1: Fetch feedback with a simple query (no foreign key relationships)
      const fetchPromise = supabase
        .from('trade_feedback')
        .select('*')
        .eq('to_user_id', viewingUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: feedbackData, error: feedbackError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (feedbackError) {
        console.error('Error fetching feedbacks:', feedbackError);
        setFeedbacks([]);
        return;
      }

      if (!feedbackData || feedbackData.length === 0) {
        setFeedbacks([]);
        return;
      }

      // Step 2: Get unique user IDs from feedback to fetch their profiles
      const fromUserIds = Array.from(new Set(feedbackData.map((f: any) => f.from_user_id).filter(Boolean))) as string[];
      const tradeIds = Array.from(new Set(feedbackData.map((f: any) => f.trade_id).filter(Boolean))) as string[];

      // Fetch user profiles for feedback senders
      let userProfilesMap: Record<string, any> = {};
      if (fromUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, username, country')
          .in('id', fromUserIds);
        
        if (profiles) {
          userProfilesMap = profiles.reduce((acc: Record<string, any>, p: any) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      // Fetch trades to get buyer/seller info for filtering
      let tradesMap: Record<string, any> = {};
      if (tradeIds.length > 0) {
        const { data: trades } = await supabase
          .from('p2p_trades')
          .select('id, offer_id, seller_id, buyer_id')
          .in('id', tradeIds);
        
        if (trades) {
          tradesMap = trades.reduce((acc: Record<string, any>, t: any) => {
            acc[t.id] = t;
            return acc;
          }, {});
        }
      }

      // Step 3: Map the data to include user profile and trade info
      const mappedFeedbacks = feedbackData.map((feedback: any) => ({
        ...feedback,
        from_user_profile: userProfilesMap[feedback.from_user_id] || null,
        trade: tradesMap[feedback.trade_id] || null,
        offer_id: tradesMap[feedback.trade_id]?.offer_id || null,
      }));

      // Filter based on feedbackFilter (buyers or sellers)
      // When "buyers" tab is selected, show feedback FROM sellers (when profile owner was buying)
      // When "sellers" tab is selected, show feedback FROM buyers (when profile owner was selling)
      let filteredFeedbacks = mappedFeedbacks;
      if (feedbackFilter === 'buyers') {
        // Show feedback FROM sellers (where the profile owner was the buyer)
        filteredFeedbacks = mappedFeedbacks.filter((f: any) => {
          if (!f.trade || !f.trade.seller_id || !f.trade.buyer_id) return true;
          return f.trade.buyer_id === viewingUserId && f.trade.seller_id === f.from_user_id;
        });
      } else if (feedbackFilter === 'sellers') {
        // Show feedback FROM buyers (where the profile owner was the seller)
        filteredFeedbacks = mappedFeedbacks.filter((f: any) => {
          if (!f.trade || !f.trade.seller_id || !f.trade.buyer_id) return true;
          return f.trade.seller_id === viewingUserId && f.trade.buyer_id === f.from_user_id;
        });
      }

      setFeedbacks(filteredFeedbacks);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setFeedbacks([]);
    }
  };

  useEffect(() => {
    if (viewingUserId) {
      fetchOffers();
    }
  }, [offerFilter, viewingUserId]);

  useEffect(() => {
    if (viewingUserId) {
      fetchFeedbacks();
    }
  }, [feedbackFilter, viewingUserId]);

  const fetchTradeHistory = async () => {
    if (!user?.id || !viewingUserId || isOwnProfile) {
      setTradeHistory([]);
      return;
    }

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      let query = supabase
        .from('p2p_trades')
        .select('*')
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${viewingUserId}),and(buyer_id.eq.${viewingUserId},seller_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyFilter === 'bought') {
        query = supabase
          .from('p2p_trades')
          .select('*')
          .eq('buyer_id', user.id)
          .eq('seller_id', viewingUserId)
          .order('created_at', { ascending: false })
          .limit(20);
      } else if (historyFilter === 'sold') {
        query = supabase
          .from('p2p_trades')
          .select('*')
          .eq('seller_id', user.id)
          .eq('buyer_id', viewingUserId)
          .order('created_at', { ascending: false })
          .limit(20);
      }

      const { data, error } = await Promise.race([query, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching trade history:', error);
        setTradeHistory([]);
        return;
      }

      setTradeHistory(data || []);
    } catch (error) {
      console.error('Error fetching trade history:', error);
      setTradeHistory([]);
    }
  };

  useEffect(() => {
    if (viewingUserId && !isOwnProfile && user?.id) {
      fetchTradeHistory();
    }
  }, [historyFilter, viewingUserId, isOwnProfile, user?.id]);

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const username = profileData?.username || 'User';

  const copyUsername = () => {
    navigator.clipboard.writeText(`@${username}`);
    toast({
      title: "Copied!",
      description: "Username copied to clipboard"
    });
  };

  const handleEditProfile = () => {
    setEditForm({
      username: profileData?.username || '',
      bio: profileData?.bio || '',
      languages: profileData?.languages || ['English'],
      avatar_type: profileData?.avatar_type || 'default',
      avatar_url: profileData?.avatar_url || null,
    });
    setEditDialogOpen(true);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);

      // Upload to R2 storage
      const uploadResult = await uploadToR2(file, 'profile-pictures', user?.id || '');

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      setEditForm({
        ...editForm,
        avatar_type: 'custom',
        avatar_url: uploadResult.url || null,
      });

      toast({
        title: "Success!",
        description: "Avatar uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
      toast({
        title: "Upload Failed",
        description: errorMessage.includes('Bucket not found') 
          ? "Storage not configured. Please contact support." 
          : errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate username
      if (!editForm.username || editForm.username.trim().length < 3) {
        toast({
          title: "Invalid Username",
          description: "Username must be at least 3 characters long",
          variant: "destructive"
        });
        return;
      }

      // Check if username already exists (for other users)
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', editForm.username)
        .neq('id', user?.id)
        .single();

      if (existingUser) {
        toast({
          title: "Username Taken",
          description: "This username is already in use. Please choose another.",
          variant: "destructive"
        });
        return;
      }

      const updateData: any = {
        username: editForm.username.trim(),
        bio: editForm.bio,
        avatar_type: editForm.avatar_type,
        avatar_url: editForm.avatar_url,
      };

      // Only include languages if the column exists (will be added by migration)
      if (editForm.languages && editForm.languages.length > 0) {
        updateData.languages = editForm.languages;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) {
        // If languages column doesn't exist yet, try without it
        if (error.code === 'PGRST204' && error.message.includes('languages')) {
          delete updateData.languages;
          const { error: retryError } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', user?.id);

          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      toast({
        title: "Success!",
        description: "Profile updated successfully"
      });

      setEditDialogOpen(false);
      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please check your database schema.",
        variant: "destructive"
      });
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${user?.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${username}'s Profile`,
          text: `Check out @${username}'s trading profile on Pexly`,
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== 'AbortError') {
          copyProfileLink(profileUrl);
        }
      }
    } else {
      copyProfileLink(profileUrl);
    }
  };

  const copyProfileLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Profile link copied to clipboard"
    });
  };

  const handleTrustToggle = async () => {
    if (!user?.id || !viewingUserId || isOwnProfile) return;

    try {
      setTrustLoading(true);

      if (isTrusted) {
        // Remove trust
        const { error } = await supabase
          .from('trusted_users')
          .delete()
          .eq('user_id', user.id)
          .eq('trusted_user_id', viewingUserId);

        if (error) throw error;

        setIsTrusted(false);
        fetchProfileStats(); // Refresh counts after trust change
        toast({
          title: "User Untrusted",
          description: `You have removed @${profileData?.username} from your trusted list`,
        });
      } else {
        // Add trust
        const { error } = await supabase
          .from('trusted_users')
          .insert({
            user_id: user.id,
            trusted_user_id: viewingUserId,
          });

        if (error) {
          if (error.message.includes('Cannot trust a blocked user')) {
            toast({
              title: "Cannot Trust User",
              description: "You must unblock this user first before trusting them",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        setIsTrusted(true);
        fetchProfileStats(); // Refresh counts after trust change
        toast({
          title: "User Trusted",
          description: `You have added @${profileData?.username} to your trusted list`,
        });
      }
    } catch (error) {
      console.error('Error toggling trust:', error);
      toast({
        title: "Error",
        description: "Failed to update trust status",
        variant: "destructive",
      });
    } finally {
      setTrustLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!user?.id || !viewingUserId || isOwnProfile) return;

    try {
      setBlockLoading(true);

      if (isBlocked) {
        // Unblock user
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('user_id', user.id)
          .eq('blocked_user_id', viewingUserId);

        if (error) throw error;

        setIsBlocked(false);
        fetchProfileStats(); // Refresh counts after block change
        toast({
          title: "User Unblocked",
          description: `You have unblocked @${profileData?.username}`,
        });
      } else {
        // Block user
        const { error } = await supabase
          .from('blocked_users')
          .insert({
            user_id: user.id,
            blocked_user_id: viewingUserId,
          });

        if (error) {
          if (error.message.includes('Cannot block a trusted user')) {
            toast({
              title: "Cannot Block User",
              description: "You must remove this user from your trusted list first",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        setIsBlocked(true);
        fetchProfileStats(); // Refresh counts after block change
        toast({
          title: "User Blocked",
          description: `You have blocked @${profileData?.username}`,
        });
      }
    } catch (error) {
      console.error('Error toggling block:', error);
      toast({
        title: "Error",
        description: "Failed to update block status",
        variant: "destructive",
      });
    } finally {
      setBlockLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary break-words flex items-center gap-2 flex-wrap">
            {username} <span className="text-2xl">{getCountryFlag(profileData?.country)}</span> Profile
          </h1>
        </div>

        {/* Desktop: 3-column layout (Profile + Stats), Mobile: stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Profile Card + Share/Send Button */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-elevate-1 p-4 sm:p-6">
              {/* Medals Row */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span className="text-2xl sm:text-3xl font-bold">1</span>
                </div>
                <div className="flex items-center gap-2">
                  <img 
                    src={medalTheOg} 
                    alt="The OG" 
                    className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                  />
                  {profileData && profileData.total_trades >= 10 && (
                    <img 
                      src={medalInitiate} 
                      alt="Pexly Initiate" 
                      className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                    />
                  )}
                  {profileData && profileData.total_trades >= 100 && (
                    <img 
                      src={medalTop1} 
                      alt="Top 1% Club" 
                      className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
                <span className="text-primary font-medium text-sm">
                  {profileData?.last_seen ? (
                    // If seen within last 5 minutes, show "Active now"
                    (Date.now() - new Date(profileData.last_seen).getTime()) < 5 * 60 * 1000 
                      ? 'Active now' 
                      : `Seen ${formatRelativeTime(profileData.last_seen)}`
                  ) : 'Seen recently'}
                </span>
              </div>

              {/* Main Profile Section */}
              <div className="mb-6">
                {/* Top Row - Avatar and Username/Country */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Left Side - Avatar */}
                  <div className="flex-shrink-0">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                      {profileData?.avatar_url ? (
                        <AvatarImage src={profileData.avatar_url} alt={username} />
                      ) : (
                        <>
                          <AvatarImage 
                            src={avatarTypes.find(a => a.id === profileData?.avatar_type)?.image || avatarTypes[0].image} 
                            alt={username} 
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="h-10 w-10 sm:h-12 sm:w-12" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                  </div>

                  {/* Right Side - Username with Copy and Country */}
                  <div className="flex-1 min-w-0">
                    {/* Username with Copy Button */}
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold truncate">
                        @{username}
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary hover:text-primary/80 flex-shrink-0"
                        onClick={copyUsername}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Country */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(profileData?.country)}</span>
                      <span className="text-muted-foreground">{profileData?.country || ''}</span>
                    </div>
                  </div>
                </div>

                {/* Block and Trust Buttons */}
                {!isOwnProfile && (
                  <div className="flex gap-3 mb-4">
                    <span 
                      className={`font-semibold cursor-pointer flex-1 text-center py-2 rounded-md transition-colors ${
                        isBlocked 
                          ? 'text-red-600 bg-red-600/20 hover:bg-red-600/30' 
                          : 'text-red-600 hover:bg-red-600/10'
                      } ${blockLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={blockLoading ? undefined : handleBlockToggle}
                    >
                      {blockLoading ? 'Loading...' : isBlocked ? 'Unblock' : 'Block'}
                    </span>
                    <span 
                      className={`font-semibold cursor-pointer flex-1 text-center py-2 rounded-md transition-colors ${
                        isTrusted 
                          ? 'text-green-600 bg-green-600/20 hover:bg-green-600/30' 
                          : 'text-green-600 hover:bg-green-600/10'
                      } ${trustLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={trustLoading ? undefined : handleTrustToggle}
                    >
                      {trustLoading ? 'Loading...' : isTrusted ? 'Untrust' : 'Trust'}
                    </span>
                  </div>
                )}

                {isOwnProfile && (
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:text-primary/80 font-medium w-full sm:w-auto mb-4"
                    onClick={handleEditProfile}
                  >
                    Edit Profile
                  </Button>
                )}

                {/* Bio Section - Only show if bio exists */}
                {profileData?.bio && (
                  <div className="mb-4 pb-4 border-b border-border">
                    <p className="text-muted-foreground uppercase text-xs mb-2">Bio:</p>
                    <p className="text-sm leading-relaxed">{profileData.bio}</p>
                  </div>
                )}

                {/* Horizontal Info Row - Feedback, Languages, Joined */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground uppercase text-xs mb-2">Feedback:</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-1 text-green-500">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="font-bold text-base sm:text-lg">{profileData?.positive_feedback || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500">
                        <ThumbsDown className="h-4 w-4" />
                        <span className="font-bold text-base sm:text-lg">{profileData?.negative_feedback || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase text-xs mb-2">Languages:</p>
                    <p className="font-medium text-xs sm:text-sm">{profileData?.languages?.join(', ') || 'English'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase text-xs mb-2">Joined:</p>
                    <p className="font-medium text-xs sm:text-sm">{formatRelativeTime(profileData?.created_at || user.created_at)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(profileData?.created_at || user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              </div>
          </CardContent>
        </Card>

        {!isOwnProfile && (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6"
            onClick={() => {
              toast({
                title: "Send Coin",
                description: "Send coin feature coming soon",
              });
            }}
          >
            <Send className="h-5 w-5 mr-2" />
            Send Coin
          </Button>
        )}

        {isOwnProfile && (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6"
            onClick={handleShareProfile}
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Profile
          </Button>
        )}
          </div>

          {/* Column 2: Trades, Verifications, Trade Volumes, Trusted By */}
          <Card className="lg:col-span-1 bg-card border-border">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-elevate-1 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Trades Released</p>
                  <p className="text-2xl sm:text-3xl font-bold">{profileData?.total_trades || 0}</p>
                </div>
                <div className="bg-elevate-1 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Trade Partners</p>
                  <p className="text-2xl sm:text-3xl font-bold">{profileData?.trade_partners || 0}</p>
                </div>
              </div>

              {(profileData && (profileData.total_trades >= 10 || profileData.total_trades >= 100)) && (
                <div className="mb-6">
                  <p className="text-muted-foreground uppercase text-xs mb-3">Medals</p>
                  {profileData.total_trades >= 10 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm">🎖️</span>
                      <span className="font-medium">Pexly Initiate</span>
                    </div>
                  )}
                  {profileData.total_trades >= 100 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm">💎</span>
                      <span className="font-medium">Top 1% Club</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <p className="text-muted-foreground uppercase text-xs mb-3">Verifications</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {profileData?.email_verified ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className={profileData?.email_verified ? "font-medium" : "text-muted-foreground"}>
                      Email {profileData?.email_verified ? "verified" : "not verified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {profileData?.phone_verified ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className={profileData?.phone_verified ? "font-medium" : "text-muted-foreground"}>
                      Phone {profileData?.phone_verified ? "verified" : "not verified"}
                    </span>
                  </div>
                  {profileData?.is_verified && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="font-medium">ID verified</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-muted-foreground uppercase text-xs mb-3">Trade Volumes</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <img src={cryptoIconUrls.BTC} alt="BTC" className="h-5 w-5" />
                    <span className="text-sm">&lt; 10 BTC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={cryptoIconUrls.SOL} alt="SOL" className="h-5 w-5" />
                    <span className="text-sm">&lt; 10K SOL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={cryptoIconUrls.USDT} alt="USDT" className="h-5 w-5" />
                    <span className="text-sm">&lt; 10K USDT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={cryptoIconUrls.USDC} alt="USDC" className="h-5 w-5" />
                    <span className="text-sm">&lt; 10K USDC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={cryptoIconUrls.BNB} alt="BNB" className="h-5 w-5" />
                    <span className="text-sm">&lt; 1K BNB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={cryptoIconUrls.TRX} alt="TRX" className="h-5 w-5" />
                    <span className="text-sm">&lt; 100K TRX</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground uppercase text-xs mb-2">Trusted By</p>
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  <span className="font-bold text-lg">{profileStats.trustedByCount} USER{profileStats.trustedByCount !== 1 ? 'S' : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Block Stats & 30 Day Stats */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="space-y-4 mb-4">
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-2">Blocked By</p>
                  <div className="flex items-center gap-2 text-primary">
                    <Users className="h-5 w-5" />
                    <span className="font-bold">{profileStats.blockedByCount} USER{profileStats.blockedByCount !== 1 ? 'S' : ''}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-2">Has Blocked</p>
                  <div className="flex items-center gap-2 text-primary">
                    <Users className="h-5 w-5" />
                    <span className="font-bold">{profileStats.hasBlockedCount} USER{profileStats.hasBlockedCount !== 1 ? 'S' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted text-foreground text-center py-3 rounded mb-4">
                For 30 days range
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Trades Success</p>
                  <p className="text-xl">{profileStats.thirtyDayStats.tradesSuccess !== null ? `${profileStats.thirtyDayStats.tradesSuccess}%` : '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Avg. Time to Payment</p>
                  <p className="text-xl">{profileStats.thirtyDayStats.avgTimeToPayment !== null ? `${profileStats.thirtyDayStats.avgTimeToPayment} min` : '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Avg. Time to Release</p>
                  <p className="text-xl">{profileStats.thirtyDayStats.avgTimeToRelease !== null ? `${profileStats.thirtyDayStats.avgTimeToRelease} min` : '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Trades Volume</p>
                  <p className="text-xl">{profileStats.thirtyDayStats.tradesVolume > 0 ? `$${profileStats.thirtyDayStats.tradesVolume.toLocaleString()}` : '< $100'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full-width sections below the grid - Active Offers and Feedback */}
      {/* Active Offers Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Active Offers</h3>
          <Select value={offerFilter} onValueChange={setOfferFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buying">Buying Crypto</SelectItem>
              <SelectItem value="selling">Selling Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {offers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active {offerFilter} offers</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                id={offer.id}
                vendor={{
                  name: profileData?.username || 'User',
                  avatar: profileData?.avatar_url || undefined,
                  isVerified: profileData?.is_verified || false,
                  trades: profileData?.total_trades || 0,
                  responseTime: "< 5 min",
                  id: viewingUserId,
                  country: profileData?.country || undefined,
                }}
                paymentMethod={offer.payment_method}
                pricePerBTC={offer.price}
                currency={offer.fiat_currency}
                availableRange={{ min: offer.min_amount, max: offer.max_amount }}
                limits={{ min: offer.min_amount, max: offer.max_amount }}
                type={offerFilter === "buying" ? "buy" : "sell"}
              />
            ))}
          </div>
        )}
      </div>

        {/* Feedback Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Feedback</h3>
          <div className="flex items-center gap-2">
            <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyers">From Buyers</SelectItem>
                <SelectItem value="sellers">From Sellers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id} className="bg-card border-border shadow-sm">
                <CardContent className="p-6">
                  {/* Header with username, flag, and date */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">
                        @{feedback.from_user_profile?.username || feedback.from_user || 'Anonymous'}
                      </h3>
                      {feedback.from_user_profile?.country && (
                        <span className="text-2xl">{getCountryFlag(feedback.from_user_profile?.country)}</span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(feedback.created_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: '2-digit', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>

                  {/* Rating indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    {feedback.rating === 'positive' ? (
                      <>
                        <ThumbsUp className="h-5 w-5 text-primary fill-primary" />
                        <span className="text-primary font-semibold">Positive</span>
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-5 w-5 text-destructive fill-destructive" />
                        <span className="text-destructive font-semibold">Negative</span>
                      </>
                    )}
                  </div>

                  {/* Payment method badge */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm font-medium">
                      {feedback.payment_method}
                      <span className="text-xs bg-background px-2 py-0.5 rounded">
                        {feedback.currency || 'NGN'}
                      </span>
                    </span>
                  </div>

                  {/* Comment */}
                  {feedback.comment && (
                    <div className="mb-4">
                      <p className="text-lg">"{feedback.comment}"</p>
                    </div>
                  )}

                  {/* Trade count */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Trades:</span>
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-semibold">
                        {feedback.trade_count || 1}
                      </span>
                    </div>
                  </div>

                  {/* View offer details button */}
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl"
                    onClick={() => {
                      if (feedback.offer_id) {
                        setLocation(`/offers/${feedback.offer_id}`);
                      } else {
                        toast({
                          title: "Offer details",
                          description: "This offer is no longer available",
                        });
                      }
                    }}
                  >
                    View offer details →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Trade History Section - Only shown when viewing another user's profile */}
      {!isOwnProfile && user?.id && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Trade History with {profileData?.username || 'User'}</h3>
            <Select value={historyFilter} onValueChange={setHistoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="bought">You Bought</SelectItem>
                <SelectItem value="sold">You Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tradeHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trade history with this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tradeHistory.map((trade) => {
                const isBuyer = trade.buyer_id === user?.id;
                const tradeDate = new Date(trade.created_at);
                
                return (
                  <Card key={trade.id} className="bg-card border-border shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isBuyer ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {isBuyer ? (
                              <ThumbsUp className="h-5 w-5" />
                            ) : (
                              <ThumbsDown className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">
                              {isBuyer ? 'You Bought' : 'You Sold'} {parseFloat(trade.crypto_amount).toFixed(8)} {trade.crypto_symbol}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              for {parseFloat(trade.fiat_amount).toLocaleString()} {trade.fiat_currency}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={trade.status === 'completed' ? 'default' : 'secondary'}
                            className={trade.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
                          >
                            {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tradeDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>

                      {trade.payment_method && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-muted-foreground">Payment Method:</span>
                          <Badge variant="outline">{trade.payment_method}</Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Copy className="h-4 w-4" />
                          <span className="font-mono text-xs">{trade.id.substring(0, 8)}...</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(trade.id);
                            toast({
                              title: "Copied!",
                              description: "Trade ID copied to clipboard"
                            });
                          }}
                        >
                          Copy Trade ID
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
      </main>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-20 h-20">
                  {editForm.avatar_url ? (
                    <AvatarImage src={editForm.avatar_url} alt="Avatar preview" />
                  ) : (
                    <>
                      <AvatarImage 
                        src={avatarTypes.find(a => a.id === editForm.avatar_type)?.image || avatarTypes[0].image} 
                        alt="Avatar preview" 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload Image</span>
                    </div>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </Label>
                  {uploadingAvatar && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Or choose an avatar type:</Label>
                <div className="grid grid-cols-4 gap-2">
                  {avatarTypes.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, avatar_type: avatar.id, avatar_url: null })}
                      className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                        editForm.avatar_type === avatar.id && !editForm.avatar_url
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={avatar.image} alt={avatar.label} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{avatar.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Enter username (min 3 characters)"
                minLength={3}
              />
              <p className="text-xs text-muted-foreground">
                Your username is different from your email and will be visible to other users
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="min-h-24 resize-none"
                maxLength={180}
              />
              <p className="text-xs text-muted-foreground">
                Maximum 180 characters ({editForm.bio.length}/180)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="languages">Languages (comma-separated)</Label>
              <Input
                id="languages"
                value={editForm.languages.join(', ')}
                onChange={(e) => setEditForm({ 
                  ...editForm, 
                  languages: e.target.value.split(',').map(l => l.trim()).filter(l => l) 
                })}
                placeholder="e.g., English, Spanish, French"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PexlyFooter />
    </div>
  );
}
