import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  // Get contract address from command line or use default
  const contractAddress = process.argv[2];
  
  if (!contractAddress) {
    console.error("Usage: npx hardhat run scripts/register-voters.ts --network <network> <CONTRACT_ADDRESS>");
    console.error("Example: npx hardhat run scripts/register-voters.ts --network localhost 0x5FbDB2315678afecb367f032d93F642f64180aa3");
    process.exit(1);
  }

  console.log("Connecting to contract at:", contractAddress);

  // Get the contract instance
  const voting = await ethers.getContractAt("SimpleVoting", contractAddress);
  
  // Get signers
  const signers = await ethers.getSigners();
  const owner = signers[0];
  
  // Verify we're the owner
  const contractOwner = await voting.owner();
  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    console.error("Error: Connected account is not the contract owner!");
    console.error("Contract owner:", contractOwner);
    console.error("Your address:", owner.address);
    process.exit(1);
  }

  console.log("Owner verified:", owner.address);
  console.log("\nAvailable accounts:");
  signers.forEach((signer, index) => {
    console.log(`  [${index}]: ${signer.address}`);
  });

  // Get addresses to register from command line or use all other signers
  let votersToRegister: string[];
  
  if (process.argv[3]) {
    // Use addresses provided as comma-separated list
    votersToRegister = process.argv[3].split(',').map(addr => addr.trim());
  } else {
    // Default: register all signers except the owner
    votersToRegister = signers.slice(1).map(s => s.address);
  }

  // Filter out already registered voters
  const votersToCheck = await Promise.all(
    votersToRegister.map(async (addr) => {
      const isRegistered = await voting.isRegisteredVoter(addr);
      return { address: addr, isRegistered };
    })
  );

  const newVoters = votersToCheck
    .filter(v => !v.isRegistered)
    .map(v => v.address);

  const alreadyRegistered = votersToCheck
    .filter(v => v.isRegistered)
    .map(v => v.address);

  if (alreadyRegistered.length > 0) {
    console.log("\n⚠️  Already registered voters (skipping):");
    alreadyRegistered.forEach(addr => console.log(`  - ${addr}`));
  }

  if (newVoters.length === 0) {
    console.log("\n✅ All provided addresses are already registered!");
    return;
  }

  console.log("\n📝 Voters to register:");
  newVoters.forEach(addr => console.log(`  - ${addr}`));

  // Register voters
  console.log("\n⏳ Registering voters...");
  
  try {
    const tx = await voting.connect(owner).registerVoters(newVoters);
    console.log("Transaction sent, waiting for confirmation...");
    await tx.wait();
    
    console.log("\n✅ Successfully registered voters!");
    console.log(`   Registered ${newVoters.length} voter(s)`);
    
    // Verify registration
    console.log("\n🔍 Verifying registration:");
    for (const addr of newVoters) {
      const isRegistered = await voting.isRegisteredVoter(addr);
      console.log(`  ${addr}: ${isRegistered ? '✅ Registered' : '❌ Not registered'}`);
    }
    
    // Show total voter count
    const voterCount = await voting.getVoterCount();
    console.log(`\n📊 Total registered voters: ${voterCount.toString()}`);
    
  } catch (error) {
    console.error("\n❌ Error registering voters:", error);
    process.exit(1);
  }
}

// Execute
main()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

