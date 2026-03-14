import { useState, useMemo, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, ChevronDown, ClipboardList, Copy, Check, Loader2, AlertCircle, Wallet, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { asterTrading, asterWallet, asterGetNonce, asterCreateApiKey, CoinInfo } from "@/lib/asterdex-service";
import { nonCustodialWalletManager, NonCustodialWallet } from "@/lib/non-custodial-wallet";
import { signEVMMessage, signEVMTransaction, broadcastEVMTransaction } from "@/lib/evmSigner";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_COINS: CoinInfo[] = [
  { coin: "USDT", name: "Tether", free: "0", locked: "0", networkList: [
    { network: "BSC",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",  withdrawMin: "5",    depositMin: "5"    },
    { network: "ARB",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",  withdrawMin: "5",    depositMin: "5"    },
    { network: "ETH",  withdrawEnable: true, depositEnable: true, withdrawFee: "2",    withdrawMin: "10",   depositMin: "10"   },
    { network: "SOL",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.2",  withdrawMin: "2",    depositMin: "2"    },
  ]},
  { coin: "USDC", name: "USD Coin", free: "0", locked: "0", networkList: [
    { network: "BSC",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",  withdrawMin: "5",    depositMin: "5"    },
    { network: "ARB",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",  withdrawMin: "5",    depositMin: "5"    },
    { network: "ETH",  withdrawEnable: true, depositEnable: true, withdrawFee: "2",    withdrawMin: "10",   depositMin: "10"   },
    { network: "SOL",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.2",  withdrawMin: "2",    depositMin: "2"    },
  ]},
  { coin: "ETH", name: "Ethereum", free: "0", locked: "0", networkList: [
    { network: "ETH",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.001", withdrawMin: "0.01", depositMin: "0.01" },
    { network: "ARB",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.001", withdrawMin: "0.01", depositMin: "0.01" },
    { network: "BSC",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.001", withdrawMin: "0.01", depositMin: "0.01" },
  ]},
  { coin: "BNB", name: "BNB", free: "0", locked: "0", networkList: [
    { network: "BSC",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.001", withdrawMin: "0.01", depositMin: "0.01" },
  ]},
  { coin: "BTC", name: "Bitcoin", free: "0", locked: "0", networkList: [
    { network: "BSC",  withdrawEnable: true, depositEnable: true, withdrawFee: "0.0001", withdrawMin: "0.001", depositMin: "0.001" },
  ]},
];

const CHAIN_ID_FOR_NETWORK: Record<string, number> = {
  BSC: 56, ETH: 1, ARB: 42161, SOL: 101,
};

const EVM_CURRENCY_KEY: Record<string, string> = {
  "USDT-BSC": "USDT_BSC", "USDT-ETH": "USDT_ETH", "USDT-ARB": "USDT_BSC",
  "USDC-BSC": "USDC_BSC", "USDC-ETH": "USDC_ETH", "USDC-ARB": "USDC_BSC",
  "ETH-ETH": "ETH", "ETH-ARB": "ETH", "ETH-BSC": "ETH",
  "BNB-BSC": "BSC", "BTC-BSC": "BSC",
};

function asterRegisteredKey(userId: string) { return `aster_reg_${userId}`; }

const AccountBar = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");
  const [coin, setCoin] = useState("USDT");
  const [network, setNetwork] = useState("BSC");
  const [coinOpen, setCoinOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deposit-specific state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositStep, setDepositStep] = useState<"idle" | "connect" | "depositing">("idle");
  const [walletPassword, setWalletPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userEvmWallet, setUserEvmWallet] = useState<NonCustodialWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [isAsterRegistered, setIsAsterRegistered] = useState(false);

  // Withdraw-specific state
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const openSheet = (tab: "deposit" | "withdraw") => {
    if (!user) { navigate("/signin"); return; }
    setActiveTab(tab);
    setSheetOpen(true);
  };

  // Check AsterDEX registration state
  useEffect(() => {
    if (user) {
      const registered = localStorage.getItem(asterRegisteredKey(user.id)) === "true";
      setIsAsterRegistered(registered);
    }
  }, [user]);

  // Load user's EVM wallet when sheet opens on deposit tab
  const loadEvmWallet = useCallback(async () => {
    if (!user || !sheetOpen || activeTab !== "deposit") return;
    setWalletLoading(true);
    try {
      const wallets: NonCustodialWallet[] = await (nonCustodialWalletManager as any).getWalletsFromStorage(user.id);
      const evmWallet = wallets.find(w =>
        ["ethereum", "eth", "bsc", "bnb", "binance", "usdt", "usdc", "arb", "arbitrum"].some(k =>
          w.chainId?.toLowerCase().includes(k)
        ) && w.address?.startsWith("0x")
      );
      setUserEvmWallet(evmWallet ?? null);
    } catch {
      setUserEvmWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, [user, sheetOpen, activeTab]);

  useEffect(() => { loadEvmWallet(); }, [loadEvmWallet]);

  const { data: spotAccount, isLoading: balanceLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: coinInfoData, isLoading: coinInfoLoading } = useQuery({
    queryKey: ["coin-info"],
    queryFn: () => asterWallet.coinInfo(),
    enabled: !!user && sheetOpen,
    staleTime: 60_000,
    retry: 1,
  });

  const coins: CoinInfo[] = useMemo(() => {
    if (Array.isArray(coinInfoData) && coinInfoData.length > 0) return coinInfoData;
    return FALLBACK_COINS;
  }, [coinInfoData]);

  const selectedCoinInfo = useMemo(() =>
    coins.find(c => c.coin === coin) ?? coins[0],
    [coins, coin]
  );

  const depositNetworks = useMemo(() =>
    selectedCoinInfo?.networkList.filter(n => n.depositEnable).map(n => n.network) ?? ["BSC"],
    [selectedCoinInfo]
  );

  const withdrawNetworks = useMemo(() =>
    selectedCoinInfo?.networkList.filter(n => n.withdrawEnable).map(n => n.network) ?? ["BSC"],
    [selectedCoinInfo]
  );

  const selectedNetworkInfo = useMemo(() =>
    selectedCoinInfo?.networkList.find(n => n.network === network),
    [selectedCoinInfo, network]
  );

  const handleTabChange = (tab: "deposit" | "withdraw" | "transfer") => {
    setActiveTab(tab);
    setCoinOpen(false);
    setNetworkOpen(false);
    setDepositStep("idle");
    if (tab === "deposit" && !depositNetworks.includes(network)) {
      setNetwork(depositNetworks[0] ?? "BSC");
    } else if (tab === "withdraw" && !withdrawNetworks.includes(network)) {
      setNetwork(withdrawNetworks[0] ?? "BSC");
    }
  };

  const handleCoinChange = (c: string, newCoins: CoinInfo[]) => {
    const info = newCoins.find(ci => ci.coin === c);
    const nets = activeTab === "withdraw"
      ? info?.networkList.filter(n => n.withdrawEnable).map(n => n.network)
      : info?.networkList.filter(n => n.depositEnable).map(n => n.network);
    setCoin(c);
    setNetwork(nets?.[0] ?? "BSC");
    setCoinOpen(false);
    setWithdrawAmount("");
    setDepositAmount("");
  };

  const usdtBalance = spotAccount?.balances
    ? spotAccount.balances.find((b: any) => b.asset === "USDT")?.free ?? "0.00"
    : null;

  const selectedCoinBalance = spotAccount?.balances
    ? parseFloat(spotAccount.balances.find((b: any) => b.asset === coin)?.free ?? "0")
    : 0;

  // Deposit address — from AsterDEX via Supabase (authenticated private endpoint)
  const { data: depositData, isLoading: depositLoading, error: depositError, refetch: refetchDeposit } = useQuery({
    queryKey: ["deposit-address", coin, network],
    queryFn: () => asterWallet.depositAddress(coin, network),
    enabled: !!user && sheetOpen && activeTab === "deposit",
    staleTime: 60_000,
    retry: 1,
  });

  const depositAddress: string = (depositData as any)?.address ?? "";
  const depositMemo: string = (depositData as any)?.tag ?? (depositData as any)?.memo ?? "";

  // Fee estimation for withdraw tab
  const { data: feeEstimate, isLoading: feeLoading } = useQuery({
    queryKey: ["withdraw-fee", coin, network],
    queryFn: () => asterWallet.withdrawFeeEstimate(coin, network),
    enabled: !!user && sheetOpen && activeTab === "withdraw",
    staleTime: 30_000,
    retry: 1,
  });

  const liveFee = feeEstimate?.gasCost ? String(feeEstimate.gasCost) : null;
  const fallbackFee = selectedNetworkInfo?.withdrawFee ?? "0";
  const resolvedFee = liveFee ?? fallbackFee;
  const resolvedFeeNum = parseFloat(resolvedFee);

  const withdrawAmountNum = parseFloat(withdrawAmount) || 0;
  const withdrawMin = parseFloat(selectedNetworkInfo?.withdrawMin ?? "0");
  const youReceive = Math.max(0, withdrawAmountNum - resolvedFeeNum);

  const amountTooLow = withdrawAmountNum > 0 && withdrawAmountNum < withdrawMin;
  const amountExceedsBalance = withdrawAmountNum > selectedCoinBalance;
  const amountError = amountExceedsBalance
    ? "Exceeds available balance"
    : amountTooLow
    ? `Minimum withdrawal is ${withdrawMin} ${coin}`
    : null;

  const canSubmitWithdraw =
    !!withdrawAddress &&
    withdrawAmountNum > 0 &&
    !amountExceedsBalance &&
    !amountTooLow;

  const handleWithdrawMax = () => {
    const maxAfterFee = Math.max(0, selectedCoinBalance - resolvedFeeNum);
    setWithdrawAmount(coin === "BTC" ? maxAfterFee.toFixed(8) : maxAfterFee.toFixed(6));
  };

  const withdrawMutation = useMutation({
    mutationFn: () =>
      asterWallet.withdraw(coin, withdrawAddress, withdrawAmount, network, resolvedFee),
    onSuccess: () => {
      toast({ title: "Withdrawal submitted", description: `${withdrawAmount} ${coin} withdrawal is being processed.` });
      setWithdrawAddress("");
      setWithdrawAmount("");
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    },
  });

  // AsterDEX registration — get nonce, sign, create API key
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!userEvmWallet || !user) throw new Error("No wallet found");
      if (!walletPassword) throw new Error("Enter your wallet password");
      const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(userEvmWallet.id, walletPassword, user.id);
      if (!mnemonic) throw new Error("Incorrect password or wallet not found");
      const nonce = await asterGetNonce(userEvmWallet.address);
      const message = `You are signing into Astherus ${nonce}`;
      const signature = await signEVMMessage(mnemonic, message);
      const chainId = CHAIN_ID_FOR_NETWORK[network] ?? 56;
      await asterCreateApiKey(userEvmWallet.address, signature, chainId);
    },
    onSuccess: () => {
      if (user) localStorage.setItem(asterRegisteredKey(user.id), "true");
      setIsAsterRegistered(true);
      setDepositStep("idle");
      setWalletPassword("");
      toast({ title: "Wallet connected", description: "Your wallet is now linked to AsterDEX." });
      refetchDeposit();
    },
    onError: (err: Error) => {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    },
  });

  // Deposit transaction — sign ERC-20 transfer from user's wallet to deposit address
  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!userEvmWallet || !user) throw new Error("No wallet found");
      if (!walletPassword) throw new Error("Enter your wallet password");
      if (!depositAddress) throw new Error("Deposit address not loaded yet");
      if (!depositAmount || parseFloat(depositAmount) <= 0) throw new Error("Enter an amount");
      const min = parseFloat(selectedNetworkInfo?.depositMin ?? "0");
      if (parseFloat(depositAmount) < min) throw new Error(`Minimum deposit is ${min} ${coin}`);
      const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(userEvmWallet.id, walletPassword, user.id);
      if (!mnemonic) throw new Error("Incorrect password");
      const currencyKey = EVM_CURRENCY_KEY[`${coin}-${network}`];
      if (!currencyKey) throw new Error(`${coin} on ${network} not supported for on-chain deposit`);
      const signed = await signEVMTransaction(mnemonic, {
        to: depositAddress,
        amount: depositAmount,
        currency: currencyKey as any,
      });
      await broadcastEVMTransaction(signed.signedTx, network);
    },
    onSuccess: () => {
      toast({ title: "Deposit sent", description: `${depositAmount} ${coin} sent to AsterDEX. It will be credited shortly.` });
      setDepositAmount("");
      setWalletPassword("");
      setDepositStep("idle");
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    },
  });

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayBalance = user
    ? balanceLoading ? "..." : `${parseFloat(usdtBalance || "0").toFixed(2)} USDT`
    : "--";

  useEffect(() => {
    if (!sheetOpen) {
      setCoinOpen(false);
      setNetworkOpen(false);
      setDepositStep("idle");
      setWalletPassword("");
      setDepositAmount("");
    }
  }, [sheetOpen]);

  return (
    <>
      <div className="flex items-center justify-between h-12 px-4 border-y border-border bg-card">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Spot Acct.</span>
          <span className="text-foreground font-mono-num">{displayBalance}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openSheet("deposit")}
            className="px-4 py-1.5 rounded text-sm text-trading-green border border-trading-green/40 bg-trading-green/10 hover:bg-trading-green/15"
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
        <SheetContent side="bottom" className="bg-card border-t border-border rounded-t-2xl px-5 pb-8 pt-5 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Spot Account</SheetTitle>
          </SheetHeader>
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
                    onClick={() => handleTabChange(tab)}
                    className={`capitalize font-medium ${activeTab === tab ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </div>
              ))}
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          {coinInfoLoading && (
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Fetching available coins…</span>
            </div>
          )}

          {/* ── DEPOSIT ── */}
          {activeTab === "deposit" && (
            <>
              {/* Coin selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => { setCoinOpen(!coinOpen); setNetworkOpen(false); }}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">{coin.slice(0, 3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {coins.map(c => (
                      <button key={c.coin} onClick={() => handleCoinChange(c.coin, coins)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-trading-green" : "text-foreground"}`}>
                        {c.coin} <span className="text-muted-foreground text-xs ml-1">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Network selector */}
              <div className="relative mb-5">
                <button
                  onClick={() => { setNetworkOpen(!networkOpen); setCoinOpen(false); }}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <span className="text-sm text-foreground">{network}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {networkOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {depositNetworks.map(n => (
                      <button key={n} onClick={() => { setNetwork(n); setNetworkOpen(false); setDepositAmount(""); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${n === network ? "text-trading-green" : "text-foreground"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User's wallet address */}
              {walletLoading ? (
                <div className="flex items-center gap-2 py-2 mb-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading wallet…</span>
                </div>
              ) : userEvmWallet ? (
                <div className="border border-border rounded-lg px-4 py-3 mb-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Wallet className="h-3 w-3" /> Your Wallet (From)
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground font-mono break-all">{userEvmWallet.address}</span>
                    <button onClick={() => handleCopyAddress(userEvmWallet.address)} className="shrink-0 text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="h-3.5 w-3.5 text-trading-green" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">No wallet found. Create a wallet in the Wallet section first.</span>
                </div>
              )}

              {/* AsterDEX deposit address */}
              {depositLoading ? (
                <div className="flex items-center gap-2 py-2 mb-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Fetching deposit address…</span>
                </div>
              ) : depositAddress ? (
                <div className="border border-trading-green/30 bg-trading-green/5 rounded-lg px-4 py-3 mb-4">
                  <div className="text-xs text-trading-green mb-1">AsterDEX Deposit Address ({network})</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground font-mono break-all">{depositAddress}</span>
                    <button onClick={() => handleCopyAddress(depositAddress)} className="shrink-0 text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="h-3.5 w-3.5 text-trading-green" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {depositMemo && (
                    <div className="mt-2 pt-2 border-t border-trading-green/20">
                      <div className="text-xs text-trading-amber font-medium mb-0.5">Memo required</div>
                      <div className="text-xs text-foreground font-mono">{depositMemo}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Include this memo or funds may be lost.</div>
                    </div>
                  )}
                </div>
              ) : depositError ? (
                <div className="border border-border rounded-lg px-4 py-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-foreground font-medium">Wallet not linked to AsterDEX</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Connect your wallet to generate your deposit address.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Amount input */}
              {depositAddress && (
                <>
                  <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-1">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      placeholder="Amount to deposit"
                      min="0"
                      step="any"
                      className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-muted-foreground ml-2 shrink-0">{coin}</span>
                  </div>
                  {selectedNetworkInfo?.depositMin && (
                    <p className="text-xs text-muted-foreground mb-4 px-1">
                      Minimum: {selectedNetworkInfo.depositMin} {coin} · Only send {coin} on {network}
                    </p>
                  )}
                </>
              )}

              {/* Register with AsterDEX OR deposit flow — both need password */}
              {(!isAsterRegistered || (depositAddress && depositStep !== "idle")) && userEvmWallet && (
                <div className="mb-4">
                  {depositStep === "idle" && !isAsterRegistered && (
                    <p className="text-xs text-muted-foreground mb-3">
                      First-time setup: connect your wallet to AsterDEX to generate your deposit address.
                    </p>
                  )}
                  <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-3">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={walletPassword}
                      onChange={e => setWalletPassword(e.target.value)}
                      placeholder="Wallet password"
                      className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    <button onClick={() => setShowPassword(v => !v)} className="text-muted-foreground hover:text-foreground ml-2">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary action button */}
              {!userEvmWallet ? null : !isAsterRegistered ? (
                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending || !walletPassword}
                  className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-green text-background hover:bg-trading-green/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  {registerMutation.isPending ? "Connecting…" : "Connect Wallet to AsterDEX"}
                </button>
              ) : depositAddress ? (
                <button
                  onClick={() => {
                    if (!walletPassword) { setDepositStep("depositing"); return; }
                    depositMutation.mutate();
                  }}
                  disabled={depositMutation.isPending || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-green text-background hover:bg-trading-green/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {depositMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {depositMutation.isPending ? "Signing & Sending…" : `Deposit ${coin}`}
                </button>
              ) : (
                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending || !walletPassword}
                  className="w-full py-3.5 rounded-lg text-sm font-semibold bg-trading-green text-background hover:bg-trading-green/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  {registerMutation.isPending ? "Linking Wallet…" : "Link Wallet to Generate Address"}
                </button>
              )}

              {isAsterRegistered && depositAddress && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Enter your wallet password to sign and send the deposit transaction
                </p>
              )}
            </>
          )}

          {/* ── WITHDRAW ── */}
          {activeTab === "withdraw" && (
            <>
              {/* Coin selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => { setCoinOpen(!coinOpen); setNetworkOpen(false); }}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-foreground">{coin.slice(0, 3)}</div>
                    <span className="text-sm text-foreground">{coin}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {coinOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {coins.map(c => (
                      <button key={c.coin} onClick={() => handleCoinChange(c.coin, coins)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${c.coin === coin ? "text-trading-amber" : "text-foreground"}`}>
                        {c.coin} <span className="text-muted-foreground text-xs ml-1">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Network selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => { setNetworkOpen(!networkOpen); setCoinOpen(false); }}
                  className="border border-border rounded-lg px-4 py-3 flex items-center justify-between w-full"
                >
                  <span className="text-sm text-foreground">{network}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {networkOpen && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
                    {withdrawNetworks.map(n => (
                      <button key={n} onClick={() => { setNetwork(n); setNetworkOpen(false); setWithdrawAmount(""); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${n === network ? "text-trading-amber" : "text-foreground"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Address input */}
              <div className="border border-border rounded-lg px-4 py-3 mb-4">
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={e => setWithdrawAddress(e.target.value)}
                  placeholder="Withdrawal address"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              {/* Amount input with MAX */}
              <div className={`border rounded-lg px-4 py-3 flex items-center justify-between mb-2 ${amountError ? "border-destructive" : "border-border"}`}>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Amount"
                  min="0"
                  step="any"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <button onClick={handleWithdrawMax} className="text-xs text-trading-amber font-semibold">MAX</button>
                  <span className="text-sm text-foreground">{coin}</span>
                </div>
              </div>

              {amountError && (
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-xs text-destructive">{amountError}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-xs text-muted-foreground">Network fee</span>
                <span className="text-xs text-foreground font-mono-num flex items-center gap-1">
                  {feeLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {resolvedFee} {coin}
                </span>
              </div>

              {selectedNetworkInfo && (
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-xs text-muted-foreground">Min withdrawal</span>
                  <span className="text-xs text-foreground font-mono-num">{selectedNetworkInfo.withdrawMin} {coin}</span>
                </div>
              )}

              {withdrawAmountNum > 0 && (
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-xs text-muted-foreground">You receive</span>
                  <span className="text-xs text-foreground font-mono-num">≈ {youReceive.toFixed(coin === "BTC" ? 8 : 4)} {coin}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-6 px-1 mt-1">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="text-sm text-foreground font-mono-num">
                  {balanceLoading ? "..." : `${selectedCoinBalance.toFixed(coin === "BTC" ? 8 : 4)} ${coin}`}
                </span>
              </div>

              <button
                onClick={() => withdrawMutation.mutate()}
                disabled={!canSubmitWithdraw || withdrawMutation.isPending}
                className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {withdrawMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Withdraw {coin}
              </button>
            </>
          )}

          {/* ── TRANSFER ── */}
          {activeTab === "transfer" && (
            <div className="flex flex-col items-center py-10">
              <span className="text-sm text-muted-foreground">
                Use the Perpetual account bar to transfer between Spot and Futures.
              </span>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AccountBar;
