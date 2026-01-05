const { run } = require("hardhat");

// Update these addresses after deployment
const DEPLOYED = {
  multiSig: "0x...",
  implementation: "0x...",
  proxy: "0x...",
};

// Update these to match your deployment configuration
const MULTISIG_OWNERS = [
  "0x...", // Owner 1
];
const REQUIRED_CONFIRMATIONS = 1;

async function main() {
  console.log("Verifying contracts on block explorer...\n");

  // Verify MultiSigWallet
  console.log("1. Verifying MultiSigWallet...");
  try {
    await run("verify:verify", {
      address: DEPLOYED.multiSig,
      constructorArguments: [MULTISIG_OWNERS, REQUIRED_CONFIRMATIONS],
      contract: "multisig/MultiSigWallet.sol:MultiSigWallet",
    });
    console.log("   ✓ MultiSigWallet verified");
  } catch (e) {
    console.log("   ✗ Error:", e.message);
  }

  // Verify P2PEscrowV1 implementation
  console.log("\n2. Verifying P2PEscrowV1 implementation...");
  try {
    await run("verify:verify", {
      address: DEPLOYED.implementation,
      constructorArguments: [],
      contract: "escrow/P2PEscrowV1.sol:P2PEscrowV1",
    });
    console.log("   ✓ P2PEscrowV1 verified");
  } catch (e) {
    console.log("   ✗ Error:", e.message);
  }

  // Verify ERC1967Proxy
  console.log("\n3. Verifying ERC1967Proxy...");
  try {
    const P2PEscrowV1 = await ethers.getContractFactory("escrow/P2PEscrowV1");
    const initData = P2PEscrowV1.interface.encodeFunctionData("initialize", [DEPLOYED.multiSig]);

    await run("verify:verify", {
      address: DEPLOYED.proxy,
      constructorArguments: [DEPLOYED.implementation, DEPLOYED.multiSig, initData],
      contract: "proxy/ERC1967Proxy.sol:ERC1967Proxy",
    });
    console.log("   ✓ ERC1967Proxy verified");
  } catch (e) {
    console.log("   ✗ Error:", e.message);
  }

  console.log("\nVerification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
