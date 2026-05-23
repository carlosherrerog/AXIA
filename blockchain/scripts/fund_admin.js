const { ethers } = require("hardhat");

async function main() {
  // Cuenta #0 por defecto de Hardhat — siempre tiene 10 000 ETH en cualquier nodo local nuevo
  const hardhatAccount0 = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    ethers.provider
  );

  const target = "0xD6C8dEae5E2A79655CA18bD0eA7C6B83109f07FB";

  const tx = await hardhatAccount0.sendTransaction({
    to: target,
    value: ethers.parseEther("500"),
  });
  await tx.wait();

  const balance = await ethers.provider.getBalance(target);
  console.log(`Fondos transferidos. Saldo de admin: ${ethers.formatEther(balance)} ETH`);
}

main().catch((e) => { console.error(e); process.exit(1); });
