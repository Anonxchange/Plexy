import { WalletCard } from "@/components/wallet-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

//todo: remove mock functionality
const wallets = [
  { crypto: "BTC", fullName: "Bitcoin", balance: 0.05234567, usdValue: 6367.89, change24h: 2.34 },
  { crypto: "ETH", fullName: "Ethereum", balance: 2.45678901, usdValue: 9445.67, change24h: -1.12 },
  { crypto: "USDT", fullName: "Tether", balance: 5000.00, usdValue: 5000.00, change24h: 0.01 },
  { crypto: "BNB", fullName: "BNB", balance: 12.34567890, usdValue: 7974.23, change24h: 3.45 },
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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Wallet</h1>
          <p className="text-muted-foreground">Manage your cryptocurrency portfolio</p>
        </div>

        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">Total Balance</div>
              <div className="text-4xl font-bold text-foreground" data-testid="text-total-balance">
                ${totalBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {wallets.map((wallet) => (
            <WalletCard key={wallet.crypto} {...wallet} />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0" data-testid={`transaction-${tx.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "received" ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                    }`}>
                      {tx.type === "received" ? (
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {tx.type === "received" ? "Received" : "Sent"} {tx.crypto}
                      </div>
                      <div className="text-sm text-muted-foreground">{tx.date} at {tx.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold tabular-nums ${tx.type === "received" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "received" ? "+" : "-"}{tx.amount} {tx.crypto}
                    </div>
                    <div className="text-sm text-muted-foreground tabular-nums">${tx.usd.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
