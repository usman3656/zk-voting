import { spawn } from 'child_process';
import { network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

// Hardhat default accounts (first 5)
const HARDHAT_ACCOUNTS = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    balance: '10000 ETH'
  },
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    balance: '10000 ETH'
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    balance: '10000 ETH'
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    balance: '10000 ETH'
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    balance: '10000 ETH'
  },
];

async function waitForRPC(maxWait = 30000) {
  const startTime = Date.now();
  console.log('⏳ Waiting for Hardhat node to be ready...');
  
  while (Date.now() - startTime < maxWait) {
    try {
      const { ethers } = await network.connect();
      await ethers.provider.getBlockNumber();
      console.log('✅ Hardhat node is ready!');
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Hardhat node did not start in time');
}

async function deployContract(): Promise<string> {
  console.log('\n📦 Deploying contract to localhost...');
  
  try {
    const { ethers } = await network.connect();
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    
    console.log(`Deploying with account: ${deployer.address}`);
    
    const VotingFactory = await ethers.getContractFactory('SimpleVoting');
    const voting = await VotingFactory.deploy();
    await voting.waitForDeployment();
    
    const address = await voting.getAddress();
    const owner = await voting.owner();
    
    console.log(`✅ Contract deployed to: ${address}`);
    console.log(`   Owner: ${owner}`);
    
    return address;
  } catch (error) {
    console.error('Deployment error:', error);
    throw error;
  }
}

function updateEnvFile(contractAddress: string) {
  const envPath = path.join(frontendDir, '.env');
  const envContent = `VITE_CONTRACT_ADDRESS=${contractAddress}\n`;
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`✅ Updated frontend/.env with contract address`);
}

function saveAccountsToFrontend(accounts: typeof HARDHAT_ACCOUNTS, contractAddress: string) {
  const accountsWithRoles = accounts.map((acc, index) => ({
    ...acc,
    role: index === 0 ? 'Owner (Contract Owner)' : 'Voter',
    isOwner: index === 0,
  }));

  // Ensure public directory exists
  const publicDir = path.join(frontendDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const accountsPath = path.join(publicDir, 'hardhat-accounts.json');
  fs.writeFileSync(accountsPath, JSON.stringify({
    accounts: accountsWithRoles,
    contractAddress,
    network: {
      name: 'Hardhat Local',
      chainId: 31337,
      rpcUrl: 'http://127.0.0.1:8545'
    },
    generatedAt: new Date().toISOString()
  }, null, 2), 'utf8');
  
  console.log(`✅ Saved accounts info to frontend/public/hardhat-accounts.json`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 AUTOMATED SETUP: Deploying Contract');
  console.log('='.repeat(70));
  console.log('\n⚠️  Make sure Hardhat node is running first!');
  console.log('   Run in a separate terminal: npm run node\n');
  
  try {
    // Wait for node to be ready
    await waitForRPC();
    
    // Deploy contract
    const contractAddress = await deployContract();
    
    // Update frontend .env
    updateEnvFile(contractAddress);
    
    // Save accounts to frontend
    saveAccountsToFrontend(HARDHAT_ACCOUNTS, contractAddress);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ SETUP COMPLETE!');
    console.log('='.repeat(70));
    console.log(`\n📝 Summary:`);
    console.log(`   • Contract deployed to: ${contractAddress}`);
    console.log(`   • Frontend .env updated`);
    console.log(`   • Accounts saved to frontend/public/hardhat-accounts.json`);
    console.log(`\n👤 Owner Account (Account 1):`);
    console.log(`   Address: ${HARDHAT_ACCOUNTS[0].address}`);
    console.log(`   Private Key: ${HARDHAT_ACCOUNTS[0].privateKey}`);
    console.log(`\n🌐 Next steps:`);
    console.log(`   1. Start frontend: cd frontend && npm run dev`);
    console.log(`   2. Accounts will be displayed on the frontend`);
    console.log(`   3. Import Account 1 private key into MetaMask (Owner)`);
    console.log(`   4. Switch MetaMask to Hardhat Local network (Chain ID: 31337)`);
    console.log('\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during setup:', error.message || error);
    console.log('\n💡 Make sure Hardhat node is running: npm run node');
    process.exit(1);
  }
}

main();

