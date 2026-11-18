import { memo, useEffect, useState } from "react";
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider, useDisconnect } from "@reown/appkit/react";
import { useAppKitConnection, type Provider as SolanaProvider } from "@reown/appkit-adapter-solana/react";
import type { TronConnector } from "@reown/appkit-adapter-tron";
import { solana, tronMainnet } from "@reown/appkit/networks";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { address as bitcoinAddress, networks as bitcoinNetworks } from "bitcoinjs-lib";
import SatsWallet, { AddressPurpose } from "sats-connect";
import { solanaWalletNetwork, tronWalletNetwork } from "./reown-config";
import { transferUnits, type WalletAsset } from "./wallet-assets";
import { sendTronNative } from "./send-tron";
import type { ExtraNamespace, ExtraWalletContextValue } from "./extra-wallet-context";

function validateBitcoinAddress(address: string) {
  try { bitcoinAddress.toOutputScript(address, bitcoinNetworks.bitcoin); }
  catch { throw new Error("Use a valid Bitcoin mainnet payment address."); }
}

function ExtraWalletBridge({ onChange }: { onChange: (value: ExtraWalletContextValue) => void }) {
  const appKit = useAppKit();
  const solanaAccount = useAppKitAccount({ namespace: "solana" });
  const tronAccount = useAppKitAccount({ namespace: "tron" });
  const network = useAppKitNetwork();
  const { walletProvider: solanaProvider } = useAppKitProvider<SolanaProvider>("solana");
  const { walletProvider: tronProvider } = useAppKitProvider<TronConnector>("tron");
  const { connection } = useAppKitConnection();
  const { disconnect } = useDisconnect();
  const [btcAddress, setBtcAddress] = useState<string>();
  const solanaMainnet = solanaAccount.caipAddress?.startsWith(`${solana.caipNetworkId}:`);
  const tronMainnetConnected = tronAccount.caipAddress?.startsWith(`${tronMainnet.caipNetworkId}:`);
  const addresses: ExtraWalletContextValue["addresses"] = {
    bitcoin: btcAddress,
    solana: solanaAccount.isConnected && solanaMainnet ? solanaAccount.address : undefined,
    tron: tronAccount.isConnected && tronMainnetConnected ? tronAccount.address : undefined,
  };

  // Never continue displaying an address from a previously selected BTC
  // account or network. A new explicit connection is required after a change.
  useEffect(() => {
    if (!btcAddress) return;
    const clear = () => setBtcAddress(undefined);
    const removers = [
      SatsWallet.addListener({ eventName: "accountChange", cb: clear }),
      SatsWallet.addListener({ eventName: "networkChange", cb: clear }),
      SatsWallet.addListener({ eventName: "disconnect", cb: clear }),
    ];
    return () => removers.forEach(remove => remove());
  }, [btcAddress]);

  async function getBitcoinAccount() {
    const result = await SatsWallet.request("getAccounts", {
      purposes: [AddressPurpose.Payment], message: "Connect your Bitcoin payment wallet to Pexly.",
    });
    if (result.status === "error") throw new Error(result.error.message);
    const account = result.result.find(item => item.purpose === AddressPurpose.Payment);
    if (!account) throw new Error("The wallet did not provide a Bitcoin payment address.");
    validateBitcoinAddress(account.address);
    return account.address;
  }

  async function connect(namespace: ExtraNamespace) {
    if (namespace === "bitcoin") { setBtcAddress(await getBitcoinAccount()); return; }
    if (namespace === "solana" && solanaAccount.isConnected) {
      await network.switchNetwork(solanaWalletNetwork);
      return;
    }
    if (namespace === "tron" && tronAccount.isConnected) {
      await network.switchNetwork(tronWalletNetwork);
      return;
    }
    await appKit.open({ view: "Connect", namespace });
  }

  async function readBalance(asset: WalletAsset, signal?: AbortSignal) {
    if (!asset.address) throw new Error("Connect a wallet first.");
    if (asset.namespace === "solana") {
      if (!connection) throw new Error("Solana connection is unavailable.");
      return (await connection.getBalance(new PublicKey(asset.address))) / 1e9;
    }
    if (asset.namespace === "bitcoin") {
      const response = await fetch(`https://mempool.space/api/address/${encodeURIComponent(asset.address)}`, { signal });
      if (!response.ok) throw new Error("Bitcoin balance service is unavailable.");
      const data = await response.json();
      const chain = data.chain_stats;
      const pending = data.mempool_stats;
      if (![chain?.funded_txo_sum, chain?.spent_txo_sum, pending?.funded_txo_sum, pending?.spent_txo_sum].every(Number.isFinite)) {
        throw new Error("Bitcoin balance response was invalid.");
      }
      return (chain.funded_txo_sum - chain.spent_txo_sum + pending.funded_txo_sum - pending.spent_txo_sum) / 1e8;
    }
    const response = await fetch("https://api.trongrid.io/wallet/getaccount", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal,
      body: JSON.stringify({ address: asset.address, visible: true }),
    });
    if (!response.ok) throw new Error("TRON balance service is unavailable.");
    const data = await response.json();
    if (data.Error || data.error || data.success === false) throw new Error("TRON balance service rejected the request.");
    // An empty object represents a valid address not yet activated on TRON.
    if (Object.keys(data).length === 0) return 0;
    if (data.balance != null && !Number.isFinite(data.balance)) throw new Error("TRON balance response was invalid.");
    if (!data.address) throw new Error("TRON account response was invalid.");
    return (data.balance ?? 0) / 1e6;
  }

  async function send(asset: WalletAsset, to: string, amount: string) {
    const from = asset.namespace === "eip155" ? undefined : addresses[asset.namespace];
    if (!from || from !== asset.address) throw new Error("Your wallet account changed. Reconnect and review the transfer.");
    const units = transferUnits(amount, asset.decimals);
    if (asset.namespace === "bitcoin") {
      validateBitcoinAddress(to);
      const current = await getBitcoinAccount();
      if (current !== from) { setBtcAddress(undefined); throw new Error("Bitcoin account changed. Reconnect before sending."); }
      if (units > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("The amount is too large.");
      const result = await SatsWallet.request("sendTransfer", { recipients: [{ address: to, amount: Number(units) }] });
      if (result.status === "error") throw new Error(result.error.message);
      if (!/^[a-f0-9]{64}$/i.test(result.result.txid)) throw new Error("The wallet did not return a valid Bitcoin transaction ID.");
      return result.result.txid;
    }
    if (asset.namespace === "solana") {
      if (!solanaProvider || !connection || !solanaMainnet) throw new Error("Connect a Solana mainnet wallet.");
      const destination = new PublicKey(to);
      const latest = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: new PublicKey(from), recentBlockhash: latest.blockhash,
      }).add(SystemProgram.transfer({ fromPubkey: new PublicKey(from), toPubkey: destination, lamports: units }));
      const hash = await solanaProvider.sendTransaction(transaction, connection);
      if (!hash) throw new Error("The wallet did not return a Solana transaction ID.");
      return hash;
    }
    // TRON uses Base58Check like Bitcoin, but with its own 0x41 prefix.
    try {
      if (bitcoinAddress.fromBase58Check(to).version !== 0x41) throw new Error("Wrong address network");
    } catch { throw new Error("Enter a valid TRON address."); }
    if (!tronProvider || !tronMainnetConnected) throw new Error("Connect a TRON mainnet wallet.");
    if (units > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("The amount is too large.");
    return sendTronNative(tronProvider, from, to, units);
  }

  const value: ExtraWalletContextValue = {
    loading: false,
    addresses, connect, readBalance, send,
    disconnect: async () => {
      await Promise.all([
        ...(btcAddress ? [SatsWallet.disconnect().then(() => setBtcAddress(undefined))] : []),
        ...(solanaAccount.isConnected ? [disconnect({ namespace: "solana" })] : []),
        ...(tronAccount.isConnected ? [disconnect({ namespace: "tron" })] : []),
      ]);
    },
  };
  useEffect(() => { onChange(value); });
  return null;
}
export const ExtraWalletRuntime = memo(ExtraWalletBridge);
