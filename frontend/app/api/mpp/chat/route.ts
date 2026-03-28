import { Mppx, tempo } from "mppx/server";
import {
  publicClient,
  getWalletClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "@/lib/tempo-client";
import { TEMPO_CHAT_ROOM_ADDRESS, CHAT_ABI } from "@/lib/contract";

// Lazy init MPP
let _mppx: any = null;
function getMppx() {
  if (!_mppx) {
    _mppx = Mppx.create({
      methods: [
        tempo({
          currency: "0x20c000000000000000000000b9537d11c60e8b50",
          recipient: (process.env.TEMPOID_TREASURY_ADDRESS ||
            "0x767bD65bc6992d21956248103b1ac67b24571b89") as `0x${string}`,
        }),
      ],
    });
  }
  return _mppx;
}

// Chat message costs $0.001 (micro-payment for spam prevention + gas)
const CHAT_PRICE = "0.001";
const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: Request) {
  const cloned = request.clone();
  const body = await cloned.json().catch(() => ({}));
  const { name, message } = body;

  // --- Validation ---
  if (!name || !message) {
    return Response.json(
      { error: "name and message required" },
      { status: 400 }
    );
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

  // --- Verify .tempo name exists and is not expired ---
  try {
    const [owner, , isExpired, isAvailable] = (await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getNameInfo",
      args: [cleanName],
    })) as [string, bigint, boolean, boolean];

    if (
      isAvailable ||
      !owner ||
      owner === "0x0000000000000000000000000000000000000000"
    ) {
      return Response.json(
        {
          error: `${cleanName}.tempo is not registered`,
          hint: "Register a .tempo name at https://tempoid.xyz first",
        },
        { status: 404 }
      );
    }

    if (isExpired) {
      return Response.json(
        {
          error: `${cleanName}.tempo is expired`,
          hint: "Renew your .tempo name to continue chatting",
        },
        { status: 403 }
      );
    }
  } catch {
    return Response.json(
      { error: `Could not resolve ${cleanName}.tempo` },
      { status: 404 }
    );
  }

  // --- MPP charge (micro-payment) ---
  const response = await getMppx().charge({
    amount: CHAT_PRICE,
  })(request);

  if (response.status === 402) return response.challenge;

  // --- Payment verified — send message on-chain via server wallet ---
  try {
    const wallet = getWalletClient() as any;

    const txHash = await wallet.writeContract({
      address: TEMPO_CHAT_ROOM_ADDRESS,
      abi: CHAT_ABI,
      functionName: "sendMessage",
      args: [cleanName, message.trim()],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    return response.withReceipt(
      Response.json({
        success: true,
        name: `${cleanName}.tempo`,
        message: message.trim(),
        tx_hash: txHash,
        block: receipt.blockNumber.toString(),
      })
    );
  } catch (error: any) {
    console.error("Chat send error:", error);
    const msg = error?.message || "";

    if (msg.includes("NotNameOwner")) {
      return Response.json(
        {
          error:
            "Server wallet is not the owner of this name. Use Foundry to send directly.",
          hint: 'cast send <chat_contract> "sendMessage(string,string)" "yourname" "message" -r tempo --from $WALLET',
        },
        { status: 403 }
      );
    }

    return Response.json(
      { error: "Failed to send message", detail: msg.slice(0, 200) },
      { status: 500 }
    );
  }
}
