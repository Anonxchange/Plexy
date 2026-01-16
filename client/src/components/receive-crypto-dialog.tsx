import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, CheckCircle2, Loader2, ArrowLeft, X, Lock } from "lucide-react";
import { getDepositAddress } from "@/lib/wallet-api";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import { getBitcoinAddress } from "@/lib/bitcoinSigner";
import { getEVMAddress } from "@/lib/evmSigner";
import { getSolanaAddress } from "@/lib/solanaSigner";
import { getTronAddress } from "@/lib/tronSigner";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";


interface ReceiveCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Array<{ symbol: string; name: string; icon: string }>;
  initialSymbol?: string;
}

type Step = "method" | "asset" | "details";

const networkMap: Record<string, string[]> = {
  BTC: ["Bitcoin (SegWit)"],
  ETH: ["Ethereum (ERC-20)"],
  SOL: ["Solana"],
  BNB: ["Binance Smart Chain (BEP-20)"],
  TRX: ["Tron (TRC-20)"],
  USDC: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)"],
  USDT: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)"],
};

export function ReceiveCryptoDialog({ open, onOpenChange, wallets, initialSymbol }: ReceiveCryptoDialogProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("method");

  useEffect(() => {
    if (open) {
      if (initialSymbol) {
        setSelectedCrypto(initialSymbol);
        setStep("details");
      } else {
        setStep("method");
        setSelectedCrypto("");
      }
    }
  }, [open, initialSymbol]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useNonCustodial, setUseNonCustodial] = useState(false);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [confirmWalletPassword, setConfirmWalletPassword] = useState("");
  const [walletSetupLoading, setWalletSetupLoading] = useState(false);
  const { toast } = useToast();

  // Check for existing non-custodial wallets on dialog open
  useEffect(() => {
    if (open && user) {
      const existingWallets = nonCustodialWalletManager.getNonCustodialWallets(user.id);
      if (existingWallets.length === 0) {
        // No wallets yet - show setup dialog automatically
        setShowWalletSetup(true);
        setUseNonCustodial(false);
      } else {
        // Wallets exist - default to non-custodial
        setUseNonCustodial(true);
        setShowWalletSetup(false);
      }
    }
  }, [open, user]);

  // Auto-load or generate address when step changes to details
  useEffect(() => {
    if (selectedCrypto && selectedNetwork && user && step === "details") {
      loadDepositAddress();
    }
  }, [selectedCrypto, selectedNetwork, user, step]);

  // Clear address when network changes to trigger regeneration
  useEffect(() => {
    if (selectedNetwork && depositAddress) {
      setDepositAddress("");
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (selectedCrypto) {
      const networks = networkMap[selectedCrypto] || [];
      // Set default network if available, otherwise use the first one
      if (selectedCrypto === 'USDT' || selectedCrypto === 'USDC') {
        if (networks.includes("Ethereum (ERC-20)")) setSelectedNetwork("Ethereum (ERC-20)");
        else if (networks.includes("Binance Smart Chain (BEP-20)")) setSelectedNetwork("Binance Smart Chain (BEP-20)");
        else if (networks.includes("Tron (TRC-20)")) setSelectedNetwork("Tron (TRC-20)");
        else if (networks.includes("Solana (SPL)")) setSelectedNetwork("Solana (SPL)");
      } else {
        setSelectedNetwork(networks[0] || "");
      }
    }
  }, [selectedCrypto]);

  const getNetworkSpecificSymbol = (crypto: string, network: string): string => {
    // For USDT and USDC, append full network name (matching wallet-api.ts format)
    if (crypto === 'USDT' || crypto === 'USDC') {
      if (network === 'Ethereum (ERC-20)') return `${crypto}-Ethereum (ERC-20)`;
      if (network === 'Binance Smart Chain (BEP-20)') return `${crypto}-Binance Smart Chain (BEP-20)`;
      if (network === 'Tron (TRC-20)') return `${crypto}-Tron (TRC-20)`;
      if (network === 'Solana (SPL)') return `${crypto}-Solana`;
    }
    // For native coins, return as-is
    return crypto;
  };

  const loadDepositAddress = async () => {
    if (!user) return;
    setLoading(true);
    setIsGenerating(true);
    try {
      // Always prioritize non-custodial if wallets exist
      const wallets = nonCustodialWalletManager.getNonCustodialWallets(user.id);
      if (wallets.length > 0) {
        const symbolToUse = getNetworkSpecificSymbol(selectedCrypto, selectedNetwork);
        const address = await getDepositAddress(user.id, symbolToUse);
        setDepositAddress(address);
        setUseNonCustodial(true);
      } else {
        const symbolToUse = getNetworkSpecificSymbol(selectedCrypto, selectedNetwork);
        const address = await getDepositAddress(user.id, symbolToUse);
        setDepositAddress(address);
        setUseNonCustodial(false);
      }
    } catch (error) {
      console.error("Error loading deposit address:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load deposit address. Please try again.",
      });
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("method");
      setSelectedMethod("");
      setSelectedCrypto("");
      setSelectedNetwork("");
      setDepositAddress("");
      setCopied(false);
      setLoading(false);
      setIsGenerating(false);
      setUseNonCustodial(false);
      setShowWalletSetup(false);
      setWalletPassword("");
      setConfirmWalletPassword("");
    }, 200);
  };


  const handleGenerateWallet = async () => {
    if (!walletPassword || !confirmWalletPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter password",
      });
      return;
    }

    if (walletPassword !== confirmWalletPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords don't match",
      });
      return;
    }

    setWalletSetupLoading(true);
    try {
      // Generate wallet for Ethereum (primary network)
      const result = await nonCustodialWalletManager.generateNonCustodialWallet(
        "Ethereum (ERC-20)",
        walletPassword,
        supabase,
        user?.id
      );

      // Generate all other supported network wallets using the SAME mnemonic phrase
      const networks = ["Bitcoin (SegWit)", "Solana", "Tron (TRC-20)", "Binance Smart Chain (BEP-20)"];
      
      for (const network of networks) {
        await nonCustodialWalletManager.generateNonCustodialWallet(
          network,
          walletPassword,
          supabase,
          user?.id,
          result.mnemonicPhrase
        );
      }
      
      toast({
        title: "Success",
        description: "Non-custodial wallets created! All networks are secured by your recovery phrase.",
      });

      // Reset and close setup dialog
      setShowWalletSetup(false);
      setWalletPassword("");
      setConfirmWalletPassword("");
      
      // Show the mnemonic
      alert(`Your Recovery Phrase (SAVE THIS SAFELY):\n\n${result.mnemonicPhrase}\n\nYou'll need this to recover your wallet if you lose your device.`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create wallet",
      });
    } finally {
      setWalletSetupLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("asset");
    } else if (step === "asset") {
      setStep("method");
    }
  };

  // Handler for crypto selection change
  const handleCryptoChange = (value: string) => {
    setSelectedCrypto(value);
    // Auto-select appropriate network based on crypto
    if (value === 'BTC') {
      setSelectedNetwork('Bitcoin (SegWit)');
    } else if (value === 'ETH') {
      setSelectedNetwork('Ethereum (ERC-20)');
    } else if (value === 'BNB') {
      setSelectedNetwork('Binance Smart Chain (BEP-20)');
    } else if (value === 'SOL') {
      setSelectedNetwork('Solana');
    } else if (value === 'TRX') {
      setSelectedNetwork('Tron (TRC-20)');
    } else if (value === 'USDT' || value === 'USDC') {
      setSelectedNetwork('Ethereum (ERC-20)'); // Default to ERC20
    }
    setDepositAddress(""); // Clear previous address
  };

  // Helper function to get the correct crypto symbol with network suffix
  const getCryptoSymbolWithNetwork = () => {
    if (selectedCrypto === 'BTC') return 'BTC';
    if (selectedCrypto === 'ETH') return 'ETH';
    if (selectedCrypto === 'BNB') return 'BNB';
    if (selectedCrypto === 'SOL') return 'SOL';
    if (selectedCrypto === 'TRX') return 'TRX';

    // For USDT/USDC, append network suffix
    if (selectedCrypto === 'USDT' || selectedCrypto === 'USDC') {
      if (selectedNetwork === 'Ethereum (ERC-20)') return `${selectedCrypto}-ERC20`;
      if (selectedNetwork === 'Binance Smart Chain (BEP-20)') return `${selectedCrypto}-BEP20`;
      if (selectedNetwork === 'Tron (TRC-20)') return `${selectedCrypto}-TRC20`;
      if (selectedNetwork === 'Solana (SPL)') return `${selectedCrypto}-SOL`;
      if (selectedNetwork === 'Solana') return `${selectedCrypto}-SOL`;
    }

    return selectedCrypto;
  };

  // Handler to generate the deposit address
  const handleGenerateAddress = async () => {
    if (!selectedCrypto || !selectedNetwork) return;

    setIsGenerating(true);
    try {
      const wallets = nonCustodialWalletManager.getNonCustodialWallets(user?.id || '');
      const wallet = wallets[0]; // Get any wallet to retrieve mnemonic

      if (wallet && user) {
        // For non-custodial, we can derive the address locally
        // We'll need the password to decrypt the mnemonic if we wanted to derive live,
        // but the addresses are already stored in the wallet objects during generation.
        // However, if we want to ensure we're showing the correct derived address from the mnemonic:
        
        // Find the wallet matching this network
        const specificWallet = wallets.find(w => w.chainId === selectedNetwork || w.chainId.includes(selectedCrypto));
        if (specificWallet) {
          setDepositAddress(specificWallet.address);
          setIsGenerating(false);
          return;
        }
      }

      // Fallback to API/stored addresses
      const cryptoSymbol = getCryptoSymbolWithNetwork();
      const address = await getDepositAddress(user?.id || '', cryptoSymbol);
      setDepositAddress(address);
    } catch (error: any) {
      console.error('Error generating address:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate deposit address"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedWallet = wallets.find(w => w.symbol === selectedCrypto);
  const networks = selectedCrypto ? (networkMap[selectedCrypto] || []) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {step !== "method" && !showWalletSetup && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="flex-1 text-center">
              {showWalletSetup && "Create Non-Custodial Wallet"}
              {!showWalletSetup && step === "method" && "Select a receive method"}
              {!showWalletSetup && step === "asset" && "Select an asset"}
              {!showWalletSetup && step === "details" && `Receive ${selectedCrypto}`}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
        
        {/* Wallet Setup Dialog */}
        {showWalletSetup && (
          <div className="space-y-4 px-4 py-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center">Secure Your Wallet</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Create a strong password to encrypt your wallet. You'll use this to sign transactions.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Password</Label>
                <Input
                  type="password"
                  placeholder="Enter a strong password"
                  value={walletPassword}
                  onChange={(e) => setWalletPassword(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmWalletPassword}
                  onChange={(e) => setConfirmWalletPassword(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateWallet}
              disabled={walletSetupLoading || !walletPassword || !confirmWalletPassword}
              className="w-full h-10"
            >
              {walletSetupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Wallet...
                </>
              ) : (
                "Create Wallet"
              )}
            </Button>
          </div>
        )}
        

        {/* Method Selection Step */}
          {step === "method" && !showWalletSetup && (
            <div className="space-y-4 px-1">
            <div>
              <h3 className="text-sm font-medium mb-3">Deposit using crypto</h3>
              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
                onClick={() => {
                  setSelectedMethod("crypto");
                  setStep("asset");
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Receive crypto</div>
                    <div className="text-xs text-muted-foreground">From another crypto wallet</div>
                  </div>
                </div>
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Deposit crypto using fiat</h3>
              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start mb-2"
                onClick={() => {
                  setSelectedMethod("buy");
                  handleClose();
                  window.location.href = "/wallet/buy-crypto";
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Buy crypto</div>
                    <div className="text-xs text-muted-foreground">Buy crypto with Bank or Online wallet</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start"
                onClick={() => {
                  setSelectedMethod("p2p");
                  handleClose();
                  window.location.href = "/p2p";
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">P2P Trading</div>
                    <div className="text-xs text-muted-foreground">Buy crypto with Bank or Online wallet</div>
                  </div>
                </div>
              </Button>
            </div>
            </div>
          )}

          {/* Asset Selection Step */}
          {step === "asset" && !showWalletSetup && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 px-1 pr-4">
                {wallets.map((wallet) => (
                  <Button
                    key={wallet.symbol}
                    variant="outline"
                    className={`w-full h-auto py-4 px-4 justify-start ${
                      selectedCrypto === wallet.symbol ? "bg-green-500/10 border-green-500/50" : ""
                    }`}
                    onClick={() => {
                      handleCryptoChange(wallet.symbol); // Use handler to set crypto and network
                      setStep("details");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={cryptoIconUrls[wallet.symbol]}
                        alt={wallet.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`;
                        }}
                      />
                      <div className="text-left">
                        <div className="font-semibold">{wallet.symbol}</div>
                        <div className="text-xs text-muted-foreground">{wallet.name}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Details Step */}
          {step === "details" && !showWalletSetup && (
            <>
              {isGenerating ? ( // Use isGenerating state for loading indicator
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                    <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 px-1 pr-4">
                {useNonCustodial && (
                  <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                      ✓ Using non-custodial wallet (you control your keys)
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Asset</Label>
                  <Select value={selectedCrypto} onValueChange={handleCryptoChange}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.symbol} value={wallet.symbol}>
                          <span className="flex items-center gap-2">
                            <img
                              src={cryptoIconUrls[wallet.symbol]}
                              alt={wallet.symbol}
                              className="w-5 h-5 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`;
                              }}
                            />
                            <span>{wallet.symbol}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Network</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((network) => (
                        <SelectItem key={network} value={network}>
                          {network}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {depositAddress ? ( // Only show address details if an address exists
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Deposit address</Label>

                    {/* QR Code */}
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-white rounded-lg relative">
                        <QRCodeSVG value={depositAddress} size={200} />
                        {/* Logo Overlay */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Display */}
                    <div className="p-3 bg-muted rounded-lg mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">
                            {selectedCrypto} #{selectedNetwork.includes("SegWit") ? "1" : "1"} ({selectedNetwork.split(" ")[0]})
                          </div>
                          <code className="text-sm font-mono break-all">{depositAddress}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopy}
                          className="ml-2"
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Create New Address Button */}
                    <Button variant="outline" className="w-full mb-2" onClick={handleGenerateAddress} disabled={isGenerating}>
                      {isGenerating ? 'Generating...' : 'Create a new address'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      You can generate a new address once the current one receives a blockchain transaction
                    </p>
                  </div>
                ) : (
                  // Button to generate address if none exists yet
                  <Button variant="default" className="w-full py-3" onClick={handleGenerateAddress} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Deposit Address'}
                  </Button>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    <strong>Important:</strong> Only send {selectedCrypto} to this address on the {selectedNetwork} network.
                    Sending other cryptocurrencies or using wrong network may result in permanent loss.
                  </p>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground mt-2">
                  <p><strong>Minimum deposit:</strong> {selectedCrypto === 'BTC' ? '0.00001 BTC' : selectedCrypto === 'ETH' ? '0.001 ETH' : '1 ' + selectedCrypto}</p>
                  <p><strong>Confirmations required:</strong> {selectedCrypto === 'BTC' ? '2' : selectedCrypto === 'ETH' ? '64' : '12'} network confirmations</p>
                </div>
                  </div>
                </ScrollArea>
            )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
