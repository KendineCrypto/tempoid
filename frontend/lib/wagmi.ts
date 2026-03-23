import { createConfig, http } from "wagmi";
import { tempo, tempoTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export { tempo, tempoTestnet };

export const config = createConfig({
  connectors: [injected()],
  chains: [tempo, tempoTestnet],
  multiInjectedProviderDiscovery: true,
  transports: {
    [tempo.id]: http("https://rpc.tempo.xyz"),
    [tempoTestnet.id]: http("https://rpc.moderato.tempo.xyz"),
  },
});
