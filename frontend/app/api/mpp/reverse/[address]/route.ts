import { NextRequest } from "next/server";
import {
  publicClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "@/lib/tempo-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const addr = params.address;

  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return Response.json({ error: "Invalid address format" }, { status: 400 });
  }

  try {
    const name = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "reverseLookup",
      args: [addr as `0x${string}`],
    });

    if (!name) {
      return Response.json(
        { error: "No primary name set for this address" },
        { status: 404 }
      );
    }

    return Response.json({
      address: addr,
      primary_name: `${name}.tempo`,
    });
  } catch {
    return Response.json(
      { error: "No primary name set for this address" },
      { status: 404 }
    );
  }
}
