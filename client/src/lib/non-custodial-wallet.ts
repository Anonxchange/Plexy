// Polyfill for Node.js Buffer in browser
import { Buffer as BufferPolyfill } from "buffer";
globalThis.Buffer = globalThis.Buffer || BufferPolyfill;

import CryptoJS from "crypto-js";
import * as bip39 from "bip39";
import { ethers } from "ethers";

export interface NonCustodialWallet {
  id: string;
  chainId: string;
  address: string;
  walletType: string;
  encryptedPrivateKey: string;
  createdAt: string;
  isActive: boolean;
  isBackedUp: boolean;
}

const STORAGE_KEY = "pexly_non_custodial_wallets";

class NonCustodialWalletManager {
  /**
   * Generate a new non-custodial wallet with encrypted private key (stored in browser only)
   */
  async generateNonCustodialWallet(
    chainId: string = "ethereum",
    userPassword: string,
    supabase?: any,
    userId?: string
  ): Promise<{ wallet: NonCustodialWallet; mnemonicPhrase: string }> {
    // Generate mnemonic and derive wallet
    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // Create wallet from seed
    const wallet = ethers.HDNodeWallet.fromSeed(seed);
    const privateKey = wallet.privateKey;
    const address = wallet.address;
    
    // Encrypt private key with user password
    const encryptedPrivateKey = this.encryptPrivateKey(privateKey, userPassword);
    
    // Create wallet object (without sensitive data)
    const newWallet: NonCustodialWallet = {
      id: this.generateId(),
      chainId,
      address,
      walletType: "ethereum",
      encryptedPrivateKey, // Encrypted, safe to store
      createdAt: new Date().toISOString(),
      isActive: true,
      isBackedUp: false,
    };
    
    // Store in localStorage
    this.saveWalletsToStorage([...this.getWalletsFromStorage(), newWallet]);
    
    // Also save to Supabase if provided
    if (supabase && userId) {
      await this.saveWalletToSupabase(newWallet, supabase, userId);
    }
    
    return {
      wallet: newWallet,
      mnemonicPhrase: mnemonic,
    };
  }

