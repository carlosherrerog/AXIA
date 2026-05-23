// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./WatchNFT.sol";
import "./WatchMarketplace.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// ==========================================
// CUSTOM ERRORS
// ==========================================
error AuctionNotActive();
error AuctionNotEnded();
error AuctionAlreadyEnded();
error BidTooLow();
error SellerCannotBid();

/**
 * @title Axia Luxury Watch Auction
 * @dev Manages time-bound English auctions for luxury watches.
 * Integrates with WatchNFT for token custody and WatchMarketplace for final escrow settlement.
 */
contract WatchAuction is ReentrancyGuard, Pausable {
    
    // INTERFACES
    WatchNFT public watchNFT;
    IERC20 public paymentToken;
    WatchMarketplace public marketplace;

    /// @dev Core data structure for a time-bound auction.
    struct Auction {
        address seller;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        uint256 minPrice;
        bool active;
    }

    // STATE VARIABLES
    mapping(uint256 => Auction) public auctions;

    // EVENTS
    event AuctionCreated(uint256 indexed tokenId, address indexed seller, uint256 minPrice, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEndedWithWinner(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event AuctionEndedWithoutWinner(uint256 indexed tokenId);

    /**
     * @notice Initializes the auction contract and connects it to the ecosystem.
     * @param _nft Address of the WatchNFT ERC721 contract.
     * @param _token Address of the USDC/ERC20 payment token.
     * @param _marketplace Address of the WatchMarketplace contract.
     */
    constructor(address _nft, address _token, address _marketplace) {
        watchNFT = WatchNFT(_nft);
        paymentToken = IERC20(_token);
        marketplace = WatchMarketplace(_marketplace);
    }

    // ==========================================
    // AUCTION FUNCTIONS
    // ==========================================

    /**
     * @notice Creates a new auction for a specific watch.
     * @dev Only authorized dealers can list watches for auction. The NFT is locked in this contract.
     * @param _tokenId The ID of the watch to auction.
     * @param _minPrice The starting/minimum bid price in token base units.
     * @param _durationInSeconds How long the auction will last.
     */
    function createAuction(uint256 _tokenId, uint256 _minPrice, uint256 _durationInSeconds) 
        external whenNotPaused nonReentrant 
    {
        if (!watchNFT.authorizedDealers(msg.sender)) revert Unauthorized();
        if (_minPrice == 0) revert InvalidPrice();
        if (watchNFT.ownerOf(_tokenId) != msg.sender) revert NotOwner();

        // Transfer the NFT to the auction contract for escrow
        watchNFT.transferFrom(msg.sender, address(this), _tokenId);

        auctions[_tokenId] = Auction({
            seller: msg.sender,
            highestBidder: address(0),
            highestBid: 0,
            endTime: block.timestamp + _durationInSeconds,
            minPrice: _minPrice,
            active: true
        });
        
        emit AuctionCreated(_tokenId, msg.sender, _minPrice, auctions[_tokenId].endTime);
    }

    /**
     * @notice Places a bid on an active auction.
     * @dev Automatically refunds the previous highest bidder to prevent locked funds.
     * @param _tokenId The ID of the auctioned watch.
     * @param _bidAmount The amount of tokens to bid.
     */
    function placeBid(uint256 _tokenId, uint256 _bidAmount) external nonReentrant {
        Auction storage auction = auctions[_tokenId];
        
        if (!auction.active) revert AuctionNotActive();
        if (block.timestamp >= auction.endTime) revert AuctionAlreadyEnded();
        if (_bidAmount < auction.minPrice) revert BidTooLow();
        if (_bidAmount <= auction.highestBid) revert BidTooLow();
        if (msg.sender == auction.seller) revert SellerCannotBid();

        // Refund the previous highest bidder automatically
        if (auction.highestBidder != address(0)) {
            if (!paymentToken.transfer(auction.highestBidder, auction.highestBid)) revert TransferFailed();
        }

        // Lock the new highest bid in the contract
        if (!paymentToken.transferFrom(msg.sender, address(this), _bidAmount)) revert TransferFailed();

        auction.highestBidder = msg.sender;
        auction.highestBid = _bidAmount;

        emit BidPlaced(_tokenId, msg.sender, _bidAmount);
    }

    /**
     * @notice Ends the auction and processes the outcome.
     * @dev If there is a winner, funds and NFT are moved to the Marketplace Escrow. 
     * If no bids were placed, the NFT is returned to the seller.
     * @param _tokenId The ID of the concluded auction.
     */
    function endAuction(uint256 _tokenId) external nonReentrant {
        Auction storage auction = auctions[_tokenId];
        
        if (!auction.active) revert AuctionNotActive();
        if (block.timestamp < auction.endTime) revert AuctionNotEnded();

        auction.active = false;
        
        if (auction.highestBidder != address(0)) {
            // 1. Transfer the winning USDC bid to the Marketplace
            if (!paymentToken.transfer(address(marketplace), auction.highestBid)) revert TransferFailed();
            
            // 2. Transfer the NFT to the Marketplace for final custody
            watchNFT.transferFrom(address(this), address(marketplace), _tokenId);

            // 3. Command the Marketplace to create the final Escrow
            marketplace.createAuctionEscrow(_tokenId, auction.seller, auction.highestBidder, auction.highestBid);

            emit AuctionEndedWithWinner(_tokenId, auction.highestBidder, auction.highestBid);
        } else {
            // If there were no bids, return the watch to the Dealer
            watchNFT.transferFrom(address(this), auction.seller, _tokenId);
            
            emit AuctionEndedWithoutWinner(_tokenId);
        }
    }
}