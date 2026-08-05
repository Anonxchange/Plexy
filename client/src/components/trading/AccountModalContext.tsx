import { useState, useMemo, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  asterTrading, asterWallet,
  asterRegisterAndApproveAgent, asterGenerateSignerWallet,
  asterGetChainAssets, asterSignWithdrawal, asterWithdrawFromPerp,
  CoinInfo,
} from "@/lib/asterdex-service";
import { supabase } from "@/lib/supabase";
import type { NonCustodialWallet } from "@/lib/non-custodial-wallet";
import { signEVMRawHashFromVault } from "@/hooks/use-signing-worker";
import { bytesToHex } from "@noble/hashes/utils";
import { broadcastDeposit } from "@/lib/deposit-broadcaster";
import { useToast } from "@/hooks/use-toast";
import { usePasswordRateLimit } from "@/hooks/use-password-rate-limit";
import {
  CHAIN_MAP, DEPOSIT_CHAINS, FALLBACK_COINS, asterRegKey,
  CHAIN_COINS, mergeCoinInfo, isFeeKnown, FEE_UNKNOWN,
} from "./AccountModalConfig";
import type { AccountModalProps, AccountType, DepositChain } from "./AccountModalConfig";

// FIX: ARB settles gas in ETH, SOL in SOL. The old BSC ? BNB : ETH branch
// mislabelled Solana fee errors as ETH.
function nativeAssetForNetwork(network: string): string {
  switch (network.toUpperCase()) {
    case "BSC": return "BNB";
    case "SOL": return "SOL";
    default:    return "ETH";
  }
}

function decimalsForNetwork(network: string): number {
  return network.toUpperCase() === "SOL" ? 9 : 18;
}

function formatWeiAmount(raw: string, decimals = 18): string {
  try {
    const wei = BigInt(raw);
    const base = 10n ** BigInt(decimals);
    const whole = wei / base;
    const fraction = (wei % base).toString().padStart(decimals, "0").replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : whole.toString();
  } catch {
    return raw;
  }
}

function parseEthAmountToWei(raw: string, decimals = 18): bigint | null {
  const normalized = raw.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  try {
    return BigInt(whole) * 10n ** BigInt(decimals)
      + BigInt(fraction.padEnd(decimals, "0").slice(0, decimals));
  } catch {
    return null;
  }
}

function formatSendMessage(message: string, network: string, requestedAmount?: string): string {
  const insufficientFunds = message.match(/insufficient funds for gas \* price \+ value:\s*have\s+(\d+)\s+want\s+(\d+)/i);
  if (insufficientFunds) {
    const asset = nativeAssetForNetwork(network);
    const dp = decimalsForNetwork(network);
    const totalRequiredWei = BigInt(insufficientFunds[2]);
    let requiredDescription = `${formatWeiAmount(insufficientFunds[2], dp)} ${asset}`;
    if (requestedAmount) {
      const requestedWei = parseEthAmountToWei(requestedAmount, dp);
      if (requestedWei !== null && requestedWei > 0n && requestedWei <= totalRequiredWei) {
        const feeWei = totalRequiredWei - requestedWei;
        requiredDescription = `${requestedAmount} ${asset} plus ${formatWeiAmount(feeWei.toString(), dp)} ${asset} in network fees`;
      }
    }
    return `Insufficient funds: your wallet has ${formatWeiAmount(insufficientFunds[1], dp)} ${asset}, but this transaction requires ${requiredDescription}.`;
  }
  return message.replace(/\s*\(code\s+[-\d]+\)\s*$/i, "").trim();
}

