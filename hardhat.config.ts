import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "config/.env") });

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.VITE_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/87f84e81a6964ccda7887b8bded95cfb",
      accounts: process.env.VITE_SEPOLIA_PRIVATE_KEY 
        ? ["0x" + process.env.VITE_SEPOLIA_PRIVATE_KEY.replace(/^0x/, "")]
        : [],
    },
    bscTestnet: {
      type: "http",
      url: process.env.VITE_BSC_TESTNET_RPC_URL || "https://bsc-testnet-dataseed.bnbchain.org",
      chainId: 97,
      accounts: process.env.VITE_BSC_PRIVATE_KEY 
        ? ["0x" + process.env.VITE_BSC_PRIVATE_KEY.replace(/^0x/, "")]
        : [],
    },
  },
});

