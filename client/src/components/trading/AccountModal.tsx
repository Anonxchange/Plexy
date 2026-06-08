import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ClipboardList, Loader2, AlertCircle, Eye, EyeOff } from '@/lib/icons';
import { AccountModalProvider, useAccountModal } from "./AccountModalContext";
import type { AccountModalProps } from "./AccountModalConfig";
import {
  AccountTypeSelector, ChainSelector, CoinAmountRow, BalanceLine,
  DepositAddressBlock, DepositCTA, SendFromWalletBlock,
} from "./AccountModalParts";

// ── Deposit tab ───────────────────────────────────────────
function DepositTab() {
  const { isSpot, coin, spotBalanceFor, futuresAvailFor, setActiveTab } = useAccountModal();
  return (
    <>
      <AccountTypeSelector />
      {isSpot ? (
        <>
          <ChainSelector />
          <CoinAmountRow />
          <BalanceLine value={`${spotBalanceFor(coin).toFixed(4)} ${coin}`} />
          <DepositAddressBlock />
          <SendFromWalletBlock />
          <DepositCTA />
        </>
      ) : (
        <>
          <ChainSelector />
          <CoinAmountRow />
          <BalanceLine value={`${futuresAvailFor(coin).toFixed(4)} ${coin}`} />
          <DepositAddressBlock />
          <SendFromWalletBlock />
          <DepositCTA />
          <p className="text-xs text-center text-muted-foreground mt-3">
            Already have funds in Spot?{" "}
            <button onClick={() => setActiveTab("transfer")}
              className="text-primary underline-offset-2 hover:underline">
              Transfer instead
            </button>
          </p>
        </>
      )}
    </>
  );
}

// ── Withdraw tab ──────────────────────────────────────────
function WithdrawTab() {
  const {
    isSpot, coin, currentBalance, amountNum, withdrawMin, resolvedFee,
    feeLoading, selectedNetworkInfo, youReceive, withdrawMutation,
    user, isAsterRegistered, walletLoading, requireAuth, handleTabChange,
    withdrawAddress,
  } = useAccountModal();
  return (
    <>
      <AccountTypeSelector />
      <ChainSelector />
      <CoinAmountRow showMax />
      {amountNum > currentBalance && (
        <p className="text-xs text-destructive px-1 mb-2">Exceeds available balance</p>
      )}
      {amountNum > 0 && amountNum < withdrawMin && (
        <p className="text-xs text-destructive px-1 mb-2">Minimum withdrawal is {withdrawMin} {coin}</p>
      )}
      <BalanceLine
        label={isSpot ? "Spot balance" : "Perpetual balance"}
        value={`${currentBalance.toFixed(coin === "BTC" ? 8 : 4)} ${coin}`}
      />
      <div className="bg-secondary rounded-lg px-4 py-3 mb-4 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Network fee</span>
          <span className="text-foreground font-mono-num flex items-center gap-1">
            {feeLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            {resolvedFee} {coin}
          </span>
        </div>
        {selectedNetworkInfo && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min withdrawal</span>
            <span className="text-foreground font-mono-num">{selectedNetworkInfo.withdrawMin} {coin}</span>
          </div>
        )}
        {amountNum > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">You receive</span>
            <span className="text-foreground font-mono-num">≈ {youReceive.toFixed(coin === "BTC" ? 8 : 4)} {coin}</span>
          </div>
        )}
      </div>
      {user && !isAsterRegistered && !walletLoading && (
        <p className="text-xs text-center text-muted-foreground mb-3">
          Connect your wallet on the{" "}
          <button onClick={() => handleTabChange("deposit")} className="text-primary hover:underline">
            Deposit tab
          </button>{" "}
          to enable withdrawals.
        </p>
      )}
      <button
        onClick={() => !user ? requireAuth() : withdrawMutation.mutate()}
        disabled={
          !user || walletLoading || !withdrawAddress || !amountNum || amountNum <= 0 ||
          amountNum > currentBalance || (amountNum < withdrawMin && amountNum > 0) ||
          withdrawMutation.isPending
        }
        className="w-full py-3.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {withdrawMutation.isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
          : walletLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Loading wallet…</>
            : `Withdraw ${coin}`}
      </button>
    </>
  );
}