function formatSendError(value: unknown, network: string, requestedAmount?: string): string {
  if (value instanceof Error && value.message) return formatSendMessage(value.message, network, requestedAmount);
  if (typeof value === "string" && value.trim()) return formatSendMessage(value, network, requestedAmount);
  if (value && typeof value === "object") {
    const error = value as Record<string, unknown>;
    const nested = error.error;
    if (nested && nested !== value) return formatSendError(nested, network, requestedAmount);
    const message = error.message ?? error.msg ?? error.detail ?? error.reason;
    if (typeof message === "string" && message.trim()) {
      return formatSendMessage(message, network, requestedAmount);
    }
    try { return JSON.stringify(value); } catch { return "Unknown transaction error"; }
  }
  return String(value || "Unknown transaction error");
}

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
  const [sendPassword, setSendPassword]         = useState("");
  const [showSendPwd, setShowSendPwd]           = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [showWithdrawPwd, setShowWithdrawPwd]   = useState(false);
  const [sendLoading, setSendLoading]         = useState(false);
  const [signingStep, setSigningStep]         = useState("");
  const [sendTxHash, setSendTxHash]           = useState<string | null>(null);
  const [sendTxUrl, setSendTxUrl]             = useState<string | null>(null);
  const [sendError, setSendError]             = useState<string | null>(null);
  const [sendCooldownUntil, setSendCooldownUntil] = useState<number>(0);
  const prevNetworkRef   = useRef<string>(network);
  const lastSendRef      = useRef<number>(0);
  const SEND_COOLDOWN_MS = 30_000;

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendRateLimit = usePasswordRateLimit({ maxAttempts: 5, baseDelayMs: 10_000 });
  const isSpot = accountType === "Spot account";
  const hasV3 = !!(user?.user_metadata?.aster_signer_key);

  // ── Effects ────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setAccountType(defaultAccountType);
      setAmount("");
      setWithdrawAddress("");
      setWalletPassword("");
      setWithdrawPassword("");
      setCoinOpen(false);
      setChainOpen(false);
      setAccountTypeOpen(false);
    }
  }, [open, defaultTab, defaultAccountType]);

  useEffect(() => {
    if (user) {
      const hasApiKey = !!(user.user_metadata?.aster_signer_key);
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

      const vault = userEvmWallet.encryptedMnemonic ?? userEvmWallet.encryptedPrivateKey;
      if (!vault) throw new Error("Wallet data not found. Please recreate your wallet.");

      setSigningStep("Preparing wallet…");
      await new Promise(r => setTimeout(r, 30));

      const signerWallet = asterGenerateSignerWallet();
      const agentName    = `pexly-${userEvmWallet.address.slice(2, 8).toLowerCase()}`;

      setSigningStep("Signing…");
      await new Promise(r => setTimeout(r, 30));

      // Signer callback — private key stays in the worker the entire time
      const workerSigner = async (hash: Uint8Array) => {
        const hashHex = "0x" + bytesToHex(hash);
        return signEVMRawHashFromVault(vault, walletPassword, hashHex);
      };

      // Single-call V3 registration — POST /fapi/v3/registerAndApproveAgent.
      // Signs with the main wallet key using EIP-712 (chainId=1666, Message.msg).
      // Field order in the signed message is FIXED per AsterDEX docs.
      await asterRegisterAndApproveAgent(workerSigner, userEvmWallet.address, signerWallet.address, agentName);

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
    enabled: !!user && hasV3,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // FIX: futures_balance is a SIGNED V3 action on the edge function — it 400s
  // with "AsterDEX credentials not linked" when the signer key is missing.
  // Gate it on hasV3 exactly like spotAccount.
  const { data: futuresBalance, isLoading: futuresLoading } = useQuery({
    queryKey: ["futures-balance"],
    queryFn: () => asterTrading.futuresBalance(),
    enabled: !!user && hasV3,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: coinInfoData } = useQuery({
    queryKey: ["coin-info", network],
    queryFn: () => asterWallet.coinInfo(network),
    enabled: !!user && open && hasV3,
    staleTime: 60_000,
    retry: 1,
  });

  // FIX: history is signed too — gate on hasV3 so we don't fire guaranteed 400s.
  const { data: depositHistory, isLoading: depositHistoryLoading } = useQuery({
    queryKey: ["deposit-history", isSpot],
    queryFn: () => isSpot ? asterWallet.depositHistory() : asterWallet.futuresDepositHistory(),
    enabled: !!user && hasV3 && txHistoryOpen && txHistoryTab === "deposits",
    staleTime: 30_000,
  });

  const { data: withdrawHistory, isLoading: withdrawHistoryLoading } = useQuery({
    queryKey: ["withdraw-history", isSpot],
    queryFn: () => isSpot ? asterWallet.withdrawHistory() : asterWallet.futuresWithdrawHistory(),
    enabled: !!user && hasV3 && txHistoryOpen && txHistoryTab === "withdrawals",
    staleTime: 30_000,
  });

  // Deposit address: edge derives chainId + SOL/EVM from the raw network name,
  // so `network` must stay a human name ("BSC" | "ETH" | "ARB" | "SOL").
  const {
    data: depositData,
    isLoading: depositLoading,
    isFetching: depositFetching,
    error: depositError,
  } = useQuery({
    queryKey: ["deposit-address", coin, network, chainAccountType],
    queryFn: () => isSpot
      ? asterWallet.depositAddress(coin, network)
      : asterWallet.futuresDepositAddress(coin, network),
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

  // Public action — no linked credentials needed, so it must NOT be gated on hasV3.
  const { data: feeEstimate, isLoading: feeLoading } = useQuery({
    queryKey: ["withdraw-fee", coin, network],
    queryFn: () => asterWallet.withdrawFeeEstimate(coin, network),
    enabled: !!user && open && activeTab === "withdraw" && !!coin && !!network,
    staleTime: 30_000,
    retry: 1,
  });

  // ── Derived data ──────────────────────────────────────

  const chainAssetsStale = chainAssetsLoading || chainAssetsFetching;
  const depositBusy = depositLoading || depositFetching;

  // FIX: run the live coinInfo through mergeCoinInfo() so only the supported
  // (chain, coin) pairs survive — USDT / USDC / native token per chain.
  const coins: CoinInfo[] = useMemo(() => mergeCoinInfo(coinInfoData as CoinInfo[] | undefined), [coinInfoData]);

  // Only the coins this project supports on the selected chain.
  const allowedCoins = useMemo<string[]>(
    () => CHAIN_COINS[network as DepositChain] ?? [],
    [network],
  );

  const selectorCoins: CoinInfo[] = useMemo(() => {
    if (activeTab === "deposit" || activeTab === "withdraw") {
      if (chainAssetsStale) return [];
      if (Array.isArray(chainAssetsData) && chainAssetsData.length > 0) {
        // FIX: BAPI returns the full chain asset list. Restrict it to the
        // supported matrix so the picker never shows unsupported tokens.
        const filtered = chainAssetsData.filter(a => allowedCoins.includes(a.coin.toUpperCase()));
        const list = filtered.length > 0 ? filtered : chainAssetsData;
        return list.map(a => {
          const withBalance = coins.find(c => c.coin === a.coin);
          return withBalance ? { ...a, free: withBalance.free, locked: withBalance.locked } : a;
        });
      }
      // No live assets → fall back to the derived matrix for this chain.
      return FALLBACK_COINS.filter(c => allowedCoins.includes(c.coin));
    }
    return coins;
  }, [activeTab, chainAssetsData, chainAssetsStale, coins, allowedCoins]);

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

  // FIX: fees are never hardcoded and never silently defaulted to "0".
  // Order of truth: live fee estimate → coinInfo.withdrawFee → unknown.
  // A "0" default would let the user sign a withdrawal with the wrong fee,
  // which AsterDEX rejects (the fee is part of the EIP-712 payload).
  const liveFee = isFeeKnown(feeEstimate?.gasCost != null ? String(feeEstimate.gasCost) : null)
    ? String(feeEstimate!.gasCost)
    : null;
  const resolvedFee: string = liveFee
    ?? (isFeeKnown(selectedNetworkInfo?.withdrawFee) ? selectedNetworkInfo!.withdrawFee : FEE_UNKNOWN);
  const feeKnown       = isFeeKnown(resolvedFee);
  const resolvedFeeNum = feeKnown ? parseFloat(resolvedFee) : 0;
  const amountNum      = parseFloat(amount) || 0;
  const withdrawMin    = isFeeKnown(selectedNetworkInfo?.withdrawMin)
    ? parseFloat(selectedNetworkInfo!.withdrawMin)
    : 0;
  const youReceive     = feeKnown ? Math.max(0, amountNum - resolvedFeeNum) : 0;
  // The withdraw button must stay disabled until we actually know the fee.
  const canWithdraw = feeKnown && amountNum > 0 && amountNum >= withdrawMin
    && amountNum <= currentBalance && !!withdrawAddress && !!withdrawPassword;

  // ── Withdraw / Transfer mutations ─────────────────────

  const onWithdrawSuccess = () => {
    toast({ title: "Withdrawal submitted", description: `${amount} ${coin} is being processed.` });
    setWithdrawAddress(""); setAmount(""); onOpenChange(false);
  };
  const onWithdrawError = (err: Error) =>
    toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });

  const spotWithdrawMutation = useMutation({
    mutationFn: async () => {
      if (!feeKnown) throw new Error("Network fee is still loading. Please try again in a moment.");
      if (!userEvmWallet) throw new Error("An EVM wallet is required to sign withdrawals on AsterDEX — please create one in Wallet first.");
      if (!withdrawPassword) throw new Error("Enter your wallet password to sign the withdrawal.");
      const vault = userEvmWallet.encryptedMnemonic ?? userEvmWallet.encryptedPrivateKey;
      if (!vault) throw new Error("Wallet data not found. Please recreate your wallet.");
      const mainUser = user?.user_metadata?.aster_user as string | undefined;
      if (!mainUser) throw new Error("Wallet not linked to AsterDEX. Please activate on the Deposit tab.");
      const workerSigner = async (hash: Uint8Array) =>
        signEVMRawHashFromVault(vault, withdrawPassword, "0x" + bytesToHex(hash));
      const chainId = String(CHAIN_MAP[network]?.chainId ?? 56);
      const { userSignature, userNonce } = await asterSignWithdrawal(workerSigner, {
        user: mainUser, asset: coin, receiver: withdrawAddress,
        amount, chainId, fee: resolvedFee,
      });
      return asterWallet.withdraw({
        coin, address: withdrawAddress, amount, network,
        fee: resolvedFee, userSignature, userNonce,
      });
    },
    onSuccess: onWithdrawSuccess, onError: onWithdrawError,
  });

  // Perp has NO withdraw endpoint on AsterDEX — asterWithdrawFromPerp()
  // transfers FUTURE→SPOT first, then performs the signed spot withdrawal.
  const futuresWithdrawMutation = useMutation({
    mutationFn: async () => {
      if (!feeKnown) throw new Error("Network fee is still loading. Please try again in a moment.");
      if (!userEvmWallet) throw new Error("An EVM wallet is required to sign withdrawals on AsterDEX — please create one in Wallet first.");
      if (!withdrawPassword) throw new Error("Enter your wallet password to sign the withdrawal.");
      const vault = userEvmWallet.encryptedMnemonic ?? userEvmWallet.encryptedPrivateKey;
      if (!vault) throw new Error("Wallet data not found. Please recreate your wallet.");
      const mainUser = user?.user_metadata?.aster_user as string | undefined;
      if (!mainUser) throw new Error("Wallet not linked to AsterDEX. Please activate on the Deposit tab.");
      const workerSigner = async (hash: Uint8Array) =>
        signEVMRawHashFromVault(vault, withdrawPassword, "0x" + bytesToHex(hash));
      return asterWithdrawFromPerp({
        user: mainUser, coin, address: withdrawAddress,
        amount, network, fee: resolvedFee, signer: workerSigner,
      });
    },
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
    setCoinOpen(false); setChainOpen(false); setAccountTypeOpen(false);
    resetSendState(); setWithdrawPassword("");
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
    // Never subtract an unknown fee — that would silently overstate the max.
    const max = activeTab === "withdraw" && feeKnown
      ? Math.max(0, currentBalance - resolvedFeeNum)
      : currentBalance;
    setAmount(coin === "BTC" ? max.toFixed(8) : max.toFixed(4));
  };
  const requireAuth = () => { if (!user) { navigate("/signin"); onOpenChange(false); } };

  // ── Send-from-wallet handlers ─────────────────────────

  const handleSendFromWallet = async () => {
    if (!user || !depositAddress || !amount) return;
    const wallet = network === "SOL" ? userSolWallet : userEvmWallet;
    if (!wallet) return;
    // Disable the button immediately — before any async work —
    // so fast/repeated taps cannot queue multiple broadcasts.
    if (sendLoading) return;
    // Rate limit: enforce a 30-second cooldown between send attempts
    // to prevent accidental duplicate broadcasts.
    const now = Date.now();
    const elapsed = now - lastSendRef.current;
    if (elapsed < SEND_COOLDOWN_MS) {
      const remaining = Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
      setSendError(`Please wait ${remaining}s before sending again.`);
      return;
    }
    lastSendRef.current = now;
    setSendCooldownUntil(now + SEND_COOLDOWN_MS);
    setSendLoading(true);
    setSendError(null);
    setSendTxHash(null);
    setSendTxUrl(null);
    try {
      const vaultKey = wallet.encryptedMnemonic ?? wallet.encryptedPrivateKey;
      if (!vaultKey) throw new Error("Wallet data not found. Please recreate your wallet.");
      // Pass vault + password directly — no main-thread mnemonic decryption
      const result = await broadcastDeposit({
        coin, network, amount,
        vault: vaultKey,
        password: sendPassword,
        depositAddress,
        walletAddress: wallet.address,
        contractAddress: selectedCoinInfo?.contractAddress,
        decimals: selectedCoinInfo?.decimals,
        isNative: selectedCoinInfo?.isNative,
      });
      sendRateLimit.reset();
      setSendTxHash(result.txHash);
      setSendTxUrl(result.explorerUrl);
      setSendPassword("");
      toast({ title: "Deposit sent!", description: "Transaction broadcast successfully." });
    } catch (err: any) {
      const msg = formatSendError(err, network, amount);
      if (/password|decrypt|invalid|corrupted/i.test(msg)) {
        sendRateLimit.recordFailure();
      }
      setSendError(msg || "Transaction failed. Please try again.");
    } finally {
      setSendLoading(false);
    }
  };

  return {
    // Navigation
    activeTab, setActiveTab, handleTabChange,
    // Account type
    accountType, accountTypeOpen, setAccountTypeOpen, handleAccountTypeChange, isSpot, hasV3,
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
    currentBalance, resolvedFee, resolvedFeeNum, feeKnown, canWithdraw,
    withdrawMin, youReceive, feeLoading,
    spotBalanceFor, futuresAvailFor, headerBalance, spotLoading, futuresLoading,
    // Send state (deposit Sign & Send)
    sendRateLimit,
    sendPassword, setSendPassword, showSendPwd, setShowSendPwd,
    sendLoading, sendTxHash, sendTxUrl, sendError, handleSendFromWallet, sendCooldownUntil,
    // Withdraw signing password
    withdrawPassword, setWithdrawPassword, showWithdrawPwd, setShowWithdrawPwd,
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
