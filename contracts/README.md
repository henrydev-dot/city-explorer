# Monaco Estate — Smart Contracts

Reference contracts for the on-chain version of the Monaco Estate game, targeting **Base**.

| Contract | Purpose |
| --- | --- |
| `MortgageToken.sol` | Reference implementation of the $MRT in-game currency (ERC-20 + Permit). The canonical token already lives on Base at `0xb200000000000000000000d8b21449ecf586c801` — deploy this one only for local testing. |
| `MonacoEstate.sol` | The game itself: ERC-721 property deeds, admin catalog, primary sales in ETH **or** $MRT, P2P marketplace with 2% fee, rent accrual, 20% referral commissions and city governance voting. |

## Game rules encoded on-chain

- **Catalog** — the admin (`owner()`) registers buildings and apartments (`addBuilding`, `addApartment`). The initial city ships with 49 units; more can be added at any time.
- **Primary sales** — each apartment declares what it accepts: `MRT`, `ETH`, or `BOTH`. Buyers call `buyWithMRT` / `buyWithETH`; the deed (ERC-721) is minted to them.
- **P2P marketplace** — owners `list(id, price, currency)` in either currency, buyers call `buyListing(id)`. 2% fee to the treasury, deed transfers atomically with payment.
- **Rent economy** — every unit has `rentPerMonthMRT` and `costPerYearMRT`. `claimRent(id)` pays out net accrued rent pro-rata since the last claim (treasury must approve MRT to the contract).
- **Referrals** — `registerReferrer(addr)` binds a player once; the referrer then automatically receives **20%** of everything the player spends (both currencies, primary and P2P).
- **Governance** — the admin opens proposals; `vote(id, support)` weight = MRT balance + 10,000 MRT per owned property. Matches the in-app voting page.

## Building & testing (Foundry)

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
forge init --no-git . # inside a scratch dir, or add foundry.toml here
forge install OpenZeppelin/openzeppelin-contracts
forge build
```

`foundry.toml` remapping:

```toml
remappings = ["@openzeppelin/=lib/openzeppelin-contracts/"]
```

## Deploying to Base

```bash
forge create contracts/MonacoEstate.sol:MonacoEstate \
  --rpc-url https://mainnet.base.org \
  --private-key $DEPLOYER_KEY \
  --constructor-args 0xb200000000000000000000d8b21449ecf586c801 $TREASURY_ADDR
```

Then seed the catalog (49 units) with `addBuilding` / `addApartment` calls — the
frontend's `src/lib/gameState.js` contains the same catalog and can be used to
generate the seeding script.

## Frontend integration

The app already uses wagmi + RainbowKit on Base. To go live, replace the local
reducer actions in `src/state/GameContext.jsx` with contract calls:

| In-app action | Contract call |
| --- | --- |
| Buy apartment (MRT / ETH) | `buyWithMRT(id)` / `buyWithETH(id)` (approve MRT first) |
| List / cancel / buy listing | `list`, `cancelListing`, `buyListing` |
| Claim rental income | `claimRent(id)` |
| Referral binding (`?ref=`) | `registerReferrer(addr)` |
| Governance vote | `vote(proposalId, support)` |

> ⚠️ These contracts are examples and have **not** been audited. Audit before
> holding real funds.
