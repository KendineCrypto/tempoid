import {
  publicClient,
  getWalletClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "@/lib/tempo-client";

// POST /api/mpp/metadata — Set or get metadata for a name (FREE for get, owner-only for set)
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { name, key, value, action = "set" } = body;

  if (!name || !key) {
    return Response.json(
      { error: "name and key required" },
      { status: 400 }
    );
  }

  const cleanName = name.toLowerCase().replace(".tempo", "");

  // GET metadata
  if (action === "get") {
    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getMetadata",
        args: [cleanName, key],
      });

      return Response.json({
        name: `${cleanName}.tempo`,
        key,
        value: result,
      });
    } catch {
      return Response.json({ error: "Metadata not found" }, { status: 404 });
    }
  }

  // SET metadata — server wallet must own the name
  if (value === undefined || value === null) {
    return Response.json(
      { error: "value required for set action" },
      { status: 400 }
    );
  }

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

    if (owner.toLowerCase() !== wallet.account.address.toLowerCase()) {
      return Response.json(
        { error: "Server wallet does not own this name" },
        { status: 403 }
      );
    }

    const tx = await wallet.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "setMetadata",
      args: [cleanName, key, value],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    return Response.json({
      success: true,
      name: `${cleanName}.tempo`,
      key,
      value,
      tx_hash: tx,
    });
  } catch (error: any) {
    console.error("Metadata error:", error);
    return Response.json(
      { error: "Metadata update failed", detail: (error?.message || "").slice(0, 200) },
      { status: 500 }
    );
  }
}
