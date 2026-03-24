import { NextRequest } from "next/server";
import {
  publicClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "@/lib/tempo-client";

// GET /api/mpp/marketplace — Browse all active listings (FREE)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    // Get total listing count
    const totalCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getListingCount",
      args: [],
    });

    // Get listed names with pagination
    const names = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getListings",
      args: [BigInt(offset), BigInt(limit)],
    });

    // Get details for each listing
    const listings = await Promise.all(
      (names as string[]).map(async (name) => {
        try {
          const listing = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getListing",
            args: [name],
          });
          const [seller, price, active] = listing as [string, bigint, boolean];
          return {
            name: `${name}.tempo`,
            seller,
            price_raw: price.toString(),
            price_usd: Number(price) / 1_000_000,
            active,
          };
        } catch {
          return null;
        }
      })
    );

    return Response.json({
      total: Number(totalCount),
      offset,
      limit,
      listings: listings.filter(Boolean),
    });
  } catch (error: any) {
    return Response.json(
      { error: "Failed to fetch marketplace", detail: error?.message },
      { status: 500 }
    );
  }
}
