import { signEVMContractCall, broadcastEVMTransaction, CHAIN_CONFIGS } from './evmSigner';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';

// ─── Polygon Mainnet contract addresses (official Polymarket docs) ────────────
// CTF Exchange: where pUSD approvals go for trading
export const POLY_CTF_EXCHANGE      = '0xE111180000d2663C0091e4f400237545B87B996B';
// Neg Risk CTF Exchange (used for augmented markets)
export const POLY_NEG_RISK_EXCHANGE = '0xe2222d279d744050d28e00520010520000310F59';
// USDC bridged (USDC.e) — the token users hold on Polygon
export const POLY_USDC_ADDRESS      = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
// pUSD — Polymarket's wrapped collateral token used for all trades
export const POLY_PUSD_ADDRESS      = '0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB';
// CollateralOnramp — converts USDC.e → pUSD (separate transaction from approval)
export const POLY_COLLATERAL_ONRAMP = '0x93070a847efEf7F70739046A929D47a521F5B8ee';

const USDC_DECIMALS = 6;
const DATA_API      = 'https://data-api.polymarket.com';

// ─── Low-level RPC helper ─────────────────────────────────────────────────────
async function polygonRpc(method: string, params: unknown[]): Promise<string> {
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

// ABI selector: first 4 bytes of keccak256(signature)
function sel(sig: string): string {
  return bytesToHex(keccak_256(new TextEncoder().encode(sig)).slice(0, 4));
}

// Left-pad a hex address/uint to 32 bytes
function pad(hex: string): string {
  return hex.replace('0x', '').toLowerCase().padStart(64, '0');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PolymarketWalletInfo {
  address:        string;
  usdcBalance:    string;   // USDC.e the user holds
  approvedAmount: string;   // pUSD approved to CTF Exchange for trading
  pusdBalance:    string;   // pUSD the user holds (available after onramp)
}

export interface PolymarketTrade {
  id?:              string;
  proxyWallet:      string;
  timestamp:        number;
  conditionId:      string;
  type:             'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION';
  side:             'BUY' | 'SELL';
  size:             number;
  usdcSize:         number;
  price:            number;
  outcome:          string;
  title:            string;
  asset:            string;
  transactionHash?: string;
  feeRateBps?:      number;
}

// ─── Read wallet balances / approval state ────────────────────────────────────
// Security note: uses eth_call (read-only) — no private key involved.
// Approval check is pUSD.allowance(addr, CTF_EXCHANGE) because Polymarket
// trades exclusively in pUSD, not raw USDC.e.
export async function getPolymarketWalletInfo(address: string): Promise<PolymarketWalletInfo> {
  const paddedAddr = pad(address);
  const paddedEx   = pad(POLY_CTF_EXCHANGE);

  const [usdcRes, pusdRes, allowRes] = await Promise.all([
    // USDC.e balance (what user holds on Polygon)
    polygonRpc('eth_call', [
      { to: POLY_USDC_ADDRESS, data: '0x' + sel('balanceOf(address)') + paddedAddr },
      'latest',
    ]),
    // pUSD balance (after CollateralOnramp conversion)
    polygonRpc('eth_call', [
      { to: POLY_PUSD_ADDRESS, data: '0x' + sel('balanceOf(address)') + paddedAddr },
      'latest',
    ]).catch(() => '0x0'),
    // pUSD allowance granted to CTF Exchange (this is what enables trading)
    polygonRpc('eth_call', [
      { to: POLY_PUSD_ADDRESS, data: '0x' + sel('allowance(address,address)') + paddedAddr + paddedEx },
      'latest',
    ]),
  ]);

  const usdcBalance    = (Number(BigInt(usdcRes  || '0x0')) / 10 ** USDC_DECIMALS).toFixed(2);
  const pusdBalance    = (Number(BigInt(pusdRes  || '0x0')) / 10 ** USDC_DECIMALS).toFixed(2);
  const approvedAmount = (Number(BigInt(allowRes || '0x0')) / 10 ** USDC_DECIMALS).toFixed(2);

  return { address, usdcBalance, approvedAmount, pusdBalance };
}

// ─── Approve pUSD to CTF Exchange ─────────────────────────────────────────────
// Security note:
//   - mnemonic is passed in memory only, never stored or logged here.
//   - We approve pUSD (NOT USDC.e) to the official CTF Exchange address.
//   - If the user has not yet onramped USDC→pUSD via CollateralOnramp,
//     the approval will succeed on-chain but the exchange will have no
//     pUSD to pull — the UI shows the pUSD balance separately.
//   - Amount is encoded as a uint256 with 6 decimals (same as USDC/pUSD).
export async function approveUsdcToPolymarket(
  mnemonic: string,
  amount:   string,
): Promise<{ txHash: string; explorerUrl: string }> {
  const amountWei = BigInt(Math.round(parseFloat(amount) * 10 ** USDC_DECIMALS));

  // pUSD.approve(CTF_EXCHANGE, amountWei)
  const data =
    '0x' +
    sel('approve(address,uint256)') +
    pad(POLY_CTF_EXCHANGE) +
    amountWei.toString(16).padStart(64, '0');

  const { signedTx, txHash } = await signEVMContractCall(mnemonic, {
    chain: 'POL',
    to:    POLY_PUSD_ADDRESS,     // token we're approving FROM (pUSD)
    data,
  });
  await broadcastEVMTransaction(signedTx, 'POL');
  return { txHash, explorerUrl: `https://polygonscan.com/tx/${txHash}` };
}

// ─── Revoke pUSD allowance from CTF Exchange ─────────────────────────────────
// Sets allowance to 0 — safe to call at any time.
export async function revokeUsdcFromPolymarket(
  mnemonic: string,
): Promise<{ txHash: string; explorerUrl: string }> {
  // pUSD.approve(CTF_EXCHANGE, 0)
  const data =
    '0x' +
    sel('approve(address,uint256)') +
    pad(POLY_CTF_EXCHANGE) +
    '0'.padStart(64, '0');

  const { signedTx, txHash } = await signEVMContractCall(mnemonic, {
    chain: 'POL',
    to:    POLY_PUSD_ADDRESS,     // same token as above
    data,
  });
  await broadcastEVMTransaction(signedTx, 'POL');
  return { txHash, explorerUrl: `https://polygonscan.com/tx/${txHash}` };
}

// ─── Trade history (public Data API — no auth required) ──────────────────────
export async function getPolymarketTradeHistory(
  address: string,
  limit    = 50,
): Promise<PolymarketTrade[]> {
  const url = `${DATA_API}/trades?user=${address.toLowerCase()}&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Polymarket data API error: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
