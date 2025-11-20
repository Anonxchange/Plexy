import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as secp256k1 from 'https://esm.sh/@noble/secp256k1@2.0.0';
import { sha256 } from 'https://esm.sh/@noble/hashes@1.3.3/sha256';
import { sha512 } from 'https://esm.sh/@noble/hashes@1.3.3/sha512';
import { ripemd160 } from 'https://esm.sh/@noble/hashes@1.3.3/ripemd160';
import * as ed25519 from 'https://esm.sh/@noble/ed25519@2.0.0';
import { ethers } from 'https://esm.sh/ethers@6.9.0';
import { 
  Connection, 
  Keypair, 
  Transaction, 
  SystemProgram, 
  PublicKey, 
  sendAndConfirmTransaction 
} from 'https://esm.sh/@solana/web3.js@1.98.0';
import { 
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from 'https://esm.sh/@solana/spl-token@0.4.9';
import * as bitcoin from 'https://esm.sh/bitcoinjs-lib@6.1.5';
import { ECPairFactory } from 'https://esm.sh/ecpair@2.1.0';
import * as ecc from 'https://esm.sh/tiny-secp256k1@2.2.3';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// Set up SHA-512 for ed25519 (required for Solana)
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimum withdrawal amounts
const MIN_WITHDRAWALS: Record<string, number> = {
  BTC: 0.0001,
  ETH: 0.001,
  BNB: 0.001,
  SOL: 0.01,
  TRX: 10,
  'USDT-ERC20': 10,
  'USDT-BEP20': 5,
  'USDT-TRC20': 1,
  'USDT-SOL': 1,
  'USDC-ERC20': 10,
  'USDC-BEP20': 5,
  'USDC-SOL': 1,
  USDT: 10,
  USDC: 10,
};

// Network fees
const NETWORK_FEES: Record<string, number> = {
  BTC: 0.0001,
  ETH: 0.002,
  BNB: 0.0005,
  SOL: 0.000005,
  TRX: 1,
  'USDT-ERC20': 0.003,
  'USDT-BEP20': 0.001,
  'USDT-TRC20': 1,
  'USDT-SOL': 0.00001,
  'USDC-ERC20': 0.003,
  'USDC-BEP20': 0.001,
  'USDC-SOL': 0.00001,
  USDT: 0.003,
  USDC: 0.003,
};

interface WithdrawalRequest {
  user_id: string;
  crypto_symbol: string;
  amount: number;
  to_address: string;
}

// Normalize crypto symbol to base chain (EXACT same logic as wallet generation)
function normalizeToBaseChain(cryptoSymbol: string): string {
  const symbolUpper = cryptoSymbol.toUpperCase();
  
  if (symbolUpper.includes('-ERC20')) return 'EVM';
  if (symbolUpper.includes('-BEP20')) return 'EVM';
  if (symbolUpper.includes('-TRC20')) return 'TRX';
  if (symbolUpper.includes('-SOL')) return 'SOL';
  
  if (symbolUpper === 'ETH') return 'EVM';
  if (symbolUpper === 'BNB') return 'EVM';
  if (symbolUpper === 'TRX') return 'TRX';
  if (symbolUpper === 'SOL') return 'SOL';
  if (symbolUpper === 'BTC') return 'BTC';
  
  if (symbolUpper === 'USDT') return 'EVM';
  if (symbolUpper === 'USDC') return 'EVM';
  
  return 'EVM';
}

// Generate deterministic private key (EXACT same as wallet generation)
function generatePrivateKey(seed: Uint8Array, userId: string, cryptoSymbol: string): Uint8Array {
  const encoder = new TextEncoder();
  const baseChain = normalizeToBaseChain(cryptoSymbol);
  const derivationData = encoder.encode(`${userId}-${baseChain}`);
  
  console.log(`🔑 Deriving private key for ${cryptoSymbol} using base chain: ${baseChain}`);
  
  const combined = new Uint8Array(seed.length + derivationData.length);
  combined.set(seed);
  combined.set(derivationData, seed.length);
  
  return sha256(combined);
}

// Address validation
function isValidAddress(crypto_symbol: string, address: string): boolean {
  if (crypto_symbol === 'BTC') {
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,87}$/.test(address);
  }
  if (['ETH', 'USDT-ERC20', 'USDC-ERC20', 'BNB', 'USDT-BEP20', 'USDC-BEP20', 'USDT', 'USDC'].includes(crypto_symbol)) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  if (['SOL', 'USDT-SOL', 'USDC-SOL'].includes(crypto_symbol)) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  if (['TRX', 'USDT-TRC20'].includes(crypto_symbol)) {
    return /^T[A-Za-z1-9]{33}$/.test(address);
  }
  return false;
}

