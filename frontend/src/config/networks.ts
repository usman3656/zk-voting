// Network configuration for supported networks
export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  hardhat: {
    chainId: 31337,
    chainIdHex: '0x7a69',
    name: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: [],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  sepolia: {
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    name: 'Sepolia',
    rpcUrls: [
      'https://rpc.sepolia.org',
      'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      'https://sepolia.gateway.tenderly.co',
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  goerli: {
    chainId: 5,
    chainIdHex: '0x5',
    name: 'Goerli',
    rpcUrls: [
      'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
      'https://rpc.ankr.com/eth_goerli',
    ],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  holesky: {
    chainId: 17000,
    chainIdHex: '0x4268',
    name: 'Holesky',
    rpcUrls: [
      'https://holesky.infura.io/v3/YOUR_INFURA_KEY',
      'https://rpc.holesky.ethpandaops.io',
    ],
    blockExplorerUrls: ['https://holesky.etherscan.io'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Get network config by chain ID
export function getNetworkByChainId(chainId: bigint | number): NetworkConfig | null {
  const id = typeof chainId === 'bigint' ? Number(chainId) : chainId;
  return Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === id) || null;
}

// Get network config by name
export function getNetworkByName(name: string): NetworkConfig | null {
  return SUPPORTED_NETWORKS[name.toLowerCase()] || null;
}

// Get all supported chain IDs
export function getSupportedChainIds(): number[] {
  return Object.values(SUPPORTED_NETWORKS).map(net => net.chainId);
}

// Check if a chain ID is supported
export function isChainIdSupported(chainId: bigint | number): boolean {
  return getNetworkByChainId(chainId) !== null;
}

