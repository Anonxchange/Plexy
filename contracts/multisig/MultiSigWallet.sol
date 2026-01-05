// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MultiSigWallet
 * @dev Multi-signature wallet for proxy admin and escrow operations
 * @notice Requires M-of-N signatures for transaction execution
 */
contract MultiSigWallet {
    // ============ Events ============
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event RequirementChanged(uint256 required);
    event TransactionSubmitted(uint256 indexed txId, address indexed submitter);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event TransactionFailed(uint256 indexed txId);
    event Deposit(address indexed sender, uint256 value);

    // ============ Errors ============
    error NotOwner();
    error NotEnoughOwners();
    error TooManyOwners();
    error InvalidRequirement();
    error OwnerExists();
    error OwnerDoesNotExist();
    error TransactionDoesNotExist();
    error TransactionAlreadyExecuted();
    error TransactionAlreadyConfirmed();
    error TransactionNotConfirmed();
    error ExecutionFailed();
    error ZeroAddress();

    // ============ Structs ============
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    // ============ State Variables ============
    uint256 public constant MAX_OWNERS = 10;
    
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;
    
    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;

    // ============ Modifiers ============
    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotOwner();
        _;
    }

    modifier onlyWallet() {
        require(msg.sender == address(this), "Only wallet");
        _;
    }

    modifier txExists(uint256 _txId) {
        if (_txId >= transactions.length) revert TransactionDoesNotExist();
        _;
    }

    modifier notExecuted(uint256 _txId) {
        if (transactions[_txId].executed) revert TransactionAlreadyExecuted();
        _;
    }

    modifier notConfirmed(uint256 _txId) {
        if (confirmations[_txId][msg.sender]) revert TransactionAlreadyConfirmed();
        _;
    }

    // ============ Constructor ============
    /**
     * @dev Initialize the multi-sig wallet
     * @param _owners Array of initial owner addresses
     * @param _required Number of required confirmations
     */
    constructor(address[] memory _owners, uint256 _required) {
        if (_owners.length < 2) revert NotEnoughOwners();
        if (_owners.length > MAX_OWNERS) revert TooManyOwners();
        if (_required < 1 || _required > _owners.length) revert InvalidRequirement();

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            if (owner == address(0)) revert ZeroAddress();
            if (isOwner[owner]) revert OwnerExists();

            isOwner[owner] = true;
            owners.push(owner);
            emit OwnerAdded(owner);
        }

        required = _required;
        emit RequirementChanged(_required);
    }

    // ============ External Functions ============

    /**
     * @dev Submit a new transaction for approval
     * @param _to Target address
     * @param _value ETH value to send
     * @param _data Transaction calldata
     * @return txId The transaction ID
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external onlyOwner returns (uint256 txId) {
        if (_to == address(0)) revert ZeroAddress();

        txId = transactions.length;
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            confirmations: 0
        }));

        emit TransactionSubmitted(txId, msg.sender);
        
        // Auto-confirm by submitter
        _confirmTransaction(txId);
    }

    /**
     * @dev Confirm a pending transaction
     * @param _txId Transaction ID to confirm
     */
    function confirmTransaction(uint256 _txId) 
        external 
        onlyOwner 
        txExists(_txId) 
        notExecuted(_txId) 
        notConfirmed(_txId) 
    {
        _confirmTransaction(_txId);
    }

    /**
     * @dev Revoke a confirmation
     * @param _txId Transaction ID to revoke confirmation from
     */
    function revokeConfirmation(uint256 _txId) 
        external 
        onlyOwner 
        txExists(_txId) 
        notExecuted(_txId) 
    {
        if (!confirmations[_txId][msg.sender]) revert TransactionNotConfirmed();

        confirmations[_txId][msg.sender] = false;
        transactions[_txId].confirmations--;

        emit TransactionRevoked(_txId, msg.sender);
    }

    /**
     * @dev Execute a confirmed transaction
     * @param _txId Transaction ID to execute
     */
    function executeTransaction(uint256 _txId) 
        external 
        onlyOwner 
        txExists(_txId) 
        notExecuted(_txId) 
    {
        Transaction storage txn = transactions[_txId];
        
        if (txn.confirmations < required) {
            revert ExecutionFailed();
        }

        txn.executed = true;

        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        
        if (success) {
            emit TransactionExecuted(_txId);
        } else {
            txn.executed = false;
            emit TransactionFailed(_txId);
            revert ExecutionFailed();
        }
    }

    // ============ Owner Management (via multi-sig) ============

    /**
     * @dev Add a new owner (must be called via multi-sig)
     * @param _owner Address of new owner
     */
    function addOwner(address _owner) external onlyWallet {
        if (_owner == address(0)) revert ZeroAddress();
        if (isOwner[_owner]) revert OwnerExists();
        if (owners.length >= MAX_OWNERS) revert TooManyOwners();

        isOwner[_owner] = true;
        owners.push(_owner);
        emit OwnerAdded(_owner);
    }

    /**
     * @dev Remove an owner (must be called via multi-sig)
     * @param _owner Address of owner to remove
     */
    function removeOwner(address _owner) external onlyWallet {
        if (!isOwner[_owner]) revert OwnerDoesNotExist();
        if (owners.length - 1 < required) revert InvalidRequirement();
        if (owners.length <= 2) revert NotEnoughOwners();

        isOwner[_owner] = false;

        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(_owner);
    }

    /**
     * @dev Change required confirmations (must be called via multi-sig)
     * @param _required New required confirmation count
     */
    function changeRequirement(uint256 _required) external onlyWallet {
        if (_required < 1 || _required > owners.length) revert InvalidRequirement();
        required = _required;
        emit RequirementChanged(_required);
    }

    // ============ View Functions ============

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 _txId) external view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 numConfirmations
    ) {
        Transaction storage txn = transactions[_txId];
        return (txn.to, txn.value, txn.data, txn.executed, txn.confirmations);
    }

    function isConfirmed(uint256 _txId) external view returns (bool) {
        return transactions[_txId].confirmations >= required;
    }

    function getConfirmationCount(uint256 _txId) external view returns (uint256) {
        return transactions[_txId].confirmations;
    }

    // ============ Internal Functions ============

    function _confirmTransaction(uint256 _txId) internal {
        confirmations[_txId][msg.sender] = true;
        transactions[_txId].confirmations++;
        emit TransactionConfirmed(_txId, msg.sender);
    }

    // ============ Receive ============
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
