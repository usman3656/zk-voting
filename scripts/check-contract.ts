import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkContract() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  // Check both old and new addresses
  const oldAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const newAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
  
  console.log('Checking contracts...\n');
  
  // Check old address
  console.log('1. Old contract address:', oldAddress);
  await checkAddress(provider, oldAddress);
  
  console.log('\n');
  
  // Check new address
  console.log('2. New contract address (from .env):', newAddress);
  await checkAddress(provider, newAddress);
  
  process.exit(0);
}

async function checkAddress(provider: ethers.JsonRpcProvider, contractAddress: string) {
  
  console.log('Checking contract at:', contractAddress);
  console.log('RPC URL: http://127.0.0.1:8545\n');
  
  try {
    const code = await provider.getCode(contractAddress);
    const blockNumber = await provider.getBlockNumber();
    
    console.log('Block number:', blockNumber);
    console.log('Contract code length:', code.length);
    console.log('Is deployed:', code !== '0x' && code.length > 2);
    
    if (code === '0x' || code.length <= 2) {
      console.log('\n❌ Contract is NOT deployed at this address');
      console.log('💡 Solution: Run "npm run zk:deploy" to deploy the contract');
    } else {
      console.log('\n✅ Contract IS deployed at this address');
      
      // Try to call a simple function
      try {
        const contract = new ethers.Contract(
          contractAddress,
          ['function owner() view returns (address)'],
          provider
        );
        const owner = await contract.owner();
        console.log('Contract owner:', owner);
      } catch (e) {
        console.log('Could not read contract owner (this is OK if contract interface is different)');
      }
    }
  } catch (error: any) {
    console.error('❌ Error checking contract:', error.message);
    console.log('\n💡 Make sure Hardhat node is running: npm run node');
  }
}

checkContract();

