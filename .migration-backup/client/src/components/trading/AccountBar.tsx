import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";

const AccountModal = lazy(() =>
  import("./AccountModal").then((m) => ({ default: m.AccountModal }))
);

interface AccountBarProps {
  variant?: "bar" | "panel";
  pair?: string;
}

const AccountBar = ({ variant = "bar", pair }: AccountBarProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");

  const { user } = useAuth();
  const [, navigate] = useLocation();

  const baseAsset = pair ? pair.split("/")[0] : null;
  const quoteAsset = pair ? (pair.split("/")[1] || "USDT") : "USDT";

  const { data: spotAccount, isLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const getBalance = (asset: string) => {
    if (!spotAccount?.balances) return "—";
    const bal = spotAccount.balances.find((b: any) => b.asset === asset);
    return bal ? parseFloat(bal.free).toFixed(8) : "0.00000000";
  };

  const usdtBalance = spotAccount?.balances
    ? parseFloat(spotAccount.balances.find((b: any) => b.asset === "USDT")?.free ?? "0").toFixed(2)
    : null;

  const displayBalance = user
    ? isLoading ? "..." : `${usdtBalance ?? "0.00"} USDT`
    : "--";

  const openModal = (tab: "deposit" | "withdraw" | "transfer") => {
    if (!user) { navigate("/signin"); return; }
    setDefaultTab(tab);
    setModalOpen(true);
  };

  const actionBtnClass = "flex-1 py-1.5 rounded text-xs font-medium border transition-colors";
  const primaryAction = "text-foreground border-border bg-accent/40 hover:bg-accent";

  return (
    <>
      {variant === "panel" ? (
        <div className="flex flex-col p-3 gap-3">
          <span className="text-xs font-semibold text-foreground">Account</span>

          {user ? (
            <>
              <div className="flex items-center gap-1.5">
                {(["Deposit", "Withdraw", "Transfer"] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => openModal(label.toLowerCase() as "deposit" | "withdraw" | "transfer")}
                    className={`${actionBtnClass} ${primaryAction}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Spot overview
                </span>
                {baseAsset && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{baseAsset} Available</span>
                    <span className="text-xs font-mono-num text-foreground">
                      {isLoading ? "..." : getBalance(baseAsset)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{quoteAsset} Available</span>
                  <span className="text-xs font-mono-num text-foreground">
                    {isLoading ? "..." : getBalance(quoteAsset)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate("/signin")}
              className="w-full py-2 rounded text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Connect Wallet
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between h-9 px-3 border-y border-border bg-card">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">Spot Acct.</span>
            <span className="text-foreground font-mono-num">{displayBalance}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal("deposit")}
              className="px-3 py-[3px] rounded text-[11px] text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15 transition-colors"
            >
              Deposit
            </button>
            <button
              onClick={() => openModal("transfer")}
              className="px-3 py-[3px] rounded text-[11px] text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15 transition-colors"
            >
              Transfer
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <AccountModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          defaultTab={defaultTab}
          defaultAccountType="Spot account"
          variant="dialog"
        />
      </Suspense>
    </>
  );
};

export default AccountBar;
