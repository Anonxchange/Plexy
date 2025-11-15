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
