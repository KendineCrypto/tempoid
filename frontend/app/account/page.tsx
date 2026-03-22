"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { useReverseLookup, usePathUSDBalance } from "@/hooks/useNameService";
import { shortenAddress, formatPathUSD } from "@/lib/utils";
import Link from "next/link";

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const { name: primaryName } = useReverseLookup(address);
  const { balance, isLoading: balanceLoading } = usePathUSDBalance(address);
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

        {primaryName ? (
          <div className="space-y-[1px] bg-border">
            <Link
              href={`/name/${primaryName}`}
              className="block p-5 md:p-6 bg-white hover:border-primary
                         transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-serif text-lg text-primary group-hover:opacity-70 transition-opacity">
                    {primaryName}.tempo
                  </span>
                  <span className="text-xs text-tertiary border border-border px-2 py-0.5">
                    Primary
                  </span>
                </div>
                <span className="text-xs text-tertiary">
                  Manage →
                </span>
              </div>
            </Link>
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
