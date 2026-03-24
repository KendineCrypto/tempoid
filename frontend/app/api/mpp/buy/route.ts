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

// POST /api/mpp/buy — Buy a listed name from marketplace (MPP PAID)
export async function POST(request: Request) {
  const cloned = request.clone();
  const body = await cloned.json().catch(() => ({}));
  const { name, buyer_address } = body;

  // Validation
  if (!name || !buyer_address) {
    return Response.json(
      { error: "name and buyer_address required" },
      { status: 400 }
    );
  }

  const cleanName = name.toLowerCase().replace(".tempo", "");

  if (!/^0x[a-fA-F0-9]{40}$/.test(buyer_address)) {
    return Response.json(
      { error: "Invalid buyer_address format" },
      { status: 400 }
    );
  }

  // Check listing exists and is active
  let listing: any;
  try {
    listing = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getListing",
      args: [cleanName],
    });
  } catch {
    return Response.json({ error: "Name not listed for sale" }, { status: 404 });
  }

  const [seller, price, active] = listing as [string, bigint, boolean];

  if (!active) {
    return Response.json({ error: "Listing is not active" }, { status: 404 });
  }

  const priceUsd = Number(price) / 1_000_000;

  // Add gas surcharge ($0.01) — covers server's on-chain transaction costs
  const GAS_SURCHARGE = 0.01;
  const chargeAmount = priceUsd + GAS_SURCHARGE;

  // MPP charge — collect listing price + gas surcharge from AI agent
  const response = await getMppx().charge({
    amount: chargeAmount.toString(),
  })(request);

  if (response.status === 402) return response.challenge;

  // Payment verified — execute buy on-chain
  try {
    const wallet = getWalletClient() as any;

    // 1. Approve full price for contract (contract handles seller payment + fee)
    const approveTx = await wallet.writeContract({
      address: PATHUSD,
      abi: PATHUSD_TOKEN_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, price],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    // 2. Buy the name (contract transfers to msg.sender = server wallet)
    const buyTx = await wallet.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "buyName",
      args: [cleanName],
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: buyTx,
    });

    // 3. Transfer to actual buyer if different from server wallet
    let transferTx: string | null = null;
    if (buyer_address.toLowerCase() !== wallet.account.address.toLowerCase()) {
      const txHash = await wallet.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "transfer",
        args: [cleanName, buyer_address as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      transferTx = txHash;
    }

    return response.withReceipt(
      Response.json({
        success: true,
        name: `${cleanName}.tempo`,
        buyer: buyer_address,
        seller,
        price_paid: `${priceUsd} pathUSD`,
        tx_hash: buyTx,
        transfer_tx: transferTx,
        block: receipt.blockNumber.toString(),
      })
    );
  } catch (error: any) {
    console.error("Buy error:", error);
    return Response.json(
      { error: "Purchase failed", detail: (error?.message || "").slice(0, 200) },
      { status: 500 }
    );
  }
}
