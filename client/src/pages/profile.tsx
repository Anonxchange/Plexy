
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
  const [, params] = useRoute("/profile/:username");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offers' | 'feedback'>('offers');

  useEffect(() => {
    if (params?.username) {
      fetchProfile(params.username);
    }
  }, [params?.username]);

  const fetchProfile = async (username: string) => {
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user offers
      const { data: offersData } = await supabase
        .from('offers')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('status', 'active');

      setOffers(offersData || []);

      // Fetch user feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .eq('to_user', profileData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setFeedback(feedbackData || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <Button onClick={() => setLocation('/')}>Go Home</Button>
      </div>
    );
  }

  const trustScore = profile.positive_feedback + profile.negative_feedback > 0
    ? Math.round((profile.positive_feedback / (profile.positive_feedback + profile.negative_feedback)) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-4xl">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{profile.username}</h1>
                  {profile.is_verified && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mb-4">{profile.bio || 'No bio yet'}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Trust Score</p>
                    <p className="text-2xl font-bold">{trustScore}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold">{profile.total_trades}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Positive</p>
                    <p className="text-2xl font-bold text-green-500">{profile.positive_feedback}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Negative</p>
                    <p className="text-2xl font-bold text-red-500">{profile.negative_feedback}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'offers' ? 'default' : 'outline'}
            onClick={() => setActiveTab('offers')}
          >
            Offers ({offers.length})
          </Button>
          <Button
            variant={activeTab === 'feedback' ? 'default' : 'outline'}
            onClick={() => setActiveTab('feedback')}
          >
            Feedback ({feedback.length})
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'offers' ? (
          <div className="space-y-4">
            {offers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No active offers</p>
                </CardContent>
              </Card>
            ) : (
              offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No feedback yet</p>
                </CardContent>
              </Card>
            ) : (
              feedback.map((fb) => (
                <Card key={fb.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {fb.rating === 'positive' ? (
                          <ThumbsUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ThumbsDown className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-semibold">{fb.from_user}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{fb.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Payment: {fb.payment_method} • {fb.trade_count} trades
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <PexlyFooter />
    </div>
  );
}