  /**
   * Import existing non-custodial wallet and verify against expected address
   */
  async importAndVerifyWallet(
    importData: string,
    expectedAddress: string,
    chainId: string = "ethereum",
    userPassword: string,
    isMnemonic: boolean = false
  ): Promise<{ wallet: NonCustodialWallet }> {
    let privateKey: string;
    let address: string;

    try {
      if (isMnemonic) {
        const seed = await bip39.mnemonicToSeed(importData);
        const wallet = ethers.HDNodeWallet.fromSeed(seed);
        privateKey = wallet.privateKey;
        address = wallet.address;
      } else {
        const wallet = new ethers.Wallet(importData);
        privateKey = importData;
        address = wallet.address;
      }

      // Allow matching against any derived address if multiple exist (though ethers usually derived 1)
      // For now, we just verify the one we derived
      if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
        throw new Error(`Imported address ${address} does not match expected address ${expectedAddress}`);
      }

      const encryptedPrivateKey = this.encryptPrivateKey(privateKey, userPassword);
      
      const newWallet: NonCustodialWallet = {
        id: this.generateId(),
        chainId,
        address,
        walletType: "ethereum",
        encryptedPrivateKey,
        createdAt: new Date().toISOString(),
        isActive: true,
        isBackedUp: true,
      };
      
      this.saveWalletsToStorage([...this.getWalletsFromStorage(), newWallet]);
      return { wallet: newWallet };
    } catch (error) {
      throw error instanceof Error ? error : new Error("Failed to verify wallet");
    }
  }

  /**
   * Check if a wallet exists locally for a given address
   */
  hasLocalWallet(address: string): boolean {
    const wallets = this.getWalletsFromStorage();
    return wallets.some(w => w.address.toLowerCase() === address.toLowerCase());
  }

  /**
   * Get all non-custodial wallets from localStorage
   */
  getNonCustodialWallets(): NonCustodialWallet[] {
    return this.getWalletsFromStorage();
  }

  /**
   * Sign a transaction entirely client-side with encrypted private key
   * Private key never leaves the client
   */
  async signTransaction(
    walletId: string,
    transactionData: any,
    userPassword: string
  ): Promise<string> {
    const wallets = this.getWalletsFromStorage();
    const wallet = wallets.find(w => w.id === walletId);
    
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Decrypt private key (only in memory, temporarily)
    let privateKey: string;
    try {
      privateKey = this.decryptPrivateKey(wallet.encryptedPrivateKey, userPassword);
    } catch (error) {
      throw new Error("Invalid password or corrupted wallet data");
    }

    // Sign transaction client-side
    try {
      const signer = new ethers.Wallet(privateKey);
      
      // Create and sign the transaction
      const tx = {
        to: transactionData.to,
        value: ethers.parseEther(transactionData.amount.toString()),
        gasLimit: BigInt(21000),
        gasPrice: ethers.parseUnits("20", "gwei"),
        nonce: 0,
      };
      
      const signedTx = await signer.signTransaction(tx);
      
      // Clear private key from memory
      privateKey = "";
      
      return signedTx;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error}`);
    }
  }

  /**
   * Get wallet address by ID
   */
  getWalletAddress(walletId: string): string | null {
    const wallets = this.getWalletsFromStorage();
    const wallet = wallets.find(w => w.id === walletId);
    return wallet?.address || null;
  }

  /**
   * Mark a wallet as backed up
   */
  markWalletAsBackedUp(walletId: string): void {
    const wallets = this.getWalletsFromStorage();
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      wallet.isBackedUp = true;
      this.saveWalletsToStorage(wallets);
    }
  }

  /**
   * Delete a non-custodial wallet from localStorage
   */
  deleteWallet(walletId: string): void {
    const wallets = this.getWalletsFromStorage();
    const filtered = wallets.filter(w => w.id !== walletId);
    this.saveWalletsToStorage(filtered);
  }

  /**
   * Encrypt private key with user password
   */
  private encryptPrivateKey(privateKey: string, password: string): string {
    return CryptoJS.AES.encrypt(privateKey, password).toString();
  }

  /**
   * Decrypt private key (only in memory, temporarily)
   */
  private decryptPrivateKey(encryptedKey: string, password: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Save wallet to Supabase database
   */
  async saveWalletToSupabase(wallet: NonCustodialWallet, supabase: any, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_wallets')
        .insert({
          id: wallet.id,
          user_id: userId,
          chain_id: wallet.chainId,
          address: wallet.address,
          wallet_type: wallet.walletType,
          encrypted_private_key: wallet.encryptedPrivateKey,
          is_active: wallet.isActive ? 'true' : 'false',
          is_backed_up: wallet.isBackedUp ? 'true' : 'false',
        });
      
      if (error) throw error;
      console.log("Wallet saved to Supabase:", wallet.id);
    } catch (error) {
      console.error("Failed to save wallet to Supabase:", error);
      throw error;
    }
  }

  /**
   * Load wallets from Supabase database
   */
  async loadWalletsFromSupabase(supabase: any, userId: string): Promise<NonCustodialWallet[]> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        chainId: row.chain_id,
        address: row.address,
        walletType: row.wallet_type,
        encryptedPrivateKey: row.encrypted_private_key,
        createdAt: row.created_at,
        isActive: row.is_active === 'true',
        isBackedUp: row.is_backed_up === 'true',
      }));
    } catch (error) {
      console.error("Failed to load wallets from Supabase:", error);
      return [];
    }
  }

  /**
   * Get wallets from localStorage
   */
  private getWalletsFromStorage(): NonCustodialWallet[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to read wallets from storage:", error);
      return [];
    }
  }

  /**
   * Save wallets to localStorage
   */
  private saveWalletsToStorage(wallets: NonCustodialWallet[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
    } catch (error) {
      console.error("Failed to save wallets to storage:", error);
      throw new Error("Failed to save wallet to browser storage");
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const nonCustodialWalletManager = new NonCustodialWalletManager();
