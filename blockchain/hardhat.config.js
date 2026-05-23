require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

const { ALCHEMY_AMOY_URL, ALCHEMY_POLYGON_URL, PRIVATE_KEY, POLYGONSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun"
    }
  },

  networks:{

    // Red local — nodo de desarrollo (npx hardhat node)
    hardhat: {},

    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },

    amoy: {
      url: ALCHEMY_AMOY_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },

    polygon: {
      url: ALCHEMY_POLYGON_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },

  etherscan: {
    apiKey: POLYGONSCAN_API_KEY || "",
  },

  gasReporter: {
    enabled: true,
    currency: 'EUR', 
    token: 'POL',  
    offline: true,        
    tokenPrice: 0.07739 ,   // precio a 20 de abril de 2026
    gasPrice:127,  
    L1: "polygon"      
  }
};