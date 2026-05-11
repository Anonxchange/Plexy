import { signEVMContractCall, broadcastEVMTransaction, CHAIN_CONFIGS } from './evmSigner';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';

export const POLY_USDC_ADDRESS    = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const POLY_CTF_EXCHANGE    = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
export const POLY_PUSD_ADDRESS    = '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB';
export const POLY_COLLATERAL_ONRAMP = '0x93070a847efEf7F70739046A929D47a521F5B8ee';
const USDC_DECIMALS = 6;

const DATA_API = 'https://data-api.polymarket.com';

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
  pusdBalance: string;
}

export async function getPolymarketWalletInfo(address: string): Promise<PolymarketWalletInfo> {
  const paddedAddr = pad(address);
  const paddedEx   = pad(POLY_CTF_EXCHANGE);

  const [balRes, allowRes, pusdRes] = await Promise.all([
    polygonRpc('eth_call', [{ to: POLY_USDC_ADDRESS, data: '0x' + sel('balanceOf(address)') + paddedAddr }, 'latest']),
    polygonRpc('eth_call', [{ to: POLY_USDC_ADDRESS, data: '0x' + sel('allowance(address,address)') + paddedAddr + paddedEx }, 'latest']),
    polygonRpc('eth_call', [{ to: POLY_PUSD_ADDRESS, data: '0x' + sel('balanceOf(address)') + paddedAddr }, 'latest']).catch(() => '0x0'),
  ]);

  const usdcBalance    = (Number(BigInt(balRes   || '0x0')) / 10 ** USDC_DECIMALS).toFixed(2);
  const approvedAmount = (Number(BigInt(allowRes  || '0x0')) / 10 ** USDC_DECIMALS).toFixed(2);
  const pusdBalance    = (Number(BigInt(pusdRes   || '0x0')) / 10 ** USDC_DECIMALS).toFixed(2);

  return { address, usdcBalance, approvedAmount, pusdBalance };
}

export interface PolymarketTrade {
  id?: string;
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION';
  side: 'BUY' | 'SELL';
  size: number;
  usdcSize: number;
  price: number;
  outcome: string;
  title: string;
  asset: string;
  transactionHash?: string;
  feeRateBps?: number;
}

export async function getPolymarketTradeHistory(
  address: string,
  limit = 50,
): Promise<PolymarketTrade[]> {
  const url = `${DATA_API}/trades?user=${address.toLowerCase()}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Polymarket data API error: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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
