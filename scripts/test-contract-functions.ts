import { ethers } from "hardhat";

async function main() {
  console.log("Testing contract functions...\n");

  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];
  if (!contractAddress) {
    console.error("Please provide contract address as argument or set CONTRACT_ADDRESS env var");
    process.exit(1);
  }

  console.log(`Testing contract at: ${contractAddress}\n`);

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const [deployer] = await ethers.getSigners();

  // Check if contract exists
  const code = await provider.getCode(contractAddress);
  if (!code || code === "0x") {
    console.error("❌ No contract found at this address!");
    process.exit(1);
  }
  console.log("✅ Contract exists\n");

  const contract = await ethers.getContractAt("SimpleVoting", contractAddress, deployer);

  // Test new functions
  console.log("Checking for new functions...\n");

  const functionsToCheck = [
    "createCandidateProposal",
    "createYesNoProposal",
    "addVoterToProposal",
    "voteForCandidate",
    "voteYesNo",
    "finishVoting",
    "getWinnerCandidate",
    "getProposalCandidates",
    "getYesNoResults",
  ];

  for (const funcName of functionsToCheck) {
    try {
      const func = contract.getFunction(funcName);
      if (func) {
        console.log(`✅ ${funcName} exists`);
      }
    } catch (e: any) {
      if (e.message?.includes("does not exist") || e.message?.includes("missing")) {
        console.log(`❌ ${funcName} does NOT exist`);
      } else {
        console.log(`⚠️  ${funcName}: ${e.message}`);
      }
    }
  }

  // Check getProposal return format
  console.log("\nChecking getProposal format...");
  try {
    const proposalCount = await contract.proposalCount();
    console.log(`Proposal count: ${proposalCount}`);
    
    if (proposalCount > 0n) {
      const proposalData = await contract.getProposal(1);
      console.log(`getProposal(1) returned ${proposalData.length} values:`);
      console.log(`  Values: ${JSON.stringify(proposalData)}`);
      
      if (proposalData.length === 3) {
        console.log("⚠️  Contract is using OLD format (3 values: id, description, voteCount)");
        console.log("   Need to redeploy contract with new code!");
      } else if (proposalData.length === 6) {
        console.log("✅ Contract is using NEW format (6 values)");
      }
    }
  } catch (e: any) {
    console.log(`⚠️  Error checking proposal format: ${e.message}`);
  }

  // Check owner
  try {
    const owner = await contract.owner();
    console.log(`\nContract owner: ${owner}`);
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`Is deployer the owner? ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
  } catch (e: any) {
    console.log(`⚠️  Error checking owner: ${e.message}`);
  }

  console.log("\n✅ Contract check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

