import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Deploying SimpleVoting contract...");

  // Deploy the contract
  const voting = await ethers.deployContract("SimpleVoting");
  
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

