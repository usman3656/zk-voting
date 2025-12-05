import { network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

/**
 * Deploy ZK Voting Contracts
 * 
 * This script deploys:
 * 1. ZKVotingVerifier - The verifier contract (generated from circuit)
 * 2. SimpleVoting - The main voting contract (with verifier address)
 * 
 * "Deploying contracts" means uploading the compiled Solidity code to a blockchain
 * network (local Hardhat network or testnet like Sepolia) so they can be used.
 */
async function deployZKContracts(networkName: string): Promise<{ verifierAddress: string; votingAddress: string }> {
  console.log(`\n📦 Deploying ZK contracts to ${networkName}...`);
  
  const { ethers } = await network.connect();
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  // Step 1: Deploy ZKVotingVerifier
  console.log('\n🔐 Step 1: Deploying ZKVotingVerifier...');
  const verifierPath = path.join(rootDir, 'contracts', 'ZKVotingVerifier.sol');
  
  if (!fs.existsSync(verifierPath)) {
    throw new Error(
      'ZKVotingVerifier.sol not found!\n' +
      'Please run: npm run zk:generate-verifier\n' +
      'This generates the verifier contract from your compiled circuit.'
    );
  }
  
  const VerifierFactory = await ethers.getContractFactory('Groth16Verifier');
  const verifier = await VerifierFactory.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  
  console.log(`✅ Groth16Verifier deployed to: ${verifierAddress}`);
  
  // Step 2: Deploy SimpleVoting with verifier address
  console.log('\n🗳️  Step 2: Deploying SimpleVoting with verifier...');
  const VotingFactory = await ethers.getContractFactory('SimpleVoting');
  const voting = await VotingFactory.deploy(verifierAddress);
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  
  console.log(`✅ SimpleVoting deployed to: ${votingAddress}`);
  console.log(`   Verifier address: ${verifierAddress}`);
  
  return { verifierAddress, votingAddress };
}

function updateEnvFile(contractAddress: string, networkName: string, verifierAddress: string) {
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
  
  // Add verifier address
  if (envContent.includes('VITE_VERIFIER_ADDRESS=')) {
    envContent = envContent.replace(/VITE_VERIFIER_ADDRESS=.*/g, `VITE_VERIFIER_ADDRESS=${verifierAddress}`);
  } else {
    envContent += `\nVITE_VERIFIER_ADDRESS=${verifierAddress}`;
  }
  
  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  console.log(`✅ Updated frontend/.env with contract addresses`);
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || 'hardhat';
  
  console.log('='.repeat(70));
  console.log('🚀 DEPLOYING ZK VOTING CONTRACTS');
  console.log('='.repeat(70));
  console.log(`\n📋 Network: ${networkName}`);
  console.log(`\n⚠️  Prerequisites:`);
  console.log(`   1. Circuit compiled: npm run zk:compile`);
  console.log(`   2. Trusted setup done: npm run zk:setup`);
  console.log(`   3. Verifier generated: npm run zk:generate-verifier`);
  console.log(`   4. Contracts compiled: npm run compile\n`);
  
  try {
    const { verifierAddress, votingAddress } = await deployZKContracts(networkName);
    
    // Update frontend .env
    updateEnvFile(votingAddress, networkName, verifierAddress);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('='.repeat(70));
    console.log(`\n📝 Summary:`);
    console.log(`   • ZKVotingVerifier: ${verifierAddress}`);
    console.log(`   • SimpleVoting: ${votingAddress}`);
    console.log(`   • Network: ${networkName}`);
    console.log(`   • Frontend .env updated`);
    console.log(`\n🌐 Next steps:`);
    console.log(`   1. Copy circuit files: npm run zk:copy-files`);
    console.log(`   2. Start frontend: cd frontend && npm run dev`);
    console.log(`   3. Create ZK proposals and vote!`);
    console.log('\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during deployment:', error.message || error);
    if (error.message.includes('ZKVotingVerifier.sol not found')) {
      console.log('\n💡 Run these commands first:');
      console.log('   npm run zk:compile');
      console.log('   npm run zk:setup');
      console.log('   npm run zk:generate-verifier');
    }
    process.exit(1);
  }
}

main();

