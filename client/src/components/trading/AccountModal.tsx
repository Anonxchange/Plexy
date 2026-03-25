import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  X, ChevronDown, ClipboardList, Copy, Check, Loader2, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading, asterWallet, asterGetNonce, asterCreateApiKey, asterGetDepositAddress, asterGetChainAssets, CoinInfo } from "@/lib/asterdex-service";
import { supabase } from "@/lib/supabase";
import { nonCustodialWalletManager, NonCustodialWallet } from "@/lib/non-custodial-wallet";
import { signEVMMessage } from "@/lib/evmSigner";
import { useToast } from "@/hooks/use-toast";
import { getCryptoIconUrl } from "@/lib/crypto-icons";

// ── Chain config ──────────────────────────────────────────
const CHAINS = [
  { key: "BSC", name: "BNB Chain",    chainId: 56,    color: "#F3BA2F" },
  { key: "ETH", name: "Ethereum",      chainId: 1,     color: "#627EEA" },
  { key: "ARB", name: "Arbitrum One", chainId: 42161, color: "#12AAFF" },
  { key: "SOL", name: "Solana",        chainId: 101,   color: "#9945FF" },
] as const;

// All chains that AsterDEX supports for deposit (EVM + Solana)
const DEPOSIT_CHAINS = ["BSC", "ETH", "ARB", "SOL"] as const;
type DepositChain = typeof DEPOSIT_CHAINS[number];

const CHAIN_MAP = Object.fromEntries(CHAINS.map(c => [c.key, c]));

// Real chain logo icons from TrustWallet assets CDN
const CHAIN_ICONS: Record<string, string> = {
  BSC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png",
  ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  ARB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
};

// Extra coin icons not in the shared cryptoIconUrls map
const EXTRA_COIN_ICONS: Record<string, string> = {
  USDCE: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USD1:  "https://assets.coingecko.com/coins/images/31212/small/PYUSD_Logo_%282%29.png",
  ASTER: "https://assets.coingecko.com/coins/images/30980/small/token-logo.png",
};

function getCoinIcon(symbol: string): string {
  return EXTRA_COIN_ICONS[symbol] ?? getCryptoIconUrl(symbol);
}

const ACCOUNT_TYPES = ["Spot account", "Perpetual account"] as const;
type AccountType = typeof ACCOUNT_TYPES[number];

// Fallback coin list used when the authenticated coinInfo API is unavailable
const FALLBACK_COINS: CoinInfo[] = [
  { coin: "USDT", name: "Tether", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "2",      withdrawMin: "10",    depositMin: "10"   },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "SOL", withdrawEnable: true, depositEnable: true, withdrawFee: "0.2",    withdrawMin: "2",     depositMin: "2"    },
  ]},
  { coin: "USDC", name: "USD Coin", free: "0", locked: "0", networkList: [
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "2",      withdrawMin: "10",    depositMin: "10"   },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "SOL", withdrawEnable: true, depositEnable: true, withdrawFee: "0.2",    withdrawMin: "2",     depositMin: "2"    },
  ]},
  { coin: "BNB",  name: "BNB", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
  ]},
  { coin: "ETH",  name: "Ethereum", free: "0", locked: "0", networkList: [
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
  ]},
  { coin: "BTC",  name: "Bitcoin", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.0001", withdrawMin: "0.001", depositMin: "0.001" },
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "0.0001", withdrawMin: "0.001", depositMin: "0.001" },
  ]},
  { coin: "SOL",  name: "Solana", free: "0", locked: "0", networkList: [
    { network: "SOL", withdrawEnable: true, depositEnable: true, withdrawFee: "0.01",   withdrawMin: "0.1",   depositMin: "0.1"  },
  ]},
  { coin: "USD1", name: "USD1", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "2",      withdrawMin: "10",    depositMin: "10"   },
  ]},
  { coin: "USDCE", name: "Bridged USDC", free: "0", locked: "0", networkList: [
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
  ]},
  { coin: "ASTER", name: "Aster", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "1",      withdrawMin: "10",    depositMin: "10"   },
  ]},
];

function asterRegKey(userId: string) { return `aster_reg_${userId}`; }

// ── Props ─────────────────────────────────────────────────
interface AccountModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab: "deposit" | "withdraw" | "transfer";
  defaultAccountType: AccountType;
  variant?: "sheet" | "dialog";
}

