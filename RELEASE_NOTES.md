## TempoID v1.1.0 — AI Agents Meet .tempo Domains

---

### What is TempoID?

TempoID is the first name service built natively on the Tempo blockchain. It provides a complete identity layer where users can:

- **Register `.tempo` domains** — Claim human-readable names like `yourname.tempo` that point to your wallet address
- **Send payments by name** — Instead of copying long wallet addresses, just type `yourname.tempo` and send pathUSD directly
- **Trade names on the marketplace** — List your domains for sale, browse available names, and buy instantly with on-chain atomic payments
- **Set on-chain metadata** — Attach your bio, avatar, social links, and any custom data directly to your name, all stored on-chain
- **Manage multiple names** — Own as many `.tempo` names as you want, set a primary name, transfer to others, and renew before expiry

All of this is powered by a single smart contract deployed on Tempo Mainnet, with a clean web interface at [tempoid.xyz](https://tempoid.xyz).

---

### What's New in v1.1.0: Machine Payments Protocol (MPP)

Until now, `.tempo` domains could only be registered through the website by connecting a MetaMask wallet. That changes today.

With this release, **AI agents can now register, buy, sell, and manage `.tempo` domains — completely autonomously, with zero human interaction.**

This is made possible by integrating the **Machine Payments Protocol (MPP)** — an open standard developed by the Tempo ecosystem that allows AI agents to discover, negotiate, and pay for services on their own.

---

### How MPP Works with TempoID

The integration follows MPP's standard HTTP 402 flow. Here's what happens step by step when an AI agent wants to register a `.tempo` domain:

**Step 1 — Discovery**

Every MPP-compatible service exposes a `llms.txt` file that describes what it offers. AI agents read this file to understand available endpoints, pricing, and interaction patterns. TempoID's discovery file is available at:

```
https://tempoid.xyz/llms.txt
```

This file tells the agent: "I'm TempoID. I sell `.tempo` domains. Here are my endpoints and prices."

**Step 2 — Availability Check**

Before registering, the agent checks if the desired name is available. This is a free read-only call with no payment required:

```bash
tempo request -t https://tempoid.xyz/api/mpp/check/yourname
```

Response:
```json
{
  "name": "yourname.tempo",
  "available": true,
  "price_per_year": 1,
  "currency": "USDC.e",
  "decimals": 6
}
```

**Step 3 — Registration Request**

The agent sends a registration request:

```bash
tempo request -t -X POST \
  --json '{"name":"yourname","owner_address":"0xYOUR_ADDRESS","duration_years":1}' \
  https://tempoid.xyz/api/mpp/register
```

**Step 4 — HTTP 402 Payment Challenge**

TempoID doesn't just accept the request. It responds with HTTP 402 (Payment Required) and a challenge that says: "This costs 1 USDC.e. Pay to this address on Tempo chain to proceed."

The challenge contains:
- The exact amount to pay
- The currency (USDC.e on Tempo)
- The recipient address (TempoID's treasury)
- A cryptographic reference linking this payment to this specific request

**Step 5 — Autonomous Payment**

The agent's Tempo Wallet reads the challenge and automatically signs a USDC.e transfer on the Tempo blockchain. No human clicks "approve." No MetaMask popup. The wallet pays because the agent decided to pay.

**Step 6 — Credential Submission**

After paying, the agent resubmits the same request with an `Authorization` header containing proof of payment (the transaction hash and cryptographic credential). This proves the agent paid the exact amount requested.

**Step 7 — On-Chain Registration**

TempoID's server verifies the payment on-chain, then:
1. Calls `pathUSD.approve()` to authorize the contract
2. Calls `contract.register("yourname", 1)` to mint the domain
3. Calls `contract.transfer("yourname", agent_address)` to give ownership to the agent

**Step 8 — Confirmation**

The agent receives a response with full details:

```json
{
  "success": true,
  "name": "yourname.tempo",
  "owner": "0xYOUR_ADDRESS",
  "duration_years": 1,
  "price_paid": "1 USDC.e",
  "tx_hash": "0x...",
  "block": "123456"
}
```

The entire flow — from discovery to on-chain ownership — happens in seconds with zero human involvement.

---

### All Available Endpoints

TempoID exposes 10 API endpoints. Some are free, some require MPP payment.

**Free Endpoints (no payment required):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mpp/check/{name}` | GET | Check if a name is available and see the price per year |
| `/api/mpp/resolve/{name}` | GET | Resolve a `.tempo` name to its wallet address |
| `/api/mpp/reverse/{address}` | GET | Find the primary `.tempo` name for any wallet address |
| `/api/mpp/marketplace` | GET | Browse all domains currently listed for sale with prices |

**Paid Endpoints (MPP payment required):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mpp/register` | POST | Register a new `.tempo` domain. Agent pays registration fee via MPP |
| `/api/mpp/buy` | POST | Buy a domain listed on the marketplace. Agent pays the listing price via MPP |
| `/api/mpp/renew` | POST | Renew an expiring domain for additional years. Agent pays renewal fee via MPP |

**Owner-Only Endpoints (free, but only the domain owner can call):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mpp/list` | POST | List your domain for sale on the marketplace at a price you choose |
| `/api/mpp/transfer` | POST | Transfer your domain to another wallet address |
| `/api/mpp/metadata` | POST | Set metadata for your domain: bio, avatar, website, social links — all on-chain |

---

### Pricing

| Name Length | Example | Price / Year |
|-------------|---------|-------------|
| 3 characters | `abc.tempo` | $15 |
| 4 characters | `name.tempo` | $3.75 |
| 5+ characters | `yourname.tempo` | $1 |

All prices are in USDC.e (for AI agents via MPP) or pathUSD (for humans via the website). Both are stablecoins pegged to $1.

---

### Smart Contract Details

- **Contract Address:** `0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9`
- **Chain:** Tempo Mainnet (Chain ID: 4217)
- **Payment Token (contract):** pathUSD (`0x20c0000000000000000000000000000000000000`)
- **Payment Token (MPP):** USDC.e (`0x20c000000000000000000000b9537d11c60e8b50`)
- **Marketplace Fee:** 2.5% on all sales
- **Registration:** 1–10 years per transaction
- **Grace Period:** 30 days after expiry before name becomes available again

**Key Contract Functions:**
- `register(name, years)` — Register a name. `msg.sender` becomes the owner automatically
- `getNamesOfOwner(address)` — Returns all names owned by any address (on-chain enumeration)
- `getNameCount(address)` — Returns how many names an address owns
- `transfer(name, newOwner)` — Transfer a name to another address
- `listForSale(name, price)` — List a name on the marketplace
- `buyName(name)` — Buy a listed name with atomic payment
- `setMetadata(name, key, value)` — Store any key-value metadata on-chain
- `resolve(name)` — Get the wallet address for a name
- `reverseLookup(address)` — Get the primary name for a wallet address

---

### Quick Start Examples

**Check if a name is available:**
```bash
tempo request -t https://tempoid.xyz/api/mpp/check/myagent
```

**Register a domain:**
```bash
tempo request -t -X POST \
  --json '{"name":"myagent","owner_address":"0xYOUR_ADDRESS","duration_years":1}' \
  https://tempoid.xyz/api/mpp/register
```

**Resolve a name to an address:**
```bash
tempo request -t https://tempoid.xyz/api/mpp/resolve/myagent
```

**Reverse lookup — find a name from an address:**
```bash
tempo request -t https://tempoid.xyz/api/mpp/reverse/0xYOUR_ADDRESS
```

**Browse the marketplace:**
```bash
tempo request -t https://tempoid.xyz/api/mpp/marketplace
```

**Buy a name from the marketplace:**
```bash
tempo request -t -X POST \
  --json '{"name":"coolname"}' \
  https://tempoid.xyz/api/mpp/buy
```

**List your name for sale:**
```bash
tempo request -t -X POST \
  --json '{"name":"myagent","price":"10"}' \
  https://tempoid.xyz/api/mpp/list
```

**Transfer a name:**
```bash
tempo request -t -X POST \
  --json '{"name":"myagent","to":"0xNEW_OWNER_ADDRESS"}' \
  https://tempoid.xyz/api/mpp/transfer
```

**Set metadata:**
```bash
tempo request -t -X POST \
  --json '{"name":"myagent","key":"bio","value":"I am an autonomous AI agent on Tempo"}' \
  https://tempoid.xyz/api/mpp/metadata
```

**Renew a domain:**
```bash
tempo request -t -X POST \
  --json '{"name":"myagent","duration_years":2}' \
  https://tempoid.xyz/api/mpp/renew
```

---

### For Developers: Using the API Directly

You don't need the Tempo CLI. Any HTTP client works. The MPP flow is standard HTTP:

```python
import requests

# Free — no payment needed
r = requests.get("https://tempoid.xyz/api/mpp/check/myname")
print(r.json())
# {"name": "myname.tempo", "available": true, "price_per_year": 1}
```

For paid endpoints, your client needs to handle the HTTP 402 challenge-response flow. The `mppx` library (TypeScript) or `pympp` (Python) handle this automatically:

```typescript
import { Mppx, tempo } from "mppx/client";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0xYOUR_PRIVATE_KEY");

Mppx.create({
  methods: [tempo({ account })],
});

// fetch is now MPP-aware — 402 challenges are handled automatically
const res = await fetch("https://tempoid.xyz/api/mpp/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "myagent",
    owner_address: account.address,
    duration_years: 1,
  }),
});

console.log(await res.json());
// { success: true, name: "myagent.tempo", owner: "0x...", tx_hash: "0x..." }
```

---

### Why This Matters

Domains have always been a human concept. You register a name, you own it, you use it. But the world is changing. AI agents are becoming autonomous participants in digital ecosystems — they transact, they communicate, they make decisions.

These agents need identity. They need names. And those names need to be owned, verifiable, and tradeable — just like human names.

TempoID makes this possible on Tempo. With MPP, an AI agent can walk into the system, pay for a name, and own it on-chain — no human in the loop.

If humans have written their names on-chain, AI is next. And with TempoID v1.1.0, that future is here.

---

### Links

- **Website:** [tempoid.xyz](https://tempoid.xyz)
- **GitHub:** [github.com/KendineCrypto/tempoid](https://github.com/KendineCrypto/tempoid)
- **Agent Discovery:** [tempoid.xyz/llms.txt](https://tempoid.xyz/llms.txt)
- **Twitter:** [@tempoidapp](https://twitter.com/tempoidapp)
- **Chain:** Tempo Mainnet (Chain ID: 4217)
- **Contract:** [`0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9`](https://explore.tempo.xyz/address/0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9)
