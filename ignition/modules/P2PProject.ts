import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("P2PProjectModule", (m) => {
  const deployer = m.getAccount(0);
  // Using a second address for the required 2-owner minimum in MultiSigWallet.
  // In a real production environment, this would be a second trusted key.
  const secondOwner = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; 

  // 1. Deploy MultiSigWallet
  // The constructor expects: address[] owners, uint256 required
  const multiSig = m.contract("MultiSigWallet", [[deployer, secondOwner], 1]);

  // 2. Deploy Escrow Implementation
  const escrowImpl = m.contract("P2PEscrowV1");

  // 3. Deploy Proxy
  // The constructor expects: address _implementation, address _admin, bytes memory _data
  const initializeData = m.encodeFunctionCall(escrowImpl, "initialize", [multiSig]);
  const proxy = m.contract("ERC1967Proxy", [escrowImpl, multiSig, initializeData]);

  return { multiSig, escrowImpl, proxy };
});
