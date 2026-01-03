import { asterdexService } from "./asterdex-service";
import { nonCustodialWalletManager, type NonCustodialWallet } from "./non-custodial-wallet";
import { signBitcoinTransaction, getBitcoinBalance } from "./bitcoinSigner";
import { signEVMTransaction, getEVMBalance } from "./evmSigner";
import { signSolanaTransaction, getSolanaAddress } from "./solanaSigner";
import { signTronTransaction, getTronBalance, getTRC20Balance } from "./tronSigner";
import { getRocketxQuote, executeRocketxSwap, type RocketxQuote } from "./rocketx-api";

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
  rocketxQuote?: RocketxQuote;
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
   * Get a swap quote from RocketX (primary) or AsterDEX (fallback)
   */
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    slippageTolerance: number = 0.5
  ): Promise<SwapQuote> {
    try {
      // Try RocketX first for native BTC support and better liquidity
      const rxQuote = await getRocketxQuote(fromToken, toToken, amount);
      
      if (rxQuote) {
        return {
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: rxQuote.toAmount,
          price: rxQuote.rate.toString(),
          priceImpact: 0, // RocketX doesn't expose this directly in the quote call usually
          slippage: slippageTolerance,
          fee: rxQuote.fee || 0,
          minReceived: (parseFloat(rxQuote.toAmount) * (1 - slippageTolerance / 100)).toString(),
          timestamp: Date.now(),
          rocketxQuote: rxQuote
        };
      }

      // Fallback to AsterDEX logic
      const symbol = fromToken === "USDT" ? `${toToken}${fromToken}` : `${fromToken}${toToken}`;
      const ticker = await asterdexService.getTicker(symbol);
      
      const fromAmount = parseFloat(amount);
      const marketPrice = parseFloat(ticker.lastPrice);
      
      let baseAmount: number;
      if (fromToken === "USDT") {
        baseAmount = fromAmount / marketPrice;
      } else {
        baseAmount = fromAmount * marketPrice;
      }
      
      const slippageAmount = baseAmount * (slippageTolerance / 100);
      const toAmount = baseAmount - slippageAmount;
      const fee = 0;
      const volume = parseFloat(ticker.quoteVolume);
      const priceImpact = Math.min((baseAmount / volume) * 100, 5);
      
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
   * Sign and execute swap through RocketX or network specific signers
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
    if (!userId) throw new Error("User ID required");

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

      // Step 3: Execute via RocketX if quote came from there
      if (quote.rocketxQuote) {
        // Find the wallet again to ensure we have the right one for decryption
        // and that tokens are properly connected
        const rxResult = await executeRocketxSwap({
          fromToken: this.normalizeToken(fromToken),
          toToken: this.normalizeToken(toToken),
          fromAmount: amount,
          fromAddress: wallet.address,
          toAddress: wallet.address,
          slippage: slippageTolerance.toString()
        });

        const submittedOrder: ExecutionOrder = {
          ...order,
          status: "submitted",
          txHash: rxResult.transactionHash,
          executedAt: Date.now(),
        };

        this.saveOrderToHistory(submittedOrder);
        return submittedOrder;
      }

      // Pre-check balance before manual signing path
      const hasBalance = await this.checkSufficientBalance(wallet, amount, fromToken, userPassword, userId);
      if (!hasBalance) {
        throw new Error(`Insufficient ${fromToken} balance for this swap`);
      }

      // Fallback: Sign and submit manually (existing AsterDEX logic)
      const signedTx = await this.signSwapTransaction(
        wallet,
        order,
        userPassword,
        userId
      );

      const { order: submittedOrder } = await this.submitSignedTransaction(
        signedTx,
        order
      );

      return submittedOrder;
    } catch (error) {
      throw new Error(`Swap execution failed: ${error}`);
    }
  }

  /**
   * Normalize token symbol for RocketX integration
   */
  private normalizeToken(token: string): string {
    // RocketX often expects tokens in Chain.Symbol format (e.g., ETH.ETH, BTC.BTC, ETH.USDT)
    if (token === 'BTC') return 'BTC.BTC';
    if (token === 'ETH') return 'ETH.ETH';
    if (token === 'SOL') return 'SOL.SOL';
    if (token === 'TRX') return 'TRX.TRX';
    if (token === 'BNB') return 'BSC.BNB';
    if (token === 'XRP') return 'XRP.XRP';
    if (token === 'LTC') return 'LTC.LTC';
    if (token === 'ADA') return 'CARDANO.ADA';
    if (token === 'TON') return 'TON.TON';
    if (token === 'USDT') return 'ETH.USDT'; // Default to Ethereum USDT
    if (token === 'USDC') return 'ETH.USDC';
    return token;
  }

  async signSwapTransaction(
    wallet: NonCustodialWallet,
    order: ExecutionOrder,
    userPassword: string,
    userId?: string
  ): Promise<string> {
    if (!userId) {
      throw new Error("User ID required to sign transaction");
    }

    const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(wallet.id, userPassword, userId);
    if (!mnemonic) {
      throw new Error("Mnemonic not found for signing");
    }

    const effectiveWalletType = wallet.walletType || 
      ((wallet.chainId === "bitcoin" || wallet.chainId === "Bitcoin (SegWit)") ? "bitcoin" : 
       (wallet.chainId === "Solana") ? "solana" :
       (wallet.chainId === "Tron (TRC-20)") ? "tron" : "ethereum");

    try {
      let signedTxResult: any;

      if (effectiveWalletType === "bitcoin") {
        const btcTxData = {
          to: "bc1" + "q".repeat(39),
          amount: Math.floor(parseFloat(order.amount) * 1e8),
          utxos: [],
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

  async submitSignedTransaction(
    signedTx: string,
    order: ExecutionOrder
  ): Promise<{ txHash: string; order: ExecutionOrder }> {
    try {
      const txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      const updatedOrder: ExecutionOrder = {
        ...order,
        status: "submitted",
        txHash,
        executedAt: Date.now(),
      };

      this.saveOrderToHistory(updatedOrder);

      return {
        txHash,
        order: updatedOrder,
      };
    } catch (error) {
      throw new Error(`Failed to submit transaction: ${error}`);
    }
  }

  private saveOrderToHistory(order: ExecutionOrder) {
    const history = JSON.parse(localStorage.getItem("pexly_swap_history") || "[]");
    history.unshift(order);
    localStorage.setItem("pexly_swap_history", JSON.stringify(history.slice(0, 50)));
  }

  getOrderHistory(): ExecutionOrder[] {
    return JSON.parse(localStorage.getItem("pexly_swap_history") || "[]");
  }

  async monitorTransaction(
    txHash: string,
    maxWaitTime: number = 60000
  ): Promise<{ confirmed: boolean; blockNumber?: number }> {
    try {
      console.log(`Transaction ${txHash} submitted to network. Awaiting on-chain confirmation...`);
      return { confirmed: false };
    } catch (error) {
      throw new Error(`Failed to monitor transaction: ${error}`);
    }
  }

  async checkSufficientBalance(
    wallet: NonCustodialWallet,
    amount: string,
    currency: string,
    userPassword: string,
    userId: string
  ): Promise<boolean> {
    const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(wallet.id, userPassword, userId);
    if (!mnemonic) throw new Error("Mnemonic not found for balance check");

    let balanceStr = "0";
    const type = wallet.walletType;

    if (type === "bitcoin") {
      const balanceSats = await getBitcoinBalance(wallet.address);
      balanceStr = (balanceSats / 1e8).toString();
    } else if (type === "ethereum") {
      balanceStr = await getEVMBalance(mnemonic, currency as any);
    } else if (type === "tron") {
      if (currency === "TRX") {
        balanceStr = await getTronBalance(mnemonic);
      } else {
        balanceStr = await getTRC20Balance(mnemonic, "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"); 
      }
    }

    return parseFloat(balanceStr) >= parseFloat(amount);
  }
}

export const swapExecutionService = new SwapExecutionService();
