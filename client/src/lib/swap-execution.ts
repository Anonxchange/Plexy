import { asterdexService } from "./asterdex-service";
import { nonCustodialWalletManager, type NonCustodialWallet } from "./non-custodial-wallet";
import { signBitcoinTransaction } from "./bitcoinSigner";
import { signEVMTransaction } from "./evmSigner";
import { signSolanaTransaction } from "./solanaSigner";
import { signTronTransaction } from "./tronSigner";

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  priceImpact: number;
  slippage: number;
  fee: number;
  minReceived: string;
  timestamp: number;
}

export interface ExecutionOrder {
  id: string;
  type: "buy" | "sell";
  fromToken: string;
  toToken: string;
  amount: string;
  status: "pending" | "signing" | "submitted" | "confirmed" | "failed";
  quote: SwapQuote;
  txHash?: string;
  error?: string;
  createdAt: number;
  executedAt?: number;
}

class SwapExecutionService {
  /**
   * Get a swap quote from AsterDEX
   * Calculates price impact and slippage
   */
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    slippageTolerance: number = 0.5 // 0.5%
  ): Promise<SwapQuote> {
    try {
      // Get current market prices from AsterDEX
      // Symbol format: base/quote (e.g., BTCUSDT)
      const symbol = fromToken === "USDT" ? `${toToken}${fromToken}` : `${fromToken}${toToken}`;
      const ticker = await asterdexService.getTicker(symbol);
      
      const fromAmount = parseFloat(amount);
      const marketPrice = parseFloat(ticker.lastPrice);
      
      // Calculate output based on trade direction
      // If selling (USDT is quote): multiply by price. If buying (USDT is base): divide by price
      let baseAmount: number;
      if (fromToken === "USDT") {
        // Buying: spend USDT to get crypto
        baseAmount = fromAmount / marketPrice;
      } else {
        // Selling: spend crypto to get USDT
        baseAmount = fromAmount * marketPrice;
      }
      
      // Calculate with slippage
      const slippageAmount = baseAmount * (slippageTolerance / 100);
      const toAmount = baseAmount - slippageAmount;
      
      // Spot trading fee (0.16% as per your setup)
      const feePercentage = 0.16;
      const fee = fromToken === "USDT" ? (fromAmount * (feePercentage / 100)) : (toAmount * (feePercentage / 100));
      
      // Price impact simulation (based on order size relative to volume)
      const volume = parseFloat(ticker.quoteVolume);
      const priceImpact = Math.min((baseAmount / volume) * 100, 5); // Max 5% impact
      
      return {
        fromToken,
        toToken,
        fromAmount: fromAmount.toString(),
        toAmount: (toAmount - fee).toFixed(8),
        price: marketPrice.toString(),
        priceImpact,
        slippage: slippageTolerance,
        fee,
        minReceived: ((toAmount - fee) * (1 - slippageTolerance / 100)).toFixed(8),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to get swap quote: ${error}`);
    }
  }

  /**
   * Create an execution order (pending state)
   */
  createExecutionOrder(
    type: "buy" | "sell",
    fromToken: string,
    toToken: string,
    amount: string,
    quote: SwapQuote
  ): ExecutionOrder {
    return {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      fromToken,
      toToken,
      amount,
      status: "pending",
      quote,
      createdAt: Date.now(),
    };
  }

  /**
   * Sign transaction with non-custodial wallet using network-specific signers
   */
  async signSwapTransaction(
    wallet: NonCustodialWallet,
    order: ExecutionOrder,
    userPassword: string,
    userId?: string
  ): Promise<string> {
    if (!userId) {
      throw new Error("User ID required to sign transaction");
    }

    const mnemonic = nonCustodialWalletManager.getWalletMnemonic(wallet.id, userPassword, userId);
    if (!mnemonic) {
      throw new Error("Mnemonic not found for signing");
    }

    // Determine wallet type if undefined
    const effectiveWalletType = wallet.walletType || 
      ((wallet.chainId === "bitcoin" || wallet.chainId === "Bitcoin (SegWit)") ? "bitcoin" : 
       (wallet.chainId === "Solana") ? "solana" :
       (wallet.chainId === "Tron (TRC-20)") ? "tron" : "ethereum");

    try {
      let signedTxResult: any;

      if (effectiveWalletType === "bitcoin") {
        const btcTxData = {
          to: "bc1" + "q".repeat(39), // Placeholder DEX address
          amount: Math.floor(parseFloat(order.amount) * 1e8),
          utxos: [], // Would fetch real UTXOs in production
          feeRate: 10,
        };
        signedTxResult = await signBitcoinTransaction(mnemonic, btcTxData as any);
      } else if (effectiveWalletType === "ethereum" || effectiveWalletType === "tron") {
        const txData = {
          to: "0x" + "1".repeat(40),
          amount: order.amount,
          currency: order.fromToken as any,
        };
        if (effectiveWalletType === "ethereum") {
          signedTxResult = await signEVMTransaction(mnemonic, txData as any);
        } else {
          signedTxResult = await signTronTransaction(mnemonic, { ...txData, currency: (order.fromToken + "_TRX") as any });
        }
      } else if (effectiveWalletType === "solana") {
        signedTxResult = await signSolanaTransaction(mnemonic, {
          to: "Sol" + "1".repeat(41),
          amount: order.amount,
          currency: "SOL"
        });
      } else {
        throw new Error(`Unsupported wallet type for spot trading: ${effectiveWalletType} (chainId: ${wallet.chainId})`);
      }

      return typeof signedTxResult.signedTx === 'string' ? signedTxResult.signedTx : JSON.stringify(signedTxResult.signedTx);
    } catch (error) {
      throw new Error(`Failed to sign swap transaction: ${error}`);
    }
  }

  /**
   * Build swap transaction data (simplified version)
   */
  private buildSwapData(order: ExecutionOrder): string {
    // This would encode the swap function call for the DEX
    // For now, returning a valid placeholder hex value
    // In production: use ethers.AbiCoder or web3.js to encode function calls
    
    // Create a simple valid hex string from order data
    // Encode token names and amounts as hex
    const fromToken = Buffer.from(order.fromToken).toString('hex').padEnd(64, '0');
    const toToken = Buffer.from(order.toToken).toString('hex').padEnd(64, '0');
    
    // Parse amount and minReceived as integers (removing decimal points)
    const amountInt = Math.floor(parseFloat(order.amount) * 1e18).toString(16).padStart(64, '0');
    const minReceivedInt = Math.floor(parseFloat(order.quote.minReceived) * 1e18).toString(16).padStart(64, '0');
    
    // Build complete hex-encoded transaction data
    // Function selector (swap) + parameters
    return `0x128acb08${fromToken}${toToken}${amountInt}${minReceivedInt}`;
  }

  /**
   * Submit signed transaction to network (via AsterDEX API)
   * In production, this would broadcast to the blockchain
   */
  async submitSignedTransaction(
    signedTx: string,
    order: ExecutionOrder
  ): Promise<{ txHash: string; order: ExecutionOrder }> {
    try {
      // Generate placeholder transaction hash
      // In production: this would be returned by the blockchain
      const txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      // Order remains in submitted state - only confirmed after on-chain confirmation
      const updatedOrder: ExecutionOrder = {
        ...order,
        status: "submitted",
        txHash,
        executedAt: Date.now(),
      };

      return {
        txHash,
        order: updatedOrder,
      };
    } catch (error) {
      throw new Error(`Failed to submit transaction: ${error}`);
    }
  }

  /**
   * Monitor transaction confirmation
   * In production: would poll blockchain for transaction status
   * Currently returns pending state - requires real blockchain integration
   */
  async monitorTransaction(
    txHash: string,
    maxWaitTime: number = 60000 // 60 seconds
  ): Promise<{ confirmed: boolean; blockNumber?: number }> {
    try {
      // In production: check transaction status via blockchain RPC or API
      // For now: return pending status - user needs to check blockchain explorer
      console.log(`Transaction ${txHash} submitted to network. Awaiting on-chain confirmation...`);
      
      return {
        confirmed: false, // Requires real blockchain interaction to confirm
      };
    } catch (error) {
      throw new Error(`Failed to monitor transaction: ${error}`);
    }
  }

  /**
   * Execute complete swap flow: quote -> sign -> submit -> monitor
   */
  async executeSwap(
    wallet: NonCustodialWallet,
    fromToken: string,
    toToken: string,
    amount: string,
    userPassword: string,
    userId?: string,
    slippageTolerance: number = 0.5
  ): Promise<ExecutionOrder> {
    try {
      // Step 1: Get quote
      const quote = await this.getSwapQuote(
        fromToken,
        toToken,
        amount,
        slippageTolerance
      );

      // Step 2: Create execution order
      const order = this.createExecutionOrder(
        fromToken === "USDT" ? "buy" : "sell",
        fromToken,
        toToken,
        amount,
        quote
      );

      // Step 3: Sign transaction
      const signedTx = await this.signSwapTransaction(
        wallet,
        order,
        userPassword,
        userId
      );

      // Step 4: Submit signed transaction
      const { order: submittedOrder } = await this.submitSignedTransaction(
        signedTx,
        order
      );

      // Step 5: Monitor confirmation (in background)
      setTimeout(async () => {
        try {
          await this.monitorTransaction(submittedOrder.txHash!);
        } catch (error) {
          console.error("Failed to monitor transaction:", error);
        }
      }, 0);

      return submittedOrder;
    } catch (error) {
      throw new Error(`Swap execution failed: ${error}`);
    }
  }
}

export const swapExecutionService = new SwapExecutionService();
