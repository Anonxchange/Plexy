import { useState, useMemo, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  X, ChevronDown, ClipboardList, Copy, Check, Loader2, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading, asterWallet, asterGetNonce, asterCreateApiKey, CoinInfo } from "@/lib/asterdex-service";
import { nonCustodialWalletManager, NonCustodialWallet } from "@/lib/non-custodial-wallet";
import { signEVMMessage } from "@/lib/evmSigner";
import { useToast } from "@/hooks/use-toast";

// ── Chain config ─────────────────────────────────────────
const CHAINS = [
  { key: "BSC", name: "BNB Chain",     chainId: 56,    color: "#F3BA2F" },
  { key: "ETH", name: "Ethereum",       chainId: 1,     color: "#627EEA" },
  { key: "ARB", name: "Arbitrum One",  chainId: 42161, color: "#12AAFF" },
  { key: "SOL", name: "Solana",         chainId: 101,   color: "#9945FF" },
] as const;

const CHAIN_MAP = Object.fromEntries(CHAINS.map(c => [c.key, c]));

const ACCOUNT_TYPES = ["Spot account", "Perpetual account"] as const;
type AccountType = typeof ACCOUNT_TYPES[number];

const FALLBACK_COINS: CoinInfo[] = [
  { coin: "USDT", name: "Tether", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "2",      withdrawMin: "10",    depositMin: "10"   },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "SOL", withdrawEnable: true, depositEnable: true, withdrawFee: "0.2",    withdrawMin: "2",     depositMin: "2"    },
  ]},
  { coin: "USDC", name: "USD Coin", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "2",      withdrawMin: "10",    depositMin: "10"   },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "SOL", withdrawEnable: true, depositEnable: true, withdrawFee: "0.2",    withdrawMin: "2",     depositMin: "2"    },
  ]},
  { coin: "ETH",  name: "Ethereum", free: "0", locked: "0", networkList: [
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
  ]},
  { coin: "BNB",  name: "BNB", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
  ]},
  { coin: "BTC",  name: "Bitcoin", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.0001", withdrawMin: "0.001", depositMin: "0.001" },
  ]},
];

function asterRegKey(userId: string) { return `aster_reg_${userId}`; }

// ── Props ────────────────────────────────────────────────
interface AccountModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab: "deposit" | "withdraw" | "transfer";
  defaultAccountType: AccountType;
}

// ── Chain icon ────────────────────────────────────────────
function ChainIcon({ chainKey, size = 22 }: { chainKey: string; size?: number }) {
  const c = CHAIN_MAP[chainKey];
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-black"
      style={{ width: size, height: size, background: c?.color ?? "#888", fontSize: size * 0.38 }}
    >
      {c?.name.slice(0, 1) ?? "?"}
    </span>
  );
}

