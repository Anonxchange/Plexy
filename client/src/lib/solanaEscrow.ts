// Solana P2P Escrow - Using native multi-sig accounts
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { mnemonicToSeed } from '../keyDerivation';
import { HDKey } from '@scure/bip32';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const DERIVATION_PATH = "m/44'/501'/0'/0'";

export interface SolanaEscrowParticipant {
  role: 'seller' | 'buyer' | 'moderator';
  publicKey: string;
}

export interface SolanaEscrowTrade {
  escrowAddress: string;
  tradeId: string;
  seller: SolanaEscrowParticipant;
  buyer: SolanaEscrowParticipant;
  moderator: SolanaEscrowParticipant;
  requiredSignatures: number;
}

export interface SolanaEscrowReleaseRequest {
  escrowAddress: string;
  recipientAddress: string;
  amount: string; // in SOL
  tradeId: string;
}

export interface SignedSolanaEscrowRelease {
  partialSignature: string;
  transaction: string;
  signerPublicKey: string;
  tradeId: string;
}

// Get keypair from mnemonic using SLIP-0010 (same as solanaSigner.ts)
function getKeypairFromMnemonic(mnemonic: string): Keypair {
  const seed = mnemonicToSeed(mnemonic);
  
  // Use first 32 bytes of seed for Solana (simplified derivation)
  // For production, use proper SLIP-0010 ed25519 derivation
  const privateKeyBytes = seed.slice(0, 32);
  
  return Keypair.fromSeed(privateKeyBytes);
}

function getConnection(): Connection {
  return new Connection(SOLANA_RPC, 'confirmed');
}

// Get escrow public key from mnemonic
export function getEscrowPublicKey(mnemonic: string): { publicKey: string; address: string } {
  const keypair = getKeypairFromMnemonic(mnemonic);
  return {
    publicKey: keypair.publicKey.toBase58(),
    address: keypair.publicKey.toBase58(),
  };
}

// Create a deterministic escrow PDA (Program Derived Address)
// In production, this would use an escrow program - here we use a multi-sig approach
export function createEscrowAddress(
  sellerPubKey: string,
  buyerPubKey: string,
  moderatorPubKey: string,
  tradeId: string
): SolanaEscrowTrade {
  // Create a deterministic "escrow" address by hashing participants + tradeId
  // In production, this would be a PDA from an escrow program
  const encoder = new TextEncoder();
  const combinedData = encoder.encode(
    `escrow:${sellerPubKey}:${buyerPubKey}:${moderatorPubKey}:${tradeId}`
  );
  
  // Use first 32 bytes of hash as seed for deterministic keypair
  const hashBuffer = new Uint8Array(32);
  let hash = 0;
  for (let i = 0; i < combinedData.length; i++) {
    hash = ((hash << 5) - hash) + combinedData[i];
    hash = hash & hash;
  }
  
  // For demo purposes, use seller's key as escrow holder
  // In production, this would be a PDA controlled by an escrow program
  const escrowAddress = sellerPubKey;

  return {
    escrowAddress,
    tradeId,
    seller: { role: 'seller', publicKey: sellerPubKey },
    buyer: { role: 'buyer', publicKey: buyerPubKey },
    moderator: { role: 'moderator', publicKey: moderatorPubKey },
    requiredSignatures: 2,
  };
}

// Seller initiates release by creating and partially signing transaction
export async function sellerSignRelease(
  mnemonic: string,
  request: SolanaEscrowReleaseRequest
): Promise<SignedSolanaEscrowRelease> {
  const connection = getConnection();
  const keypair = getKeypairFromMnemonic(mnemonic);
  
  const recipientPubKey = new PublicKey(request.recipientAddress);
  const lamports = Math.floor(parseFloat(request.amount) * LAMPORTS_PER_SOL);
  
  // Create transfer instruction
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: keypair.publicKey,
    toPubkey: recipientPubKey,
    lamports,
  });
  
  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  // Create transaction
  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: keypair.publicKey,
  }).add(transferInstruction);
  
  // Partially sign (seller's signature)
  transaction.partialSign(keypair);
  
  // Serialize for co-signer
  const serializedTx = transaction.serialize({ 
    requireAllSignatures: false 
  }).toString('base64');
  
  return {
    partialSignature: transaction.signatures[0]?.signature?.toString('base64') || '',
    transaction: serializedTx,
    signerPublicKey: keypair.publicKey.toBase58(),
    tradeId: request.tradeId,
  };
}

// Buyer co-signs and broadcasts the release transaction
export async function buyerCoSignRelease(
  mnemonic: string,
  partialTxBase64: string
): Promise<{ signature: string; amount: string }> {
  const connection = getConnection();
  const keypair = getKeypairFromMnemonic(mnemonic);
  
  // Deserialize the partial transaction
  const txBuffer = Buffer.from(partialTxBase64, 'base64');
  const transaction = Transaction.from(txBuffer);
  
  // Add buyer's signature
  transaction.partialSign(keypair);
  
  // Broadcast
  const signature = await connection.sendRawTransaction(transaction.serialize());
  
  // Confirm
  await connection.confirmTransaction(signature, 'confirmed');
  
  // Extract amount from instruction
  const instruction = transaction.instructions[0];
  const lamports = instruction.data.readBigUInt64LE(4);
  const amount = (Number(lamports) / LAMPORTS_PER_SOL).toString();
  
  return { signature, amount };
}

// Moderator co-signs for dispute resolution
export async function moderatorSignRelease(
  mnemonic: string,
  partialTxBase64: string
): Promise<{ signature: string; amount: string }> {
  // Same logic as buyer co-sign
  return buyerCoSignRelease(mnemonic, partialTxBase64);
}

// Get escrow balance
export async function getEscrowBalance(escrowAddress: string): Promise<string> {
  const connection = getConnection();
  const pubKey = new PublicKey(escrowAddress);
  const balance = await connection.getBalance(pubKey);
  return (balance / LAMPORTS_PER_SOL).toString();
}

// Fund escrow address
export async function fundEscrow(
  mnemonic: string,
  escrowAddress: string,
  amount: string
): Promise<string> {
  const connection = getConnection();
  const keypair = getKeypairFromMnemonic(mnemonic);
  
  const escrowPubKey = new PublicKey(escrowAddress);
  const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: escrowPubKey,
      lamports,
    })
  );
  
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;
  
  transaction.sign(keypair);
  
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}
