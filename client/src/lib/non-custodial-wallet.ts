import { generateMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "@scure/bip32";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { getValue, setValue } from "./ids";
import { devLog } from "./dev-logger";
import { wipeBytes, wipeHDKey } from "./secureMemory";

// Local Signer Imports
import { getEVMAddress } from "./evmSigner";
import { getBitcoinAddress } from "./bitcoinSigner";
// Added deriveSolanaPrivateKey to the import below
import { getSolanaAddress, deriveSolanaPrivateKey } from "./solanaSigner";
import { getTronAddress } from "./tronSigner";
import {
  encryptVault,
  encryptVaultWithKey,
  EncryptedVault,
  DerivedVaultKey,
} from "./webCrypto";
import { callSigningWorker } from "@/hooks/use-signing-worker";
import { runWithUnlockGate } from "./security/wallet-unlock-gate";

// Constants for Encoding
const XRP_ALPHABET = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";

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

  /**
   * Generates a single-chain wallet on the MAIN THREAD.
   *
   * ⚠️  SECURITY NOTE — main-thread mnemonic:
   * The mnemonic is generated and handled as a plain JS string on the main
   * thread heap.  JS strings are immutable and cannot be zeroed.  The seed
   * (Uint8Array) and HDKey objects are wiped in the finally block, but the
   * mnemonic and private-key hex strings cannot be.
   *
   * For new call-sites prefer callSigningWorker("createSecureWallet") which
   * keeps the mnemonic entirely inside the worker thread and never exposes it
   * on the main thread.  This method is kept to support the legacy per-chain
   * generation flow in WalletSetupDialog.
   */
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

    // finally block guarantees seed + root are wiped on every exit path:
    // normal return, early return inside EVM branch, or any thrown exception.
    try {
      if (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)" || chainId === "Bitcoin (Taproot)") {
        address = await getBitcoinAddress(mnemonic);
        const account = root.derive("m/84'/0'/0'/0/0");
        privateKey = toHex(account.privateKey!);
        wipeHDKey(account);
        walletType = "bitcoin";
      } else if (chainId === "Solana") {
        address = await getSolanaAddress(mnemonic);
        const privKeyBytes = await deriveSolanaPrivateKey(mnemonic);
        if (!privKeyBytes) throw new Error("Failed to derive Solana private key");
        privateKey = toHex(privKeyBytes);
        wipeBytes(privKeyBytes);
        walletType = "solana";
      } else if (chainId === "Tron (TRC-20)") {
        address = await getTronAddress(mnemonic);
        const account = root.derive("m/44'/195'/0'/0/0");
        privateKey = toHex(account.privateKey!);
        wipeHDKey(account);
        walletType = "tron";
      } else if (chainId === "XRP") {
        const account = root.derive("m/44'/144'/0'/0/0");
        privateKey = toHex(account.privateKey!);
        address = deriveXrpAddress(account.publicKey!);
        wipeHDKey(account);
        walletType = "xrp";
      } else if (["ethereum", "ETH", "Ethereum", "BNB", "BSC", "Binance Coin", "Tether", "Polygon", "Arbitrum", "Optimism", "Base", "Avalanche", "USDT", "USDC"].includes(chainId)) {
        address = await getEVMAddress(mnemonic);
        const account = root.derive("m/44'/60'/0'/0/0");
        privateKey = toHex(account.privateKey!);
        wipeHDKey(account);

        if (chainId === "BNB" || chainId === "BSC" || chainId === "Binance Coin") {
          walletType = "binance";
        } else if (chainId === "USDT" || chainId === "USDC") {
          walletType = "evm-token";
        } else {
          walletType = "ethereum";
        }

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
        await this.saveWalletsToStorage([...wallets, newWallet], userId);
        if (supabase) await this.saveWalletToSupabase(supabase, newWallet, userId);

        return { wallet: newWallet, mnemonicPhrase: mnemonic };
      } else {
        address = await getEVMAddress(mnemonic);
        const account = root.derive("m/44'/60'/0'/0/0");
        privateKey = toHex(account.privateKey!);
        wipeHDKey(account);
        walletType = chainId.toLowerCase();
      }

      const encryptedPrivateKey = await this.encryptPrivateKey(privateKey!, userPassword, precomputedKey);
      const encryptedMnemonic = await this.encryptPrivateKey(mnemonic, userPassword, precomputedKey);

      const newWallet: NonCustodialWallet = {
        id: crypto.randomUUID(),
        chainId,
        address: address!,
        walletType: walletType!,
        encryptedPrivateKey,
        encryptedMnemonic,
        createdAt: new Date().toISOString(),
        isActive: true,
        isBackedUp: false,
      };

      const wallets = await this.getWalletsFromStorage(userId);
      await this.saveWalletsToStorage([...wallets, newWallet], userId);
      if (supabase) await this.saveWalletToSupabase(supabase, newWallet, userId);

      return { wallet: newWallet, mnemonicPhrase: mnemonic };
    } finally {
      wipeBytes(seed);
      wipeHDKey(root);
    }
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
    const { data, error } = await supabase
      .from('user_wallets')
      .select('id, user_id, chain_id, address, wallet_type, encrypted_private_key, encrypted_mnemonic, is_active, is_backed_up, created_at')
      .eq('user_id', userId);

    if (error) {
      devLog.error("Error loading wallets from Supabase:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    const wallets: NonCustodialWallet[] = data.map((w: any) => ({
      id:                   w.id,
      chainId:              w.chain_id,
      address:              w.address,
      walletType:           w.wallet_type,
      encryptedPrivateKey:  parseVaultField(w.encrypted_private_key),
      encryptedMnemonic:    parseVaultField(w.encrypted_mnemonic),
      isActive:             w.is_active    === 'true' || w.is_active    === true,
      isBackedUp:           w.is_backed_up === 'true' || w.is_backed_up === true,
      createdAt:            w.created_at,
    }));

    await this.saveWalletsToStorage(wallets, userId);
    return wallets;
  }

  public async saveWalletsToSupabase(supabase: any, wallets: NonCustodialWallet[], userId: string): Promise<void> {
    if (!wallets.length) return;
    const serialize = (v: string | EncryptedVault | undefined) =>
      v === undefined ? null : typeof v === 'string' ? v : JSON.stringify(v);

    const payload = wallets.map(w => ({
      id:                     w.id,
      chain_id:               w.chainId,
      address:                w.address,
      wallet_type:            w.walletType,
      encrypted_private_key:  serialize(w.encryptedPrivateKey),
      encrypted_mnemonic:     serialize(w.encryptedMnemonic),
      is_active:              w.isActive   ? 'true' : 'false',
      is_backed_up:           w.isBackedUp ? 'true' : 'false',
    }));

    const { error } = await supabase
      .from('user_wallets')
      .upsert(
        payload.map(w => ({ ...w, user_id: userId })),
        { onConflict: 'id' }
      );

    if (error) {
      devLog.error("Error batch-saving wallets:", error);
      throw error;
    }

    // Pin the ETH wallet address on the user profile so auth-context
    // can detect the wallet even when user_wallets is temporarily unavailable.
    const ethWallet = wallets.find(w =>
      w.chainId?.toLowerCase().includes('ethereum')
    );
    if (ethWallet?.address) {
      await supabase
        .from('user_profiles')
        .update({ wallet_address: ethWallet.address })
        .eq('id', userId);
    }
  }

  public async saveWalletToSupabase(supabase: any, wallet: NonCustodialWallet, userId: string): Promise<void> {
    const serialize = (v: string | EncryptedVault | undefined) =>
      v === undefined ? null : typeof v === 'string' ? v : JSON.stringify(v);

    const { error } = await supabase
      .from('user_wallets')
      .upsert(
        {
          id:                    wallet.id,
          user_id:               userId,
          chain_id:              wallet.chainId,
          address:               wallet.address,
          wallet_type:           wallet.walletType,
          encrypted_private_key: serialize(wallet.encryptedPrivateKey),
          encrypted_mnemonic:    serialize(wallet.encryptedMnemonic),
          is_active:             wallet.isActive   ? 'true' : 'false',
          is_backed_up:          wallet.isBackedUp ? 'true' : 'false',
        },
        { onConflict: 'id' }
      );

    if (error) {
      devLog.error("Error saving wallet:", error);
      throw error;
    }

    // Pin ETH address to user_profiles for cross-device wallet detection
    if (wallet.chainId?.toLowerCase().includes('ethereum') && wallet.address) {
      await supabase
        .from('user_profiles')
        .update({ wallet_address: wallet.address })
        .eq('id', userId);
    }
  }

  public async saveWalletsToStorage(wallets: NonCustodialWallet[], userId: string): Promise<void> {
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
          return callSigningWorker<string>("decryptVault", { vault: parsed, password });
        }
        throw new Error("Legacy vault string found. Please migrate your wallet.");
      }
      return callSigningWorker<string>("decryptVault", { vault, password });
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
    const { isLegacyVault } = await import("./webCrypto");
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
            updatedWallet.encryptedPrivateKey = await callSigningWorker<EncryptedVault>(
              "migrateLegacyVault", { legacyData: wallet.encryptedPrivateKey, password, userId, origin: window.location.origin }
            );
          }
          if (needsMnemonic && wallet.encryptedMnemonic) {
            updatedWallet.encryptedMnemonic = await callSigningWorker<EncryptedVault>(
              "migrateLegacyVault", { legacyData: wallet.encryptedMnemonic, password, userId, origin: window.location.origin }
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
