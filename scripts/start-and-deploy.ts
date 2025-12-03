import { spawn } from 'child_process';
import { network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Hardhat default accounts and private keys (first 5)
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

interface AccountInfo {
  address: string;
  privateKey: string;
  balance: string;
  role?: string;
}

async function waitForNode(maxWait = 30000) {
  console.log('⏳ Waiting for Hardhat node to be ready...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const { ethers } = await network.connect();
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log(`✅ Hardhat node is ready! (Block: ${blockNumber})`);
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error('Hardhat node did not start in time');
}

async function startHardhatNode(): Promise<{ process: any; accounts: AccountInfo[] }> {
  console.log('🚀 Starting Hardhat node...');
  
  const nodeProcess = spawn('npx', ['hardhat', 'node'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  let nodeReady = false;
  let outputBuffer = '';

  nodeProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    outputBuffer += output;
    process.stdout.write(output);
    
    if (output.includes('Started HTTP') && !nodeReady) {
      nodeReady = true;
    }
  });

  nodeProcess.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(data);
  });

  // Wait for node to be ready
  await new Promise((resolve) => {
    const checkReady = setInterval(() => {
      if (nodeReady) {
        clearInterval(checkReady);
        setTimeout(resolve, 2000); // Give it a bit more time to fully start
      }
    }, 500);
  });

  // Wait for RPC to be accessible
  await waitForNode();

  return { process: nodeProcess, accounts: HARDHAT_ACCOUNTS };
}

async function deployContract(): Promise<string> {
  console.log('\n📦 Deploying contract...');
  
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
}

function updateEnvFile(contractAddress: string) {
  const envPath = path.join(rootDir, 'frontend', '.env');
  const envContent = `VITE_CONTRACT_ADDRESS=${contractAddress}\n`;
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`\n✅ Updated frontend/.env with contract address: ${contractAddress}`);
}

function saveAccountsToFrontend(accounts: AccountInfo[], contractAddress: string) {
  const accountsWithRoles = accounts.map((acc, index) => ({
    ...acc,
    role: index === 0 ? 'Owner (Contract Owner)' : 'Voter',
    isOwner: index === 0,
    contractAddress: contractAddress
  }));

  // Save to JSON file in frontend public directory so it can be accessed
  const publicDir = path.join(rootDir, 'frontend', 'public');
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
  
  console.log(`\n✅ Saved accounts info to frontend/public/hardhat-accounts.json`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 AUTOMATED SETUP: Starting Hardhat Node + Deployment');
  console.log('='.repeat(70));
  
  let nodeProcess: any = null;
  
  try {
    // Step 1: Start Hardhat node
    const { process, accounts } = await startHardhatNode();
    nodeProcess = process;
    
    console.log('\n📋 Available Accounts:');
    console.log('-'.repeat(70));
    accounts.forEach((acc, index) => {
      const role = index === 0 ? '(Owner)' : '(Voter)';
      console.log(`Account ${index + 1}: ${acc.address} ${role}`);
      console.log(`  Private Key: ${acc.privateKey}`);
      console.log(`  Balance: ${acc.balance}\n`);
    });
    
    // Step 2: Deploy contract
    const contractAddress = await deployContract();
    
    // Step 3: Update frontend .env
    updateEnvFile(contractAddress);
    
    // Step 4: Save accounts to frontend
    saveAccountsToFrontend(accounts, contractAddress);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ SETUP COMPLETE!');
    console.log('='.repeat(70));
    console.log(`\n📝 Summary:`);
    console.log(`   • Hardhat node running on http://127.0.0.1:8545`);
    console.log(`   • Contract deployed to: ${contractAddress}`);
    console.log(`   • Frontend .env updated`);
    console.log(`   • Accounts saved to frontend/public/hardhat-accounts.json`);
    console.log(`\n👤 Owner Account (Account 1):`);
    console.log(`   Address: ${accounts[0].address}`);
    console.log(`   Private Key: ${accounts[0].privateKey}`);
    console.log(`\n⚠️  Keep this process running! Press Ctrl+C to stop.`);
    console.log(`\n🌐 Next steps:`);
    console.log(`   1. Start frontend: cd frontend && npm run dev`);
    console.log(`   2. Open browser and connect MetaMask`);
    console.log(`   3. Import Account 1 (Owner) private key into MetaMask`);
    console.log(`   4. Switch MetaMask to Hardhat Local network (Chain ID: 31337)`);
    console.log('\n');
    
    // Keep the node running
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down Hardhat node...');
      if (nodeProcess) {
        nodeProcess.kill();
      }
      process.exit(0);
    });
    
    // Keep process alive
    await new Promise(() => {});
    
  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    if (nodeProcess) {
      nodeProcess.kill();
    }
    process.exit(1);
  }
}

main();

