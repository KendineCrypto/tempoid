import { createClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempo } from "viem/chains";
import { Handler } from "tempo.ts/server";

const PATHUSD = "0x20C0000000000000000000000000000000000000" as const;

let _handler: any = null;
function getHandler() {
  if (!_handler) {
    const key = process.env.DEPLOYER_PRIVATE_KEY;
    if (!key) throw new Error("DEPLOYER_PRIVATE_KEY not set");

    const client = createClient({
      chain: (tempo as any).extend({ feeToken: PATHUSD }),
      transport: http("https://rpc.presto.tempo.xyz"),
    });

    _handler = Handler.feePayer({
      account: privateKeyToAccount(key as `0x${string}`),
      client,
    });
  }
  return _handler;
}

export const GET = (request: Request) => getHandler().fetch(request);
export const POST = (request: Request) => getHandler().fetch(request);
