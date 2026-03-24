"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import {
  TNS_ABI,
  PATHUSD_ABI,
  TEMPO_NAME_SERVICE_ADDRESS,
  PATHUSD_ADDRESS,
} from "@/lib/contract";
import { getYearlyFeeDisplay } from "@/lib/utils";
import { tempo } from "@/lib/wagmi";

export function useRegister(name: string, years: number) {
  const { address } = useAccount();
  const [step, setStep] = useState<"idle" | "approve" | "register" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

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
        address: PATHUSD_ADDRESS,
        abi: PATHUSD_ABI,
        functionName: "approve",
        args: [TEMPO_NAME_SERVICE_ADDRESS, feeWei],
        chainId: tempo.id,
      },
      {
        onError: (err) => {
          setError(err.message);
          setStep("idle");
        },
      }
    );
  }, [writeApprove, feeWei]);

  const register = useCallback(() => {
    if (!address) return;
    setError(null);
    setStep("register");
    writeRegister(
      {
        address: TEMPO_NAME_SERVICE_ADDRESS,
        abi: TNS_ABI,
        functionName: "register",
        args: [name, BigInt(years)],
        chainId: tempo.id,
      },
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
  }, [writeRegister, name, address, years]);

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

export function useRenew(name: string) {
  const [error, setError] = useState<string | null>(null);

  const {
    writeContract,
    data: txHash,
    isPending,
  } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const renew = useCallback(
    (years: number) => {
      setError(null);
      writeContract(
        {
          address: TEMPO_NAME_SERVICE_ADDRESS,
          abi: TNS_ABI,
          functionName: "renew",
          args: [name, BigInt(years)],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, name]
  );

  return { renew, isPending, isSuccess, error };
}

export function useTransfer(name: string) {
  const [error, setError] = useState<string | null>(null);

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
          address: TEMPO_NAME_SERVICE_ADDRESS,
          abi: TNS_ABI,
          functionName: "transfer",
          args: [name, newOwner],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, name]
  );

  return { transfer, isPending, isSuccess, error };
}

export function useSetPrimaryName() {
  const [error, setError] = useState<string | null>(null);

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
          address: TEMPO_NAME_SERVICE_ADDRESS,
          abi: TNS_ABI,
          functionName: "setPrimaryName",
          args: [name],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract]
  );

  return { setPrimary, isPending, isSuccess, error };
}

export function useSetMetadata(name: string) {
  const [error, setError] = useState<string | null>(null);

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
          address: TEMPO_NAME_SERVICE_ADDRESS,
          abi: TNS_ABI,
          functionName: "setMetadata",
          args: [name, key, value],
          chainId: tempo.id,
        },
        {
          onError: (err) => setError(err.message),
        }
      );
    },
    [writeContract, name]
  );

  return { setMeta, isPending, isSuccess, error };
}
