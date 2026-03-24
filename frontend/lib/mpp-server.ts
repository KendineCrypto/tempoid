import { Mppx, tempo } from "mppx/nextjs";

// MPP recipient = server wallet (DEPLOYER_PRIVATE_KEY's address)
// Flow: AI agent pays pathUSD → server wallet → server registers name → transfers to agent's owner
// This way server wallet always has enough pathUSD from incoming payments — no out-of-pocket cost
export const mppx = Mppx.create({
  methods: [
    tempo({
      currency: "0x20c0000000000000000000000000000000000000", // pathUSD on Tempo
      recipient: (process.env.TEMPOID_TREASURY_ADDRESS ||
        "0x767bD65bc6992d21956248103b1ac67b24571b89") as `0x${string}`,
    }),
  ],
});