// ── Transfer tab ──────────────────────────────────────────
function TransferTab() {
  const { isSpot, coin, amountNum, spotBalanceFor, futuresAvailFor, transferMutation, user, requireAuth, hasV3 } = useAccountModal();
  return (
    <>
      <AccountTypeSelector />
      <CoinAmountRow showMax />
      <BalanceLine
        label={isSpot ? "Spot available" : "Perpetual available"}
        value={`${(isSpot ? spotBalanceFor(coin) : futuresAvailFor(coin)).toFixed(4)} ${coin}`}
      />
      <button
        onClick={() => !user ? requireAuth() : transferMutation.mutate()}
        disabled={!user || !amountNum || amountNum <= 0 || transferMutation.isPending || !hasV3}
        title={!hasV3 ? "Connect your wallet to enable transfers" : undefined}
        className="w-full py-3.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {transferMutation.isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" />Transferring…</>
          : isSpot ? "Transfer to Perpetual" : "Transfer to Spot"}
      </button>
    </>
  );
}

// ── TX history dialog ─────────────────────────────────────
function TxHistoryDialog() {
  const {
    txHistoryOpen, setTxHistoryOpen, txHistoryTab, setTxHistoryTab,
    depositHistory, depositHistoryLoading, withdrawHistory, withdrawHistoryLoading,
  } = useAccountModal();
  return (
    <Dialog open={txHistoryOpen} onOpenChange={setTxHistoryOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="text-sm font-semibold">Transaction History</DialogTitle>
          <div className="flex items-center gap-4 mt-2 text-sm">
            {(["deposits", "withdrawals"] as const).map(t => (
              <button key={t} onClick={() => setTxHistoryTab(t)}
                className={`capitalize font-medium transition-colors ${txHistoryTab === t ? "text-foreground border-b-2 border-primary pb-0.5" : "text-muted-foreground"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {txHistoryTab === "deposits" ? (
            depositHistoryLoading
              ? <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              : Array.isArray(depositHistory) && depositHistory.length > 0
                ? <TxTable rows={depositHistory} />
                : <div className="flex justify-center py-8 text-sm text-muted-foreground">No deposit history</div>
          ) : (
            withdrawHistoryLoading
              ? <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              : Array.isArray(withdrawHistory) && withdrawHistory.length > 0
                ? <TxTable rows={withdrawHistory} />
                : <div className="flex justify-center py-8 text-sm text-muted-foreground">No withdrawal history</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TxTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-background">
        <tr className="text-muted-foreground border-b border-border">
          <th className="text-left px-4 py-2 font-normal">Coin</th>
          <th className="text-right px-4 py-2 font-normal">Amount</th>
          <th className="text-left px-4 py-2 font-normal">Network</th>
          <th className="text-right px-4 py-2 font-normal">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 50).map((r: any, i: number) => (
          <tr key={r.id ?? i} className="border-b border-border/50 hover:bg-accent/30">
            <td className="px-4 py-2 font-medium text-foreground">{r.coin ?? r.asset ?? "—"}</td>
            <td className="px-4 py-2 text-right font-mono-num">{r.amount ?? "—"}</td>
            <td className="px-4 py-2 text-muted-foreground">{r.network ?? r.chain ?? "—"}</td>
            <td className="px-4 py-2 text-right text-muted-foreground">{r.status ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Wallet signing gate (shown before deposit/withdraw when wallet not yet activated) ──
function WalletSigningGate() {
  const {
    activeTab, walletLoading, userEvmWallet, walletPassword, setWalletPassword,
    showPassword, setShowPassword, registerMutation, signingStep, onOpenChange,
  } = useAccountModal();
  const [localShow, setLocalShow] = useState(false);

  const action = activeTab === "withdraw" ? "Withdraw" : "Deposit";

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Activate Wallet</h2>
        <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Context */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-4 mb-5 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          To {action.toLowerCase()} funds, enter your wallet password once to sign and activate your
          personal deposit address. No funds will be moved.
        </p>
      </div>

      {/* Password input */}
      {walletLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading wallet…</span>
        </div>
      ) : !userEvmWallet ? (
        <div className="flex items-start gap-2 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>No EVM wallet found. Create one in your Wallet first.</span>
        </div>
      ) : (
        <div className="relative mb-5">
          <input
            type={showPassword || localShow ? "text" : "password"}
            placeholder="Wallet password"
            value={walletPassword}
            onChange={e => setWalletPassword(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && walletPassword && !registerMutation.isPending) {
                registerMutation.mutate();
              }
            }}
            className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => { setLocalShow(v => !v); setShowPassword(v => !v); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword || localShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Sign button */}
      <button
        onClick={() => registerMutation.mutate()}
        disabled={!walletPassword || !userEvmWallet || walletLoading || registerMutation.isPending}
        className="w-full py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {registerMutation.isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" />{signingStep || "Signing…"}</>
          : `Sign & Continue to ${action}`}
      </button>
    </div>
  );
}

// ── Inner modal content ───────────────────────────────────
function ModalContent() {
  const { activeTab, handleTabChange, isAsterRegistered, user, unlinkMutation, onOpenChange, setTxHistoryOpen } = useAccountModal();

  // Show focused signing gate when user is logged in but wallet not yet activated
  if (user && !isAsterRegistered) {
    return <WalletSigningGate />;
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          {isAsterRegistered && (
            <button
              onClick={() => unlinkMutation.mutate()}
              disabled={unlinkMutation.isPending}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Unlink wallet and re-activate"
            >
              {unlinkMutation.isPending ? "Unlinking…" : "Re-link"}
            </button>
          )}
        </div>
        <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 text-sm">
          {(["deposit", "withdraw", "transfer"] as const).map((tab, i) => (
            <div key={tab} className="flex items-center">
              {i > 0 && <span className="text-muted-foreground/40 mx-2">|</span>}
              <button
                onClick={() => handleTabChange(tab)}
                className={`capitalize font-medium transition-colors ${activeTab === tab ? "text-foreground" : "text-muted-foreground"}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setTxHistoryOpen(true)} title="Transaction history"
          className="text-muted-foreground hover:text-foreground transition-colors">
          <ClipboardList className="h-5 w-5" />
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "deposit"  && <DepositTab />}
      {activeTab === "withdraw" && <WithdrawTab />}
      {activeTab === "transfer" && <TransferTab />}
    </>
  );
}

// ── Public component ──────────────────────────────────────
export function AccountModal(props: AccountModalProps) {
  const { open, onOpenChange, variant = "sheet" } = props;
  return (
    <AccountModalProvider {...props}>
      {variant === "dialog" ? (
        <>
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border border-border rounded-2xl px-5 pb-8 pt-5 max-w-md w-full max-h-[90vh] overflow-y-auto [&>button.absolute]:hidden">
              <DialogHeader className="sr-only"><DialogTitle>Account</DialogTitle></DialogHeader>
              <ModalContent />
            </DialogContent>
          </Dialog>
          <TxHistoryDialog />
        </>
      ) : (
        <>
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom"
              className="bg-card border-t border-border rounded-t-2xl px-5 pb-10 pt-5 max-h-[90vh] overflow-y-auto">
              <SheetHeader className="sr-only"><SheetTitle>Account</SheetTitle></SheetHeader>
              <ModalContent />
            </SheetContent>
          </Sheet>
          <TxHistoryDialog />
        </>
      )}
    </AccountModalProvider>
  );
}
