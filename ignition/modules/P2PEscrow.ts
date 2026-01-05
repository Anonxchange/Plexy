import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("P2PEscrowModule", (m) => {
  const adminAddress = m.getAccount(0); // Using the deployer as initial admin
  
  const escrow = m.contract("P2PEscrowV1");
  
  m.call(escrow, "initialize", [adminAddress]);

  return { escrow };
});
