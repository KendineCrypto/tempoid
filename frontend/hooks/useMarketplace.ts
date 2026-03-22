"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import {
  TNS_ABI,
  PATHUSD_ABI,
  TEMPO_NAME_SERVICE_ADDRESS,
  PATHUSD_ADDRESS,
} from "@/lib/contract";
import { tempo } from "@/lib/wagmi";

export function useListingCount() {
  const { data, isLoading } = useReadContract({
    address: TEMPO_NAME_SERVICE_ADDRESS,
    abi: TNS_ABI,
    functionName: "getListingCount",
    chainId: tempo.id,
  });

  return {
    count: data ? Number(data as bigint) : 0,
    isLoading,
  };
}

export function useListedNames(count: number) {
  const contracts = Array.from({ length: count }, (_, i) => ({
    address: TEMPO_NAME_SERVICE_ADDRESS,
    abi: TNS_ABI,
    functionName: "getListedNameByIndex" as const,
    args: [BigInt(i)] as const,
    chainId: tempo.id,
  }));

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: count > 0 },
  });

  const names = data
    ? data.map((d) => d.result as string).filter(Boolean)
    : [];

  return { names, isLoading };
}

export function useListing(name: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: TEMPO_NAME_SERVICE_ADDRESS,
    abi: TNS_ABI,
    functionName: "getListing",
    args: [name],
    chainId: tempo.id,
    query: { enabled: name.length >= 3 },
  });

  const result = data as [string, bigint, boolean] | undefined;

  return {
    seller: result?.[0],
    price: result?.[1],
    active: result?.[2] ?? false,
    isLoading,
    refetch,
  };
}

export function useListForSale(name: string) {
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const list = useCallback(
    (priceUsd: string) => {
      setError(null);
      const priceWei = parseUnits(priceUsd, 6);
      writeContract(
        {
          address: TEMPO_NAME_SERVICE_ADDRESS,
          abi: TNS_ABI,
          functionName: "listForSale",
          args: [name, priceWei],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, name]
  );

  return { list, isPending, isSuccess, error };
}

export function useCancelListing(name: string) {
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const cancel = useCallback(() => {
    setError(null);
    writeContract(
      {
        address: TEMPO_NAME_SERVICE_ADDRESS,
        abi: TNS_ABI,
        functionName: "cancelListing",
        args: [name],
        chainId: tempo.id,
      },
      {
        onError: (err) => setError(err.message),
      }
    );
  }, [writeContract, name]);

  return { cancel, isPending, isSuccess, error };
}

export function useBuyName(name: string) {
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "approve" | "buy">("idle");

  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const {
    writeContract: writeBuy,
    data: buyTxHash,
    isPending: isBuyPending,
  } = useWriteContract();

  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const { isSuccess: isBuyConfirmed } = useWaitForTransactionReceipt({
    hash: buyTxHash,
  });

  const approve = useCallback(
    (price: bigint) => {
      setError(null);
      setStep("approve");
      writeApprove(
        {
          address: PATHUSD_ADDRESS,
          abi: PATHUSD_ABI,
          functionName: "approve",
          args: [TEMPO_NAME_SERVICE_ADDRESS, price],
          chainId: tempo.id,
        },
        {
          onError: (err) => {
            setError(err.message);
            setStep("idle");
          },
        }
      );
    },
    [writeApprove]
  );

  const buy = useCallback(() => {
    setError(null);
    setStep("buy");
    writeBuy(
      {
        address: TEMPO_NAME_SERVICE_ADDRESS,
        abi: TNS_ABI,
        functionName: "buyName",
        args: [name],
        chainId: tempo.id,
      },
      {
        onError: (err) => {
          setError(err.message);
          setStep("approve");
        },
      }
    );
  }, [writeBuy, name]);

  return {
    approve,
    buy,
    isApprovePending,
    isBuyPending,
    isApproveConfirmed,
    isBuyConfirmed,
    error,
    step,
  };
}
