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

## Going fully on-chain

`contracts/` contains OpenZeppelin-based reference contracts mirroring every in-game rule — primary sales in both currencies, P2P marketplace with 2% fee, rent claims, referral commissions and governance voting. See `contracts/README.md` for the deploy + frontend wiring guide. **Not audited — audit before mainnet.**

## Roadmap

- [ ] Replace reducer actions with on-chain calls (wagmi `writeContract`)
- [ ] WebSocket chat transport (drop polling)
- [ ] Admin panel for adding buildings/units (mirrors `addBuilding`/`addApartment`)
- [ ] Wallet-bound cloud saves (sign-in with Ethereum)
