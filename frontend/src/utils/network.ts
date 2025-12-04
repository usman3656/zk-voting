import { BrowserProvider } from 'ethers';
import { getNetworkByChainId, type NetworkConfig, SUPPORTED_NETWORKS } from '../config/networks';
import { TARGET_NETWORK, TARGET_NETWORK_CONFIG } from '../config/contract';

// Convert network config to MetaMask format
function networkToMetaMaskConfig(network: NetworkConfig) {
  return {
    chainId: network.chainIdHex,
    chainName: network.name,
    nativeCurrency: network.nativeCurrency,
    rpcUrls: network.rpcUrls,
    blockExplorerUrls: network.blockExplorerUrls,
  };
}

export async function switchToNetwork(ethereum: any, network: NetworkConfig): Promise<boolean> {
  try {
    // Try to switch to the network
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainIdHex }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Try to add the network
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkToMetaMaskConfig(network)],
        });
        return true;
      } catch (addError: any) {
        console.error('Error adding network:', addError);
        throw new Error(`Failed to add ${network.name} network. Please add it manually. Error: ${addError.message}`);
      }
    } else {
      // Other error (e.g., user rejected)
      throw new Error(`Failed to switch network. Please switch to ${network.name} network manually. Error: ${switchError.message}`);
    }
  }
}

export async function ensureTargetNetwork(provider: BrowserProvider): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  if (!TARGET_NETWORK_CONFIG) {
    throw new Error(`Target network "${TARGET_NETWORK}" is not supported. Supported networks: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`);
  }

  const network = await provider.getNetwork();
  const targetChainId = BigInt(TARGET_NETWORK_CONFIG.chainId);
  
  if (network.chainId === targetChainId) {
    return; // Already on correct network
  }

  // Try to switch/add network
  await switchToNetwork(window.ethereum, TARGET_NETWORK_CONFIG);
  
  // Wait a bit for network to switch
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Legacy function for backward compatibility
export async function ensureHardhatNetwork(provider: BrowserProvider): Promise<void> {
  return ensureTargetNetwork(provider);
}

// Check if current network is supported
export async function checkNetworkSupport(provider: BrowserProvider): Promise<{ supported: boolean; network: NetworkConfig | null }> {
  try {
    const network = await provider.getNetwork();
    const networkConfig = getNetworkByChainId(network.chainId);
    return {
      supported: networkConfig !== null,
      network: networkConfig,
    };
  } catch (error) {
    return {
      supported: false,
      network: null,
    };
  }
}

