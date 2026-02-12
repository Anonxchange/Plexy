import { generateMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "@scure/bip32";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { base58 } from "@scure/base";
import { getValue, setValue } from "./ids";

// Local Signer Imports
import { getEVMAddress } from "./evmSigner";
import { getBitcoinAddress } from "./bitcoinSigner";
// Added deriveSolanaPrivateKey to the import below
import { getSolanaAddress, deriveSolanaPrivateKey } from "./solanaSigner";
import { getTronAddress } from "./tronSigner";
import { deriveKey } from "./keyDerivation";
import { encryptAES, decryptAES } from "./webCrypto";

// Constants for Encoding
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const XRP_ALPHABET = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";
const xrpCodec = {
  encode: (bytes: Uint8Array) => base58.encode(bytes),
  decode: (str: string) => base58.decode(str)
};

/**
 * 100% Buffer-free Base58 Encoder for general use
 */
function base58Encode(inputBytes: Uint8Array): string {
  if (inputBytes.length === 0) return '';
  let digits = [0];
  for (let i = 0; i < inputBytes.length; i++) {
    let carry = inputBytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let result = '';
  for (let i = 0; i < inputBytes.length && inputBytes[i] === 0; i++) result += ALPHABET[0];
  for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]];
  return result;
}

function toHex(uint8: Uint8Array): string {
  return Array.from(uint8)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const match = hex.match(/.{1,2}/g);
  return new Uint8Array(match ? match.map(byte => parseInt(byte, 16)) : []);
}

/**
 * Custom XRP Address Derivation using Uint8Array & noble-hashes
 */
function deriveXrpAddress(publicKey: Uint8Array): string {
  const accountId = ripemd160(sha256(publicKey));
  const payload = new Uint8Array(21);
  payload[0] = 0x00; 
  payload.set(accountId, 1);
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const final = new Uint8Array(25);
  final.set(payload);
  final.set(checksum, 21);
  return xrpCodec.encode(final);
}

export interface NonCustodialWallet {
  id: string;
  chainId: string;
  address: string;
  walletType: string;
  encryptedPrivateKey: string;
  encryptedMnemonic?: string;
  createdAt: string;
  isActive: boolean;
  isBackedUp: boolean;
  assetType?: string;
  baseChainWalletId?: string;
  balance?: number;
}

const STORAGE_KEY_PREFIX = "pexly_non_custodial_wallets";

class NonCustodialWalletManager {
  private getStorageKey(userId?: string): string {
    if (!userId) throw new Error("userId is required");
    return `${STORAGE_KEY_PREFIX}_${userId}`;
  }

  async generateNonCustodialWallet(
    chainId: string = "ethereum",
    userPassword: string,
    supabase?: any,
    userId?: string,
    existingMnemonic?: string
  ): Promise<{ wallet: NonCustodialWallet; mnemonicPhrase: string }> {
    if (!userId) throw new Error("userId is required");
    if (!userPassword) throw new Error("Password is required");

    const mnemonic = existingMnemonic || generateMnemonic(wordlist, 128);
    const seed = await mnemonicToSeed(mnemonic);
    const root = HDKey.fromMasterSeed(seed);
    
    let privateKey: string;
    let address: string;
    let walletType: string;

    if (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)") {
      address = await getBitcoinAddress(mnemonic);
      const account = root.derive("m/84'/0'/0'/0/0");
      privateKey = toHex(account.privateKey!);
      walletType = "bitcoin";
    } else if (chainId === "Solana") {
      // FIX: Use SLIP-0010 derivation instead of BIP32 HDKey
      address = await getSolanaAddress(mnemonic);
      const privKeyBytes = await deriveSolanaPrivateKey(mnemonic);
      
      if (!privKeyBytes) {
        throw new Error("Failed to derive Solana private key");
      }

      privateKey = toHex(privKeyBytes);
      walletType = "solana";
    } else if (chainId === "Tron (TRC-20)") {
      address = await getTronAddress(mnemonic);
      const account = root.derive("m/44'/195'/0'/0/0");
      privateKey = toHex(account.privateKey!);
      walletType = "tron";
    } else if (chainId === "XRP") {
      const account = root.derive("m/44'/144'/0'/0/0");
      privateKey = toHex(account.privateKey!);
      address = deriveXrpAddress(account.publicKey!); 
      walletType = "xrp";
    } else if (["ethereum", "ETH", "Ethereum", "BNB", "BSC", "Binance Coin", "Tether", "Polygon", "Arbitrum", "Optimism", "Base", "Avalanche"].includes(chainId)) {
      address = await getEVMAddress(mnemonic);
      const account = root.derive("m/44'/60'/0'/0/0");
      privateKey = toHex(account.privateKey!);
      walletType = (chainId === "BNB" || chainId === "BSC" || chainId === "Binance Coin") ? "binance" : "ethereum";
    } else {
      address = await getEVMAddress(mnemonic);
      const account = root.derive("m/44'/60'/0'/0/0");
      privateKey = toHex(account.privateKey!);
      walletType = chainId.toLowerCase();
    }
    
