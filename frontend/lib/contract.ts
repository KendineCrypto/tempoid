export const TEMPO_NAME_SERVICE_ADDRESS =
  "0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9" as const;

export const PATHUSD_ADDRESS =
  "0x20c0000000000000000000000000000000000000" as const;

// --- Multi-TLD Contracts (V2 — multi-token) ---
export const TLD_CONTRACTS = {
  tempo: "0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9", // V1
  mpp: "0x813b0D098045dBC2d48e6445484eBB37B64C4F7C",   // V3 (NFT)
  agent: "0x5851360293B6aBdD62b3028BDF06Ce0B58B27e77", // V3 (NFT)
  ai: "0xEff5dEFD9741087465d5928E769cA1Fb138C8CC4",   // V3 (NFT)
} as const;

export type TLD = keyof typeof TLD_CONTRACTS;
export const TLDS: TLD[] = ["tempo", "mpp", "agent", "ai"];

export function getContractAddress(tld: TLD): `0x${string}` {
  return TLD_CONTRACTS[tld] as `0x${string}`;
}

export function isV2(tld: TLD): boolean {
  return tld !== "tempo";
}

// --- Token addresses (Tempo chain) ---
export const TOKENS = {
  pathUSD: "0x20c0000000000000000000000000000000000000",
  "USDC.e": "0x20C000000000000000000000b9537d11c60E8b50",
  USDT0: "0x20C00000000000000000000014f22CA97301EB73",
} as const;

export type TokenName = keyof typeof TOKENS;
export const TOKEN_NAMES: TokenName[] = ["pathUSD", "USDC.e", "USDT0"];

export function getTokenAddress(name: TokenName): `0x${string}` {
  return TOKENS[name] as `0x${string}`;
}

// V2 tokens available for .mpp, .agent, .ai
export const V2_PAYMENT_TOKENS = [
  { name: "pathUSD" as const, address: TOKENS.pathUSD, decimals: 6 },
  { name: "USDC.e" as const, address: TOKENS["USDC.e"], decimals: 6 },
  { name: "USDT0" as const, address: TOKENS.USDT0, decimals: 6 },
];

export const PATHUSD_ABI = [
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
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const TNS_ABI = [
  // Registration (v2: no owner param, msg.sender is owner)
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
  // Resolution
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
  // Management
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
    name: "setPrimaryName",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
    outputs: [],
  },
  {
    name: "clearPrimaryName",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "setMetadata",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
  },
  // View
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
    name: "getMetadata",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "key", type: "string" },
    ],
    outputs: [{ type: "string" }],
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
    name: "isNameAvailable",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getNamesOfOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "string[]" }],
  },
  {
    name: "getNameCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getGracePeriodRemaining",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getListings",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ name: "names", type: "string[]" }],
  },
  {
    name: "cleanExpiredListings",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "maxClean", type: "uint256" }],
    outputs: [],
  },
  // Marketplace
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
    name: "cancelListing",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
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
  // Events
  {
    name: "NameRegistered",
    type: "event",
    inputs: [
      { name: "name", type: "string", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "expiry", type: "uint256", indexed: false },
    ],
  },
  {
    name: "NameRenewed",
    type: "event",
    inputs: [
      { name: "name", type: "string", indexed: true },
      { name: "newExpiry", type: "uint256", indexed: false },
    ],
  },
  {
    name: "NameTransferred",
    type: "event",
    inputs: [
      { name: "name", type: "string", indexed: true },
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
    ],
  },
  {
    name: "NameListed",
    type: "event",
    inputs: [
      { name: "name", type: "string", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    name: "NameSold",
    type: "event",
    inputs: [
      { name: "name", type: "string", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "price", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
] as const;

// --- V2 ABI (multi-token: register/renew/listForSale have token param) ---
export const TNS_V2_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "years_", type: "uint256" },
      { name: "token", type: "address" },
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
    name: "renew",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "years_", type: "uint256" },
      { name: "token", type: "address" },
    ],
    outputs: [],
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
    name: "setPrimaryName",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
    outputs: [],
  },
  {
    name: "clearPrimaryName",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "setMetadata",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
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
    name: "getMetadata",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "key", type: "string" },
    ],
    outputs: [{ type: "string" }],
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
    name: "isNameAvailable",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getNamesOfOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "string[]" }],
  },
  {
    name: "getNameCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getGracePeriodRemaining",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getListings",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ name: "names", type: "string[]" }],
  },
  {
    name: "cleanExpiredListings",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "maxClean", type: "uint256" }],
    outputs: [],
  },
  {
    name: "listForSale",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "price", type: "uint256" },
      { name: "token", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "cancelListing",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
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
      { name: "priceToken", type: "address" },
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
  {
    name: "getAcceptedTokens",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    name: "isTokenAccepted",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

// --- TempoChatRoom ---
export const TEMPO_CHAT_ROOM_ADDRESS =
  "0x11223c9241770F415fe31b890a782533236a4Fa8" as const;

export const CHAT_ABI = [
  {
    name: "sendMessage",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "message", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "reply",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "message", type: "string" },
      { name: "replyTo", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "sendMessageFor",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "message", type: "string" },
      { name: "sender", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "replyFor",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "message", type: "string" },
      { name: "replyTo", type: "uint256" },
      { name: "sender", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "messageCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "addRelayer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "relayer", type: "address" }],
    outputs: [],
  },
  {
    name: "relayers",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "MessageSent",
    type: "event",
    inputs: [
      { name: "messageId", type: "uint256", indexed: true },
      { name: "replyTo", type: "uint256", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "message", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