// Token contract addresses
const TOKEN_CONTRACTS: Record<string, { address: string; decimals: number }> = {
  'USDT-ERC20': { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
  'USDC-ERC20': { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
  'USDT-BEP20': { address: '0x55d398326f99059ff775485246999027b3197955', decimals: 18 },
  'USDC-BEP20': { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 },
  'USDT-TRC20': { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6 },
  'USDT-SOL': { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  'USDC-SOL': { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
};

// RPC endpoints
const RPC_ENDPOINTS = {
  ETH: 'https://eth.public-rpc.com',
  BSC: 'https://bsc-dataseed.binance.org',
  SOL: 'https://api.mainnet-beta.solana.com',
  TRX: 'https://api.trongrid.io',
};

// Broadcast Bitcoin transaction
async function broadcastBitcoin(privateKey: Uint8Array, to_address: string, amount: number): Promise<string> {
  console.log(`📤 Broadcasting Bitcoin transaction: ${amount} BTC to ${to_address}`);
  
  // Create key pair from private key
  const keyPair = ECPair.fromPrivateKey(privateKey, { network: bitcoin.networks.bitcoin });
  const fromAddress = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: bitcoin.networks.bitcoin }).address!;
  
  console.log(`From address: ${fromAddress}`);
  
  // Fetch UTXOs from Blockstream API
  const utxoResponse = await fetch(`https://blockstream.info/api/address/${fromAddress}/utxo`);
  if (!utxoResponse.ok) {
    throw new Error('Failed to fetch UTXOs from Blockstream');
  }
  
  const utxos = await utxoResponse.json();
  if (!utxos || utxos.length === 0) {
    throw new Error('No UTXOs available for this address');
  }
  
  console.log(`Found ${utxos.length} UTXOs`);
  
  // Create transaction
  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
  
  // Calculate amount in satoshis
  const amountSatoshis = Math.floor(amount * 1e8);
  const feeRate = 10; // sat/vByte - can be made dynamic
  
  let totalInput = 0;
  
  // Add inputs
  for (const utxo of utxos) {
    const txHex = await fetch(`https://blockstream.info/api/tx/${utxo.txid}/hex`).then(r => r.text());
    
    // Convert hex string to Uint8Array
    const txBytes = new Uint8Array(txHex.length / 2);
    for (let i = 0; i < txHex.length; i += 2) {
      txBytes[i / 2] = parseInt(txHex.substr(i, 2), 16);
    }
    
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: txBytes,
    });
    
    totalInput += utxo.value;
    
    // Stop if we have enough
    if (totalInput >= amountSatoshis + 2000) break; // 2000 sat buffer for fees
  }
  
  if (totalInput < amountSatoshis) {
    throw new Error(`Insufficient balance. Have ${totalInput} sat, need ${amountSatoshis} sat`);
  }
  
  // Add output for recipient
  psbt.addOutput({
    address: to_address,
    value: amountSatoshis,
  });
  
  // Calculate fee (estimate 250 bytes for transaction)
  const estimatedFee = 250 * feeRate;
  const change = totalInput - amountSatoshis - estimatedFee;
  
  // Add change output if meaningful
  if (change > 546) { // Bitcoin dust limit
    psbt.addOutput({
      address: fromAddress,
      value: change,
    });
  }
  
  // Sign all inputs
  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();
  
  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
  const txId = tx.getId();
  
  console.log(`Transaction created: ${txId}`);
  
  // Broadcast transaction
  const broadcastResponse = await fetch('https://blockstream.info/api/tx', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: txHex,
  });
  
  if (!broadcastResponse.ok) {
    const error = await broadcastResponse.text();
    throw new Error(`Bitcoin broadcast failed: ${error}`);
  }
  
  const broadcastedTxId = await broadcastResponse.text();
  console.log(`✅ Bitcoin transaction broadcasted: ${broadcastedTxId}`);
  
  return broadcastedTxId;
}

