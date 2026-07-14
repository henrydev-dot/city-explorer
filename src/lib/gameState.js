// Monaco Shared economy game state
// status: 'available' | 'owned' | 'taken' (owned by another player)
const BUILDING_APARTMENTS = {
  0: [
    { id: 'b0-1', floor: 3, unit: 'Daire 301', unitEn: 'Apt 301', price: 4500, rentIncome: 120, annualCost: 280, status: 'available' },
    { id: 'b0-2', floor: 7, unit: 'Daire 701', unitEn: 'Apt 701', price: 6200, rentIncome: 180, annualCost: 350, status: 'taken', owner: 'Player_42' },
    { id: 'b0-3', floor: 12, unit: 'Daire 1201', unitEn: 'Apt 1201', price: 8800, rentIncome: 260, annualCost: 420, status: 'available' },
    { id: 'b0-4', floor: 20, unit: 'Daire 2001', unitEn: 'Apt 2001', price: 12500, rentIncome: 380, annualCost: 550, status: 'taken', owner: 'CryptoKing' },
    { id: 'b0-5', floor: 35, unit: 'Penthouse', unitEn: 'Penthouse', price: 25000, rentIncome: 750, annualCost: 900, status: 'available' },
    { id: 'b0-6', floor: 40, unit: 'Sky Suite', unitEn: 'Sky Suite', price: 32000, rentIncome: 950, annualCost: 1100, status: 'taken', owner: 'WhaleX' },
  ],
  1: [
    { id: 'b1-1', floor: 2, unit: 'Ofis 201', unitEn: 'Office 201', price: 3200, rentIncome: 95, annualCost: 200, status: 'available' },
    { id: 'b1-2', floor: 5, unit: 'Ofis 502', unitEn: 'Office 502', price: 4800, rentIncome: 140, annualCost: 280, status: 'taken', owner: 'DevGuru' },
    { id: 'b1-3', floor: 10, unit: 'Loft 1001', unitEn: 'Loft 1001', price: 7500, rentIncome: 220, annualCost: 380, status: 'available' },
    { id: 'b1-4', floor: 18, unit: 'Suite 1801', unitEn: 'Suite 1801', price: 11000, rentIncome: 330, annualCost: 480, status: 'available' },
  ],
  2: [
    { id: 'b2-1', floor: 0, unit: 'Mağaza A1', unitEn: 'Shop A1', price: 5500, rentIncome: 160, annualCost: 320, status: 'taken', owner: 'RetailPro' },
    { id: 'b2-2', floor: 1, unit: 'Mağaza B3', unitEn: 'Shop B3', price: 4200, rentIncome: 125, annualCost: 260, status: 'available' },
    { id: 'b2-3', floor: 3, unit: 'Restoran R1', unitEn: 'Restaurant R1', price: 6800, rentIncome: 200, annualCost: 380, status: 'available' },
    { id: 'b2-4', floor: 5, unit: 'Daire 501', unitEn: 'Apt 501', price: 9200, rentIncome: 275, annualCost: 450, status: 'taken', owner: 'InvestorX' },
  ],
  3: [
    { id: 'b3-1', floor: 1, unit: 'Daire 101', unitEn: 'Apt 101', price: 2800, rentIncome: 80, annualCost: 180, status: 'available' },
    { id: 'b3-2', floor: 4, unit: 'Daire 401', unitEn: 'Apt 401', price: 3600, rentIncome: 105, annualCost: 220, status: 'taken', owner: 'Player_7' },
    { id: 'b3-3', floor: 6, unit: 'Daire 601', unitEn: 'Apt 601', price: 4400, rentIncome: 130, annualCost: 270, status: 'available' },
  ],
  4: [
    { id: 'b4-1', floor: 0, unit: 'Dükkan D1', unitEn: 'Store D1', price: 3000, rentIncome: 90, annualCost: 190, status: 'available' },
    { id: 'b4-2', floor: 2, unit: 'Ofis 201', unitEn: 'Office 201', price: 4100, rentIncome: 120, annualCost: 250, status: 'available' },
    { id: 'b4-3', floor: 5, unit: 'Daire 501', unitEn: 'Apt 501', price: 5200, rentIncome: 155, annualCost: 310, status: 'taken', owner: 'BlockFi' },
  ],
  5: [
    { id: 'b5-1', floor: 1, unit: 'Stüdyo S1', unitEn: 'Studio S1', price: 2200, rentIncome: 65, annualCost: 150, status: 'available' },
    { id: 'b5-2', floor: 3, unit: 'Daire 301', unitEn: 'Apt 301', price: 3400, rentIncome: 100, annualCost: 210, status: 'available' },
  ],
};

// Initial Peer-to-Peer listings on the market
const INITIAL_MARKET_LISTINGS = [
  { id: 'list-1', buildingIndex: 0, aptId: 'b0-2', unit: 'Apt 701', floor: 7, seller: 'Player_42', price: 6800, rentIncome: 180, annualCost: 350 },
  { id: 'list-2', buildingIndex: 0, aptId: 'b0-4', unit: 'Apt 2001', floor: 20, seller: 'CryptoKing', price: 13500, rentIncome: 380, annualCost: 550 },
  { id: 'list-3', buildingIndex: 2, aptId: 'b2-4', unit: 'Apt 501', floor: 5, seller: 'InvestorX', price: 9800, rentIncome: 275, annualCost: 450 },
];

export function getInitialApartments() {
  return JSON.parse(JSON.stringify(BUILDING_APARTMENTS));
}

export function getInitialMarketListings() {
  return JSON.parse(JSON.stringify(INITIAL_MARKET_LISTINGS));
}

export function getEconomyStats(apartments) {
  let total = 0, sold = 0, available = 0, yours = 0;
  Object.values(apartments).forEach(arr => {
    arr.forEach(apt => {
      total++;
      if (apt.status === 'owned') { sold++; yours++; }
      else if (apt.status === 'taken') { sold++; }
      else { available++; }
    });
  });
  return { total, sold, available, yours };
}

export default BUILDING_APARTMENTS;
