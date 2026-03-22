# TempID — Tempo Name Service

Register `.tempo` names on the Tempo blockchain. Use human-readable names like `fatih.tempo` instead of long wallet addresses.

**Website:** [tempoid.xyz](https://tempoid.xyz)
**Chain:** Tempo (EVM-compatible, Chain ID 4217)
**Payment:** pathUSD (TIP-20 stablecoin, 6 decimals)
**Contract:** `0x199002DBDe63764596101EcEcae9Dc6dc29cE168`

## Pricing

| Name Length | Annual Fee |
|-------------|------------|
| 3 characters | $20 pathUSD |
| 4 characters | $5 pathUSD |
| 5+ characters | $1 pathUSD |

## Features

- **Name Registration** — Register `.tempo` names with pathUSD
- **Name Resolution** — Resolve names to addresses and reverse lookup
- **Send via Name** — Send pathUSD to any `.tempo` name
- **Marketplace** — Buy and sell registered names (2.5% commission)
- **Metadata** — Set avatar, twitter, website on your name profile

## Project Structure

```
tempoid/
├── contracts/          # Solidity smart contract (tempo-foundry)
│   ├── src/TempoNameService.sol
│   ├── test/TempoNameService.t.sol
│   └── script/Deploy.s.sol
├── frontend/           # Next.js 14 (App Router)
│   ├── app/            # Pages
│   ├── components/     # UI components
│   ├── hooks/          # Wagmi hooks
│   └── lib/            # Config & utils
└── README.md
```

## Setup

### Contract

```bash
# Install tempo-foundry
foundryup -n tempo

# Build & test
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge build
forge test -vvv

# Deploy to mainnet
forge create src/TempoNameService.sol:TempoNameService \
  --rpc-url https://rpc.tempo.xyz \
  --interactive \
  --broadcast \
  --verify \
  --tempo.fee-token 0x20c0000000000000000000000000000000000000 \
  --constructor-args 0x20c0000000000000000000000000000000000000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Network Info

| | Mainnet | Testnet (Moderato) |
|---|---|---|
| Chain ID | 4217 | 42431 |
| RPC | https://rpc.tempo.xyz | https://rpc.moderato.tempo.xyz |
| Explorer | https://explore.tempo.xyz | https://explore.tempo.xyz |
| pathUSD | `0x20c0000000000000000000000000000000000000` | Same |

## Smart Contract Functions

- `register(name, owner, years)` — Register a name
- `resolve(name)` — Resolve name to address
- `reverseLookup(address)` — Reverse lookup (primary name)
- `renew(name, years)` — Extend registration
- `transfer(name, newOwner)` — Transfer ownership
- `setPrimaryName(name)` — Set primary name
- `setMetadata(name, key, value)` — Set metadata (avatar, twitter, website...)
- `listForSale(name, price)` — List name on marketplace
- `buyName(name)` — Buy a listed name
- `withdraw()` — Owner withdraws collected fees

## Tech Stack

- **Contract:** Solidity 0.8.24, OpenZeppelin, tempo-foundry
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Web3:** Viem v2.43.0+, Wagmi v2.14.0+
- **Payment:** pathUSD (TIP-20, 6 decimals)

## License

MIT
