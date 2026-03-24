import { Mppx, tempo } from "mppx/server";
import {
  publicClient,
  getWalletClient,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  PATHUSD,
  PATHUSD_TOKEN_ABI,
} from "@/lib/tempo-client";

// Lazy init MPP
let _mppx: any = null;
function getMppx() {
  if (!_mppx) {
    _mppx = Mppx.create({
      methods: [
        tempo({
          currency: "0x20c0000000000000000000000000000000000000",
          recipient: (process.env.TEMPOID_TREASURY_ADDRESS ||
            "0x767bD65bc6992d21956248103b1ac67b24571b89") as `0x${string}`,
        }),
      ],
    });
  }
  return _mppx;
}

// POST /api/mpp/renew — Renew a name (MPP PAID)
export async function POST(request: Request) {
  const cloned = request.clone();
  const body = await cloned.json().catch(() => ({}));
  const { name, duration_years = 1 } = body;

  if (!name) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  const cleanName = name.toLowerCase().replace(".tempo", "");

  if (duration_years < 1 || duration_years > 10) {
    return Response.json(
      { error: "Duration must be 1-10 years" },
      { status: 400 }
    );
  }

  // Check name exists
  try {
    const info = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getNameInfo",
      args: [cleanName],
    });
    const [owner, , , isAvailable] = info as [string, bigint, boolean, boolean];

    if (isAvailable) {
      return Response.json(
        { error: "Name is not registered, use /register instead" },
        { status: 400 }
      );
    }
  } catch {
    return Response.json({ error: "Name not found" }, { status: 404 });
  }

  // Get renewal fee
  const feeRaw = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRegistrationFee",
    args: [cleanName, BigInt(duration_years)],
  });

  const feeUsd = Number(feeRaw) / 1_000_000;

  // Add gas surcharge ($0.01) — covers server's on-chain transaction costs
  const GAS_SURCHARGE = 0.01;
  const chargeAmount = feeUsd + GAS_SURCHARGE;

  // MPP charge
  const response = await getMppx().charge({
    amount: chargeAmount.toString(),
  })(request);

  if (response.status === 402) return response.challenge;

  // Payment verified — renew on-chain
  try {
    const wallet = getWalletClient() as any;

    // Approve
    const approveTx = await wallet.writeContract({
      address: PATHUSD,
      abi: PATHUSD_TOKEN_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, feeRaw],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    // Renew
    const renewTx = await wallet.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "renew",
      args: [cleanName, BigInt(duration_years)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: renewTx,
    });

    return response.withReceipt(
      Response.json({
        success: true,
        name: `${cleanName}.tempo`,
        renewed_years: duration_years,
        price_paid: `${feeUsd} pathUSD`,
        tx_hash: renewTx,
        block: receipt.blockNumber.toString(),
      })
    );
  } catch (error: any) {
    console.error("Renew error:", error);
    return Response.json(
      { error: "Renewal failed", detail: (error?.message || "").slice(0, 200) },
      { status: 500 }
    );
  }
}
