import { createConfig, http } from "wagmi";
import { tempo, tempoTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { webAuthn, KeyManager } from "wagmi/tempo";

export { tempo, tempoTestnet };

export const config = createConfig({
  connectors: [
    injected(),
    webAuthn({ keyManager: KeyManager.http("https://keys.tempo.xyz") }),
  ],
  chains: [tempo, tempoTestnet],
  multiInjectedProviderDiscovery: true,
  transports: {
    [tempo.id]: http("https://rpc.presto.tempo.xyz"),
    [tempoTestnet.id]: http("https://rpc.moderato.tempo.xyz"),
  },
});
