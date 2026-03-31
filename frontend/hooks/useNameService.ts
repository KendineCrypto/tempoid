"use client";

import { useReadContract, useReadContracts } from "wagmi";
import {
  TNS_ABI,
  TNS_V2_ABI,
  TEMPO_NAME_SERVICE_ADDRESS,
  PATHUSD_ABI,
  PATHUSD_ADDRESS,
  TLD,
  getContractAddress,
  isV2,
} from "@/lib/contract";
import { tempo } from "@/lib/wagmi";

function getAbi(tld: TLD = "tempo") {
  return isV2(tld) ? TNS_V2_ABI : TNS_ABI;
}

function getAddress(tld: TLD = "tempo") {
  return getContractAddress(tld);
}

export function useNameAvailability(name: string, tld: TLD = "tempo") {
  const { data, isLoading, isError } = useReadContract({
    address: getAddress(tld),
    abi: getAbi(tld),
    functionName: "isNameAvailable",
    args: [name],
    chainId: tempo.id,
    query: { enabled: name.length >= 3 },
  });

  return {
    isAvailable: isError ? undefined : (data as boolean | undefined),
    isLoading,
    isError,
  };
}

export function useNameInfo(name: string, tld: TLD = "tempo") {
  const { data, isLoading, refetch } = useReadContract({
    address: getAddress(tld),
    abi: getAbi(tld),
    functionName: "getNameInfo",
    args: [name],
    chainId: tempo.id,
    query: { enabled: name.length >= 3 },
  });

  const result = data as
    | [string, bigint, boolean, boolean]
    | undefined;

  return {
    owner: result?.[0],
    expiry: result?.[1] ? Number(result[1]) : undefined,
    isExpired: result?.[2],
    isAvailable: result?.[3],
    isLoading,
    refetch,
  };
}

export function useResolve(name: string, tld: TLD = "tempo") {
  const { data, isLoading, error } = useReadContract({
    address: getAddress(tld),
    abi: getAbi(tld),
    functionName: "resolve",
    args: [name],
    chainId: tempo.id,
    query: { enabled: name.length >= 3 },
  });

  return {
    address: data as string | undefined,
    isLoading,
    error,
  };
}

export function useReverseLookup(address: string | undefined, tld: TLD = "tempo") {
  const { data, isLoading } = useReadContract({
    address: getAddress(tld),
    abi: getAbi(tld),
    functionName: "reverseLookup",
    args: [address as `0x${string}`],
    chainId: tempo.id,
    query: { enabled: !!address },
  });

  return {
    name: data as string | undefined,
    isLoading,
  };
}

export function useNameMetadata(name: string, keys: string[], tld: TLD = "tempo") {
  const address = getAddress(tld);
  const abi = getAbi(tld);

  const contracts = keys.map((key) => ({
    address,
    abi,
    functionName: "getMetadata" as const,
    args: [name, key] as const,
    chainId: tempo.id,
  }));

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: name.length >= 3 },
  });

  const metadata: Record<string, string> = {};
  if (data) {
    keys.forEach((key, i) => {
      const val = data[i]?.result as string | undefined;
      if (val) metadata[key] = val;
    });
  }

  return { metadata, isLoading };
}

export function usePathUSDBalance(address: string | undefined) {
  const { data, isLoading } = useReadContract({
    address: PATHUSD_ADDRESS,
    abi: PATHUSD_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    chainId: tempo.id,
    query: { enabled: !!address },
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
  };
}

export function useNamesOfOwner(address: string | undefined, tld: TLD = "tempo") {
  const { data, isLoading, refetch } = useReadContract({
    address: getAddress(tld),
    abi: getAbi(tld),
    functionName: "getNamesOfOwner",
    args: [address as `0x${string}`],
    chainId: tempo.id,
    query: { enabled: !!address },
  });

  return {
    names: (data as string[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}

export function useRegistrationFee(name: string, years: number, tld: TLD = "tempo") {
  const { data, isLoading } = useReadContract({
    address: getAddress(tld),
    abi: getAbi(tld),
    functionName: "getRegistrationFee",
    args: [name, BigInt(years)],
    chainId: tempo.id,
    query: { enabled: name.length >= 3 },
  });

  return {
    fee: data as bigint | undefined,
    isLoading,
  };
}
