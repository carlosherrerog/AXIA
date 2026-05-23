const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("WatchAuction", function () {
    let watchNFT, watchMarketplace, watchAuction, mockUSDC;
    let owner, rolex, dealer, buyer1, buyer2, logisticsSystem, feeRecipient, watchmaker; 

    beforeEach(async function () {
        [owner, rolex, dealer, buyer1, buyer2, logisticsSystem, feeRecipient, watchmaker] = await ethers.getSigners();

        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        const mockUSDCAddress = await mockUSDC.getAddress();

        const WatchNFT = await ethers.getContractFactory("WatchNFT");
        watchNFT = await WatchNFT.deploy();
        const watchNFTAddress = await watchNFT.getAddress();

        const WatchMarketplace = await ethers.getContractFactory("WatchMarketplace");
        watchMarketplace = await WatchMarketplace.deploy(watchNFTAddress, mockUSDCAddress);
        const marketplaceAddress = await watchMarketplace.getAddress();

        // DESPLIEGUE DE SUBASTAS
        const WatchAuction = await ethers.getContractFactory("WatchAuction");
        watchAuction = await WatchAuction.deploy(watchNFTAddress, mockUSDCAddress, marketplaceAddress);
        const auctionAddress = await watchAuction.getAddress();

        await watchMarketplace.setAuctionContract(auctionAddress);
        await watchNFT.setMarketplaceAddress(marketplaceAddress);
        await watchNFT.manageManufacturer(rolex.address, true);
        await watchNFT.manageDealer(dealer.address, true);

        // saldo y permisos
        const amount = ethers.parseUnits("50000", 6);
        await mockUSDC.mint(buyer1.address, amount);
        await mockUSDC.mint(buyer2.address, amount);
        await mockUSDC.connect(buyer1).approve(auctionAddress, amount);
        await mockUSDC.connect(buyer2).approve(auctionAddress, amount);
        await watchMarketplace.setLogisticsSystem(logisticsSystem.address);
        await watchMarketplace.updateFeeRecipient(feeRecipient.address);

        // minteo del reloj para el Dealer
        await watchNFT.connect(rolex).mintWatch("Patek", "Nautilus",  "numeroSerie", 2024, ethers.id("NFC-AUCTION"), "ipfs://patek", dealer.address);
        await watchNFT.connect(dealer).setApprovalForAll(auctionAddress, true);
    });

    it("DEALER CU 1. COMO joyería autorizada QUIERO crear una subasta y que el mejor postor gane la pieza.", async function () {
        const tokenId = 1;
        const minPrice = ethers.parseUnits("10000", 6);
        const duration = 3600; // 1 hora

        // 1. el dealer crea la subasta
        await watchAuction.connect(dealer).createAuction(tokenId, minPrice, duration);
        
        // el nft queda en custodia del contrato de subasta
        expect(await watchNFT.ownerOf(tokenId)).to.equal(await watchAuction.getAddress());

        // 2. el comprador 1 puja el mínimo
        await watchAuction.connect(buyer1).placeBid(tokenId, ethers.parseUnits("11000", 6));

        // 3. el comprador 2 puja más alto
        const highBid = ethers.parseUnits("15000", 6);
        await watchAuction.connect(buyer2).placeBid(tokenId, highBid);

        // verificación: se le devuelve el dinero al comprador 1
        expect(await mockUSDC.balanceOf(buyer1.address)).to.equal(ethers.parseUnits("50000", 6));

        // 4. termina el tiempo
        await time.increase(3601);

        // 5. se cierra la subasta
        await watchAuction.endAuction(tokenId);

        // el marketplace debe tener ahora el nft en escrow para el ganador
        expect(await watchNFT.ownerOf(tokenId)).to.equal(await watchMarketplace.getAddress());
        
        const listing = await watchMarketplace.listings(tokenId);
        expect(listing.buyer).to.equal(buyer2.address);
        expect(listing.price).to.equal(highBid);
        expect(listing.state).to.equal(2); 
    });

    it("USER CU 1. COMO cliente QUIERO poder pujar en subastas de Dealers y recibir mi reloj.", async function () {
        const tokenId = 2;
        await watchNFT.connect(rolex).mintWatch("Rolex", "Daytona", "numeroSerie", 2024, ethers.id("NFC-AUC2"), "ipfs://auc2", dealer.address);
        await watchNFT.connect(dealer).setApprovalForAll(await watchAuction.getAddress(), true);

        const minPrice = ethers.parseUnits("20000", 6);
        await watchAuction.connect(dealer).createAuction(tokenId, minPrice, 3600);

        const initialBuyerBalance = await mockUSDC.balanceOf(buyer1.address);
        const bidAmount = ethers.parseUnits("25000", 6);

        // 1. el cliente realiza su puja (su dinero va al contrato de subasta)
        await watchAuction.connect(buyer1).placeBid(tokenId, bidAmount);
        expect(await mockUSDC.balanceOf(buyer1.address)).to.equal(initialBuyerBalance - bidAmount);

        // 2. finaliza la subasta y gana el cliente
        await time.increase(3601);
        await watchAuction.endAuction(tokenId);

        // verificación de seguridad: el dinero se ha movido al Escrow del Marketplace
        const listing = await watchMarketplace.listings(tokenId);
        expect(listing.state).to.equal(2); // Escrowed
        expect(listing.price).to.equal(bidAmount);
        
        // 3. el Dealer lo envía
        await watchMarketplace.connect(logisticsSystem).markAsShipped(tokenId);

        // SALDOS ANTES DE CONFIRMAR
        const initialDealerBalance = await mockUSDC.balanceOf(dealer.address);
        const initialPlatformBalance = await mockUSDC.balanceOf(feeRecipient);
        const initialRoyaltyBalance = await mockUSDC.balanceOf(rolex.address);

        // 4. el cliente recibe el reloj y el contrato libera los fondos automáticamente
        await watchMarketplace.connect(buyer1).confirmDelivery(tokenId);

        // COMISIONES
        const marketFeePercent = await watchMarketplace.marketPlaceFeePercent();
        const royaltyPercent = await watchMarketplace.royaltyPercent();

        const platformFee = (bidAmount * marketFeePercent) / 10000n; // 1.5%
        const royaltyFee = (bidAmount * royaltyPercent) / 10000n;    // 1.0%
        const watchmakerFee = 0n; // es una venta de Dealer, no hay peritaje
        const dealerPayout = bidAmount - platformFee - royaltyFee - watchmakerFee;

        // VERIFICACIONES (el relojero no se lleva nada)
        expect(await mockUSDC.balanceOf(dealer.address)).to.equal(initialDealerBalance + dealerPayout);
        expect(await mockUSDC.balanceOf(feeRecipient)).to.equal(initialPlatformBalance + platformFee);
        expect(await mockUSDC.balanceOf(rolex.address)).to.equal(initialRoyaltyBalance + royaltyFee);
        expect(await watchNFT.ownerOf(tokenId)).to.equal(buyer1.address);

        // el anuncio desaparece de la base de datos protegiendo el estado del contrato
        const finalListing = await watchMarketplace.listings(tokenId);
        expect(finalListing.state).to.equal(0);
    });
});