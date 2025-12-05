// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// Network selection - can be 'hardhat', 'sepolia', 'goerli', 'holesky', or 'auto'
// 'auto' will use the network from VITE_NETWORK env var or default to hardhat
export const TARGET_NETWORK = import.meta.env.VITE_NETWORK || 'hardhat';

// Voting type constants (matches contract enum)
// In Solidity: enum VotingType { CANDIDATE_BASED = 0, ZK_CANDIDATE_BASED = 1 }
export const VotingType = {
  CANDIDATE_BASED: 0,
  ZK_CANDIDATE_BASED: 1, // Matches contract enum value
} as const;

// Import ABI from local JSON file
import contractABI from './contract-abi.json';

export const CONTRACT_ABI = contractABI as any[];

// Network configuration - will be set dynamically based on TARGET_NETWORK
import { getNetworkByName, getSupportedChainIds } from './networks';

export const SUPPORTED_CHAIN_IDS = getSupportedChainIds();
export const TARGET_NETWORK_CONFIG = getNetworkByName(TARGET_NETWORK);
