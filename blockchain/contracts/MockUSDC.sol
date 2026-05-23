// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Mock USDC Token
 * @dev ERC-20 token implementation exclusively for testing purposes.
 * Simulates the behavior of real USDC in local Hardhat environments or Testnets.
 */
contract MockUSDC is ERC20 {
    
    /**
     * @notice Initializes the mock token and mints an initial supply.
     * @dev Sets the name to "Mock USDC" and symbol to "USDC".
     */
    constructor() ERC20("Mock USDC", "USDC") {
        // Mints 1 million tokens to the deployer's address (adjusted for 6 decimals)
        _mint(msg.sender, 1000000 * 10 ** decimals()); 
    }

    /**
     * @notice Mints new mock tokens to a specified address to fund test accounts.
     * @dev In a production environment, this function would be heavily restricted. 
     * Kept public here to allow easy funding during beta testing.
     * @param to The wallet address that will receive the mock tokens.
     * @param amount The amount of tokens to mint (in smallest units, considering 6 decimals).
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /**
     * @notice Overrides the default ERC-20 decimals (18) to match the real USDC contract (6).
     * @dev Crucial for accurate math testing before Mainnet deployment.
     * @return The number of decimal places for the token.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}