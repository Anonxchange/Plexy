import { generateMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "@scure/bip32";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { base58 } from "@scure/base";
import { getValue, setValue } from "./ids";
import { devLog } from "./dev-logger";

// Local Signer Imports
import { getEVMAddress } from "./evmSigner";
import { getBitcoinAddress } from "./bitcoinSigner";
// Added deriveSolanaPrivateKey to the import below
import { getSolanaAddress, deriveSolanaPrivateKey } from "./solanaSigner";
import { getTronAddress } from "./tronSigner";
import {
  encryptVault,
  encryptVaultWithKey,
  decryptVault,
  EncryptedVault,
  DerivedVaultKey,
} from "./webCrypto";
import { runWithUnlockGate } from "./security/wallet-unlock-gate";

import { recordTransaction } from "./wallet-api";

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
  // Use ripemd160(sha256(publicKey)) for XRP account ID
  const accountId = ripemd160(sha256(publicKey));
  const payload = new Uint8Array(21);
  payload[0] = 0x00; // AccountID prefix
  payload.set(accountId, 1);
  
  // Double SHA256 for checksum
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const final = new Uint8Array(25);
  final.set(payload);
  final.set(checksum, 21);
  
  // Use XRP-specific base58 alphabet
  return base58EncodeWithAlphabet(final, XRP_ALPHABET);
}

/**
 * Base58 Encoder with custom alphabet
 */
function base58EncodeWithAlphabet(inputBytes: Uint8Array, alphabet: string): string {
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
  for (let i = 0; i < inputBytes.length && inputBytes[i] === 0; i++) result += alphabet[0];
  for (let i = digits.length - 1; i >= 0; i--) result += alphabet[digits[i]];
  return result;
}

export interface NonCustodialWallet {
  id: string;
  chainId: string;
  address: string;
  walletType: string;
  encryptedPrivateKey: string | EncryptedVault;
  encryptedMnemonic?: string | EncryptedVault;
  createdAt: string;
  isActive: boolean;
  isBackedUp: boolean;
  assetType?: string;
  baseChainWalletId?: string;
  balance?: number;
}

const STORAGE_KEY_PREFIX = "pexly_non_custodial_wallets";

/**
 * Normalises a vault field that may arrive from the DB as a JSON string.
 *
 * Supabase can return `encrypted_private_key` / `encrypted_mnemonic` as a plain
 * string when the column type is `text`, or when an older code path stored the
 * object via JSON.stringify. This helper tries to parse the string into an
 * EncryptedVault object so the rest of the decryption pipeline works correctly.
 *
 * If the value is already an object (jsonb column), it is returned as-is.
 * If the value is null/undefined, it is returned unchanged.
 */
