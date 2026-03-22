"use client";

import {
  useBuyName,
  useListedNames,
  useListing,
  useListingCount,
} from "@/hooks/useMarketplace";
import { useNameInfo } from "@/hooks/useNameService";
import { formatPathUSD, shortenAddress } from "@/lib/utils";
import { tempo } from "@/lib/wagmi";
import Link from "next/link";
import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";

export default function MarketplacePage() {
  const { count, isLoading: countLoading } = useListingCount();
  const { names, isLoading: namesLoading } = useListedNames(count);

  return (
    <div className="max-w-[800px] mx-auto py-12 md:py-20">
      <div className="mb-8 md:mb-12">
        <h1 className="font-serif text-[32px] md:text-[48px] leading-[1] tracking-tight text-primary mb-2">
          Marketplace
        </h1>
        <p className="text-sm text-tertiary">
          ·Buy and sell .tempo names·
        </p>
      </div>

      {countLoading || namesLoading ? (
        <p className="text-sm text-tertiary py-12 text-center">Loading...</p>
      ) : count === 0 ? (
        <div className="p-12 bg-white border border-border text-center">
          <p className="text-sm text-tertiary mb-4">
            No names listed for sale yet
          </p>
          <p className="text-xs text-muted">
            List your .tempo names from the{" "}
            <Link href="/account" className="text-primary hover:opacity-70">
              Account
            </Link>{" "}
            page or name profile
          </p>
        </div>
      ) : (
        <div className="space-y-[1px] bg-border">
          {names.map((name) => (
            <ListingCard key={name} name={name} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ name }: { name: string }) {
  const { seller, price, active } = useListing(name);
  const { owner, expiry } = useNameInfo(name);
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const wrongChain = chainId !== tempo.id;

  const {
    approve,
    buy,
    isApprovePending,
    isBuyPending,
    isApproveConfirmed,
    isBuyConfirmed,
    error,
  } = useBuyName(name);

  const [expanded, setExpanded] = useState(false);
  const isOwner =
    address && seller && address.toLowerCase() === seller.toLowerCase();

  if (!active) return null;

  return (
    <div className="bg-white p-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <span className="font-serif text-lg text-primary">{name}.tempo</span>
          <span className="text-xs text-tertiary ml-4">
            {seller ? shortenAddress(seller) : ""}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-serif text-lg text-primary">
            ${price ? formatPathUSD(price) : "—"}
          </span>
          <span className="text-xs text-muted">
            {expanded ? "−" : "+"}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-border-light">
          {isBuyConfirmed ? (
            <div className="text-center py-4">
              <p className="font-serif text-xl text-primary">{name}.tempo</p>
              <p className="text-sm text-tertiary mt-2">is now yours</p>
              <Link
                href={`/name/${name}`}
                className="inline-block mt-4 text-sm text-primary hover:opacity-70"
              >
                View Profile →
              </Link>
            </div>
          ) : isOwner ? (
            <p className="text-sm text-tertiary">This is your listing</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-tertiary">
                <span>Price</span>
                <span>${price ? formatPathUSD(price) : "—"} pathUSD</span>
              </div>
              <div className="flex justify-between text-sm text-tertiary">
                <span>Commission (2.5%)</span>
                <span>
                  Included in price
                </span>
              </div>

              {wrongChain ? (
                <button
                  onClick={() => switchChain({ chainId: tempo.id })}
                  className="w-full py-3 bg-primary text-white text-sm hover:opacity-80 transition-opacity"
                >
                  Switch to Tempo Network
                </button>
              ) : (
                <>
                  <button
                    onClick={() => price && approve(price)}
                    disabled={isApproveConfirmed || isApprovePending}
                    className={`w-full py-3 text-sm flex items-center justify-center gap-2 transition-all ${
                      isApproveConfirmed
                        ? "bg-bg text-tertiary border border-border"
                        : "border border-primary text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    <span className="w-5 h-5 border border-current flex items-center justify-center text-xs">
                      {isApproveConfirmed ? "✓" : "1"}
                    </span>
                    {isApprovePending
                      ? "Approving..."
                      : isApproveConfirmed
                        ? "Approved"
                        : "Approve pathUSD"}
                  </button>

                  <button
                    onClick={buy}
                    disabled={!isApproveConfirmed || isBuyPending}
                    className={`w-full py-3 text-sm flex items-center justify-center gap-2 transition-all ${
                      isApproveConfirmed
                        ? "bg-primary text-white hover:opacity-80"
                        : "bg-bg text-muted cursor-not-allowed"
                    }`}
                  >
                    <span className="w-5 h-5 border border-current flex items-center justify-center text-xs">
                      2
                    </span>
                    {isBuyPending ? "Buying..." : "Buy Name"}
                  </button>
                </>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
