import {
  publicClient,
  getWalletClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "@/lib/tempo-client";

// POST /api/mpp/transfer — Transfer a name to another address (FREE — server-owned names only)
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { name, to_address } = body;

  if (!name || !to_address) {
    return Response.json(
      { error: "name and to_address required" },
      { status: 400 }
    );
  }

  const cleanName = name.toLowerCase().replace(".tempo", "");

  if (!/^0x[a-fA-F0-9]{40}$/.test(to_address)) {
    return Response.json(
      { error: "Invalid to_address format" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
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
      functionName: "transfer",
      args: [cleanName, to_address as `0x${string}`],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    return Response.json({
      success: true,
      name: `${cleanName}.tempo`,
      from: wallet.account.address,
      to: to_address,
      tx_hash: tx,
    });
  } catch (error: any) {
    console.error("Transfer error:", error);
    return Response.json(
      { error: "Transfer failed", detail: (error?.message || "").slice(0, 200) },
      { status: 500 }
    );
  }
}
