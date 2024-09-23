import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("MultisigFactory", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultisigFactoryFixture() {

    // Contracts are deployed using the first signer/account by default
    

    const MultisigFactory = await hre.ethers.getContractFactory("MultisigFactory");
    const multisigFactory = await MultisigFactory.deploy();

    return { multisigFactory };
  }

  describe("Deployment", function () {
    it("Should deploy a clone", async function () {
      const { multisigFactory } = await loadFixture(deployMultisigFactoryFixture);

      const [owner, otherAccount] = await hre.ethers.getSigners();

      await multisigFactory.createMultisigwallet(2, [owner, otherAccount])

      const clones = await multisigFactory.getMultiSigClones()

      expect(clones.length).to.be.greaterThan(0);
    });

    // it("Should set the right owner", async function () {
    //   const { lock, owner } = await loadFixture(deployOneYearLockFixture);

    //   expect(await lock.owner()).to.equal(owner.address);
    // });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployOneYearLockFixture
    //   );

    //   expect(await hre.ethers.provider.getBalance(lock.target)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await hre.ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

});
