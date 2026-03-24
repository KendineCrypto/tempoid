import { NextRequest } from "next/server";
import {
  publicClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "@/lib/tempo-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = params.name.toLowerCase().replace(".tempo", "");

  try {
    const address = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "resolve",
      args: [name],
    });

    if (address === "0x0000000000000000000000000000000000000000") {
      return Response.json(
        { error: "Name not found or expired" },
        { status: 404 }
      );
    }

    return Response.json({
      name: `${name}.tempo`,
      address,
      resolver: "tempoid.xyz",
    });
  } catch {
    return Response.json(
      { error: "Name not found or expired" },
      { status: 404 }
    );
  }
}