function parseVaultField(value: any): any {
  if (!value || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

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
    existingMnemonic?: string,
    precomputedKey?: DerivedVaultKey
  ): Promise<{ wallet: NonCustodialWallet; mnemonicPhrase: string }> {
    if (!userId) throw new Error("userId is required");
    if (!userPassword) throw new Error("Password is required");

    const mnemonic = existingMnemonic || generateMnemonic(wordlist, 256);
    const seed = await mnemonicToSeed(mnemonic);
    const root = HDKey.fromMasterSeed(seed);
    
    let privateKey: string;
    let address: string;
    let walletType: string;

    if (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)" || chainId === "Bitcoin (Taproot)") {
      // Trust Wallet standard: Native SegWit (BIP84, bc1q...) only.
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
      // Fix: Derive address from public key properly using ripemd160(sha256(pub))
      address = deriveXrpAddress(account.publicKey!); 
      walletType = "xrp";
    } else if (["ethereum", "ETH", "Ethereum", "BNB", "BSC", "Binance Coin", "Tether", "Polygon", "Arbitrum", "Optimism", "Base", "Avalanche", "USDT", "USDC"].includes(chainId)) {
      address = await getEVMAddress(mnemonic);
      const account = root.derive("m/44'/60'/0'/0/0");
      privateKey = toHex(account.privateKey!);
      
      // Determine wallet type for internal tracking
      if (chainId === "BNB" || chainId === "BSC" || chainId === "Binance Coin") {
        walletType = "binance";
      } else if (chainId === "USDT" || chainId === "USDC") {
        walletType = "evm-token";
      } else {
        walletType = "ethereum";
      }
      
      // Ensure we explicitly set the assetType for tokens if needed
      const assetType = (chainId === "USDT" || chainId === "USDC") ? chainId : undefined;
      
      const encryptedPrivateKey = await this.encryptPrivateKey(privateKey, userPassword, precomputedKey);
      const encryptedMnemonic = await this.encryptPrivateKey(mnemonic, userPassword, precomputedKey);
      
      const newWallet: NonCustodialWallet = {
        id: crypto.randomUUID(),
        chainId,
        address,
        walletType,
        encryptedPrivateKey,
        encryptedMnemonic,
        createdAt: new Date().toISOString(),
        isActive: true,
        isBackedUp: false,
        assetType,
      };
      
      const wallets = await this.getWalletsFromStorage(userId);
      const updatedWallets = [...wallets, newWallet];
      await this.saveWalletsToStorage(updatedWallets, userId);

      if (supabase) {
        await this.saveWalletToSupabase(supabase, newWallet, userId);
      }
      
      return { wallet: newWallet, mnemonicPhrase: mnemonic };
    } else {
      address = await getEVMAddress(mnemonic);
      const account = root.derive("m/44'/60'/0'/0/0");
      privateKey = toHex(account.privateKey!);
      walletType = chainId.toLowerCase();
    }
    
    const encryptedPrivateKey = await this.encryptPrivateKey(privateKey, userPassword, precomputedKey);
    const encryptedMnemonic = await this.encryptPrivateKey(mnemonic, userPassword, precomputedKey);
    
    const newWallet: NonCustodialWallet = {
      id: crypto.randomUUID(),
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
        devLog.error("Failed to migrate legacy wallets:", e);
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
    return runWithUnlockGate(userId, () =>
      this.decryptPrivateKey(wallet.encryptedMnemonic!, password)
    );
  }

  public async loadWalletsFromSupabase(supabase: any, userId: string): Promise<NonCustodialWallet[]> {
    // Step 1: fetch non-sensitive metadata from the safe view (fast, no special privileges).
    const { data: safeData, error: safeError } = await supabase
      .from('user_wallets_safe')
      .select('id, chain_id, address, wallet_type, is_active, is_backed_up, created_at, base_chain_wallet_id')
      .eq('user_id', userId);

    if (safeError) {
      devLog.error("Error loading wallets from Supabase:", safeError);
      return [];
    }
    if (!safeData || safeData.length === 0) return [];

    // Step 2: fetch encrypted key blobs via the SECURITY DEFINER RPC.
    // The function enforces auth.uid() === p_user_id server-side before returning
    // anything — so only the owner ever receives their own encrypted material.
    // Decryption happens here in the browser with the user's password; the server
    // never sees plaintext keys (non-custodial guarantee is preserved).
    const { data: vaultData, error: vaultError } = await supabase
      .rpc('get_wallet_vault', { p_user_id: userId });

    if (vaultError) {
      devLog.warn("Could not load vault from Supabase (key material unavailable):", vaultError);
    }

    // Index vault rows by wallet id for O(1) lookup
    const vaultById = new Map<string, any>();
    (vaultData ?? []).forEach((v: any) => vaultById.set(v.id, v));

    const wallets: NonCustodialWallet[] = safeData.map((w: any) => {
      const vault = vaultById.get(w.id);
      return {
        id: w.id,
        chainId: w.chain_id,
        address: w.address,
        walletType: w.wallet_type,
        encryptedPrivateKey: vault ? parseVaultField(vault.encrypted_private_key) : undefined,
        encryptedMnemonic:   vault ? parseVaultField(vault.encrypted_mnemonic)    : undefined,
        isActive:    w.is_active    === 'true',
        isBackedUp:  w.is_backed_up === 'true',
        createdAt:   w.created_at,
        assetType:   undefined,
        baseChainWalletId: w.base_chain_wallet_id,
        balance: undefined,
      };
    });

    await this.saveWalletsToStorage(wallets, userId);
    return wallets;
  }

  public async saveWalletToSupabase(supabase: any, wallet: NonCustodialWallet, userId: string): Promise<void> {
    // Writes go through the save_wallet SECURITY DEFINER RPC which:
    //   • enforces auth.uid() === user_id before touching the table
    //   • validates the encrypted vault payload is non-empty
    //   • never overwrites created_at on updates
    const { error } = await supabase
      .rpc('save_wallet', {
        p_id:                    wallet.id,
        p_user_id:               userId,
        p_chain_id:              wallet.chainId,
        p_address:               wallet.address,
        p_wallet_type:           wallet.walletType,
        p_encrypted_private_key: typeof wallet.encryptedPrivateKey === 'string'
          ? wallet.encryptedPrivateKey
          : JSON.stringify(wallet.encryptedPrivateKey),
        p_encrypted_mnemonic:    wallet.encryptedMnemonic
          ? (typeof wallet.encryptedMnemonic === 'string'
              ? wallet.encryptedMnemonic
              : JSON.stringify(wallet.encryptedMnemonic))
          : null,
        p_is_active:             wallet.isActive    ? 'true' : 'false',
        p_is_backed_up:          wallet.isBackedUp  ? 'true' : 'false',
        p_asset_type:            wallet.assetType            ?? null,
        p_base_chain_wallet_id:  wallet.baseChainWalletId    ?? null,
        p_balance:               wallet.balance              ?? null,
        p_created_at:            wallet.createdAt,
      });

    if (error) {
      devLog.error("Error saving wallet via RPC:", error);
    }
  }

  private async saveWalletsToStorage(wallets: NonCustodialWallet[], userId: string): Promise<void> {
    await setValue('wallets', this.getStorageKey(userId), wallets);
  }

  private async encryptPrivateKey(
    data: string,
    password: string,
    precomputedKey?: DerivedVaultKey
  ): Promise<EncryptedVault> {
    return precomputedKey
      ? encryptVaultWithKey(data, precomputedKey)
      : encryptVault(data, password);
  }

  async decryptPrivateKey(
    vault: string | EncryptedVault,
    password: string,
    userId?: string
  ): Promise<string> {
    const inner = async (): Promise<string> => {
      if (typeof vault === "string") {
        // The vault arrived as a JSON string (e.g. text DB column or old serialisation path).
        // Try to parse it into an EncryptedVault object before giving up.
        const parsed = parseVaultField(vault);
        if (parsed && typeof parsed === "object" && "ciphertext" in parsed) {
          return decryptVault(parsed as EncryptedVault, password);
        }
        throw new Error("Legacy vault string found. Please migrate your wallet.");
      }
      return decryptVault(vault, password);
    };
    // When a userId is supplied, route the attempt through the server-side
    // brute-force gate (4+ failures → escalating lockout up to 24h).
    return userId ? runWithUnlockGate(userId, inner) : inner();
  }

  /**
   * Returns true if any wallet for this user still uses the legacy vault format
   * (deterministic salt — a cryptographic weakness). Call this after loading
   * wallets to decide whether to prompt migration.
   */
  async hasLegacyVaults(userId: string): Promise<boolean> {
    const { isLegacyVault } = await import("./webCrypto");
    const wallets = await this.getWalletsFromStorage(userId);
    return wallets.some(
      (w) => isLegacyVault(w.encryptedPrivateKey) || isLegacyVault(w.encryptedMnemonic)
    );
  }

  /**
   * Detects and migrates any legacy-format vaults for this user.
   * Requires the user's plaintext password (only available when the wallet is
   * unlocked). Upgraded vaults are persisted to both local storage and Supabase.
   *
   * Safe to call multiple times — wallets already in the modern format are skipped.
   */
  async migrateLegacyVaults(userId: string, password: string, supabase?: any): Promise<void> {
    const { isLegacyVault, migrateLegacyVault } = await import("./webCrypto");
    const wallets = await this.getWalletsFromStorage(userId);
    let anyMigrated = false;

    const upgraded = await Promise.all(
      wallets.map(async (wallet) => {
        const needsPrivKey = isLegacyVault(wallet.encryptedPrivateKey);
        const needsMnemonic = isLegacyVault(wallet.encryptedMnemonic);
        if (!needsPrivKey && !needsMnemonic) return wallet;

        try {
          const updatedWallet = { ...wallet };
          if (needsPrivKey) {
            updatedWallet.encryptedPrivateKey = await migrateLegacyVault(
              wallet.encryptedPrivateKey, password, userId
            );
          }
          if (needsMnemonic && wallet.encryptedMnemonic) {
            updatedWallet.encryptedMnemonic = await migrateLegacyVault(
              wallet.encryptedMnemonic, password, userId
            );
          }
          anyMigrated = true;
          return updatedWallet;
        } catch (e) {
          devLog.error(`Failed to migrate legacy vault for wallet ${wallet.id}:`, e);
          return wallet;
        }
      })
    );

    if (!anyMigrated) return;

    await this.saveWalletsToStorage(upgraded, userId);
    if (supabase) {
      await Promise.all(
        upgraded.map((w) => this.saveWalletToSupabase(supabase, w, userId))
      );
    }
  }
}

const managerInstance = new NonCustodialWalletManager();
export { managerInstance as nonCustodialWalletManager, managerInstance as walletManager };
