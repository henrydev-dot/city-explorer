// Chain / token constants shared by the whole game.

// Canonical $MRT token on Base.
export const MRT_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_MRT_TOKEN_ADDRESS || '0xb200000000000000000000d8b21449ecf586c801';

export const REFERRAL_RATE = 0.2;      // 20% commission on referred spending
export const MARKET_FEE_RATE = 0.02;   // 2% P2P marketplace fee
export const APPRECIATION_RATE = 14.6; // Monaco index, % / year

// Display-only exchange rate used to compare MRT and ETH prices.
export const MRT_PER_ETH = 100_000;

// Gamified time: one in-game month passes every real-time minute, so rent
// streams into the balance every second at monthlyNet / 60.
export const GAME_MONTH_SECONDS = 60;

export const STORAGE_KEY = 'monaco-estate-v2';

export const formatMRT = (n) => `${Math.round(n).toLocaleString('en-US')} $MRT`;
export const formatETH = (n) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 4 })} ETH`;
export const formatPrice = (price, currency) =>
  currency === 'ETH' ? formatETH(price) : formatMRT(price);

export const shortAddr = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '');
