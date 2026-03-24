import {
  publicClient,
  getWalletClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "@/lib/tempo-client";

// POST /api/mpp/list — List a name for sale or cancel listing (FREE — owner only)
// This requires the server wallet to own the name, so only works for names
// registered via MPP. For user-owned names, use the frontend directly.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { name, price, action = "list" } = body;

  if (!name) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  const cleanName = name.toLowerCase().replace(".tempo", "");

  // Verify the name exists and check owner
  try {
    const info = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getNameInfo",
      args: [cleanName],
    });
    const [owner, , isExpired] = info as [string, bigint, boolean, boolean];

    if (isExpired) {
      return Response.json({ error: "Name is expired" }, { status: 400 });
    }

    const wallet = getWalletClient() as any;

    // Only server wallet can list via API (it must own the name)
    if (owner.toLowerCase() !== wallet.account.address.toLowerCase()) {
      return Response.json(
        {
          error: "Server wallet does not own this name",
          detail: "Only names owned by the server wallet can be listed via API. Use the frontend for user-owned names.",
        },
        { status: 403 }
      );
    }

    if (action === "cancel") {
      const tx = await wallet.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "cancelListing",
        args: [cleanName],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      return Response.json({
        success: true,
        name: `${cleanName}.tempo`,
        action: "cancelled",
        tx_hash: tx,
      });
    }

    // List for sale
    if (!price || price <= 0) {
      return Response.json(
        { error: "price required (in pathUSD, e.g. 10)" },
        { status: 400 }
      );
    }

    const priceRaw = BigInt(Math.round(price * 1_000_000));

    const tx = await wallet.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "listForSale",
      args: [cleanName, priceRaw],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    return Response.json({
      success: true,
      name: `${cleanName}.tempo`,
      action: "listed",
      price_usd: price,
      price_raw: priceRaw.toString(),
      tx_hash: tx,
    });
  } catch (error: any) {
    console.error("List error:", error);
    return Response.json(
      { error: "Listing failed", detail: (error?.message || "").slice(0, 200) },
      { status: 500 }
    );
  }
}
