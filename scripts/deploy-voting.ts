import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Deploying SimpleVoting contract...");
  
  // Check if verifier exists (for ZK support)
  const verifierAddress = process.env.VERIFIER_ADDRESS || "0x0000000000000000000000000000000000000000";
  const useZK = verifierAddress !== "0x0000000000000000000000000000000000000000";
  
  if (useZK) {
    console.log("Using ZK Verifier at:", verifierAddress);
  } else {
    console.log("Deploying without ZK support (verifier address not set)");
    console.log("To enable ZK: Set VERIFIER_ADDRESS env var or use npm run zk:deploy");
  }

  // Deploy the contract (with or without verifier)
  const voting = useZK 
    ? await ethers.deployContract("SimpleVoting", [verifierAddress])
    : await ethers.deployContract("SimpleVoting", ["0x0000000000000000000000000000000000000000"]);
  
  // Wait for deployment
  await voting.waitForDeployment();
  
  const address = await voting.getAddress();
  console.log("SimpleVoting deployed to:", address);
  console.log("Owner:", await voting.owner());
  
  // Export address so other scripts can use it
  if (typeof process !== 'undefined') {
    process.env.DEPLOYED_CONTRACT_ADDRESS = address;
  }
  
  return address;
}

// Execute the deployment
main()
  .then((address) => {
    console.log("Deployment successful!");
    // Don't exit immediately - let calling script handle it
    if (require.main === module) {
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

