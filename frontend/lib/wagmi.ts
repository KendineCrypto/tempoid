import { http, createConfig } from "wagmi";
import { defineChain } from "viem";

export const tempo = defineChain({
  id: 4217,
  name: "Tempo",
  nativeCurrency: { name: "pathUSD", symbol: "pathUSD", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.tempo.xyz"] },
  },
  blockExplorers: {
    default: { name: "Tempo Explorer", url: "https://explore.tempo.xyz" },
  },
});

export const tempoModerato = defineChain({
  id: 42431,
  name: "Tempo Moderato",
  nativeCurrency: { name: "pathUSD", symbol: "pathUSD", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.moderato.tempo.xyz"] },
  },
  blockExplorers: {
    default: { name: "Tempo Explorer", url: "https://explore.tempo.xyz" },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [tempo, tempoModerato],
  transports: {
    [tempo.id]: http("https://rpc.tempo.xyz"),
    [tempoModerato.id]: http("https://rpc.moderato.tempo.xyz"),
  },
});
