// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title Axia Luxury Watch Signature Verifier
 * @dev Implements EIP-712 typed structured data hashing and signature verification.
 * Used by the WatchMarketplace to securely validate off-chain buyer offers without gas costs.
 */
contract WatchSignature is EIP712 {
    
    /// @dev Keccak-256 hash of the EIP-712 Offer struct signature. Must exactly match off-chain structure.
    bytes32 private constant OFFER_TYPEHASH = keccak256(
        "Offer(address buyer,uint256 tokenId,uint256 price,uint256 deadline)"
    );

    /**
     * @notice Initializes the EIP-712 domain separator.
     * @dev Domain name "WatchMarketplace" and version "1" must perfectly match the backend/frontend signing parameters.
     */
    constructor() EIP712("WatchMarketplace", "1") {}

    /**
     * @notice Verifies if a structured EIP-712 signature is valid and belongs to the specified buyer.
     * @param buyer The address of the user who supposedly signed the offer.
     * @param tokenId The ID of the watch being bid on.
     * @param amount The offered price in payment tokens (e.g., USDC).
     * @param deadline The timestamp after which the signature is considered expired.
     * @param signature The cryptographic signature byte array generated off-chain.
     * @return True if the signature is valid and matches the expected buyer, false otherwise.
     */
    function verifyOfferSignature(
        address buyer, 
        uint256 tokenId, 
        uint256 amount, 
        uint256 deadline, 
        bytes memory signature
    ) external view returns (bool) {
        
        // 1. Recreate the structured data hash based on the provided parameters
        bytes32 structHash = keccak256(
            abi.encode(OFFER_TYPEHASH, buyer, tokenId, amount, deadline)
        );

        // 2. Generate the final EIP-712 compliant hash (Version 4)
        bytes32 hash = _hashTypedDataV4(structHash);
        
        // 3. Recover the signer's address from the signature and compare it to the expected buyer
        return ECDSA.recover(hash, signature) == buyer;
    }
}