import * as dotenv from "dotenv";

import { ethers } from "hardhat";

dotenv.config();

async function main() {
    const [owner] = await ethers.getSigners();

    const Staking = await ethers.getContractFactory("Staking", owner);
    const staking = await Staking.deploy(<string>process.env.TOKEN_ADDRESS);
    await staking.deployed();

    console.log("Staking deployed to:", staking.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
