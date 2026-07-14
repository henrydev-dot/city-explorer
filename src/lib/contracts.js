// On-chain configuration. The game runs fully off-chain until these are set;
// once NEXT_PUBLIC_ESTATE_ADDRESS is configured (run `npm run chain:deploy:testnet`
// and paste the printed lines into the environment) the UI surfaces the
// contract identity and wagmi hooks below can mirror game actions on-chain.
import { base, baseSepolia } from 'wagmi/chains';

export const ESTATE_ADDRESS = process.env.NEXT_PUBLIC_ESTATE_ADDRESS || '';
export const ACTIVE_CHAIN = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : baseSepolia;

export function isOnchainEnabled() {
  return /^0x[a-fA-F0-9]{40}$/.test(ESTATE_ADDRESS);
}

// Minimal ABI for the MonacoEstate game surface (see contracts/MonacoEstate.sol).
export const ESTATE_ABI = [
  { type: 'function', name: 'buyWithMRT', stateMutability: 'nonpayable', inputs: [{ name: 'apartmentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'buyWithETH', stateMutability: 'payable', inputs: [{ name: 'apartmentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'list', stateMutability: 'nonpayable', inputs: [{ name: 'apartmentId', type: 'uint256' }, { name: 'price', type: 'uint96' }, { name: 'currency', type: 'uint8' }], outputs: [] },
  { type: 'function', name: 'cancelListing', stateMutability: 'nonpayable', inputs: [{ name: 'apartmentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'buyListing', stateMutability: 'payable', inputs: [{ name: 'apartmentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'claimRent', stateMutability: 'nonpayable', inputs: [{ name: 'apartmentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'pendingRent', stateMutability: 'view', inputs: [{ name: 'apartmentId', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'registerReferrer', stateMutability: 'nonpayable', inputs: [{ name: 'referrer', type: 'address' }], outputs: [] },
  { type: 'function', name: 'vote', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'support', type: 'uint8' }], outputs: [] },
  { type: 'function', name: 'votingPower', stateMutability: 'view', inputs: [{ name: 'voter', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'getApartment', stateMutability: 'view', inputs: [{ name: 'apartmentId', type: 'uint256' }], outputs: [
    { type: 'tuple', components: [
      { name: 'buildingId', type: 'uint32' }, { name: 'floor', type: 'uint16' }, { name: 'unit', type: 'string' },
      { name: 'priceMRT', type: 'uint96' }, { name: 'priceETH', type: 'uint96' }, { name: 'payableIn', type: 'uint8' },
      { name: 'rentPerMonthMRT', type: 'uint96' }, { name: 'costPerYearMRT', type: 'uint96' }, { name: 'minted', type: 'bool' },
    ] },
    { type: 'address' },
    { type: 'tuple', components: [
      { name: 'seller', type: 'address' }, { name: 'price', type: 'uint96' }, { name: 'currency', type: 'uint8' }, { name: 'active', type: 'bool' },
    ] },
  ] },
];

export const ERC20_ABI = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
];
