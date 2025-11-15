import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  SlidersHorizontal, 
  Download, 
  Copy,
  Bitcoin,
  Eye,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

interface Trade {
  id: string;
  buyer_id: string;
  seller_id: string;
  crypto_symbol: string;
  crypto_amount: number;
  fiat_currency: string;
  fiat_amount: number;
  price: number;
  payment_method: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  buyer_profile?: {
    username: string;
    avatar_url: string | null;
  };
  seller_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export function TradeHistory() {
  const { user } = useAuth();
  const supabase = createClient();
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [completedTradesOpen, setCompletedTradesOpen] = useState(false);
  const [tradeVolumes, setTradeVolumes] = useState({
    BTC: 0,
    USDT: 0,
    ETH: 0,
    USDC: 0,
    SOL: 0,
    TON: 0,
    XMR: 0
  });
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [canceledCount, setCanceledCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
