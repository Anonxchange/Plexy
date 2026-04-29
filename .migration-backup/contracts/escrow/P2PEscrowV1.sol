// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EscrowStorageV1.sol";

/**
 * @title P2PEscrowV1
 * @dev Upgradeable P2P Escrow Implementation V1
 * @notice Basic escrow with moderator dispute resolution (no fees)
 */
contract P2PEscrowV1 is EscrowStorageV1 {
    // ============ Events ============
    event TradeCreated(
        bytes32 indexed tradeHash,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount,
        string tradeId
    );
    event TradeFunded(bytes32 indexed tradeHash, uint256 amount);
    event TradeReleased(bytes32 indexed tradeHash);
    event TradeRefunded(bytes32 indexed tradeHash);
    event DisputeOpened(bytes32 indexed tradeHash, address indexed initiator, string reason);
    event DisputeResolved(bytes32 indexed tradeHash, address indexed winner);
    event ModeratorAdded(address indexed moderator);
    event ModeratorRemoved(address indexed moderator);
    event TokenSupported(address indexed token, bool supported);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    // ============ Errors ============
    error AlreadyInitialized();
    error NotAdmin();
    error NotModerator();
    error NotParticipant();
    error InvalidAddress();
    error InvalidAmount();
    error TradeNotFound();
    error InvalidTradeStatus();
    error TradeExpired();
    error TradeNotExpired();
    error TransferFailed();
    error TokenNotSupported();
    error DisputeAlreadyExists();
    error NoDispute();

    // ============ Modifiers ============
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyModerator() {
        if (!isModerator[msg.sender]) revert NotModerator();
        _;
    }

    modifier onlyTradeParticipant(bytes32 _tradeHash) {
        Trade storage trade = trades[_tradeHash];
        if (msg.sender != trade.buyer && msg.sender != trade.seller) {
            revert NotParticipant();
        }
        _;
    }

    // ============ Initializer ============
    /**
     * @dev Initialize the escrow contract (called once via proxy)
     * @param _admin Multi-sig admin address
     */
    function initialize(address _admin) external {
        if (_initialized) revert AlreadyInitialized();
        if (_admin == address(0)) revert InvalidAddress();

        _initialized = true;
        admin = _admin;
        
        // Default configuration
        defaultExpiryDuration = 24 hours;
        minTradeAmount = 0;
        maxTradeAmount = type(uint256).max;
        
        // Native token (ETH/BNB) is always supported
        supportedTokens[address(0)] = true;
    }

    // ============ Trade Functions ============

    /**
     * @dev Create and fund a trade in one transaction (gas optimized)
     * @param _seller Seller address
     * @param _token Token address (address(0) for native)
     * @param _amount Trade amount
     * @param _tradeId Off-chain reference ID
     * @param _expiryDuration Custom expiry (0 = default)
     * @return tradeHash Unique trade identifier
     */
    function createAndFundTrade(
        address _seller,
        address _token,
        uint256 _amount,
        string calldata _tradeId,
        uint256 _expiryDuration
    ) external payable returns (bytes32 tradeHash) {
        if (_seller == address(0) || _seller == msg.sender) revert InvalidAddress();
        if (_amount < minTradeAmount || _amount > maxTradeAmount) revert InvalidAmount();
        if (!supportedTokens[_token]) revert TokenNotSupported();

        // Handle payment
        if (_token == address(0)) {
            if (msg.value != _amount) revert InvalidAmount();
        } else {
            if (msg.value != 0) revert InvalidAmount();
            bool success = _transferFrom(_token, msg.sender, address(this), _amount);
            if (!success) revert TransferFailed();
        }

        uint256 expiry = _expiryDuration > 0 ? _expiryDuration : defaultExpiryDuration;

        tradeHash = keccak256(abi.encodePacked(
            msg.sender,
            _seller,
            _token,
            _amount,
            block.timestamp,
            _tradeNonce++
        ));

        trades[tradeHash] = Trade({
            buyer: msg.sender,
            seller: _seller,
            token: _token,
            amount: _amount,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + expiry,
            status: TradeStatus.Funded,  // Already funded
            tradeId: _tradeId
        });

        _allTradeIds.push(tradeHash);
        _userTrades[msg.sender].push(tradeHash);
        _userTrades[_seller].push(tradeHash);

        emit TradeCreated(tradeHash, msg.sender, _seller, _token, _amount, _tradeId);
        emit TradeFunded(tradeHash, _amount);
    }

    /**
     * @dev Create a new trade (legacy - use createAndFundTrade for gas savings)
     * @param _seller Seller address
     * @param _token Token address (address(0) for native)
     * @param _amount Trade amount
     * @param _tradeId Off-chain reference ID
     * @param _expiryDuration Custom expiry (0 = default)
     * @return tradeHash Unique trade identifier
     */
    function createTrade(
        address _seller,
        address _token,
        uint256 _amount,
        string calldata _tradeId,
        uint256 _expiryDuration
    ) external returns (bytes32 tradeHash) {
        if (_seller == address(0) || _seller == msg.sender) revert InvalidAddress();
        if (_amount < minTradeAmount || _amount > maxTradeAmount) revert InvalidAmount();
        if (!supportedTokens[_token]) revert TokenNotSupported();

        uint256 expiry = _expiryDuration > 0 ? _expiryDuration : defaultExpiryDuration;

        tradeHash = keccak256(abi.encodePacked(
            msg.sender,
            _seller,
            _token,
            _amount,
            block.timestamp,
            _tradeNonce++
        ));

        trades[tradeHash] = Trade({
            buyer: msg.sender,
            seller: _seller,
            token: _token,
            amount: _amount,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + expiry,
            status: TradeStatus.Created,
            tradeId: _tradeId
        });

        _allTradeIds.push(tradeHash);
        _userTrades[msg.sender].push(tradeHash);
        _userTrades[_seller].push(tradeHash);

        emit TradeCreated(tradeHash, msg.sender, _seller, _token, _amount, _tradeId);
    }

    /**
     * @dev Fund a trade (buyer deposits funds)
     * @param _tradeHash Trade identifier
     */
    function fundTrade(bytes32 _tradeHash) external payable {
        Trade storage trade = trades[_tradeHash];
        if (trade.buyer == address(0)) revert TradeNotFound();
        if (trade.status != TradeStatus.Created) revert InvalidTradeStatus();
        if (block.timestamp > trade.expiresAt) revert TradeExpired();
        if (msg.sender != trade.buyer) revert NotParticipant();

        if (trade.token == address(0)) {
            if (msg.value != trade.amount) revert InvalidAmount();
        } else {
            if (msg.value != 0) revert InvalidAmount();
            bool success = _transferFrom(trade.token, msg.sender, address(this), trade.amount);
            if (!success) revert TransferFailed();
        }

        trade.status = TradeStatus.Funded;
        emit TradeFunded(_tradeHash, trade.amount);
    }

    /**
     * @dev Release funds to seller (buyer confirms receipt)
     * @param _tradeHash Trade identifier
     */
    function releaseFunds(bytes32 _tradeHash) external {
        Trade storage trade = trades[_tradeHash];
        if (trade.buyer == address(0)) revert TradeNotFound();
        if (trade.status != TradeStatus.Funded) revert InvalidTradeStatus();
        if (msg.sender != trade.buyer) revert NotParticipant();

        trade.status = TradeStatus.Released;
        _transferOut(trade.token, trade.seller, trade.amount);

        emit TradeReleased(_tradeHash);
    }

    /**
     * @dev Cancel and refund (only if not funded or expired)
     * @param _tradeHash Trade identifier
     */
    function cancelTrade(bytes32 _tradeHash) external onlyTradeParticipant(_tradeHash) {
        Trade storage trade = trades[_tradeHash];
        if (trade.buyer == address(0)) revert TradeNotFound();

        if (trade.status == TradeStatus.Created) {
            // Not yet funded - can cancel
            trade.status = TradeStatus.Refunded;
            emit TradeRefunded(_tradeHash);
        } else if (trade.status == TradeStatus.Funded && block.timestamp > trade.expiresAt) {
            // Funded but expired - buyer can get refund
            if (msg.sender != trade.buyer) revert NotParticipant();
            trade.status = TradeStatus.Refunded;
            _transferOut(trade.token, trade.buyer, trade.amount);
            emit TradeRefunded(_tradeHash);
        } else {
            revert InvalidTradeStatus();
        }
    }

    // ============ Dispute Functions ============

    /**
     * @dev Open a dispute on a funded trade
     * @param _tradeHash Trade identifier
     * @param _reason Dispute reason
     */
    function openDispute(bytes32 _tradeHash, string calldata _reason) 
        external 
        onlyTradeParticipant(_tradeHash) 
    {
        Trade storage trade = trades[_tradeHash];
        if (trade.status != TradeStatus.Funded) revert InvalidTradeStatus();
        if (disputes[_tradeHash].initiatedAt > 0) revert DisputeAlreadyExists();

        trade.status = TradeStatus.Disputed;
        disputes[_tradeHash] = DisputeInfo({
            initiator: msg.sender,
            reason: _reason,
            initiatedAt: block.timestamp,
            resolved: false,
            winner: address(0)
        });

        emit DisputeOpened(_tradeHash, msg.sender, _reason);
    }

    /**
     * @dev Resolve a dispute (moderator only)
     * @param _tradeHash Trade identifier
     * @param _releaseToBuyer True = refund buyer, False = pay seller
     */
    function resolveDispute(bytes32 _tradeHash, bool _releaseToBuyer) external onlyModerator {
        Trade storage trade = trades[_tradeHash];
        DisputeInfo storage dispute = disputes[_tradeHash];

        if (trade.status != TradeStatus.Disputed) revert InvalidTradeStatus();
        if (dispute.initiatedAt == 0) revert NoDispute();

        trade.status = TradeStatus.Resolved;
        dispute.resolved = true;

        if (_releaseToBuyer) {
            dispute.winner = trade.buyer;
            _transferOut(trade.token, trade.buyer, trade.amount);
        } else {
            dispute.winner = trade.seller;
            _transferOut(trade.token, trade.seller, trade.amount);
        }

        emit DisputeResolved(_tradeHash, dispute.winner);
    }

    // ============ Admin Functions ============

    function addModerator(address _moderator) external onlyAdmin {
        if (_moderator == address(0)) revert InvalidAddress();
        if (!isModerator[_moderator]) {
            isModerator[_moderator] = true;
            _moderators.push(_moderator);
            emit ModeratorAdded(_moderator);
        }
    }

    function removeModerator(address _moderator) external onlyAdmin {
        if (isModerator[_moderator]) {
            isModerator[_moderator] = false;
            for (uint256 i = 0; i < _moderators.length; i++) {
                if (_moderators[i] == _moderator) {
                    _moderators[i] = _moderators[_moderators.length - 1];
                    _moderators.pop();
                    break;
                }
            }
            emit ModeratorRemoved(_moderator);
        }
    }

    function setSupportedToken(address _token, bool _supported) external onlyAdmin {
        supportedTokens[_token] = _supported;
        emit TokenSupported(_token, _supported);
    }

    function setTradeAmountLimits(uint256 _min, uint256 _max) external onlyAdmin {
        minTradeAmount = _min;
        maxTradeAmount = _max;
    }

    function setDefaultExpiry(uint256 _duration) external onlyAdmin {
        defaultExpiryDuration = _duration;
    }

    function changeAdmin(address _newAdmin) external onlyAdmin {
        if (_newAdmin == address(0)) revert InvalidAddress();
        emit AdminChanged(admin, _newAdmin);
        admin = _newAdmin;
    }

    // ============ View Functions ============

    function getTrade(bytes32 _tradeHash) external view returns (Trade memory) {
        return trades[_tradeHash];
    }

    function getDispute(bytes32 _tradeHash) external view returns (DisputeInfo memory) {
        return disputes[_tradeHash];
    }

    function getUserTrades(address _user) external view returns (bytes32[] memory) {
        return _userTrades[_user];
    }

    function getModerators() external view returns (address[] memory) {
        return _moderators;
    }

    function getTradeCount() external view returns (uint256) {
        return _allTradeIds.length;
    }

    // ============ Internal Functions ============

    function _transferFrom(address _token, address _from, address _to, uint256 _amount) 
        internal 
        returns (bool) 
    {
        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", _from, _to, _amount)
        );
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }

    function _transferOut(address _token, address _to, uint256 _amount) internal {
        if (_token == address(0)) {
            (bool success, ) = _to.call{value: _amount}("");
            if (!success) revert TransferFailed();
        } else {
            (bool success, bytes memory data) = _token.call(
                abi.encodeWithSignature("transfer(address,uint256)", _to, _amount)
            );
            if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
                revert TransferFailed();
            }
        }
    }
}