// Broadcast EVM transaction (ETH/BNB/tokens)
async function broadcastEVM(
  privateKey: Uint8Array,
  crypto_symbol: string,
  to_address: string,
  amount: number
): Promise<string> {
  console.log(`📤 Broadcasting ${crypto_symbol} on EVM...`);
  
  const isBSC = crypto_symbol === 'BNB' || crypto_symbol.includes('BEP20');
  const rpcUrl = isBSC ? RPC_ENDPOINTS.BSC : RPC_ENDPOINTS.ETH;
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const privateKeyHex = '0x' + Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join('');
  const wallet = new ethers.Wallet(privateKeyHex, provider);
  
  console.log(`Using wallet address: ${wallet.address}`);
  
  // Check if it's a token or native
  const tokenInfo = TOKEN_CONTRACTS[crypto_symbol];
  
  if (tokenInfo) {
    // ERC20/BEP20 token transfer
    console.log(`Transferring ${amount} ${crypto_symbol} tokens to ${to_address}`);
    
    const abi = ['function transfer(address to, uint256 amount) returns (bool)'];
    const contract = new ethers.Contract(tokenInfo.address, abi, wallet);
    
    const amountWei = ethers.parseUnits(amount.toString(), tokenInfo.decimals);
    const tx = await contract.transfer(to_address, amountWei);
    
    console.log(`✅ Token transfer initiated: ${tx.hash}`);
    return tx.hash;
  } else {
    // Native ETH/BNB transfer
    console.log(`Transferring ${amount} ${crypto_symbol} (native) to ${to_address}`);
    
    const amountWei = ethers.parseEther(amount.toString());
    const tx = await wallet.sendTransaction({
      to: to_address,
      value: amountWei,
    });
    
    console.log(`✅ Native transfer initiated: ${tx.hash}`);
    return tx.hash;
  }
}

// Broadcast Solana transaction
async function broadcastSolana(
  privateKey: Uint8Array,
  crypto_symbol: string,
  to_address: string,
  amount: number
): Promise<string> {
  console.log(`📤 Broadcasting ${crypto_symbol} on Solana...`);
  
  const connection = new Connection(RPC_ENDPOINTS.SOL, 'confirmed');
  const keypair = Keypair.fromSeed(privateKey.slice(0, 32));
  
  console.log(`Using wallet: ${keypair.publicKey.toBase58()}`);
  
  const tokenInfo = TOKEN_CONTRACTS[crypto_symbol];
  
  if (tokenInfo) {
    // SPL token transfer
    console.log(`Transferring ${amount} ${crypto_symbol} SPL tokens to ${to_address}`);
    
    const mintPublicKey = new PublicKey(tokenInfo.address);
    const recipientPublicKey = new PublicKey(to_address);
    
    // Get or create associated token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintPublicKey,
      keypair.publicKey
    );
    
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintPublicKey,
      recipientPublicKey
    );
    
    console.log(`From token account: ${fromTokenAccount.address.toBase58()}`);
    console.log(`To token account: ${toTokenAccount.address.toBase58()}`);
    
    // Create transfer instruction
    const amountLamports = Math.floor(amount * Math.pow(10, tokenInfo.decimals));
    
    const transaction = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount.address,
        keypair.publicKey,
        amountLamports,
        [],
        TOKEN_PROGRAM_ID
      )
    );
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    
    console.log(`✅ SPL token transfer confirmed: ${signature}`);
    return signature;
  } else {
    // Native SOL transfer
    console.log(`Transferring ${amount} SOL to ${to_address}`);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(to_address),
        lamports: Math.floor(amount * 1e9), // SOL to lamports
      })
    );
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    
    console.log(`✅ SOL transfer confirmed: ${signature}`);
    return signature;
  }
}

