import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { cryptoIconUrls } from "@/lib/crypto-icons";

interface PexlyPayTransfer {
  id: string;
  sender_id: string;
  recipient_id: string;
  crypto_symbol: string;
  amount: number;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  sender_username?: string;
  recipient_username?: string;
}

export default function PexlyPayHistory() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [transactions, setTransactions] = useState<PexlyPayTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id]);

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Fetch transactions where user is sender or recipient
      const { data: transfers, error } = await supabase
        .from('pexly_pay_transfers')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading transfers:', error);
        setTransactions([]);
        return;
      }

      if (!transfers || transfers.length === 0) {
        setTransactions([]);
        return;
      }

      // Get unique user IDs to fetch usernames
      const userIds = new Set<string>();
      transfers.forEach(t => {
        userIds.add(t.sender_id);
        userIds.add(t.recipient_id);
      });

      // Fetch usernames
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username')
        .in('id', Array.from(userIds));

      const usernameMap = new Map<string, string>();
      profiles?.forEach(p => {
        usernameMap.set(p.id, p.username);
      });

      // Enrich transactions with usernames
      const enrichedTransfers = transfers.map(t => ({
        ...t,
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
        sender_username: usernameMap.get(t.sender_id) || 'Unknown',
        recipient_username: usernameMap.get(t.recipient_id) || 'Unknown',
      }));

      setTransactions(enrichedTransfers);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const isSent = tx.sender_id === user?.id;
    const isReceived = tx.recipient_id === user?.id;

    // Type filter
    if (typeFilter === 'send' && !isSent) return false;
    if (typeFilter === 'receive' && !isReceived) return false;

    // Status filter
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

    // Date filter
    if (dateFilter !== 'all') {
      const txDate = new Date(tx.created_at);
      const now = new Date();
      
      if (dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (txDate < today) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (txDate < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (txDate < monthAgo) return false;
      } else if (dateFilter === 'year') {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        if (txDate < yearAgo) return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/wallet/pexly-pay">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Payment History</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="send">Sent</SelectItem>
              <SelectItem value="receive">Received</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Loading transactions...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center transform rotate-12">
                <div className="w-24 h-24 rounded-xl bg-background border-2 border-muted-foreground/20 transform -rotate-12 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-muted-foreground/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-yellow-500/20 rounded-full" />
            </div>
            <p className="text-muted-foreground text-center">No transactions yet</p>
          </div>
        )}

        {/* Transaction List */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => {
              const isSent = tx.sender_id === user?.id;
              const otherUser = isSent ? tx.recipient_username : tx.sender_username;
              const iconUrl = cryptoIconUrls[tx.crypto_symbol as keyof typeof cryptoIconUrls] || cryptoIconUrls.USDT;
              
              return (
                <Card key={tx.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isSent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                          {isSent ? (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          ) : (
                            <ArrowDownLeft className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {isSent ? 'Sent' : 'Received'}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                tx.status === "completed"
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : tx.status === "pending"
                                  ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                  : "bg-red-500/10 text-red-600 border-red-500/20"
                              }
                            >
                              {tx.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {isSent ? 'To: ' : 'From: '}@{otherUser}
                          </p>
                          {tx.note && (
                            <p className="text-xs text-muted-foreground mt-1">{tx.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <img 
                            src={iconUrl} 
                            alt={tx.crypto_symbol}
                            className="w-4 h-4 rounded-full"
                          />
                          <p className={`font-semibold ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                            {isSent ? '-' : '+'}{tx.amount.toFixed(2)} {tx.crypto_symbol}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(tx.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
