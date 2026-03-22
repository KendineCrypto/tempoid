import { createConfig, http } from "wagmi";
import { tempo, tempoTestnet } from "wagmi/chains";
import { KeyManager, webAuthn } from "wagmi/tempo";
import { injected } from "wagmi/connectors";

export { tempo, tempoTestnet };

export const config = createConfig({
  connectors: [
    webAuthn({
      keyManager: KeyManager.localStorage(),
    }),
    injected(),
  ],
  chains: [tempo, tempoTestnet],
  multiInjectedProviderDiscovery: true,
  transports: {
    [tempo.id]: http("https://rpc.tempo.xyz"),
    [tempoTestnet.id]: http("https://rpc.moderato.tempo.xyz"),
  },
});
