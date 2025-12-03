import { network } from "hardhat";

const { ethers } = await network.connect();

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

async function main() {
  console.log("=".repeat(70));
  console.log("🧪 FULL SYSTEM TEST");
  console.log("=".repeat(70));

  const signers = await ethers.getSigners();
  const owner = signers[0];
  const voter1 = signers[1];
  
  console.log("\n📋 Accounts:");
  console.log(`Owner: ${owner.address}`);
  console.log(`Voter1: ${voter1.address}`);

  const voting = await ethers.getContractAt("SimpleVoting", CONTRACT_ADDRESS);
  
  console.log("\n🔍 Step 1: Check Contract State");
  console.log("-".repeat(70));
  const contractOwner = await voting.owner();
  const isOwnerCorrect = contractOwner.toLowerCase() === owner.address.toLowerCase();
  console.log(`Contract Owner: ${contractOwner}`);
  console.log(`Is deployer the owner? ${isOwnerCorrect ? '✅ YES' : '❌ NO'}`);
  
  const isOwnerRegistered = await voting.isRegisteredVoter(owner.address);
  const proposalCount = await voting.proposalCount();
  const voterCount = await voting.getVoterCount();
  
  console.log(`\nOwner is Registered Voter: ${isOwnerRegistered ? '✅ YES' : '❌ NO'}`);
  console.log(`Current Proposals: ${proposalCount.toString()}`);
  console.log(`Current Voters: ${voterCount.toString()}`);

  console.log("\n🔧 Step 2: Register Owner as Voter");
  console.log("-".repeat(70));
  if (!isOwnerRegistered && isOwnerCorrect) {
    try {
      console.log("Registering owner as voter...");
      const tx = await voting.connect(owner).registerVoter(owner.address);
      const receipt = await tx.wait();
      console.log("✅ Transaction successful!");
      console.log(`   Block: ${receipt.blockNumber}`);
      
      const nowRegistered = await voting.isRegisteredVoter(owner.address);
      console.log(`   Verified: ${nowRegistered ? '✅ Registered' : '❌ Failed'}`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message || error}`);
      if (error.reason) {
        console.error(`   Reason: ${error.reason}`);
      }
    }
  } else if (isOwnerRegistered) {
    console.log("✅ Owner is already registered as voter");
  } else {
    console.log("❌ Cannot register - not the owner");
  }

  console.log("\n📝 Step 3: Create a Proposal");
  console.log("-".repeat(70));
  try {
    const description = "Test Proposal: Should we implement this feature?";
    console.log(`Creating proposal: "${description}"`);
    const tx = await voting.connect(owner).createProposal(description);
    const receipt = await tx.wait();
    console.log("✅ Proposal created successfully!");
    
    const newCount = await voting.proposalCount();
    const proposal = await voting.getProposal(newCount);
    console.log(`   Proposal ID: ${proposal[0].toString()}`);
    console.log(`   Description: ${proposal[1]}`);
    console.log(`   Vote Count: ${proposal[2].toString()}`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message || error}`);
  }

  console.log("\n🗳️ Step 4: Vote on Proposal");
  console.log("-".repeat(70));
  const currentCount = await voting.proposalCount();
  if (currentCount > 0n) {
    const isOwnerRegisteredNow = await voting.isRegisteredVoter(owner.address);
    if (isOwnerRegisteredNow) {
      try {
        const hasVoted = await voting.checkVoteStatus(currentCount, owner.address);
        if (!hasVoted) {
          console.log("Casting vote on proposal 1...");
          const tx = await voting.connect(owner).vote(1n);
          await tx.wait();
          console.log("✅ Vote cast successfully!");
          
          const newVoteCount = await voting.getVoteCount(1n);
          console.log(`   New vote count: ${newVoteCount.toString()}`);
        } else {
          console.log("✅ Already voted on this proposal");
        }
      } catch (error: any) {
        console.error(`❌ Error: ${error.message || error}`);
      }
    } else {
      console.log("❌ Cannot vote - owner is not registered as voter");
    }
  }

  console.log("\n📊 Final State:");
  console.log("-".repeat(70));
  const finalProposalCount = await voting.proposalCount();
  const finalVoterCount = await voting.getVoterCount();
  const finalIsOwnerRegistered = await voting.isRegisteredVoter(owner.address);
  
  console.log(`Total Proposals: ${finalProposalCount.toString()}`);
  console.log(`Registered Voters: ${finalVoterCount.toString()}`);
  console.log(`Owner is Registered: ${finalIsOwnerRegistered ? '✅ YES' : '❌ NO'}`);
  
  if (finalProposalCount > 0n) {
    console.log("\n📋 Proposal Details:");
    for (let i = 1n; i <= finalProposalCount; i++) {
      try {
        const prop = await voting.getProposal(i);
        const voteCount = await voting.getVoteCount(i);
        console.log(`\n   Proposal ${i.toString()}:`);
        console.log(`   Description: ${prop[1]}`);
        console.log(`   Votes: ${voteCount.toString()}`);
      } catch (e) {
        console.log(`   Proposal ${i.toString()}: Error loading`);
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ TEST COMPLETE!");
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  });