// Broadcast Tron transaction using TronGrid API
async function broadcastTron(
  privateKey: Uint8Array,
  crypto_symbol: string,
  to_address: string,
  amount: number
): Promise<string> {
  console.log(`📤 Broadcasting ${crypto_symbol} on Tron...`);
  
  const privateKeyHex = Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Generate from address from private key (using secp256k1)
  const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1); // Remove 0x04 prefix
  const hash = sha256(publicKey);
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41; // Tron mainnet prefix
  addressBytes.set(hash.slice(-20), 1);
  
  // Base58Check encode for from address
  const checksum = sha256(sha256(addressBytes)).slice(0, 4);
  const addressWithChecksum = new Uint8Array(25);
  addressWithChecksum.set(addressBytes);
  addressWithChecksum.set(checksum, 21);
  
  // Simple base58 encode
  const base58Encode = (bytes: Uint8Array): string => {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let digits = [0];
    for (let i = 0; i < bytes.length; i++) {
      let carry = bytes[i];
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
    for (let i = 0; bytes[i] === 0 && i < bytes.length - 1; i++) result += ALPHABET[0];
    for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]];
    return result;
  };
  
  const fromAddress = base58Encode(addressWithChecksum);
  console.log(`From address: ${fromAddress}`);
  
  const tokenInfo = TOKEN_CONTRACTS[crypto_symbol];
  const TRON_API = RPC_ENDPOINTS.TRX;
  
  if (tokenInfo) {
    // TRC20 token transfer
    console.log(`Transferring ${amount} ${crypto_symbol} tokens to ${to_address}`);
    
    const amountSun = Math.floor(amount * Math.pow(10, tokenInfo.decimals));
    
    // Create TRC20 transfer parameter (function signature + address + amount)
    const functionSelector = 'a9059cbb'; // transfer(address,uint256)
    const addressParam = to_address.replace(/^T/, '41').padStart(64, '0').slice(-64);
    const amountParam = amountSun.toString(16).padStart(64, '0');
    const parameter = addressParam + amountParam;
    
    // Create transaction
    const txResponse = await fetch(`${TRON_API}/wallet/triggersmartcontract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: fromAddress,
        contract_address: tokenInfo.address,
        function_selector: functionSelector,
        parameter: parameter,
        fee_limit: 100000000, // 100 TRX fee limit
        call_value: 0,
      }),
    });
    
    const txData = await txResponse.json();
    if (!txData.result || !txData.transaction) {
      throw new Error(`Failed to create TRC20 transaction: ${JSON.stringify(txData)}`);
    }
    
    // Sign transaction
    const txID = txData.transaction.txID;
    const rawDataHex = txData.transaction.raw_data_hex;
    
    // Convert hex to Uint8Array
    const rawDataBytes = new Uint8Array(rawDataHex.length / 2);
    for (let i = 0; i < rawDataHex.length; i += 2) {
      rawDataBytes[i / 2] = parseInt(rawDataHex.substr(i, 2), 16);
    }
    
    const txHash = sha256(rawDataBytes);
    const signatureBytes = await secp256k1.sign(txHash, privateKey);
    const signatureHex = typeof signatureBytes === 'string' 
      ? signatureBytes 
      : Array.from(new Uint8Array(signatureBytes.toCompactRawBytes())).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Broadcast signed transaction
    const broadcastResponse = await fetch(`${TRON_API}/wallet/broadcasttransaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...txData.transaction,
        signature: [signatureHex],
      }),
    });
    
    const broadcastResult = await broadcastResponse.json();
    if (!broadcastResult.result) {
      throw new Error(`TRC20 broadcast failed: ${JSON.stringify(broadcastResult)}`);
    }
    
    console.log(`✅ TRC20 transfer broadcasted: ${txID}`);
    return txID;
  } else {
    // Native TRX transfer
    console.log(`Transferring ${amount} TRX to ${to_address}`);
    
    const amountSun = Math.floor(amount * 1e6);
    
    // Create transaction
    const txResponse = await fetch(`${TRON_API}/wallet/createtransaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_address: fromAddress,
        to_address: to_address,
        amount: amountSun,
      }),
    });
    
    const txData = await txResponse.json();
    if (!txData.raw_data_hex) {
      throw new Error(`Failed to create TRX transaction: ${JSON.stringify(txData)}`);
    }
    
    // Sign transaction
    const txID = txData.txID;
    const rawDataHex = txData.raw_data_hex;
    
    // Convert hex to Uint8Array
    const rawDataBytes = new Uint8Array(rawDataHex.length / 2);
    for (let i = 0; i < rawDataHex.length; i += 2) {
      rawDataBytes[i / 2] = parseInt(rawDataHex.substr(i, 2), 16);
    }
    
    const txHash = sha256(rawDataBytes);
    const signatureBytes = await secp256k1.sign(txHash, privateKey);
    const signatureHex = typeof signatureBytes === 'string' 
      ? signatureBytes 
      : Array.from(new Uint8Array(signatureBytes.toCompactRawBytes())).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Broadcast signed transaction
    const broadcastResponse = await fetch(`${TRON_API}/wallet/broadcasttransaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...txData,
        signature: [signatureHex],
      }),
    });
    
    const broadcastResult = await broadcastResponse.json();
    if (!broadcastResult.result) {
      throw new Error(`TRX broadcast failed: ${JSON.stringify(broadcastResult)}`);
    }
    
    console.log(`✅ TRX transfer broadcasted: ${txID}`);
    return txID;
  }
}

