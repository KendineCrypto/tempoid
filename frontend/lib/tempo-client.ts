import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  type WalletClient,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  TEMPO_NAME_SERVICE_ADDRESS,
  PATHUSD_ADDRESS,
  PATHUSD_ABI,
  TNS_ABI,
} from "./contract";

const tempoChain = defineChain({
  id: 4217,
  name: "Tempo",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.presto.tempo.xyz"] },
  },
  blockExplorers: {
    default: { name: "Tempo Explorer", url: "https://explore.tempo.xyz" },
  },
});

const transport = http("https://rpc.presto.tempo.xyz");

// Public client — always available (read-only)
export const publicClient: PublicClient = createPublicClient({
  chain: tempoChain,
  transport,
}) as PublicClient;

// Wallet client — lazy init (needs DEPLOYER_PRIVATE_KEY at runtime, not build time)
let _walletClient: WalletClient | null = null;

export function getWalletClient(): WalletClient {
  if (!_walletClient) {
    const key = process.env.DEPLOYER_PRIVATE_KEY;
    if (!key) {
      throw new Error("DEPLOYER_PRIVATE_KEY not set");
    }
    const account = privateKeyToAccount(key as `0x${string}`);
    _walletClient = createWalletClient({
      account,
      chain: tempoChain,
      transport,
    });
  }
  return _walletClient;
}

export const CONTRACT_ADDRESS = TEMPO_NAME_SERVICE_ADDRESS;
export const CONTRACT_ABI = TNS_ABI;
export const PATHUSD = PATHUSD_ADDRESS;
export const PATHUSD_TOKEN_ABI = PATHUSD_ABI;
