import { signEVMTransaction, broadcastEVMTransaction, EVMTransactionRequest, TOKEN_CONTRACTS } from './evmSigner';
import {
  signSolanaTransaction,
  broadcastSolanaTransaction,
  getLatestBlockhash,
  getUserTokenAccount,
} from './solanaSigner';

const SOLANA_TOKEN_MINTS: Record<string, string> = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

const EXPLORER_BASE: Record<string, string> = {
  ETH: 'https://etherscan.io/tx',
  BSC: 'https://bscscan.com/tx',
  BNB: 'https://bscscan.com/tx',
  ARB: 'https://arbiscan.io/tx',
  SOL: 'https://solscan.io/tx',
};

// Map well-known coin+network combos to the static token-contract keys.
// This is the fallback path when the API didn't return contractAddress/decimals.
const STATIC_CURRENCY_MAP: Record<string, EVMTransactionRequest['currency']> = {
  'USDT_ETH': 'USDT_ETH', 'USDC_ETH': 'USDC_ETH',
  'USDT_BSC': 'USDT_BSC', 'USDC_BSC': 'USDC_BSC',
  'USDT_BNB': 'USDT_BSC', 'USDC_BNB': 'USDC_BSC',
  'USDT_ARB': 'USDT_ARB', 'USDC_ARB': 'USDC_ARB', 'USDCE_ARB': 'USDCE_ARB',
};

export interface DepositBroadcastParams {
  coin: string;
  network: string;
  amount: string;
  mnemonic: string;
  depositAddress: string;
  walletAddress: string;
  // On-chain metadata from the AsterDEX asset list.
  // When present, these take precedence over the static TOKEN_CONTRACTS table,
  // allowing any coin the API returns to be sent correctly.
  contractAddress?: string;
  decimals?: number;
  isNative?: boolean;
}

export interface DepositBroadcastResult {
  txHash: string;
  explorerUrl: string;
}

export async function broadcastDeposit({
  coin,
  network,
  amount,
  mnemonic,
  depositAddress,
  walletAddress,
  contractAddress,
  decimals,
  isNative,
}: DepositBroadcastParams): Promise<DepositBroadcastResult> {
  if (!amount || Number(amount) <= 0) {
    throw new Error('Enter an amount to deposit first.');
  }

  if (network === 'SOL') {
    return broadcastSolDeposit({ coin, amount, mnemonic, depositAddress, walletAddress, contractAddress, decimals });
  }

  return broadcastEvmDeposit({ coin, network, amount, mnemonic, depositAddress, contractAddress, decimals, isNative });
}

async function broadcastEvmDeposit({
  coin, network, amount, mnemonic, depositAddress, contractAddress, decimals, isNative,
}: Omit<DepositBroadcastParams, 'walletAddress'>): Promise<DepositBroadcastResult> {
  const chainKey = network.toUpperCase();

  // If the API gave us the contract address and decimals, use them directly so
  // any coin the exchange supports (USD1, ASBNB, LISUSD, etc.) works without
  // being listed in the static TOKEN_CONTRACTS table.
  if (contractAddress && decimals !== undefined && !isNative) {
    // Temporarily register the API-supplied contract so signEVMTransaction can
    // build the correct ERC-20 calldata without requiring a hardcoded entry.
    const tempKey = `${coin}_${chainKey}` as EVMTransactionRequest['currency'];
    TOKEN_CONTRACTS[tempKey] = { address: contractAddress, decimals };
    const { signedTx, txHash } = await signEVMTransaction(mnemonic, {
      to: depositAddress,
      amount,
      currency: tempKey,
    });
    delete TOKEN_CONTRACTS[tempKey];
    await broadcastEVMTransaction(signedTx, chainKey);
    return {
      txHash,
      explorerUrl: `${EXPLORER_BASE[chainKey] ?? EXPLORER_BASE.ETH}/${txHash}`,
    };
  }

  // Native coin (BNB, ETH, etc.) — no token contract needed.
  if (isNative) {
    const nativeCurrencyMap: Record<string, EVMTransactionRequest['currency']> = {
      BSC: 'BSC', BNB: 'BSC', ETH: 'ETH', ARB: 'ARB',
    };
    const nativeCurrency = nativeCurrencyMap[chainKey];
    if (!nativeCurrency) {
      throw new Error(`Native deposits on ${network} are not yet supported. Copy the address and send manually.`);
    }
    const { signedTx, txHash } = await signEVMTransaction(mnemonic, {
      to: depositAddress,
      amount,
      currency: nativeCurrency,
    });
    await broadcastEVMTransaction(signedTx, chainKey);
    return {
      txHash,
      explorerUrl: `${EXPLORER_BASE[chainKey] ?? EXPLORER_BASE.ETH}/${txHash}`,
    };
  }

  // Fallback: static lookup table for well-known coins when API metadata is absent.
  const staticKey = `${coin.toUpperCase()}_${chainKey}`;
  const currency = STATIC_CURRENCY_MAP[staticKey];
  if (currency) {
    const { signedTx, txHash } = await signEVMTransaction(mnemonic, { to: depositAddress, amount, currency });
    await broadcastEVMTransaction(signedTx, chainKey);
    return { txHash, explorerUrl: `${EXPLORER_BASE[chainKey] ?? EXPLORER_BASE.ETH}/${txHash}` };
  }

  throw new Error(
    `Direct wallet deposit is not yet supported for ${coin} on ${network}. Copy the address above and send manually.`
  );
}

async function broadcastSolDeposit({
  coin, amount, mnemonic, depositAddress, walletAddress, contractAddress,
}: Omit<DepositBroadcastParams, 'network'>): Promise<DepositBroadcastResult> {
  const blockhash = await getLatestBlockhash();

  if (coin.toUpperCase() === 'SOL') {
    const { signedTx } = await signSolanaTransaction(mnemonic, {
      to: depositAddress,
      amount,
      recentBlockhash: blockhash,
      currency: 'SOL',
    });
    const sig = await broadcastSolanaTransaction(signedTx);
    return { txHash: sig, explorerUrl: `${EXPLORER_BASE.SOL}/${sig}` };
  }

  // On Solana, the API returns the token mint as contractAddress — use it
  // directly when available so any SPL token the exchange supports works.
  // Fall back to the hardcoded map for USDT/USDC when not provided.
  const mint = contractAddress || SOLANA_TOKEN_MINTS[coin.toUpperCase()];
  if (!mint) {
    throw new Error(
      `Direct wallet deposit is not yet supported for ${coin} on Solana. Copy the address above and send manually.`
    );
  }

  const fromTokenAccount = await getUserTokenAccount(walletAddress, mint);
  if (!fromTokenAccount) {
    throw new Error(
      `No ${coin} token account found in your Solana wallet. You need to hold ${coin} on Solana before depositing.`
    );
  }

  // Use USDC_SOL for USDC, USDT_SOL for everything else (solanaSigner handles
  // the transfer calldata; the mint address drives which token actually moves).
  const currency = coin.toUpperCase() === 'USDC' ? 'USDC_SOL' : 'USDT_SOL';

  const { signedTx } = await signSolanaTransaction(mnemonic, {
    to: depositAddress,
    amount,
    recentBlockhash: blockhash,
    currency,
    tokenAddress: mint,
    fromTokenAccount,
    toTokenAccount: depositAddress,
  });

  const sig = await broadcastSolanaTransaction(signedTx);
  return { txHash: sig, explorerUrl: `${EXPLORER_BASE.SOL}/${sig}` };
}
