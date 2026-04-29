const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // ============ Configuration ============
  // Multi-sig owners (REPLACE WITH YOUR ADDRESSES)
  const owners = [
    deployer.address,
    // Add more owner addresses here
    // "0x...",
    // "0x...",
  ];
  const requiredConfirmations = 1; // Change to 2 for 2-of-3, etc.

  // ============ Step 1: Deploy MultiSigWallet ============
  console.log("\n1. Deploying MultiSigWallet...");
  const MultiSigWallet = await ethers.getContractFactory("multisig/MultiSigWallet");
  const multiSig = await MultiSigWallet.deploy(owners, requiredConfirmations);
  await multiSig.waitForDeployment();
  const multiSigAddress = await multiSig.getAddress();
  console.log("   MultiSigWallet deployed to:", multiSigAddress);

  // ============ Step 2: Deploy P2PEscrowV1 Implementation ============
  console.log("\n2. Deploying P2PEscrowV1 implementation...");
  const P2PEscrowV1 = await ethers.getContractFactory("escrow/P2PEscrowV1");
  const escrowImpl = await P2PEscrowV1.deploy();
  await escrowImpl.waitForDeployment();
  const escrowImplAddress = await escrowImpl.getAddress();
  console.log("   P2PEscrowV1 implementation deployed to:", escrowImplAddress);

  // ============ Step 3: Prepare initialization data ============
  console.log("\n3. Preparing proxy initialization...");
  const initData = P2PEscrowV1.interface.encodeFunctionData("initialize", [multiSigAddress]);
  console.log("   Init data:", initData);

  // ============ Step 4: Deploy ERC1967Proxy ============
  console.log("\n4. Deploying ERC1967Proxy...");
  const ERC1967Proxy = await ethers.getContractFactory("proxy/ERC1967Proxy");
  const proxy = await ERC1967Proxy.deploy(escrowImplAddress, multiSigAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("   ERC1967Proxy deployed to:", proxyAddress);

  // ============ Step 5: Verify deployment ============
  console.log("\n5. Verifying deployment...");
  const escrow = P2PEscrowV1.attach(proxyAddress);
  const admin = await escrow.admin();
  console.log("   Escrow admin:", admin);
  console.log("   Admin matches MultiSig:", admin === multiSigAddress);

  // ============ Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:              ", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:             ", (await ethers.provider.getNetwork()).chainId.toString());
  console.log("MultiSigWallet:       ", multiSigAddress);
  console.log("P2PEscrowV1 (impl):   ", escrowImplAddress);
  console.log("Proxy (use this):     ", proxyAddress);
  console.log("=".repeat(60));
  console.log("\nIMPORTANT: Use the Proxy address for all escrow interactions!");
  console.log("\nNext steps:");
  console.log("1. Add moderators via MultiSig: escrow.addModerator(address)");
  console.log("2. Add supported ERC20 tokens: escrow.setSupportedToken(tokenAddress, true)");

  // Return addresses for verification scripts
  return {
    multiSig: multiSigAddress,
    implementation: escrowImplAddress,
    proxy: proxyAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
