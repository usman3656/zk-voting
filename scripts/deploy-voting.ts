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
  
  return address;
}

// Execute the deployment
main()
  .then((address) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

