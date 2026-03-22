"use client";

import { useState, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import {
  TNS_ABI,
  PATHUSD_ABI,
  TEMPO_NAME_SERVICE_ADDRESS,
  PATHUSD_ADDRESS,
} from "@/lib/contract";
import { tempo } from "@/lib/wagmi";

export function useResolveName(name: string) {
  const cleanName = name.replace(/\.tempo$/, "").trim().toLowerCase();

  const { data, isLoading, isError } = useReadContract({
    address: TEMPO_NAME_SERVICE_ADDRESS,
    abi: TNS_ABI,
    functionName: "resolve",
    args: [cleanName],
    chainId: tempo.id,
    query: { enabled: cleanName.length >= 3 },
  });

  return {
    resolvedAddress: isError ? undefined : (data as `0x${string}` | undefined),
    isLoading,
    isError,
    cleanName,
  };
}

export function useSendPathUSD() {
  const [error, setError] = useState<string | null>(null);

  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const {
    writeContract: writeTransfer,
    data: transferTxHash,
    isPending: isTransferPending,
  } = useWriteContract();

  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const { isSuccess: isTransferConfirmed } = useWaitForTransactionReceipt({
    hash: transferTxHash,
  });

  const approve = useCallback(
    (amount: string) => {
      setError(null);
      const amountWei = parseUnits(amount, 6);
      writeApprove(
        {
          address: PATHUSD_ADDRESS,
          abi: PATHUSD_ABI,
          functionName: "approve",
          args: [PATHUSD_ADDRESS, amountWei],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeApprove]
  );

  const send = useCallback(
    (to: `0x${string}`, amount: string) => {
      setError(null);
      const amountWei = parseUnits(amount, 6);
      writeTransfer(
        {
          address: PATHUSD_ADDRESS,
          abi: [
            {
              name: "transfer",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                { name: "to", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ type: "bool" }],
            },
          ],
          functionName: "transfer",
          args: [to, amountWei],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeTransfer]
  );

  return {
    approve,
    send,
    isApprovePending,
    isTransferPending,
    isApproveConfirmed,
    isTransferConfirmed,
    error,
  };
}
