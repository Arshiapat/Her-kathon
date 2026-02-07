import { network } from "hardhat";

async function main() {
  const { ethers: eth } = await network.connect();

  // Example: 0.01 ETH per contribution, 30 days per cycle, max 10 members
  const CONTRIBUTION_AMOUNT = eth.parseEther("0.01");
  const CYCLE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds
  const MAX_MEMBERS = 10;

  const [deployer] = await eth.getSigners();
  console.log("Deploying WomenSavingsPool with account:", deployer.address);
  console.log("Account balance:", eth.formatEther(await eth.provider.getBalance(deployer.address)), "ETH");

  const pool = await eth.deployContract("WomenSavingsPool", [
    CONTRIBUTION_AMOUNT,
    CYCLE_DURATION,
    MAX_MEMBERS,
  ]);

  await pool.waitForDeployment();
  const address = await pool.getAddress();

  console.log("WomenSavingsPool deployed to:", address);
  console.log("  Contribution amount:", eth.formatEther(CONTRIBUTION_AMOUNT), "ETH");
  console.log("  Cycle duration:", CYCLE_DURATION, "seconds (~30 days)");
  console.log("  Max members:", MAX_MEMBERS.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
