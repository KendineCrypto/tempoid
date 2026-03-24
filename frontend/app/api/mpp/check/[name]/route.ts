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

  // Validation
  if (
    !/^[a-z0-9-]{3,63}$/.test(name) ||
    name.startsWith("-") ||
    name.endsWith("-")
  ) {
    return Response.json({ error: "Invalid name format" }, { status: 400 });
  }

  try {
    const available = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "isNameAvailable",
      args: [name],
    });

    // Get actual fee from contract
    const feeRaw = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getRegistrationFee",
      args: [name, BigInt(1)],
    });

    const len = name.length;
    const category = len <= 3 ? "3 chars" : len === 4 ? "4 chars" : "5+ chars";

    return Response.json({
      name: `${name}.tempo`,
      available,
      category,
      price_per_year_raw: feeRaw.toString(),
      price_per_year_usd: Number(feeRaw) / 1_000_000,
      currency: "pathUSD",
      decimals: 6,
      contract: CONTRACT_ADDRESS,
    });
  } catch (error: any) {
    return Response.json(
      { error: "Failed to check name", detail: error?.message },
      { status: 500 }
    );
  }
}
