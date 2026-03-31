"use client";

import { useState, useCallback } from "react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import {
  TNS_ABI,
  TNS_V2_ABI,
  PATHUSD_ABI,
  PATHUSD_ADDRESS,
  TLD,
  getContractAddress,
  isV2,
} from "@/lib/contract";
import { tempo } from "@/lib/wagmi";

function getAbi(tld: TLD) {
  return isV2(tld) ? TNS_V2_ABI : TNS_ABI;
}

export function useListingCount(tld: TLD = "tempo") {
  const { data, isLoading } = useReadContract({
    address: getContractAddress(tld),
    abi: getAbi(tld),
    functionName: "getListingCount",
    chainId: tempo.id,
  });

  return {
    count: data ? Number(data as bigint) : 0,
    isLoading,
  };
}

export function useListedNames(count: number, tld: TLD = "tempo") {
  const address = getContractAddress(tld);
  const abi = getAbi(tld);

  const contracts = Array.from({ length: count }, (_, i) => ({
    address,
    abi,
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

export function useListing(name: string, tld: TLD = "tempo") {
  const { data, isLoading, refetch } = useReadContract({
    address: getContractAddress(tld),
    abi: getAbi(tld),
    functionName: "getListing",
    args: [name],
    chainId: tempo.id,
    query: { enabled: name.length >= 3 },
  });

  // V1 returns [seller, price, active], V2 returns [seller, price, priceToken, active]
  if (isV2(tld)) {
    const result = data as [string, bigint, string, boolean] | undefined;
    return {
      seller: result?.[0],
      price: result?.[1],
      priceToken: result?.[2],
      active: result?.[3] ?? false,
      isLoading,
      refetch,
    };
  }

  const result = data as [string, bigint, boolean] | undefined;
  return {
    seller: result?.[0],
    price: result?.[1],
    priceToken: undefined,
    active: result?.[2] ?? false,
    isLoading,
    refetch,
  };
}

export function useListForSale(name: string, tld: TLD = "tempo") {
  const [error, setError] = useState<string | null>(null);
  const contractAddress = getContractAddress(tld);
  const abi = getAbi(tld);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const list = useCallback(
    (priceUsd: string, token?: `0x${string}`) => {
      setError(null);
      const priceWei = parseUnits(priceUsd, 6);

      const args = isV2(tld) && token
        ? [name, priceWei, token]
        : [name, priceWei];

      writeContract(
        {
          address: contractAddress,
          abi,
          functionName: "listForSale",
          args,
          chainId: tempo.id,
        } as any,
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, name, tld, contractAddress, abi]
  );

  return { list, isPending, isSuccess, error };
}

export function useCancelListing(name: string, tld: TLD = "tempo") {
  const [error, setError] = useState<string | null>(null);
  const contractAddress = getContractAddress(tld);
  const abi = getAbi(tld);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const cancel = useCallback(() => {
    setError(null);
    writeContract(
      {
        address: contractAddress,
        abi,
        functionName: "cancelListing",
        args: [name],
        chainId: tempo.id,
      },
      {
        onError: (err) => setError(err.message),
      }
    );
  }, [writeContract, name, contractAddress, abi]);

  return { cancel, isPending, isSuccess, error };
}

export function useBuyName(name: string, tld: TLD = "tempo") {
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "approve" | "buy">("idle");
  const contractAddress = getContractAddress(tld);
  const abi = getAbi(tld);

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
    (price: bigint, token?: `0x${string}`) => {
      setError(null);
      setStep("approve");
      const tokenAddr = token || PATHUSD_ADDRESS;
      writeApprove(
        {
          address: tokenAddr as `0x${string}`,
          abi: PATHUSD_ABI,
          functionName: "approve",
          args: [contractAddress, price],
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
    [writeApprove, contractAddress]
  );

  const buy = useCallback(() => {
    setError(null);
    setStep("buy");
    writeBuy(
      {
        address: contractAddress,
        abi,
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
  }, [writeBuy, name, contractAddress, abi]);

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
