import { useState, useMemo, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  asterTrading, asterWallet,
  asterGetNonceV3, asterCreateApiKeyV3, asterGenerateSignerWallet,
  asterApproveAgentFuturesWithKey, hexToBytes,
  asterGetDepositAddress, asterGetChainAssets, CoinInfo,
} from "@/lib/asterdex-service";
import { supabase } from "@/lib/supabase";
import type { NonCustodialWallet } from "@/lib/non-custodial-wallet";
import { deriveEVMPrivateKey, signEVMMessageWithKey } from "@/lib/evmSigner";
import { wipeBytes } from "@/lib/secureMemory";
import { broadcastDeposit } from "@/lib/deposit-broadcaster";
import { useToast } from "@/hooks/use-toast";
import {
  CHAIN_MAP, DEPOSIT_CHAINS, FALLBACK_COINS, asterRegKey,
} from "./AccountModalConfig";
import type { AccountModalProps, AccountType } from "./AccountModalConfig";

// ── Internal hook: all state & logic ─────────────────────
function useAccountModalValue(props: AccountModalProps & { children?: React.ReactNode }) {
  const { open, onOpenChange, defaultTab, defaultAccountType } = props;

  const [activeTab, setActiveTab]             = useState<"deposit" | "withdraw" | "transfer">(defaultTab);
  const [accountType, setAccountType]         = useState<AccountType>(defaultAccountType);
  const [accountTypeOpen, setAccountTypeOpen] = useState(false);
  const [coin, setCoin]                       = useState("USDT");
  const [network, setNetwork]                 = useState<string>("BSC");
  const [chainOpen, setChainOpen]             = useState(false);
  const [coinOpen, setCoinOpen]               = useState(false);
  const [amount, setAmount]                   = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isAsterRegistered, setIsAsterRegistered] = useState(false);
  const [userEvmWallet, setUserEvmWallet]     = useState<NonCustodialWallet | null>(null);
  const [userSolWallet, setUserSolWallet]     = useState<NonCustodialWallet | null>(null);
  const [walletLoading, setWalletLoading]     = useState(false);
  const [walletPassword, setWalletPassword]   = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [txHistoryOpen, setTxHistoryOpen]     = useState(false);
  const [txHistoryTab, setTxHistoryTab]       = useState<"deposits" | "withdrawals">("deposits");
  const [sendPassword, setSendPassword]       = useState("");
  const [showSendPwd, setShowSendPwd]         = useState(false);
  const [sendLoading, setSendLoading]         = useState(false);
  const [signingStep, setSigningStep]         = useState("");
  const [sendTxHash, setSendTxHash]           = useState<string | null>(null);
  const [sendTxUrl, setSendTxUrl]             = useState<string | null>(null);
  const [sendError, setSendError]             = useState<string | null>(null);
  const prevNetworkRef = useRef<string>(network);

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSpot = accountType === "Spot account";
  const hasV1 = !!user?.user_metadata?.aster_api_key;

  // ── Effects ────────────────────────────────────────────

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

  useEffect(() => {
    if (user) {
      const hasApiKey = !!(user.user_metadata?.aster_api_key || user.user_metadata?.aster_signer_key);
      setIsAsterRegistered(hasApiKey);
      if (hasApiKey) localStorage.setItem(asterRegKey(user.id), "true");
    }
  }, [user]);

  const loadWallets = useCallback(async () => {
    if (!user) return;
    setWalletLoading(true);
    try {
      const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
      let wallets: NonCustodialWallet[] = await nonCustodialWalletManager.getWalletsFromStorage(user.id);

      // If local IndexedDB is empty (new device / cleared cache), sync from Supabase first.
      if (wallets.length === 0) {
        try {
          wallets = await nonCustodialWalletManager.loadWalletsFromSupabase(supabase, user.id);
        } catch {
          // Supabase unreachable — continue with empty list; user will see "create wallet" prompt.
        }
      }

      const evm = wallets.find(w =>
        ["ethereum", "eth", "bsc", "bnb", "binance", "arb", "arbitrum"].some(k =>
          w.chainId.toLowerCase().includes(k)
        ) && w.address.startsWith("0x")
      );
      const sol = wallets.find(w => w.chainId.toLowerCase() === "solana");
      setUserEvmWallet(evm ?? null);
      setUserSolWallet(sol ?? null);
    } catch {
      setUserEvmWallet(null);
      setUserSolWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, [user]);

  // ── Registration mutation ──────────────────────────────

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!userEvmWallet || !user) throw new Error("No EVM wallet found. Create one in Wallet first.");
      if (!walletPassword) throw new Error("Enter your wallet password to sign.");

      // Yield to event loop so "Decrypting…" label renders before PBKDF2 blocks the thread
      setSigningStep("Verifying password…");
      await new Promise(r => setTimeout(r, 30));

      const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
      const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(userEvmWallet.id, walletPassword, user.id);
      if (!mnemonic) throw new Error("Incorrect password or wallet not found.");

      setSigningStep("Preparing wallet…");
      await new Promise(r => setTimeout(r, 30));
      const privKey = await deriveEVMPrivateKey(mnemonic);

      try {
        const signerWallet = asterGenerateSignerWallet();

        setSigningStep("Connecting…");
        await new Promise(r => setTimeout(r, 30));
        const nonceV3 = await asterGetNonceV3(userEvmWallet.address);

        setSigningStep("Signing…");
        await new Promise(r => setTimeout(r, 30));
        const signatureV3 = await signEVMMessageWithKey(privKey, `You are signing into Astherus ${nonceV3}`);

        setSigningStep("Activating…");
        await new Promise(r => setTimeout(r, 30));
        await asterCreateApiKeyV3(userEvmWallet.address, signatureV3, signerWallet.address);

        setSigningStep("Activating…");
        await new Promise(r => setTimeout(r, 30));
        const signerPrivKey = hexToBytes(signerWallet.privateKey);
        try {
          await asterApproveAgentFuturesWithKey(signerPrivKey, userEvmWallet.address, signerWallet.address);
        } finally {
          signerPrivKey.fill(0);
        }

        setSigningStep("Almost done…");
        await new Promise(r => setTimeout(r, 30));
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            aster_user:       userEvmWallet.address,
            aster_signer:     signerWallet.address,
            aster_signer_key: signerWallet.privateKey,
          },
        });
        if (updateError) throw new Error("Wallet linked but failed to save credentials: " + updateError.message);
      } finally {
        wipeBytes(privKey);
      }
    },
    onSuccess: () => {
      setSigningStep("");
      if (user) localStorage.setItem(asterRegKey(user.id), "true");
      setIsAsterRegistered(true);
      setWalletPassword("");
      toast({ title: "Wallet linked", description: "Your deposit address is ready." });
      queryClient.invalidateQueries({ queryKey: ["deposit-address"] });
    },
    onError: (err: Error) => {
      setSigningStep("");
      toast({ title: "Sign-in failed", description: err.message, variant: "destructive" });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        data: {
          aster_user: null, aster_signer: null, aster_signer_key: null,
          aster_api_key: null, aster_api_secret: null,
        },
      });
      if (error) throw new Error("Failed to unlink wallet: " + error.message);
    },
    onSuccess: () => {
      if (user) localStorage.removeItem(asterRegKey(user.id));
      setIsAsterRegistered(false);
      setWalletPassword("");
      queryClient.removeQueries({ queryKey: ["spot-account"] });
      queryClient.removeQueries({ queryKey: ["futures-balance"] });
      queryClient.removeQueries({ queryKey: ["deposit-address"] });
      toast({ title: "Wallet unlinked", description: "Enter your password to re-activate your deposit address." });
    },
    onError: (err: Error) => {
      toast({ title: "Unlink failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Queries ───────────────────────────────────────────

  const chainAccountType = isSpot ? "spot" : "perp";

  const { data: spotAccount, isLoading: spotLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user && hasV1,
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
    enabled: !!user && open && hasV1,
    staleTime: 60_000,
    retry: 1,
  });

  const { data: depositHistory, isLoading: depositHistoryLoading } = useQuery({
    queryKey: ["deposit-history", isSpot],
    queryFn: () => isSpot ? asterWallet.depositHistory() : asterWallet.futuresDepositHistory(),
    enabled: !!user && txHistoryOpen && txHistoryTab === "deposits",
    staleTime: 30_000,
  });

  const { data: withdrawHistory, isLoading: withdrawHistoryLoading } = useQuery({
    queryKey: ["withdraw-history", isSpot],
    queryFn: () => isSpot ? asterWallet.withdrawHistory() : asterWallet.futuresWithdrawHistory(),
    enabled: !!user && txHistoryOpen && txHistoryTab === "withdrawals",
    staleTime: 30_000,
  });

  const {
    data: depositData,
    isLoading: depositLoading,
    isFetching: depositFetching,
    error: depositError,
  } = useQuery({
    queryKey: ["deposit-address", coin, network, chainAccountType],
    queryFn: () => asterGetDepositAddress(CHAIN_MAP[network]?.chainId ?? 56, coin, chainAccountType),
    enabled: !!user && open && activeTab === "deposit" && !!network,
    staleTime: 300_000,
    placeholderData: undefined,
    retry: 1,
  });

  const chainOperation = activeTab === "deposit" ? "deposit" : "withdraw";
  const {
    data: chainAssetsData,
    isLoading: chainAssetsLoading,
    isFetching: chainAssetsFetching,
  } = useQuery({
    queryKey: ["aster-chain-assets", network, chainAccountType, chainOperation],
    queryFn: () => asterGetChainAssets(CHAIN_MAP[network]?.chainId ?? 56, chainAccountType, chainOperation),
    enabled: open && (activeTab === "deposit" || activeTab === "withdraw") && (DEPOSIT_CHAINS as readonly string[]).includes(network),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const { data: feeEstimate, isLoading: feeLoading } = useQuery({
    queryKey: ["withdraw-fee", coin, network],
    queryFn: () => asterWallet.withdrawFeeEstimate(coin, network),
    enabled: !!user && open && activeTab === "withdraw",
    staleTime: 30_000,
    retry: 1,
  });

  // ── Derived data ──────────────────────────────────────

  const chainAssetsStale = chainAssetsLoading || chainAssetsFetching;
  const depositBusy = depositLoading || depositFetching;

  const coins: CoinInfo[] = useMemo(() => {
    if (Array.isArray(coinInfoData) && coinInfoData.length > 0) return coinInfoData;
    return FALLBACK_COINS;
  }, [coinInfoData]);

  const selectorCoins: CoinInfo[] = useMemo(() => {
    if (activeTab === "deposit" || activeTab === "withdraw") {
      if (chainAssetsStale) return [];
      if (Array.isArray(chainAssetsData) && chainAssetsData.length > 0) {
        return chainAssetsData.map(a => {
          const withBalance = coins.find(c => c.coin === a.coin);
          return withBalance ? { ...a, free: withBalance.free, locked: withBalance.locked } : a;
        });
      }
    }
    return coins;
  }, [activeTab, chainAssetsData, chainAssetsStale, coins]);

  useEffect(() => {
    if (activeTab !== "deposit" && activeTab !== "withdraw") return;
    if (prevNetworkRef.current !== network) {
      prevNetworkRef.current = network;
      setCoin("USDT");
      setAmount("");
    }
  }, [network, activeTab]);

  useEffect(() => {
    if ((activeTab === "deposit" || activeTab === "withdraw") && selectorCoins.length > 0 && !selectorCoins.some(c => c.coin === coin)) {
      setCoin(selectorCoins[0].coin);
    }
  }, [selectorCoins, coin, activeTab]);

  const selectedCoinInfo = useMemo(
    () => selectorCoins.find(c => c.coin === coin) ?? selectorCoins[0],
    [selectorCoins, coin]
  );

  const availableNetworks = useMemo(() => {
    if (activeTab === "deposit") return [...DEPOSIT_CHAINS] as string[];
    const list = selectedCoinInfo?.networkList.filter(n => n.withdrawEnable);
    return list?.map(n => n.network) ?? ["BSC"];
  }, [selectedCoinInfo, activeTab]);

  useEffect(() => {
    if (availableNetworks.length > 0 && !availableNetworks.includes(network)) setNetwork(availableNetworks[0]);
  }, [availableNetworks, network]);

  useEffect(() => {
    if (activeTab !== "withdraw") return;
    if (network === "SOL" && userSolWallet?.address) setWithdrawAddress(userSolWallet.address);
    else if (network !== "SOL" && userEvmWallet?.address) setWithdrawAddress(userEvmWallet.address);
  }, [activeTab, network, userEvmWallet, userSolWallet]);

  useEffect(() => {
    if (!user || walletLoading) return;
    const onDepositOrWithdraw = activeTab === "deposit" || activeTab === "withdraw";
    const needsSol = onDepositOrWithdraw && network === "SOL" && !userSolWallet;
    const needsEvm = ((activeTab === "deposit" && !isAsterRegistered) || activeTab === "withdraw") && !userEvmWallet;
    if (needsSol || needsEvm) loadWallets();
  }, [isAsterRegistered, user, loadWallets, activeTab, network, userEvmWallet, userSolWallet, walletLoading]);

  const selectedNetworkInfo = useMemo(
    () => selectedCoinInfo?.networkList.find(n => n.network === network),
    [selectedCoinInfo, network]
  );

  const spotBalanceFor = (asset: string) =>
    spotAccount?.balances ? parseFloat(spotAccount.balances.find((b: any) => b.asset === asset)?.free ?? "0") : 0;
  const futuresAvailFor = (asset: string) =>
    Array.isArray(futuresBalance) ? parseFloat(futuresBalance.find((b: any) => b.asset === asset)?.availableBalance ?? "0") : 0;

  const headerBalance = isSpot
    ? (spotLoading ? "..." : `${spotBalanceFor("USDT").toFixed(2)} USDT`)
    : (futuresLoading ? "..." : `${futuresAvailFor("USDT").toFixed(2)} USDT`);

  const currentBalance = (() => {
    if (!isSpot && activeTab === "deposit")  return spotBalanceFor(coin);
    if (!isSpot && activeTab === "withdraw") return futuresAvailFor(coin);
    return spotBalanceFor(coin);
  })();

  const depositAddress: string = typeof depositData === "string" ? depositData : (depositData as any)?.address ?? "";
  const depositMemo: string    = (depositData as any)?.tag ?? (depositData as any)?.memo ?? "";
  const liveFee        = feeEstimate?.gasCost ? String(feeEstimate.gasCost) : null;
  const resolvedFee    = liveFee ?? selectedNetworkInfo?.withdrawFee ?? "0";
  const resolvedFeeNum = parseFloat(resolvedFee);
  const amountNum      = parseFloat(amount) || 0;
  const withdrawMin    = parseFloat(selectedNetworkInfo?.withdrawMin ?? "0");
  const youReceive     = Math.max(0, amountNum - resolvedFeeNum);

  // ── Withdraw / Transfer mutations ─────────────────────

  const onWithdrawSuccess = () => {
    toast({ title: "Withdrawal submitted", description: `${amount} ${coin} is being processed.` });
    setWithdrawAddress(""); setAmount(""); onOpenChange(false);
  };
  const onWithdrawError = (err: Error) =>
    toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });

  const spotWithdrawMutation    = useMutation({
    mutationFn: () => asterWallet.withdraw(coin, withdrawAddress, amount, network, resolvedFee),
    onSuccess: onWithdrawSuccess, onError: onWithdrawError,
  });
  const futuresWithdrawMutation = useMutation({
    mutationFn: () => asterWallet.futuresWithdraw(coin, withdrawAddress, amount, network, resolvedFee),
    onSuccess: onWithdrawSuccess, onError: onWithdrawError,
  });
  const withdrawMutation = isSpot ? spotWithdrawMutation : futuresWithdrawMutation;

  const transferMutation = useMutation({
    mutationFn: () => {
      const type = (activeTab === "deposit" && !isSpot) || (activeTab === "transfer" && isSpot)
        ? "SPOT_TO_FUTURES" : "FUTURES_TO_SPOT";
      return asterWallet.transfer(coin, amount, type);
    },
    onSuccess: () => {
      const toAccount = (activeTab === "deposit" && !isSpot) || (activeTab === "transfer" && isSpot) ? "Perpetual" : "Spot";
      toast({ title: "Transfer successful", description: `${amount} ${coin} moved to ${toAccount} account.` });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["futures-balance"] });
      queryClient.invalidateQueries({ queryKey: ["futures-account"] });
      queryClient.invalidateQueries({ queryKey: ["spot-account"] });
    },
    onError: (err: Error) => toast({ title: "Transfer failed", description: err.message, variant: "destructive" }),
  });

  // ── Handlers ──────────────────────────────────────────

  const resetSendState = () => { setSendPassword(""); setSendTxHash(null); setSendTxUrl(null); setSendError(null); };

  const handleTabChange = (tab: "deposit" | "withdraw" | "transfer") => {
    setActiveTab(tab); setAmount(""); setWithdrawAddress("");
    setCoinOpen(false); setChainOpen(false); setAccountTypeOpen(false); resetSendState();
  };
  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type); setAccountTypeOpen(false); setAmount(""); resetSendState();
  };
  const handleNetworkChange = (n: string) => {
    setNetwork(n); setChainOpen(false); setAmount(""); resetSendState();
  };
  const handleCoinChange = (c: string) => {
    setCoin(c); resetSendState();
    if (activeTab === "withdraw") {
      const info = selectorCoins.find(ci => ci.coin === c);
      const nets = info?.networkList.filter(n => n.withdrawEnable).map(n => n.network) ?? [];
      if (nets.length > 0 && !nets.includes(network)) setNetwork(nets[0]);
    }
    setCoinOpen(false); setAmount("");
  };
  const handleMax = () => {
    const max = activeTab === "withdraw" ? Math.max(0, currentBalance - resolvedFeeNum) : currentBalance;
    setAmount(coin === "BTC" ? max.toFixed(8) : max.toFixed(4));
  };
  const requireAuth = () => { if (!user) { navigate("/signin"); onOpenChange(false); } };

  // ── Send-from-wallet handlers ─────────────────────────

  const handleSendFromWalletWithMnemonic = async (mnemonic: string) => {
    const wallet = network === "SOL" ? userSolWallet : userEvmWallet;
    if (!wallet || !depositAddress || !amount) return;
    setSendLoading(true); setSendError(null); setSendTxHash(null); setSendTxUrl(null);
    try {
      const result = await broadcastDeposit({
        coin, network, amount, mnemonic, depositAddress, walletAddress: wallet.address,
        contractAddress: selectedCoinInfo?.contractAddress,
        decimals: selectedCoinInfo?.decimals,
        isNative: selectedCoinInfo?.isNative,
      });
      setSendTxHash(result.txHash); setSendTxUrl(result.explorerUrl); setSendPassword("");
      toast({ title: "Deposit sent!", description: "Transaction broadcast successfully." });
    } catch (err: any) {
      setSendError(err.message ?? "Transaction failed. Please try again.");
    } finally {
      setSendLoading(false);
    }
  };

  const handleSendFromWallet = async () => {
    if (!user || !depositAddress || !amount) return;
    const wallet = network === "SOL" ? userSolWallet : userEvmWallet;
    if (!wallet) return;
    try {
      const vaultKey = wallet.encryptedMnemonic ?? wallet.encryptedPrivateKey;
      if (!vaultKey) throw new Error("Wallet data not found. Please recreate your wallet.");
      const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
      const mnemonic = await nonCustodialWalletManager.decryptPrivateKey(vaultKey, sendPassword, user.id);
      await handleSendFromWalletWithMnemonic(mnemonic);
    } catch (err: any) {
      setSendLoading(false);
      setSendError(err.message ?? "Transaction failed. Please try again.");
    }
  };

  return {
    // Navigation
    activeTab, setActiveTab, handleTabChange,
    // Account type
    accountType, accountTypeOpen, setAccountTypeOpen, handleAccountTypeChange, isSpot, hasV1,
    // Coin
    coin, coinOpen, setCoinOpen, handleCoinChange, selectorCoins, selectedCoinInfo, chainAssetsStale,
    // Network
    network, chainOpen, setChainOpen, handleNetworkChange, availableNetworks, selectedNetworkInfo,
    // Amount
    amount, setAmount, amountNum, handleMax,
    // Withdraw address
    withdrawAddress,
    // Wallet
    isAsterRegistered, userEvmWallet, userSolWallet, walletLoading,
    walletPassword, setWalletPassword, showPassword, setShowPassword,
    // Deposit
    depositAddress, depositMemo, depositBusy, depositError,
    // Fee/balance
    currentBalance, resolvedFee, resolvedFeeNum, withdrawMin, youReceive, feeLoading,
    spotBalanceFor, futuresAvailFor, headerBalance, spotLoading, futuresLoading,
    // Send state
    sendPassword, setSendPassword, showSendPwd, setShowSendPwd,
    sendLoading, sendTxHash, sendTxUrl, sendError, handleSendFromWallet,
    // TX history
    txHistoryOpen, setTxHistoryOpen, txHistoryTab, setTxHistoryTab,
    depositHistory, depositHistoryLoading, withdrawHistory, withdrawHistoryLoading,
    // Mutations
    registerMutation, unlinkMutation, withdrawMutation, transferMutation,
    signingStep,
    // Auth
    user, requireAuth, onOpenChange,
  };
}

// ── Context wiring ────────────────────────────────────────
type AccountModalContextType = ReturnType<typeof useAccountModalValue>;
const AccountModalContext = createContext<AccountModalContextType | null>(null);

export function useAccountModal() {
  const ctx = useContext(AccountModalContext);
  if (!ctx) throw new Error("useAccountModal must be used inside AccountModalProvider");
  return ctx;
}

export function AccountModalProvider({
  children,
  ...props
}: AccountModalProps & { children: React.ReactNode }) {
  const value = useAccountModalValue(props);
  return <AccountModalContext.Provider value={value}>{children}</AccountModalContext.Provider>;
}
