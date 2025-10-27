
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { getWalletTransactions, type WalletTransaction } from "@/lib/wallet-api";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { PexlyFooter } from "@/components/pexly-footer";

export default function AssetHistory() {
  const { user } = useAuth();
  const [, params] = useRoute("/wallet/history/:symbol");
  const [, setLocation] = useLocation();
  const symbol = params?.symbol || "";
  
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/signin");
      return;
    }
    loadTransactions();
  }, [user, symbol]);

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('crypto_symbol', symbol)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading transactions:", error);
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownToLine className="h-5 w-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpFromLine className="h-5 w-5 text-red-600" />;
      case 'swap':
        return <ArrowLeftRight className="h-5 w-5 text-blue-600" />;
      default:
        return <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case 'pending':
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case 'failed':
      case 'cancelled':
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'swap':
        return 'Swap';
      case 'p2p_buy':
        return 'P2P Buy';
      case 'p2p_sell':
        return 'P2P Sell';
      case 'escrow_lock':
        return 'Escrow Lock';
      case 'escrow_release':
        return 'Escrow Release';
      case 'fee':
        return 'Fee';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation(`/wallet/asset/${symbol}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src={cryptoIconUrls[symbol as keyof typeof cryptoIconUrls] || `https://ui-avatars.com/api/?name=${symbol}&background=random`}
                alt={symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${symbol}&background=random`;
                }}
              />
              <h1 className="text-lg font-semibold">{symbol} Transaction History</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading transaction history...</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center transform rotate-12">
                <div className="w-24 h-24 rounded-xl bg-background border-2 border-muted-foreground/20 transform -rotate-12 flex items-center justify-center">
                  <ArrowLeftRight className="w-12 h-12 text-muted-foreground/40" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-yellow-500/20 rounded-full" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Your {symbol} transaction history will appear here
            </p>
            <Button onClick={() => setLocation("/wallet")}>
              Back to Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {getTransactionIcon(tx.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base">
                            {formatTransactionType(tx.type)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(8)} {tx.crypto_symbol}
                          </div>
                          {tx.fee > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Fee: {tx.fee.toFixed(8)} {tx.crypto_symbol}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="outline" className={`${getStatusColor(tx.status)} flex items-center gap-1`}>
                          {getStatusIcon(tx.status)}
                          <span className="capitalize">{tx.status}</span>
                        </Badge>
                        
                        {(tx.confirmations !== null && tx.confirmations !== undefined) && (
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1 ${
                              tx.confirmations >= 6 
                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                : tx.confirmations >= 3
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {tx.confirmations >= 6 ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              <span>{tx.confirmations} confirmation{tx.confirmations !== 1 ? 's' : ''}</span>
                            </div>
                          </Badge>
                        )}
                      </div>

                      {tx.tx_hash && (
                        <div className="space-y-2 mb-2">
                          <div className="bg-muted/50 p-2 rounded border border-muted">
                            <div className="text-xs text-muted-foreground mb-1">Transaction Hash</div>
                            <div className="text-xs font-mono break-all">{tx.tx_hash}</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://mempool.space/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-medium text-primary"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>Mempool</span>
                            </a>
                            <a
                              href={`https://blockchair.com/${tx.crypto_symbol.toLowerCase()}/transaction/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-medium text-blue-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>Blockchair</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {tx.from_address && (
                        <div className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">From: </span>
                          <span className="font-mono">{tx.from_address.substring(0, 16)}...</span>
                        </div>
                      )}

                      {tx.to_address && (
                        <div className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">To: </span>
                          <span className="font-mono">{tx.to_address.substring(0, 16)}...</span>
                        </div>
                      )}

                      {tx.notes && (
                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                          {tx.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PexlyFooter />
    </div>
  );
}
