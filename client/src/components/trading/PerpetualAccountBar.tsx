import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { AccountModal } from "./AccountModal";

const PerpetualAccountBar = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");

  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: futuresBalance, isLoading } = useQuery({
    queryKey: ["futures-balance"],
    queryFn: () => asterTrading.futuresBalance(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const usdtFutures = Array.isArray(futuresBalance)
    ? futuresBalance.find((b: any) => b.asset === "USDT")
    : null;

  const displayBalance = user
    ? isLoading ? "..." : `${parseFloat(usdtFutures?.availableBalance ?? "0").toFixed(2)} USDT`
    : "--";

  const openModal = (tab: "deposit" | "withdraw" | "transfer") => {
    if (!user) { navigate("/signin"); return; }
    setDefaultTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between h-12 px-4 border-y border-border bg-card">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Perpetual Acct.</span>
          <span className="text-foreground font-mono-num">{displayBalance}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal("deposit")}
            className="px-4 py-1.5 rounded text-sm text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
          >
            Deposit
          </button>
          <button
            onClick={() => openModal("transfer")}
            className="px-4 py-1.5 rounded text-sm text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
          >
            Transfer
          </button>
        </div>
      </div>

      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultTab={defaultTab}
        defaultAccountType="Perpetual account"
      />
    </>
  );
};

export default PerpetualAccountBar;
