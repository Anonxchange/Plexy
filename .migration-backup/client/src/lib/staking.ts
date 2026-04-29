/**
 * Liquid-staking + lending product registry and ABI encoders.
 *
 * Supported products:
 *   - Lido        : ETH  -> stETH        (Ethereum mainnet)
 *   - Stader      : POL  -> MaticX       (Polygon mainnet, formerly stMATIC class)
 *   - Lista DAO   : BNB  -> slisBNB      (BNB Smart Chain)
 *   - Aave V3     : USDT -> aUSDT        (Ethereum, Polygon, Arbitrum)
 *
 * All encoders return 0x-prefixed hex calldata that can be passed straight to
 * `signEVMContractCall(mnemonic, { chain, to, data, valueWei })` from
 * `lib/evmSigner.ts`.
 *
 * NOTE on USDT (Tether) on Ethereum mainnet: the token is non-standard — its
 * `approve` does not return a boolean and reverts when the existing allowance
 * is non-zero and the new allowance is also non-zero. The `prepareAaveSupply`
 * helper handles this by issuing an `approve(0)` step first when needed.
 */

import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import {
  CHAIN_CONFIGS,
  signEVMContractCall,
  broadcastEVMTransaction,
} from "./evmSigner";

/* -------------------------------------------------------------------------- */
/*                              ABI ENCODING HELPERS                          */
/* -------------------------------------------------------------------------- */

function selector(signature: string): string {
  const sel = keccak_256(new TextEncoder().encode(signature)).slice(0, 4);
  return bytesToHex(sel);
}

