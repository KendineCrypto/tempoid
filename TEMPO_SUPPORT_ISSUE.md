First of all, I want to apologize — I previously opened an issue on the `tempoxyz/tempo` (node) repository by mistake. I now understand that repo is for core node bugs and protocol-level feature requests only. Sorry about that! This is the right place for community project showcases, and I hope this is helpful to the ecosystem.

---

## Community Project: TempoID — .tempo Name Service with MPP Integration

**Website:** [tempoid.xyz](https://tempoid.xyz)
**GitHub:** [github.com/KendineCrypto/tempoid](https://github.com/KendineCrypto/tempoid)
**Agent Discovery:** [tempoid.xyz/llms.txt](https://tempoid.xyz/llms.txt)
**Contract:** `0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9`
**Chain:** Tempo Mainnet (4217)

---

### What is TempoID?

TempoID is a name service for Tempo. It lets users register `.tempo` domains, send pathUSD using human-readable names instead of wallet addresses, and trade names on a built-in marketplace.

With MPP integration, AI agents can also register and manage `.tempo` domains autonomously — no frontend, no human in the loop.

---

### How it works

**For humans (frontend):**
1. Visit [tempoid.xyz](https://tempoid.xyz)
2. Search for a name
3. Connect wallet, pay with pathUSD, register

**For AI agents (MPP):**
```bash
tempo request -t -X POST \
  --json '{"name":"agentname","owner_address":"0x...","duration_years":1}' \
  https://tempoid.xyz/api/mpp/register
```

One command. The agent pays with USDC.e via MPP, the domain is minted on-chain, and ownership is transferred automatically.

---

### Features

**Smart Contract**
- Name registration with yearly pricing (3-char: $20, 4-char: $5, 5+: $1/year)
- On-chain owner enumeration via `getNamesOfOwner()`
- Built-in marketplace with atomic payments
- Transfer, renew, metadata, primary name system
- Grace period protection for expired names
- 40+ unit tests passing

**MPP Endpoints**

| Endpoint | Method | Cost |
|----------|--------|------|
| `/api/mpp/check/{name}` | GET | Free |
| `/api/mpp/resolve/{name}` | GET | Free |
| `/api/mpp/reverse/{address}` | GET | Free |
| `/api/mpp/marketplace` | GET | Free |
| `/api/mpp/register` | POST | Paid (MPP) |
| `/api/mpp/buy` | POST | Paid (MPP) |
| `/api/mpp/renew` | POST | Paid (MPP) |
| `/api/mpp/list` | POST | Free |
| `/api/mpp/transfer` | POST | Free |
| `/api/mpp/metadata` | POST | Free |

Paid endpoints accept USDC.e via Tempo Wallet. Free endpoints require no authentication.

---

### Tech Stack

- **Contract:** Solidity, deployed with Foundry
- **Frontend:** Next.js 14 (App Router), deployed on Vercel
- **MPP:** mppx SDK (server-side), Tempo payment method
- **Agent Discovery:** llms.txt at `/llms.txt`

---

### What's next

- Profile pages (visit `tempoid.xyz/name.tempo` to see someone's on-chain identity)
- Subdomain support
- API SDK for other Tempo dApps to integrate name resolution
- Multi-chain resolution (resolve `.tempo` names to addresses on other chains)

---

### Why this matters

Every major chain has a name service — ENS on Ethereum, SNS on Solana. Tempo doesn't have one yet. TempoID fills that gap for both humans and AI agents.

We'd love any feedback from the team or community. Happy to collaborate on deeper integrations.

**Twitter:** [@tempoidapp](https://twitter.com/tempoidapp)
