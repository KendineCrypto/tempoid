"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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
import { getYearlyFeeDisplay } from "@/lib/utils";
import { tempo } from "@/lib/wagmi";

function getAbi(tld: TLD) {
  return isV2(tld) ? TNS_V2_ABI : TNS_ABI;
}

export function useRegister(name: string, years: number, tld: TLD = "tempo", paymentToken?: `0x${string}`) {
  const { address } = useAccount();
  const [step, setStep] = useState<"idle" | "approve" | "register" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddress(tld);
  const abi = getAbi(tld);
  // For V2, use selected token; for V1, always pathUSD
  const tokenAddress = isV2(tld) && paymentToken ? paymentToken : PATHUSD_ADDRESS;

  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const {
    writeContract: writeRegister,
    data: registerTxHash,
    isPending: isRegisterPending,
  } = useWriteContract();

  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const { isSuccess: isRegisterConfirmed } = useWaitForTransactionReceipt({
    hash: registerTxHash,
  });

  const totalFee = getYearlyFeeDisplay(name) * years;
  const feeWei = parseUnits(totalFee.toString(), 6);

  const approve = useCallback(() => {
    setError(null);
    setStep("approve");
    writeApprove(
      {
        address: tokenAddress as `0x${string}`,
        abi: PATHUSD_ABI, // ERC20 approve is the same for all tokens
        functionName: "approve",
        args: [contractAddress, feeWei],
        chainId: tempo.id,
      },
      {
        onError: (err) => {
          setError(err.message);
          setStep("idle");
        },
      }
    );
  }, [writeApprove, feeWei, tokenAddress, contractAddress]);

  const register = useCallback(() => {
    if (!address) return;
    setError(null);
    setStep("register");

    const args = isV2(tld)
      ? [name, BigInt(years), tokenAddress as `0x${string}`]
      : [name, BigInt(years)];

    writeRegister(
      {
        address: contractAddress,
        abi,
        functionName: "register",
        args,
        chainId: tempo.id,
      } as any,
      {
        onSuccess: () => {
          setStep("done");
        },
        onError: (err) => {
          setError(err.message);
          setStep("approve");
        },
      }
    );
  }, [writeRegister, name, address, years, tld, tokenAddress, contractAddress, abi]);

  return {
    step,
    approve,
    register,
    isApproving: isApprovePending,
    isRegistering: isRegisterPending,
    isApproved: isApproveConfirmed,
    isRegistered: isRegisterConfirmed,
    error,
  };
}

export function useRenew(name: string, tld: TLD = "tempo", paymentToken?: `0x${string}`) {
  const [error, setError] = useState<string | null>(null);
  const contractAddress = getContractAddress(tld);
  const abi = getAbi(tld);
  const tokenAddress = isV2(tld) && paymentToken ? paymentToken : undefined;

  const {
    writeContract,
    data: txHash,
    isPending,
  } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const renew = useCallback(
    (years: number) => {
      setError(null);
      const args = isV2(tld) && tokenAddress
        ? [name, BigInt(years), tokenAddress]
        : [name, BigInt(years)];

      writeContract(
        {
          address: contractAddress,
          abi,
          functionName: "renew",
          args,
          chainId: tempo.id,
        } as any,
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, name, tld, tokenAddress, contractAddress, abi]
  );

  return { renew, isPending, isSuccess, error };
}

export function useTransfer(name: string, tld: TLD = "tempo") {
  const [error, setError] = useState<string | null>(null);
  const contractAddress = getContractAddress(tld);
  const abi = getAbi(tld);

  const {
    writeContract,
    data: txHash,
    isPending,
  } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const transfer = useCallback(
    (newOwner: `0x${string}`) => {
      setError(null);
      writeContract(
        {
          address: contractAddress,
          abi,
          functionName: "transfer",
          args: [name, newOwner],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, name, contractAddress, abi]
  );

  return { transfer, isPending, isSuccess, error };
}

export function useSetPrimaryName(tld: TLD = "tempo") {
  const [error, setError] = useState<string | null>(null);
  const contractAddress = getContractAddress(tld);
  const abi = getAbi(tld);

  const {
    writeContract,
    data: txHash,
    isPending,
  } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const setPrimary = useCallback(
    (name: string) => {
      setError(null);
      writeContract(
        {
          address: contractAddress,
          abi,
          functionName: "setPrimaryName",
          args: [name],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, contractAddress, abi]
  );

  return { setPrimary, isPending, isSuccess, error };
}

export function useSetMetadata(name: string, tld: TLD = "tempo") {
  const [error, setError] = useState<string | null>(null);
  const contractAddress = getContractAddress(tld);
  const abi = getAbi(tld);

  const {
    writeContract,
    data: txHash,
    isPending,
  } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const setMeta = useCallback(
    (key: string, value: string) => {
      setError(null);
      writeContract(
        {
          address: contractAddress,
          abi,
          functionName: "setMetadata",
          args: [name, key, value],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, name, contractAddress, abi]
  );

  return { setMeta, isPending, isSuccess, error };
}
