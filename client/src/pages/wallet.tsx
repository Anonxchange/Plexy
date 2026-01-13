// 🔧 SAFE FIXED VERSION – MINIMALLY INVASIVE

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Smartphone,
  Eye,
  EyeOff,
  ChevronDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { SendCryptoDialog } from "@/components/send-crypto-dialog";
import { ReceiveCryptoDialog } from "@/components/receive-crypto-dialog";
import { getUserWallets, type Wallet } from "@/lib/wallet-api";
import { getCryptoPrices, convertToNGN } from "@/lib/crypto-prices";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { Sparkline } from "@/components/ui/sparkline";
import { useWalletBalances } from "@/hooks/use-wallet-balances";

/* ------------------ CONSTANTS ------------------ */

const cryptoAssets = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: cryptoIconUrls.BTC },
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH },
  { symbol: "SOL", name: "Solana", iconUrl: cryptoIconUrls.SOL },
  { symbol: "BNB", name: "Binance Coin", iconUrl: cryptoIconUrls.BNB },
  { symbol: "TRX", name: "Tron", iconUrl: cryptoIconUrls.TRX },
  { symbol: "USDC", name: "USD Coin", iconUrl: cryptoIconUrls.USDC },
  { symbol: "USDT", name: "Tether", iconUrl: cryptoIconUrls.USDT },
];

/* ------------------ UTIL ------------------ */

const generateSparklineData = (
  base: number,
  trend: "up" | "down" | "neutral",
  points = 20
) => {
  let current = base || 1;
  const drift = trend === "up" ? 0.01 : trend === "down" ? -0.01 : 0;

  return Array.from({ length: points }, () => {
    current *= 1 + drift;
    return current;
  });
};

/* ------------------ COMPONENT ------------------ */

export default function Wallet() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { balances, fetchBalances, loading: balancesLoading } =
    useWalletBalances();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, any>>({});
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [hideZeroBalance, setHideZeroBalance] = useState(false);

  const isVisibleRef = useRef(true);

  /* ------------------ AUTH REDIRECT ------------------ */

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace("/signin");
    }
  }, [user, loading]);

  /* ------------------ VISIBILITY CONTROL ------------------ */

  useEffect(() => {
    const handler = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  /* ------------------ DATA LOADERS ------------------ */

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [walletData, prices] = await Promise.all([
        getUserWallets(user.id),
        getCryptoPrices(["BTC", "ETH", "SOL", "BNB", "TRX", "USDC", "USDT"]),
      ]);
      setWallets(walletData || []);
      setCryptoPrices(prices || {});
    };

    load();
    fetchBalances();

    const interval = setInterval(() => {
      if (isVisibleRef.current) {
        fetchBalances();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchBalances]);

  /* ------------------ MERGED ASSETS (MEMOIZED) ------------------ */

  const mergedAssets = useMemo(() => {
    return cryptoAssets.map((asset) => {
      const wallet = wallets.find((w) => w.crypto_symbol === asset.symbol);
      const balanceObj = balances.find((b) => b.symbol === asset.symbol);
      const price = cryptoPrices[asset.symbol]?.current_price || 0;

      const balance =
        Number(balanceObj?.balance || 0) + Number(wallet?.locked_balance || 0);

      const usdValue = balance * price;
      const ngnValue = convertToNGN(usdValue);

      const trend =
        cryptoPrices[asset.symbol]?.price_change_percentage_24h > 0
          ? "up"
          : "down";

      return {
        ...asset,
        balance,
        usdValue,
        ngnValue,
        sparklineData: generateSparklineData(price, trend),
      };
    });
  }, [wallets, balances, cryptoPrices]);

  const filteredAssets = hideZeroBalance
    ? mergedAssets.filter((a) => a.balance > 0)
    : mergedAssets;

  const totalBalance = useMemo(
    () => mergedAssets.reduce((sum, a) => sum + a.usdValue, 0),
    [mergedAssets]
  );

  /* ------------------ RENDER ------------------ */

  if (loading || balancesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading wallet…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto p-6 flex-1">
        <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

        {/* TOTAL */}
        <div className="bg-card p-6 rounded-2xl mb-6">
          <div className="flex justify-between">
            <span>Total Assets</span>
            <button onClick={() => setBalanceVisible((v) => !v)}>
              {balanceVisible ? <Eye /> : <EyeOff />}
            </button>
          </div>

          <div className="text-4xl font-bold mt-2">
            {balanceVisible
              ? totalBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })
              : "••••••"}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button onClick={() => setReceiveDialogOpen(true)}>
            <ArrowDownToLine />
            Receive
          </button>
          <button onClick={() => setSendDialogOpen(true)}>
            <ArrowUpFromLine />
            Send
          </button>
          <button onClick={() => setLocation("/swap")}>
            <ArrowLeftRight />
            Swap
          </button>
          <button onClick={() => setLocation("/wallet/mobile-topup")}>
            <Smartphone />
            Topup
          </button>
        </div>

        {/* TOGGLE */}
        <div className="flex items-center gap-2 mb-4">
          <Switch checked={hideZeroBalance} onCheckedChange={setHideZeroBalance} />
          <span>Hide zero balance</span>
        </div>

        {/* ASSETS */}
        <div className="space-y-3">
          {filteredAssets.map((asset) => (
            <Card key={asset.symbol}>
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={asset.iconUrl} className="w-8 h-8" />
                  <div>
                    <div>{asset.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {asset.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div>{asset.balance.toFixed(6)}</div>
                  <div className="text-xs text-muted-foreground">
                    ${asset.usdValue.toFixed(2)}
                  </div>
                </div>
              </CardContent>

              {balanceVisible && asset.balance > 0 && (
                <Sparkline data={asset.sparklineData} />
              )}
            </Card>
          ))}
        </div>
      </div>

      <PexlyFooter />

      <SendCryptoDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        wallets={filteredAssets}
      />
      <ReceiveCryptoDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        wallets={filteredAssets}
      />
    </div>
  );
}
