import {
  useEventDetail, useEvents, useOrderbook, usePriceHistory,
  useOpenOrders, usePlaceOrder, useCancelOrder,
  usePolymarketWalletInfo, usePolymarketApprove, usePolymarketRevoke,
  usePolymarketTradeHistory,
} from "@/hooks/use-polymarket";
import type { PolymarketMarket } from "@/hooks/use-polymarket";
import type { PolymarketWalletInfo, PolymarketTrade } from "@/lib/polymarket-clob";
import { useAuth } from "@/lib/auth-context";
import { PolymarketImage } from "@/components/polymarket-image";
import { CommentSection } from "@/components/comment-section";
import { useRoute, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Share2, Bookmark, TrendingUp, TrendingDown,
  Clock, BarChart2, Droplets, Info, X, Loader2, AlertCircle,
  CheckCircle2, Wallet, ChevronDown, ChevronUp, Users,
  Eye, EyeOff, ExternalLink, History, ArrowDownToLine,
  ArrowUpFromLine, RefreshCw,
} from '@/lib/icons';
import { format } from "date-fns";
import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ───────────────────────────── constants */
const QUICK_AMOUNTS   = [1, 5, 10, 50, 100];
const CHART_INTERVALS = ["1H", "6H", "1D", "1W", "1M"] as const;
type Interval = (typeof CHART_INTERVALS)[number];

