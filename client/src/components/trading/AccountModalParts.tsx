import { ChevronDown, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAccountModal } from "./AccountModalContext";
import { ChainIcon, CoinIcon } from "./AccountModalIcons";
import { CHAIN_MAP, ACCOUNT_TYPES } from "./AccountModalConfig";

// ── Account type dropdown ─────────────────────────────────
export function AccountTypeSelector() {
  const { accountType, accountTypeOpen, setAccountTypeOpen, handleAccountTypeChange } = useAccountModal();
  return (
    <div className="relative mb-3">
      <button
        onClick={() => setAccountTypeOpen(v => !v)}
        className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full bg-card"
      >
        <span className="text-sm text-foreground">{accountType}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${accountTypeOpen ? "rotate-180" : ""}`} />
      </button>
      {accountTypeOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-xl">
          {ACCOUNT_TYPES.map(t => (
            <button key={t} onClick={() => handleAccountTypeChange(t)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors ${t === accountType ? "text-primary" : "text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chain / network dropdown ──────────────────────────────
export function ChainSelector() {
  const { network, chainOpen, setChainOpen, handleNetworkChange, availableNetworks } = useAccountModal();
  return (
    <div className="relative mb-3">
      <button
        onClick={() => setChainOpen(v => !v)}
        className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full bg-card"
      >
        <div className="flex items-center gap-3">
          <ChainIcon chainKey={network} size={24} />
          <span className="text-sm text-foreground">{CHAIN_MAP[network]?.name ?? network}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${chainOpen ? "rotate-180" : ""}`} />
      </button>
      {chainOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-xl">
          {availableNetworks.map(n => (
            <button key={n} onClick={() => handleNetworkChange(n)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm hover:bg-accent transition-colors ${n === network ? "text-primary" : "text-foreground"}`}>
              <ChainIcon chainKey={n} size={20} />
              {CHAIN_MAP[n]?.name ?? n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Standalone coin picker (no amount input) ──────────────
export function CoinSelector() {
  const { coin, coinOpen, setCoinOpen, handleCoinChange, selectedCoinInfo, selectorCoins, chainAssetsStale, activeTab, network } = useAccountModal();
  return (
    <div className="relative mb-3">
      <button
        onClick={() => setCoinOpen(v => !v)}
        className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full bg-card"
      >
        <div className="flex items-center gap-3">
          <CoinIcon symbol={coin} size={24} />
          <div className="text-left">
            <span className="text-sm text-foreground font-medium">{coin}</span>
            {selectedCoinInfo?.name && (
              <span className="text-xs text-muted-foreground ml-2">{selectedCoinInfo.name}</span>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${coinOpen ? "rotate-180" : ""}`} />
      </button>
      {coinOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-xl max-h-52 overflow-y-auto">
          {chainAssetsStale && activeTab === "deposit" ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading coins for {CHAIN_MAP[network]?.name ?? network}…</span>
            </div>
          ) : selectorCoins.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">No coins available</div>
          ) : (
            selectorCoins.map(c => (
              <button key={c.coin} onClick={() => handleCoinChange(c.coin)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-primary" : "text-foreground"}`}>
                <CoinIcon symbol={c.coin} size={20} />
                <span className="font-medium">{c.coin}</span>
                <span className="text-muted-foreground text-xs ml-auto">{c.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Combined coin + amount row ────────────────────────────
export function CoinAmountRow({ showMax = false }: { showMax?: boolean }) {
  const { coin, coinOpen, setCoinOpen, handleCoinChange, handleMax, amount, setAmount, selectorCoins, chainAssetsStale, activeTab } = useAccountModal();
  return (
    <div className="relative mb-1">
      <div className="border border-border rounded-lg px-4 py-3 flex items-center bg-card">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {showMax && (
            <button onClick={handleMax} className="text-xs text-primary font-semibold mr-1">MAX</button>
          )}
          <button onClick={() => setCoinOpen(v => !v)} className="flex items-center gap-1.5">
            <CoinIcon symbol={coin} size={22} />
            <span className="text-sm text-foreground font-medium">{coin}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
      {coinOpen && (
        <div className="absolute z-50 right-0 w-56 mt-1 rounded-lg border border-border bg-card shadow-xl max-h-52 overflow-y-auto">
          {chainAssetsStale && (activeTab === "deposit" || activeTab === "withdraw") ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Loading coins…</span>
            </div>
          ) : selectorCoins.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">No coins available</div>
          ) : (
            selectorCoins.map(c => (
              <button key={c.coin} onClick={() => handleCoinChange(c.coin)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-primary" : "text-foreground"}`}>
                <CoinIcon symbol={c.coin} size={18} />
                <span className="font-medium">{c.coin}</span>
                <span className="text-muted-foreground text-xs ml-auto">{c.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Balance label row ─────────────────────────────────────
export function BalanceLine({ label = "Balance", value }: { label?: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-1 mb-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground font-mono-num">{value}</span>
    </div>
  );
}

// ── Registration password form ────────────────────────────
export function RegistrationBlock() {
  const { walletLoading, userEvmWallet, walletPassword, setWalletPassword, showPassword, setShowPassword } = useAccountModal();
  return (
    <div className="border border-border rounded-lg px-4 py-4 mb-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          A one-time verification is needed to activate your personal deposit address.
          Enter your wallet password below — no funds will be moved.
        </p>
      </div>
      {walletLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Loading wallet…</span>
        </div>
      ) : !userEvmWallet ? (
        <p className="text-xs text-destructive">No EVM wallet found. Please create one in your Wallet first.</p>
      ) : (
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Wallet password"
            value={walletPassword}
            onChange={e => setWalletPassword(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Deposit address gate (registration wall or error) ─────
export function DepositAddressBlock() {
  const { user, isAsterRegistered, depositError } = useAccountModal();
  if (!user) return null;
  if (!isAsterRegistered) return <RegistrationBlock />;
  if (depositError) {
    return (
      <div className="flex items-center gap-2 mb-4 text-xs text-destructive">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Could not load deposit address. Please try again.</span>
      </div>
    );
  }
  return null;
}

// ── Deposit CTA (sign-in / sign & activate / nothing) ────
export function DepositCTA() {
  const { user, isAsterRegistered, walletLoading, userEvmWallet, walletPassword, registerMutation, requireAuth } = useAccountModal();
  if (!user) return (
    <button onClick={requireAuth}
      className="w-full py-3.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
      Sign in to Deposit
    </button>
  );
  if (!isAsterRegistered) {
    if (walletLoading) return (
      <button disabled className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />Loading wallet…
      </button>
    );
    if (!userEvmWallet) return (
      <button disabled className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground">
        No EVM wallet found
      </button>
    );
    return (
      <button
        onClick={() => registerMutation.mutate()}
        disabled={!walletPassword || registerMutation.isPending}
        className="w-full py-3.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {registerMutation.isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" />Signing…</>
          : "Sign & Activate"}
      </button>
    );
  }
  return null;
}

// ── Sign-and-send block (post-registration one-click deposit) ──
export function SendFromWalletBlock() {
  const {
    isAsterRegistered, network, userSolWallet, userEvmWallet,
    sendTxHash, sendTxUrl, depositBusy, depositAddress, sendError,
    sendPassword, setSendPassword, showSendPwd, setShowSendPwd,
    handleSendFromWallet, sendLoading, amount, coin,
  } = useAccountModal();

  if (!isAsterRegistered) return null;
  const wallet = network === "SOL" ? userSolWallet : userEvmWallet;

  if (sendTxHash) {
    return (
      <div className="border border-trading-green/30 bg-trading-green/5 rounded-lg px-4 py-4 mb-4">
        <p className="text-xs text-trading-green font-medium mb-1">Deposit sent successfully</p>
        <p className="text-xs text-muted-foreground mb-2">
          Your transaction has been broadcast. It will credit once confirmed on-chain.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground font-mono truncate">{sendTxHash.slice(0, 20)}…</span>
          {sendTxUrl && (
            <a href={sendTxUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary underline shrink-0">View on explorer</a>
          )}
        </div>
      </div>
    );
  }

  if (depositBusy || !depositAddress) {
    return (
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Loading deposit address…</span>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex items-center gap-2 mb-4 text-xs text-destructive">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>No {network === "SOL" ? "Solana" : "EVM"} wallet found. Create one in Wallet first.</span>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg px-4 py-4 mb-4 space-y-3">
      <p className="text-xs font-medium text-foreground">Sign & Send</p>
      <p className="text-xs text-muted-foreground">
        Enter your wallet password to sign and broadcast the deposit directly.
      </p>
      {sendError && (
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span>{sendError}</span>
        </div>
      )}
      <div className="relative">
        <input
          type={showSendPwd ? "text" : "password"}
          placeholder="Wallet password"
          value={sendPassword}
          onChange={e => setSendPassword(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button type="button" onClick={() => setShowSendPwd(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {showSendPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <button
        onClick={handleSendFromWallet}
        disabled={!sendPassword || !amount || Number(amount) <= 0 || sendLoading}
        className="w-full py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {sendLoading
          ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
          : `Send ${amount || "0"} ${coin}`}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        Sending from{" "}
        <span className="font-mono text-foreground">
          {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
        </span>
      </p>
    </div>
  );
}