function padAddress(addr: string): string {
  return addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

function padUint(value: bigint | number | string): string {
  const v = typeof value === "bigint" ? value : BigInt(value);
  return v.toString(16).padStart(64, "0");
}

/** Decimal-string -> bigint with `decimals` precision (no float math). */
export function parseUnits(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();
  if (!trimmed) return 0n;
  const [whole, fraction = ""] = trimmed.split(".");
  const fracPadded = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

/** bigint with `decimals` precision -> human-readable decimal string. */
export function formatUnits(value: bigint, decimals: number, maxFractionDigits = 6): string {
  const negative = value < 0n;
  const v = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = v % base;
  let fracStr = frac.toString().padStart(decimals, "0").slice(0, maxFractionDigits);
  fracStr = fracStr.replace(/0+$/, "");
  const out = fracStr ? `${whole}.${fracStr}` : `${whole}`;
  return negative ? `-${out}` : out;
}

/* -------------------------------------------------------------------------- */
/*                                ENCODERS                                    */
/* -------------------------------------------------------------------------- */

/** ERC20 `approve(address,uint256)` */
export function encodeErc20Approve(spender: string, amount: bigint): string {
  return "0x" + selector("approve(address,uint256)") + padAddress(spender) + padUint(amount);
}

/** ERC20 `allowance(address,address)` view (for use with eth_call). */
export function encodeErc20Allowance(owner: string, spender: string): string {
  return "0x" + selector("allowance(address,address)") + padAddress(owner) + padAddress(spender);
}

/** ERC20 `balanceOf(address)` view. */
export function encodeErc20BalanceOf(owner: string): string {
  return "0x" + selector("balanceOf(address)") + padAddress(owner);
}

/** Lido: `submit(address _referral) payable returns (uint256)`. */
export function encodeLidoSubmit(referral: string = "0x0000000000000000000000000000000000000000"): string {
  return "0x" + selector("submit(address)") + padAddress(referral);
}

/** Lista DAO StakeManager: `deposit() payable`. */
export function encodeListaDeposit(): string {
  return "0x" + selector("deposit()");
}

/**
 * Stader MaticX (Polygon): `swapMaticForMaticXViaInstantPool() payable`.
 * Performs an immediate POL -> MaticX swap via the Stader instant pool.
 */
export function encodeStaderSwapMaticForMaticX(): string {
  return "0x" + selector("swapMaticForMaticXViaInstantPool()");
}

/** Aave V3: `supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)`. */
export function encodeAaveSupply(
  asset: string,
  amount: bigint,
  onBehalfOf: string,
  referralCode = 0
): string {
  return (
    "0x" +
    selector("supply(address,uint256,address,uint16)") +
    padAddress(asset) +
    padUint(amount) +
    padAddress(onBehalfOf) +
    padUint(referralCode)
  );
}

/* -------------------------------------------------------------------------- */
/*                       READ-ONLY HELPERS (eth_call wrappers)                */
/* -------------------------------------------------------------------------- */

async function ethCall(chain: string, to: string, data: string): Promise<string> {
  const cfg = CHAIN_CONFIGS[chain.toUpperCase()] || CHAIN_CONFIGS.ETH;
  const res = await fetch(cfg.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "eth_call failed");
  return json.result as string;
}

export async function readErc20Allowance(
  chain: string,
  token: string,
  owner: string,
  spender: string
): Promise<bigint> {
  const data = encodeErc20Allowance(owner, spender);
  const res = await ethCall(chain, token, data);
  return BigInt(res || "0x0");
}

export async function readErc20Balance(chain: string, token: string, owner: string): Promise<bigint> {
  const data = encodeErc20BalanceOf(owner);
  const res = await ethCall(chain, token, data);
  return BigInt(res || "0x0");
}

/* -------------------------------------------------------------------------- */
/*                              PRODUCT REGISTRY                              */
/* -------------------------------------------------------------------------- */

export type ProductKind = "liquid-staking" | "lending";

export interface StakingProduct {
  id: string;
  kind: ProductKind;
  provider: "Lido" | "Stader" | "Lista DAO" | "Aave V3";
  /** Native chain symbol shown in UI ("Ethereum", "Polygon", "BSC", "Arbitrum"). */
  chainName: string;
  /** Chain key used by `signEVMContractCall` (matches `CHAIN_CONFIGS`). */
  chainKey: "ETH" | "POL" | "BSC" | "ARB";
  /** Token user is depositing. */
  inputSymbol: string;
  /** Token user receives. */
  outputSymbol: string;
  /** Decimals of the input token (18 for native, 6 for USDT mainnet/arbitrum, etc.). */
  inputDecimals: number;
  /** True when the input is the chain's native coin (no ERC20 approve needed). */
  inputIsNative: boolean;
  /** ERC20 contract for the input token (only when !inputIsNative). */
  inputTokenAddress?: string;
  /** Contract that receives the stake / supply call. */
  contractAddress: string;
  /**
   * ERC20 token the user receives in exchange (stETH, MaticX, slisBNB, aUSDT…).
   * Used to show the user's existing position. Note: for Lido, the receipt
   * token (`stETH`) lives at the same address as the staking contract.
   */
  receiptTokenAddress: string;
  /** Decimals of the receipt token (almost always matches the input asset). */
  receiptDecimals: number;
  /**
   * Minimum amount accepted by the protocol (in input units). Lido for
   * example requires >= 0.0001 ETH. Used for client-side validation only.
   */
  minAmount: number;
  /** External docs URL — opened by the "Learn more" button. */
  learnMoreUrl: string;
  /** Block-explorer base URL for this chain (no trailing slash). */
  explorer: string;
  /** Short marketing line shown under the product title. */
  blurb: string;
}

export const STAKING_PRODUCTS: StakingProduct[] = [
  {
    id: "lido-eth",
    kind: "liquid-staking",
    provider: "Lido",
    chainName: "Ethereum",
    chainKey: "ETH",
    inputSymbol: "ETH",
    outputSymbol: "stETH",
    inputDecimals: 18,
    inputIsNative: true,
    contractAddress: "0xae7ab96520De3a18E5e111B5EaAb095312D7fE84",
    receiptTokenAddress: "0xae7ab96520De3a18E5e111B5EaAb095312D7fE84",
    receiptDecimals: 18,
    minAmount: 0.0001,
    learnMoreUrl: "https://lido.fi/ethereum",
    explorer: "https://etherscan.io/tx",
    blurb: "Liquid stake ETH and earn protocol-level rewards while keeping a tradable receipt token.",
  },
  {
    id: "stader-pol",
    kind: "liquid-staking",
    provider: "Stader",
    chainName: "Polygon",
    chainKey: "POL",
    inputSymbol: "POL",
    outputSymbol: "MaticX",
    inputDecimals: 18,
    inputIsNative: true,
    contractAddress: "0xfd225C9e6601C9d38d8F98d8731BF59eFcF8C0E3",
    receiptTokenAddress: "0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6",
    receiptDecimals: 18,
    minAmount: 1,
    learnMoreUrl: "https://www.staderlabs.com/polygon/",
    explorer: "https://polygonscan.com/tx",
    blurb: "Swap POL for MaticX via Stader's instant pool — auto-compounds Polygon validator yield.",
  },
  {
    id: "lista-bnb",
    kind: "liquid-staking",
    provider: "Lista DAO",
    chainName: "BSC",
    chainKey: "BSC",
    inputSymbol: "BNB",
    outputSymbol: "slisBNB",
    inputDecimals: 18,
    inputIsNative: true,
    contractAddress: "0x1adB950d8bB3dA4bE104211D5AB038628e477fE6",
    receiptTokenAddress: "0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B",
    receiptDecimals: 18,
    minAmount: 0.01,
    learnMoreUrl: "https://lista.org/liquid-staking/BNB",
    explorer: "https://bscscan.com/tx",
    blurb: "Stake BNB through Lista DAO and receive slisBNB — usable across BSC DeFi.",
  },
  {
    id: "aave-usdt-eth",
    kind: "lending",
    provider: "Aave V3",
    chainName: "Ethereum",
    chainKey: "ETH",
    inputSymbol: "USDT",
    outputSymbol: "aEthUSDT",
    inputDecimals: 6,
    inputIsNative: false,
    inputTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    contractAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    receiptTokenAddress: "0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a",
    receiptDecimals: 6,
    minAmount: 1,
    learnMoreUrl: "https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3",
    explorer: "https://etherscan.io/tx",
    blurb: "Supply USDT on Aave V3 mainnet — variable APY, withdraw anytime.",
  },
  {
    id: "aave-usdt-pol",
    kind: "lending",
    provider: "Aave V3",
    chainName: "Polygon",
    chainKey: "POL",
    inputSymbol: "USDT",
    outputSymbol: "aPolUSDT",
    inputDecimals: 6,
    inputIsNative: false,
    inputTokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    receiptTokenAddress: "0x6ab707Aca953eDAeFBc4fD23bA73294241490620",
    receiptDecimals: 6,
    minAmount: 1,
    learnMoreUrl: "https://app.aave.com/reserve-overview/?underlyingAsset=0xc2132d05d31c914a87c6611c10748aeb04b58e8f&marketName=proto_polygon_v3",
    explorer: "https://polygonscan.com/tx",
    blurb: "Supply USDT on Aave V3 Polygon — low gas fees, instant withdrawals.",
  },
  {
    id: "aave-usdt-arb",
    kind: "lending",
    provider: "Aave V3",
    chainName: "Arbitrum",
    chainKey: "ARB",
    inputSymbol: "USDT",
    outputSymbol: "aArbUSDT",
    inputDecimals: 6,
    inputIsNative: false,
    inputTokenAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    receiptTokenAddress: "0x6ab707Aca953eDAeFBc4fD23bA73294241490620",
    receiptDecimals: 6,
    minAmount: 1,
    learnMoreUrl: "https://app.aave.com/reserve-overview/?underlyingAsset=0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9&marketName=proto_arbitrum_v3",
    explorer: "https://arbiscan.io/tx",
    blurb: "Supply USDT on Aave V3 Arbitrum — L2 speeds with mainnet-grade safety.",
  },
];

export function getProductById(id: string): StakingProduct | undefined {
  return STAKING_PRODUCTS.find((p) => p.id === id);
}

/* -------------------------------------------------------------------------- */
/*                          HIGH-LEVEL STAKE FLOW                             */
/* -------------------------------------------------------------------------- */

export interface StakeStepResult {
  /** Human label of the step that just executed. */
  label: string;
  /** Broadcasted transaction hash (0x…). */
  txHash: string;
  /** Block-explorer URL pointing at the tx. */
  explorerUrl: string;
}

export interface StakeFlowOptions {
  /** Notified after each broadcast (approve, supply, submit, …). */
  onStep?: (step: StakeStepResult) => void;
}

/**
 * Executes the full stake / supply flow for the given product. Handles the
 * Aave two-step (approve + supply) including the USDT-mainnet allowance reset
 * quirk. Returns the list of broadcasted transactions in order.
 */
export async function executeStake(
  mnemonic: string,
  product: StakingProduct,
  amountHuman: string,
  fromAddress: string,
  opts: StakeFlowOptions = {}
): Promise<StakeStepResult[]> {
  const amount = parseUnits(amountHuman, product.inputDecimals);
  if (amount <= 0n) throw new Error("Amount must be greater than zero");
  if (Number(amountHuman) < product.minAmount) {
    throw new Error(`Minimum amount is ${product.minAmount} ${product.inputSymbol}`);
  }

  const results: StakeStepResult[] = [];
  const explorerFor = (hash: string) => `${product.explorer}/${hash}`;

  /* --- Liquid-staking branch (Lido / Stader / Lista) --------------------- */
  if (product.kind === "liquid-staking") {
    let data: string;
    if (product.provider === "Lido") {
      data = encodeLidoSubmit();
    } else if (product.provider === "Stader") {
      data = encodeStaderSwapMaticForMaticX();
    } else if (product.provider === "Lista DAO") {
      data = encodeListaDeposit();
    } else {
      throw new Error(`Unsupported liquid-staking provider: ${product.provider}`);
    }

    const { signedTx, txHash } = await signEVMContractCall(mnemonic, {
      chain: product.chainKey,
      to: product.contractAddress,
      data,
      valueWei: amount.toString(),
    });
    await broadcastEVMTransaction(signedTx, product.chainKey);
    const step: StakeStepResult = {
      label: `Stake ${amountHuman} ${product.inputSymbol}`,
      txHash,
      explorerUrl: explorerFor(txHash),
    };
    results.push(step);
    opts.onStep?.(step);
    return results;
  }

  /* --- Lending branch (Aave V3) ----------------------------------------- */
  if (product.kind === "lending") {
    if (!product.inputTokenAddress) throw new Error("Aave product is missing token address");

    // 1. Check current allowance.
    const current = await readErc20Allowance(
      product.chainKey,
      product.inputTokenAddress,
      fromAddress,
      product.contractAddress
    );

    // USDT mainnet quirk: if allowance > 0 and we want a different non-zero
    // allowance, we MUST reset to 0 first.
    const isUsdtMainnet =
      product.chainKey === "ETH" &&
      product.inputTokenAddress.toLowerCase() === "0xdac17f958d2ee523a2206206994597c13d831ec7";

    if (current < amount) {
      if (current > 0n && isUsdtMainnet) {
        const reset = await signEVMContractCall(mnemonic, {
          chain: product.chainKey,
          to: product.inputTokenAddress,
          data: encodeErc20Approve(product.contractAddress, 0n),
          valueWei: "0",
        });
        await broadcastEVMTransaction(reset.signedTx, product.chainKey);
        const step: StakeStepResult = {
          label: `Reset USDT allowance`,
          txHash: reset.txHash,
          explorerUrl: explorerFor(reset.txHash),
        };
        results.push(step);
        opts.onStep?.(step);
      }

      const approve = await signEVMContractCall(mnemonic, {
        chain: product.chainKey,
        to: product.inputTokenAddress,
        data: encodeErc20Approve(product.contractAddress, amount),
        valueWei: "0",
      });
      await broadcastEVMTransaction(approve.signedTx, product.chainKey);
      const step: StakeStepResult = {
        label: `Approve ${amountHuman} ${product.inputSymbol}`,
        txHash: approve.txHash,
        explorerUrl: explorerFor(approve.txHash),
      };
      results.push(step);
      opts.onStep?.(step);
    }

    // 2. Supply.
    const supply = await signEVMContractCall(mnemonic, {
      chain: product.chainKey,
      to: product.contractAddress,
      data: encodeAaveSupply(product.inputTokenAddress, amount, fromAddress, 0),
      valueWei: "0",
    });
    await broadcastEVMTransaction(supply.signedTx, product.chainKey);
    const step: StakeStepResult = {
      label: `Supply ${amountHuman} ${product.inputSymbol} to Aave`,
      txHash: supply.txHash,
      explorerUrl: explorerFor(supply.txHash),
    };
    results.push(step);
    opts.onStep?.(step);
    return results;
  }

  throw new Error(`Unknown product kind: ${(product as any).kind}`);
}
