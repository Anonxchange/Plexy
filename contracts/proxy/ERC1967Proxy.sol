// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ERC1967Proxy
 * @dev Upgradeable proxy following ERC1967 standard
 * @notice Deploy this proxy pointing to your implementation contract
 */
contract ERC1967Proxy {
    // ERC1967 implementation slot
    bytes32 private constant IMPLEMENTATION_SLOT = 
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    
    // ERC1967 admin slot
    bytes32 private constant ADMIN_SLOT = 
        0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    event Upgraded(address indexed implementation);
    event AdminChanged(address previousAdmin, address newAdmin);

    error InvalidImplementation();
    error NotAdmin();
    error InvalidAdmin();

    /**
     * @dev Initializes the proxy with an implementation and admin
     * @param _implementation Address of the initial implementation
     * @param _admin Address of the proxy admin (should be MultiSig)
     * @param _data Initialization calldata
     */
    constructor(address _implementation, address _admin, bytes memory _data) {
        if (_implementation == address(0) || _implementation.code.length == 0) {
            revert InvalidImplementation();
        }
        if (_admin == address(0)) {
            revert InvalidAdmin();
        }

        _setImplementation(_implementation);
        _setAdmin(_admin);

        if (_data.length > 0) {
            (bool success, bytes memory returndata) = _implementation.delegatecall(_data);
            if (!success) {
                if (returndata.length > 0) {
                    assembly {
                        revert(add(32, returndata), mload(returndata))
                    }
                } else {
                    revert("Initialization failed");
                }
            }
        }
    }

    /**
     * @dev Modifier to restrict access to admin only
     */
    modifier onlyAdmin() {
        if (msg.sender != _getAdmin()) {
            revert NotAdmin();
        }
        _;
    }

    /**
     * @dev Upgrade the implementation contract
     * @param newImplementation Address of the new implementation
     */
    function upgradeTo(address newImplementation) external onlyAdmin {
        if (newImplementation == address(0) || newImplementation.code.length == 0) {
            revert InvalidImplementation();
        }
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }

    /**
     * @dev Upgrade and call initialization function
     * @param newImplementation Address of the new implementation
     * @param data Initialization calldata
     */
    function upgradeToAndCall(address newImplementation, bytes memory data) external onlyAdmin {
        if (newImplementation == address(0) || newImplementation.code.length == 0) {
            revert InvalidImplementation();
        }
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);

        if (data.length > 0) {
            (bool success, bytes memory returndata) = newImplementation.delegatecall(data);
            if (!success) {
                if (returndata.length > 0) {
                    assembly {
                        revert(add(32, returndata), mload(returndata))
                    }
                } else {
                    revert("Upgrade call failed");
                }
            }
        }
    }

    /**
     * @dev Change the admin address
     * @param newAdmin Address of the new admin
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) {
            revert InvalidAdmin();
        }
        address previousAdmin = _getAdmin();
        _setAdmin(newAdmin);
        emit AdminChanged(previousAdmin, newAdmin);
    }

    /**
     * @dev Returns the current implementation address
     */
    function implementation() external view returns (address) {
        return _getImplementation();
    }

    /**
     * @dev Returns the current admin address
     */
    function admin() external view returns (address) {
        return _getAdmin();
    }

    /**
     * @dev Fallback function delegates all calls to implementation
     */
    fallback() external payable {
        _delegate(_getImplementation());
    }

    /**
     * @dev Receive function for plain ETH transfers
     */
    receive() external payable {}

    // ============ Internal Functions ============

    function _delegate(address impl) internal {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    function _getImplementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }

    function _setImplementation(address newImplementation) internal {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }
    }

    function _getAdmin() internal view returns (address adm) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            adm := sload(slot)
        }
    }

    function _setAdmin(address newAdmin) internal {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            sstore(slot, newAdmin)
        }
    }
}
