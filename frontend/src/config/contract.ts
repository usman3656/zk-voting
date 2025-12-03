// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// Voting type constants (matches contract enum)
export const VotingType = {
  CANDIDATE_BASED: 0,
  YES_NO: 1,
} as const;

// Import ABI from local JSON file
import contractABI from './contract-abi.json';

export const CONTRACT_ABI = contractABI as any[];

// Network configuration
export const SUPPORTED_CHAIN_ID = 31337; // Hardhat/Localhost
