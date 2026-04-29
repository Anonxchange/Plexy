import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowDownLeft, ArrowUpRight, RefreshCw, ShoppingCart, Lock, Unlock, Percent } from "lucide-react";
import { getWalletTransactions, WalletTransaction } from "@/lib/wallet-api";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

interface RecentActivityProps {
  type: "activity" | "operations";
  onDeposit?: (symbol?: string) => void;
}

const TransactionIcon = ({ type }: { type: WalletTransaction['type'] }) => {
  switch (type) {
    case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    case 'swap': return <RefreshCw className="h-4 w-4 text-blue-500" />;
    case 'p2p_buy': return <ShoppingCart className="h-4 w-4 text-orange-500" />;
    case 'p2p_sell': return <ShoppingCart className="h-4 w-4 text-purple-500" />;
    case 'escrow_lock': return <Lock className="h-4 w-4 text-yellow-500" />;
    case 'escrow_release': return <Unlock className="h-4 w-4 text-emerald-500" />;
    case 'fee': return <Percent className="h-4 w-4 text-gray-500" />;
    default: return <RefreshCw className="h-4 w-4" />;
  }
};

const FilterItem = ({ label, value, isPrimary = false }: { label: string; value: string; isPrimary?: boolean }) => (
  <div className="flex items-center gap-1.5 bg-muted/10 px-3 py-1.5 rounded-md border border-muted/50 cursor-pointer hover:bg-muted/20">
    <span className="text-muted-foreground font-medium">{label}:</span>
    <span className={`font-semibold ${isPrimary ? "text-primary" : ""}`}>{value}</span>
    <MoreHorizontal className="h-3 w-3 rotate-90 ml-1" />
  </div>
);

const ActivityTable = ({ isOperations, onDeposit, transactions, isLoading }: { 
  isOperations: boolean; 
  onDeposit?: (symbol?: string) => void;
  transactions: WalletTransaction[];
  isLoading: boolean;
}) => (
  <div className="rounded-lg border bg-card dark:bg-card/50 overflow-x-auto no-scrollbar">
    <Table className="min-w-full">
      <TableHeader className="bg-transparent border-b">
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4">Type</TableHead>
          <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-center">Asset</TableHead>
          <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-center">Amount</TableHead>
          {isOperations ? (
            <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-right">Date</TableHead>
          ) : (
            <>
              <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-center">Date</TableHead>
              <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-right">Status</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={isOperations ? 4 : 5} className="py-10 text-center text-muted-foreground">Loading...</TableCell>
          </TableRow>
        ) : transactions.length > 0 ? (
          transactions.map((tx) => (
            <TableRow key={tx.id} className="hover:bg-muted/5 border-b last:border-none">
              <TableCell className="py-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted/10 flex items-center justify-center">
                    <TransactionIcon type={tx.type} />
                  </div>
                  <span className="capitalize text-xs font-medium">{tx.type.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell className="py-4 text-center font-bold text-xs">{tx.crypto_symbol}</TableCell>
              <TableCell className="py-4 text-center font-bold text-xs">
                <span className={tx.type === 'deposit' || tx.type === 'p2p_sell' ? 'text-green-500' : 'text-foreground'}>
                  {tx.type === 'deposit' || tx.type === 'p2p_sell' ? '+' : '-'}{tx.amount}
                </span>
              </TableCell>
              {isOperations ? (
                <TableCell className="py-4 text-right text-[10px] text-muted-foreground">
                  {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                </TableCell>
              ) : (
                <>
                  <TableCell className="py-4 text-center text-[10px] text-muted-foreground">
                    {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                      tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.status}
                    </span>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))
        ) : (
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={isOperations ? 4 : 5} className="py-20 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-muted/10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-muted-foreground">Nothing to show yet</p>
                  <p className="text-xs text-muted-foreground/60 max-w-[300px] mx-auto">
                    {isOperations 
                      ? "No results match your current filters. Adjust the filters and try again."
                      : "You currently have no assets deposited in your wallet"}
                  </p>
                </div>
                {!isOperations && (
                  <Button 
                    onClick={() => onDeposit?.()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 rounded-lg transition-all"
                  >
                    Deposit
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);

export function RecentActivity({ type, onDeposit }: RecentActivityProps) {
  const isOperations = type === "operations";
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      if (!user) return;
      try {
        setIsLoading(true);
        const data = await getWalletTransactions(user.id, 50);
        console.log("Loaded transactions in RecentActivity:", data);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTransactions();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-bold text-foreground mr-1">Filter</span>
        
        {isOperations ? (
          <>
          <div className="flex flex-wrap items-center gap-2">
            <FilterItem label="Filter" value="Transactions: All" />
            <FilterItem label="Action" value="All" />
            <FilterItem label="Date" value="All" isPrimary />
          </div>
          </>
        ) : (
          <>
            <FilterItem label="Asset" value="All" />
            <FilterItem label="Type" value="All" />
            <FilterItem label="Status" value="All" />
            <FilterItem label="Date" value="From the beginning" isPrimary />
          </>
        )}
      </div>

      <ActivityTable 
        isOperations={isOperations} 
        onDeposit={onDeposit} 
        transactions={transactions}
        isLoading={isLoading}
      />
    </div>
  );
}
