# Monaco Estate — Web3 Real-Estate Game

Interactive 3D city game on **Base**: buy Monaco apartments with **ETH or $MRT**, trade them on the P2P marketplace, collect rent, vote on city governance, invite friends for 20% referral commission — with a live city chat on top.

Stack: Next.js 16 · React 19 · three.js / react-three-fiber · wagmi + RainbowKit · MongoDB

## Features

- **3D city map** (react-three-fiber) — click a building to inspect and buy its units
- **49-unit starting catalog** across 8 Monaco buildings; penthouses are ETH-only, premium suites accept ETH *or* $MRT, the rest are $MRT
- **Marketplace** — primary sales + player listings in one board, currency filter ($MRT/ETH), sorting, rich property cards
- **Inventory** — list owned units for sale in either currency, cancel listings
- **Rent economy** — net rent streams into your balance in real time (1 game month ≈ 1 minute)
- **Governance** — proposal voting; weight = $MRT balance + 10,000/property
- **Referrals** — `?ref=0x…` links, 20% commission on referred spending
- **Live city chat** — MongoDB-backed via `/api/chat` (polling); falls back to a local NPC-simulated chat when offline
- **Cloud saves** — progress persists to localStorage instantly and to MongoDB (`/api/save`) per anonymous player id
- **Wallet** — RainbowKit/wagmi on Base ($MRT: `0xb200…c801`)

## Project layout

```
contracts/                 Solidity reference contracts (MonacoEstate ERC-721 game + MRT ERC-20)
src/app/                   Next.js app router (page, providers, API routes: /api/chat, /api/save)
src/components/            3D scene, HUD, building panel, property cards, live chat, toasts
src/components/dashboard/  Marketplace / Inventory / Profile / Vote / Referrals pages
src/state/                 GameContext — reducer with all game rules + persistence + NPC simulation
src/lib/                   catalog (gameState), constants, i18n (EN/TR), mongodb client
```

## Development

```bash
npm install
cp .env.example .env   # fill in MONGODB_URI (optional — game runs local-only without it)
npm run dev
```

Production build: `npm run build` (standalone output), lint: `npx eslint src`.

## Deploying on Dokploy (Docker)

The repo ships a multi-stage `Dockerfile` (standalone Next.js, non-root, port 3000).

1. Dokploy → **Create Application** → this Git repo, build type **Dockerfile**.
2. **Environment** tab → add the variables from `.env.example` (`MONGODB_URI`, `MONGODB_DB`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_MRT_TOKEN_ADDRESS`).
3. Deploy — the container listens on `3000`; attach your domain in Dokploy.

Local Docker test:

```bash
docker build -t monaco-estate .
docker run -p 3000:3000 --env-file .env monaco-estate
```

## Blockchain — Base Sepolia testnet

Hardhat is set up in-repo (`hardhat.config.cjs`, contracts compile with OpenZeppelin 5 / solc 0.8.28, EVM cancun). The deploy script seeds the **same 49-unit catalog** the app uses.

```bash
npm run chain:compile        # compile contracts
npm run chain:test           # 7 gameplay tests on the in-process chain (all passing)
npm run chain:deploy:local   # smoke deploy + full catalog seed on a local chain
```

Deploy to Base Sepolia and play:

1. Put a funded testnet key in `.env`: `DEPLOYER_PRIVATE_KEY=0x…`
   (free ETH: https://docs.base.org/tools/network-faucets)
2. `npm run chain:deploy:testnet` — deploys test $MRT + MonacoEstate and seeds
   8 buildings / 49 apartments, then prints the `NEXT_PUBLIC_…` lines.
3. Paste those lines into `.env` (and Dokploy) — the Investor Profile page then
   shows the live contract, and the wagmi config already targets Base Sepolia
   (`NEXT_PUBLIC_CHAIN=baseSepolia`).

`src/lib/contracts.js` exports the game ABI + addresses for wiring UI actions
on-chain. **Not audited — audit before mainnet.**

## Map performance

The harbor map (`public/models/lowpoly_sea_track.glb`, ~12MB meshopt-compressed,
~4MB gzipped on the wire) is served with `Cache-Control: immutable` (see
`next.config.mjs`) so it downloads once and loads from disk cache afterwards.
The loading screen shows the real download/parse progress. If you replace the
map, **rename the file** so caches bust. Building markers/colliders are defined
in `BUILDING_ANCHORS` (`src/components/CityScene.jsx`) — coordinates extracted
from the GLB geometry itself.

## Roadmap

- [ ] Replace reducer actions with on-chain calls (wagmi `writeContract`)
- [ ] WebSocket chat transport (drop polling)
- [ ] Admin panel for adding buildings/units (mirrors `addBuilding`/`addApartment`)
- [ ] Wallet-bound cloud saves (sign-in with Ethereum)
