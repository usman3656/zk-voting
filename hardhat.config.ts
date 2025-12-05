import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
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
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 31337,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
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
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: configVariable("SEPOLIA_PRIVATE_KEY") ? [configVariable("SEPOLIA_PRIVATE_KEY")] : [],
      chainId: 11155111,
    },
    goerli: {
      type: "http",
      chainType: "l1",
      url: configVariable("GOERLI_RPC_URL"),
      accounts: configVariable("GOERLI_PRIVATE_KEY") ? [configVariable("GOERLI_PRIVATE_KEY")] : [],
      chainId: 5,
    },
    holesky: {
      type: "http",
      chainType: "l1",
      url: configVariable("HOLESKY_RPC_URL"),
      accounts: configVariable("HOLESKY_PRIVATE_KEY") ? [configVariable("HOLESKY_PRIVATE_KEY")] : [],
      chainId: 17000,
    },
  },
});
