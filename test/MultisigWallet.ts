import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, {ethers} from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("MultisigFactory", function () {
  async function deployTokenFixture() {

    const TokenContract = await hre.ethers.getContractFactory("Token");
    const token = await TokenContract.deploy();

    return { token };
  }

  async function deployMultisigWalletFixture() {
   
    const MultisigWallet = await hre.ethers.getContractFactory("MultisigTest");
    const [owner, signer1, signer2, signer3, signer4] = await hre.ethers.getSigners();

    const validSigners = [owner, signer1, signer2, signer3];
    const multisigWallet = await MultisigWallet.deploy(3, validSigners);

    return { MultisigWallet, multisigWallet, validSigners, owner, signer1, signer2, signer3, signer4 };
  }

  describe("Deployment", function () {
    it("Should deploy a wallet", async function () {
      const { multisigWallet, validSigners } = await loadFixture(deployMultisigWalletFixture);

      expect(await multisigWallet.quorum()).to.equal(3)

      expect(await multisigWallet.noOfValidSigners()).to.equal(validSigners.length)

    });

    it("should revert with few valid signers", async function () {
      const { MultisigWallet, validSigners, owner } = await loadFixture(deployMultisigWalletFixture);

      await expect(MultisigWallet.deploy(1, [owner])).to.be.rejectedWith("few valid signers")
    })

    it("should revert with quorum is too small", async function () {
      const { MultisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);

      await expect(MultisigWallet.deploy(0, [owner, signer1])).to.be.rejectedWith("quorum is too small")
    })

    it("should revert with zero address not allowed", async function () {
      const { MultisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);    

      await expect(MultisigWallet.deploy(2, [owner, hre.ethers.ZeroAddress])).to.be.rejectedWith("zero address not allowed")
    })

    it("should revert with signer already exist", async function () {
      const { MultisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);

      await expect(MultisigWallet.deploy(2, [owner, owner])).to.be.rejectedWith("signer already exist")
    })

    it("should revert with quorum greater than valid signers", async function () {
      const { MultisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);

      await expect(MultisigWallet.deploy(5, [owner, signer1])).to.be.rejectedWith("quorum greater than valid signers")
    })
    
  });

  describe("Transfer", function() {
    describe("Require statements", function () {
      it("should revert with  can't send zero amount", async function () {
        const { multisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);
        const amount = hre.ethers.parseUnits("10", 18)
        const recipient = owner
        const tokenAddress = signer1

       await expect(multisigWallet.transfer(0, recipient, tokenAddress)).to.be.rejectedWith("can't send zero amount")
      })

       it("should revert with address zero found - recipient", async function () {
        const { multisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);
        const amount = hre.ethers.parseUnits("10", 18)
        const recipient = owner
        const tokenAddress = signer1

       await expect(multisigWallet.transfer(amount, hre.ethers.ZeroAddress, tokenAddress)).to.be.rejectedWith("address zero found")
      })

      it("should revert with address zero found - tokenAddress", async function () {
        const { multisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);
        const amount = hre.ethers.parseUnits("10", 18)
        const recipient = owner
        const tokenAddress = signer1

       await expect(multisigWallet.transfer(amount, recipient, hre.ethers.ZeroAddress)).to.be.rejectedWith("address zero found")
      })

      it("should revert with invalid signer", async function () {
        const { multisigWallet, validSigners, owner, signer1, signer4} = await loadFixture(deployMultisigWalletFixture);
        const amount = hre.ethers.parseUnits("10", 18)
        const recipient = owner
        const tokenAddress = signer1

       await expect(multisigWallet.connect(signer4).transfer(amount, recipient, tokenAddress)).to.be.rejectedWith("invalid signer")
      })

      it("should revert with insufficient funds", async function () {
        const { multisigWallet, validSigners, owner, signer1, signer3} = await loadFixture(deployMultisigWalletFixture);

        const { token } = await loadFixture(deployTokenFixture);
        const amount = hre.ethers.parseUnits("10", 18)

       await expect(multisigWallet.transfer(amount, owner, token)).to.be.rejectedWith("insufficient funds")
      })
    })

    describe ("transaction details", function() {
      it('should have an id', async function() {
        const { multisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);

        const { token } = await loadFixture(deployTokenFixture);
        const amount = hre.ethers.parseUnits("10", 18)

        await token.transfer(multisigWallet, amount)

        await multisigWallet.transfer(amount, owner, token)
        const tx = await multisigWallet.transactions(1)

        expect(tx.id).to.equal(1)
        expect(tx.amount).to.equal(amount)
        expect(tx.recipient).to.equal(owner)
        expect(tx.sender).to.equal(owner)
        expect(tx.tokenAddress).to.equal(token)
        expect(tx.noOfApproval).to.equal(1)
        expect(await multisigWallet.hasSigned(owner, 1)).to.be.true

      })
    })
  } )

  describe('Transfer Approval', function () {
it('should revert with address zero found - sender', async function() {
  const { multisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);

  const ZeroAddressSigner = await hre.ethers.getImpersonatedSigner(hre.ethers.ZeroAddress)

  const { token } = await loadFixture(deployTokenFixture);
  const amount = hre.ethers.parseUnits("10", 18)

  await token.transfer(multisigWallet, amount)

  await owner.sendTransaction({to: hre.ethers.ZeroAddress, value: hre.ethers.parseEther("1")})

  await expect( multisigWallet.connect(ZeroAddressSigner).transfer(amount, owner, token)).to.be.rejectedWith('address zero found')
})

it('should revert invalid tx id', async function() {
  const { multisigWallet, validSigners, owner, signer1 } = await loadFixture(deployMultisigWalletFixture);

  const { token } = await loadFixture(deployTokenFixture);
  const amount = hre.ethers.parseUnits("10", 18)

  await token.transfer(multisigWallet, amount)

  await multisigWallet.transfer(amount, owner, token)
  const tx = await multisigWallet.transactions(1)

  await expect( multisigWallet.approveTx(0)).to.be.rejectedWith("invalid tx id")
})

    it("should revert with insufficient funds", async function() {
      const { multisigWallet, validSigners, owner, signer1, signer2, signer3} = await loadFixture(deployMultisigWalletFixture);

      const { token } = await loadFixture(deployTokenFixture);
      const amount = hre.ethers.parseUnits("10", 18)

      await token.transfer(multisigWallet, amount)

      await multisigWallet.transfer(amount, owner, token)
      const tx = await multisigWallet.transactions(1)

      await multisigWallet.connect(signer1).approveTx(tx.id)
      await multisigWallet.connect(signer2).approveTx(tx.id)

      await expect(multisigWallet.transfer(amount, owner, token)).to.be.rejectedWith('insufficient funds')
    })

     it("should revert with can't sign twice", async function() {
      const { multisigWallet, validSigners, owner, signer1, signer2, signer3} = await loadFixture(deployMultisigWalletFixture);

      const { token } = await loadFixture(deployTokenFixture);
      const amount = hre.ethers.parseUnits("10", 18)

      await token.transfer(multisigWallet, amount)

      await multisigWallet.transfer(amount, owner, token)
      const tx = await multisigWallet.transactions(1)

      await multisigWallet.connect(signer1).approveTx(tx.id)
      await expect(multisigWallet.connect(signer1).approveTx(tx.id)).to.be.rejectedWith("can't sign twice")

    })

     it("should revert with not a valid signer", async function() {
      const { multisigWallet, validSigners, owner, signer1, signer4} = await loadFixture(deployMultisigWalletFixture);

      const { token } = await loadFixture(deployTokenFixture);
      const amount = hre.ethers.parseUnits("10", 18)

      await token.transfer(multisigWallet, amount)

      await multisigWallet.transfer(amount, owner, token)
      const tx = await multisigWallet.transactions(1)

      await multisigWallet.connect(signer1).approveTx(tx.id)
      await expect(multisigWallet.connect(signer4).approveTx(tx.id)).to.be.rejectedWith("not a valid signer")
    })

    it("should revert with transaction already completed", async function() {
      const { multisigWallet, validSigners, owner, signer1, signer2, signer3} = await loadFixture(deployMultisigWalletFixture);

      const { token } = await loadFixture(deployTokenFixture);
      const amount = hre.ethers.parseUnits("10", 18)

      await token.transfer(multisigWallet, amount)

      await multisigWallet.transfer(amount, owner, token)
      const tx = await multisigWallet.transactions(1)

      await multisigWallet.connect(signer1).approveTx(tx.id)
      await multisigWallet.connect(signer2).approveTx(tx.id)

      // expect(tx.isCompleted).to.be.true
      await expect(multisigWallet.connect(signer3).approveTx(tx.id)).to.be.rejectedWith("transaction already completed")
    })
    

  })

});
