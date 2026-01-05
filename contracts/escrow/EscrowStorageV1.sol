// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EscrowStorageV1
 * @dev Storage layout for upgradeable escrow contract
 * @notice Inherit this in implementation contracts to maintain storage compatibility
 */
abstract contract EscrowStorageV1 {
    // ============ Enums ============
    enum TradeStatus {
        Created,      // Trade created, awaiting buyer deposit
        Funded,       // Buyer has deposited funds
        Released,     // Funds released to seller
        Refunded,     // Funds refunded to buyer
        Disputed,     // Trade is in dispute
        Resolved      // Dispute resolved by moderator
    }

    // ============ Structs ============
    struct Trade {
        address buyer;
        address seller;
        address token;          // address(0) for native ETH/BNB
        uint256 amount;
        uint256 createdAt;
        uint256 expiresAt;
        TradeStatus status;
        string tradeId;         // Off-chain reference ID
    }

    struct DisputeInfo {
        address initiator;
        string reason;
        uint256 initiatedAt;
        bool resolved;
        address winner;
    }

    // ============ State Variables ============
    
    // Initialization flag (for upgradeable pattern)
    bool internal _initialized;
    
    // Multi-sig admin address
    address public admin;
    
    // Moderator addresses
    mapping(address => bool) public isModerator;
    address[] internal _moderators;
    
    // Trade storage
    mapping(bytes32 => Trade) public trades;
    mapping(bytes32 => DisputeInfo) public disputes;
    
    // Trade tracking
    bytes32[] internal _allTradeIds;
    mapping(address => bytes32[]) internal _userTrades;
    
    // Configuration
    uint256 public defaultExpiryDuration;  // Default: 24 hours
    uint256 public minTradeAmount;
    uint256 public maxTradeAmount;
    
    // Supported tokens (address(0) = native, others = ERC20)
    mapping(address => bool) public supportedTokens;
    
    // Nonce for trade ID generation
    uint256 internal _tradeNonce;

    // ============ Storage Gap ============
    // Reserved storage slots for future upgrades
    uint256[50] private __gap;
}
