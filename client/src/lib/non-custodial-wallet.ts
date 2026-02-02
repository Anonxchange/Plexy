import { generateMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import * as btc from "@scure/btc-signer";
import { HDKey } from "@scure/bip32";
import { signBitcoinTransaction } from "./bitcoinSigner";
import { signSolanaTransaction } from "./solanaSigner";
import { signTronTransaction } from "./tronSigner";
import { deriveKey } from "./keyDerivation";
import { encryptAES, decryptAES } from "./webCrypto";

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer: Uint8Array): string {
  if (buffer.length === 0) return '';
  let digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
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
  for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) result += ALPHABET[0];
  for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]];
  return result;
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
    
    let privateKey: string;
    let address: string;
    let walletType = "ethereum";

    if (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)") {
      const root = HDKey.fromMasterSeed(seed);
      const account = root.derive("m/84'/0'/0'/0/0");
      const p2wpkh = btc.p2wpkh(account.publicKey!, btc.NETWORK);
      address = p2wpkh.address!;
      privateKey = Array.from(account.privateKey!).map(b => b.toString(16).padStart(2, '0')).join('');
      walletType = "bitcoin";
    } else if (chainId === "Solana") {
      const root = HDKey.fromMasterSeed(seed);
      const account = root.derive("m/44'/501'/0'/0'");
      address = base58Encode(account.publicKey!); 
      const privKey = new Uint8Array(64);
      privKey.set(account.privateKey!);
      privKey.set(account.publicKey!, 32);
      privateKey = base58Encode(privKey);
      walletType = "solana";
    } else if (chainId === "Tron (TRC-20)") {
      const root = HDKey.fromMasterSeed(seed);
      const account = root.derive("m/44'/195'/0'/0/0");
      address = "T" + base58Encode(account.publicKey!).slice(0, 33);
      privateKey = Array.from(account.privateKey!).map(b => b.toString(16).padStart(2, '0')).join('');
      walletType = "tron";
    } else if (chainId === "XRP") {
      const root = HDKey.fromMasterSeed(seed);
      const account = root.derive("m/44'/144'/0'/0/0");
      address = "r" + base58Encode(account.publicKey!).slice(0, 33);
      privateKey = Array.from(account.privateKey!).map(b => b.toString(16).padStart(2, '0')).join('');
      walletType = "xrp";
    } else if (chainId === "ethereum" || chainId === "ETH" || chainId === "Ethereum") {
      const root = HDKey.fromMasterSeed(seed);
      const account = root.derive("m/44'/60'/0'/0/0");
      privateKey = Array.from(account.privateKey!).map(b => b.toString(16).padStart(2, '0')).join('');
      address = "0x" + Array.from(account.publicKey!.slice(1, 21)).map(b => b.toString(16).padStart(2, '0')).join('');
      walletType = "ethereum";
    } else {
      // Default to Ethereum derivation for others if not specified
      const root = HDKey.fromMasterSeed(seed);
      const account = root.derive("m/44'/60'/0'/0/0");
      privateKey = Array.from(account.privateKey!).map(b => b.toString(16).padStart(2, '0')).join('');
      address = "0x" + Array.from(account.publicKey!.slice(1, 21)).map(b => b.toString(16).padStart(2, '0')).join('');
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
    
    const wallets = this.getWalletsFromStorage(userId);
    const updatedWallets = [...wallets, newWallet];
    this.saveWalletsToStorage(updatedWallets, userId);

    if (supabase) {
      await this.saveWalletToSupabase(supabase, newWallet, userId);
    }
    
    return { wallet: newWallet, mnemonicPhrase: mnemonic };
  }

  public getWalletsFromStorage(userId: string): NonCustodialWallet[] {
    const data = localStorage.getItem(this.getStorageKey(userId));
    return data ? JSON.parse(data) : [];
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
        isBackedUp: w.is_backed_up === 'true',
        createdAt: w.created_at,
      }));
      this.saveWalletsToStorage(wallets, userId);
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
      });

    if (error) {
      console.error("Error saving wallet to Supabase:", error);
    }
  }

  private saveWalletsToStorage(wallets: NonCustodialWallet[], userId: string): void {
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(wallets));
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
