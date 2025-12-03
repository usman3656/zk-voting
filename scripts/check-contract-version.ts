import { ethers } from "ethers";
import { SimpleVoting__factory } from "../typechain-types";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
  
  console.log("Checking contract at:", contractAddress);
  
  // Check if contract exists
  const code = await provider.getCode(contractAddress);
  if (!code || code === "0x") {
    console.error("❌ No contract found at this address!");
    return;
  }
  
  console.log("✅ Contract exists");
  
  // Try to load the contract
  try {
    const factory = await ethers.getContractFactory("SimpleVoting");
    const contract = factory.attach(contractAddress);
    
    // Test if new functions exist
    console.log("\nChecking for new functions...");
    
    try {
      await contract.getFunction("createCandidateProposal").staticCall("test", ["candidate1"]);
      console.log("✅ createCandidateProposal exists");
    } catch (e: any) {
      if (e.message?.includes("function does not exist") || e.message?.includes("missing")) {
        console.log("❌ createCandidateProposal does NOT exist - contract needs redeployment");
      } else {
        console.log("⚠️  createCandidateProposal exists (call failed for other reason)");
      }
    }
    
    try {
      await contract.getFunction("createYesNoProposal").staticCall("test");
      console.log("✅ createYesNoProposal exists");
    } catch (e: any) {
      if (e.message?.includes("function does not exist") || e.message?.includes("missing")) {
        console.log("❌ createYesNoProposal does NOT exist - contract needs redeployment");
      } else {
        console.log("⚠️  createYesNoProposal exists (call failed for other reason)");
      }
    }
    
    // Check proposal count
    try {
      const count = await contract.proposalCount();
      console.log(`\nCurrent proposal count: ${count}`);
    } catch (e) {
      console.log("⚠️  Could not get proposal count");
    }
    
  } catch (error) {
    console.error("Error checking contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

