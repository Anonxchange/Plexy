import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { type WalletTransaction } from "@/lib/wallet-api";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AssetHistory() {
  const { user } = useAuth();
  const [, params] = useRoute("/wallet/history/:symbol");
  const [, setLocation] = useLocation();
  const symbol = params?.symbol || "";
  
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedCrypto, setSelectedCrypto] = useState<string>(symbol || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { id: "all", label: "All Transactions" },
    { id: "deposit", label: "Deposit" },
    { id: "withdrawal", label: "Withdraw" },
    { id: "p2p", label: "P2P" },
    { id: "spot", label: "Spot" },
  ];

  useEffect(() => {
    if (!user) {
      setLocation("/signin");
      return;
    }
    loadTransactions();
  }, [user]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, activeTab, selectedCrypto, statusFilter]);

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
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

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (activeTab !== "all") {
      if (activeTab === "p2p") {
        filtered = filtered.filter(tx => 
          tx.type === 'p2p_buy' || tx.type === 'p2p_sell'
        );
      } else if (activeTab === "spot") {
        filtered = filtered.filter(tx => tx.type === 'swap');
      } else {
        filtered = filtered.filter(tx => tx.type === activeTab);
      }
    }

    if (selectedCrypto !== "all") {
      filtered = filtered.filter(tx => tx.crypto_symbol === selectedCrypto);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const getBlockExplorerUrl = (tx: WalletTransaction) => {
    if (!tx.tx_hash) return null;
    
    const explorers: Record<string, string> = {
      'BTC': `https://mempool.space/tx/${tx.tx_hash}`,
      'ETH': `https://etherscan.io/tx/${tx.tx_hash}`,
      'USDT': `https://etherscan.io/tx/${tx.tx_hash}`,
      'BNB': `https://bscscan.com/tx/${tx.tx_hash}`,
    };

    return explorers[tx.crypto_symbol] || `https://blockchair.com/search?q=${tx.tx_hash}`;
  };

  const uniqueCryptos = Array.from(new Set(transactions.map(tx => tx.crypto_symbol)));

  const openTransactionDetails = (tx: WalletTransaction) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/wallet")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Asset History</h1>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src={cryptoIconUrls[symbol as keyof typeof cryptoIconUrls] || `https://ui-avatars.com/api/?name=${symbol}&background=random`}
              alt={symbol}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${symbol}&background=random`;
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex px-4 gap-6 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 text-sm whitespace-nowrap relative ${
                activeTab === tab.id
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 flex items-center gap-3">
        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueCryptos.map((crypto) => (
              <SelectItem key={crypto} value={crypto}>{crypto}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Succeeded</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Self-service assistance */}
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Deposit not received?{" "}
          <button className="text-orange-500 underline">
            Click here for self-service assistance →
          </button>
        </p>
      </div>

      {/* Transaction List */}
      <div className="px-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredTransactions.map((tx, index) => (
              <div
                key={tx.id}
                onClick={() => openTransactionDetails(tx)}
                className="flex items-center justify-between py-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-base mb-1">{tx.crypto_symbol}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-base mb-1">
                      {Math.abs(tx.amount).toFixed(8)}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground capitalize">{tx.status === 'completed' ? 'Succeeded' : tx.status}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedTransaction.status === 'completed' ? 'bg-green-500' : 
                    selectedTransaction.status === 'pending' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}></div>
                  <span className="capitalize font-medium">
                    {selectedTransaction.status === 'completed' ? 'Succeeded' : selectedTransaction.status}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium text-lg">
                  {selectedTransaction.amount >= 0 ? '+' : ''}{selectedTransaction.amount.toFixed(8)} {selectedTransaction.crypto_symbol}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{selectedTransaction.type.replace('_', ' ')}</span>
              </div>

              {/* Time */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{formatDate(selectedTransaction.created_at)}</span>
              </div>

              {/* Fee */}
              {selectedTransaction.fee > 0 && (
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="font-medium">{selectedTransaction.fee.toFixed(8)} {selectedTransaction.crypto_symbol}</span>
                </div>
              )}

              {/* Confirmations */}
              {selectedTransaction.confirmations !== null && (
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Confirmations</span>
                  <span className="font-medium">{selectedTransaction.confirmations}/6</span>
                </div>
              )}

              {/* Transaction Hash */}
              {selectedTransaction.tx_hash && (
                <div className="py-3 border-b border-border">
                  <div className="text-muted-foreground mb-2">Transaction Hash</div>
                  <div className="bg-muted p-3 rounded border border-border font-mono text-xs break-all">
                    {selectedTransaction.tx_hash}
                  </div>
                </div>
              )}

              {/* From Address */}
              {selectedTransaction.from_address && (
                <div className="py-3 border-b border-border">
                  <div className="text-muted-foreground mb-2">From Address</div>
                  <div className="bg-muted p-3 rounded border border-border font-mono text-xs break-all">
                    {selectedTransaction.from_address}
                  </div>
                </div>
              )}

              {/* To Address */}
              {selectedTransaction.to_address && (
                <div className="py-3 border-b border-border">
                  <div className="text-muted-foreground mb-2">To Address</div>
                  <div className="bg-muted p-3 rounded border border-border font-mono text-xs break-all">
                    {selectedTransaction.to_address}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="py-3 border-b border-border">
                  <div className="text-muted-foreground mb-2">Notes</div>
                  <div className="text-sm">{selectedTransaction.notes}</div>
                </div>
              )}

              {/* Blockchain Explorers */}
              {selectedTransaction.tx_hash && (
                <div className="pt-4 space-y-3">
                  <Button
                    asChild
                    className="w-full"
                    size="lg"
                  >
                    <a
                      href={`https://mempool.space/tx/${selectedTransaction.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View on Mempool</span>
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <a
                      href={`https://blockchair.com/${selectedTransaction.crypto_symbol.toLowerCase()}/transaction/${selectedTransaction.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View on Blockchair</span>
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
