// Polyfill for Node.js Buffer in browser
import { Buffer as BufferPolyfill } from "buffer";
globalThis.Buffer = globalThis.Buffer || BufferPolyfill;

import CryptoJS from "crypto-js";
import * as bip39 from "bip39";
import { ethers } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import { signBitcoinTransaction } from "./bitcoinSigner";
import { signEVMTransaction } from "./evmSigner";
import { signSolanaTransaction } from "./solanaSigner";
import { signTronTransaction } from "./tronSigner";

import { deriveKey } from "./keyDerivation";

const bip32 = BIP32Factory(ecc);

// Base58 alphabet
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
  for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
    result += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += ALPHABET[digits[i]];
  }
  
  return result;
}

export interface NonCustodialWallet {
  id: string;
  chainId: string;
  address: string;
  walletType: string;
  encryptedPrivateKey: string;
  encryptedMnemonic?: string; // Store encrypted seed phrase for recovery
  createdAt: string;
  isActive: boolean;
  isBackedUp: boolean;
  assetType?: string; // 'native' for native coins, 'stablecoin' for USDT/USDC
  baseChainWalletId?: string; // Reference to parent native chain wallet for stablecoins
  balance?: number;
}

const STORAGE_KEY_PREFIX = "pexly_non_custodial_wallets";

class NonCustodialWalletManager {
  /**
   * Get user-specific storage key
   */
  private getStorageKey(userId?: string): string {
    if (!userId) {
      throw new Error("userId is required for wallet operations");
    }
    return `${STORAGE_KEY_PREFIX}_${userId}`;
  }

