// Deploys MortgageToken (test) + MonacoEstate and seeds the same 49-unit
// catalog the frontend uses. Works on any configured network:
//
//   npx hardhat run scripts/deploy-testnet.mjs                      # in-process chain (smoke test)
//   npx hardhat run scripts/deploy-testnet.mjs --network baseSepolia # Base Sepolia testnet
//
// Requirements for baseSepolia: DEPLOYER_PRIVATE_KEY in .env with a little
// Base Sepolia ETH (faucets: https://docs.base.org/tools/network-faucets).
import hre from 'hardhat';
import { BUILDINGS, getInitialApartments } from '../src/lib/catalog.mjs';

const { ethers, network } = hre;

// Currency enum in MonacoEstate.sol
const CUR = { MRT: 0, ETH: 1, BOTH: 2 };

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error('No deployer account. Set DEPLOYER_PRIVATE_KEY in .env (see .env.example).');
  }
  console.log(`network: ${network.name}`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // 1. $MRT test token (on Base mainnet you would reuse the canonical token
  //    0xb200000000000000000000d8b21449ecf586c801 instead).
  let mrtAddress = process.env.SEED_EXISTING_MRT_ADDRESS;
  if (!mrtAddress) {
    const Token = await ethers.getContractFactory('MortgageToken');
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();
    mrtAddress = await token.getAddress();
    console.log(`MortgageToken (test $MRT): ${mrtAddress}`);
  } else {
    console.log(`Using existing $MRT: ${mrtAddress}`);
  }

  // 2. Game contract; deployer doubles as treasury on testnet.
  const Estate = await ethers.getContractFactory('MonacoEstate');
  const estate = await Estate.deploy(mrtAddress, deployer.address);
  await estate.waitForDeployment();
  const estateAddress = await estate.getAddress();
  console.log(`MonacoEstate:              ${estateAddress}\n`);

  // 3. Seed the catalog — 8 buildings, 49 apartments (matches the app).
  const catalog = getInitialApartments();
  for (let b = 0; b < BUILDINGS.length; b++) {
    const tx = await estate.addBuilding(BUILDINGS[b].name);
    await tx.wait();
    const units = catalog[b] || [];
    for (const apt of units) {
      const tx2 = await estate.addApartment(
        b,
        apt.floor,
        apt.unitEn,
        ethers.parseEther(String(apt.price)),          // MRT has 18 decimals
        ethers.parseEther(String(apt.priceEth)),       // ETH price in wei
        CUR[apt.currency] ?? CUR.MRT,
        ethers.parseEther(String(apt.rentIncome)),
        ethers.parseEther(String(apt.annualCost)),
      );
      await tx2.wait();
    }
    console.log(`seeded building ${b} — ${BUILDINGS[b].name} (${units.length} units)`);
  }

  // 4. Let the estate pull rent payouts from the treasury (deployer).
  const token = await ethers.getContractAt('MortgageToken', mrtAddress);
  await (await token.approve(estateAddress, ethers.parseEther('100000000'))).wait();
  console.log('\ntreasury approved 100M $MRT for rent payouts');

  const totalUnits = Object.values(catalog).reduce((n, arr) => n + arr.length, 0);
  console.log(`\n✔ Done. ${BUILDINGS.length} buildings, ${totalUnits} apartments on-chain.`);
  console.log('\nAdd these to .env / Dokploy environment:');
  console.log(`NEXT_PUBLIC_CHAIN=${network.name === 'base' ? 'base' : 'baseSepolia'}`);
  console.log(`NEXT_PUBLIC_MRT_TOKEN_ADDRESS=${mrtAddress}`);
  console.log(`NEXT_PUBLIC_ESTATE_ADDRESS=${estateAddress}`);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
