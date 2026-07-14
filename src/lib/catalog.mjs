// Monaco Estate — shared game catalog.
// The initial city ships with 49 apartments across 8 buildings (mirrors the
// on-chain catalog seeded into contracts/MonacoEstate.sol). The admin can add
// more buildings/units later, both on-chain and here.
//
// Apartment fields:
//   status:   'available' | 'owned' (you) | 'listed' (yours, on market) | 'taken' (another player)
//   currency: 'MRT' | 'ETH' | 'BOTH'  — what the PRIMARY sale accepts
//   price:    primary price in $MRT, priceEth: primary price in ETH
// Display-only exchange rate shared by the app and the chain-seed script.
export const MRT_PER_ETH = 100_000;

export const BUILDINGS = [
  { name: 'Monte Carlo Casino', district: 'Casino Square' },
  { name: 'Larvotto Beach Tower', district: 'Larvotto' },
  { name: 'Hôtel de Paris Block', district: 'Casino Square' },
  { name: 'Port Hercule Residence', district: 'La Condamine' },
  { name: 'Grimaldi Plaza', district: 'Fontvieille' },
  { name: 'La Condamine Offices', district: 'La Condamine' },
  { name: 'Jardin Exotique Heights', district: 'Jardin Exotique' },
  { name: 'Princess Grace Plaza', district: 'Larvotto' },
];

const TIERS = {
  studio: { label: 'Studio', labelTr: 'Stüdyo', hue: 210 },
  standard: { label: 'Residence', labelTr: 'Rezidans', hue: 160 },
  premium: { label: 'Premium Suite', labelTr: 'Premium Süit', hue: 40 },
  penthouse: { label: 'Penthouse', labelTr: 'Çatı Katı', hue: 280 },
};

const VIEWS = ['Sea View', 'Marina View', 'City View', 'Garden View'];
const VIEWS_TR = ['Deniz Manzarası', 'Marina Manzarası', 'Şehir Manzarası', 'Bahçe Manzarası'];

// Deterministic PRNG so the catalog is identical on server and client.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NPC_NAMES = ['CryptoKing', 'WhaleX', 'DevGuru', 'RetailPro', 'InvestorX', 'Player_42', 'Player_7', 'BlockFi', 'MonacoWhale', 'YachtLife'];

// Units per building — totals 49.
const UNITS_PER_BUILDING = [8, 7, 6, 6, 6, 6, 5, 5];

function buildCatalog() {
  const rand = mulberry32(490716);
  const catalog = {};
  let unitSerial = 0;

  UNITS_PER_BUILDING.forEach((count, b) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      unitSerial++;
      const topFloor = 12 + b * 3;
      const floor = Math.max(1, Math.round((i + 1) * (topFloor / count)) - Math.floor(rand() * 2));
      const isPenthouse = i === count - 1;
      const tier = isPenthouse ? 'penthouse' : floor <= 3 ? 'studio' : floor >= topFloor - 3 ? 'premium' : 'standard';

      const base = 2200 + floor * 420 + b * 300;
      const tierMult = { studio: 0.8, standard: 1, premium: 1.6, penthouse: 2.8 }[tier];
      const price = Math.round((base * tierMult) / 100) * 100;

      // Yield 2.4–3.4% of price per month, maintenance ~30% of yearly rent.
      const rentIncome = Math.round((price * (0.024 + rand() * 0.01)) / 5) * 5;
      const annualCost = Math.round((rentIncome * 12 * (0.25 + rand() * 0.12)) / 5) * 5;

      // Primary sale currency: penthouses are ETH-only trophy assets, premium
      // units accept both, the rest are MRT.
      const currency = isPenthouse ? 'ETH' : tier === 'premium' ? 'BOTH' : 'MRT';

      const viewIdx = Math.floor(rand() * VIEWS.length);
      const taken = rand() < 0.28; // ~28% of the city is already owned by NPCs

      const unitNo = `${floor}${String((i % 4) + 1).padStart(2, '0')}`;
      list.push({
        id: `apt-${b}-${unitSerial}`,
        buildingIndex: b,
        floor,
        unit: tier === 'penthouse' ? `Penthouse ${BUILDINGS[b].district}` : `Daire ${unitNo}`,
        unitEn: tier === 'penthouse' ? `Penthouse ${BUILDINGS[b].district}` : `Apt ${unitNo}`,
        tier,
        view: VIEWS[viewIdx],
        viewTr: VIEWS_TR[viewIdx],
        sqm: Math.round(38 + tierMult * 55 + rand() * 25),
        price,
        priceEth: Number((price / MRT_PER_ETH).toFixed(3)),
        currency,
        rentIncome,
        annualCost,
        status: taken ? 'taken' : 'available',
        owner: taken ? NPC_NAMES[Math.floor(rand() * NPC_NAMES.length)] : null,
      });
    }
    catalog[b] = list;
  });
  return catalog;
}

const BUILDING_APARTMENTS = buildCatalog();

// A few NPC-owned units start out listed on the P2P market.
function buildInitialListings(apartments) {
  const listings = [];
  Object.values(apartments).forEach((arr) => {
    arr.forEach((apt) => {
      if (apt.status !== 'taken') return;
      // List roughly a third of NPC units, alternating currencies.
      if (listings.length < 6 && apt.floor % 3 === 0) {
        const useEth = listings.length % 2 === 1;
        listings.push({
          id: `list-npc-${apt.id}`,
          buildingIndex: apt.buildingIndex,
          aptId: apt.id,
          seller: apt.owner,
          price: useEth
            ? Number(((apt.price * 1.12) / MRT_PER_ETH).toFixed(3))
            : Math.round((apt.price * 1.1) / 50) * 50,
          currency: useEth ? 'ETH' : 'MRT',
        });
      }
    });
  });
  return listings;
}

const INITIAL_MARKET_LISTINGS = buildInitialListings(BUILDING_APARTMENTS);

export function getInitialApartments() {
  return JSON.parse(JSON.stringify(BUILDING_APARTMENTS));
}

export function getInitialMarketListings() {
  return JSON.parse(JSON.stringify(INITIAL_MARKET_LISTINGS));
}

export function getApartment(apartments, buildingIdx, aptId) {
  return (apartments[buildingIdx] || []).find((a) => a.id === aptId) || null;
}

export function getAllApartments(apartments) {
  return Object.values(apartments).flat();
}

export function getEconomyStats(apartments) {
  let total = 0, sold = 0, available = 0, yours = 0;
  getAllApartments(apartments).forEach((apt) => {
    total++;
    if (apt.status === 'owned' || apt.status === 'listed') { sold++; yours++; }
    else if (apt.status === 'taken') sold++;
    else available++;
  });
  return { total, sold, available, yours };
}

export function getTier(tier) {
  return TIERS[tier] || TIERS.standard;
}

export { NPC_NAMES };
export default BUILDING_APARTMENTS;
