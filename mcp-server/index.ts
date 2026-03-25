#!/usr/bin/env npx tsx
/**
 * TempoID MCP Server
 *
 * AI agents can use this as an MCP tool server to:
 * - Check .tempo domain availability (free)
 * - Resolve .tempo names to addresses (free)
 * - Reverse lookup addresses to names (free)
 * - Register .tempo domains (paid via MPP)
 * - Buy domains from marketplace (paid via MPP)
 * - List domains for sale (free, owner only)
 * - Renew domains (paid via MPP)
 *
 * Usage:
 *   npx tsx mcp-server/index.ts
 *
 * Add to Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "tempoid": {
 *         "command": "npx",
 *         "args": ["tsx", "mcp-server/index.ts"]
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Mppx, tempo } from "mppx/server";
import { Transport } from "mppx/mcp-sdk/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

// --- Config ---
const RPC_URL = "https://rpc.presto.tempo.xyz";
const CONTRACT = "0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9" as const;
const PATHUSD = "0x20c0000000000000000000000000000000000000" as const;

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
const TREASURY = (process.env.TEMPOID_TREASURY_ADDRESS ||
  "0x767bD65bc6992d21956248103b1ac67b24571b89") as `0x${string}`;

// --- Tempo chain definition ---
const tempoChain = {
  id: 4217,
  name: "Tempo",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
} as const;

// --- Viem clients ---
const publicClient = createPublicClient({
  chain: tempoChain as any,
  transport: http(RPC_URL),
});

let walletClient: any = null;
function getWallet() {
  if (!walletClient && DEPLOYER_KEY) {
    const account = privateKeyToAccount(DEPLOYER_KEY);
    walletClient = createWalletClient({
      account,
      chain: tempoChain as any,
      transport: http(RPC_URL),
    });
  }
  return walletClient;
}

// --- ABIs ---
const TNS_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "years_", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "resolve",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "reverseLookup",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "string" }],
  },
  {
    name: "isNameAvailable",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getRegistrationFee",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "years_", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getNameInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "expiry", type: "uint256" },
      { name: "isExpired", type: "bool" },
      { name: "isAvailable", type: "bool" },
    ],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "newOwner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "renew",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "years_", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getNamesOfOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "string[]" }],
  },
  {
    name: "listForSale",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "price", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "buyName",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
    outputs: [],
  },
  {
    name: "getListing",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
  {
    name: "getListingCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getListedNameByIndex",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
] as const;

const PATHUSD_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

// --- MPP Payment Handler (MCP transport) ---
const USDC_E = "0x20c000000000000000000000b9537d11c60e8b50" as const; // USDC.e (Tempo Wallet token)

const payment = Mppx.create({
  methods: [
    tempo({
      currency: USDC_E, // AI agents pay with USDC.e (Tempo Wallet's token)
      recipient: TREASURY,
    }),
  ],
  transport: Transport.mcpSdk(),
});

// --- MCP Server ---
const server = new McpServer({
  name: "tempoid",
  version: "1.0.0",
});

// ==========================================
// FREE TOOLS (no payment required)
// ==========================================

server.tool(
  "check_domain",
  "Check if a .tempo domain is available and get pricing",
  { name: z.string().describe("Domain name without .tempo suffix (e.g. 'alice')") },
  async ({ name }) => {
    const cleanName = name.toLowerCase().replace(".tempo", "");

    if (!/^[a-z0-9-]{3,63}$/.test(cleanName) || cleanName.startsWith("-") || cleanName.endsWith("-")) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Invalid name. Use 3-63 lowercase alphanumeric characters or hyphens." }) }] };
    }

    const available = await publicClient.readContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "isNameAvailable",
      args: [cleanName],
    });

    const feeRaw = await publicClient.readContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "getRegistrationFee",
      args: [cleanName, 1n],
    });

    const pricePerYear = Number(feeRaw) / 1_000_000;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          name: `${cleanName}.tempo`,
          available,
          price_per_year: pricePerYear,
          currency: "pathUSD",
        }),
      }],
    };
  }
);

server.tool(
  "resolve_domain",
  "Resolve a .tempo domain name to a wallet address",
  { name: z.string().describe("Domain name (e.g. 'alice' or 'alice.tempo')") },
  async ({ name }) => {
    const cleanName = name.toLowerCase().replace(".tempo", "");

    try {
      const address = await publicClient.readContract({
        address: CONTRACT,
        abi: TNS_ABI,
        functionName: "resolve",
        args: [cleanName],
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            name: `${cleanName}.tempo`,
            address,
            resolver: "tempoid.xyz",
          }),
        }],
      };
    } catch {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "Name not found or expired" }) }],
      };
    }
  }
);

server.tool(
  "reverse_lookup",
  "Look up the primary .tempo name for a wallet address",
  { address: z.string().describe("Wallet address (0x...)") },
  async ({ address }) => {
    try {
      const name = await publicClient.readContract({
        address: CONTRACT,
        abi: TNS_ABI,
        functionName: "reverseLookup",
        args: [address as `0x${string}`],
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            address,
            primary_name: name ? `${name}.tempo` : null,
          }),
        }],
      };
    } catch {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "No primary name set" }) }],
      };
    }
  }
);

server.tool(
  "get_domain_info",
  "Get detailed info about a .tempo domain (owner, expiry, availability)",
  { name: z.string().describe("Domain name without .tempo suffix") },
  async ({ name }) => {
    const cleanName = name.toLowerCase().replace(".tempo", "");

    try {
      const [owner, expiry, isExpired, isAvailable] = await publicClient.readContract({
        address: CONTRACT,
        abi: TNS_ABI,
        functionName: "getNameInfo",
        args: [cleanName],
      }) as [string, bigint, boolean, boolean];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            name: `${cleanName}.tempo`,
            owner,
            expiry: new Date(Number(expiry) * 1000).toISOString(),
            is_expired: isExpired,
            is_available: isAvailable,
          }),
        }],
      };
    } catch {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "Name not found" }) }],
      };
    }
  }
);

server.tool(
  "get_names_of_owner",
  "Get all .tempo domains owned by a wallet address",
  { address: z.string().describe("Wallet address (0x...)") },
  async ({ address }) => {
    const names = await publicClient.readContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "getNamesOfOwner",
      args: [address as `0x${string}`],
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          address,
          names: (names as string[]).map((n) => `${n}.tempo`),
          count: (names as string[]).length,
        }),
      }],
    };
  }
);

server.tool(
  "browse_marketplace",
  "Browse .tempo domains listed for sale on the marketplace",
  {},
  async () => {
    const count = await publicClient.readContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "getListingCount",
    }) as bigint;

    const listings = [];
    const max = Math.min(Number(count), 50);

    for (let i = 0; i < max; i++) {
      const name = await publicClient.readContract({
        address: CONTRACT,
        abi: TNS_ABI,
        functionName: "getListedNameByIndex",
        args: [BigInt(i)],
      }) as string;

      const [seller, price, active] = await publicClient.readContract({
        address: CONTRACT,
        abi: TNS_ABI,
        functionName: "getListing",
        args: [name],
      }) as [string, bigint, boolean];

      if (active) {
        listings.push({
          name: `${name}.tempo`,
          seller,
          price: Number(price) / 1_000_000,
          currency: "pathUSD",
        });
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ listings, total: listings.length }),
      }],
    };
  }
);

// ==========================================
// PAID TOOLS (MPP payment required)
// ==========================================

server.tool(
  "register_domain",
  "Register a new .tempo domain. Requires MPP payment in pathUSD.",
  {
    name: z.string().describe("Domain name without .tempo suffix (e.g. 'alice')"),
    owner_address: z.string().describe("Wallet address that will own the domain (0x...)"),
    duration_years: z.number().min(1).max(10).default(1).describe("Registration duration in years"),
  },
  async ({ name, owner_address, duration_years }, extra) => {
    const cleanName = name.toLowerCase().replace(".tempo", "");

    // Validate
    if (!/^[a-z0-9-]{3,63}$/.test(cleanName) || cleanName.startsWith("-") || cleanName.endsWith("-")) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Invalid name format" }) }] };
    }

    // Check availability
    const isAvailable = await publicClient.readContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "isNameAvailable",
      args: [cleanName],
    });
    if (!isAvailable) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Name already taken" }) }] };
    }

    // Get price from contract
    const feeRaw = await publicClient.readContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "getRegistrationFee",
      args: [cleanName, BigInt(duration_years)],
    }) as bigint;

    const totalPriceUsd = Number(feeRaw) / 1_000_000;
    const chargeAmount = totalPriceUsd + 0.01; // gas surcharge

    // MPP charge — agent pays pathUSD
    const result = await payment.charge({ amount: chargeAmount.toString() })(extra);
    if (result.status === 402) throw result.challenge;

    // Payment received — register on-chain
    const wallet = getWallet();

    // Approve
    const approveTx = await wallet.writeContract({
      address: PATHUSD,
      abi: PATHUSD_ABI,
      functionName: "approve",
      args: [CONTRACT, feeRaw],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    // Register
    const registerTx = await wallet.writeContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "register",
      args: [cleanName, BigInt(duration_years)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: registerTx });

    // Transfer to owner
    let transferTx = null;
    if (owner_address.toLowerCase() !== wallet.account.address.toLowerCase()) {
      const tx = await wallet.writeContract({
        address: CONTRACT,
        abi: TNS_ABI,
        functionName: "transfer",
        args: [cleanName, owner_address as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      transferTx = tx;
    }

    return result.withReceipt({
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          name: `${cleanName}.tempo`,
          owner: owner_address,
          duration_years,
          price_paid: `${totalPriceUsd} pathUSD`,
          tx_hash: registerTx,
          transfer_tx: transferTx,
          block: receipt.blockNumber.toString(),
        }),
      }],
    });
  }
);

server.tool(
  "buy_domain",
  "Buy a .tempo domain from the marketplace. Requires MPP payment in pathUSD.",
  {
    name: z.string().describe("Domain name to buy (without .tempo suffix)"),
    buyer_address: z.string().describe("Wallet address of the buyer (0x...)"),
  },
  async ({ name, buyer_address }, extra) => {
    const cleanName = name.toLowerCase().replace(".tempo", "");

    // Get listing
    const [seller, price, active] = await publicClient.readContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "getListing",
      args: [cleanName],
    }) as [string, bigint, boolean];

    if (!active) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Domain not listed for sale" }) }] };
    }

    const priceUsd = Number(price) / 1_000_000;
    const chargeAmount = priceUsd + 0.01;

    // MPP charge
    const result = await payment.charge({ amount: chargeAmount.toString() })(extra);
    if (result.status === 402) throw result.challenge;

    const wallet = getWallet();

    // Approve
    const approveTx = await wallet.writeContract({
      address: PATHUSD,
      abi: PATHUSD_ABI,
      functionName: "approve",
      args: [CONTRACT, price],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    // Buy
    const buyTx = await wallet.writeContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "buyName",
      args: [cleanName],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: buyTx });

    // Transfer to actual buyer if different
    let transferTx = null;
    if (buyer_address.toLowerCase() !== wallet.account.address.toLowerCase()) {
      const tx = await wallet.writeContract({
        address: CONTRACT,
        abi: TNS_ABI,
        functionName: "transfer",
        args: [cleanName, buyer_address as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      transferTx = tx;
    }

    return result.withReceipt({
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          name: `${cleanName}.tempo`,
          buyer: buyer_address,
          price_paid: `${priceUsd} pathUSD`,
          seller,
          tx_hash: buyTx,
          transfer_tx: transferTx,
          block: receipt.blockNumber.toString(),
        }),
      }],
    });
  }
);

server.tool(
  "renew_domain",
  "Renew a .tempo domain registration. Requires MPP payment in pathUSD.",
  {
    name: z.string().describe("Domain name to renew (without .tempo suffix)"),
    years: z.number().min(1).max(10).default(1).describe("Number of years to renew"),
  },
  async ({ name, years }, extra) => {
    const cleanName = name.toLowerCase().replace(".tempo", "");

    const feeRaw = await publicClient.readContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "getRegistrationFee",
      args: [cleanName, BigInt(years)],
    }) as bigint;

    const priceUsd = Number(feeRaw) / 1_000_000;
    const chargeAmount = priceUsd + 0.01;

    // MPP charge
    const result = await payment.charge({ amount: chargeAmount.toString() })(extra);
    if (result.status === 402) throw result.challenge;

    const wallet = getWallet();

    // Approve
    const approveTx = await wallet.writeContract({
      address: PATHUSD,
      abi: PATHUSD_ABI,
      functionName: "approve",
      args: [CONTRACT, feeRaw],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    // Renew
    const renewTx = await wallet.writeContract({
      address: CONTRACT,
      abi: TNS_ABI,
      functionName: "renew",
      args: [cleanName, BigInt(years)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: renewTx });

    return result.withReceipt({
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          name: `${cleanName}.tempo`,
          years_renewed: years,
          price_paid: `${priceUsd} pathUSD`,
          tx_hash: renewTx,
          block: receipt.blockNumber.toString(),
        }),
      }],
    });
  }
);

// ==========================================
// START SERVER
// ==========================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TempoID MCP Server running on stdio");
}

main().catch(console.error);
