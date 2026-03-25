import { signEVMTransaction, broadcastEVMTransaction, EVMTransactionRequest } from './evmSigner';
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

function evmCurrencyKey(coin: string, network: string): EVMTransactionRequest['currency'] {
  const c = coin.toUpperCase();
  const n = network.toUpperCase();

  if (c === 'USDT'  && n === 'ETH') return 'USDT_ETH';
  if (c === 'USDC'  && n === 'ETH') return 'USDC_ETH';
  if (c === 'USDT'  && (n === 'BSC' || n === 'BNB')) return 'USDT_BSC';
  if (c === 'USDC'  && (n === 'BSC' || n === 'BNB')) return 'USDC_BSC';
  if (c === 'USDT'  && n === 'ARB') return 'USDT_ARB';
  if (c === 'USDC'  && n === 'ARB') return 'USDC_ARB';
  if (c === 'USDCE' && n === 'ARB') return 'USDCE_ARB';

  if ((c === 'ETH' || c === 'WETH') && n === 'ETH') return 'ETH';
  if ((c === 'BNB')                 && n === 'BSC')  return 'BSC';
  if ((c === 'ETH')                 && n === 'ARB')  return 'ARB';

  throw new Error(
    `Direct wallet deposit is not yet supported for ${coin} on ${network}. Copy the address above and send manually.`
  );
}

export interface DepositBroadcastParams {
  coin: string;
  network: string;
  amount: string;
  mnemonic: string;
  depositAddress: string;
  walletAddress: string;
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
}: DepositBroadcastParams): Promise<DepositBroadcastResult> {
  if (!amount || Number(amount) <= 0) {
    throw new Error('Enter an amount to deposit first.');
  }

  if (network === 'SOL') {
    return broadcastSolDeposit({ coin, amount, mnemonic, depositAddress, walletAddress });
  }

  return broadcastEvmDeposit({ coin, network, amount, mnemonic, depositAddress });
}

async function broadcastEvmDeposit({
  coin, network, amount, mnemonic, depositAddress,
}: Omit<DepositBroadcastParams, 'walletAddress'>): Promise<DepositBroadcastResult> {
  const currency = evmCurrencyKey(coin, network);
  const chainKey = network.toUpperCase();

  const { signedTx, txHash } = await signEVMTransaction(mnemonic, {
    to: depositAddress,
    amount,
    currency,
  });

  await broadcastEVMTransaction(signedTx, chainKey);

  return {
    txHash,
    explorerUrl: `${EXPLORER_BASE[chainKey] ?? EXPLORER_BASE.ETH}/${txHash}`,
  };
}

async function broadcastSolDeposit({
  coin, amount, mnemonic, depositAddress, walletAddress,
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

  const mint = SOLANA_TOKEN_MINTS[coin.toUpperCase()];
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