// Main broadcast function
async function broadcastTransaction(
  privateKey: Uint8Array,
  crypto_symbol: string,
  to_address: string,
  amount: number
): Promise<string> {
  console.log(`📤 Broadcasting ${crypto_symbol} transaction`);
  console.log(`   To: ${to_address}`);
  console.log(`   Amount: ${amount}`);
  
  const baseChain = normalizeToBaseChain(crypto_symbol);
  
  switch (baseChain) {
    case 'BTC':
      return await broadcastBitcoin(privateKey, to_address, amount);
    
    case 'EVM':
      return await broadcastEVM(privateKey, crypto_symbol, to_address, amount);
    
    case 'SOL':
      return await broadcastSolana(privateKey, crypto_symbol, to_address, amount);
    
    case 'TRX':
      return await broadcastTron(privateKey, crypto_symbol, to_address, amount);
    
    default:
      throw new Error(`Unsupported blockchain: ${baseChain}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, crypto_symbol, amount, to_address }: WithdrawalRequest = await req.json();

    console.log(`💸 Withdrawal request: ${amount} ${crypto_symbol} to ${to_address}`);

    // Validate inputs
    if (!user_id || !crypto_symbol || !amount || !to_address) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidAddress(crypto_symbol, to_address)) {
      return new Response(
        JSON.stringify({ error: 'Invalid withdrawal address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check minimum
    const minAmount = MIN_WITHDRAWALS[crypto_symbol];
    if (minAmount && amount < minAmount) {
      return new Response(
        JSON.stringify({ error: `Minimum withdrawal is ${minAmount} ${crypto_symbol}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const networkFee = NETWORK_FEES[crypto_symbol] || 0;
    const totalAmount = amount + networkFee;

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .eq('crypto_symbol', crypto_symbol)
      .single();

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check balance
    if (wallet.balance < totalAmount) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance',
          required: totalAmount,
          available: wallet.balance,
          fee: networkFee
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lock funds
    const { error: lockError } = await supabase
      .from('wallets')
      .update({
        balance: wallet.balance - totalAmount,
        locked_balance: (wallet.locked_balance || 0) + totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (lockError) {
      console.error('❌ Failed to lock funds:', lockError);
      return new Response(
        JSON.stringify({ error: 'Failed to lock funds' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔒 Locked ${totalAmount} ${crypto_symbol} (amount: ${amount}, fee: ${networkFee})`);

    try {
      // Derive private key using EXACT same method as wallet generation
      const masterSeed = Deno.env.get('MASTER_WALLET_SEED');
      if (!masterSeed) {
        throw new Error('Master wallet seed not configured');
      }

      const encoder = new TextEncoder();
      const seedBytes = sha256(encoder.encode(masterSeed));
      const privateKey = generatePrivateKey(seedBytes, user_id, crypto_symbol);

      console.log(`✅ Private key derived for ${crypto_symbol}`);

      // Broadcast transaction
      const txHash = await broadcastTransaction(privateKey, crypto_symbol, to_address, amount);

      console.log(`✅ Transaction broadcasted: ${txHash}`);

      // Record transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id,
          wallet_id: wallet.id,
          type: 'withdrawal',
          crypto_symbol,
          amount: -amount,
          fee: networkFee,
          to_address,
          tx_hash: txHash,
          status: 'pending',
          confirmations: 0,
          required_confirmations: 2,
          notes: `Withdrawal to ${to_address}`
        });

      return new Response(
        JSON.stringify({
          success: true,
          tx_hash: txHash,
          amount,
          fee: networkFee,
          total: totalAmount,
          to_address,
          status: 'pending',
          note: 'Transaction successfully broadcasted to blockchain. All networks (BTC, ETH, BNB, SOL, TRX) and tokens (ERC20, BEP20, TRC20, SPL) are now supported.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (broadcastError) {
      console.error('❌ Broadcast failed:', broadcastError);

      // Unlock funds
      await supabase
        .from('wallets')
        .update({
          balance: wallet.balance,
          locked_balance: wallet.locked_balance || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      return new Response(
        JSON.stringify({ error: 'Failed to broadcast transaction', details: (broadcastError as Error).message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});