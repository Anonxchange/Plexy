import type { TronConnector } from "@reown/appkit-adapter-tron";

export class WalletSubmissionUnknownError extends Error {
  constructor(readonly transactionHash: string) {
    super("Submission status is unknown. Check this transaction on the explorer before trying another transfer.");
  }
}

// Prepare and broadcast through TRON's native API, not the Reown TRON RPC.
// Only the connected wallet can sign; this code never handles private keys.
export async function sendTronNative(provider: TronConnector, from: string, to: string, units: bigint) {
  if (units <= 0n || units > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Enter a valid TRON amount.");
  const { TronWeb, utils } = await import("tronweb");
  const client = new TronWeb({ fullHost: "https://api.trongrid.io" });
  const transaction = await client.transactionBuilder.sendTrx(to, Number(units), from);
  const contracts = transaction.raw_data.contract;
  const value = contracts[0]?.parameter?.value;
  const normalized = (address: string) => TronWeb.address.toHex(address).toLowerCase();
  if (
    contracts.length !== 1 || contracts[0].type !== "TransferContract" ||
    !value || value.amount !== Number(units) ||
    normalized(value.owner_address) !== normalized(from) ||
    normalized(value.to_address) !== normalized(to) ||
    !utils.transaction.txCheck(transaction)
  ) {
    throw new Error("The TRON node returned an unexpected transaction. Nothing was signed.");
  }

  const signingTransaction = structuredClone(transaction);
  let signed: unknown;
  if (provider.type === "WALLET_CONNECT") {
    // This is the public UniversalProvider exposed by the SDK's
    // WalletConnectConnector, not a wallet's private signing implementation.
    const walletConnect = provider as TronConnector & {
      provider: {
        session?: { sessionProperties?: Record<string, string> };
        request: (request: { method: string; params: unknown }, chain: string) => Promise<unknown>;
      };
    };
    if (!walletConnect.provider?.request) throw new Error("Reconnect a compatible TRON wallet.");
    const v1 = walletConnect.provider.session?.sessionProperties?.tron_method_version === "v1";
    signed = await walletConnect.provider.request({
      method: "tron_signTransaction",
      params: { address: from, transaction: v1 ? signingTransaction : { transaction: signingTransaction } },
    }, "tron:0x2b6653dc");
  } else if (provider.type === "INJECTED") {
    // In this SDK version tron_sendTransaction signs the supplied transaction
    // through the injected adapter; it does not broadcast it.
    signed = await provider.request({
      method: "tron_sendTransaction", params: { transaction: signingTransaction },
    });
  } else {
    throw new Error("This TRON wallet cannot sign a native transfer.");
  }

  const result = signed as { txID?: string; signature?: unknown } | null;
  if (
    !result || (result.txID && result.txID !== transaction.txID) ||
    !Array.isArray(result.signature) || result.signature.length === 0 ||
    !result.signature.every(signature => typeof signature === "string" && /^[a-f0-9]{130}$/i.test(signature))
  ) {
    throw new Error("The wallet did not return a valid signature for this TRON transaction.");
  }
  // Do not accept modified transfer fields from a signing response.
  const approved = { ...transaction, signature: result.signature as string[] };
  try {
    const broadcast = await client.trx.sendRawTransaction(approved);
    if (!broadcast.result) throw new WalletSubmissionUnknownError(transaction.txID);
  } catch {
    // A timeout may happen after a node accepts a transfer. Never tell a user
    // it failed and invite an immediate duplicate payment.
    throw new WalletSubmissionUnknownError(transaction.txID);
  }
  return transaction.txID;
}
