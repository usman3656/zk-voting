import { BrowserProvider } from 'ethers';

const HARDHAT_CHAIN_ID = 31337;
const HARDHAT_NETWORK = {
  chainId: `0x${HARDHAT_CHAIN_ID.toString(16)}`, // 0x7a69 in hex
  chainName: 'Hardhat Local',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [] as string[],
};

export async function switchToHardhatNetwork(ethereum: any): Promise<boolean> {
  try {
    // Try to switch to the network
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HARDHAT_NETWORK.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Try to add the network
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [HARDHAT_NETWORK],
        });
        return true;
      } catch (addError: any) {
        console.error('Error adding network:', addError);
        throw new Error(`Failed to add Hardhat network. Please add it manually. Error: ${addError.message}`);
      }
    } else {
      // Other error (e.g., user rejected)
      throw new Error(`Failed to switch network. Please switch to Hardhat Local network manually. Error: ${switchError.message}`);
    }
  }
}

export async function ensureHardhatNetwork(provider: BrowserProvider): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const network = await provider.getNetwork();
  
  if (network.chainId === BigInt(HARDHAT_CHAIN_ID)) {
    return; // Already on correct network
  }

  // Try to switch/add network
  await switchToHardhatNetwork(window.ethereum);
  
  // Wait a bit for network to switch
  await new Promise(resolve => setTimeout(resolve, 1000));
}

