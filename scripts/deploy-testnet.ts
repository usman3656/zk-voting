import { network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

async function deployContract(networkName: string): Promise<string> {
  console.log(`\n📦 Deploying contract to ${networkName}...`);
  
  const { ethers } = await network.connect();
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    throw new Error('Deployer account has no balance. Please fund the account with testnet ETH.');
  }
  
  const VotingFactory = await ethers.getContractFactory('SimpleVoting');
  console.log('Deploying contract...');
  const voting = await VotingFactory.deploy();
  await voting.waitForDeployment();
  
  const address = await voting.getAddress();
  const owner = await voting.owner();
  
  console.log(`✅ Contract deployed to: ${address}`);
  console.log(`   Owner: ${owner}`);
  console.log(`   Network: ${networkName}`);
  
  // Get network info
  const networkInfo = await ethers.provider.getNetwork();
  console.log(`   Chain ID: ${networkInfo.chainId}`);
  
  return address;
}

function updateEnvFile(contractAddress: string, networkName: string) {
  const envPath = path.join(frontendDir, '.env');
  let envContent = '';
  
  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add contract address
  if (envContent.includes('VITE_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/VITE_CONTRACT_ADDRESS=.*/g, `VITE_CONTRACT_ADDRESS=${contractAddress}`);
  } else {
    envContent += `\nVITE_CONTRACT_ADDRESS=${contractAddress}`;
  }
  
  // Update or add network
  if (envContent.includes('VITE_NETWORK=')) {
    envContent = envContent.replace(/VITE_NETWORK=.*/g, `VITE_NETWORK=${networkName}`);
  } else {
    envContent += `\nVITE_NETWORK=${networkName}`;
  }
  
  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  console.log(`✅ Updated frontend/.env with contract address and network`);
}

async function main() {
  // Get network name from command line arguments or environment
  // Hardhat sets HARDHAT_NETWORK when using --network flag
  const networkName = process.env.HARDHAT_NETWORK || 'sepolia';
  
  console.log('='.repeat(70));
  console.log(`🚀 DEPLOYING TO ${networkName.toUpperCase()}`);
  console.log('='.repeat(70));
  
  // Check if it's a testnet
  const testnets = ['sepolia', 'goerli', 'holesky'];
  const isTestnet = testnets.includes(networkName);
  
  if (isTestnet) {
    console.log(`\n⚠️  Deploying to ${networkName} testnet`);
    console.log('   Make sure you have:');
    console.log(`   1. ${networkName.toUpperCase()}_RPC_URL set in your .env file`);
    console.log(`   2. ${networkName.toUpperCase()}_PRIVATE_KEY set in your .env file`);
    console.log(`   3. Testnet ETH in your deployer account\n`);
    
    // Check environment variables (dotenv should have loaded them)
    const rpcUrl = process.env[`${networkName.toUpperCase()}_RPC_URL`];
    const privateKey = process.env[`${networkName.toUpperCase()}_PRIVATE_KEY`];
    
    console.log(`\n📋 Checking environment variables...`);
    console.log(`   ${networkName.toUpperCase()}_RPC_URL: ${rpcUrl ? '✅ Set' : '❌ Not set'}`);
    console.log(`   ${networkName.toUpperCase()}_PRIVATE_KEY: ${privateKey ? '✅ Set' : '❌ Not set'}`);
    
    if (!rpcUrl) {
      console.error(`\n❌ Error: ${networkName.toUpperCase()}_RPC_URL is not set!`);
      console.log(`\n💡 Please create a .env file in the root directory with:`);
      console.log(`   ${networkName.toUpperCase()}_RPC_URL=https://rpc.sepolia.org`);
      console.log(`   Or use Infura: https://sepolia.infura.io/v3/YOUR_KEY`);
      console.log(`\n📝 Example .env file:`);
      console.log(`   SEPOLIA_RPC_URL=https://rpc.sepolia.org`);
      console.log(`   SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE`);
      process.exit(1);
    }
    
    if (!privateKey) {
      console.error(`\n❌ Error: ${networkName.toUpperCase()}_PRIVATE_KEY is not set!`);
      console.log(`\n💡 Please create a .env file in the root directory with:`);
      console.log(`   ${networkName.toUpperCase()}_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE`);
      console.log(`\n📝 Example .env file:`);
      console.log(`   SEPOLIA_RPC_URL=https://rpc.sepolia.org`);
      console.log(`   SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE`);
      process.exit(1);
    }
    
    console.log(`\n✅ Environment variables loaded successfully!\n`);
  }
  
  try {
    // Deploy contract
    const contractAddress = await deployContract(networkName);
    
    // Update frontend .env
    updateEnvFile(contractAddress, networkName);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('='.repeat(70));
    console.log(`\n📝 Summary:`);
    console.log(`   • Contract deployed to: ${contractAddress}`);
    console.log(`   • Network: ${networkName}`);
    console.log(`   • Frontend .env updated`);
    console.log(`\n🌐 Next steps:`);
    console.log(`   1. Update frontend/.env with VITE_NETWORK=${networkName}`);
    console.log(`   2. Start frontend: cd frontend && npm run dev`);
    console.log(`   3. Connect MetaMask to ${networkName} network`);
    console.log(`   4. Use the contract at: ${contractAddress}`);
    if (isTestnet) {
      console.log(`\n📊 View on block explorer:`);
      const explorerUrls: Record<string, string> = {
        sepolia: `https://sepolia.etherscan.io/address/${contractAddress}`,
        goerli: `https://goerli.etherscan.io/address/${contractAddress}`,
        holesky: `https://holesky.etherscan.io/address/${contractAddress}`,
      };
      if (explorerUrls[networkName]) {
        console.log(`   ${explorerUrls[networkName]}`);
      }
    }
    console.log('\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during deployment:', error.message || error);
    if (isTestnet) {
      console.log(`\n💡 Make sure you have:`);
      console.log(`   • ${networkName.toUpperCase()}_RPC_URL environment variable set`);
      console.log(`   • ${networkName.toUpperCase()}_PRIVATE_KEY environment variable set`);
      console.log(`   • Testnet ETH in your deployer account`);
    }
    process.exit(1);
  }
}

main();

