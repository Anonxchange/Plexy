import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X, ChevronDown, ClipboardList } from "lucide-react";

const PerpetualAccountBar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "history">("deposit");

  const openSheet = (tab: "deposit" | "withdraw") => {
    setActiveTab(tab);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between h-12 px-4 border-y border-border bg-card">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Perpetual Acct.</span>
          <span className="text-foreground">--</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openSheet("deposit")}
            className="px-4 py-1.5 rounded text-sm text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
          >
            Deposit
          </button>
          <button
            onClick={() => openSheet("withdraw")}
            className="px-4 py-1.5 rounded text-sm text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
          >
            Withdraw
          </button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-t border-border rounded-t-2xl px-5 pb-8 pt-5 max-h-[85vh]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Perpetual Account</h2>
            <button onClick={() => setSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1 text-sm">
              {(["deposit", "withdraw", "history"] as const).map((tab, i) => (
                <div key={tab} className="flex items-center">
                  {i > 0 && <span className="text-muted-foreground/40 mx-2">|</span>}
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`font-medium capitalize ${
                      activeTab === tab ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </div>
              ))}
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          {activeTab === "history" ? (
            <div className="flex flex-col items-center py-10">
              <span className="text-sm text-muted-foreground">No transfer history</span>
            </div>
          ) : (
            <>
              {/* From / To accounts */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 border border-border rounded-lg px-4 py-3">
                  <div className="text-[10px] text-muted-foreground mb-0.5">
                    {activeTab === "deposit" ? "From" : "To"}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Spot account</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 border border-border rounded-lg px-4 py-3">
                  <div className="text-[10px] text-muted-foreground mb-0.5">
                    {activeTab === "deposit" ? "To" : "From"}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Perpetual account</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Asset selector */}
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Asset</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-[10px] font-bold text-foreground">₮</span>
                  </div>
                  <span className="text-sm text-foreground">USDT</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Amount input */}
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-2">
                <input
                  type="text"
                  placeholder="Amount"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button className="text-xs text-trading-amber font-semibold ml-2 shrink-0">MAX</button>
              </div>

              {/* Balance row */}
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs text-muted-foreground">
                  Available ({activeTab === "deposit" ? "Spot" : "Perpetual"})
                </span>
                <span className="text-xs text-foreground font-mono-num">0.00 USDT</span>
              </div>

              {/* Futures account overview */}
              <div className="bg-secondary rounded-lg p-3 mb-5">
                <div className="text-xs text-muted-foreground font-medium mb-2">Perpetual overview</div>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                  <span className="text-muted-foreground">Margin Balance</span>
                  <span className="text-foreground font-mono-num text-right">0.00 USDT</span>
                  <span className="text-muted-foreground">Unrealized PnL</span>
                  <span className="text-foreground font-mono-num text-right">0.00 USDT</span>
                  <span className="text-muted-foreground">Available Margin</span>
                  <span className="text-foreground font-mono-num text-right">0.00 USDT</span>
                  <span className="text-muted-foreground">Margin Ratio</span>
                  <span className="text-foreground font-mono-num text-right">--%</span>
                </div>
              </div>

              {/* CTA button */}
              <button className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90">
                Connect
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PerpetualAccountBar;