  /**
   * Generate a new non-custodial wallet with encrypted private key (stored in browser only)
   * Requires a password for wallet security
   */
  async generateNonCustodialWallet(
    chainId: string = "ethereum",
    userPassword: string, // Password required for wallet encryption
    supabase?: any,
    userId?: string,
    existingMnemonic?: string
  ): Promise<{ wallet: NonCustodialWallet; mnemonicPhrase: string }> {
    if (!userId) {
      throw new Error("userId is required to generate wallet");
    }
    
    if (!userPassword || userPassword.trim() === "") {
      throw new Error("Password is required to generate a wallet");
    }

    // Use existing mnemonic if provided, otherwise generate new
    const mnemonic = existingMnemonic || bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    let privateKey: string;
    let address: string;
    let walletType = "ethereum";

    if (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)") {
      const root = bip32.fromSeed(Buffer.from(seed));
      const account = root.derivePath("m/84'/0'/0'/0/0");
      const { address: btcAddress } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(account.publicKey),
        network: bitcoin.networks.bitcoin,
      });
      if (!btcAddress) throw new Error("Failed to generate Bitcoin address");
      address = btcAddress;
      privateKey = account.toWIF();
      walletType = "bitcoin";
    } else if (chainId === "Solana") {
      // Solana uses Ed25519. Path: m/44'/501'/0'/0'
      const root = bip32.fromSeed(seed);
      const account = root.derivePath("m/44'/501'/0'/0'");
      // Proper Base58 encoding for Solana (using ALPHABET defined in file)
      address = base58Encode(account.publicKey); 
      privateKey = base58Encode(Buffer.concat([account.privateKey!, account.publicKey]));
      walletType = "solana";
    } else if (chainId === "Tron (TRC-20)") {
      // Tron uses BIP44 path m/44'/195'/0'/0/0
      const root = bip32.fromSeed(seed);
      const account = root.derivePath("m/44'/195'/0'/0/0");
      
      // Tron address derivation: Keccak256(PubKey) -> Last 20 bytes -> Base58Check with 0x41 prefix
      const publicKey = account.publicKey.slice(1); // Uncompressed
      const hash = CryptoJS.SHA3(CryptoJS.enc.Hex.parse(Buffer.from(publicKey).toString('hex')), { outputLength: 256 }).toString();
      const addressBytes = Buffer.from(hash.slice(-40), 'hex');
      
      const versioned = Buffer.concat([Buffer.from([0x41]), addressBytes]);
      const checksum = Buffer.from(CryptoJS.SHA256(CryptoJS.SHA256(CryptoJS.enc.Hex.parse(versioned.toString('hex'))).toString()).toString(), 'hex').slice(0, 4);
      address = base58Encode(Buffer.concat([versioned, checksum]));
      
      privateKey = account.privateKey!.toString('hex');
      walletType = "tron";
    } else if (chainId === "XRP") {
      // XRP uses m/44'/144'/0'/0/0
      const root = bip32.fromSeed(seed);
      const account = root.derivePath("m/44'/144'/0'/0/0");
      
      // XRP address: SHA256 then RIPEMD160 of public key -> Base58Check with 0x00 prefix
      const sha256 = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(Buffer.from(account.publicKey).toString('hex'))).toString();
      const hash160 = CryptoJS.RIPEMD160(CryptoJS.enc.Hex.parse(sha256)).toString();
      
      // Standard XRP Base58 alphabet for address derivation
      const XRP_ALPHABET = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxy';
      const xrpBase58Encode = (buffer: Uint8Array): string => {
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
        for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) result += XRP_ALPHABET[0];
        for (let i = digits.length - 1; i >= 0; i--) result += XRP_ALPHABET[digits[i]];
        return result;
      };

      const versioned = Buffer.concat([Buffer.from([0x00]), Buffer.from(hash160, 'hex')]);
      const checksum = Buffer.from(CryptoJS.SHA256(CryptoJS.SHA256(CryptoJS.enc.Hex.parse(versioned.toString('hex'))).toString()).toString(), 'hex').slice(0, 4);
      
      address = xrpBase58Encode(Buffer.concat([versioned, checksum]));
      privateKey = account.privateKey!.toString('hex');
      walletType = "xrp";
    } else {
      // Default to Ethereum (BNB, ETH, Polygon, Arbitrum, Base, etc)
      const hdNode = ethers.HDNodeWallet.fromSeed(seed);
      const derivedNode = hdNode.derivePath("m/44'/60'/0'/0/0");
      privateKey = derivedNode.privateKey;
      address = derivedNode.address;
    }
    
    // Encrypt private key and mnemonic with user password using KDF
    const encryptedPrivateKey = await this.encryptPrivateKey(privateKey, userPassword, userId);
    const encryptedMnemonic = await this.encryptPrivateKey(mnemonic, userPassword, userId);
    
    // Create wallet object (without sensitive data)
    const newWallet: NonCustodialWallet = {
      id: this.generateId(),
      chainId,
      address,
      walletType: (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)") ? "bitcoin" : 
                  (chainId === "Solana") ? "solana" :
                  (chainId === "Tron (TRC-20)") ? "tron" : "ethereum",
      encryptedPrivateKey, // Encrypted with KDF-derived key, safe for local storage
      encryptedMnemonic, // Encrypted seed phrase for recovery
      createdAt: new Date().toISOString(),
      isActive: true,
      isBackedUp: false,
    };
    
    // Store in localStorage with user-specific key
    const walletsToStore = [...this.getWalletsFromStorage(userId), newWallet];
    
    // Auto-generate stablecoin wallet entries for supported chains
    if (chainId !== 'Bitcoin (SegWit)') {
      const stablecoins = ['USDT', 'USDC'];
      stablecoins.forEach(symbol => {
        const stablecoinWallet: NonCustodialWallet = {
          id: `${newWallet.id}_${symbol}`,
          chainId: `${symbol}-${chainId}`,
          address, // Same address as parent chain
          walletType: newWallet.walletType,
          encryptedPrivateKey: newWallet.encryptedPrivateKey, // Same key as parent
          createdAt: newWallet.createdAt,
          isActive: true,
          isBackedUp: false,
          assetType: 'stablecoin',
          baseChainWalletId: newWallet.id,
        };
        walletsToStore.push(stablecoinWallet);
      });

      // Also ensure Optimism, Polygon, and BNB use the same address as Ethereum
      const evmChains = ['Optimism', 'Polygon', 'Arbitrum', 'Base', 'Binance Smart Chain (BEP-20)'];
      evmChains.forEach(chain => {
        if (chainId !== chain && chainId === 'ethereum') {
          const sidechainWallet: NonCustodialWallet = {
            id: `${newWallet.id}_${chain}`,
            chainId: chain,
            address, // Same EVM address
            walletType: 'ethereum',
            encryptedPrivateKey: newWallet.encryptedPrivateKey,
            createdAt: newWallet.createdAt,
            isActive: true,
            isBackedUp: false,
            baseChainWalletId: newWallet.id,
          };
          walletsToStore.push(sidechainWallet);
        }
      });
    }
    
    this.saveWalletsToStorage(walletsToStore, userId);
    
    // Also save to Supabase if provided
    if (supabase && userId) {
      await this.saveWalletToSupabase(newWallet, supabase, userId);
      // Also save stablecoins to Supabase
      if (chainId !== 'Bitcoin (SegWit)') {
        const stablecoins = ['USDT', 'USDC'];
        for (const symbol of stablecoins) {
          const stablecoinWallet: NonCustodialWallet = {
            id: `${newWallet.id}_${symbol}`,
            chainId: `${symbol}-${chainId}`,
            address,
            walletType: newWallet.walletType || ((chainId === "bitcoin" || chainId === "Bitcoin (SegWit)") ? "bitcoin" : 
                        (chainId === "Solana") ? "solana" :
                        (chainId === "Tron (TRC-20)") ? "tron" : "ethereum"),
            encryptedPrivateKey: newWallet.encryptedPrivateKey,
            createdAt: newWallet.createdAt,
            isActive: true,
            isBackedUp: false,
            assetType: 'stablecoin',
            baseChainWalletId: newWallet.id,
          };
          await this.saveWalletToSupabase(stablecoinWallet, supabase, userId);
        }
      }
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
    isMnemonic: boolean = false,
    userId?: string
  ): Promise<{ wallet: NonCustodialWallet }> {
    if (!userId) {
      throw new Error("userId is required to import wallet");
    }

    let privateKey: string;
    let address: string;

    try {
      if (isMnemonic) {
        const seed = await bip39.mnemonicToSeed(importData);
        if (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)") {
          const root = bip32.fromSeed(Buffer.from(seed));
          const account = root.derivePath("m/84'/0'/0'/0/0");
          const { address: btcAddress } = bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(account.publicKey),
            network: bitcoin.networks.bitcoin,
          });
          if (!btcAddress) throw new Error("Failed to derive Bitcoin address");
          address = btcAddress;
          privateKey = account.toWIF();
        } else if (chainId === "Solana") {
          const root = bip32.fromSeed(seed);
          const account = root.derivePath("m/44'/501'/0'/0'");
          address = base58Encode(account.publicKey);
          privateKey = account.toWIF();
        } else if (chainId === "Tron (TRC-20)") {
          const root = bip32.fromSeed(seed);
          const account = root.derivePath("m/44'/195'/0'/0/0");
          const publicKey = account.publicKey.slice(1);
          address = "T" + base58Encode(publicKey).slice(0, 33);
          privateKey = account.toWIF();
        } else {
          const hdNode = ethers.HDNodeWallet.fromSeed(seed);
          const derivedNode = hdNode.derivePath("m/44'/60'/0'/0/0");
          privateKey = derivedNode.privateKey;
          address = derivedNode.address;
        }
      } else {
        if (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)") {
          const ECPair = ECPairFactory(ecc);
          const keyPair = ECPair.fromWIF(importData);
          const { address: btcAddress } = bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(keyPair.publicKey),
            network: bitcoin.networks.bitcoin,
          });
          if (!btcAddress) throw new Error("Failed to derive Bitcoin address from WIF");
          address = btcAddress;
          privateKey = importData;
        } else {
          const wallet = new ethers.Wallet(importData);
          privateKey = importData;
          address = wallet.address;
        }
      }

      // Allow matching against any derived address if multiple exist (though ethers usually derived 1)
      // For now, we just verify the one we derived
      if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
        throw new Error(`Imported address ${address} does not match expected address ${expectedAddress}`);
      }

      const encryptedPrivateKey = await this.encryptPrivateKey(privateKey, userPassword, userId);
      const encryptedMnemonic = isMnemonic ? await this.encryptPrivateKey(importData, userPassword, userId) : undefined;
      
      const newWallet: NonCustodialWallet = {
        id: this.generateId(),
        chainId,
        address,
        walletType: (chainId === "bitcoin" || chainId === "Bitcoin (SegWit)") ? "bitcoin" : 
                    (chainId === "Solana") ? "solana" :
                    (chainId === "Tron (TRC-20)") ? "tron" : "ethereum",
        encryptedPrivateKey,
        encryptedMnemonic,
        createdAt: new Date().toISOString(),
        isActive: true,
        isBackedUp: true,
      };
      
      this.saveWalletsToStorage([...this.getWalletsFromStorage(userId), newWallet], userId);
      return { wallet: newWallet };
    } catch (error) {
      throw error instanceof Error ? error : new Error("Failed to verify wallet");
    }
  }

  /**
   * Check if a wallet exists locally for a given address
   */
  hasLocalWallet(address: string, userId?: string): boolean {
    if (!userId) {
      throw new Error("userId is required to check for wallets");
    }
    const wallets = this.getWalletsFromStorage(userId);
    return wallets.some(w => w.address.toLowerCase() === address.toLowerCase());
  }

  /**
   * Get all non-custodial wallets from localStorage
   */
  getNonCustodialWallets(userId?: string): NonCustodialWallet[] {
    if (!userId) {
      throw new Error("userId is required to fetch wallets");
    }
    return this.getWalletsFromStorage(userId);
  }

  /**
   * Sign a transaction entirely client-side with encrypted private key
   * Private key never leaves the client
   * Requires password for wallet security
   */
  async signTransaction(
    walletId: string,
    transactionData: any,
    userPassword: string, // Password required for wallet access
    userId?: string
  ): Promise<string> {
    if (!userId) {
      throw new Error("userId is required to sign transaction");
    }
    
    if (!userPassword || userPassword.trim() === "") {
      throw new Error("Password is required to sign transactions");
    }
    
    const wallets = this.getWalletsFromStorage(userId);
    const wallet = wallets.find(w => w.id === walletId);
    
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Decrypt private key (only in memory, temporarily)
    let privateKey: string;
    try {
      privateKey = await this.decryptPrivateKey(wallet.encryptedPrivateKey, userPassword, userId);
    } catch (error) {
      throw new Error("Invalid password or corrupted wallet data");
    }

    // Validate private key format
    if (!privateKey || privateKey.length === 0) {
      throw new Error("Invalid private key: empty");
    }
    
    // Ensure private key has 0x prefix if it doesn't (skip for Bitcoin)
    if (wallet.walletType !== "bitcoin" && wallet.walletType !== "tron" && wallet.walletType !== "solana" && !privateKey.startsWith("0x")) {
      privateKey = "0x" + privateKey;
    }

    // Sign transaction client-side
    try {
      if (wallet.walletType === "bitcoin") {
        // Bitcoin transaction signing using the new dedicated signer
        const mnemonic = await this.getWalletMnemonic(walletId, userPassword, userId);
        if (mnemonic) {
          const bitcoinSignedTx = await signBitcoinTransaction(mnemonic, transactionData);
          privateKey = "";
          return bitcoinSignedTx.signedTx;
        } else {
          // Fallback to WIF signing if no mnemonic (legacy imported wallets)
          const decryptedWIF = await this.decryptPrivateKey(wallet.encryptedPrivateKey, userPassword, userId);
          const signedHex = await this.signBitcoinTransactionDirect(decryptedWIF, transactionData);
          privateKey = "";
          return signedHex;
        }
      }

      if (wallet.walletType === "ethereum") {
        const mnemonic = await this.getWalletMnemonic(walletId, userPassword, userId);
        if (mnemonic) {
          const evmSignedTx = await signEVMTransaction(mnemonic, transactionData);
          privateKey = "";
          return evmSignedTx.signedTx;
        }
      }

      if (wallet.walletType === "tron") {
        const mnemonic = await this.getWalletMnemonic(walletId, userPassword, userId);
        if (mnemonic) {
          const tronSignedTx = await signTronTransaction(mnemonic, transactionData);
          privateKey = "";
          return typeof tronSignedTx.signedTx === 'string' ? tronSignedTx.signedTx : JSON.stringify(tronSignedTx.signedTx);
        }
      }

      if (wallet.walletType === "solana") {
        const mnemonic = await this.getWalletMnemonic(walletId, userPassword, userId);
        if (mnemonic) {
          const solanaSignedTx = await signSolanaTransaction(mnemonic, transactionData);
          privateKey = "";
          return solanaSignedTx.signedTx;
        }
      }

      // Default Ethereum/EVM signing fallback
      let signer: ethers.Wallet;
      try {
        signer = new ethers.Wallet(privateKey);
      } catch (walletError) {
        throw new Error(`Invalid private key format: ${walletError}`);
      }
      
      // Create and sign the transaction
      const tx = {
        to: transactionData.to,
        value: ethers.parseEther(transactionData.value || "0"),
        data: transactionData.data || "0x",
        gasLimit: BigInt(transactionData.gasLimit || 300000),
        gasPrice: ethers.parseUnits("20", "gwei"),
        nonce: 0, // In production, get real nonce
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
  getWalletAddress(walletId: string, userId?: string): string | null {
    if (!userId) {
      throw new Error("userId is required to get wallet address");
    }
    const wallets = this.getWalletsFromStorage(userId);
    const wallet = wallets.find(w => w.id === walletId);
    return wallet?.address || null;
  }

  /**
   * Get decrypted mnemonic for a wallet
   */
  async getWalletMnemonic(walletId: string, password: string, userId?: string): Promise<string | null> {
    if (!userId) {
      throw new Error("userId is required to get wallet mnemonic");
    }
    const wallets = this.getWalletsFromStorage(userId);
    const wallet = wallets.find(w => w.id === walletId);
    
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    
    if (!wallet.encryptedMnemonic) {
      throw new Error("This wallet does not have a recovery phrase stored. You may need to regenerate the wallet.");
    }
    
    try {
      const decrypted = await this.decryptPrivateKey(wallet.encryptedMnemonic, password, userId);
      // Check if decryption resulted in valid data
      if (!decrypted || decrypted.trim() === '') {
        throw new Error("Decrypted phrase is empty - password may be incorrect");
      }
      return decrypted;
    } catch (error: any) {
      console.error("Failed to decrypt mnemonic:", error);
      throw new Error(`Failed to decrypt: ${error.message || 'Invalid password'}`);
    }
  }

  /**
   * Mark a wallet as backed up
   */
  markWalletAsBackedUp(walletId: string, userId?: string): void {
    if (!userId) {
      throw new Error("userId is required to mark wallet as backed up");
    }
    const wallets = this.getWalletsFromStorage(userId);
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      wallet.isBackedUp = true;
      this.saveWalletsToStorage(wallets, userId);
    }
  }

  /**
   * Delete a non-custodial wallet from localStorage
   */
  deleteWallet(walletId: string, userId?: string): void {
    if (!userId) {
      throw new Error("userId is required to delete wallet");
    }
    const wallets = this.getWalletsFromStorage(userId);
    const filtered = wallets.filter(w => w.id !== walletId);
    this.saveWalletsToStorage(filtered, userId);
  }

  /**
   * Encrypt private key with user password using scrypt KDF
   */
  private async encryptPrivateKey(privateKey: string, password: string, userId: string): Promise<string> {
    const key = await deriveKey(password, userId);
    return CryptoJS.AES.encrypt(privateKey, key).toString();
  }

  /**
   * Decrypt private key with user password using scrypt KDF
   */
  private async decryptPrivateKey(encryptedKey: string, password: string, userId: string): Promise<string> {
    try {
      const key = await deriveKey(password, userId);
      const bytes = CryptoJS.AES.decrypt(encryptedKey, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted || decrypted.trim() === "") {
        throw new Error("Decryption returned empty string");
      }
      
      return decrypted;
    } catch (error: any) {
      console.error("Decryption error details:", error);
      throw new Error("Invalid password. Please enter the correct password for your non-custodial wallet.");
    }
  }

  /**
   * Sign a Bitcoin transaction (Legacy/Direct WIF)
   */
  private async signBitcoinTransactionDirect(privateKeyWIF: string, transactionData: any): Promise<string> {
    try {
      const ECPair = ECPairFactory(ecc);
      const keyPair = ECPair.fromWIF(privateKeyWIF, bitcoin.networks.bitcoin);
      const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

      // Parse transaction data
      const inputs = transactionData.inputs || [];
      const outputs = transactionData.outputs || [];

      if (inputs.length === 0 || outputs.length === 0) {
        throw new Error("Bitcoin transaction requires inputs and outputs");
      }

      // Add inputs
      for (const input of inputs) {
        psbt.addInput({
          hash: input.txid,
          index: input.vout,
          nonWitnessUtxo: Buffer.from(input.rawTx || '', 'hex'),
        });
      }

      // Add outputs
      for (const output of outputs) {
        psbt.addOutput({
          address: output.address,
          value: Number(output.value),
        });
      }

      // Sign inputs
      for (let i = 0; i < inputs.length; i++) {
        psbt.signInput(i, keyPair);
      }

      psbt.finalizeAllInputs();
      return psbt.extractTransaction().toHex();
    } catch (error) {
      throw new Error(`Bitcoin transaction signing failed: ${error}`);
    }
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
          encrypted_mnemonic: wallet.encryptedMnemonic || null,
          is_active: wallet.isActive ? 'true' : 'false',
          is_backed_up: wallet.isBackedUp ? 'true' : 'false',
        });
      
      if (error) throw error;
      // console.log("Wallet saved to Supabase:", wallet.id);
    } catch (error) {
      console.error("Failed to save wallet to Supabase:", error);
      throw error;
    }
  }

  /**
   * Load wallets from Supabase database and sync to localStorage
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

      const wallets = data.map((row: any) => ({
        id: row.id,
        chainId: row.chain_id,
        address: row.address,
        walletType: row.wallet_type,
        encryptedPrivateKey: row.encrypted_private_key,
        encryptedMnemonic: row.encrypted_mnemonic || undefined,
        createdAt: row.created_at,
        isActive: row.is_active === 'true',
        isBackedUp: row.is_backed_up === 'true',
      }));

      // Sync loaded wallets to localStorage so they're recognized by the app
      this.saveWalletsToStorage(wallets, userId);
    if (import.meta.env.DEV) {
      // Silenced in DEV to avoid console spam
    } else {
      console.log("[WalletManager] Synced wallets from Supabase to localStorage:", wallets.length);
    }

      return wallets;
    } catch (error) {
      console.error("Failed to load wallets from Supabase:", error);
      return [];
    }
  }

  /**
   * Update wallet balance
   */
  public updateWalletBalance(userId: string, walletId: string, balance: number): void {
    const wallets = this.getWalletsFromStorage(userId);
    const walletIndex = wallets.findIndex(w => w.id === walletId);
    if (walletIndex !== -1) {
      wallets[walletIndex].balance = balance;
      this.saveWalletsToStorage(wallets, userId);
    }
  }

  /**
   * Get wallets from localStorage
   */
  private getWalletsFromStorage(userId?: string): NonCustodialWallet[] {
    try {
      if (!userId) {
        throw new Error("userId is required to get wallets from storage");
      }
      const key = this.getStorageKey(userId);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to read wallets from storage:", error);
      return [];
    }
  }

  /**
   * Save wallets to localStorage
   */
  private saveWalletsToStorage(wallets: NonCustodialWallet[], userId?: string): void {
    try {
      if (!userId) {
        throw new Error("userId is required to save wallets to storage");
      }
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(wallets));
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
