const { vars } = require("hardhat/config");

require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-ethers");


  import * as dotenv from "dotenv";
  dotenv.config();

// require("@nomiclabs/hardhat-verify")

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const SEPOLIA_PRIVATE_KEY_2 = process.env.SEPOLIA_PRIVATE_KEY_2;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
//assignment - interaction for the multisig ContractFactory, interaction for deployed Contract, test for the multisig factory and deployed contract

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY, SEPOLIA_PRIVATE_KEY_2]
    }
  },
  // Hardhat expects etherscan here, even if you're using Blockscout.
  etherscan: {
    // Use "123" as a placeholder, because Blockscout doesn't need a real API key, and Hardhat will complain if this property isn't set.
    apiKey: {
      sepolia: [ETHERSCAN_API_KEY]
    },
  sourcify: {
    enabled: false
  }
}
};

































