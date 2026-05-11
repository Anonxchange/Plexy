import { signEVMContractCall, broadcastEVMTransaction, CHAIN_CONFIGS } from './evmSigner';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';

export const POLY_USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const POLY_CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
const USDC_DECIMALS = 6;

async function polygonRpc(method: string, params: unknown[]) {
  const rpcUrl = CHAIN_CONFIGS['POL'].rpcUrl;
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'RPC error');
  return json.result as string;
}

function sel(sig: string): string {
  return bytesToHex(keccak_256(new TextEncoder().encode(sig)).slice(0, 4));
}

function pad(hex: string): string {
  return hex.replace('0x', '').toLowerCase().padStart(64, '0');
}

export interface PolymarketWalletInfo {
  address: string;
  usdcBalance: string;
  approvedAmount: string;
}

export async function getPolymarketWalletInfo(address: string): Promise<PolymarketWalletInfo> {
  const paddedAddr = pad(address);
  const paddedEx   = pad(POLY_CTF_EXCHANGE);

  const [balRes, allowRes] = await Promise.all([
    polygonRpc('eth_call', [{ to: POLY_USDC_ADDRESS, data: '0x' + sel('balanceOf(address)') + paddedAddr }, 'latest']),
    polygonRpc('eth_call', [{ to: POLY_USDC_ADDRESS, data: '0x' + sel('allowance(address,address)') + paddedAddr + paddedEx }, 'latest']),
  ]);

  const usdcBalance    = (Number(BigInt(balRes   || '0x0')) / 10 ** USDC_DECIMALS).toFixed(2);
  const approvedAmount = (Number(BigInt(allowRes  || '0x0')) / 10 ** USDC_DECIMALS).toFixed(2);

  return { address, usdcBalance, approvedAmount };
}

export async function approveUsdcToPolymarket(
  mnemonic: string,
  amount: string,
): Promise<{ txHash: string; explorerUrl: string }> {
  const amountWei = BigInt(Math.round(parseFloat(amount) * 10 ** USDC_DECIMALS));
  const data =
    '0x' + sel('approve(address,uint256)') +
    pad(POLY_CTF_EXCHANGE) +
    amountWei.toString(16).padStart(64, '0');

  const { signedTx, txHash } = await signEVMContractCall(mnemonic, {
    chain: 'POL',
    to: POLY_USDC_ADDRESS,
    data,
  });
  await broadcastEVMTransaction(signedTx, 'POL');
  return { txHash, explorerUrl: `https://polygonscan.com/tx/${txHash}` };
}

export async function revokeUsdcFromPolymarket(
  mnemonic: string,
): Promise<{ txHash: string; explorerUrl: string }> {
  const data =
    '0x' + sel('approve(address,uint256)') +
    pad(POLY_CTF_EXCHANGE) +
    '0'.padStart(64, '0');

  const { signedTx, txHash } = await signEVMContractCall(mnemonic, {
    chain: 'POL',
    to: POLY_USDC_ADDRESS,
    data,
  });
  await broadcastEVMTransaction(signedTx, 'POL');
  return { txHash, explorerUrl: `https://polygonscan.com/tx/${txHash}` };
}