// ── Main component ────────────────────────────────────────
export function AccountModal({ open, onOpenChange, defaultTab, defaultAccountType }: AccountModalProps) {
  const [activeTab, setActiveTab]         = useState<"deposit" | "withdraw" | "transfer">(defaultTab);
  const [accountType, setAccountType]     = useState<AccountType>(defaultAccountType);
  const [accountTypeOpen, setAccountTypeOpen] = useState(false);
  const [coin, setCoin]                   = useState("USDT");
  const [network, setNetwork]             = useState("BSC");
  const [chainOpen, setChainOpen]         = useState(false);
  const [coinOpen, setCoinOpen]           = useState(false);
  const [amount, setAmount]               = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [copied, setCopied]               = useState(false);

  // Wallet registration state (needed once per user for AsterDEX API access)
  const [isAsterRegistered, setIsAsterRegistered] = useState(false);
  const [userEvmWallet, setUserEvmWallet]   = useState<NonCustodialWallet | null>(null);
  const [walletLoading, setWalletLoading]   = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSpot = accountType === "Spot account";

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setAccountType(defaultAccountType);
      setAmount("");
      setWithdrawAddress("");
      setWalletPassword("");
      setCoinOpen(false);
      setChainOpen(false);
      setAccountTypeOpen(false);
    }
  }, [open, defaultTab, defaultAccountType]);

  // Load registration state from localStorage
  useEffect(() => {
    if (user) {
      setIsAsterRegistered(localStorage.getItem(asterRegKey(user.id)) === "true");
    }
  }, [user]);

  // Auto-load EVM wallet when registration is needed (deposit address fetch failed)
  const loadEvmWallet = useCallback(async () => {
    if (!user || isAsterRegistered) return;
    setWalletLoading(true);
    try {
      const wallets: NonCustodialWallet[] = await nonCustodialWalletManager.getWalletsFromStorage(user.id);
      const evm = wallets.find(w =>
        ["ethereum", "eth", "bsc", "bnb", "binance", "arb", "arbitrum"].some(k =>
          w.chainId.toLowerCase().includes(k)
        ) && w.address.startsWith("0x")
      );
      setUserEvmWallet(evm ?? null);
    } catch {
      setUserEvmWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, [user, isAsterRegistered]);

  // ── Registration mutation ─────────────────────────────
  // Docs confirm: deposit address is USER_DATA — needs API key created once per user.
  // This runs automatically when the deposit address fetch fails for unregistered users.
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!userEvmWallet || !user) throw new Error("No EVM wallet found. Create one in Wallet first.");
      if (!walletPassword) throw new Error("Enter your wallet password to sign.");
      const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(userEvmWallet.id, walletPassword, user.id);
      if (!mnemonic) throw new Error("Incorrect password or wallet not found.");
      const nonce = await asterGetNonce(userEvmWallet.address);
      const message = `You are signing into Astherus ${nonce}`;
      const signature = await signEVMMessage(mnemonic, message);
      const chainId = CHAIN_MAP[network]?.chainId ?? 56;
      await asterCreateApiKey(userEvmWallet.address, signature, chainId);
    },
    onSuccess: () => {
      if (user) localStorage.setItem(asterRegKey(user.id), "true");
      setIsAsterRegistered(true);
      setWalletPassword("");
      toast({ title: "Wallet linked", description: "Your deposit address is ready." });
      queryClient.invalidateQueries({ queryKey: ["deposit-address"] });
    },
    onError: (err: Error) => {
      toast({ title: "Sign-in failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Queries ───────────────────────────────────────────
  const { data: spotAccount, isLoading: spotLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: futuresBalance, isLoading: futuresLoading } = useQuery({
    queryKey: ["futures-balance"],
    queryFn: () => asterTrading.futuresBalance(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: coinInfoData } = useQuery({
    queryKey: ["coin-info"],
    queryFn: () => asterWallet.coinInfo(),
    enabled: !!user && open,
    staleTime: 60_000,
    retry: 1,
  });

  // Deposit address — auto-fetched when logged in.
  // If it fails (user not yet registered with AsterDEX), the error triggers the sign flow.
  const { data: depositData, isLoading: depositLoading, error: depositError } = useQuery({
    queryKey: ["deposit-address", coin, network],
    queryFn: () => asterWallet.depositAddress(coin, network),
    enabled: !!user && open && activeTab === "deposit" && isSpot,
    staleTime: 300_000,
    retry: false,
    // When it errors, automatically start loading the user's wallet so the sign flow appears
    meta: { onError: () => loadEvmWallet() },
  });

  // Trigger wallet load whenever deposit fails for an unregistered user
  useEffect(() => {
    if (depositError && !isAsterRegistered && user) {
      loadEvmWallet();
    }
  }, [depositError, isAsterRegistered, user, loadEvmWallet]);

  const { data: feeEstimate, isLoading: feeLoading } = useQuery({
    queryKey: ["withdraw-fee", coin, network],
    queryFn: () => asterWallet.withdrawFeeEstimate(coin, network),
    enabled: !!user && open && activeTab === "withdraw" && isSpot,
    staleTime: 30_000,
    retry: 1,
  });

  // ── Derived data ──────────────────────────────────────
  const coins: CoinInfo[] = useMemo(() => {
    if (Array.isArray(coinInfoData) && coinInfoData.length > 0) return coinInfoData;
    return FALLBACK_COINS;
  }, [coinInfoData]);

  const selectedCoinInfo = useMemo(() => coins.find(c => c.coin === coin) ?? coins[0], [coins, coin]);

  const availableNetworks = useMemo(() => {
    const list = activeTab === "withdraw"
      ? selectedCoinInfo?.networkList.filter(n => n.withdrawEnable)
      : selectedCoinInfo?.networkList.filter(n => n.depositEnable);
    return list?.map(n => n.network) ?? ["BSC"];
  }, [selectedCoinInfo, activeTab]);

  const selectedNetworkInfo = useMemo(() =>
    selectedCoinInfo?.networkList.find(n => n.network === network),
    [selectedCoinInfo, network]
  );

  const spotBalanceFor = (asset: string) =>
    spotAccount?.balances
      ? parseFloat(spotAccount.balances.find((b: any) => b.asset === asset)?.free ?? "0")
      : 0;

  const futuresAvailFor = (asset: string) =>
    Array.isArray(futuresBalance)
      ? parseFloat(futuresBalance.find((b: any) => b.asset === asset)?.availableBalance ?? "0")
      : 0;

  const usdtSpot    = spotBalanceFor("USDT");
  const usdtFutures = futuresAvailFor("USDT");

  const headerBalance = isSpot
    ? spotLoading ? "..." : `${usdtSpot.toFixed(2)} USDT`
    : futuresLoading ? "..." : `${usdtFutures.toFixed(2)} USDT`;

  // Balance shown under amount input
  const currentBalance = (() => {
    if (!isSpot && activeTab === "deposit") return spotBalanceFor(coin);   // transferring FROM spot
    if (!isSpot && activeTab === "withdraw") return futuresAvailFor(coin); // transferring FROM futures
    return spotBalanceFor(coin);
  })();

  const depositAddress: string = (depositData as any)?.address ?? "";
  const depositMemo: string    = (depositData as any)?.tag ?? (depositData as any)?.memo ?? "";

  const liveFee        = feeEstimate?.gasCost ? String(feeEstimate.gasCost) : null;
  const resolvedFee    = liveFee ?? selectedNetworkInfo?.withdrawFee ?? "0";
  const resolvedFeeNum = parseFloat(resolvedFee);
  const amountNum      = parseFloat(amount) || 0;
  const withdrawMin    = parseFloat(selectedNetworkInfo?.withdrawMin ?? "0");
  const youReceive     = Math.max(0, amountNum - resolvedFeeNum);

  // ── Mutations ─────────────────────────────────────────
  const withdrawMutation = useMutation({
    mutationFn: () => asterWallet.withdraw(coin, withdrawAddress, amount, network, resolvedFee),
    onSuccess: () => {
      toast({ title: "Withdrawal submitted", description: `${amount} ${coin} is being processed.` });
      setWithdrawAddress("");
      setAmount("");
      onOpenChange(false);
    },
    onError: (err: Error) => toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" }),
  });

  const transferMutation = useMutation({
    mutationFn: () => {
      const type = (activeTab === "deposit" && !isSpot) || (activeTab === "transfer" && isSpot)
        ? "SPOT_TO_FUTURES"
        : "FUTURES_TO_SPOT";
      return asterWallet.transfer(coin, amount, type);
    },
    onSuccess: () => {
      const toAccount = (activeTab === "deposit" && !isSpot) || (activeTab === "transfer" && isSpot)
        ? "Perpetual"
        : "Spot";
      toast({ title: "Transfer successful", description: `${amount} ${coin} transferred to ${toAccount} account.` });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["futures-balance"] });
      queryClient.invalidateQueries({ queryKey: ["futures-account"] });
      queryClient.invalidateQueries({ queryKey: ["spot-account"] });
    },
    onError: (err: Error) => toast({ title: "Transfer failed", description: err.message, variant: "destructive" }),
  });

  // ── Handlers ─────────────────────────────────────────
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabChange = (tab: "deposit" | "withdraw" | "transfer") => {
    setActiveTab(tab);
    setAmount("");
    setWithdrawAddress("");
    setCoinOpen(false);
    setChainOpen(false);
    setAccountTypeOpen(false);
  };

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    setAccountTypeOpen(false);
    setAmount("");
  };

  const handleNetworkChange = (n: string) => {
    setNetwork(n);
    setChainOpen(false);
    setAmount("");
  };

  const handleCoinChange = (c: string) => {
    const info = coins.find(ci => ci.coin === c);
    const nets = (activeTab === "withdraw"
      ? info?.networkList.filter(n => n.withdrawEnable)
      : info?.networkList.filter(n => n.depositEnable)
    )?.map(n => n.network);
    setCoin(c);
    setNetwork(nets?.[0] ?? "BSC");
    setCoinOpen(false);
    setAmount("");
  };

  const handleMax = () => {
    const max = activeTab === "withdraw"
      ? Math.max(0, currentBalance - resolvedFeeNum)
      : currentBalance;
    setAmount(coin === "BTC" ? max.toFixed(8) : max.toFixed(4));
  };

  // Guard: redirect to sign in if not logged in
  const requireAuth = () => {
    if (!user) { navigate("/signin"); onOpenChange(false); }
  };

  // ── Reusable sub-components ───────────────────────────

  const AccountTypeSelector = () => (
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
              className={`w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors ${t === accountType ? "text-trading-amber" : "text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const ChainSelector = () => (
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
              className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm hover:bg-accent transition-colors ${n === network ? "text-trading-amber" : "text-foreground"}`}>
              <ChainIcon chainKey={n} size={20} />
              {CHAIN_MAP[n]?.name ?? n}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const CoinAmountRow = ({ showMax = false }: { showMax?: boolean }) => (
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
            <button onClick={handleMax} className="text-xs text-trading-amber font-semibold mr-1">MAX</button>
          )}
          <button
            onClick={() => setCoinOpen(v => !v)}
            className="flex items-center gap-1.5"
          >
            <div className="w-6 h-6 rounded-full bg-trading-amber/20 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-trading-amber">{coin.slice(0, 2)}</span>
            </div>
            <span className="text-sm text-foreground font-medium">{coin}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
      {coinOpen && (
        <div className="absolute z-50 right-0 w-48 mt-1 rounded-lg border border-border bg-card shadow-xl max-h-48 overflow-y-auto">
          {coins.map(c => (
            <button key={c.coin} onClick={() => handleCoinChange(c.coin)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-trading-amber" : "text-foreground"}`}>
              {c.coin} <span className="text-muted-foreground text-xs ml-1">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const BalanceLine = ({ label = "Balance", value }: { label?: string; value: string }) => (
    <div className="flex items-center justify-between px-1 mb-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground font-mono-num">{value}</span>
    </div>
  );

  // ── Render ────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-t border-border rounded-t-2xl px-5 pb-10 pt-5 max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Account</SheetTitle>
        </SheetHeader>

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Tabs ── */}
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
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* ══════════════ DEPOSIT ══════════════ */}
        {activeTab === "deposit" && (
          <>
            <AccountTypeSelector />

            {/* Spot deposit: chain + address auto-loaded from session */}
            {isSpot && (
              <>
                <ChainSelector />
                <CoinAmountRow />
                <BalanceLine value={`${spotBalanceFor(coin).toFixed(4)} ${coin}`} />

                {/* Deposit address — auto-loads when logged in */}
                {depositLoading ? (
                  <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading deposit address…</span>
                  </div>
                ) : depositAddress ? (
                  <div className="border border-trading-green/30 bg-trading-green/5 rounded-lg px-4 py-3 mb-4">
                    <div className="text-xs text-trading-green mb-1 font-medium">
                      Deposit address · {CHAIN_MAP[network]?.name ?? network}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground font-mono break-all">{depositAddress}</span>
                      <button onClick={() => handleCopy(depositAddress)} className="shrink-0 text-muted-foreground hover:text-foreground ml-2">
                        {copied ? <Check className="h-3.5 w-3.5 text-trading-green" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {depositMemo && (
                      <div className="mt-2 pt-2 border-t border-trading-green/20">
                        <p className="text-xs text-trading-amber font-medium">Memo required</p>
                        <p className="text-xs text-foreground font-mono mt-0.5">{depositMemo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Include this memo or funds may be lost.</p>
                      </div>
                    )}
                    {selectedNetworkInfo?.depositMin && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Min. deposit: {selectedNetworkInfo.depositMin} {coin}
                      </p>
                    )}
                  </div>
                ) : depositError && user ? (
                  /* ── One-time wallet sign flow (triggered automatically on error) ── */
                  <div className="border border-border rounded-lg px-4 py-4 mb-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-trading-amber shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        A one-time verification is needed to activate your deposit address.
                        Enter your wallet password below — no funds will be moved.
                      </p>
                    </div>
                    {walletLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading wallet…</span>
                      </div>
                    ) : !userEvmWallet ? (
                      <p className="text-xs text-destructive">
                        No EVM wallet found. Please create one in your Wallet first.
                      </p>
                    ) : (
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Wallet password"
                          value={walletPassword}
                          onChange={e => setWalletPassword(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-trading-amber/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Deposit CTA */}
                {!user ? (
                  <button
                    onClick={requireAuth}
                    className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-amber text-background hover:bg-trading-amber/90"
                  >
                    Sign in to Deposit
                  </button>
                ) : depositAddress ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground"
                  >
                    Send {coin} to the address above
                  </button>
                ) : depositError && userEvmWallet ? (
                  <button
                    onClick={() => registerMutation.mutate()}
                    disabled={!walletPassword || registerMutation.isPending}
                    className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {registerMutation.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Signing…</>
                      : "Sign & Generate Address"}
                  </button>
                ) : depositLoading ? null : (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground"
                  >
                    Loading…
                  </button>
                )}
              </>
            )}

            {/* Perpetual deposit — same on-chain deposit address as Spot */}
            {!isSpot && (
              <>
                <ChainSelector />
                <CoinAmountRow />
                <BalanceLine value={`${futuresAvailFor(coin).toFixed(4)} ${coin}`} />

                {depositLoading ? (
                  <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading deposit address…</span>
                  </div>
                ) : depositAddress ? (
                  <div className="border border-trading-amber/30 bg-trading-amber/5 rounded-lg px-4 py-3 mb-4">
                    <div className="text-xs text-trading-amber mb-1 font-medium">
                      Deposit address · {CHAIN_MAP[network]?.name ?? network}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground font-mono break-all">{depositAddress}</span>
                      <button onClick={() => handleCopy(depositAddress)} className="shrink-0 text-muted-foreground hover:text-foreground ml-2">
                        {copied ? <Check className="h-3.5 w-3.5 text-trading-amber" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {depositMemo && (
                      <div className="mt-2 pt-2 border-t border-trading-amber/20">
                        <p className="text-xs text-trading-amber font-medium">Memo required</p>
                        <p className="text-xs text-foreground font-mono mt-0.5">{depositMemo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Include this memo or funds may be lost.</p>
                      </div>
                    )}
                    {selectedNetworkInfo?.depositMin && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Min. deposit: {selectedNetworkInfo.depositMin} {coin}
                      </p>
                    )}
                  </div>
                ) : depositError && user ? (
                  <div className="border border-border rounded-lg px-4 py-4 mb-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-trading-amber shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        One-time wallet verification required to generate your deposit address.
                        This signs a message — no funds are moved.
                      </p>
                    </div>
                    {walletLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading wallet…</span>
                      </div>
                    ) : !userEvmWallet ? (
                      <p className="text-xs text-destructive">
                        No EVM wallet found. Please create one in your Wallet first.
                      </p>
                    ) : (
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Wallet password"
                          value={walletPassword}
                          onChange={e => setWalletPassword(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-trading-amber/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {!user ? (
                  <button
                    onClick={requireAuth}
                    className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-amber text-background hover:bg-trading-amber/90"
                  >
                    Sign in to Deposit
                  </button>
                ) : depositAddress ? (
                  <button disabled className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground">
                    Send {coin} to the address above
                  </button>
                ) : depositError && userEvmWallet ? (
                  <button
                    onClick={() => registerMutation.mutate()}
                    disabled={!walletPassword || registerMutation.isPending}
                    className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {registerMutation.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Signing…</>
                      : "Sign & Generate Address"}
                  </button>
                ) : depositLoading ? null : (
                  <button disabled className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground">
                    Loading…
                  </button>
                )}

                {/* Hint: use Transfer tab to move funds from Spot */}
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Already have funds in Spot?{" "}
                  <button
                    onClick={() => setActiveTab("transfer")}
                    className="text-trading-amber underline-offset-2 hover:underline"
                  >
                    Transfer instead
                  </button>
                </p>
              </>
            )}
          </>
        )}

        {/* ══════════════ WITHDRAW ══════════════ */}
        {activeTab === "withdraw" && (
          <>
            <AccountTypeSelector />

            {isSpot ? (
              <>
                <ChainSelector />

                <div className="border border-border rounded-lg px-4 py-3 mb-3 bg-card">
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={e => setWithdrawAddress(e.target.value)}
                    placeholder="Withdrawal address"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div className={`border rounded-lg px-4 py-3 flex items-center bg-card mb-1 ${amountNum > currentBalance || (amountNum > 0 && amountNum < withdrawMin) ? "border-destructive" : "border-border"}`}>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button onClick={handleMax} className="text-xs text-trading-amber font-semibold mx-2">MAX</button>
                  <div className="w-5 h-5 rounded-full bg-trading-amber/20 flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold text-trading-amber">{coin.slice(0, 2)}</span>
                  </div>
                  <span className="text-sm text-foreground ml-1">{coin}</span>
                </div>

                {amountNum > currentBalance && (
                  <p className="text-xs text-destructive px-1 mb-2">Exceeds available balance</p>
                )}
                {amountNum > 0 && amountNum < withdrawMin && (
                  <p className="text-xs text-destructive px-1 mb-2">Minimum withdrawal is {withdrawMin} {coin}</p>
                )}

                <BalanceLine value={`${currentBalance.toFixed(coin === "BTC" ? 8 : 4)} ${coin}`} />

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

                <button
                  onClick={() => !user ? requireAuth() : withdrawMutation.mutate()}
                  disabled={!user || !withdrawAddress || !amount || amountNum <= 0 || amountNum > currentBalance || (amountNum < withdrawMin && amountNum > 0) || withdrawMutation.isPending}
                  className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {withdrawMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</> : `Withdraw ${coin}`}
                </button>
              </>
            ) : (
              <>
                <CoinAmountRow showMax />
                <BalanceLine
                  label="Perpetual available"
                  value={`${futuresAvailFor(coin).toFixed(4)} ${coin}`}
                />
                <button
                  onClick={() => !user ? requireAuth() : transferMutation.mutate()}
                  disabled={!user || !amount || amountNum <= 0 || amountNum > futuresAvailFor(coin) || transferMutation.isPending}
                  className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {transferMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Transferring…</>
                    : "Transfer to Spot"}
                </button>
              </>
            )}
          </>
        )}

        {/* ══════════════ TRANSFER ══════════════ */}
        {activeTab === "transfer" && (
          <>
            <AccountTypeSelector />
            <CoinAmountRow showMax />
            <BalanceLine
              label={isSpot ? "Spot available" : "Perpetual available"}
              value={`${isSpot ? spotBalanceFor(coin) : futuresAvailFor(coin)} ${coin}`}
            />
            <button
              onClick={() => !user ? requireAuth() : transferMutation.mutate()}
              disabled={!user || !amount || amountNum <= 0 || transferMutation.isPending}
              className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {transferMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" />Transferring…</>
                : isSpot ? "Transfer to Perpetual" : "Transfer to Spot"}
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