    const encryptedPrivateKey = await this.encryptPrivateKey(privateKey, userPassword, userId);
    const encryptedMnemonic = await this.encryptPrivateKey(mnemonic, userPassword, userId);
    
    const newWallet: NonCustodialWallet = {
      id: Math.random().toString(36).substring(7),
      chainId,
      address,
      walletType,
      encryptedPrivateKey,
      encryptedMnemonic,
      createdAt: new Date().toISOString(),
      isActive: true,
      isBackedUp: false,
    };
    
    const wallets = await this.getWalletsFromStorage(userId);
    const updatedWallets = [...wallets, newWallet];
    await this.saveWalletsToStorage(updatedWallets, userId);

    if (supabase) {
      await this.saveWalletToSupabase(supabase, newWallet, userId);
    }
    
    return { wallet: newWallet, mnemonicPhrase: mnemonic };
  }

  public async getWalletsFromStorage(userId: string): Promise<NonCustodialWallet[]> {
    const data = await getValue('wallets', this.getStorageKey(userId));
    if (data) return data;
    
    const legacyData = localStorage.getItem(this.getStorageKey(userId));
    if (legacyData) {
      try {
        const wallets = JSON.parse(legacyData);
        await this.saveWalletsToStorage(wallets, userId);
        localStorage.removeItem(this.getStorageKey(userId));
        return wallets;
      } catch (e) {
        console.error("Failed to migrate legacy wallets:", e);
      }
    }
    return [];
  }

  public async getNonCustodialWallets(userId: string): Promise<NonCustodialWallet[]> {
    return this.getWalletsFromStorage(userId);
  }

  public async getWalletMnemonic(walletId: string, password: string, userId: string): Promise<string | null> {
    const wallets = await this.getWalletsFromStorage(userId);
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet || !wallet.encryptedMnemonic) return null;
    return this.decryptPrivateKey(wallet.encryptedMnemonic, password, userId);
  }

  public async loadWalletsFromSupabase(supabase: any, userId: string): Promise<NonCustodialWallet[]> {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error loading wallets from Supabase:", error);
      return [];
    }

    if (data && data.length > 0) {
      const wallets: NonCustodialWallet[] = data.map((w: any) => ({
        id: w.id,
        chainId: w.chain_id,
        address: w.address,
        walletType: w.wallet_type,
        encryptedPrivateKey: w.encrypted_private_key,
        encryptedMnemonic: w.encrypted_mnemonic,
        isActive: w.is_active === 'true',
        isBacked_up: w.is_backed_up === 'true',
        createdAt: w.created_at,
        assetType: w.asset_type,
        baseChainWalletId: w.base_chain_wallet_id,
        balance: w.balance
      }));

      await this.saveWalletsToStorage(wallets, userId);
      return wallets;
    }

    return [];
  }

  public async saveWalletToSupabase(supabase: any, wallet: NonCustodialWallet, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_wallets')
      .upsert({
        id: wallet.id,
        user_id: userId,
        chain_id: wallet.chainId,
        address: wallet.address,
        wallet_type: wallet.walletType,
        encrypted_private_key: wallet.encryptedPrivateKey,
        encrypted_mnemonic: wallet.encryptedMnemonic,
        is_active: wallet.isActive ? 'true' : 'false',
        is_backed_up: wallet.isBackedUp ? 'true' : 'false',
        asset_type: wallet.assetType,
        base_chain_wallet_id: wallet.baseChainWalletId,
        balance: wallet.balance,
        created_at: wallet.createdAt
      });

    if (error) {
      console.error("Error saving wallet to Supabase:", error);
    }
  }

  private async saveWalletsToStorage(wallets: NonCustodialWallet[], userId: string): Promise<void> {
    await setValue('wallets', this.getStorageKey(userId), wallets);
  }

  private async encryptPrivateKey(data: string, password: string, userId: string): Promise<string> {
    const key = await deriveKey(password, userId);
    return encryptAES(data, key);
  }

  async decryptPrivateKey(encrypted: string, password: string, userId: string): Promise<string> {
    const key = await deriveKey(password, userId);
    return decryptAES(encrypted, key);
  }
}

const managerInstance = new NonCustodialWalletManager();
export { managerInstance as nonCustodialWalletManager, managerInstance as walletManager };