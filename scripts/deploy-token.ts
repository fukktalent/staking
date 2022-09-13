import * as dotenv from "dotenv";

import { ethers } from "hardhat";

dotenv.config();

async function main() {
    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token", owner);
    const token = await Token.deploy("TEST TOKEN", "TKN");
    await token.deployed();

    console.log("Token deployed to:", token.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
