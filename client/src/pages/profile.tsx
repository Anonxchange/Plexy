import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OfferCard } from "@/components/offer-card";
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
  avatar_type: string | null;
  avatar_url: string | null;
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
  rating: 'positive' | 'negative';
  comment: string;
  created_at: string;
  payment_method: string;
  trade_count: number;
}

export function Profile() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/profile/:userId");
  const { toast } = useToast();
  const supabase = createClient();

  // If there's a userId in the URL, view that user's profile; otherwise view own profile
  const viewingUserId = params?.userId || user?.id;
  const isOwnProfile = !params?.userId || params?.userId === user?.id;

  const [offerFilter, setOfferFilter] = useState("buying");
  const [feedbackFilter, setFeedbackFilter] = useState("buyers");
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
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
    }
  }, [user, loading, setLocation, viewingUserId]);

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
        setProfileData(data);
      } else {
        // Create default profile if doesn't exist
        const defaultProfile = {
          id: user?.id,
          username: `user_${user?.id?.substring(0, 8)}`,
          country: 'Nigeria',
          bio: null,
          languages: ['English'],
          positive_feedback: 0,
          negative_feedback: 0,
          total_trades: 0,
          trade_partners: 0,
          is_verified: false,
          phone_verified: false
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
      const defaultProfile = {
        id: user?.id || '',
        username: `user_${user?.id?.substring(0, 8)}`,
        country: 'Nigeria',
        bio: null,
        languages: ['English'],
        positive_feedback: 0,
        negative_feedback: 0,
        total_trades: 0,
        trade_partners: 0,
        is_verified: false,
        phone_verified: false,
        created_at: new Date().toISOString(),
        avatar_type: 'default',
        avatar_url: null
      };
      setProfileData(defaultProfile as UserProfile);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchOffers = async () => {
    try {
      // Profile page shows YOUR OWN offers
      // "Buying Crypto" = your buy offers, "Selling Crypto" = your sell offers
      const type = offerFilter === "buying" ? "buy" : "sell";

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );

      const fetchPromise = supabase
        .from('p2p_offers')
        .select('*')
        .eq('user_id', user?.id)
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
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );

      const fetchPromise = supabase
        .from('trade_feedback')
        .select('*')
        .eq('to_user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching feedbacks:', error);
        setFeedbacks([]);
        return;
      }

      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setFeedbacks([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [offerFilter]);

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
    }
  }, [feedbackFilter]);

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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
        avatar_url: uploadResult.url,
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary break-words flex items-center gap-2 flex-wrap">
            {username} <span className="text-2xl">🇳🇬</span> Profile
          </h1>
        </div>

        <Card className="mb-6 bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-elevate-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Trophy className="h-8 w-8" />
                    <span className="text-3xl font-bold">1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img 
                      src={medalTheOg} 
                      alt="The OG" 
                      className="h-8 w-8 object-contain"
                    />
                    {profileData && profileData.total_trades >= 10 && (
                      <img 
                        src={medalInitiate} 
                        alt="Pexly Initiate" 
                        className="h-8 w-8 object-contain"
                      />
                    )}
                    {profileData && profileData.total_trades >= 100 && (
                      <img 
                        src={medalTop1} 
                        alt="Top 1% Club" 
                        className="h-8 w-8 object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
                <span className="text-primary font-medium">Active now</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                <div className="relative mx-auto sm:mx-0">
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

                <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold break-all flex items-center gap-2">
                      @{username} <span className="text-lg">🇳🇬</span>
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
                  <p className="text-sm text-muted-foreground mb-4">{profileData?.country || 'Nigeria'}</p>
                  {isOwnProfile && (
                    <Button 
                      variant="ghost" 
                      className="text-primary hover:text-primary/80 font-medium w-full sm:w-auto"
                      onClick={handleEditProfile}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {profileData?.bio && (
                <div className="mb-4 pb-4 border-b border-border">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Bio:</p>
                  <p className="text-sm leading-relaxed">{profileData.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-6 border-t border-border">
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-2">Feedback:</p>
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <div className="flex items-center gap-1 text-primary">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="font-bold text-lg">{profileData?.positive_feedback || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-destructive">
                      <ThumbsDown className="h-4 w-4" />
                      <span className="font-bold text-lg">{profileData?.negative_feedback || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Languages:</p>
                  <p className="font-medium">{profileData?.languages?.join(', ') || 'English'}</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-muted-foreground uppercase text-xs mb-2">Joined:</p>
                  <p className="font-medium">{new Date(profileData?.created_at || user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isOwnProfile && (
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 mb-6"
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 mb-6"
            onClick={handleShareProfile}
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Profile
          </Button>
        )}

        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-elevate-1 rounded-lg p-4 text-center">
                <p className="text-muted-foreground uppercase text-xs mb-2">Trades Released</p>
                <p className="text-2xl sm:text-3xl font-bold">{profileData?.total_trades || 0}</p>
              </div>
              <div className="bg-elevate-1 rounded-lg p-4 text-center">
                <p className="text-muted-foreground uppercase text-xs mb-2">Trade Partners</p>
                <p className="text-2xl sm:text-3xl font-bold">{profileData?.trade_partners || 0}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground uppercase text-xs mb-3">Medals</p>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">🥇</span>
                <span className="font-medium">The OG - Early Adopter</span>
              </div>
              {profileData && profileData.total_trades >= 10 && (
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">🎖️</span>
                  <span className="font-medium">Pexly Initiate</span>
                </div>
              )}
              {profileData && profileData.total_trades >= 100 && (
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">💎</span>
                  <span className="font-medium">Top 1% Club</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground uppercase text-xs mb-3">Verifications</p>
              <div className="space-y-2">
                {profileData?.is_verified && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm">🇳🇬</span>
                    <span className="font-medium">ID verified</span>
                  </div>
                )}
                {profileData?.phone_verified && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm">🇳🇬</span>
                    <span className="font-medium">Phone verified</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground uppercase text-xs mb-3">Trade Volumes</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <img src={cryptoIconUrls.BTC} alt="BTC" className="h-5 w-5" />
                  <span>&lt; 10 BTC</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <img src={cryptoIconUrls.SOL} alt="SOL" className="h-5 w-5" />
                  <span>&lt; 10K SOL</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <img src={cryptoIconUrls.USDT} alt="USDT" className="h-5 w-5" />
                  <span>&lt; 10K USDT</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <img src={cryptoIconUrls.USDC} alt="USDC" className="h-5 w-5" />
                  <span>&lt; 10K USDC</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <img src={cryptoIconUrls.TON} alt="TON" className="h-5 w-5" />
                  <span>&lt; 10K TON</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <img src={cryptoIconUrls.XMR} alt="XMR" className="h-5 w-5" />
                  <span>&lt; 10K XMR</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground uppercase text-xs mb-2">Trusted By</p>
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <span className="font-bold text-lg">6 USERS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-muted-foreground uppercase text-xs mb-2">Blocked By</p>
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  <span className="font-bold">5 USERS</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-xs mb-2">Has Blocked</p>
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  <span className="font-bold">0 USERS</span>
                </div>
              </div>
            </div>

            <div className="bg-muted text-foreground text-center py-3 rounded mb-4">
              For 30 days range
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="text-center sm:text-left">
                <p className="text-muted-foreground uppercase text-xs mb-2">Trades Success</p>
                <p className="text-xl">—</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-muted-foreground uppercase text-xs mb-2">Avg. Time to Payment</p>
                <p className="text-xl">—</p>
              </div>
              <div className="col-span-1 sm:col-span-2 text-center sm:text-left">
                <p className="text-muted-foreground uppercase text-xs mb-2">Avg. Time to Release</p>
                <p className="text-xl">—</p>
              </div>
              <div className="col-span-1 sm:col-span-2 text-center sm:text-left">
                <p className="text-muted-foreground uppercase text-xs mb-2">Trades Volume</p>
                <p className="text-xl">&lt; 100USD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-primary">Active Offers</h2>
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
            <Card className="mb-4 bg-card border-border">
              <CardContent className="p-8 text-center">
                <p className="text-lg">No offers from active users.</p>
              </CardContent>
            </Card>
          ) : (
            offers.map((offer) => (
              <OfferCard
                key={offer.id}
                id={offer.id}
                vendor={{
                  name: profileData?.username || 'User',
                  avatar: profileData?.avatar_url,
                  isVerified: profileData?.is_verified || false,
                  trades: profileData?.total_trades || 0,
                  responseTime: '< 5 min',
                  id: user?.id,
                }}
                paymentMethod={offer.payment_method}
                pricePerBTC={offer.price}
                currency={offer.fiat_currency}
                availableRange={{ min: offer.min_amount, max: offer.max_amount }}
                limits={{ min: offer.min_amount, max: offer.max_amount }}
                type={offer.type}
                cryptoSymbol={offer.crypto_symbol}
              />
            ))
          )}

          <Button 
            variant="ghost" 
            className="w-full text-primary hover:text-primary/80 font-medium"
          >
            Load More Offers
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Feedback</h2>
            <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyers">From Buyers</SelectItem>
                <SelectItem value="sellers">From Sellers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {feedbacks.length === 0 ? (
            <Card className="mb-4 bg-elevate-1 border-border">
              <CardContent className="p-8 text-center">
                <p className="text-lg">No feedback yet.</p>
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((feedback) => (
              <Card key={feedback.id} className="mb-4 bg-elevate-1 border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${feedback.from_user}`} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                        {feedback.from_user}
                        <span className="text-base">🇳🇬</span>
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        {feedback.rating === 'positive' ? (
                          <>
                            <ThumbsUp className="h-4 w-4 text-primary" />
                            <span className="text-primary font-bold">Positive</span>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="h-4 w-4 text-destructive" />
                            <span className="text-destructive font-bold">Negative</span>
                          </>
                        )}
                        <span className="text-muted-foreground ml-4">
                          {new Date(feedback.created_at).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}
                        </span>
                      </div>
                      <Badge variant="secondary" className="mb-3">
                        {feedback.payment_method}
                      </Badge>
                      <p className="text-lg mb-2">"{feedback.comment}"</p>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Trades:</span>
                        <Badge className="bg-primary/20 text-primary">{feedback.trade_count}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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