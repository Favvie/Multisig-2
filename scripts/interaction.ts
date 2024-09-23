import  { ethers }  from "hardhat";


async function main() {
    const MultisigFactoryAddress = "0xfD5aB8a4F8f08edf2fd83e72fa06d945D686d993"
    const MultisigFactory = await ethers.getContractAt("IMultisigFactory", MultisigFactoryAddress)

    // const DeployedMultiSigWalletAddress = "0x5A5e34D60Aaa2595a22531435fC64f9C0b9f2507"
    // const Multisigwallet = await ethers.getContractAt("IMultisig", DeployedMultiSigWalletAddress)

    const tokenAddress = "0x45f9F7ba6b48aE8AF1E197C7f1300B1757Ec065B"
    const web3CXI = await ethers.getContractAt("IERC20", tokenAddress);

    const validSigners = ["0x21Be2291f91EA2A1d1EB65DbBea2dA8886Ad7a3E", "0x580626a35D4DAb957c800F2e9e3e853D2E94D010"]

    const [signer1, signer2] = await ethers.getSigners()


    const transferAmount = ethers.parseUnits("15", 18);
    const multisigTransferAmount = ethers.parseUnits("2", 18);

    // create multisig wallet from factory

    const factory = await MultisigFactory.createMultisigWallet(2, validSigners)
    console.log("factory deployed")

    // get multisig wallet address

    const clones = await MultisigFactory.getMultiSigClones()
    // await clones.wait();
    console.log('clones', clones)

    // interact with deployed multisig wallet
    const DeployedMultiSigWalletAddress = clones[1]
    const Multisigwallet = await ethers.getContractAt("IMultisig", DeployedMultiSigWalletAddress)

    // transfer token to multisigwallet  

    const transferTokens = await web3CXI.transfer(Multisigwallet, transferAmount)
    await transferTokens.wait();
    // console.log(`Transferred 10 tokens to ${Multisigwallet}`);
    // console.log("Multisigwallet token balance", await web3CXI.balanceOf(Multisigwallet))
    
    // perform a transaction on the multisig wallet
    const recipient = "0x580626a35D4DAb957c800F2e9e3e853D2E94D010"
    const multisig1 = await Multisigwallet.connect(signer1).transfer(multisigTransferAmount, recipient , tokenAddress)
    await multisig1.wait()
    console.log("Multisig transfer first approval")

    const multisig2 = await Multisigwallet.connect(signer2).approveTx(1)
    await multisig2.wait()
    console.log("Multisig transfer second approval")


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
