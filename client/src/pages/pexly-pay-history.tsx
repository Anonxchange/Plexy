import { useState } from "react";
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
import { ChevronLeft, ChevronDown } from "lucide-react";
import { Link } from "wouter";

export default function PexlyPayHistory() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Mock transaction data - replace with actual data from API
  const transactions: any[] = [];

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
              <SelectItem value="send">Send</SelectItem>
              <SelectItem value="receive">Receive</SelectItem>
              <SelectItem value="topup">Top Up</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
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

        {/* Empty State */}
        {transactions.length === 0 && (
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

        {/* Transaction List - will show when there are transactions */}
        {transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{transaction.type}</span>
                        <Badge
                          variant="outline"
                          className={
                            transaction.status === "completed"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : transaction.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                              : "bg-red-500/10 text-red-600 border-red-500/20"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{transaction.recipient}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{transaction.amount} USD</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}