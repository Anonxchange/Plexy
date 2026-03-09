import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, ChevronDown, ClipboardList } from "lucide-react";

const AccountBar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");

  const openSheet = (tab: "deposit" | "withdraw") => {
    setActiveTab(tab);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between h-12 px-4 border-y border-border bg-card">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Spot Acct.</span>
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
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
            <button onClick={() => setSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1 text-sm">
              {(["deposit", "withdraw", "transfer"] as const).map((tab, i) => (
                <div key={tab} className="flex items-center">
                  {i > 0 && <span className="text-muted-foreground/40 mx-2">|</span>}
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`capitalize font-medium ${
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

          {/* Account selector */}
          <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-4">
            <span className="text-sm text-foreground">Spot account</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Network selector */}
          <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">
                ETH
              </div>
              <span className="text-sm text-foreground">Ethereum</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Amount input */}
          <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Amount</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground">₮</span>
              </div>
              <span className="text-sm text-foreground">USDT</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-sm text-muted-foreground">--</span>
          </div>

          {/* Connect button */}
          <button className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90">
            Connect
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AccountBar;
