
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Loader2, CheckCircle2, X, ShieldCheck, ShieldAlert } from '@/lib/icons';
import { signBitcoinTransaction } from "@/lib/bitcoinSigner";
import { signEVMTransaction } from "@/lib/evmSigner";
import { signSolanaTransaction } from "@/lib/solanaSigner";
import { signTronTransaction } from "@/lib/tronSigner";
import { useAuth } from "@/lib/auth-context";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useSendFee } from "@/hooks/use-fees";
import { getCryptoPrices, convertCurrency } from "@/lib/crypto-prices";
import { useToast } from "@/hooks/use-toast";
import { preTransactionCheck, type AddressSecurityResult, type TokenSecurityResult, GOPLUS_CHAINS } from "@/lib/goplusSecurity";
import { useIsMobile } from "@/hooks/use-mobile";

interface SendCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Array<{ symbol: string; balance: number; name: string; icon: string }>;
  initialSymbol?: string;
  onSuccess?: () => void;
}

type Step = "select" | "details";

export function SendCryptoDialog({ open, onOpenChange, wallets, initialSymbol, onSuccess }: SendCryptoDialogProps) {
  const { user, isWalletUnlocked, getSessionPassword, setSessionPassword } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) {
      if (initialSymbol) {
        setSelectedCrypto(initialSymbol);
        setStep("details");
      } else {
        setStep("select");
        setSelectedCrypto("");
      }
    }
  }, [open, initialSymbol]);
  const [toAddress, setToAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [amountInputMode, setAmountInputMode] = useState<"fiat" | "crypto">("fiat");
  const [cryptoAmount, setCryptoAmount] = useState<string>("");
  const [fiatAmount, setFiatAmount] = useState<string>("");
  const [cryptoPrice, setCryptoPrice] = useState<number>(0);
  const [useNonCustodial, setUseNonCustodial] = useState(false);
  const [userPassword, setUserPassword] = useState<string>("");
  const [securityCheck, setSecurityCheck] = useState<{
    loading: boolean;
    safe: boolean;
    warnings: string[];
    addressCheck?: AddressSecurityResult;
    tokenCheck?: TokenSecurityResult;
  }>({ loading: false, safe: true, warnings: [] });

  useEffect(() => {
    const performSecurityCheck = async () => {
      if (!toAddress || toAddress.length < 30 || !selectedCrypto || !selectedNetwork) {
        setSecurityCheck({ loading: false, safe: true, warnings: [] });
        return;
      }

      setSecurityCheck(prev => ({ ...prev, loading: true }));
      try {
        const chainId = GOPLUS_CHAINS[selectedNetwork.toLowerCase().split(' ')[0]] ||
                        GOPLUS_CHAINS[selectedCrypto.toLowerCase()] || '1';

        const result = await preTransactionCheck({ chainId, toAddress });

        setSecurityCheck({
          loading: false,
          safe: result.safe,
          warnings: result.warnings,
          addressCheck: result.addressCheck,
          tokenCheck: result.tokenCheck
        });
      } catch (err) {
        console.error("Security check failed:", err);
        setSecurityCheck(prev => ({ ...prev, loading: false }));
      }
    };

    const timer = setTimeout(performSecurityCheck, 800);
    return () => clearTimeout(timer);
  }, [toAddress, selectedCrypto, selectedNetwork]);

  const networkMap: Record<string, string[]> = {
    BTC: ["Bitcoin (SegWit)"],
    ETH: ["Ethereum (ERC-20)"],
    SOL: ["Solana"],
    BNB: ["Binance Smart Chain (BEP-20)"],
    TRX: ["Tron (TRC-20)"],
    USDC: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)"],
    USDT: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)"],
  };

  useEffect(() => {
    const fetchPrice = async () => {
      if (!selectedCrypto) return;
      try {
        const prices = await getCryptoPrices([selectedCrypto]);
        if (prices[selectedCrypto]) {
          const priceInSelectedCurrency = selectedCurrency === "NGN"
            ? await convertCurrency(prices[selectedCrypto].current_price, "NGN")
            : prices[selectedCrypto].current_price;
          setCryptoPrice(priceInSelectedCurrency);
        }
      } catch (error) {
        console.error("Error fetching crypto price:", error);
      }
    };
    fetchPrice();
  }, [selectedCrypto, selectedCurrency]);

  useEffect(() => {
    if (!cryptoPrice || cryptoPrice === 0) return;

    if (amountInputMode === "fiat") {
      const fiatValue = parseFloat(amount);
      if (isNaN(fiatValue) || !amount) { setCryptoAmount(""); return; }
      setCryptoAmount((fiatValue / cryptoPrice).toFixed(8));
    } else {
      const cryptoValue = parseFloat(amount);
      if (isNaN(cryptoValue) || !amount) { setFiatAmount(""); return; }
      setFiatAmount((cryptoValue * cryptoPrice).toFixed(2));
    }
  }, [amount, cryptoPrice, amountInputMode]);

  const getNetworkSpecificSymbol = (crypto: string, network: string): string => {
    if (crypto === 'USDT' || crypto === 'USDC') {
      if (network.includes('ERC-20')) return `${crypto}-ERC20`;
      if (network.includes('BEP-20')) return `${crypto}-BEP20`;
      if (network.includes('TRC-20')) return `${crypto}-TRC20`;
      if (network.includes('SPL')) return `${crypto}-SOL`;
    }
    return crypto;
  };

  const selectedWallet = wallets.find(w => w.symbol === selectedCrypto);
  const networkSpecificSymbol = selectedCrypto && selectedNetwork
    ? getNetworkSpecificSymbol(selectedCrypto, selectedNetwork)
    : selectedCrypto;
  const cryptoAmountForFee = amountInputMode === "crypto"
    ? parseFloat(amount) || 0
    : parseFloat(cryptoAmount) || 0;

  const { data: feeData, isLoading: feeLoading, error: feeError } = useSendFee(
    networkSpecificSymbol || '',
    cryptoAmountForFee,
    false
  );

  const networkFee = feeData?.networkFee || 0;
  const total = (cryptoAmountForFee || 0) + (networkFee || 0);

  const handleSelectCrypto = (symbol: string) => {
    setSelectedCrypto(symbol);
    const networks = networkMap[symbol] || [];
    setSelectedNetwork(networks[0] || "");
    setStep("details");
  };

  const validateSendForm = (): string | null => {
    if (!selectedCrypto || !toAddress || !amount) return "Please fill in all required fields";
    const cryptoAmountNum = amountInputMode === "crypto" ? parseFloat(amount) : parseFloat(cryptoAmount);
    if (isNaN(cryptoAmountNum) || cryptoAmountNum <= 0) return "Please enter a valid amount";
    if (selectedWallet && total > selectedWallet.balance) return "Insufficient balance";
    if (!securityCheck.safe) return "Security check failed. This address may be malicious.";
    return null;
  };

  const executeSend = async (mnemonic: string) => {
    if (!user) return;
    const cryptoAmountNum = amountInputMode === "crypto" ? parseFloat(amount) : parseFloat(cryptoAmount);
    const symbolToUse = getNetworkSpecificSymbol(selectedCrypto, selectedNetwork);
    const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
    const userWallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
    const symbolMap: Record<string, string> = {
      'BTC': 'Bitcoin (SegWit)', 'ETH': 'Ethereum', 'SOL': 'Solana',
      'BNB': 'Binance Smart Chain (BEP-20)', 'TRX': 'Tron (TRC-20)',
      'USDT': 'USDT', 'USDC': 'USDC',
    };
    const chainIdToFind = symbolMap[selectedCrypto] || selectedCrypto;
    const targetWallet = userWallets.find(w =>
      w.chainId === chainIdToFind || w.chainId === selectedNetwork || w.assetType === selectedCrypto
    );
    if (!targetWallet) throw new Error("Local wallet not found for the selected asset");
    if (!mnemonic) throw new Error("Mnemonic phrase not found for signing");

    const txData = { to: toAddress, amount: cryptoAmountNum.toString(), currency: symbolToUse as any };

    if (selectedNetwork.includes("Bitcoin")) {
      const feeResponse = await fetch('https://blockstream.info/api/fee-estimates');
      const fees = await feeResponse.json();
      const fastFee = fees['1'] || 10;
      const btcTxData = {
        to: toAddress,
        amount: Math.floor(cryptoAmountNum * 1e8),
        utxos: await (await fetch(`https://blockstream.info/api/address/${targetWallet.address}/utxo`)).json(),
        feeRate: fastFee,
        fromAddress: targetWallet.address,
      };
      await signBitcoinTransaction(mnemonic, btcTxData as any);
    } else if (selectedNetwork.includes("Ethereum") || selectedNetwork.includes("Binance")) {
      await signEVMTransaction(mnemonic, txData as any);
    } else if (selectedNetwork.includes("Solana")) {
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getLatestBlockhash' }),
      });
      const { result } = await response.json();
      if (!result?.value?.blockhash) throw new Error("Failed to fetch recent blockhash for Solana");
      await signSolanaTransaction(mnemonic, { to: toAddress, amount: cryptoAmountNum.toString(), currency: "SOL", recentBlockhash: result.value.blockhash });
    } else if (selectedNetwork.includes("Tron")) {
      await signTronTransaction(mnemonic, { to: toAddress, amount: cryptoAmountNum.toString(), currency: symbolToUse as any });
    } else {
      throw new Error(`Signing not supported for ${selectedNetwork}`);
    }

    toast({ title: "Transaction Signed!", description: "Your transaction has been signed locally. In this demo, it is logged to the console." });
    setSuccess(true);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => { setSuccess(false); onOpenChange(false); resetForm(); onSuccess?.(); }, 2000);
  };

  const handleSend = async () => {
    if (!user) return;
    const validationError = validateSendForm();
    if (validationError) { setError(validationError); return; }
    if (!getSessionPassword() && !userPassword) { setError("Please enter your wallet password"); return; }

    setError("");
    setLoading(true);
    try {
      const passwordToUse = getSessionPassword() || userPassword;
      const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
      const userWallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
      const symbolMap: Record<string, string> = {
        'BTC': 'Bitcoin (SegWit)', 'ETH': 'Ethereum', 'SOL': 'Solana',
        'BNB': 'Binance Smart Chain (BEP-20)', 'TRX': 'Tron (TRC-20)',
        'USDT': 'USDT', 'USDC': 'USDC',
      };
      const chainIdToFind = symbolMap[selectedCrypto] || selectedCrypto;
      const targetWallet = userWallets.find(w =>
        w.chainId === chainIdToFind || w.chainId === selectedNetwork || w.assetType === selectedCrypto
      );
      if (!targetWallet) throw new Error("Local wallet not found for the selected asset");
      const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(targetWallet.id, passwordToUse, user.id);
      if (!mnemonic) throw new Error("Mnemonic phrase not found for signing");
      if (!getSessionPassword() && userPassword) setSessionPassword(userPassword);
      await executeSend(mnemonic);
    } catch (err: any) {
      setError(err.message || "Failed to send crypto");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToAddress(text);
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  const resetForm = () => {
    setStep("select");
    setSelectedCrypto("");
    setToAddress("");
    setAmount("");
    setCryptoAmount("");
    setFiatAmount("");
    setNotes("");
    setSelectedNetwork("");
    setSelectedCurrency("USD");
    setAmountInputMode("fiat");
    setCryptoPrice(0);
    setError("");
    setSuccess(false);
    setUseNonCustodial(false);
    setUserPassword("");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const title = step === "select" ? "Select an asset" : `Send ${selectedCrypto}`;

  const content = (
    <>
      {success ? (
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Transaction Initiated!</h3>
          <p className="text-sm text-muted-foreground text-center">
            Your crypto is being sent. Check your transactions for status.
          </p>
        </div>
      ) : step === "select" ? (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {wallets
              .filter(wallet => wallet.symbol && !["success", "message", "timestamp", "status"].includes(wallet.symbol.toLowerCase()))
              .map((wallet) => (
              <Button
                key={wallet.symbol}
                variant="ghost"
                className="w-full h-auto py-4 px-4 justify-start hover:bg-primary/10"
                onClick={() => handleSelectCrypto(wallet.symbol)}
              >
                <div className="flex items-center gap-3 w-full">
                  <img
                    src={cryptoIconUrls[wallet.symbol]}
                    alt={wallet.symbol}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`;
                    }}
                  />
                  <div className="text-left flex-1">
                    <div className="font-semibold">{wallet.symbol}</div>
                    <div className="text-xs text-muted-foreground">{wallet.name}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-4">
            {isWalletUnlocked ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-800 dark:text-green-200">
                  ✓ Password cached for session. Transaction will sign automatically.
                </p>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Enter your password once - it will be cached for this session.
                </p>
                <Input
                  type="password"
                  placeholder="Wallet password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="h-10 mt-2 bg-muted"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-2 block">Asset</Label>
              <Select value={selectedCrypto} onValueChange={(value) => {
                setSelectedCrypto(value);
                const networks = networkMap[value] || [];
                setSelectedNetwork(networks[0] || "");
              }}>
                <SelectTrigger className="h-12 bg-muted">
                  <div className="flex items-center gap-2">
                    <img
                      src={cryptoIconUrls[selectedCrypto] || `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${selectedCrypto?.toLowerCase() || ''}.png`}
                      alt={selectedCrypto}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedCrypto || 'Asset'}&background=random`;
                      }}
                    />
                    <span>{selectedCrypto}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.symbol} value={wallet.symbol}>
                      <div className="flex items-center gap-2">
                        <img
                          src={cryptoIconUrls[wallet.symbol] || `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${wallet.symbol.toLowerCase()}.png`}
                          alt={wallet.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`;
                          }}
                        />
                        <span>{wallet.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Receiver address or Pexly username
              </Label>
              <div className="relative">
                <Input
                  placeholder="Enter address or username"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className={`h-12 pr-20 bg-muted ${
                    !securityCheck.safe ? "border-red-500" :
                    securityCheck.warnings.length > 0 ? "border-yellow-500" : ""
                  }`}
                />
                <div className="absolute right-12 top-2 h-8 flex items-center pr-2">
                  {securityCheck.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : toAddress.length > 30 ? (
                    securityCheck.safe ? (
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                    )
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePaste}
                  className="absolute right-2 top-2 h-8"
                >
                  Paste
                </Button>
              </div>
              {securityCheck.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {securityCheck.warnings.map((warning, i) => (
                    <p key={i} className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="h-12 bg-muted">
                  <SelectValue placeholder="Select a network" />
                </SelectTrigger>
                <SelectContent>
                  {(networkMap[selectedCrypto] || []).map((network) => (
                    <SelectItem key={network} value={network}>
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Enter amount in</Label>
                <div className="flex gap-2">
                  {amountInputMode === "fiat" ? (
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-24 h-8 flex items-center justify-center text-xs font-medium border rounded-md px-3">
                      {selectedCrypto}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAmountInputMode(amountInputMode === "fiat" ? "crypto" : "fiat");
                      setAmount("");
                    }}
                    className="h-8 text-xs"
                  >
                    Switch
                  </Button>
                </div>
              </div>
              <div className="text-center py-4">
                <Input
                  type="number"
                  step={amountInputMode === "crypto" ? "0.00000001" : "0.01"}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-4xl font-bold text-center border-0 bg-transparent h-auto p-0"
                />
                {amountInputMode === "fiat" && cryptoAmount && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ≈ {cryptoAmount} {selectedCrypto}
                  </p>
                )}
                {amountInputMode === "crypto" && fiatAmount && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ≈ {selectedCurrency} {fiatAmount}
                  </p>
                )}
                {selectedWallet && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: {selectedWallet.balance.toFixed(8)} {selectedCrypto}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedWallet) {
                      if (amountInputMode === "fiat" && cryptoPrice) {
                        setAmount((selectedWallet.balance * cryptoPrice).toFixed(2));
                      } else {
                        setAmount(selectedWallet.balance.toFixed(8));
                      }
                    }
                  }}
                  className="mt-2"
                  disabled={amountInputMode === "fiat" && !cryptoPrice}
                >
                  Max
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Remarks (optional)</Label>
              <Input
                placeholder="Add a note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-12 bg-muted"
              />
            </div>

            {cryptoAmountForFee > 0 && selectedCrypto && selectedNetwork && (() => {
              const fiatSymbol = selectedCurrency === "NGN" ? "₦" : "$";
              const fmt = (n: number) =>
                fiatSymbol + new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(n);
              const fmtCrypto = (n: number) => {
                const sym = selectedCrypto;
                const dp =
                  sym === "BTC" ? 8 :
                  sym === "ETH" ? 6 :
                  sym === "SOL" ? 5 :
                  sym === "TRX" || sym === "BNB" ? 4 :
                  sym === "USDT" || sym === "USDC" ? 2 : 6;
                return n.toLocaleString("en-US", {
                  minimumFractionDigits: dp,
                  maximumFractionDigits: dp,
                });
              };
              const hasFiat = cryptoPrice > 0;
              return (
                <div className="rounded-xl border border-border bg-card overflow-hidden text-sm">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Transaction Summary
                    </span>
                    {!feeLoading && feeData && (
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Live fees
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-border">
                    {/* You send */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-muted-foreground">You send</span>
                      <div className="text-right">
                        <div className="font-semibold tabular-nums">
                          {fmtCrypto(cryptoAmountForFee)} {selectedCrypto}
                        </div>
                        {hasFiat && (
                          <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                            {fmt(cryptoAmountForFee * cryptoPrice)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Network fee */}
                    {feeLoading ? (
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-muted-foreground">Network fee</span>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Fetching live fee…
                        </div>
                      </div>
                    ) : feeData ? (
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-muted-foreground">Network fee</span>
                        <div className="text-right">
                          <div className="tabular-nums">
                            {fmtCrypto(feeData.networkFee)} {selectedCrypto}
                          </div>
                          {hasFiat && (
                            <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                              {fmt(feeData.networkFee * cryptoPrice)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : feeError ? (
                      <div className="flex items-center gap-1.5 px-4 py-3 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        Could not fetch live fee — check your connection
                      </div>
                    ) : null}

                    {/* Total */}
                    {feeData && (
                      <div className="flex items-center justify-between px-4 py-3.5 bg-muted/30">
                        <span className="font-semibold">Total deducted</span>
                        <div className="text-right">
                          <div className="font-bold tabular-nums">
                            {fmtCrypto(total)} {selectedCrypto}
                          </div>
                          {hasFiat && (
                            <div className="text-xs text-muted-foreground font-medium tabular-nums mt-0.5">
                              {fmt(total * cryptoPrice)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-4 pb-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                className="flex-1 h-12"
                disabled={loading || !selectedCrypto || !toAddress || !amount}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pt-2 pb-6 max-h-[92dvh] overflow-hidden flex flex-col"
        >
          {/* Drag handle */}
          <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-3 flex-shrink-0" />
          <SheetHeader className="flex flex-row items-center justify-between mb-4 flex-shrink-0">
            <SheetTitle>{title}</SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
