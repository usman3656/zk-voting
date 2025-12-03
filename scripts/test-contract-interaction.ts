import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const CONTRACT_ADDRESS = process.argv[2];
  
  if (!CONTRACT_ADDRESS) {
    console.error("Usage: npx hardhat run scripts/test-contract-interaction.ts --network localhost <CONTRACT_ADDRESS>");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("Testing Contract Interaction");
  console.log("=".repeat(60));

  const signers = await ethers.getSigners();
  const owner = signers[0];
  const voter1 = signers[1];
  
  console.log("\n📋 Account Information:");
  console.log(`Owner Address: ${owner.address}`);
  console.log(`Voter1 Address: ${voter1.address}`);

  // Get contract instance
  const voting = await ethers.getContractAt("SimpleVoting", CONTRACT_ADDRESS);
  
  // Check owner
  const contractOwner = await voting.owner();
  console.log(`\n👑 Contract Owner: ${contractOwner}`);
  console.log(`   Am I owner? ${contractOwner.toLowerCase() === owner.address.toLowerCase() ? '✅ YES' : '❌ NO'}`);

  // Check voter registration
  const isOwnerRegistered = await voting.isRegisteredVoter(owner.address);
  const isVoter1Registered = await voting.isRegisteredVoter(voter1.address);
  console.log(`\n🗳️ Voter Registration Status:`);
  console.log(`   Owner (${owner.address.slice(0, 10)}...): ${isOwnerRegistered ? '✅ Registered' : '❌ Not Registered'}`);
  console.log(`   Voter1 (${voter1.address.slice(0, 10)}...): ${isVoter1Registered ? '✅ Registered' : '❌ Not Registered'}`);

  // Get counts
  const proposalCount = await voting.proposalCount();
  const voterCount = await voting.getVoterCount();
  console.log(`\n📊 Current State:`);
  console.log(`   Total Proposals: ${proposalCount.toString()}`);
  console.log(`   Registered Voters: ${voterCount.toString()}`);

  // Test: Register owner as voter
  if (!isOwnerRegistered && contractOwner.toLowerCase() === owner.address.toLowerCase()) {
    console.log(`\n🔧 Registering owner as voter...`);
    try {
      const tx = await voting.connect(owner).registerVoter(owner.address);
      await tx.wait();
      console.log(`   ✅ Owner registered as voter successfully!`);
      
      const nowRegistered = await voting.isRegisteredVoter(owner.address);
      console.log(`   Verified: ${nowRegistered ? '✅ Registered' : '❌ Still not registered'}`);
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test: Create a proposal
  if (contractOwner.toLowerCase() === owner.address.toLowerCase()) {
    console.log(`\n📝 Creating a test proposal...`);
    try {
      const tx = await voting.connect(owner).createProposal("Test Proposal: Should we add this feature?");
      const receipt = await tx.wait();
      console.log(`   ✅ Proposal created successfully!`);
      
      // Get proposal count
      const newCount = await voting.proposalCount();
      console.log(`   New proposal count: ${newCount.toString()}`);
      
      // Get proposal details
      const proposal = await voting.getProposal(newCount);
      console.log(`   Proposal ID: ${proposal[0].toString()}`);
      console.log(`   Description: ${proposal[1]}`);
      console.log(`   Vote Count: ${proposal[2].toString()}`);
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Final status
  console.log(`\n📊 Final Status:`);
  const finalProposalCount = await voting.proposalCount();
  const finalVoterCount = await voting.getVoterCount();
  const finalIsOwnerRegistered = await voting.isRegisteredVoter(owner.address);
  
  console.log(`   Total Proposals: ${finalProposalCount.toString()}`);
  console.log(`   Registered Voters: ${finalVoterCount.toString()}`);
  console.log(`   Owner is Registered Voter: ${finalIsOwnerRegistered ? '✅ YES' : '❌ NO'}`);

  console.log("\n" + "=".repeat(60));
  console.log("✅ Testing Complete!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

