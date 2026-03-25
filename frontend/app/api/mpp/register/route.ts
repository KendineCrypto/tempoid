import { Mppx, tempo } from "mppx/server";
import {
  publicClient,
  getWalletClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  PATHUSD,
  PATHUSD_TOKEN_ABI,
} from "@/lib/tempo-client";

// Lazy init — MPP_SECRET_KEY needed at runtime, not build time
let _mppx: any = null;
function getMppx() {
  if (!_mppx) {
    _mppx = Mppx.create({
      methods: [
        tempo({
          currency: "0x20c000000000000000000000b9537d11c60e8b50", // USDC.e (Tempo Wallet token)
          // AI agent pays USDC.e → server wallet receives it
          // Server uses its own pathUSD to register on contract → transfers name to agent
          recipient: (process.env.TEMPOID_TREASURY_ADDRESS ||
            "0x767bD65bc6992d21956248103b1ac67b24571b89") as `0x${string}`,
        }),
      ],
    });
  }
  return _mppx;
}

export async function POST(request: Request) {
  // Parse body (clone because mppx also reads the request)
  const cloned = request.clone();
  const body = await cloned.json().catch(() => ({}));
  const { name, owner_address, duration_years = 1 } = body;

  // --- Validation ---
  if (!name || !owner_address) {
    return Response.json(
      { error: "name and owner_address required" },
      { status: 400 }
    );
  }

  const cleanName = name.toLowerCase().replace(".tempo", "");

  if (
    !/^[a-z0-9-]{3,63}$/.test(cleanName) ||
    cleanName.startsWith("-") ||
    cleanName.endsWith("-")
  ) {
    return Response.json({ error: "Invalid name format" }, { status: 400 });
  }

  if (duration_years < 1 || duration_years > 10) {
    return Response.json(
      { error: "Duration must be 1-10 years" },
      { status: 400 }
    );
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(owner_address)) {
    return Response.json(
      { error: "Invalid owner_address format" },
      { status: 400 }
    );
  }

  // --- Check availability ---
  const isAvailable = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isNameAvailable",
    args: [cleanName],
  });

  if (!isAvailable) {
    return Response.json({ error: "Name already taken" }, { status: 409 });
  }

  // --- Get fee from contract (respects on-chain pricing) ---
  const totalFeeRaw = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRegistrationFee",
    args: [cleanName, BigInt(duration_years)],
  });

  const totalPriceUsd = Number(totalFeeRaw) / 1_000_000;

  // Add gas surcharge ($0.01) — covers server's on-chain transaction costs
  const GAS_SURCHARGE = 0.01;
  const chargeAmount = totalPriceUsd + GAS_SURCHARGE;

  // --- MPP charge: collect pathUSD from AI agent ---
  // Flow: 402 challenge → agent pays pathUSD to our server wallet → we verify → proceed
  const response = await getMppx().charge({
    amount: chargeAmount.toString(),
  })(request);

  // 402 = payment not yet made, return challenge to agent
  if (response.status === 402) return response.challenge;

  // --- Payment verified — register on-chain ---
  try {
    const wallet = getWalletClient() as any;

    // 1. Approve pathUSD spending by contract
    const approveTx = await wallet.writeContract({
      address: PATHUSD,
      abi: PATHUSD_TOKEN_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, totalFeeRaw],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    // 2. Register name (msg.sender = server wallet becomes temporary owner)
    const registerTx = await wallet.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "register",
      args: [cleanName, BigInt(duration_years)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: registerTx,
    });

    // 3. Transfer name to the actual owner (the AI agent's specified address)
    let transferTx: string | null = null;
    if (
      owner_address.toLowerCase() !== wallet.account.address.toLowerCase()
    ) {
      const txHash = await wallet.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "transfer",
        args: [cleanName, owner_address as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      transferTx = txHash;
    }

    // Return success with MPP receipt attached
    return response.withReceipt(
      Response.json({
        success: true,
        name: `${cleanName}.tempo`,
        owner: owner_address,
        duration_years,
        price_paid: `${totalPriceUsd} pathUSD`,
        tx_hash: registerTx,
        transfer_tx: transferTx,
        block: receipt.blockNumber.toString(),
      })
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    const msg = error?.message || "";

    if (msg.includes("NameNotAvailable")) {
      return Response.json(
        { error: "Name just got taken, try again" },
        { status: 409 }
      );
    }
    if (msg.includes("insufficient")) {
      return Response.json(
        {
          error: "Server wallet has insufficient pathUSD for registration",
          detail: "The MPP payment was received but registration failed. Contact support.",
        },
        { status: 503 }
      );
    }

    return Response.json(
      { error: "Registration failed", detail: msg.slice(0, 200) },
      { status: 500 }
    );
  }
}
