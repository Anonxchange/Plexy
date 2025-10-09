import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Plus, ArrowDownToLine } from "lucide-react";

//todo: remove mock functionality
const wallets = [
  { crypto: "BTC", fullName: "Bitcoin", balance: 0.05234567, usdValue: 6367.89, change24h: 2.34, icon: "₿" },
  { crypto: "ETH", fullName: "Ethereum", balance: 2.45678901, usdValue: 9445.67, change24h: -1.12, icon: "Ξ" },
  { crypto: "USDT", fullName: "Tether", balance: 5000.00, usdValue: 5000.00, change24h: 0.01, icon: "₮" },
  { crypto: "BNB", fullName: "BNB", balance: 12.34567890, usdValue: 7974.23, change24h: 3.45, icon: "B" },
  { crypto: "SOL", fullName: "Solana", balance: 45.12345678, usdValue: 11084.50, change24h: 5.67, icon: "◎" },
  { crypto: "XRP", fullName: "XRP", balance: 1500.00, usdValue: 3675.00, change24h: -0.89, icon: "✕" },
];

//todo: remove mock functionality
const recentTransactions = [
  { id: "1", type: "received", crypto: "BTC", amount: 0.001, usd: 121.63, date: "2024-10-09", time: "14:32" },
  { id: "2", type: "sent", crypto: "ETH", amount: 0.5, usd: 1922.62, date: "2024-10-09", time: "12:15" },
  { id: "3", type: "received", crypto: "USDT", amount: 1000, usd: 1000.00, date: "2024-10-08", time: "18:45" },
  { id: "4", type: "sent", crypto: "BTC", amount: 0.002, usd: 243.25, date: "2024-10-08", time: "09:20" },
];

export default function Wallet() {
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.usdValue, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Total Balance</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6" data-testid="text-total-balance">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Deposit</span>
                  <span className="sm:hidden">Deposit</span>
                </Button>
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                  <ArrowDownToLine className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Receive</span>
                  <span className="sm:hidden">Receive</span>
                </Button>
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Send</span>
                  <span className="sm:hidden">Send</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Assets</h2>
          <Card>
            <CardContent className="p-0">
              {wallets.map((wallet, index) => (
                <div 
                  key={wallet.crypto} 
                  className={`flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    index !== wallets.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0">
                      {wallet.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-sm sm:text-base truncate">{wallet.fullName}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{wallet.balance.toFixed(8)} {wallet.crypto}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-semibold text-foreground text-sm sm:text-base">${wallet.usdValue.toLocaleString()}</div>
                    <div className={`text-xs sm:text-sm ${wallet.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {wallet.change24h >= 0 ? '+' : ''}{wallet.change24h}%
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Spot Trade Section */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Spot Trade</h2>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { pair: "BTC/USDT", price: "121,630.45", change: "+2.34%", positive: true },
                  { pair: "ETH/USDT", price: "3,845.22", change: "-1.12%", positive: false },
                  { pair: "BNB/USDT", price: "645.89", change: "+3.45%", positive: true },
                  { pair: "SOL/USDT", price: "245.67", change: "+5.67%", positive: true },
                  { pair: "XRP/USDT", price: "2.45", change: "-0.89%", positive: false },
                  { pair: "ADA/USDT", price: "1.23", change: "+1.23%", positive: true },
                ].map((trade, index) => (
                  <div 
                    key={index}
                    className="p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm sm:text-base text-foreground">{trade.pair}</div>
                      <div className={`text-xs sm:text-sm font-medium ${trade.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.change}
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-foreground mb-2">${trade.price}</div>
                    <Button size="sm" className="w-full text-xs sm:text-sm">Trade</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Transactions</h2>
          <Card>
            <CardContent className="p-0">
              {recentTransactions.map((tx, index) => (
                <div 
                  key={tx.id} 
                  className={`flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors ${
                    index !== recentTransactions.length - 1 ? 'border-b border-border' : ''
                  }`}
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === "received" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                    }`}>
                      {tx.type === "received" ? (
                        <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground text-sm sm:text-base truncate">
                        {tx.type === "received" ? "Received" : "Sent"} {tx.crypto}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{tx.date} at {tx.time}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`font-semibold tabular-nums text-sm sm:text-base ${tx.type === "received" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "received" ? "+" : "-"}{tx.amount} {tx.crypto}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground tabular-nums">${tx.usd.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
