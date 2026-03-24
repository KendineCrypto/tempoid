"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { useReverseLookup, usePathUSDBalance, useNamesOfOwner } from "@/hooks/useNameService";
import { shortenAddress, formatPathUSD } from "@/lib/utils";
import { TNS_ABI, TEMPO_NAME_SERVICE_ADDRESS } from "@/lib/contract";
import { tempo } from "@/lib/wagmi";
import Link from "next/link";

function useUserNames(address: string | undefined) {
  const { names: ownedNames, isLoading: namesLoading } = useNamesOfOwner(address);

  // Fetch expiry info for each owned name
  const contracts = ownedNames.map((name) => ({
    address: TEMPO_NAME_SERVICE_ADDRESS,
    abi: TNS_ABI,
    functionName: "getNameInfo" as const,
    args: [name] as const,
    chainId: tempo.id,
  }));

  const { data, isLoading: infoLoading } = useReadContracts({
    contracts,
    query: { enabled: ownedNames.length > 0 },
  });

  const verifiedNames: { name: string; expiry: number; isExpired: boolean }[] = [];
  if (data) {
    ownedNames.forEach((name, i) => {
      const result = data[i]?.result as [string, bigint, boolean, boolean] | undefined;
      if (result) {
        verifiedNames.push({
          name,
          expiry: Number(result[1]),
          isExpired: result[2],
        });
      }
    });
  }

  return { names: verifiedNames, isLoading: namesLoading || infoLoading };
}

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const { name: primaryName } = useReverseLookup(address);
  const { balance, isLoading: balanceLoading } = usePathUSDBalance(address);
  const { names, isLoading: namesLoading } = useUserNames(address);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="py-32 text-center">
        <h2 className="font-serif text-[32px] md:text-[40px] text-primary mb-4">Account</h2>
        <p className="text-sm text-tertiary">Loading...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="py-20 md:py-32 text-center">
        <h2 className="font-serif text-[32px] md:text-[40px] text-primary mb-4">Account</h2>
        <p className="text-sm text-tertiary mb-8">
          Connect your wallet to view your names
        </p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto py-12 md:py-20">
      <h1 className="font-serif text-[32px] md:text-[40px] leading-[1] tracking-tight text-primary mb-8 md:mb-12">
        Account
      </h1>

      {/* Wallet + Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-border">
        <div className="bg-white p-5 md:p-6">
          <p className="text-xs text-tertiary uppercase tracking-wider mb-2">
            Connected Wallet
          </p>
          <p className="text-sm text-primary font-sans">
            {shortenAddress(address!)}
          </p>
          <a
            href={`https://explore.tempo.xyz/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-tertiary hover:text-primary transition-colors mt-1 inline-block"
          >
            View on Explorer →
          </a>
        </div>

        <div className="bg-white p-5 md:p-6">
          <p className="text-xs text-tertiary uppercase tracking-wider mb-2">
            pathUSD Balance
          </p>
          <p className="text-lg font-serif text-primary">
            {balanceLoading
              ? "..."
              : balance !== undefined
                ? `$${formatPathUSD(balance)}`
                : "$0"}
          </p>
          <p className="text-xs text-tertiary mt-1">on Tempo Network</p>
        </div>
      </div>

      {/* Primary Name */}
      {primaryName && (
        <div className="mt-6 md:mt-8 p-5 md:p-6 bg-white border border-border">
          <p className="text-xs text-tertiary uppercase tracking-wider mb-2">
            Primary Name
          </p>
          <Link
            href={`/name/${primaryName}`}
            className="font-serif text-lg text-primary hover:opacity-70 transition-opacity"
          >
            {primaryName}.tempo →
          </Link>
        </div>
      )}

      {/* Names */}
      <div className="mt-8 md:mt-12">
        <p className="text-xs text-tertiary uppercase tracking-wider mb-6">
          My Names
        </p>

        {namesLoading ? (
          <div className="p-8 bg-white border border-border text-center">
            <p className="text-sm text-tertiary">Loading names...</p>
          </div>
        ) : names.length > 0 ? (
          <div className="space-y-[1px] bg-border">
            {names.map((n) => (
              <Link
                key={n.name}
                href={`/name/${n.name}`}
                className="block p-5 md:p-6 bg-white hover:border-primary
                           transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-serif text-lg text-primary group-hover:opacity-70 transition-opacity">
                      {n.name}.tempo
                    </span>
                    {primaryName === n.name && (
                      <span className="text-xs text-tertiary border border-border px-2 py-0.5">
                        Primary
                      </span>
                    )}
                    {n.isExpired && (
                      <span className="text-xs text-red-500 border border-red-200 px-2 py-0.5">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-tertiary">
                      expires {new Date(n.expiry * 1000).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-tertiary">
                      Manage →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 md:p-12 bg-white border border-border text-center">
            <p className="text-sm text-tertiary mb-6">
              You don&apos;t have any registered names yet
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-primary text-white text-sm
                         hover:opacity-80 transition-opacity"
            >
              Register Your First Name →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
