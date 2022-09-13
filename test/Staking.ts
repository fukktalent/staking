import { expect } from "chai";
import { ethers } from "hardhat";

import { Token, Staking } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish } from "ethers";

const SOME_AMOUNT = 999;

describe("Staking", function () {
    let staking: Staking;

    let owner: SignerWithAddress;
    let acc1: SignerWithAddress;
    let acc2: SignerWithAddress;
    let acc3: SignerWithAddress;

    let token: Token;

    before(async function () {
        [owner, acc1, acc2, acc3] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Token", "TKN");

        const Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy(token.address);

        await token.mint(acc1.address, SOME_AMOUNT * 100);
        await token.connect(acc1).approve(staking.address, ethers.constants.MaxUint256);

        await token.mint(acc2.address, SOME_AMOUNT * 100);
        await token.connect(acc2).approve(staking.address, ethers.constants.MaxUint256);
    });

    it("Should correct deploy contract", async function () {
        expect(await staking.isActive()).to.be.equal(false);
        expect(await staking.owner()).to.be.equal(owner.address);
    });

    describe("setIsActive", function () {
        it("Should revert with no access", async function () {
            const tx = staking.connect(acc1).setIsActive(true);
            await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should set isActive to true", async function () {
            const tx = staking.setIsActive(true);
            expect(await staking.isActive()).to.be.equal(true);
        });
    });

    describe("stake", function () {
        it("Should revert error when staking not active", async function () {
            await staking.setIsActive(false);

            const tx = staking.connect(acc1).stake(SOME_AMOUNT);
            await expect(tx).to.be.reverted;

            await staking.setIsActive(true);
        });

        it("Should revert error when amount is not enough", async function () {
            const tx = staking.connect(acc1).stake(9);
            await expect(tx).to.be.reverted;
        });

        it("Should revert error when amount is too much", async function () {
            const tx = staking.connect(acc1).stake(1_000_001);
            await expect(tx).to.be.reverted;
        });

        it("Should stake tokens", async function () {
            const tx = staking.connect(acc1).stake(SOME_AMOUNT);

            await expect(() => tx).changeTokenBalances(
                token,
                [staking, acc1],
                [SOME_AMOUNT, -SOME_AMOUNT]
            );

            await expect(tx).to.emit(staking, "Staked");

            const stake = (await staking.stakes())[0];
            expect(stake.wallet).to.be.equal(acc1.address);
            expect(stake.amount).to.be.equal(SOME_AMOUNT);
            expect(stake.endTimestamp).to.be.equal(0);
        });

        it("Should revert when already staked", async function () {
            const tx = staking.connect(acc1).stake(SOME_AMOUNT);
            await expect(tx).to.be.reverted;
        });

        it("Should stake after unstake", async function () {
            await staking.connect(acc1).unstake();

            const tx = staking.connect(acc1).stake(SOME_AMOUNT * 2);

            await expect(() => tx).changeTokenBalances(
                token,
                [staking, acc1],
                [SOME_AMOUNT * 2, -SOME_AMOUNT * 2]
            );

            await expect(tx).to.emit(staking, "Staked");

            const stake = (await staking.stakes())[0];
            expect(stake.wallet).to.be.equal(acc1.address);
            expect(stake.amount).to.be.equal(SOME_AMOUNT * 2);
            expect(stake.endTimestamp).to.be.equal(0);
        });

        it("Should stake (acc2)", async function () {
            const tx = staking.connect(acc2).stake(SOME_AMOUNT);

            await expect(() => tx).changeTokenBalances(
                token,
                [staking, acc2],
                [SOME_AMOUNT, -SOME_AMOUNT]
            );

            await expect(tx).to.emit(staking, "Staked");

            const stake = (await staking.stakes())[1];
            expect(stake.wallet).to.be.equal(acc2.address);
            expect(stake.amount).to.be.equal(SOME_AMOUNT);
            expect(stake.endTimestamp).to.be.equal(0);
        });
    });

    describe("unstake", function () {
        it("Should unstake tokens (acc2)", async function () {
            const tx = staking.connect(acc2).unstake();

            await expect(() => tx).changeTokenBalances(
                token,
                [staking, acc2],
                [-SOME_AMOUNT, SOME_AMOUNT]
            );

            await expect(tx).to.emit(staking, "Unstaked");

            const stake = (await staking.stakes())[1];
            expect(stake.wallet).to.be.equal(acc2.address);
            expect(stake.amount).to.be.equal(0);
            expect(stake.endTimestamp).to.be.not.equal(0);
        });

        it("Should unstake tokens (acc1)", async function () {
            const tx = staking.connect(acc1).unstake();

            await expect(() => tx).changeTokenBalances(
                token,
                [staking, acc1],
                [-SOME_AMOUNT * 2, SOME_AMOUNT * 2]
            );

            await expect(tx).to.emit(staking, "Unstaked");

            const stake = (await staking.stakes())[0];
            expect(stake.wallet).to.be.equal(acc1.address);
            expect(stake.amount).to.be.equal(0);
            expect(stake.endTimestamp).to.be.not.equal(0);
        });

        it("Should revert error when not staked", async function () {
            const tx = staking.connect(acc1).unstake();
            await expect(tx).to.be.reverted;
        });

        it("Should revert error when not staked", async function () {
            const tx = staking.connect(acc3).unstake();
            await expect(tx).to.be.reverted;
        });
    });
});
