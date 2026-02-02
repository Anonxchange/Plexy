// Unified Escrow Module - Export all chain-specific escrow implementations

// Bitcoin Escrow
export {
  getEscrowPublicKey as getBtcEscrowPublicKey,
  createEscrowAddress as createBtcEscrowAddress,
  sellerSignRelease as btcSellerSignRelease,
  buyerCoSignRelease as btcBuyerCoSignRelease,
  moderatorSignRelease as btcModeratorSignRelease,
  fetchEscrowUTXOs as fetchBtcEscrowUTXOs,
  broadcastEscrowRelease as broadcastBtcEscrowRelease,
  getRecommendedFeeRate as getBtcFeeRate,
} from './bitcoinEscrow';

export type {
  EscrowParticipant as BtcEscrowParticipant,
  BitcoinEscrowTrade,
  EscrowReleaseRequest as BtcEscrowReleaseRequest,
  SignedEscrowRelease as SignedBtcEscrowRelease,
} from './bitcoinEscrow';

// Solana Escrow
export {
  getEscrowPublicKey as getSolEscrowPublicKey,
  createEscrowAddress as createSolEscrowAddress,
  sellerSignRelease as solSellerSignRelease,
  buyerCoSignRelease as solBuyerCoSignRelease,
  moderatorSignRelease as solModeratorSignRelease,
  getEscrowBalance as getSolEscrowBalance,
  fundEscrow as fundSolEscrow,
} from './solanaEscrow';

export type {
  SolanaEscrowParticipant,
  SolanaEscrowTrade,
  SolanaEscrowReleaseRequest,
  SignedSolanaEscrowRelease,
} from './solanaEscrow';

// Tron Escrow
export {
  getEscrowAddress as getTrxEscrowAddress,
  createEscrowTrade as createTrxEscrowTrade,
  sellerSignRelease as trxSellerSignRelease,
  buyerConfirmRelease as trxBuyerConfirmRelease,
  moderatorResolveDispute as trxModeratorResolve,
  broadcastEscrowRelease as broadcastTrxEscrowRelease,
  getEscrowTrxBalance,
  getEscrowTokenBalance as getTrxEscrowTokenBalance,
  fundEscrowTrx,
  fundEscrowToken as fundTrxEscrowToken,
} from './tronEscrow';

export type {
  TronEscrowParticipant,
  TronEscrowTrade,
  TronEscrowReleaseRequest,
  SignedTronEscrowRelease,
} from './tronEscrow';
