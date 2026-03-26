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
    // Parallel: check availability, fee, name info, and listing
    const [available, feeRaw, nameInfo, listing] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "isNameAvailable",
        args: [name],
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getRegistrationFee",
        args: [name, BigInt(1)],
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getNameInfo",
        args: [name],
      }).catch(() => null),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getListing",
        args: [name],
      }).catch(() => null),
    ]);

    const len = name.length;
    const category = len <= 3 ? "3 chars" : len === 4 ? "4 chars" : "5+ chars";

    const response: any = {
      name: `${name}.tempo`,
      available,
      category,
      price_per_year_raw: feeRaw.toString(),
      price_per_year_usd: Number(feeRaw) / 1_000_000,
      currency: "pathUSD",
      decimals: 6,
      contract: CONTRACT_ADDRESS,
    };

    // If name is taken, add owner info
    if (!available && nameInfo) {
      const [owner, expiry, isExpired] = nameInfo as [string, bigint, boolean, boolean];
      response.owner = owner;
      response.expiry = Number(expiry);
      response.is_expired = isExpired;
    }

    // If name is listed on marketplace, add listing info
    if (listing) {
      const [seller, price, active] = listing as [string, bigint, boolean];
      if (active) {
        response.listed_for_sale = true;
        response.listing_seller = seller;
        response.listing_price_raw = price.toString();
        response.listing_price_usd = Number(price) / 1_000_000;
        response.buy_endpoint = "POST /api/mpp/buy";
        response.message = "This name is listed on the marketplace. You can buy it directly via the buy endpoint.";
      }
    }

    return Response.json(response);
  } catch (error: any) {
    return Response.json(
      { error: "Failed to check name", detail: error?.message },
      { status: 500 }
    );
  }
}
