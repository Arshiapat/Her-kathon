import { network } from "hardhat";

async function main() {
  const { ethers: eth } = await network.connect();

  const [deployer] = await eth.getSigners();
  console.log("Deploying CrowdfundingPlatform with account:", deployer.address);
  console.log("Account balance:", eth.formatEther(await eth.provider.getBalance(deployer.address)), "ETH");

  const platform = await eth.deployContract("CrowdfundingPlatform");
  await platform.waitForDeployment();
  const address = await platform.getAddress();
  console.log("CrowdfundingPlatform deployed to:", address);

  // Create sample campaigns (30 days each)
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  const campaigns = [
    { goal: eth.parseEther("5"), duration: THIRTY_DAYS },   // Luna's Bakery
    { goal: eth.parseEther("10"), duration: THIRTY_DAYS },  // GreenTech Solutions
    { goal: eth.parseEther("3"), duration: THIRTY_DAYS },  // Artisan Crafts Co
    { goal: eth.parseEther("8"), duration: THIRTY_DAYS },  // Her Health App
  ];

  for (let i = 0; i < campaigns.length; i++) {
    const tx = await platform.createCampaign(campaigns[i].goal, campaigns[i].duration);
    await tx.wait();
    console.log(`  Created campaign ${i}: goal ${eth.formatEther(campaigns[i].goal)} ETH`);
  }

  console.log("\nSet in frontend .env:");
  console.log(`REACT_APP_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
