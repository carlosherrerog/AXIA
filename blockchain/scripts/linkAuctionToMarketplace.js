const { ethers } = require("hardhat");

/**
 * Verifica y configura el enlace entre WatchAuction y WatchMarketplace en testnet.
 * WatchMarketplace.createAuctionEscrow() requiere que msg.sender == auctionContract.
 * Si este valor no está configurado, endAuction() revertirá con Unauthorized cuando hay ganador.
 *
 * Ejecutar con: npx hardhat run scripts/linkAuctionToMarketplace.js --network amoy
 */
async function main() {
  const MARKETPLACE_ADDRESS = "0x57057749e6aF1b21070FA2A4e5D4359AA2711735";
  const AUCTION_ADDRESS     = "0xe7Be5Fd0162f7f2fbC5851FB9DC2f5b4b81F63d6";

  const [deployer] = await ethers.getSigners();
  console.log("Ejecutando con la cuenta:", deployer.address);

  const marketplace = await ethers.getContractAt("WatchMarketplace", MARKETPLACE_ADDRESS);

  const current = await marketplace.auctionContract();
  console.log("\nauctionContract actual en el marketplace:", current);

  if (current.toLowerCase() === AUCTION_ADDRESS.toLowerCase()) {
    console.log("✅ Ya está configurado correctamente. No se necesita ninguna acción.");
    return;
  }

  console.log("⚠️  No está configurado. Llamando a setAuctionContract...");
  const tx = await marketplace.setAuctionContract(AUCTION_ADDRESS);
  console.log("Transacción enviada:", tx.hash);
  await tx.wait();

  const updated = await marketplace.auctionContract();
  console.log("✅ auctionContract actualizado a:", updated);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
