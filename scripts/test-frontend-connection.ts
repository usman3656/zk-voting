import { JsonRpcProvider, Contract } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function testFrontendConnection() {
  console.log("=".repeat(70));
  console.log("🧪 TESTING FRONTEND CONNECTION (Like Browser Does)");
  console.log("=".repeat(70));

  // Step 1: Get contract address from .env
  console.log("\n📡 Step 1: Reading contract address from frontend/.env...");
  const envPath = path.resolve(process.cwd(), "frontend/.env");
  let contractAddress = "";
  
  try {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/VITE_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})/i);
    if (match) {
      contractAddress = match[1];
      console.log(`   ✅ Contract address: ${contractAddress}`);
    } else {
      throw new Error("Contract address not found in .env");
    }
  } catch (error: any) {
    console.error(`   ❌ Cannot read .env: ${error.message}`);
    process.exit(1);
  }

  // Step 2: Connect to Hardhat node like frontend does (via JSON-RPC)
  console.log("\n🔌 Step 2: Connecting to Hardhat node (like frontend)...");
  const rpcUrl = "http://127.0.0.1:8545";
  const provider = new JsonRpcProvider(rpcUrl);
  
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Connected! Current block: ${blockNumber}`);
  } catch (error: any) {
    console.error(`   ❌ Cannot connect to ${rpcUrl}`);
    console.error(`   Make sure Hardhat node is running: npm run node`);
    process.exit(1);
  }

  // Step 3: Check network
  console.log("\n🌐 Step 3: Checking network...");
  try {
    const network = await provider.getNetwork();
    console.log(`   Chain ID: ${network.chainId.toString()}`);
    console.log(`   Name: ${network.name}`);
    if (network.chainId !== 31337n) {
      console.error(`   ⚠️  WARNING: Expected Chain ID 31337 (Hardhat)`);
    }
  } catch (error: any) {
    console.error(`   ❌ Cannot get network: ${error.message}`);
  }

  // Step 4: Check if contract exists
  console.log("\n🔍 Step 4: Checking if contract exists at address...");
  try {
    const code = await provider.getCode(contractAddress);
    console.log(`   Code length: ${code.length} bytes`);
    
    if (!code || code === "0x" || code === "0x0" || code.length <= 2) {
      console.error(`   ❌❌❌ CONTRACT DOES NOT EXIST AT THIS ADDRESS! ❌❌❌`);
      console.error(`\n   This is the problem!`);
      console.error(`   The contract address ${contractAddress} has no code.`);
      console.error(`\n   Possible causes:`);
      console.error(`   1. Hardhat node was restarted (blockchain reset)`);
      console.error(`   2. Contract was never deployed to this address`);
      console.error(`   3. Wrong network (contract deployed to different network)`);
      console.error(`\n   Solution: Deploy the contract again!`);
      process.exit(1);
    }
    console.log(`   ✅ Contract code exists!`);
  } catch (error: any) {
    console.error(`   ❌ Error checking contract: ${error.message}`);
    process.exit(1);
  }

  // Step 5: Load ABI
  console.log("\n📋 Step 5: Loading contract ABI...");
  let contractABI: any[];
  try {
    const artifactsPath = path.resolve(process.cwd(), "artifacts/contracts/SimpleVoting.sol/SimpleVoting.json");
    const artifacts = JSON.parse(fs.readFileSync(artifactsPath, "utf-8"));
    contractABI = artifacts.abi;
    console.log(`   ✅ Loaded ABI with ${contractABI.length} entries`);
  } catch (error: any) {
    console.error(`   ❌ Cannot load ABI: ${error.message}`);
    process.exit(1);
  }

  // Step 6: Create contract instance (read-only, like frontend first does)
  console.log("\n📝 Step 6: Creating contract instance (read-only)...");
  const contract = new Contract(contractAddress, contractABI, provider);
  console.log(`   ✅ Contract instance created`);

  // Step 7: Test proposalCount() - EXACTLY what frontend does
  console.log("\n🧪 Step 7: Testing proposalCount() call...");
  try {
    const count = await contract.proposalCount();
    console.log(`   ✅ proposalCount() = ${count.toString()}`);
  } catch (error: any) {
    console.error(`   ❌❌❌ proposalCount() FAILED! ❌❌❌`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    if (error.info) {
      console.error(`   Info:`, error.info);
    }
    console.error(`\n   This is the EXACT error your frontend is seeing!`);
    process.exit(1);
  }

  // Step 8: Test getVoterCount()
  console.log("\n🧪 Step 8: Testing getVoterCount() call...");
  try {
    const vCount = await contract.getVoterCount();
    console.log(`   ✅ getVoterCount() = ${vCount.toString()}`);
  } catch (error: any) {
    console.error(`   ❌ getVoterCount() FAILED: ${error.message}`);
    process.exit(1);
  }

  // Step 9: Test owner()
  console.log("\n🧪 Step 9: Testing owner() call...");
  try {
    const owner = await contract.owner();
    console.log(`   ✅ owner() = ${owner}`);
  } catch (error: any) {
    console.error(`   ❌ owner() FAILED: ${error.message}`);
    process.exit(1);
  }

  // Step 10: Test with signer (like frontend does for transactions)
  console.log("\n👤 Step 10: Testing with signer (for transactions)...");
  try {
    // Get first account's private key (like MetaMask would)
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      const signer = await provider.getSigner(accounts[0].address);
      const contractWithSigner = new Contract(contractAddress, contractABI, signer);
      const owner = await contractWithSigner.owner();
      console.log(`   ✅ Contract with signer works`);
      console.log(`   Signer address: ${accounts[0].address}`);
      console.log(`   Contract owner: ${owner}`);
    } else {
      console.log(`   ⚠️  No accounts available (but this is OK for read-only)`);
    }
  } catch (error: any) {
    console.error(`   ⚠️  Signer test failed: ${error.message} (this might be OK)`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ ALL TESTS PASSED - CONTRACT IS WORKING!");
  console.log("=".repeat(70));
  console.log(`\n📋 Summary:`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   RPC URL: ${rpcUrl}`);
  console.log(`   Contract exists: ✅ YES`);
  console.log(`   All read methods work: ✅ YES`);
  console.log(`\n💡 If your frontend still fails, the issue is:`);
  console.log(`   1. Frontend is using wrong contract address`);
  console.log(`   2. Frontend is connected to wrong network`);
  console.log(`   3. Frontend needs to be restarted to pick up new .env`);
  console.log("\n" + "=".repeat(70));
}

testFrontendConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ TEST FAILED:", error);
    console.error("\nFull error stack:", error.stack);
    process.exit(1);
  });

