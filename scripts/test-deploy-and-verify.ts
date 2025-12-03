import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const { ethers } = await network.connect();

async function main() {
  console.log("=".repeat(70));
  console.log("🧪 COMPREHENSIVE DEPLOYMENT & VERIFICATION TEST");
  console.log("=".repeat(70));

  // Step 1: Check if node is running
  console.log("\n📡 Step 1: Checking Hardhat node connection...");
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`   ✅ Node is running - Current block: ${blockNumber}`);
  } catch (error) {
    console.error("   ❌ Cannot connect to Hardhat node!");
    console.error("   Make sure to run: npm run node");
    process.exit(1);
  }

  // Step 2: Deploy contract
  console.log("\n📦 Step 2: Deploying contract...");
  let contractAddress: string;
  let contractOwner: string;
  
  try {
    const voting = await ethers.deployContract("SimpleVoting");
    await voting.waitForDeployment();
    contractAddress = await voting.getAddress();
    contractOwner = await voting.owner();
    console.log(`   ✅ Contract deployed to: ${contractAddress}`);
    console.log(`   ✅ Owner: ${contractOwner}`);
  } catch (error: any) {
    console.error("   ❌ Deployment failed:", error.message);
    process.exit(1);
  }

  // Step 3: Verify contract exists
  console.log("\n🔍 Step 3: Verifying contract exists...");
  try {
    const code = await ethers.provider.getCode(contractAddress);
    if (!code || code === "0x" || code === "0x0") {
      console.error("   ❌ Contract has no code! Deployment failed!");
      process.exit(1);
    }
    console.log(`   ✅ Contract code exists (${code.length} bytes)`);
  } catch (error: any) {
    console.error("   ❌ Cannot verify contract:", error.message);
    process.exit(1);
  }

  // Step 4: Test contract functions
  console.log("\n🧪 Step 4: Testing contract functions...");
  try {
    const voting = await ethers.getContractAt("SimpleVoting", contractAddress);
    
    // Test proposalCount
    const proposalCount = await voting.proposalCount();
    console.log(`   ✅ proposalCount() works: ${proposalCount.toString()}`);
    
    // Test getVoterCount
    const voterCount = await voting.getVoterCount();
    console.log(`   ✅ getVoterCount() works: ${voterCount.toString()}`);
    
    // Test owner
    const owner = await voting.owner();
    console.log(`   ✅ owner() works: ${owner}`);
    
    // Verify owner matches
    if (owner.toLowerCase() !== contractOwner.toLowerCase()) {
      console.error("   ❌ Owner mismatch!");
      process.exit(1);
    }
    console.log(`   ✅ Owner matches deployment account`);
    
  } catch (error: any) {
    console.error("   ❌ Contract function test failed:", error.message);
    console.error("   Error details:", error);
    process.exit(1);
  }

  // Step 5: Update frontend .env
  console.log("\n📝 Step 5: Updating frontend/.env...");
  try {
    const envPath = path.resolve(process.cwd(), "frontend/.env");
    const envContent = `VITE_CONTRACT_ADDRESS=${contractAddress}\n`;
    fs.writeFileSync(envPath, envContent, "utf-8");
    console.log(`   ✅ Updated frontend/.env with: ${contractAddress}`);
    
    // Verify it was written
    const writtenContent = fs.readFileSync(envPath, "utf-8");
    if (!writtenContent.includes(contractAddress)) {
      console.error("   ❌ Failed to verify .env file was updated!");
      process.exit(1);
    }
    console.log(`   ✅ Verified .env file contents`);
  } catch (error: any) {
    console.error("   ❌ Failed to update .env:", error.message);
    process.exit(1);
  }

  // Step 6: Full integration test
  console.log("\n🔄 Step 6: Running full integration test...");
  try {
    const voting = await ethers.getContractAt("SimpleVoting", contractAddress);
    const [deployer] = await ethers.getSigners();
    
    // Register owner as voter
    console.log("   Testing: Register owner as voter...");
    const registerTx = await voting.registerVoter(deployer.address);
    await registerTx.wait();
    const isRegistered = await voting.isRegisteredVoter(deployer.address);
    if (!isRegistered) {
      throw new Error("Owner was not registered as voter!");
    }
    console.log("   ✅ Owner registered as voter");
    
    // Create a proposal
    console.log("   Testing: Create proposal...");
    const createTx = await voting.createProposal("Test Proposal");
    await createTx.wait();
    const count = await voting.proposalCount();
    if (count !== 1n) {
      throw new Error(`Expected 1 proposal, got ${count.toString()}`);
    }
    console.log("   ✅ Proposal created");
    
    // Vote
    console.log("   Testing: Vote on proposal...");
    const voteTx = await voting.vote(1n);
    await voteTx.wait();
    const voteCount = await voting.getVoteCount(1n);
    if (voteCount !== 1n) {
      throw new Error(`Expected 1 vote, got ${voteCount.toString()}`);
    }
    console.log("   ✅ Vote cast successfully");
    
  } catch (error: any) {
    console.error("   ❌ Integration test failed:", error.message);
    console.error("   Error details:", error);
    process.exit(1);
  }

  // Final summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ ALL TESTS PASSED!");
  console.log("=".repeat(70));
  console.log(`\n📋 Contract Address: ${contractAddress}`);
  console.log(`👑 Owner Address: ${contractOwner}`);
  console.log(`\n📝 Frontend .env has been updated automatically.`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Restart your frontend dev server (if running)`);
  console.log(`   2. Hard refresh your browser (Ctrl+Shift+R)`);
  console.log(`   3. The contract should now work!`);
  console.log("\n" + "=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  });