/* ───────────────────────────── helpers */
function safeJsonParse<T>(str: unknown, fallback: T): T {
  if (Array.isArray(str)) return str as T;
  if (typeof str !== 'string' || !str) return fallback;
  try { const r = JSON.parse(str); return Array.isArray(r) ? r as T : fallback; }
  catch { return fallback; }
}
function tagLabel(t: { label?: string; slug?: string } | undefined | null): string {
  if (!t) return '';
  return t.label ?? t.slug ?? '';
}
function fmtVol(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/* ───────────────────────────── skeleton */
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5">
        <Skeleton className="h-4 w-32 mb-5 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-4">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── trade panel (shared mobile + desktop) */
interface TradePanelProps {
  market: any;
  outcomes: { name: string; price: number; tokenId: string }[];
  isBinary: boolean;
  selectedOutcomeIdx: number;
  setSelectedOutcomeIdx: (i: number) => void;
  tradeTab: "buy" | "sell";
  setTradeTab: (t: "buy" | "sell") => void;
  orderType: "market" | "limit";
  setOrderType: (t: "market" | "limit") => void;
  limitPrice: string;
  setLimitPrice: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  yesCents: number;
  noCents: number;
  selectedCents: number;
  isYesSelected: boolean;
  availableUsdc: number;
  balanceData: any;
  walletStatus: "no-user" | "no-wallet" | "loading" | "connected";
  estimatedShares: number;
  potentialProfit: string;
  amountNum: number;
  placeOrder: any;
  handlePlaceOrder: () => void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

function TradePanel({
  market, outcomes, isBinary,
  selectedOutcomeIdx, setSelectedOutcomeIdx,
  tradeTab, setTradeTab,
  orderType, setOrderType,
  limitPrice, setLimitPrice,
  amount, setAmount,
  yesCents, noCents, selectedCents,
  isYesSelected, availableUsdc, balanceData, walletStatus,
  estimatedShares, potentialProfit, amountNum,
  placeOrder, handlePlaceOrder,
  onDeposit, onWithdraw,
}: TradePanelProps) {
  const limitPriceNum  = Number(limitPrice) || 0;
  const limitShares    = orderType === "limit" && limitPriceNum > 0 ? amountNum / (limitPriceNum / 100) : estimatedShares;
  const limitProfit    = limitShares > amountNum ? (limitShares - amountNum).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col">
      {/* ── Buy / Sell tabs ── */}
      <div className="flex border-b border-border">
        {(["buy", "sell"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setTradeTab(tab)}
            className={cn(
              "flex-1 py-4 text-sm font-bold capitalize transition-colors border-b-2 -mb-px",
              tradeTab === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* ── Market / Limit toggle ── */}
        <div className="flex rounded-xl bg-muted/60 border border-border p-1 gap-1">
          {(["market", "limit"] as const).map(type => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                orderType === type
                  ? "bg-background text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {type === "market" ? "Market" : "Limit"}
            </button>
          ))}
        </div>

        {/* ── Limit info callout ── */}
        {orderType === "limit" && (
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-xl px-3 py-2.5 border border-border">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Limit orders sit in the order book until filled at your specified price or better.</span>
          </div>
        )}

        {/* ── Balance + wallet actions ── */}
        {walletStatus === "connected" ? (
          <div className="rounded-xl bg-muted/50 border border-border px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="w-3 h-3" />
                <span className="text-[11px] font-medium">Polygon Wallet</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold tabular-nums">${availableUsdc.toFixed(2)}</span>
                <span className="text-[10px] text-muted-foreground ml-1">USDC.e</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={onDeposit}
                className="flex-1 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition-all"
              >
                + Deposit
              </button>
              <button
                onClick={onWithdraw}
                disabled={availableUsdc <= 0}
                className="flex-1 h-7 rounded-lg bg-muted hover:bg-muted/80 border border-border text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                − Withdraw
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wallet className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Balance</span>
            </div>
            {walletStatus === "loading" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading wallet…
              </span>
            )}
            {walletStatus === "no-user" && (
              <span className="text-xs text-muted-foreground italic">Sign in to trade</span>
            )}
            {walletStatus === "no-wallet" && (
              <span className="text-xs text-muted-foreground italic">No EVM wallet found</span>
            )}
          </div>
        )}

        {/* ── Binary Yes/No picker ── */}
        {isBinary && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedOutcomeIdx(0)}
              className={cn(
                "py-3 rounded-xl text-sm font-bold transition-all border",
                selectedOutcomeIdx === 0
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/25"
                  : "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15",
              )}
            >
              Yes · {yesCents}¢
            </button>
            <button
              onClick={() => setSelectedOutcomeIdx(1)}
              className={cn(
                "py-3 rounded-xl text-sm font-bold transition-all border",
                selectedOutcomeIdx === 1
                  ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/25"
                  : "bg-red-500/8 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/15",
              )}
            >
              No · {noCents}¢
            </button>
          </div>
        )}

        {/* ── Multi-outcome picker ── */}
        {!isBinary && outcomes.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Select outcome</label>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {outcomes.map((o, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOutcomeIdx(i)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                    selectedOutcomeIdx === i
                      ? "border-primary/50 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                  )}
                >
                  <span className="truncate mr-2">{o.name}</span>
                  <span className="tabular-nums shrink-0">{Math.round(o.price * 100)}¢</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Limit price input (only for Limit orders) ── */}
        {orderType === "limit" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Limit price</label>
              <span className="text-[10px] text-muted-foreground">Market: {selectedCents}¢</span>
            </div>
            <div className="relative">
              <Input
                type="number"
                min={1}
                max={99}
                step={1}
                value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                placeholder={String(selectedCents)}
                className="pr-8 h-11 text-sm font-semibold tabular-nums"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold select-none">¢</span>
            </div>
            {limitPriceNum > 0 && limitPriceNum !== selectedCents && (
              <p className={cn(
                "text-[10px] font-medium",
                limitPriceNum < selectedCents ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500",
              )}>
                {limitPriceNum < selectedCents
                  ? `${selectedCents - limitPriceNum}¢ below market — order may fill quickly`
                  : `${limitPriceNum - selectedCents}¢ above market — order queued in book`}
              </p>
            )}
          </div>
        )}

        {/* ── Amount input ── */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Amount (USDC)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm select-none">$</span>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-7 h-12 text-base font-semibold"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(String((Number(amount) || 0) + amt))}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-foreground/30 hover:bg-muted transition-all text-muted-foreground"
              >
                +${amt}
              </button>
            ))}
            {availableUsdc > 0 && (
              <button
                onClick={() => setAmount(availableUsdc.toFixed(2))}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-foreground/30 hover:bg-muted transition-all text-muted-foreground"
              >
                Max
              </button>
            )}
          </div>
        </div>

        {/* ── Order summary ── */}
        <div className="bg-muted/50 rounded-xl p-3.5 space-y-2 text-sm">
          {orderType === "limit" ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order type</span>
                <span className="font-semibold">Limit (GTC)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limit price</span>
                <span className="font-semibold tabular-nums">
                  {limitPriceNum > 0 ? `${limitPriceNum}¢` : `${selectedCents}¢ (market)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. shares</span>
                <span className="font-semibold tabular-nums">
                  {limitShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential profit</span>
                <span className={cn(
                  "font-semibold tabular-nums",
                  Number(limitProfit) > 0 ? "text-emerald-600 dark:text-emerald-400" : "",
                )}>
                  +${limitProfit}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span className="text-muted-foreground font-medium">Max return</span>
                <span className="tabular-nums">
                  ${limitShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order type</span>
                <span className="font-semibold">Market (FOK)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg price</span>
                <span className="font-semibold tabular-nums">{selectedCents}¢</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. shares</span>
                <span className="font-semibold tabular-nums">
                  {estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potential profit</span>
                <span className={cn(
                  "font-semibold tabular-nums",
                  Number(potentialProfit) > 0 ? "text-emerald-600 dark:text-emerald-400" : "",
                )}>
                  +${potentialProfit}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span className="text-muted-foreground font-medium">Max return</span>
                <span className="tabular-nums">
                  ${estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Warnings ── */}
        {balanceData && amountNum > availableUsdc && amountNum > 0 && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Insufficient balance. Available: ${availableUsdc.toFixed(2)}
          </div>
        )}
        {orderType === "limit" && limitPriceNum <= 0 && amountNum > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Enter a limit price (1–99¢) to place this order.
          </div>
        )}
        {market.closed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl p-3">
            <Info className="w-3.5 h-3.5 shrink-0" />
            This market is resolved. No new orders can be placed.
          </div>
        )}

        {/* ── CTA ── */}
        <button
          onClick={handlePlaceOrder}
          disabled={
            placeOrder.isPending || market.closed || amountNum <= 0 ||
            (orderType === "limit" && limitPriceNum <= 0) ||
            (balanceData != null && amountNum > availableUsdc)
          }
          className={cn(
            "w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isYesSelected || !isBinary
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-red-500 hover:bg-red-600 text-white",
          )}
        >
          {placeOrder.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" />Placing order…</>
            : <>
                {tradeTab === "buy" ? "Buy" : "Sell"} {outcomes[selectedOutcomeIdx]?.name || "Yes"}
                {amountNum > 0 ? ` · $${amountNum}` : ""}
                {orderType === "limit" && limitPriceNum > 0 ? ` @ ${limitPriceNum}¢` : ""}
              </>}
        </button>

        {placeOrder.isSuccess && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Order submitted successfully
          </div>
        )}
        {placeOrder.isError && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/8 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {(placeOrder.error as Error)?.message || "Order failed"}
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          By trading you agree to the <span className="underline cursor-pointer">Terms of Use</span>
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────── Trade History Row */
function TradeHistoryRow({ trade }: { trade: PolymarketTrade }) {
  const isBuy  = trade.side === "BUY";
  const isRedeem = trade.type === "REDEEM";
  const date   = new Date(trade.timestamp * 1000);
  const usdAmt = (trade.usdcSize ?? 0).toFixed(2);
  const price  = (trade.price * 100).toFixed(0);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-none">
      <div className={cn(
        "mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0",
        isRedeem
          ? "bg-amber-500/15 text-amber-500"
          : isBuy
            ? "bg-emerald-500/15 text-emerald-500"
            : "bg-red-500/15 text-red-500",
      )}>
        {isRedeem
          ? <CheckCircle2 className="w-3.5 h-3.5" />
          : isBuy
            ? <ArrowDownToLine className="w-3.5 h-3.5" />
            : <ArrowUpFromLine className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "text-[11px] font-bold uppercase tracking-wide",
            isRedeem ? "text-amber-500" : isBuy ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
          )}>
            {isRedeem ? "Redeemed" : isBuy ? "Bought" : "Sold"}
            {trade.outcome ? ` · ${trade.outcome}` : ""}
          </span>
          <span className="text-xs font-bold tabular-nums shrink-0">${usdAmt}</span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{trade.title || trade.conditionId?.slice(0, 12) + "…"}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground tabular-nums">{price}¢ avg</span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="text-[10px] text-muted-foreground">{format(date, "MMM d, HH:mm")}</span>
          {trade.transactionHash && (
            <>
              <span className="text-[10px] text-muted-foreground/50">·</span>
              <a
                href={`https://polygonscan.com/tx/${trade.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                Tx
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Polymarket Fund Modal */
type FundTab = "deposit" | "withdraw" | "history";

interface PolymarketFundModalProps {
  open: boolean;
  mode: "deposit" | "withdraw";
  onOpenChange: (v: boolean) => void;
  walletInfo: PolymarketWalletInfo | undefined;
  userEvmAddress: string | null;
}

function PolymarketFundModal({ open, mode, onOpenChange, walletInfo, userEvmAddress }: PolymarketFundModalProps) {
  const { user } = useAuth();
  const [tab,      setTab]      = useState<FundTab>(mode);
  const [amount,   setAmount]   = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [txResult, setTxResult] = useState<{ txHash: string; explorerUrl: string } | null>(null);

  const approveM = usePolymarketApprove();
  const revokeM  = usePolymarketRevoke();
  const { data: tradeHistory, isLoading: historyLoading, refetch: refetchHistory } =
    usePolymarketTradeHistory(tab === "history" ? userEvmAddress : null);
  const busy = approveM.isPending || revokeM.isPending;

  useEffect(() => { if (open) { setTab(mode); setTxResult(null); } }, [open, mode]);

  function handleClose() {
    if (busy) return;
    setAmount(""); setPassword(""); setTxResult(null); setShowPwd(false);
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!user)     { toast.error("Sign in first"); return; }
    if (!password) { toast.error("Enter your wallet password"); return; }
    if (tab === "deposit" && (!amount || parseFloat(amount) <= 0)) {
      toast.error("Enter an amount to approve"); return;
    }
    try {
      const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
      const wallets = await nonCustodialWalletManager.getWalletsFromStorage(user.id);
      const evmWallet = wallets.find(w => w.address.startsWith("0x"));
      if (!evmWallet) { toast.error("No EVM wallet found"); return; }
      const vault = evmWallet.encryptedMnemonic ?? evmWallet.encryptedPrivateKey;
      if (!vault) { toast.error("Wallet data missing — please recreate your wallet"); return; }
      let result: { txHash: string; explorerUrl: string };
      if (tab === "deposit") {
        result = await approveM.mutateAsync({ vault, password, amount });
        toast.success(`Approved $${amount} USDC.e for Polymarket trading`);
      } else {
        result = await revokeM.mutateAsync({ vault, password });
        toast.success("Approval revoked — your USDC.e stays in your wallet");
      }
      setTxResult(result);
      setPassword(""); setAmount("");
    } catch (err: any) {
      toast.error(err?.message || "Transaction failed");
    }
  }

  const TABS: { id: FundTab; label: string; icon: React.ReactNode }[] = [
    { id: "deposit",  label: "Deposit",  icon: <ArrowDownToLine  className="w-3.5 h-3.5" /> },
    { id: "withdraw", label: "Withdraw", icon: <ArrowUpFromLine  className="w-3.5 h-3.5" /> },
    { id: "history",  label: "History",  icon: <History          className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end sm:items-center justify-center transition-all duration-200",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      )}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className={cn(
        "relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl transition-all duration-300",
        open ? "translate-y-0" : "translate-y-8 sm:translate-y-2",
      )}>
        {/* drag handle mobile */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <div>
            <h3 className="text-base font-bold">Polymarket Wallet</h3>
            {userEvmAddress && (
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {userEvmAddress.slice(0, 6)}…{userEvmAddress.slice(-4)} · Polygon
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* balances row */}
        <div className="mx-5 mt-3 rounded-xl bg-muted/50 border border-border divide-y divide-border overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 text-xs">
            <span className="text-muted-foreground">Polygon wallet (USDC.e)</span>
            <span className="font-bold tabular-nums">${walletInfo?.usdcBalance ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2 text-xs">
            <span className="text-muted-foreground">Approved for trading</span>
            <span className={cn(
              "font-bold tabular-nums",
              parseFloat(walletInfo?.approvedAmount ?? "0") > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}>
              ${walletInfo?.approvedAmount ?? "—"}
            </span>
          </div>
          {parseFloat(walletInfo?.pusdBalance ?? "0") > 0 && (
            <div className="flex justify-between items-center px-4 py-2 text-xs">
              <span className="text-muted-foreground">pUSD balance</span>
              <span className="font-bold tabular-nums text-blue-500">${walletInfo?.pusdBalance}</span>
            </div>
          )}
        </div>

        {/* tabs */}
        <div className="flex mx-5 mt-4 rounded-xl bg-muted/50 border border-border p-1 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTxResult(null); setTab(t.id); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                tab === t.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="px-5 pb-6 pt-4">

          {/* ── History tab ── */}
          {tab === "history" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trade Activity</span>
                <button
                  onClick={() => refetchHistory()}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", historyLoading && "animate-spin")} />
                </button>
              </div>
              <div className="max-h-[340px] overflow-y-auto pr-0.5">
                {historyLoading ? (
                  <div className="flex flex-col gap-3 py-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-muted animate-pulse shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                          <div className="h-2.5 bg-muted rounded animate-pulse w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !tradeHistory || tradeHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                      <History className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-muted-foreground">No trade history yet</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-[220px] mx-auto leading-relaxed">
                        Your Polymarket trades will appear here once you start trading.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {tradeHistory.map((trade, i) => (
                      <TradeHistoryRow key={trade.transactionHash ?? `${trade.conditionId}-${trade.timestamp}-${i}`} trade={trade} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Deposit / Withdraw tabs ── */}
          {(tab === "deposit" || tab === "withdraw") && (
            txResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Transaction submitted
                </div>
                <a
                  href={txResult.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on PolygonScan
                </a>
                <button
                  onClick={() => { setTxResult(null); setTab("history"); }}
                  className="w-full h-11 rounded-xl bg-muted hover:bg-muted/80 text-sm font-bold transition-all"
                >
                  View History
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tab === "deposit" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Amount to approve (USDC.e)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="pl-8 h-11 text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Approves USDC.e from your Polygon wallet to the Polymarket CTF Exchange. Funds only move when you place a trade — your balance stays in your wallet until then.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                      This sets your Polymarket trading allowance to zero. Your USDC.e stays in your Polygon wallet — no funds are transferred out.
                    </div>
                    <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                      Current allowance: <span className="font-bold text-foreground">${walletInfo?.approvedAmount ?? "0"} USDC.e</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Wallet password</label>
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      placeholder="Enter your wallet password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pr-11 h-11 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={busy || !password || (tab === "deposit" && (!amount || parseFloat(amount) <= 0))}
                  className={cn(
                    "w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50",
                    tab === "deposit"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-foreground text-background hover:opacity-90",
                  )}
                >
                  {busy
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                    : tab === "deposit" ? `Approve $${amount || "0"} USDC.e` : "Revoke Approval"}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── main page */
export default function PredictionDetailPage() {
  const [, params]      = useRoute("/prediction/:id");
  const [, setLocation] = useLocation();

  const { data: event, isLoading: eventLoading, error: eventError } =
    useEventDetail(params?.id);

  const { user } = useAuth();
  const [userEvmAddress,     setUserEvmAddress]     = useState<string | null>(null);
  const [walletLookupDone,   setWalletLookupDone]   = useState(false);

  const [chartInterval,      setChartInterval]      = useState<Interval>("1D");
  const [tradeTab,           setTradeTab]           = useState<"buy" | "sell">("buy");
  const [orderType,          setOrderType]          = useState<"market" | "limit">("market");
  const [selectedMarketIdx,  setSelectedMarketIdx]  = useState(0);
  /* Auto-select first active (non-resolved) market when event loads */
  useEffect(() => {
    if (!event?.markets) return;
    const firstActive = event.markets.findIndex(m => !m.closed);
    if (firstActive !== -1) setSelectedMarketIdx(firstActive);
  }, [event?.id]);
  const [limitPrice,         setLimitPrice]         = useState("");
  const [rulesTab,           setRulesTab]           = useState<"rules" | "context">("rules");
  const [amount,             setAmount]             = useState("");
  const [orderBookOpen,      setOrderBookOpen]      = useState(true);
  const [mobileSheetOpen,    setMobileSheetOpen]    = useState(false);
  const [fundModalOpen,      setFundModalOpen]      = useState(false);
  const [fundModalMode,      setFundModalMode]      = useState<"deposit" | "withdraw">("deposit");

  useEffect(() => {
    if (!user) { setUserEvmAddress(null); setWalletLookupDone(true); return; }
    setWalletLookupDone(false);
    let cancelled = false;
    (async () => {
      try {
        const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
        const wallets = await nonCustodialWalletManager.getWalletsFromStorage(user.id);
        const evm = wallets.find(w => w.address.startsWith("0x"));
        if (!cancelled) { setUserEvmAddress(evm?.address ?? null); setWalletLookupDone(true); }
      } catch {
        if (!cancelled) { setUserEvmAddress(null); setWalletLookupDone(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const { data: walletInfo, isLoading: walletInfoLoading } = usePolymarketWalletInfo(userEvmAddress);

  /* ── Derived event → market ── */
  const isMultiMarket = (event?.markets?.length ?? 0) > 1;
  const market: PolymarketMarket | null = (event?.markets?.[
    Math.min(selectedMarketIdx, Math.max(0, (event?.markets?.length ?? 1) - 1))
  ]) ?? null;
  const marketLoading = eventLoading;
  const marketError   = eventError;

  /* ── Outcomes ── */
  const outcomes = useMemo(() => {
    try {
      if (!market) return [];
      const prices = safeJsonParse<string[]>(market.outcomePrices, []);
      const ids    = safeJsonParse<string[]>(market.clobTokenIds, []);
      const names  = safeJsonParse<string[]>(market.outcomes, []);
      if (!names.length) return [];
      const mapped = names.map((name: string, i: number) => ({
        name,
        price:   parseFloat(prices[i] || "0.5"),
        tokenId: ids[i],
      }));
      if (
        mapped.length === 2 &&
        mapped.every(o => ["yes", "no"].includes(o.name.toLowerCase())) &&
        mapped[0].name.toLowerCase() === "no"
      ) return [mapped[1], mapped[0]];
      return mapped;
    } catch { return []; }
  }, [market]);

  const isBinary = useMemo(
    () => outcomes.length === 2 && outcomes.every(o => ["yes", "no"].includes(o.name.toLowerCase())),
    [outcomes],
  );

  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0);
  const selectedOutcome = outcomes[selectedOutcomeIdx];

  /* ── Data hooks ── */
  const { data: orderbook }                          = useOrderbook(selectedOutcome?.tokenId);
  const { data: historyData, isLoading: histLoading} = usePriceHistory(selectedOutcome?.tokenId, chartInterval);
  const yesOutcome                                   = outcomes.find(o => o.name.toLowerCase() === "yes");
  const { data: dailyHistory }                       = usePriceHistory(yesOutcome?.tokenId ?? selectedOutcome?.tokenId, "1D");
  const balanceData: PolymarketWalletInfo | undefined = walletInfo;
  const { data: openOrders }                         = useOpenOrders();
  const placeOrder  = usePlaceOrder();
  const cancelOrder = useCancelOrder();

  /* ── Derived ── */
  const noOutcome       = outcomes.find(o => o.name.toLowerCase() === "no");
  const yesCents        = Math.round((yesOutcome?.price  ?? 0.5) * 100);
  const noCents         = Math.round((noOutcome?.price   ?? 0.5) * 100);
  const selectedCents   = Math.round((selectedOutcome?.price ?? 0.5) * 100);
  const isYesSelected   = selectedOutcome?.name?.toLowerCase() === "yes";
  const amountNum       = Number(amount) || 0;
  const estimatedShares = selectedOutcome?.price > 0 ? amountNum / selectedOutcome.price : 0;
  const potentialProfit = estimatedShares > amountNum ? (estimatedShares - amountNum).toFixed(2) : "0.00";
  const endDate         = (event?.endDate || market?.endDate) ? format(new Date((event?.endDate || market?.endDate)!), "MMM d, yyyy") : null;

  const availableUsdc = useMemo(() => {
    if (!balanceData) return 0;
    return parseFloat(balanceData.approvedAmount ?? "0");
  }, [balanceData]);

  const chartPoints: { t: number; v: number }[] = useMemo(() => {
    const raw: { t: number; p: number }[] = historyData?.history ?? [];
    return raw.length >= 2 ? raw.map((d, i) => ({ t: i, v: Math.round(d.p * 100) })) : [];
  }, [historyData]);

  const change24h = useMemo(() => {
    const pts: { t: number; p: number }[] = dailyHistory?.history ?? [];
    if (pts.length < 2) return null;
    const first = pts[0].p, last = pts[pts.length - 1].p;
    return { value: (last - first) * 100, pct: ((last - first) / (first || 1)) * 100 };
  }, [dailyHistory]);

  /* ── Chart color — green when trending up, red when down ── */
  const isChartUp   = !change24h || change24h.value >= 0;
  const chartColor  = isChartUp ? "#22c55e" : "#ef4444";

  const marketOpenOrders = useMemo(() => {
    if (!Array.isArray(openOrders)) return [];
    return openOrders.filter((o: any) => outcomes.some(oc => oc.tokenId === o.asset_id));
  }, [openOrders, outcomes]);

  /* ── Related events (same tag category) ── */
  const firstTagSlug = event?.tags?.[0]?.slug as string | undefined;
  const { data: relatedEventsRaw } = useEvents({ limit: 7, tag_slug: firstTagSlug });
  const filteredRelated = useMemo(
    () => (relatedEventsRaw ?? []).filter(ev => String(ev.id) !== String(event?.id)).slice(0, 5),
    [relatedEventsRaw, event?.id],
  );

  /* ── Place order ── */
  function handlePlaceOrder() {
    if (amountNum <= 0)            { toast.error("Enter an amount to trade"); return; }
    if (!selectedOutcome?.tokenId) { toast.error("No outcome selected"); return; }
    const limitPriceNum = Number(limitPrice) || 0;
    if (orderType === "limit" && limitPriceNum <= 0) { toast.error("Enter a limit price (1–99¢)"); return; }
    const effectivePrice = orderType === "limit" ? limitPriceNum / 100 : selectedOutcome.price;
    const sharesEstimate = effectivePrice > 0 ? amountNum / effectivePrice : estimatedShares;
    placeOrder.mutate({
      tokenID:       selectedOutcome.tokenId,
      price:         effectivePrice,
      size:          amountNum,
      side:          tradeTab === "buy" ? "BUY" : "SELL",
      type:          orderType === "limit" ? "GTC" : "FOK",
      funderAddress: userEvmAddress ?? "",
    }, {
      onSuccess: (data: any) => {
        if (data?.errorMsg) { toast.error(`Order failed: ${data.errorMsg}`); }
        else {
          const label = orderType === "limit"
            ? `Limit order placed: ${sharesEstimate.toFixed(2)} shares of ${selectedOutcome.name} @ ${limitPriceNum}¢`
            : `${tradeTab === "buy" ? "Bought" : "Sold"} ${sharesEstimate.toFixed(2)} shares of ${selectedOutcome.name}`;
          toast.success(label);
          setAmount("");
          if (orderType === "limit") setLimitPrice("");
        }
      },
      onError: (err: Error) => toast.error(err.message || "Failed to place order"),
    });
  }

  /* ── Open mobile sheet ── */
  function openMobileBuy(idx: number) {
    setSelectedOutcomeIdx(idx);
    setMobileSheetOpen(true);
  }

  /* ── Guards ── */
  if (marketLoading) return <DetailSkeleton />;
  if (marketError || !market) return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12] flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <BarChart2 className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-bold mb-2">{marketError ? "Error loading market" : "Market not found"}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {marketError ? (marketError as Error)?.message : "This market doesn't exist or has been removed."}
        </p>
        <Button onClick={() => setLocation("/prediction")}>← Back to Markets</Button>
      </div>
    </div>
  );

  const tradePanelProps: TradePanelProps = {
    market, outcomes, isBinary,
    selectedOutcomeIdx, setSelectedOutcomeIdx,
    tradeTab, setTradeTab,
    orderType, setOrderType,
    limitPrice, setLimitPrice,
    amount, setAmount,
    yesCents, noCents, selectedCents,
    isYesSelected, availableUsdc, balanceData,
    walletStatus: (
      !user                                             ? "no-user"  :
      !walletLookupDone || walletInfoLoading            ? "loading"  :
      !userEvmAddress                                   ? "no-wallet":
                                                          "connected"
    ) as "no-user" | "no-wallet" | "loading" | "connected",
    estimatedShares, potentialProfit, amountNum,
    placeOrder, handlePlaceOrder,
    onDeposit:  () => { setFundModalMode("deposit");  setFundModalOpen(true); },
    onWithdraw: () => { setFundModalMode("withdraw"); setFundModalOpen(true); },
  };

  /* ══════════════════════════════════════════════════════ RENDER */
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12] pb-24 lg:pb-0">

      {/* ── Mobile slide-up trade sheet ── */}
      {mobileSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSheetOpen(false)}
          />
          <div className="relative bg-background rounded-t-3xl max-h-[88vh] overflow-y-auto shadow-2xl">
            {/* drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <button
              onClick={() => setMobileSheetOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <TradePanel {...tradePanelProps} />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5">

        {/* Breadcrumb */}
        <button
          onClick={() => setLocation("/prediction")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Prediction Markets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ════════════ LEFT COLUMN ════════════ */}
          <div className="space-y-4 min-w-0">

            {/* ── Hero header ── */}
            <div className="relative rounded-2xl overflow-hidden">
              {/* Background image or gradient */}
              {(event?.image || market?.image) ? (
                <div className="absolute inset-0">
                  <PolymarketImage
                    src={(event?.image || market?.image)!}
                    className="w-full h-full object-cover"
                    fallback={<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-muted" />
              )}

              {/* Content overlay */}
              <div className={cn(
                "relative px-5 pt-5 pb-5 md:px-7 md:pt-7",
                (event?.image || market?.image) ? "text-white" : "text-foreground",
              )}>
                {/* Top row: tags + actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const t = event?.tags?.[0] || market?.tags?.[0];
                      return t && tagLabel(t) ? (
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
                          (event?.image || market?.image) ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                        )}>
                          {tagLabel(t)}
                        </span>
                      ) : null;
                    })()}
                    {event?.active && !event?.closed && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    )}
                    {event?.closed && (
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full",
                        (event?.image || market?.image) ? "bg-white/20 text-white/70" : "bg-muted text-muted-foreground",
                      )}>
                        Resolved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button className={cn(
                      "p-2 rounded-xl transition-colors",
                      (event?.image || market?.image) ? "bg-white/10 hover:bg-white/20 text-white" : "border border-border hover:bg-muted text-muted-foreground",
                    )}>
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className={cn(
                      "p-2 rounded-xl transition-colors",
                      (event?.image || market?.image) ? "bg-white/10 hover:bg-white/20 text-white" : "border border-border hover:bg-muted text-muted-foreground",
                    )}>
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title — use event headline, fall back to single-market question */}
                <h1 className={cn(
                  "text-xl md:text-2xl font-bold leading-snug tracking-tight mb-4",
                  (event?.image || market?.image) ? "text-white drop-shadow" : "text-foreground",
                )}>
                  {event?.title || market?.question}
                </h1>

                {/* Stats row */}
                <div className={cn(
                  "flex items-center gap-4 flex-wrap text-xs font-medium",
                  (event?.image || market?.image) ? "text-white/70" : "text-muted-foreground",
                )}>
                  <span className="flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" />
                    {fmtVol(event?.volume ?? market?.volumeNum ?? 0)} vol.
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" />
                    {(event?.liquidity || market?.liquidityNum) ? fmtVol(event?.liquidity ?? market?.liquidityNum ?? 0) : "—"} liq.
                  </span>
                  {endDate && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {market?.closed ? "Ended" : "Ends"} {endDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Multi-market stacked list (for events with > 1 market) ── */}
            {isMultiMarket && (
              <div className="bg-background border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-bold">{event!.markets.filter(m => !m.closed).length} Markets</span>
                  {market && (
                    <span className="text-xs text-muted-foreground">
                      Viewing: {market.groupItemTitle || (market.endDate ? format(new Date(market.endDate), "MMM d") : `#${selectedMarketIdx + 1}`)}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {event!.markets.map((m, idx) => ({ m, idx })).filter(({ m }) => !m.closed).map(({ m, idx }) => {
                    const mNames  = safeJsonParse<string[]>(m.outcomes, []);
                    const mPrices = safeJsonParse<string[]>(m.outcomePrices, []);
                    const mIds    = safeJsonParse<string[]>(m.clobTokenIds, []);
                    let mOuts = mNames.map((n, i) => ({ name: n, price: parseFloat(mPrices[i] || "0.5"), tokenId: mIds[i] }));
                    const mIsBin  = mOuts.length === 2 && mOuts.every(o => ["yes","no"].includes(o.name.toLowerCase()));
                    if (mIsBin && mOuts[0]?.name.toLowerCase() === "no") mOuts = [mOuts[1], mOuts[0]];
                    const yesO   = mIsBin ? mOuts[0] : mOuts.reduce((a, b) => a.price > b.price ? a : b, mOuts[0] ?? { name: "", price: 0.5, tokenId: "" });
                    const noO    = mIsBin ? mOuts[1] : null;
                    const yesPct = Math.round((yesO?.price ?? 0.5) * 100);
                    const noPct  = noO ? Math.round(noO.price * 100) : 100 - yesPct;
                    const isSelected = selectedMarketIdx === idx;
                    const label  = m.groupItemTitle || (m.endDate ? format(new Date(m.endDate), "MMM d, yyyy") : `Market ${idx + 1}`);

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "px-5 py-4 transition-colors cursor-pointer",
                          isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/20 border-l-2 border-l-transparent",
                        )}
                        onClick={() => setSelectedMarketIdx(idx)}
                      >
                        {/* Market row header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-bold leading-tight">{label}</div>
                            {m.volumeNum != null && (
                              <div className="text-xs text-muted-foreground mt-0.5">{fmtVol(m.volumeNum)} Vol.</div>
                            )}
                          </div>
                          <div className="text-2xl font-black tabular-nums">{yesPct}%</div>
                        </div>
                        {/* Mini probability bar */}
                        <div className="h-1.5 rounded-full overflow-hidden flex mb-3">
                          <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${yesPct}%` }} />
                          <div className="flex-1 bg-red-400" />
                        </div>
                        {/* Buy buttons */}
                        {!m.closed ? (
                          mIsBin ? (
                            <div className="flex gap-2">
                              <button
                                onClick={e => { e.stopPropagation(); setSelectedMarketIdx(idx); setSelectedOutcomeIdx(0); setTradeTab("buy"); setMobileSheetOpen(true); }}
                                className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
                              >
                                Buy Yes · {yesPct}¢
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setSelectedMarketIdx(idx); setSelectedOutcomeIdx(1); setTradeTab("buy"); setMobileSheetOpen(true); }}
                                className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold transition-all"
                              >
                                Buy No · {noPct}¢
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 flex-wrap">
                              {mOuts.map((o, oi) => (
                                <button
                                  key={oi}
                                  onClick={e => { e.stopPropagation(); setSelectedMarketIdx(idx); setSelectedOutcomeIdx(oi); setTradeTab("buy"); setMobileSheetOpen(true); }}
                                  className="flex-1 min-w-[120px] py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-bold transition-all"
                                >
                                  {o.name} · {Math.round(o.price * 100)}¢
                                </button>
                              ))}
                            </div>
                          )
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">Resolved</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Probability + Chart ── */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">

              {/* Probability header */}
              <div className="px-5 pt-5 md:px-6 md:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      {isBinary
                        ? (selectedOutcomeIdx === 0 ? "Yes probability" : "No probability")
                        : `${selectedOutcome?.name ?? "—"} probability`}
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black tabular-nums tracking-tight leading-none">
                        {selectedCents}%
                      </span>
                      <span className="text-base text-muted-foreground font-medium mb-0.5">chance</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {change24h === null ? (
                        <span className="text-xs text-muted-foreground">Loading 24h…</span>
                      ) : (
                        <>
                          <span className={cn(
                            "flex items-center gap-1 text-xs font-semibold",
                            change24h.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
                          )}>
                            {change24h.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {change24h.value >= 0 ? "+" : ""}{change24h.pct.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">24h change</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Time interval + binary toggle on right */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Binary Yes/No chart toggle */}
                    {isBinary && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedOutcomeIdx(0)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                            selectedOutcomeIdx === 0
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Yes · {yesCents}¢
                        </button>
                        <button
                          onClick={() => setSelectedOutcomeIdx(1)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                            selectedOutcomeIdx === 1
                              ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          No · {noCents}¢
                        </button>
                      </div>
                    )}
                    {/* Time interval */}
                    <div className="flex items-center gap-0.5 rounded-lg border border-border p-1">
                      {CHART_INTERVALS.map(iv => (
                        <button
                          key={iv}
                          onClick={() => setChartInterval(iv)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                            chartInterval === iv
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {iv}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Binary probability bar */}
                {isBinary && (
                  <div className="mb-5">
                    <div className="h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 transition-all duration-500"
                        style={{ width: `${yesCents}%` }}
                      />
                      <div className="flex-1 bg-red-400" />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold mt-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400">Yes {yesCents}%</span>
                      <span className="text-red-500">No {noCents}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Area chart — edge-to-edge, no side padding */}
              <div className="h-[300px] md:h-[360px] w-full">
                {histLoading ? (
                  <div className="h-full flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading chart…</span>
                  </div>
                ) : chartPoints.length < 2 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <BarChart2 className="w-8 h-8 opacity-25" />
                    <p className="text-xs">No price history for this interval</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="chartGradUp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.28} />
                          <stop offset="55%"  stopColor="#22c55e" stopOpacity={0.06} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="chartGradDown" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.28} />
                          <stop offset="55%"  stopColor="#ef4444" stopOpacity={0.06} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="currentColor" opacity={0.04} />
                      <XAxis dataKey="t" hide />
                      <YAxis
                        domain={[0, 100]}
                        orientation="right"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}%`}
                        width={38}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <ReferenceLine
                        y={selectedCents}
                        stroke={chartColor}
                        strokeDasharray="4 3"
                        strokeWidth={1.5}
                        strokeOpacity={0.45}
                      />
                      <Tooltip
                        cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: "3 3", strokeOpacity: 0.6 }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border:          `1.5px solid ${chartColor}`,
                          borderRadius:    "10px",
                          boxShadow:       "0 8px 24px rgba(0,0,0,0.14)",
                          fontSize: 13,
                          fontWeight: 700,
                          padding: "7px 12px",
                        }}
                        formatter={(v: any) => [`${Math.round(v)}%`, "Probability"]}
                        labelStyle={{ display: "none" }}
                        itemStyle={{ color: chartColor }}
                      />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={chartColor}
                        strokeWidth={2.5}
                        fill={`url(#${isChartUp ? "chartGradUp" : "chartGradDown"})`}
                        dot={false}
                        activeDot={{ r: 5, fill: chartColor, stroke: "hsl(var(--background))", strokeWidth: 2.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bottom padding */}
              <div className="h-4" />
            </div>

            {/* ── Multi-outcome list ── */}
            {!isBinary && outcomes.length > 0 && (
              <div className="bg-background border border-border rounded-2xl p-5 md:p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">All Outcomes</h3>
                <div className="space-y-2">
                  {[...outcomes]
                    .sort((a, b) => b.price - a.price)
                    .map((o, i) => {
                      const pct     = Math.round(o.price * 100);
                      const realIdx = outcomes.indexOf(o);
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedOutcomeIdx(realIdx)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                            realIdx === selectedOutcomeIdx
                              ? "border-primary/40 bg-primary/5"
                              : "border-border hover:border-foreground/20 hover:bg-muted/40",
                          )}
                        >
                          <span className="text-sm font-semibold">{o.name}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold tabular-nums w-10 text-right">{pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── Order book (collapsible) ── */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOrderBookOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-semibold">Order Book</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-medium">{outcomes[selectedOutcomeIdx]?.name ?? "—"} · {selectedCents}¢</span>
                  {orderBookOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {orderBookOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  {orderbook ? (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                          <span>Bid</span><span>Size</span>
                        </div>
                        <div className="space-y-2">
                          {(orderbook.bids || []).slice(0, 8).map((bid: any, i: number) => {
                            const pct = Number(bid.price) * 100;
                            return (
                              <div key={i} className="relative flex justify-between items-center text-sm">
                                <div className="absolute inset-0 rounded bg-emerald-500/6" style={{ width: `${pct}%` }} />
                                <span className="relative font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{pct.toFixed(1)}¢</span>
                                <span className="relative text-muted-foreground tabular-nums text-xs">{Number(bid.size).toLocaleString()}</span>
                              </div>
                            );
                          })}
                          {(!orderbook.bids || orderbook.bids.length === 0) && (
                            <p className="text-xs text-muted-foreground">No bids</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                          <span>Ask</span><span>Size</span>
                        </div>
                        <div className="space-y-2">
                          {(orderbook.asks || []).slice(0, 8).map((ask: any, i: number) => {
                            const pct = Number(ask.price) * 100;
                            return (
                              <div key={i} className="relative flex justify-between items-center text-sm">
                                <div className="absolute inset-0 rounded bg-red-500/6" style={{ width: `${pct}%` }} />
                                <span className="relative font-semibold text-red-500 tabular-nums">{pct.toFixed(1)}¢</span>
                                <span className="relative text-muted-foreground tabular-nums text-xs">{Number(ask.size).toLocaleString()}</span>
                              </div>
                            );
                          })}
                          {(!orderbook.asks || orderbook.asks.length === 0) && (
                            <p className="text-xs text-muted-foreground">No asks</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                      {[0, 1].map(col => (
                        <div key={col} className="space-y-2">
                          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full rounded" />)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── About / Details tabs ── */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border">
                {(["rules", "context"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRulesTab(tab)}
                    className={cn(
                      "px-5 py-3.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px",
                      rulesTab === tab
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab === "rules" ? "About" : "Details"}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {rulesTab === "rules" ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {market.description || "No description specified for this market."}
                  </p>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Condition ID</span>
                      <span className="font-mono text-xs break-all text-right">{market.conditionId}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Market ID</span>
                      <span className="font-mono text-xs break-all text-right">{market.id}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Start date</span>
                      <span className="font-medium">{market.startDate ? format(new Date(market.startDate), "MMM d, yyyy") : "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">End date</span>
                      <span className="font-medium">
                        {market.endDate ? format(new Date(market.endDate), "MMM d, yyyy") : endDate ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Status</span>
                      <span className={cn("font-semibold", market.active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                        {market.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {market.tags?.length > 0 && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">Tags</span>
                        <div className="flex flex-wrap justify-end gap-1">
                          {market.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">{tagLabel(tag)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Open orders ── */}
            {marketOpenOrders.length > 0 && (
              <div className="bg-background border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Your Open Orders</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{marketOpenOrders.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {marketOpenOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          o.side === "BUY"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-500",
                        )}>
                          {o.side}
                        </span>
                        <span className="text-sm font-semibold">
                          {Number(o.size_matched || o.original_size).toFixed(2)} shares
                        </span>
                        <span className="text-xs text-muted-foreground">@ {(Number(o.price) * 100).toFixed(1)}¢</span>
                      </div>
                      <button
                        onClick={() => cancelOrder.mutate(o.id, {
                          onSuccess: () => toast.success("Order cancelled"),
                          onError:   () => toast.error("Failed to cancel order"),
                        })}
                        disabled={cancelOrder.isPending}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {cancelOrder.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Related Markets ── */}
            {filteredRelated.length > 0 && (
              <div className="bg-background border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-bold">Related Markets</h3>
                </div>
                <div className="divide-y divide-border">
                  {filteredRelated.map(ev => {
                    const topMarket  = ev.markets?.[0];
                    const topPrices  = safeJsonParse<string[]>(topMarket?.outcomePrices, []);
                    const yesPct     = topPrices.length > 0 ? Math.round(parseFloat(topPrices[0] || "0.5") * 100) : null;
                    return (
                      <button
                        key={ev.id}
                        onClick={() => setLocation(`/prediction/${ev.id}`)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
                      >
                        {ev.image && (
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-muted">
                            <PolymarketImage src={ev.image} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold leading-snug line-clamp-2">{ev.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{fmtVol(ev.volume ?? 0)} Vol.</div>
                        </div>
                        {yesPct !== null && (
                          <div className="shrink-0 text-right ml-2">
                            <div
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                yesPct >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
                              )}
                            >
                              {yesPct}%
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium">Yes</div>
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Comments ── */}
            <CommentSection
              eventId={event?.id}
              isAuthenticated={!!walletInfo}
              commentCount={event?.commentCount}
              onSignIn={() => setLocation("/signin")}
            />
          </div>

          {/* ════════════ RIGHT COLUMN — desktop trade panel ════════════ */}
          <div className="hidden lg:block lg:sticky lg:top-20">
            <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
              <TradePanel {...tradePanelProps} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky bottom Buy bar ── */}
      {!market?.closed && !isMultiMarket && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 safe-area-pb">
          <div className="flex gap-2 max-w-lg mx-auto">
            {isBinary ? (
              <>
                <button
                  onClick={() => openMobileBuy(0)}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
                >
                  {outcomes[0]?.name ?? "Yes"}
                  <span className="opacity-80 font-medium">· {yesCents}¢</span>
                </button>
                <button
                  onClick={() => openMobileBuy(1)}
                  className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/25"
                >
                  {outcomes[1]?.name ?? "No"}
                  <span className="opacity-80 font-medium">· {noCents}¢</span>
                </button>
              </>
            ) : (
              outcomes.map((o, i) => (
                <button
                  key={i}
                  onClick={() => openMobileBuy(i)}
                  className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-lg"
                >
                  {o.name}
                  <span className="opacity-80 font-medium">· {Math.round(o.price * 100)}¢</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <PolymarketFundModal
        open={fundModalOpen}
        mode={fundModalMode}
        onOpenChange={setFundModalOpen}
        walletInfo={walletInfo}
        userEvmAddress={userEvmAddress}
      />
    </div>
  );
}
