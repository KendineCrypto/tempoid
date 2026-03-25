## TempoID — Tempo Name Service: Project Update

**Website:** tempoid.xyz
**GitHub:** github.com/KendineCrypto/tempoid
**Contract:** `0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9`
**Chain:** Tempo Mainnet (4217)

---

### What is TempoID?

TempoID is the first name service built on Tempo. Users register `.tempo` domains, send pathUSD by name (no wallet address needed), and trade names on a built-in marketplace.

### What we built (in 3 days)

**Smart Contract (v2)**
- Name registration with yearly pricing (3-char: $20, 4-char: $5, 5+: $1)
- On-chain owner enumeration — `getNamesOfOwner()` returns all names for any address
- Built-in marketplace with atomic payments and 2.5% protocol fee
- Transfer, renew, metadata, primary name system
- Grace period protection for expired names
- 40+ unit tests, all passing

**Frontend**
- Next.js 14 app at tempoid.xyz (deployed on Vercel)
- Search, register, send pathUSD by name, marketplace, account dashboard
- MetaMask integration with auto "Add Tempo Network" support
- Mobile responsive

**MPP Integration (Machine-Payable Protocol)**
- 10 API endpoints for AI agents
- AI agents can autonomously: check availability, register domains, buy/sell on marketplace, transfer, renew
- Full llms.txt for agent discovery
- Paid endpoints use MPP 402 challenge/credential flow with pathUSD
- Free read endpoints: resolve, reverse lookup, marketplace listings

### By the numbers

- **317 transactions** on Tempo mainnet
- **15 commits** in 3 days
- **2 contract versions** (v1 → v2 with 17 improvements)
- **10 MPP endpoints** for AI agent access
- **0 dependencies** on external name services

### Endpoints (AI Agents)

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

### What's next

- Profile pages (`tempoid.xyz/name.tempo`)
- Subdomain support
- API SDK for other Tempo dApps
- Multi-chain resolution
- Deeper Tempo Wallet integration

### Why this matters for Tempo

TempoID makes Tempo more human. Instead of `0x767b...`, you're `yourname.tempo`. And with MPP, AI agents are first-class citizens — they can own identities on Tempo just like humans.

We'd love to collaborate with the Tempo team on native integration, grants, or ecosystem partnerships.

**Contact:** @tempoidapp on Twitter