// ── Chain icon (real image with fallback) ─────────────────
function ChainIcon({ chainKey, size = 22 }: { chainKey: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = CHAIN_ICONS[chainKey];
  const c = CHAIN_MAP[chainKey];
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={chainKey}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-black"
      style={{ width: size, height: size, background: c?.color ?? "#888", fontSize: size * 0.38 }}
    >
      {c?.name.slice(0, 1) ?? "?"}
    </span>
  );
}

// ── Coin icon (real image with fallback) ──────────────────
function CoinIcon({ symbol, size = 22 }: { symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = getCoinIcon(symbol);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-primary bg-primary/20"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────
export function AccountModal({ open, onOpenChange, defaultTab, defaultAccountType, variant = "sheet" }: AccountModalProps) {
  const [activeTab, setActiveTab]         = useState<"deposit" | "withdraw" | "transfer">(defaultTab);
  const [accountType, setAccountType]     = useState<AccountType>(defaultAccountType);
  const [accountTypeOpen, setAccountTypeOpen] = useState(false);
  const [coin, setCoin]                   = useState("USDT");
  const [network, setNetwork]             = useState<string>("BSC");
  const [chainOpen, setChainOpen]         = useState(false);
  const [coinOpen, setCoinOpen]           = useState(false);
  const [amount, setAmount]               = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [copied, setCopied]               = useState(false);

  // Wallet registration state
  const [isAsterRegistered, setIsAsterRegistered] = useState(false);
  const [userEvmWallet, setUserEvmWallet]   = useState<NonCustodialWallet | null>(null);
  const [walletLoading, setWalletLoading]   = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);

  // Track previous network to detect real transitions and clear stale state
  const prevNetworkRef = useRef<string>(network);

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

  // Authoritative connection check: wallet is properly linked when the user has an API key
  // stored in their Supabase metadata. localStorage is a local cache only.
  useEffect(() => {
    if (user) {
      const hasApiKey = !!user.user_metadata?.aster_api_key;
      setIsAsterRegistered(hasApiKey);
      // Keep localStorage in sync so the deposit address query re-runs when needed
      if (hasApiKey) {
        localStorage.setItem(asterRegKey(user.id), "true");
      }
    }
  }, [user]);

  // Load EVM wallet whenever needed — for registration flow AND for withdraw autoWithdraw address.
  // Not gated on isAsterRegistered so a connected user can still get their wallet address.
  const loadEvmWallet = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  // ── Registration mutation ──────────────────────────────
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!userEvmWallet || !user) throw new Error("No EVM wallet found. Create one in Wallet first.");
      if (!walletPassword) throw new Error("Enter your wallet password to sign.");
      const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(userEvmWallet.id, walletPassword, user.id);
      if (!mnemonic) throw new Error("Incorrect password or wallet not found.");
      // Step 1: Get a one-time signing challenge from AsterDEX
      const nonce = await asterGetNonce(userEvmWallet.address);
      const message = `You are signing into Astherus ${nonce}`;
      // Step 2: Sign the challenge — proves wallet ownership without exposing the key
      const signature = await signEVMMessage(mnemonic, message);
      // Step 3: Exchange signature for an API key tied to this wallet
      const { apiKey, apiSecret } = await asterCreateApiKey(userEvmWallet.address, signature);
      // Step 4: Persist API credentials in Supabase profile (used for all future AsterDEX calls)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { aster_api_key: apiKey, aster_api_secret: apiSecret },
      });
      if (updateError) throw new Error("Wallet linked but failed to save credentials: " + updateError.message);
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

  // Deposit address — keyed per network so each chain has an independent cache entry.
  // placeholderData:undefined prevents the previous network's address from bleeding in.
  const {
    data: depositData,
    isLoading: depositLoading,
    isFetching: depositFetching,
    error: depositError,
  } = useQuery({
    queryKey: ["deposit-address", coin, network],
    queryFn: () => {
      // Use the public BAPI treasury deposit-address endpoint — keyed by chain.
      // Returns the exchange's deposit address for this chain (no API key needed).
      const chainId = CHAIN_MAP[network]?.chainId ?? 56;
      return asterGetDepositAddress(chainId);
    },
    // Fetch as soon as the deposit tab is open — this is a public endpoint, no API key needed
    enabled: !!user && open && activeTab === "deposit" && !!network,
    staleTime: 300_000,
    placeholderData: undefined,
    retry: 1,
  });

  const depositBusy = depositLoading || depositFetching;

  // Load EVM wallet when:
  // - user is on deposit tab and not yet registered (registration flow always needs wallet)
  // - user opens the withdraw tab (need address silently for autoWithdraw)
  useEffect(() => {
    if (!user || userEvmWallet || walletLoading) return;
    if ((activeTab === "deposit" && !isAsterRegistered) || activeTab === "withdraw") {
      loadEvmWallet();
    }
  }, [isAsterRegistered, user, loadEvmWallet, activeTab, userEvmWallet, walletLoading]);

  // Silently populate withdrawAddress from the connected wallet (autoWithdraw — no manual input needed)
  useEffect(() => {
    if (activeTab === "withdraw" && userEvmWallet?.address) {
      setWithdrawAddress(userEvmWallet.address);
    }
  }, [activeTab, userEvmWallet]);

  // Chain assets — fetches coins for the selected chain on both deposit and withdraw tabs.
  // Spot and Perpetual have different coin lists per chain, so we pass accountType accordingly.
  // SOL uses networks=SOL (handled in asterGetChainAssets), EVM chains use networks=EVM.
  const chainAccountType = isSpot ? 'spot' : 'perp';
  const {
    data: chainAssetsData,
    isLoading: chainAssetsLoading,
    isFetching: chainAssetsFetching,
  } = useQuery({
    queryKey: ["aster-chain-assets", network, chainAccountType],
    queryFn: () => asterGetChainAssets(CHAIN_MAP[network]?.chainId ?? 56, chainAccountType),
    enabled: open && (activeTab === "deposit" || activeTab === "withdraw") && (DEPOSIT_CHAINS as readonly string[]).includes(network),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // True while the chain's coin list is being fetched (prevents stale coin bleed)
  const chainAssetsStale = chainAssetsLoading || chainAssetsFetching;

  const { data: feeEstimate, isLoading: feeLoading } = useQuery({
    queryKey: ["withdraw-fee", coin, network],
    queryFn: () => asterWallet.withdrawFeeEstimate(coin, network),
    enabled: !!user && open && activeTab === "withdraw",
    staleTime: 30_000,
    retry: 1,
  });

  // ── Derived data ─────────────────────────────────────
  const coins: CoinInfo[] = useMemo(() => {
    if (Array.isArray(coinInfoData) && coinInfoData.length > 0) return coinInfoData;
    return FALLBACK_COINS;
  }, [coinInfoData]);

  // For deposit and withdraw: coins for the selected chain (from chain assets API).
  // While transitioning between chains, return [] so we never show the old chain's coins.
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

  // When network changes on deposit or withdraw tab: reset coin selection to avoid stale picks
  useEffect(() => {
    if (activeTab !== "deposit" && activeTab !== "withdraw") return;
    if (prevNetworkRef.current !== network) {
      prevNetworkRef.current = network;
      setCoin("USDT");
      setAmount("");
    }
  }, [network, activeTab]);

  // If the selected coin isn't available on the new chain once it loads, pick the first one
  useEffect(() => {
    if ((activeTab === "deposit" || activeTab === "withdraw") && selectorCoins.length > 0 && !selectorCoins.some(c => c.coin === coin)) {
      setCoin(selectorCoins[0].coin);
    }
  }, [selectorCoins, coin, activeTab]);

  const selectedCoinInfo = useMemo(
    () => selectorCoins.find(c => c.coin === coin) ?? selectorCoins[0],
    [selectorCoins, coin]
  );

  // Deposit: always show all supported deposit chains (chain drives coin list, not vice versa).
  // Withdraw: show only chains where the selected coin supports withdrawal.
  const availableNetworks = useMemo(() => {
    if (activeTab === "deposit") {
      return [...DEPOSIT_CHAINS] as string[];
    }
    const list = selectedCoinInfo?.networkList.filter(n => n.withdrawEnable);
    return list?.map(n => n.network) ?? ["BSC"];
  }, [selectedCoinInfo, activeTab]);

  // Keep network valid when tab or coin changes
  useEffect(() => {
    if (availableNetworks.length > 0 && !availableNetworks.includes(network)) {
      setNetwork(availableNetworks[0]);
    }
  }, [availableNetworks, network]);

  const selectedNetworkInfo = useMemo(
    () => selectedCoinInfo?.networkList.find(n => n.network === network),
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
    ? spotLoading    ? "..." : `${usdtSpot.toFixed(2)} USDT`
    : futuresLoading ? "..." : `${usdtFutures.toFixed(2)} USDT`;

  const currentBalance = (() => {
    if (!isSpot && activeTab === "deposit")  return spotBalanceFor(coin);
    if (!isSpot && activeTab === "withdraw") return futuresAvailFor(coin);
    return spotBalanceFor(coin);
  })();

  const depositAddress: string = typeof depositData === "string"
    ? depositData
    : (depositData as any)?.address ?? "";
  const depositMemo: string = (depositData as any)?.tag ?? (depositData as any)?.memo ?? "";

  const liveFee        = feeEstimate?.gasCost ? String(feeEstimate.gasCost) : null;
  const resolvedFee    = liveFee ?? selectedNetworkInfo?.withdrawFee ?? "0";
  const resolvedFeeNum = parseFloat(resolvedFee);
  const amountNum      = parseFloat(amount) || 0;
  const withdrawMin    = parseFloat(selectedNetworkInfo?.withdrawMin ?? "0");
  const youReceive     = Math.max(0, amountNum - resolvedFeeNum);

  // ── Mutations ────────────────────────────────────────
  const onWithdrawSuccess = () => {
    toast({ title: "Withdrawal submitted", description: `${amount} ${coin} is being processed.` });
    setWithdrawAddress("");
    setAmount("");
    onOpenChange(false);
  };
  const onWithdrawError = (err: Error) =>
    toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });

  // Spot account: withdraw via spot_withdraw endpoint
  const spotWithdrawMutation = useMutation({
    mutationFn: () => asterWallet.withdraw(coin, withdrawAddress, amount, network, resolvedFee),
    onSuccess: onWithdrawSuccess,
    onError: onWithdrawError,
  });

  // Futures/Perpetual account: withdraw via futures_withdraw endpoint
  const futuresWithdrawMutation = useMutation({
    mutationFn: () => asterWallet.futuresWithdraw(coin, withdrawAddress, amount, network, resolvedFee),
    onSuccess: onWithdrawSuccess,
    onError: onWithdrawError,
  });

  // Alias to the correct mutation for the active account type
  const withdrawMutation = isSpot ? spotWithdrawMutation : futuresWithdrawMutation;

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
      toast({ title: "Transfer successful", description: `${amount} ${coin} moved to ${toAccount} account.` });
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
    setCoin(c);
    // For withdraw only: switch to first valid network if current isn't supported for this coin
    if (activeTab === "withdraw") {
      const info = selectorCoins.find(ci => ci.coin === c);
      const nets = info?.networkList.filter(n => n.withdrawEnable).map(n => n.network) ?? [];
      if (nets.length > 0 && !nets.includes(network)) setNetwork(nets[0]);
    }
    // For deposit: network (chain) was selected first — don't override it on coin change
    setCoinOpen(false);
    setAmount("");
  };

  const handleMax = () => {
    const max = activeTab === "withdraw"
      ? Math.max(0, currentBalance - resolvedFeeNum)
      : currentBalance;
    setAmount(coin === "BTC" ? max.toFixed(8) : max.toFixed(4));
  };

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
              className={`w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors ${t === accountType ? "text-primary" : "text-foreground"}`}>
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
              className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm hover:bg-accent transition-colors ${n === network ? "text-primary" : "text-foreground"}`}>
              <ChainIcon chainKey={n} size={20} />
              {CHAIN_MAP[n]?.name ?? n}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Standalone coin selector (just the picker row, no amount input)
  const CoinSelector = () => (
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

  // Combined coin + amount row (used for deposit coin picker and transfer/perp flows)
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
            <button onClick={handleMax} className="text-xs text-primary font-semibold mr-1">MAX</button>
          )}
          <button
            onClick={() => setCoinOpen(v => !v)}
            className="flex items-center gap-1.5"
          >
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
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading coins…</span>
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

  const BalanceLine = ({ label = "Balance", value }: { label?: string; value: string }) => (
    <div className="flex items-center justify-between px-1 mb-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground font-mono-num">{value}</span>
    </div>
  );

  // Registration form block — shown whenever the user hasn't linked their wallet yet.
  // Must appear before the deposit address so an unregistered user can never see the
  // shared treasury address (which is meaningless without a linked account).
  const RegistrationBlock = () => (
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
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-primary/50"
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
  );

  // Shared deposit address display block — only shown after wallet is linked.
  const DepositAddressBlock = () => {
    // Always gate on registration — the public treasury address is useless without a linked account.
    if (!isAsterRegistered && user) {
      return <RegistrationBlock />;
    }
    if (depositBusy) {
      return (
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading deposit address…</span>
        </div>
      );
    }
    if (depositAddress) {
      return (
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
            <div className="mt-2 pt-2 border-t border-primary/20">
              <p className="text-xs text-primary font-medium">Memo required</p>
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
      );
    }
    if (depositError) {
      return (
        <div className="flex items-center gap-2 mb-4 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Could not load deposit address. Please try again.</span>
        </div>
      );
    }
    return null;
  };

  const DepositCTA = () => {
    if (!user) return (
      <button onClick={requireAuth}
        className="w-full py-3.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
        Sign in to Deposit
      </button>
    );
    // Registration required before any deposit address can be shown
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
            : "Sign & Activate Deposit Address"}
        </button>
      );
    }
    if (depositBusy) return (
      <button disabled className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground">
        Loading…
      </button>
    );
    if (depositAddress) return (
      <button disabled className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground">
        Send {coin} to the address above
      </button>
    );
    return (
      <button disabled className="w-full py-3.5 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground">
        Loading…
      </button>
    );
  };

  // ── Render ─────────────────────────────────────────────
  const modalBody = (
    <>
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

            {isSpot && (
              <>
                {/* Chain first (drives coin list), then coin picker */}
                <ChainSelector />
                <CoinAmountRow />
                <BalanceLine value={`${spotBalanceFor(coin).toFixed(4)} ${coin}`} />
                <DepositAddressBlock />
                <DepositCTA />
              </>
            )}

            {!isSpot && (
              <>
                <ChainSelector />
                <CoinAmountRow />
                <BalanceLine value={`${futuresAvailFor(coin).toFixed(4)} ${coin}`} />
                <DepositAddressBlock />
                <DepositCTA />
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Already have funds in Spot?{" "}
                  <button
                    onClick={() => setActiveTab("transfer")}
                    className="text-primary underline-offset-2 hover:underline"
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

            {/* Same external withdrawal UI for both Spot and Perpetual accounts */}
            <ChainSelector />

            <CoinAmountRow showMax />

            {amountNum > currentBalance && (
              <p className="text-xs text-destructive px-1 mb-2">Exceeds available balance</p>
            )}
            {amountNum > 0 && amountNum < withdrawMin && (
              <p className="text-xs text-destructive px-1 mb-2">Minimum withdrawal is {withdrawMin} {coin}</p>
            )}

            <BalanceLine
              label={isSpot ? "Spot balance" : "Perpetual balance"}
              value={`${currentBalance.toFixed(coin === "BTC" ? 8 : 4)} ${coin}`}
            />

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

            {/* No wallet connected — show registration prompt */}
            {user && !isAsterRegistered && !walletLoading && (
              <p className="text-xs text-center text-muted-foreground mb-3">
                Connect your wallet on the{" "}
                <button onClick={() => handleTabChange("deposit")} className="text-primary hover:underline">
                  Deposit tab
                </button>{" "}
                to enable withdrawals.
              </p>
            )}

            <button
              onClick={() => !user ? requireAuth() : withdrawMutation.mutate()}
              disabled={
                !user ||
                walletLoading ||
                !withdrawAddress ||
                !amount ||
                amountNum <= 0 ||
                amountNum > currentBalance ||
                (amountNum < withdrawMin && amountNum > 0) ||
                withdrawMutation.isPending
              }
              className="w-full py-3.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {withdrawMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                : walletLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Loading wallet…</>
                  : `Withdraw ${coin}`}
            </button>
          </>
        )}

        {/* ══════════════ TRANSFER ══════════════ */}
        {activeTab === "transfer" && (
          <>
            <AccountTypeSelector />
            <CoinAmountRow showMax />
            <BalanceLine
              label={isSpot ? "Spot available" : "Perpetual available"}
              value={`${(isSpot ? spotBalanceFor(coin) : futuresAvailFor(coin)).toFixed(4)} ${coin}`}
            />
            <button
              onClick={() => !user ? requireAuth() : transferMutation.mutate()}
              disabled={!user || !amount || amountNum <= 0 || transferMutation.isPending}
              className="w-full py-3.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {transferMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" />Transferring…</>
                : isSpot ? "Transfer to Perpetual" : "Transfer to Spot"}
            </button>
          </>
        )}
    </>
  );

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border border-border rounded-2xl px-5 pb-8 pt-5 max-w-md w-full max-h-[90vh] overflow-y-auto [&>button.absolute]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Account</DialogTitle>
          </DialogHeader>
          {modalBody}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-t border-border rounded-t-2xl px-5 pb-10 pt-5 max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Account</SheetTitle>
        </SheetHeader>
        {modalBody}
      </SheetContent>
    </Sheet>
  );
}
