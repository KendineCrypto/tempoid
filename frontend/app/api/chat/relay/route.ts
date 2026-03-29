import {
  publicClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  getWalletClient,
} from "@/lib/tempo-client";
import { TEMPO_CHAT_ROOM_ADDRESS, CHAT_ABI } from "@/lib/contract";

const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { name, message, reply_to } = body;

  if (!name || !message) {
    return Response.json({ error: "name and message required" }, { status: 400 });
  }

  const cleanName = name.toLowerCase().replace(".tempo", "");

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` },
      { status: 400 }
    );
  }

  // Verify .tempo name exists and get owner
  let owner: string;
  try {
    const [nameOwner, , isExpired, isAvailable] = (await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getNameInfo",
      args: [cleanName],
    })) as [string, bigint, boolean, boolean];

    if (
      isAvailable ||
      !nameOwner ||
      nameOwner === "0x0000000000000000000000000000000000000000"
    ) {
      return Response.json(
        { error: `${cleanName}.tempo is not registered` },
        { status: 404 }
      );
    }

    if (isExpired) {
      return Response.json(
        { error: `${cleanName}.tempo is expired` },
        { status: 403 }
      );
    }

    owner = nameOwner;
  } catch {
    return Response.json(
      { error: `Could not resolve ${cleanName}.tempo` },
      { status: 404 }
    );
  }

  // Relay message on-chain
  try {
    const wallet = getWalletClient() as any;
    const isReply = reply_to !== undefined && reply_to !== null;

    const txHash = isReply
      ? await wallet.writeContract({
          address: TEMPO_CHAT_ROOM_ADDRESS,
          abi: CHAT_ABI,
          functionName: "replyFor",
          args: [cleanName, message.trim(), BigInt(reply_to), owner as `0x${string}`],
        })
      : await wallet.writeContract({
          address: TEMPO_CHAT_ROOM_ADDRESS,
          abi: CHAT_ABI,
          functionName: "sendMessageFor",
          args: [cleanName, message.trim(), owner as `0x${string}`],
        });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return Response.json({
      success: true,
      name: `${cleanName}.tempo`,
      message: message.trim(),
      reply_to: isReply ? reply_to : null,
      tx_hash: txHash,
      block: receipt.blockNumber.toString(),
    });
  } catch (e: any) {
    return Response.json(
      { error: "Failed to relay message", detail: e.message?.slice(0, 200) },
      { status: 500 }
    );
  }
}
