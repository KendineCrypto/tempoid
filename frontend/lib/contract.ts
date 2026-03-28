export const TEMPO_NAME_SERVICE_ADDRESS =
  "0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9" as const;

export const PATHUSD_ADDRESS =
  "0x20c0000000000000000000000000000000000000" as const;

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

// --- TempoChatRoom ---
export const TEMPO_CHAT_ROOM_ADDRESS =
  "0xc333f724D1D3Ac605a86Dbd7E4Cf6FfE2a98F1ED" as const;

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
    name: "messageCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "MessageSent",
    type: "event",
    inputs: [
      { name: "messageId", type: "uint256", indexed: true },
      { name: "name", type: "string", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "message", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
