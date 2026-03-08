const AccountBar = () => {
  return (
    <div className="flex items-center justify-between h-12 px-4 border-y border-border bg-card">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Spot Acct.</span>
        <span className="text-foreground">--</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-4 py-1.5 rounded text-sm text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15">
          Deposit
        </button>
        <button className="px-4 py-1.5 rounded text-sm text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15">
          Transfer
        </button>
      </div>
    </div>
  );
};

export default AccountBar;
